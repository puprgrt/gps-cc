const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { downloadMediaMessage, normalizeMessageContent, getContentType } = require('@whiskeysockets/baileys');
const supabaseService = require('../services/supabaseService');
const localDb = require('../services/localDbService'); // Keep for logs if needed
const aiOrchestrator = require('./AIOrchestrator');
const complaintService = require('../services/complaintService');

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.ai = null;
  }

  getAiInstance() {
    if (!this.ai && process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.ai;
  }

  async sendPuriReply(senderJid, replyText, isGreeting = false) {
    const logoPath = path.resolve(__dirname, '../../public/puri.png');
    if (isGreeting && fs.existsSync(logoPath)) {
      try {
        await this.client.sendMessageReliable(senderJid, {
          image: fs.readFileSync(logoPath),
          caption: replyText,
          mimetype: 'image/png'
        });
        return;
      } catch (err) {
        console.warn(`[PURI Bot] Gagal mengirim media gambar logo puri.png: ${err.message}. Mengirim sebagai teks biasa...`);
      }
    }
    await this.client.sendMessageReliable(senderJid, { text: replyText });
  }

  formatPuriReply(text) {
    if (!text) return '';
    let cleanText = text.trim();
    
    // Fix Markdown Links: [text](url) -> text (url) or just url
    cleanText = cleanText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
      if (linkText === url) return url;
      return `${linkText} (${url})`;
    });

    // Fix Markdown Bold: **text** -> *text* for WhatsApp
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '*$1*');
    
    if (cleanText.startsWith('🤖') || cleanText.startsWith('🏛️') || cleanText.startsWith('*PURI') || cleanText.startsWith('PURI:')) {
      return cleanText;
    }
    return `🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\n${cleanText}`;
  }

  async handleIncoming(messages) {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      try {
        const senderJid = msg.key.remoteJid;
        // Ignore WhatsApp Status / Broadcast / Newsletter / Channel updates
        if (!senderJid || senderJid === 'status@broadcast' || senderJid.includes('@broadcast') || senderJid.includes('@newsletter') || senderJid.includes('@g.us')) {
          continue;
        }

        const pushName = msg.pushName || 'Warga PUPR';
        let rawDigits = senderJid.split('@')[0].replace(/\D/g, '');
        if (rawDigits.startsWith('0')) {
          rawDigits = '62' + rawDigits.substring(1);
        } else if (rawDigits.startsWith('8')) {
          rawDigits = '62' + rawDigits;
        }
        const cleanPhone = rawDigits || senderJid.split('@')[0];
        
        const { text, type, metadata } = this.extractMessageContent(msg);

        let mediaBase64 = null;
        let mediaBuffer = null;
        let enrichedMetadata = { ...(metadata || {}) };
        if (type === 'document' || type === 'image') {
          try {
            try {
              mediaBuffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                { 
                  logger: this.client.waSocket?.logger,
                  reuploadRequest: this.client.waSocket?.updateMediaMessage ? this.client.waSocket.updateMediaMessage.bind(this.client.waSocket) : undefined
                }
              );
            } catch (innerErr) {
              mediaBuffer = await downloadMediaMessage(msg, 'buffer');
            }

            if (mediaBuffer) {
              mediaBase64 = mediaBuffer.toString('base64');
              enrichedMetadata.size = mediaBuffer.length;
              enrichedMetadata.base64 = mediaBase64;
              const mime = enrichedMetadata.mimetype || (type === 'image' ? 'image/jpeg' : 'application/pdf');
              try {
                const uploaded = await supabaseService.uploadWhatsAppMedia({
                  buffer: mediaBuffer,
                  conversationId: `conv-${senderJid}`,
                  messageId: msg.key.id,
                  mimetype: mime,
                  type,
                });
                enrichedMetadata.storagePath = uploaded.storagePath;
                enrichedMetadata.storageBucket = uploaded.bucket;
                enrichedMetadata.fileName = enrichedMetadata.fileName || `Lampiran_${type === 'image' ? 'Foto' : 'Dokumen'}.${type === 'image' ? 'jpg' : 'pdf'}`;
              } catch (storageErr) {
                console.error('[MEDIA_STORAGE_ERROR] Gagal menyimpan lampiran ke Supabase Storage:', storageErr.message);
                this.client.addLog('MEDIA_STORAGE_ERROR', `Gagal menyimpan lampiran privat: ${storageErr.message}`);
                enrichedMetadata.storageError = true;
              }

              this.client.addLog('MEDIA_DOWNLOAD', `Berhasil mengunduh lampiran ${type} (${(mediaBuffer.length / 1024).toFixed(1)} KB) dari ${pushName}`);
            }
          } catch (downloadErr) {
            this.client.addLog('MEDIA_ERROR', `Gagal mengunduh media dari ${pushName}: ${downloadErr.message}`);
          }
        }

        const inboundData = {
          id: msg.key.id,
          sender: 'user',
          text,
          type,
          metadata: enrichedMetadata,
          timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
          status: 'read',
        };

        // Add to cache
        this.client.inboundMessagesCache.unshift({ jid: senderJid, pushName, ...inboundData });
        if (this.client.inboundMessagesCache.length > 200) this.client.inboundMessagesCache.pop();

        this.client.addLog('INBOUND_MESSAGE', `Pesan masuk dari ${pushName || senderJid} [${type}]: "${text.slice(0, 50)}..."`);
        
        // Save to Supabase in non-blocking fashion
        supabaseService.saveMessage(`conv-${senderJid}`, inboundData, { name: pushName, phoneNumber: cleanPhone }).catch(err => {
          console.warn('[MessageHandler] Non-blocking save inbound error:', err.message);
        });
        
        // Fetch dynamic Bot Settings, Menu Flows, & Keyword Rules with fallback
        let botSettings = { is_active: true, is_menu_active: true, is_keyword_active: true, model: 'gemini-2.0-flash', min_text_length: 2 };
        let menuFlows = [];
        let keywordRules = [];

        try {
          const [sRes, mRes, kRes] = await Promise.allSettled([
            supabaseService.getBotSettings(),
            supabaseService.getBotMenuFlows(),
            supabaseService.getBotKeywords()
          ]);
          if (sRes.status === 'fulfilled' && sRes.value) botSettings = sRes.value;
          if (mRes.status === 'fulfilled' && mRes.value) menuFlows = mRes.value;
          if (kRes.status === 'fulfilled' && kRes.value) keywordRules = kRes.value;
        } catch (settingsFetchErr) {
          console.warn('[MessageHandler] Error loading dynamic settings, using resilient defaults:', settingsFetchErr.message);
        }

        let handledByBot = false;
        const cleanInput = text.trim().toLowerCase();

        // Priority -1: Jawaban & Bukti Penanganan Pengaduan oleh Staf PUPR (via Chat / Foto WhatsApp)
        if (!handledByBot) {
          const isStaffResolutionHandled = await this.tryHandleStaffComplaintResolution(
            senderJid,
            text,
            pushName,
            cleanPhone,
            type,
            mediaBase64,
            enrichedMetadata,
            mediaBuffer
          );
          if (isStaffResolutionHandled) {
            handledByBot = true;
          }
        }

        // Priority 0: Cek Status Permohonan / Tiket
        if (!handledByBot && type === 'text') {
          const isStatusHandled = await this.tryHandleStatusCheck(senderJid, text, pushName, cleanPhone);
          if (isStatusHandled) {
            handledByBot = true;
          }
        }

        // Priority 0.5: Human Operator Escalation Request
        if (!handledByBot && type === 'text') {
          const isEscalateHandled = await this.tryHandleHumanEscalation(senderJid, text, pushName, cleanPhone);
          if (isEscalateHandled) {
            handledByBot = true;
          }
        }

        // Priority 1: Interactive Menu Key (Check if is_menu_active is enabled)
        const isMenuEnabled = botSettings.is_menu_active ?? true;
        if (isMenuEnabled && type === 'text' && menuFlows.length > 0) {
          const matchedFlow = menuFlows.find(f => 
            f.menu_key.toLowerCase() === cleanInput || 
            (cleanInput === '0' && f.menu_key.toLowerCase() === 'menu') ||
            (cleanInput === 'bantuan' && f.menu_key.toLowerCase() === 'menu') ||
            (cleanInput === 'help' && f.menu_key.toLowerCase() === 'menu')
          );

          if (matchedFlow) {
            handledByBot = true;
            const replyText = this.formatPuriReply(matchedFlow.reply_text);
            const botMsgObj = {
              id: `msg-menu-${Date.now()}`,
              sender: 'bot',
              senderName: 'PURI',
              text: replyText,
              timestamp: new Date().toISOString(),
              status: 'sent',
              type: 'text'
            };

            await this.sendPuriReply(senderJid, replyText, matchedFlow.menu_key.toLowerCase() === 'menu');
            supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone }).catch(() => {});
            this.client.addLog('MENU_REPLY', `Respon Menu Interaktif [${matchedFlow.menu_key}] dikirim ke ${pushName}`);
          }
        }

        // Priority 2: Keyword Reply Rules (Check if is_keyword_active is enabled)
        const isKeywordEnabled = botSettings.is_keyword_active ?? true;
        if (!handledByBot && isKeywordEnabled && type === 'text' && keywordRules.length > 0) {
          const matchedKeyword = keywordRules.find(k => {
            const kw = k.keyword.toLowerCase();
            if (k.match_type === 'EXACT') return cleanInput === kw;
            if (k.match_type === 'STARTS_WITH') return cleanInput.startsWith(kw);
            return cleanInput.includes(kw); // CONTAINS (default)
          });

          if (matchedKeyword) {
            handledByBot = true;
            const replyText = this.formatPuriReply(matchedKeyword.reply_text);
            const botMsgObj = {
              id: `msg-kw-${Date.now()}`,
              sender: 'bot',
              senderName: 'PURI',
              text: replyText,
              timestamp: new Date().toISOString(),
              status: 'sent',
              type: 'text'
            };

            await this.sendPuriReply(senderJid, replyText, false);
            supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone }).catch(() => {});
            this.client.addLog('KEYWORD_REPLY', `Respon Kata Kunci [${matchedKeyword.keyword}] dikirim ke ${pushName}`);
          }
        }

        // Priority 3: Gemini AI Fallback (Check if is_active is enabled)
        const isAiEnabled = botSettings.is_active ?? true;
        const isValidText = text && text.length >= (botSettings.min_text_length || 2);
        const isMediaMessage = (type === 'document' || type === 'image');
        if (!handledByBot && isAiEnabled && (isValidText || isMediaMessage)) {
          const mediaPayload = (isMediaMessage && mediaBase64) ? {
            base64: mediaBase64,
            mimetype: enrichedMetadata?.mimetype || (type === 'image' ? 'image/jpeg' : 'application/pdf'),
            fileName: enrichedMetadata?.fileName || `lampiran.${type === 'image' ? 'jpg' : 'pdf'}`
          } : null;
          await this.handleGeminiAiReply(senderJid, text || `[Lampiran ${type}]`, pushName, botSettings, mediaPayload);
        }
      } catch (msgError) {
        console.error('[MessageHandler] Uncaught error processing inbound message:', msgError);
        this.client.addLog('INBOUND_PROCESSING_ERROR', `Error memproses pesan: ${msgError.message}`, 'error');
      }
    }
  }

  extractMessageContent(msg) {
    let rawMessage = msg.message || {};
    if (rawMessage.messageContextInfo && rawMessage.messageContextInfo.message) {
      rawMessage = rawMessage.messageContextInfo.message;
    }
    const m = normalizeMessageContent(rawMessage) || rawMessage;
    const contentType = getContentType(m) || '';

    const imageMsg = m.imageMessage || m.viewOnceMessageV2Extension?.message?.imageMessage;
    if (imageMsg || contentType === 'imageMessage') {
      const img = imageMsg || m[contentType];
      return { 
        text: img?.caption || img?.text || '[Gambar]', 
        type: 'image', 
        metadata: { mimetype: img?.mimetype || 'image/jpeg', fileName: img?.fileName || 'Foto_Laporan.jpg' } 
      };
    }

    const docMsg = m.documentMessage || m.documentWithCaptionMessage?.message?.documentMessage || m.viewOnceMessageV2Extension?.message?.documentMessage;
    if (docMsg || contentType === 'documentMessage' || contentType === 'documentWithCaptionMessage') {
      const doc = docMsg || m.documentMessage || m[contentType];
      return { 
        text: doc?.caption || doc?.fileName || '[Dokumen]', 
        type: 'document', 
        metadata: { fileName: doc?.fileName || 'Lampiran_Dokumen.pdf', mimetype: doc?.mimetype || 'application/pdf' } 
      };
    }

    const vidMsg = m.videoMessage;
    if (vidMsg || contentType === 'videoMessage') {
      const vid = vidMsg || m[contentType];
      return { 
        text: vid?.caption || '[Video]', 
        type: 'video', 
        metadata: { mimetype: vid?.mimetype || 'video/mp4', seconds: vid?.seconds } 
      };
    }

    const audioMsg = m.audioMessage;
    if (audioMsg || contentType === 'audioMessage') {
      const aud = audioMsg || m[contentType];
      return { 
        text: '[Pesan Suara / Audio]', 
        type: 'audio', 
        metadata: { ptt: aud?.ptt, seconds: aud?.seconds } 
      };
    }

    if (m.locationMessage) {
      return { 
        text: '[Berbagi Lokasi]', 
        type: 'location', 
        metadata: { degreesLatitude: m.locationMessage.degreesLatitude, degreesLongitude: m.locationMessage.degreesLongitude } 
      };
    }

    if (m.contactMessage || m.contactsArrayMessage) {
      return { text: '[Kontak]', type: 'contact', metadata: null };
    }

    if (m.pollCreationMessage) {
      return { text: '[Polling] ' + m.pollCreationMessage.name, type: 'poll', metadata: null };
    }

    const textMsg = m.conversation || m.extendedTextMessage?.text || m.text || '';
    if (textMsg) {
      return { 
        text: textMsg, 
        type: 'text', 
        metadata: null 
      };
    }

    return { text: '[Pesan Tipe Lain]', type: 'unknown', metadata: null };
  }

  async handleGeminiAiReply(senderJid, messageText, pushName, botSettings = {}, mediaPayload = null) {
    try {
      const cleanPhone = '+' + senderJid.split('@')[0];
      const convId = `conv-${senderJid}`;

      // Fetch 10 previous messages for context
      let conversationHistory = await supabaseService.getConversationHistory(convId, 10);
      
      // Remove the current message from history to prevent AI provider crash on duplicate user roles
      if (conversationHistory && conversationHistory.length > 0) {
        const lastMsg = conversationHistory[conversationHistory.length - 1];
        if (lastMsg.sender_type === 'user' && lastMsg.text === messageText) {
          conversationHistory.pop();
        }
      }

      // Call PURI Multi-Modal AI Orchestrator 2026 (Free Tier / Local Fallback + 6-Tier Routing)
      const orchestratorResult = await aiOrchestrator.processMessage({
        conversationId: convId,
        senderName: pushName,
        userText: messageText,
        mediaPayload: mediaPayload || undefined,
        preferredModel: botSettings.model || 'auto',
        customSystemPrompt: botSettings.system_prompt || undefined,
        conversationHistory: conversationHistory,
      });

      const rawReply = orchestratorResult.text;
      
      if (rawReply) {
        const replyText = this.formatPuriReply(rawReply);
        
        // Prepare Bot message object including 6-Tier PURI Routing metadata
        const botMsgObj = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          senderName: 'PURI',
          text: replyText,
          timestamp: new Date().toISOString(),
          status: 'sent',
          type: 'text',
          metadata: {
            aiOrchestrator: {
              providerUsed: orchestratorResult.providerUsed,
              modelName: orchestratorResult.modelName,
              isFromCache: orchestratorResult.isFromCache,
              confidenceScore: orchestratorResult.confidenceScore,
              fallbackHistory: orchestratorResult.fallbackHistory,
              executionTimeMs: orchestratorResult.executionTimeMs,
              routingDecision: orchestratorResult.routingDecision,
            },
          },
        };

        await this.sendPuriReply(senderJid, replyText, false);
        await supabaseService.saveMessage(convId, botMsgObj, { name: pushName, phoneNumber: cleanPhone });

        // --- Otomatis Tangkap Ringkasan Laporan Pengaduan & Catat Tiket Pengaduan ---
        const complaintTicket = await complaintService.handleAutoIngest(
          replyText,
          messageText,
          { name: pushName, phoneNumber: cleanPhone, senderJid, conversationId: convId },
          orchestratorResult.routingDecision
        );

        if (complaintTicket) {
          this.client.addLog(
            'COMPLAINT_REGISTERED',
            `Pengaduan resmi [${complaintTicket.nomorTiket}] (${complaintTicket.prioritas}) tercatat untuk ${pushName}: ${complaintTicket.judul.slice(0, 60)}`
          );
        }

        // Update conversation status & 6-Tier PURI Routing metadata
        const shouldEscalate = 
          complaintTicket !== null ||
          orchestratorResult.routingDecision?.isEmergency === true ||
          (orchestratorResult.confidenceScore && orchestratorResult.confidenceScore < 85) ||
          orchestratorResult.routingDecision?.intent === 'PENGADUAN';

        await supabaseService.updateConversationStatus(
          convId,
          shouldEscalate ? 'pending' : 'bot_handling',
          {
            category: complaintTicket ? 'PENGADUAN' : 'UMUM',
            bidang: complaintTicket ? complaintTicket.bidang : (orchestratorResult.routingDecision?.primaryBidang || 'SEKRETARIAT'),
            prioritas: complaintTicket ? complaintTicket.prioritas : (orchestratorResult.routingDecision?.prioritas || 'NORMAL'),
            layanan: complaintTicket ? 'Pengaduan Masyarakat' : 'Informasi Umum',
            assigned_operator: orchestratorResult.routingDecision?.assignedOperatorId || 'OP-SEKRETARIAT-01',
            smart_labels: complaintTicket 
              ? ['Pengaduan', complaintTicket.kategori, complaintTicket.bidang] 
              : (orchestratorResult.routingDecision?.smartLabels || ['Informasi'])
          }
        );

        // Structured logging for AI Cost & Performance Dashboard
        const logTag = orchestratorResult.isFromCache
          ? 'AI_CACHE_HIT'
          : `AI_${orchestratorResult.providerUsed}_REPLY`;
        const logMsg = `Respon [${orchestratorResult.providerUsed} - ${orchestratorResult.modelName}] dikirim ke ${pushName} (${orchestratorResult.executionTimeMs}ms, Conf: ${orchestratorResult.confidenceScore}%)`;
        this.client.addLog(logTag, logMsg);
        
        console.log(`[PURI_ORCHESTRATOR] ${logMsg} | Routing Bidang: ${orchestratorResult.routingDecision?.primaryBidang}`);
        
        // --- SPMS Integration: Catch SURVEY_SUBMISSION ---
        if (orchestratorResult.routingDecision?.intent === 'SURVEY_SUBMISSION') {
          console.log(`[SPMS] Menangkap submission survei dari ${pushName}`);
          
          // Simple extraction logic: extract first number 1-10 as NPS, determine sentiment
          let npsScore = 8; // default
          const scoreMatch = messageText.match(/\b([1-9]|10)\b/);
          if (scoreMatch) {
             npsScore = parseInt(scoreMatch[1], 10);
          }
          
          let sentimen = 'NETRAL';
          if (npsScore >= 9) sentimen = 'POSITIF';
          else if (npsScore <= 6) sentimen = 'NEGATIF';

          // Simulate scoring dimensions based on overall score
          const baseDim = (npsScore / 10) * 5;
          const dimensions = {
            kemudahan_informasi: Math.min(5, Math.max(1, Math.round(baseDim))),
            kecepatan_pelayanan: Math.min(5, Math.max(1, Math.round(baseDim))),
            keramahan_petugas: Math.min(5, Math.max(1, Math.round(baseDim))),
            kepuasan_keseluruhan: Math.min(5, Math.max(1, Math.round(baseDim)))
          };

          await supabaseService.saveSurveyResponse({
            name: pushName,
            phoneNumber: cleanPhone,
            layanan: orchestratorResult.routingDecision.layanan || 'INFORMASI',
            channel: 'WHATSAPP',
            npsScore,
            sentimen,
            comment: messageText,
            dimensions,
            ticketId: orchestratorResult.routingDecision.ticketId
          });
        }

        // --- Auto-Forward Permohonan Baru / Konsultasi ke WhatsApp Bidang Terkait ---
        if (!complaintTicket && (orchestratorResult.routingDecision?.intent === 'PERMOHONAN_BARU' || orchestratorResult.routingDecision?.intent === 'KONSULTASI')) {
          try {
            const bidangForwardingService = require('../services/bidangForwardingService');
            const targetBidang = orchestratorResult.routingDecision.primaryBidang || 'SEKRETARIAT';
            const forwardSettings = await bidangForwardingService.getSettings();
            const contact = forwardSettings.contacts ? forwardSettings.contacts[targetBidang] : null;

            if (forwardSettings.isEnabled && contact && contact.isActive && contact.autoForwardPermohonan) {
              console.log(`[MessageHandler] 🚀 Mem-forward otomatis permohonan ke WA ${contact.namaBidang} (${contact.nomorWa})`);
              bidangForwardingService.dispatchForward({
                type: 'PERMOHONAN',
                bidang: targetBidang,
                ticketNumber: orchestratorResult.routingDecision.ticketId || `REQ-${Date.now().toString().slice(-6)}`,
                pelaporName: pushName,
                pelaporPhone: cleanPhone,
                lokasi: 'Kabupaten Garut',
                layanan: orchestratorResult.routingDecision.layanan || 'Layanan Publik PUPR',
                judul: `Permohonan ${orchestratorResult.routingDecision.layanan || 'Teknis PUPR'}`,
                deskripsi: messageText,
                prioritas: orchestratorResult.routingDecision.prioritas || 'NORMAL',
                catatanDisposisi: `Diteruskan otomatis oleh AI PURI (Intent: ${orchestratorResult.routingDecision.intent}).`,
                dispatchedBy: 'AI PURI Auto-Forward Engine'
              }, this.client).catch(e => console.error('[MessageHandler] Gagal auto-forward permohonan:', e.message));
            }
          } catch (fwdErr) {
            console.warn('[MessageHandler] Warning auto-forward permohonan:', fwdErr.message);
          }
        }
        
        return true;
      }
    } catch (error) {
      console.error('[MessageHandler] Gagal mengirim balasan PURI AI Orchestrator:', error.message);
      this.client.addLog('AI_ORCHESTRATOR_ERROR', `Gagal merespons AI: ${error.message}`, 'error');
      return false;
    }
  }

  async tryHandleStatusCheck(senderJid, text, pushName, cleanPhone) {
    // Delegated to AIOrchestrator and SpreadsheetService for smart contextual responses.
    return false;
  }

  async tryHandleHumanEscalation(senderJid, text, pushName, cleanPhone) {
    if (!text) return false;
    const lower = text.trim().toLowerCase();
    const escalateKeywords = ['operator', 'admin', 'petugas', 'staf', 'manusia', 'cs', 'bantuan langsung', 'hubungi petugas'];
    const isEscalating = escalateKeywords.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.includes(' ' + kw));

    if (isEscalating) {
      const replyText = `🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\n🙏 *PENGALIHAN KE OPERATOR MANUSIA*\n\nPesan Anda telah kami teruskan ke *Operator Bidang Pelayanan PUPR Garut*. Petugas kami akan segera merespons obrolan ini pada jam kerja operasional (Senin - Jumat, 08:00 - 15:30 WIB).\n\nTerima kasih atas kesabaran Anda!`;

      const botMsgObj = {
        id: `msg-esc-${Date.now()}`,
        sender: 'bot',
        senderName: 'PURI',
        text: replyText,
        timestamp: new Date().toISOString(),
        status: 'sent',
        type: 'text'
      };

      await this.sendPuriReply(senderJid, replyText, false);
      await supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone });
      await supabaseService.updateConversationStatus(`conv-${senderJid}`, 'pending', {
        prioritas: 'TINGGI',
        smart_labels: ['Eskalasi Operator', 'Bantuan Langsung'],
        assigned_operator: 'OP-SEKRETARIAT-01 (Online)'
      });
      this.client.addLog('ESCALATION_TRIGGERED', `Warga ${pushName} meminta terhubung dengan Operator Manusia`);
      return true;
    }
    return false;
  }

  /**
   * Flow Staf / TRC PUPR Menjawab Laporan Pengaduan & Melampirkan Bukti Penanganan via WA Bot
   * Format: JAWAB #TKT-xxxx [penjelasan], RESPON #TKT-xxxx, atau kirim FOTO bukti dengan caption nomor tiket
   */
  async tryHandleStaffComplaintResolution(senderJid, text, pushName, cleanPhone, type, mediaBase64, enrichedMetadata, mediaBuffer) {
    if (!text && type !== 'image' && type !== 'document') return false;

    const rawText = String(text || '').trim();
    
    // Pola nomor tiket pengaduan Garut: TKT-..., REG-..., PURI-...
    // Contoh: #TKT-PUPR-2026-0001, TKT-2026-0001, TKT-PUPR-0001, PURI-2024-0514
    const ticketRegex = /#?\b((?:TKT|REG|PURI)[-_A-Za-z0-9]+)\b/i;
    const match = rawText.match(ticketRegex);
    if (!match) return false;

    const candidateTicket = match[1];
    const ticket = complaintService.findComplaintByAnyNumber(candidateTicket);
    if (!ticket) return false;

    // Cek apakah pesan ini adalah jawaban / tindak lanjut atau sekadar tanya status
    const isExplicitCommand = /^(?:JAWAB|RESPON|SELESAI|SELESAIKAN|TINDAK\s*LANJUT|BUKTI|UPDATE|LAPORAN\s*LAPANGAN|HASIL|PENANGANAN)\b/i.test(rawText);
    const hasMediaProof = (type === 'image' || type === 'document') && mediaBuffer;
    const hasActionWords = /(?:telah|sudah|selesai|rampung|ditangani|diperbaiki|dibersihkan|pengaspalan|penambalan|normal kembali|alat berat|hotmix|drainase)/i.test(rawText);
    
    // Jangan tangkap jika hanya bertanya "cek status", "status tiket", "lacak", dsb.
    const isJustAskingStatus = /^(?:cek|lacak|status|info|tanya|bagaimana)\b/i.test(rawText) && !isExplicitCommand && !hasMediaProof;
    if (isJustAskingStatus) return false;

    // Jika memenuhi salah satu kriteria tindak lanjut:
    if (isExplicitCommand || hasMediaProof || hasActionWords || rawText.length > 25) {
      // Bersihkan teks jawaban dari prefix perintah dan nomor tiket
      let cleanJawaban = rawText
        .replace(/^(?:JAWAB|RESPON|SELESAI|SELESAIKAN|TINDAK\s*LANJUT|BUKTI|UPDATE|LAPORAN\s*LAPANGAN|PENANGANAN)\s*[:#-]?\s*/i, '')
        .replace(new RegExp(`#?` + candidateTicket.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + `\\s*[:#-]?\\s*`, 'i'), '')
        .trim();

      if (!cleanJawaban) {
        cleanJawaban = hasMediaProof 
          ? 'Telah dilakukan penanganan dan perbaikan di lokasi pengaduan (bukti foto terlampir).'
          : 'Laporan pengaduan telah ditindaklanjuti dan diselesaikan oleh tim lapangan.';
      }

      // Simpan file bukti fisik ke direktori public Next.js agar bisa diakses langsung di dashboard
      let mediaUrl = '';
      if (mediaBuffer) {
        try {
          const uploadDir = path.resolve(process.cwd(), 'public/uploads/complaints');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const ext = type === 'image' 
            ? (enrichedMetadata?.mimetype === 'image/png' ? 'png' : 'jpg') 
            : 'pdf';
          const fileName = `bukti-${ticket.nomorTiket.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${ext}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, mediaBuffer);
          mediaUrl = `/uploads/complaints/${fileName}`;
        } catch (fsErr) {
          console.warn('[MessageHandler] Gagal menyimpan file bukti lokal:', fsErr.message);
        }
      }

      // 1. Simpan tindak lanjut ke Complaint Service
      complaintService.recordStaffResolution(ticket.nomorTiket, {
        jawaban: cleanJawaban,
        staffName: pushName || 'Staf / TRC Lapangan PUPR',
        staffPhone: cleanPhone,
        media: mediaBuffer ? {
          type,
          url: mediaUrl,
          fileName: enrichedMetadata?.fileName || `Bukti_Penanganan_${ticket.nomorTiket}.${type === 'image' ? 'jpg' : 'pdf'}`,
          mimetype: enrichedMetadata?.mimetype || (type === 'image' ? 'image/jpeg' : 'application/pdf'),
          size: mediaBuffer.length,
          base64: mediaBase64
        } : null,
        status: 'SELESAI',
        channel: 'WHATSAPP_BOT'
      });

      // 2. Kirim Notifikasi Resmi & Bukti ke WhatsApp Warga Pelapor
      if (ticket.nomorKontak) {
        let cleanCitizenPhone = ticket.nomorKontak.replace(/\D/g, '');
        if (cleanCitizenPhone.startsWith('0')) cleanCitizenPhone = '62' + cleanCitizenPhone.substring(1);
        else if (cleanCitizenPhone.startsWith('8')) cleanCitizenPhone = '62' + cleanCitizenPhone;
        const citizenJid = cleanCitizenPhone + '@s.whatsapp.net';

        const citizenMsg = 
          `🏛️ *DINAS PEKERJAAN UMUM & PENATAAN RUANG KAB. GARUT*\n` +
          `────────────────────────\n` +
          `Yth. Bapak/Ibu *${ticket.pelapor}*,\n\n` +
          `Laporan Pengaduan Anda dengan No. Tiket *${ticket.nomorTiket}* perihal:\n` +
          `"_${ticket.judul}_" (Lokasi: ${ticket.lokasi})\n\n` +
          `Telah resmi dinyatakan *SELESAI DITINDAKLANJUTI* oleh tim teknis lapangan Dinas PUPR Kabupaten Garut.\n\n` +
          `📋 *Keterangan Hasil Penanganan:*\n` +
          `"${cleanJawaban}"\n\n` +
          `👷 *Petugas / Satgas Lapangan:* ${pushName} (${ticket.bidangLabel || ticket.bidang})\n` +
          `⏱️ *Waktu Selesai:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n` +
          `────────────────────────\n` +
          `${mediaBuffer ? '📸 _Foto bukti fisik penyelesaian pekerjaan terlampir berikut ini._\n\n' : ''}` +
          `Terima kasih atas partisipasi aktif Bapak/Ibu dalam mengawal infrastruktur Kabupaten Garut. 🙏`;

        try {
          await this.client.sendMessageReliable(citizenJid, { text: citizenMsg });
          if (type === 'image' && mediaBuffer) {
            await this.client.sendMessageReliable(citizenJid, {
              image: mediaBuffer,
              caption: `📸 *Bukti Penyelesaian Lapangan Tiket #${ticket.nomorTiket}*`
            });
          }
        } catch (citizenSendErr) {
          console.warn('[MessageHandler] Gagal mengirim notifikasi ke warga:', citizenSendErr.message);
        }
      }

      // 3. Kirim Konfirmasi Balik ke Staf PUPR yang Menjawab
      const staffReply = 
        `✅ *TINDAK LANJUT PENGADUAN BERHASIL DICATAT*\n` +
        `────────────────────────\n` +
        `📋 *Nomor Tiket:* ${ticket.nomorTiket}\n` +
        `📍 *Lokasi:* ${ticket.lokasi} (${ticket.kecamatan || 'Garut'})\n` +
        `👤 *Warga Pelapor:* ${ticket.pelapor} (${ticket.nomorKontak})\n` +
        `⚡ *Status Tiket:* *SELESAI (RESOLVED)*\n\n` +
        `📝 *Keterangan Jawaban:*\n"${cleanJawaban}"\n\n` +
        `📸 *Lampiran Bukti:* ${mediaBuffer ? 'Foto/Dokumen Berhasil Disimpan & Diteruskan ke Warga' : 'Tanpa Lampiran'}\n` +
        `────────────────────────\n` +
        `🔔 Notifikasi penyelesaian & foto bukti telah otomatis terkirim ke WhatsApp warga pelapor.\n` +
        `📊 Dashboard Command Center GPS-CC telah diperbarui secara real-time.\n\n` +
        `_Terima kasih atas dedikasi dan kerja cepat rekan-rekan tim teknis Dinas PUPR Garut!_ 👷‍♂️✨`;

      await this.sendPuriReply(senderJid, staffReply, false);

      this.client.addLog(
        'STAFF_RESOLUTION_PROCESSED',
        `Tiket ${ticket.nomorTiket} dijawab & diselesaikan oleh staf ${pushName} (${cleanPhone})${mediaBuffer ? ' dengan lampiran foto bukti' : ''}`
      );

      return true;
    }

    return false;
  }
}

module.exports = MessageHandler;
