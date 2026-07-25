import { WhatsAppConnectionStatus, WhatsAppConversation, WhatsAppBotLog, OperatorStatus } from '../domain/whatsapp';

export class WhatsAppService {
  static async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    try {
      const res = await fetch('/api/whatsapp/baileys', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'qr_ready',
          phoneNumber: data.phoneNumber,
          userJid: data.userJid,
          pushName: data.pushName,
          qrCodeRaw: data.qrCodeRaw || data.qr,
          pairingCode: data.pairingCode,
          activeSince: data.activeSince,
          lastSync: data.lastSync ? new Date(data.lastSync) : new Date(),
          baileysVersion: data.baileysVersion || '@whiskeysockets/baileys v6.7.8',
          sessionPath: data.sessionPath || './baileys_auth_garut',
          pingMs: data.pingMs || 18,
        };
      }
    } catch (e) {
      console.warn('Failed to fetch real connection status from API:', e);
    }

    return {
      status: 'qr_ready',
      baileysVersion: '@whiskeysockets/baileys v6.7.8',
      sessionPath: './baileys_auth_garut',
      lastSync: new Date(),
      pingMs: 20,
    };
  }

  static async getActiveConversations(): Promise<WhatsAppConversation[]> {
    try {
      const res = await fetch('/api/whatsapp/messages', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          return data.conversations.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp),
            messages: (c.messages || []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch conversations from API:', e);
    }
    return [];
  }

  static async sendMessageApi(conversationId: string, text: string, sender: 'user' | 'bot' | 'operator' = 'operator') {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId,
          text,
          sender,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed sending message via API:', e);
    }
    return null;
  }

  static async sendMediaApi(conversationId: string, base64Data: string, type: 'image' | 'document', caption: string, fileName?: string, mimetype?: string) {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_media',
          conversationId,
          base64Data,
          type,
          caption,
          fileName,
          mimetype,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed sending media via API:', e);
    }
    return null;
  }

  static async addNoteApi(conversationId: string, note: string) {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          conversationId,
          note,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed adding note via API:', e);
    }
    return null;
  }

  static async getOperators(): Promise<OperatorStatus[]> {
    return [
      { id: 'op-1', name: 'Admin PUPR', status: 'online', activeTask: 'Super Admin Operator' },
      { id: 'op-2', name: 'Dinda Sekar', status: 'busy', activeTask: 'Membalas Chat PBG' },
      { id: 'op-3', name: 'Rizky Maulana', status: 'online', activeTask: 'Verifikasi Dokumen' },
      { id: 'op-4', name: 'Siti Aisyah', status: 'offline', activeTask: 'Shift Pagi' },
      { id: 'op-5', name: 'Agus Setiawan', status: 'busy', activeTask: 'Tim Teknis SLF' },
    ];
  }

  static async getBotLogs(): Promise<WhatsAppBotLog[]> {
    try {
      const res = await fetch('/api/whatsapp/messages', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          return data.logs.map((l: any) => ({
            ...l,
            timestamp: new Date(l.timestamp),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed fetching logs from API:', e);
    }
    return [];
  }
}


