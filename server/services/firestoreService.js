const { db } = require('../config/firebase');
const { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs, query, orderBy } = require('firebase/firestore');

const CONV_COLLECTION = 'whatsapp_conversations';
const LOG_COLLECTION = 'whatsapp_logs';

async function saveMessage(conversationId, messageData, contactData = null) {
  try {
    const convRef = doc(db, CONV_COLLECTION, conversationId);
    const convSnap = await getDoc(convRef);

    const timestampIso = new Date().toISOString();
    const isNew = !convSnap.exists();
    
    // Default chat structure
    const baseData = {
      id: conversationId,
      contactName: contactData?.name || conversationId,
      contactNumber: contactData?.phoneNumber || conversationId,
      location: 'Garut',
      timestamp: timestampIso,
      lastMessage: messageData.text || '',
      category: 'Umum',
    };

    if (isNew) {
      // Create new conversation
      await setDoc(convRef, {
        ...baseData,
        unreadCount: messageData.sender === 'user' ? 1 : 0,
        status: messageData.sender === 'user' ? 'pending' : 'active',
        joinedDate: timestampIso,
        totalChatCount: 1,
        messages: [messageData],
        tags: [],
        notes: []
      });
    } else {
      // Update existing conversation
      const currentData = convSnap.data();
      const newUnreadCount = messageData.sender === 'user' 
        ? (currentData.unreadCount || 0) + 1 
        : 0; // Reset if bot/operator replies
        
      const newStatus = messageData.sender === 'user'
        ? (currentData.status === 'resolved' ? 'pending' : currentData.status)
        : (messageData.sender === 'bot' ? 'bot_handling' : 'active');

      await updateDoc(convRef, {
        timestamp: timestampIso,
        lastMessage: messageData.text || '',
        unreadCount: newUnreadCount,
        status: newStatus,
        totalChatCount: (currentData.totalChatCount || 0) + 1,
        messages: arrayUnion(messageData)
      });
    }
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving message:', error);
    return false;
  }
}

async function saveLog(event, details, level = 'info') {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, LOG_COLLECTION, logId);
    await setDoc(logRef, {
      id: logId,
      timestamp: new Date().toISOString(),
      event,
      details,
      level
    });
  } catch (error) {
    console.error('[Firestore] Error saving log:', error);
  }
}

async function getActiveConversations() {
  try {
    const q = query(collection(db, CONV_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const conversations = [];
    snapshot.forEach(doc => {
      conversations.push(doc.data());
    });
    return conversations;
  } catch (error) {
    console.error('[Firestore] Error getting conversations:', error);
    return [];
  }
}

async function getRecentLogs() {
  try {
    const q = query(collection(db, LOG_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach(doc => {
      logs.push(doc.data());
    });
    // Return only top 100 logs
    return logs.slice(0, 100);
  } catch (error) {
    console.error('[Firestore] Error getting logs:', error);
    return [];
  }
}

module.exports = {
  saveMessage,
  saveLog,
  getActiveConversations,
  getRecentLogs
};
