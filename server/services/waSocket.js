const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { 
  default: makeWASocket, 
  useMultiFileAuthState: getMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { SESSION_PATH } = require('../config/baileys');

let waSocket = null;
let currentQrCode = null;
let currentPairingCode = null;
let connectionState = 'disconnected'; // 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
let userInfo = null;

const { saveMessage, saveLog } = require('./localDbService');
const { GoogleGenAI } = require('@google/genai');

// Store in-memory cache for live telemetry, messages, contacts, and presence
const inboundMessagesCache = [];
const contactsCache = new Map();
const presenceCache = new Map();
const socketLogs = [];

// Reconnection strategy state variables
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
let reconnectTimer = null;
let isReconnecting = false;

async function addSocketLog(event, details, level = 'info') {
  const logEntry = {
    id: `slog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    event,
    details,
    level,
  };
  socketLogs.unshift(logEntry);
  if (socketLogs.length > 200) socketLogs.pop();
  
  // Persist to Firestore
  await saveLog(event, details, level);
}

// ... helper function to handle AI Reply
async function handleGeminiAiReply(senderJid, messageText, pushName) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah Asisten Virtual Resmi Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut untuk Layanan WhatsApp Center.
Jawablah pertanyaan warga berikut dengan sopan, akurat, dan ringkas dalam Bahasa Indonesia berdasarkan standar pelayanan PBG (Persetujuan Bangunan Gedung) dan SLF (Sertifikat Laik Fungsi) PUPR Garut:

Pertanyaan Warga (${pushName}): "${messageText}"`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    if (res?.text && waSocket && connectionState === 'connected') {
      const aiResponse = res.text;
      
      // 1. Send via Socket
      await waSocket.sendMessage(senderJid, { text: aiResponse });
      
      // 2. Save to Firestore
      const botMsg = {
        id: `msg-ai-${Date.now()}`,
        sender: 'bot',
        senderName: 'AI Assistant PUPR (Gemini 2.5)',
        text: aiResponse,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      const cleanPhone = '+' + senderJid.split('@')[0];
      await saveMessage(`conv-${senderJid}`, botMsg, { name: pushName, phoneNumber: cleanPhone });
      
      addSocketLog('AI_GEMINI_REPLY', `Jawaban AI Gemini dikirimkan secara otomatis ke ${pushName}`);
      return true;
    }
  } catch (error) {
    console.error('[Gemini AI] Error:', error);
  }
  return false;
}

const logger = pino({ level: 'silent' });

/**
 * Clear saved session files in case of unrecoverable auth error / logout
 */
function clearSessionAuth() {
  try {
    if (fs.existsSync(SESSION_PATH)) {
      fs.rmSync(SESSION_PATH, { recursive: true, force: true });
      console.log(`[PUPR Baileys] Directory sesi ${SESSION_PATH} berhasil dibersihkan.`);
      addSocketLog('SESSION_CLEARED', `Sesi di ${SESSION_PATH} dibersihkan karena logout / kredensial kadaluarsa`, 'warn');
    }
  } catch (err) {
    console.error('[PUPR Baileys] Gagal membersihkan direktori sesi:', err);
  }
}

/**
 * Schedule automatic reconnection with exponential backoff strategy
 */
function scheduleAutoReconnect(reasonCode = null, customDelayMs = null) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  reconnectAttempts++;
  isReconnecting = true;

  // Calculate exponential backoff delay: min 2s, increasing up to max 30s
  const baseDelay = customDelayMs || Math.min(2000 * Math.pow(1.4, reconnectAttempts - 1), 30000);
  const delayMs = Math.round(baseDelay);

  console.log(`[PUPR Baileys Reconnect] Menjadwalkan penyambungan kembali (Percobaan #${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) dalam ${delayMs}ms...`);
  addSocketLog(
    'RECONNECT_SCHEDULED',
    `Penyambungan kembali otomatis #${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dijadwalkan dalam ${(delayMs / 1000).toFixed(1)} detik. (Reason Code: ${reasonCode || 'N/A'})`,
    'info'
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[PUPR Baileys] Mencapai batas maksimum percobaan reconnect (${MAX_RECONNECT_ATTEMPTS}). Menunggu pemicu manual.`);
      addSocketLog('RECONNECT_FAILED_MAX', `Gagal menghubungkan kembali setelah ${MAX_RECONNECT_ATTEMPTS} percobaan. Silakan hubungkan ulang secara manual atau scan QR.`, 'error');
      connectionState = 'disconnected';
      isReconnecting = false;
      return;
    }

    try {
      await initBaileysSocket();
    } catch (err) {
      console.error('[PUPR Baileys] Reconnect attempt error:', err);
      scheduleAutoReconnect(null);
    }
  }, delayMs);
}

async function initBaileysSocket(phoneNumber = null) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    const { state, saveCreds } = await getMultiFileAuthState(SESSION_PATH);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[PUPR Baileys] Memulai koneksi Baileys ${version.join('.')}...`);
    addSocketLog('SOCKET_INITIALIZING', `Memulai engine Baileys MD version ${version.join('.')}`);
    connectionState = 'connecting';

    const { Browsers } = require('@whiskeysockets/baileys');
    
    waSocket = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: true,
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 2000,
    });

    // 1. Credentials Persistence Listener
    waSocket.ev.on('creds.update', saveCreds);

    // 2. Connection State Lifecycle Listener
    waSocket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrCode = qr;
        connectionState = 'qr_ready';
        isReconnecting = false;
        console.log('[PUPR Baileys] QR Code baru dihasilkan dari Meta!');
        addSocketLog('QR_RECEIVED', 'QR Code autentikasi baru diterima dari Meta WhatsApp');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
        const isRestartRequired = statusCode === DisconnectReason.restartRequired;

        console.log(`[PUPR Baileys] Koneksi terputus. Reason Code: ${statusCode}. LoggedOut: ${isLoggedOut}`);
        addSocketLog('CONNECTION_CLOSED', `Koneksi terputus (Status Code: ${statusCode || 'unknown'}). IsLoggedOut: ${isLoggedOut}`, 'warn');

        connectionState = 'disconnected';
        currentQrCode = null;
        userInfo = null;

        if (isLoggedOut) {
          console.warn('[PUPR Baileys] Sesi telah dilogout dari ponsel/Meta. Membersihkan auth...');
          addSocketLog('LOGGED_OUT_CLEANUP', 'Sesi kadaluarsa / dilogout. Membersihkan file auth agar QR baru dapat discan.', 'error');
          clearSessionAuth();
          reconnectAttempts = 0;
          setTimeout(() => initBaileysSocket(), 1500);
        } else {
          // Automatic reconnection strategy
          const delayOverride = isRestartRequired ? 1000 : null;
          scheduleAutoReconnect(statusCode, delayOverride);
        }
      } else if (connection === 'open') {
        console.log('[PUPR Baileys] WhatsApp BERHASIL Terhubung!');
        addSocketLog('CONNECTION_OPEN', 'Koneksi socket WASocket berhasil terhubung & terautentikasi', 'info');
        
        // Reset reconnect counters on successful connection
        reconnectAttempts = 0;
        isReconnecting = false;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        connectionState = 'connected';
        currentQrCode = null;
        currentPairingCode = null;

        const userJid = waSocket.user?.id || '';
        userInfo = {
          phoneNumber: '+' + userJid.split(':')[0],
          userJid,
          pushName: waSocket.user?.name || 'PUPR Garut Command Center',
          connectedAt: new Date().toISOString(),
        };
      }
    });

    // 3. Inbound Messages Listener (messages.upsert)
    waSocket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        const pushName = msg.pushName || 'Warga PUPR';
        const cleanPhone = '+' + senderJid.split('@')[0];
        const messageText = 
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '[Pesan Media / Dokumen]';

        const inboundData = {
          id: msg.key.id,
          sender: 'user',
          text: messageText,
          timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
          status: 'read',
        };

        inboundMessagesCache.unshift({ jid: senderJid, pushName, ...inboundData });
        if (inboundMessagesCache.length > 100) inboundMessagesCache.pop();

        console.log(`[PUPR Baileys Inbound] Pesan baru dari ${pushName} (${senderJid}): "${messageText}"`);
        addSocketLog('INBOUND_MESSAGE', `Pesan masuk dari ${pushName || senderJid}: "${messageText.slice(0, 50)}..."`);
        
        // Save to Firestore
        await saveMessage(`conv-${senderJid}`, inboundData, { name: pushName, phoneNumber: cleanPhone });
        
        // Trigger AI Auto-reply
        if (messageText.length > 3) {
           await handleGeminiAiReply(senderJid, messageText, pushName);
        }
      }
    });

    // 4. Delivery & Read Receipt Listener (messages.update)
    waSocket.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.update.status) {
          addSocketLog('MESSAGE_STATUS_UPDATE', `Status pesan ${update.key.id} diperbarui: ${update.update.status}`);
        }
      }
    });

    // 5. Contact Sync Listener (contacts.upsert)
    waSocket.ev.on('contacts.upsert', (contacts) => {
      for (const contact of contacts) {
        contactsCache.set(contact.id, {
          id: contact.id,
          name: contact.name || contact.notify || contact.verifiedName || contact.id.split('@')[0],
          imgUrl: contact.imgUrl || null,
        });
      }
      addSocketLog('CONTACTS_SYNCED', `Berhasil menyinkronkan ${contacts.length} kontak`);
    });

    // 6. Presence Listener (presence.update)
    waSocket.ev.on('presence.update', ({ id, presences }) => {
      presenceCache.set(id, presences);
      addSocketLog('PRESENCE_UPDATE', `Pembaruan presensi untuk JID ${id}`);
    });

    // 7. Group Participants Listener
    waSocket.ev.on('group-participants.update', ({ id, participants, action }) => {
      addSocketLog('GROUP_EVENT', `Aktivitas grup ${id}: Aksi ${action} pada ${participants.join(', ')}`);
    });

    // Phone Pairing Code Mode
    if (phoneNumber && !state.creds.registered) {
      setTimeout(async () => {
        try {
          const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
          const code = await waSocket.requestPairingCode(cleanPhone);
          currentPairingCode = code;
          console.log(`[PUPR Baileys] Kode Tautan Telepon: ${code}`);
          addSocketLog('PAIRING_CODE_GEN', `Kode tautan dihasilkan untuk ${cleanPhone}: ${code}`);
        } catch (err) {
          console.error('[PUPR Baileys] Gagal meminta kode tautan:', err);
          addSocketLog('PAIRING_CODE_ERROR', `Gagal meminta kode tautan: ${err.message}`, 'error');
        }
      }, 3000);
    }

  } catch (error) {
    console.error('[PUPR Baileys] Error menginisialisasi socket:', error);
    addSocketLog('INIT_ERROR', `Gagal inisialisasi socket: ${error.message}`, 'error');
    connectionState = 'disconnected';
    scheduleAutoReconnect(null);
  }
}

