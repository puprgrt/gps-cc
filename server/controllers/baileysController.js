const whatsappClient = require('../core/WhatsAppClient');
const localDb = require('../services/localDbService');
const supabaseService = require('../services/supabaseService');

exports.getStatus = (req, res) => {
  res.json(whatsappClient.getSocketStatus());
};

exports.connectSocket = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    await whatsappClient.init(phoneNumber);
    res.json({ message: 'Proses inisialisasi / permintaan QR (atau pairing code) dimulai.', status: whatsappClient.connectionState });
  } catch (error) {
    console.error('Connect Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.disconnectSocket = async (req, res) => {
  try {
    await whatsappClient.logout();
    res.json({ message: 'Sesi WhatsApp berhasil diputuskan (Logged Out).', status: 'disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reconnectSocket = async (req, res) => {
  try {
    // Memaksa tutup socket tapi tidak menghapus auth
    if (whatsappClient.waSocket) {
      whatsappClient.waSocket.end(new Error('Manual reconnect'));
    }
    whatsappClient.scheduleAutoReconnect(null, 1000);
    res.json({ message: 'Menjadwalkan ulang koneksi (Reconnect)...', status: 'connecting' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleSendMessage = async (req, res) => {
  try {
    const { to, text, sender } = req.body;
    if (!whatsappClient.waSocket || whatsappClient.connectionState !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp belum terhubung.' });
    }

    if (!to || !text) {
      return res.status(400).json({ error: 'Parameter "to" (nomor tujuan) dan "text" harus diisi.' });
    }

    let targetJid = to.includes('@s.whatsapp.net') || to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;
    const cleanPhone = '+' + targetJid.split('@')[0];

    const result = await whatsappClient.waSocket.sendMessage(targetJid, { text });
    
    // Simpan ke database
    const botMsgObj = {
      id: result?.key?.id || `msg-${Date.now()}`,
      sender: sender || 'operator',
      senderName: sender === 'operator' ? 'Admin PUPR' : 'PURI',
      text: text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: 'text'
    };
    
    await supabaseService.saveMessage(`conv-${targetJid}`, botMsgObj, { name: cleanPhone, phoneNumber: cleanPhone });
    await whatsappClient.addLog('SEND_MESSAGE', `Pesan Teks ke ${targetJid}: "${text.slice(0, 50)}..."`);
    
    res.json({ message: 'Pesan Teks berhasil dikirim.', data: result, saved: botMsgObj });
  } catch (error) {
    console.error('Error Send Message:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle mengirim dokumen PDF/Image via base64 (Contoh minimalis)
exports.handleSendMedia = async (req, res) => {
  try {
    const { to, base64Data, caption, mimetype, fileName, type } = req.body;
    
    if (!whatsappClient.waSocket || whatsappClient.connectionState !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp belum terhubung.' });
    }

    let targetJid = to.includes('@s.whatsapp.net') || to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;
    const cleanPhone = '+' + targetJid.split('@')[0];
    const buffer = Buffer.from(base64Data, 'base64');
    
    let msgOptions = {};
    if (type === 'image') {
      msgOptions = { image: buffer, caption: caption || '' };
    } else if (type === 'document') {
      msgOptions = { document: buffer, mimetype, fileName: fileName || 'document.pdf', caption: caption || '' };
    } else {
      return res.status(400).json({ error: 'Tipe media tidak didukung' });
    }

    const result = await whatsappClient.waSocket.sendMessage(targetJid, msgOptions);
    
    const botMsgObj = {
      id: result?.key?.id || `msg-${Date.now()}`,
      sender: 'operator',
      senderName: 'Admin PUPR',
      text: caption || `[Mengirim ${type}]`,
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: type,
      metadata: { fileName, mimetype }
    };
    
    await supabaseService.saveMessage(`conv-${targetJid}`, botMsgObj, { name: cleanPhone, phoneNumber: cleanPhone });
    res.json({ message: 'Pesan Media berhasil dikirim.', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleGetConversations = async (req, res) => {
  try {
    const data = await supabaseService.getActiveConversations();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleGetContacts = (req, res) => {
  const contacts = Array.from(whatsappClient.contactsCache.values());
  res.json({ total: contacts.length, contacts });
};

exports.handleGetLogs = async (req, res) => {
  try {
    const data = await localDb.getLogs();
    res.json({ total: data.length, logs: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleGetBotSettings = async (req, res) => {
  try {
    const settings = await supabaseService.getBotSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleUpdateBotSettings = async (req, res) => {
  try {
    const updated = await supabaseService.updateBotSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
