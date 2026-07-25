const { GoogleGenAI } = require('@google/genai');
const supabaseService = require('../services/supabaseService');
const localDb = require('../services/localDbService'); // Keep for logs if needed

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

      const inboundData = {
        id: msg.key.id,
        sender: 'user',
        text,
        type,
        metadata,
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
      if (!handledByBot && isAiEnabled && type === 'text' && text.length >= (botSettings.min_text_length || 2)) {
         await this.handleGeminiAiReply(senderJid, text, pushName, botSettings);
      }
    }
  }

  extractMessageContent(msg) {
    const m = msg.message;
    if (m.conversation || m.extendedTextMessage) {
      return { 
        text: m.conversation || m.extendedTextMessage?.text, 
        type: 'text', 
        metadata: null 
      };
    }
    
    if (m.imageMessage) {
      return { 
        text: m.imageMessage.caption || '[Gambar]', 
        type: 'image', 
        metadata: { mimetype: m.imageMessage.mimetype } 
      };
    }

    if (m.videoMessage) {
      return { 
        text: m.videoMessage.caption || '[Video]', 
        type: 'video', 
        metadata: { mimetype: m.videoMessage.mimetype, seconds: m.videoMessage.seconds } 
      };
    }

    if (m.audioMessage) {
      return { 
        text: '[Pesan Suara / Audio]', 
        type: 'audio', 
        metadata: { ptt: m.audioMessage.ptt, seconds: m.audioMessage.seconds } 
      };
    }

    if (m.documentMessage) {
      return { 
        text: m.documentMessage.caption || m.documentMessage.fileName || '[Dokumen]', 
        type: 'document', 
        metadata: { fileName: m.documentMessage.fileName, mimetype: m.documentMessage.mimetype } 
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

    return { text: '[Pesan Tipe Lain]', type: 'unknown', metadata: null };
  }

  async handleGeminiAiReply(senderJid, messageText, pushName, botSettings = {}) {
    try {
      const systemPrompt = botSettings.system_prompt || `Anda adalah "PURI" (Pelayanan Umum & Informasi PUPR Garut), Asisten Virtual AI Resmi Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut.`;
      let modelName = botSettings.model || 'gemini-2.5-flash';

      // Fallback valid model names for Google GenAI SDK
      if (modelName.includes('3.6') || modelName.includes('3.5') || modelName.includes('3.0')) {
        modelName = 'gemini-2.5-flash';
      }

      const fullPrompt = `${systemPrompt}\n\nPertanyaan Warga (${pushName}): "${messageText}"`;

      const aiClient = this.getAiInstance();
      if (!aiClient) {
        console.warn('[MessageHandler] GEMINI_API_KEY tidak ditemukan di .env!');
        return false;
      }

      const res = await aiClient.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });

      const rawReply = res.text;
      
      if (rawReply) {
        const replyText = this.formatPuriReply(rawReply);
        // Automatically send the reply
        const botMsgObj = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          senderName: 'PURI',
          text: replyText,
          timestamp: new Date().toISOString(),
          status: 'sent',
          type: 'text'
        };

        await this.client.waSocket.sendMessage(senderJid, { text: replyText });
        
        const cleanPhone = '+' + senderJid.split('@')[0];
        await supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone });
        
        this.client.addLog('AI_GEMINI_REPLY', `Respon Gemini AI dikirim ke ${pushName}`);
        return true;
      }
    } catch (error) {
      console.error('[MessageHandler] Gagal mengirim balasan Gemini AI:', error.message);
      this.client.addLog('AI_GEMINI_ERROR', `Gagal merespons AI: ${error.message}`, 'error');
      return false;
    }
  }
}

module.exports = MessageHandler;
