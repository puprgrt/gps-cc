const waSocketService = require('../services/waSocket');

function getStatus(req, res) {
  res.json(waSocketService.getSocketStatus());
}

async function connectSocket(req, res) {
  const { mode, phoneNumber } = req.body;
  await waSocketService.initBaileysSocket(phoneNumber);
  res.json({ message: 'Proses inisialisasi socket dimulai', mode });
}

async function reconnectSocket(req, res) {
  try {
    await waSocketService.manualReconnect();
    res.json({ success: true, message: 'Proses reconnect manual berhasil dipicu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function disconnectSocket(req, res) {
  await waSocketService.logoutSocket();
  res.json({ message: 'Sesi WhatsApp berhasil diputuskan' });
}

async function handleSendMessage(req, res) {
  const { to, text, options } = req.body;
  try {
    const result = await waSocketService.sendMessage(to, text, options);
    
    // Save outbound message to Firestore
    const { saveMessage } = require('../services/firestoreService');
    const outMsg = {
      id: result.key?.id || `msg-${Date.now()}`,
      sender: 'operator',
      senderName: 'Admin Operator PUPR',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    const cleanPhone = '+' + to.split('@')[0];
    await saveMessage(`conv-${to}`, outMsg, { name: cleanPhone, phoneNumber: cleanPhone });

    res.json({ success: true, messageId: result.key?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleSendMedia(req, res) {
  const { to, mediaUrl, caption, mediaType } = req.body;
  try {
    const result = await waSocketService.sendMediaMessage(to, mediaUrl, caption, mediaType);
    res.json({ success: true, messageId: result.key.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleSendPresence(req, res) {
  const { to, state } = req.body;
  try {
    await waSocketService.sendPresence(to, state || 'composing');
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleMarkRead(req, res) {
  const { to } = req.body;
  try {
    await waSocketService.markAsRead(to);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetProfilePicture(req, res) {
  const { jid } = req.query;
  try {
    const url = await waSocketService.getProfilePicture(jid);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetGroupMetadata(req, res) {
  const { groupId } = req.query;
  try {
    const metadata = await waSocketService.getGroupMetadata(groupId);
    res.json({ success: true, metadata });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handleGetInboundMessages(req, res) {
  res.json({ success: true, messages: waSocketService.getInboundMessages() });
}

function handleGetContacts(req, res) {
  res.json({ success: true, contacts: waSocketService.getContactsList() });
}

module.exports = {
  getStatus,
  connectSocket,
  reconnectSocket,
  disconnectSocket,
  handleSendMessage,
  handleSendMedia,
  handleSendPresence,
  handleMarkRead,
  handleGetProfilePicture,
  handleGetGroupMetadata,
  handleGetInboundMessages,
  handleGetContacts,
};

