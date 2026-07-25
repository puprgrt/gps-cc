const fs = require('fs');
const path = require('path');

const DB_DIR = process.env.BAILEYS_DB_PATH || path.join(__dirname, '../../.data');
const CONV_FILE = path.join(DB_DIR, 'conversations.json');
const LOG_FILE = path.join(DB_DIR, 'logs.json');

async function init() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONV_FILE)) fs.writeFileSync(CONV_FILE, JSON.stringify([]));
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

function readDb(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeDb(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function saveMessage(conversationId, messageData, contactData = null) {
  try {
    const conversations = readDb(CONV_FILE);
    let conv = conversations.find(c => c.id === conversationId);
    const timestampIso = new Date().toISOString();

    if (!conv) {
      conv = {
        id: conversationId,
        contactName: contactData?.name || conversationId,
        contactNumber: contactData?.phoneNumber || conversationId,
        location: 'Garut',
        timestamp: timestampIso,
        lastMessage: messageData.text || '',
        category: 'Umum',
        unreadCount: messageData.sender === 'user' ? 1 : 0,
        status: messageData.sender === 'user' ? 'pending' : 'active',
        joinedDate: timestampIso,
        totalChatCount: 1,
        messages: [messageData],
        tags: [],
        notes: []
      };
      conversations.unshift(conv);
    } else {
      conv.timestamp = timestampIso;
      conv.lastMessage = messageData.text || '';
      conv.unreadCount = messageData.sender === 'user' ? (conv.unreadCount || 0) + 1 : 0;
      conv.status = messageData.sender === 'user' 
        ? (conv.status === 'resolved' ? 'pending' : conv.status)
        : (messageData.sender === 'bot' ? 'bot_handling' : 'active');
      conv.totalChatCount = (conv.totalChatCount || 0) + 1;
      
      if (!conv.messages) conv.messages = [];
      conv.messages.push(messageData);
      
      // Move to top
      const idx = conversations.findIndex(c => c.id === conversationId);
      if (idx > -1) {
        conversations.splice(idx, 1);
        conversations.unshift(conv);
      }
    }
    
    writeDb(CONV_FILE, conversations);
    return true;
  } catch (error) {
    console.error('[LocalDB] Error saving message:', error);
    return false;
  }
}

async function saveLog(event, details, level = 'info') {
  try {
    const logs = readDb(LOG_FILE);
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logs.unshift({
      id: logId,
      timestamp: new Date().toISOString(),
      event,
      details,
      level
    });
    if (logs.length > 500) logs.pop();
    writeDb(LOG_FILE, logs);
  } catch (error) {
    console.error('[LocalDB] Error saving log:', error);
  }
}

async function getActiveConversations() {
  return readDb(CONV_FILE);
}

async function getRecentLogs() {
  const logs = readDb(LOG_FILE);
  return logs.slice(0, 100);
}

async function addNote(conversationId, note) {
  const conversations = readDb(CONV_FILE);
  const conv = conversations.find(c => c.id === conversationId);
  if (conv) {
    if (!conv.notes) conv.notes = [];
    conv.notes.push(note);
    writeDb(CONV_FILE, conversations);
    return true;
  }
  return false;
}

async function addTag(conversationId, tag) {
  const conversations = readDb(CONV_FILE);
  const conv = conversations.find(c => c.id === conversationId);
  if (conv) {
    if (!conv.tags) conv.tags = [];
    if (!conv.tags.includes(tag)) conv.tags.push(tag);
    writeDb(CONV_FILE, conversations);
    return true;
  }
  return false;
}

module.exports = {
  init,
  saveMessage,
  saveLog,
  getActiveConversations,
  getRecentLogs,
  addNote,
  addTag
};
