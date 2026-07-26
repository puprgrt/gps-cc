const { GoogleGenAI } = require('@google/genai');
const { downloadMediaMessage, normalizeMessageContent, getContentType } = require('@whiskeysockets/baileys');
const supabaseService = require('../services/supabaseService');
const localDb = require('../services/localDbService'); // Keep for logs if needed
const aiOrchestrator = require('./AIOrchestrator');

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

  formatPuriReply(text) {
    if (!text) return '';
    const cleanText = text.trim();
    if (cleanText.startsWith('🤖') || cleanText.startsWith('*PURI') || cleanText.startsWith('PURI:')) {
      return cleanText;
    }
    return `🤖 *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\n${cleanText}`;
  }

  async handleIncoming(messages) {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const senderJid = msg.key.remoteJid;
      const pushName = msg.pushName || 'Warga PUPR';
      const cleanPhone = '+' + senderJid.split('@')[0];
      
      const { text, type, metadata } = this.extractMessageContent(msg);

      let mediaBase64 = null;
      let enrichedMetadata = { ...(metadata || {}) };
      if (type === 'document' || type === 'image') {
        try {
          let mediaBuffer = null;
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
            const dataUrl = `data:${mime};base64,${mediaBase64}`;

            const fs = require('fs');
            const path = require('path');
            try {
              const publicDir = path.resolve(__dirname, '../../public', 'wa-media');
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
              }
              const ext = type === 'image' ? (mime.includes('png') ? 'png' : 'jpg') : 'pdf';
              const safeName = `${Date.now()}_${msg.key.id.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`;
              const filePath = path.join(publicDir, safeName);
              fs.writeFileSync(filePath, mediaBuffer);
              console.log(`[MEDIA_SAVE] Berhasil menyimpan file media: ${filePath} (${(mediaBuffer.length / 1024).toFixed(1)} KB)`);
              enrichedMetadata.fileUrl = `/wa-media/${safeName}`;
              enrichedMetadata.fileName = enrichedMetadata.fileName || `Lampiran_${type === 'image' ? 'Foto' : 'Dokumen'}.${ext}`;
            } catch (fsErr) {
              console.error('[MEDIA_SAVE_ERROR] Gagal menyimpan file ke public/wa-media:', fsErr.message);
              this.client.addLog('MEDIA_FS_ERROR', `Gagal menyimpan file ke public/wa-media: ${fsErr.message}`);
              enrichedMetadata.fileUrl = dataUrl;
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
      
      // Save to Supabase
      await supabaseService.saveMessage(`conv-${senderJid}`, inboundData, { name: pushName, phoneNumber: cleanPhone });
      
      // Fetch dynamic Bot Settings, Menu Flows, & Keyword Rules
      const botSettings = await supabaseService.getBotSettings();
      const menuFlows = await supabaseService.getBotMenuFlows();
      const keywordRules = await supabaseService.getBotKeywords();

      let handledByBot = false;
      const cleanInput = text.trim().toLowerCase();

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

          await this.client.waSocket.sendMessage(senderJid, { text: replyText });
          await supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone });
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

          await this.client.waSocket.sendMessage(senderJid, { text: replyText });
          await supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone });
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

      // Call PURI Multi-Modal AI Orchestrator 2026 (Free Tier / Local Fallback + 6-Tier Routing)
      const orchestratorResult = await aiOrchestrator.processMessage({
        conversationId: convId,
        senderName: pushName,
        userText: messageText,
        mediaPayload: mediaPayload || undefined,
        preferredModel: botSettings.model || 'auto',
        customSystemPrompt: botSettings.system_prompt || undefined,
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

        await this.client.waSocket.sendMessage(senderJid, { text: replyText });
        await supabaseService.saveMessage(convId, botMsgObj, { name: pushName, phoneNumber: cleanPhone });

        // Structured logging for AI Cost & Performance Dashboard
        const logTag = orchestratorResult.isFromCache
          ? 'AI_CACHE_HIT'
          : `AI_${orchestratorResult.providerUsed}_REPLY`;
        const logMsg = `Respon [${orchestratorResult.providerUsed} - ${orchestratorResult.modelName}] dikirim ke ${pushName} (${orchestratorResult.executionTimeMs}ms, Conf: ${orchestratorResult.confidenceScore}%)`;
        this.client.addLog(logTag, logMsg);
        
        console.log(`[PURI_ORCHESTRATOR] ${logMsg} | Routing Bidang: ${orchestratorResult.routingDecision?.primaryBidang}`);
        return true;
      }
    } catch (error) {
      console.error('[MessageHandler] Gagal mengirim balasan PURI AI Orchestrator:', error.message);
      this.client.addLog('AI_ORCHESTRATOR_ERROR', `Gagal merespons AI: ${error.message}`, 'error');
      return false;
    }
  }
}

module.exports = MessageHandler;
