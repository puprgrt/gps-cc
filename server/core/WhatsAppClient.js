const { 
  default: makeWASocket, 
  useMultiFileAuthState: getMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const qrcodeTerminal = require('qrcode-terminal');
const { SESSION_PATH } = require('../config/baileys');
const supabaseService = require('../services/supabaseService');
const localDb = require('../services/localDbService');

const MessageHandler = require('./MessageHandler');
const CallHandler = require('./CallHandler');

const logger = pino({ level: 'silent' });

class WhatsAppClient {
  constructor() {
    this.waSocket = null;
    this.currentQrCode = null;
    this.currentPairingCode = null;
    this.connectionState = 'disconnected'; // 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
    this.userInfo = null;
    
    // In-memory cache
    this.inboundMessagesCache = [];
    this.contactsCache = new Map();
    this.presenceCache = new Map();
    this.socketLogs = [];

    // Reconnection strategy state variables
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 15;
    this.reconnectTimer = null;
    this.isReconnecting = false;
    
    // Handlers
    this.messageHandler = new MessageHandler(this);
    this.callHandler = new CallHandler(this);
  }

  async addLog(event, details, level = 'info') {
    const logEntry = {
      id: `slog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      event,
      details,
      level,
    };
    this.socketLogs.unshift(logEntry);
    if (this.socketLogs.length > 200) this.socketLogs.pop();
    await localDb.saveLog(event, details, level);
  }

  clearSessionAuth() {
    try {
      if (fs.existsSync(SESSION_PATH)) {
        fs.rmSync(SESSION_PATH, { recursive: true, force: true });
        console.log(`[PUPR Baileys] Directory sesi ${SESSION_PATH} berhasil dibersihkan.`);
        this.addLog('SESSION_CLEARED', `Sesi di ${SESSION_PATH} dibersihkan karena logout / kredensial kadaluarsa`, 'warn');
      }
    } catch (err) {
      console.error('[PUPR Baileys] Gagal membersihkan direktori sesi:', err);
    }
  }

  scheduleAutoReconnect(reasonCode = null, customDelayMs = null) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;

    const baseDelay = customDelayMs || Math.min(2000 * Math.pow(1.4, this.reconnectAttempts - 1), 30000);
    const delayMs = Math.round(baseDelay);

    console.log(`[PUPR Baileys Reconnect] Menjadwalkan penyambungan kembali (Percobaan #${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}) dalam ${delayMs}ms...`);
    this.addLog('RECONNECT_SCHEDULED', `Penyambungan kembali otomatis #${this.reconnectAttempts} dijadwalkan dalam ${(delayMs / 1000).toFixed(1)} detik.`, 'info');

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[PUPR Baileys] Mencapai batas maksimum percobaan reconnect.`);
        this.addLog('RECONNECT_FAILED_MAX', `Gagal menghubungkan kembali setelah ${this.MAX_RECONNECT_ATTEMPTS} percobaan.`, 'error');
        this.connectionState = 'disconnected';
        this.isReconnecting = false;
        return;
      }
      try {
        await this.init(null);
      } catch (err) {
        console.error('[PUPR Baileys] Reconnect attempt error:', err);
        this.scheduleAutoReconnect(null);
      }
    }, delayMs);
  }

  async init(phoneNumber = null) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // Pastikan direktori ada sebelum memanggil useMultiFileAuthState
      if (!fs.existsSync(SESSION_PATH)) {
        fs.mkdirSync(SESSION_PATH, { recursive: true });
      }

      const { state, saveCreds } = await getMultiFileAuthState(SESSION_PATH);
      const { version } = await fetchLatestBaileysVersion();

      console.log(`[PUPR Baileys] Memulai koneksi Baileys ${version.join('.')}...`);
      this.addLog('SOCKET_INITIALIZING', `Memulai engine Baileys MD version ${version.join('.')}`);
      this.connectionState = 'connecting';

      this.waSocket = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.ubuntu('Chrome'), // Fix for 'Invalid QR code' issue
        markOnlineOnConnect: true,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        retryRequestDelayMs: 2000,
      });

      // 1. Credentials Persistence Listener
      this.waSocket.ev.on('creds.update', saveCreds);

      // 2. Connection State Lifecycle Listener
      this.waSocket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.currentQrCode = qr;
          this.connectionState = 'qr_ready';
          this.isReconnecting = false;
          console.log('[PUPR Baileys] QR Code baru dihasilkan dari Meta!');
          qrcodeTerminal.generate(qr, { small: true });
          this.addLog('QR_RECEIVED', 'QR Code autentikasi baru diterima dari Meta WhatsApp');
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
          const isRestartRequired = statusCode === DisconnectReason.restartRequired;

          this.connectionState = 'disconnected';
          this.currentQrCode = null;

          if (isLoggedOut || statusCode === 440) {
            console.warn(`[PUPR Baileys] Sesi ditolak / Dilogout dari WhatsApp (Kode: ${statusCode}). Membersihkan sesi lama.`);
            this.addLog('DISCONNECTED_LOGGED_OUT', `Sesi ditolak oleh Meta WhatsApp (Kode: ${statusCode}). Memerlukan scan QR baru.`, 'error');
            this.clearSessionAuth();
            this.isReconnecting = false;
            // Inisialisasi ulang agar QR Code baru segera muncul
            this.scheduleAutoReconnect(statusCode, 2000);
          } else {
            console.log(`[PUPR Baileys] Koneksi tertutup. Status Code: ${statusCode}`);
            this.addLog('DISCONNECTED', `Koneksi tertutup dengan kode: ${statusCode || 'Unknown'}`, 'warn');
            const delay = isRestartRequired ? 1000 : null;
            this.scheduleAutoReconnect(statusCode, delay);
          }
        }

        if (connection === 'open') {
          console.log('[PUPR Baileys] Koneksi WhatsApp Socket Berhasil & Stabil!');
          this.addLog('CONNECTED', 'Terhubung ke jaringan Meta WhatsApp', 'success');
          
          this.connectionState = 'connected';
          this.currentQrCode = null;
          this.currentPairingCode = null;
          this.reconnectAttempts = 0;
          this.isReconnecting = false;

          const me = this.waSocket.user;
          if (me) {
            this.userInfo = {
              id: me.id,
              name: me.name,
              phone: me.id.split(':')[0],
            };
            this.addLog('USER_INFO', `Masuk sebagai: ${me.name || me.id}`);
          }
        }
      });

      // 3. Incoming Message Listener
      this.waSocket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          await this.messageHandler.handleIncoming(messages);
        }
      });

      // 4. Call Listener
      this.waSocket.ev.on('call', async (calls) => {
        await this.callHandler.handleIncoming(calls);
      });

      // 5. Contacts and Presence
      this.waSocket.ev.on('contacts.upsert', async (contacts) => {
        const validContacts = [];
        for (const contact of contacts) {
          const formatted = {
            id: contact.id,
            name: contact.name || contact.notify || contact.verifiedName || contact.id.split('@')[0],
            imgUrl: contact.imgUrl || null,
          };
          this.contactsCache.set(contact.id, formatted);
          if (contact.id.endsWith('@s.whatsapp.net')) {
            validContacts.push(formatted);
          }
        }
        // Sync to Supabase in background
        if (validContacts.length > 0) {
          supabaseService.upsertContacts(validContacts).catch(err => {
            console.error('[PUPR Baileys] Error syncing contacts to Supabase:', err);
          });
        }
      });

      this.waSocket.ev.on('presence.update', ({ id, presences }) => {
        this.presenceCache.set(id, presences);
      });

      // Phone Pairing Code Mode
      if (phoneNumber && !state.creds.registered) {
        setTimeout(async () => {
          try {
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            const code = await this.waSocket.requestPairingCode(cleanPhone);
            this.currentPairingCode = code;
            console.log(`[PUPR Baileys] Kode Tautan Telepon: ${code}`);
            this.addLog('PAIRING_CODE_GEN', `Kode tautan dihasilkan: ${code}`);
          } catch (err) {
            console.error('[PUPR Baileys] Gagal meminta kode tautan:', err);
          }
        }, 3000);
      }

    } catch (error) {
      console.error('[PUPR Baileys] Error menginisialisasi socket:', error);
      this.addLog('INIT_ERROR', `Gagal inisialisasi socket: ${error.message}`, 'error');
      this.connectionState = 'disconnected';
      this.scheduleAutoReconnect(null);
    }
  }

  async logout() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    if (this.waSocket) {
      try { await this.waSocket.logout(); } catch (e) { }
      this.waSocket = null;
    }
    this.connectionState = 'disconnected';
    this.currentQrCode = null;
    this.currentPairingCode = null;
    this.userInfo = null;
    this.clearSessionAuth();
    this.addLog('LOGOUT', 'Sesi WhatsApp berhasil diputuskan & dilogout');
  }

  getSocketStatus() {
    return {
      status: this.connectionState,
      qrCodeRaw: this.currentQrCode,
      pairingCode: this.currentPairingCode,
      userInfo: this.userInfo,
      baileysVersion: '@whiskeysockets/baileys v7.0.0-rc13',
      serverTime: new Date().toISOString(),
      logs: this.socketLogs.slice(0, 50),
      inboundMessagesCount: this.inboundMessagesCache.length,
      contactsSyncedCount: this.contactsCache.size,
      reconnection: {
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.MAX_RECONNECT_ATTEMPTS,
        isReconnecting: this.isReconnecting,
        hasActiveTimer: !!this.reconnectTimer,
      },
    };
  }
}

// Export a singleton instance
const instance = new WhatsAppClient();
module.exports = instance;