async function manualReconnect() {
  addSocketLog('MANUAL_RECONNECT', 'Permintaan penyambungan kembali manual dipicu oleh operator');
  reconnectAttempts = 0;
  isReconnecting = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  await initBaileysSocket();
}

async function logoutSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
  isReconnecting = false;

  if (waSocket) {
    try {
      await waSocket.logout();
    } catch (e) {
      console.warn('Logout warning:', e);
    }
    waSocket = null;
  }
  connectionState = 'disconnected';
  currentQrCode = null;
  currentPairingCode = null;
  userInfo = null;
  clearSessionAuth();
  addSocketLog('LOGOUT', 'Sesi WhatsApp berhasil diputuskan & dilogout dari Meta');
}

async function sendMessage(to, text, options = {}) {
  if (!waSocket || connectionState !== 'connected') {
    throw new Error('WhatsApp socket belum terhubung. Pastikan QR code sudah dipindai.');
  }
  const formattedJid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  const result = await waSocket.sendMessage(formattedJid, { text, ...options });
  addSocketLog('MESSAGE_SENT', `Pesan berhasil dikirim ke ${formattedJid}`);
  return result;
}

async function sendMediaMessage(to, mediaUrl, caption = '', mediaType = 'image') {
  if (!waSocket || connectionState !== 'connected') {
    throw new Error('WhatsApp socket belum terhubung');
  }
  const formattedJid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  
  let payload = {};
  if (mediaType === 'image') {
    payload = { image: { url: mediaUrl }, caption };
  } else if (mediaType === 'document') {
    payload = { document: { url: mediaUrl }, caption, fileName: 'Dokumen_PUPR_Garut.pdf' };
  } else {
    payload = { text: `${caption}\n${mediaUrl}` };
  }

  const result = await waSocket.sendMessage(formattedJid, payload);
  addSocketLog('MEDIA_SENT', `Media (${mediaType}) dikirim ke ${formattedJid}`);
  return result;
}

