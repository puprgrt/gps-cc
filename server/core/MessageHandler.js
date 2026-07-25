const { GoogleGenAI } = require('@google/genai');
const supabaseService = require('../services/supabaseService');
const localDb = require('../services/localDbService'); // Keep for logs if needed

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
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
      
      // Auto reply with Gemini (only if text is long enough and it's a standard text message)
      if (type === 'text' && text.length > 3 && this.ai) {
         await this.handleGeminiAiReply(senderJid, text, pushName);
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

  async handleGeminiAiReply(senderJid, messageText, pushName) {
    try {
      const prompt = `Anda adalah Asisten Virtual Resmi Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut untuk Layanan WhatsApp Center.
Jawablah pertanyaan warga berikut dengan sopan, akurat, dan ringkas dalam Bahasa Indonesia berdasarkan standar pelayanan PBG (Persetujuan Bangunan Gedung) dan SLF (Sertifikat Laik Fungsi) PUPR Garut:

Pertanyaan Warga (${pushName}): "${messageText}"`;

      const res = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const replyText = res.text;
      
      if (replyText) {
        // Automatically send the reply
        const botMsgObj = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          senderName: 'Gemini AI',
          text: replyText,
          timestamp: new Date().toISOString(),
          status: 'sent',
          type: 'text'
        };

        await this.client.waSocket.sendMessage(senderJid, { text: replyText });
        
        const cleanPhone = '+' + senderJid.split('@')[0];
        await supabaseService.saveMessage(`conv-${senderJid}`, botMsgObj, { name: pushName, phoneNumber: cleanPhone });
        
        this.client.addLog('AI_GEMINI_REPLY', `Jawaban otomatis AI dikirim ke ${pushName}`);
        return true;
      }
    } catch (error) {
      this.client.addLog('GEMINI_ERROR', `Error AI: ${error.message}`, 'error');
    }
    return false;
  }
}

module.exports = MessageHandler;