async function sendPresence(to, presenceState = 'composing') {
  if (!waSocket || connectionState !== 'connected') return;
  const formattedJid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  await waSocket.sendPresenceUpdate(presenceState, formattedJid);
}

async function markAsRead(to, messageKeys = []) {
  if (!waSocket || connectionState !== 'connected') return;
  const formattedJid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  await waSocket.readMessages(messageKeys.length > 0 ? messageKeys : [{ remoteJid: formattedJid, id: 'last', fromMe: false }]);
}

async function getProfilePicture(jid) {
  if (!waSocket || connectionState !== 'connected') return null;
  try {
    const formattedJid = jid.includes('@') ? jid : `${jid.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    return await waSocket.profilePictureUrl(formattedJid, 'image');
  } catch {
    return null;
  }
}

async function getGroupMetadata(groupId) {
  if (!waSocket || connectionState !== 'connected') return null;
  try {
    return await waSocket.groupMetadata(groupId);
  } catch (err) {
    return { error: err.message };
  }
}

function getSocketStatus() {
  return {
    status: connectionState,
    qrCodeRaw: currentQrCode,
    pairingCode: currentPairingCode,
    userInfo,
    baileysVersion: '@whiskeysockets/baileys v6.7.8',
    serverTime: new Date().toISOString(),
    logs: socketLogs.slice(0, 50),
    inboundMessagesCount: inboundMessagesCache.length,
    contactsSyncedCount: contactsCache.size,
    reconnection: {
      reconnectAttempts,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      isReconnecting,
      hasActiveTimer: !!reconnectTimer,
    },
  };
}

function getInboundMessages() {
  return inboundMessagesCache;
}

function getContactsList() {
  return Array.from(contactsCache.values());
}

module.exports = {
  initBaileysSocket,
  manualReconnect,
  logoutSocket,
  clearSessionAuth,
  sendMessage,
  sendMediaMessage,
  sendPresence,
  markAsRead,
  getProfilePicture,
  getGroupMetadata,
  getSocketStatus,
  getInboundMessages,
  getContactsList,
};

