import { WhatsAppConnectionStatus, WhatsAppConversation, WhatsAppBotLog, OperatorStatus } from '../domain/whatsapp';
import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('wa_conversations')
        .select(`
          id,
          contact_id,
          last_message,
          unread_count,
          status,
          category,
          updated_at,
          created_at,
          wa_messages(id, sender_type, text, media_url, media_type, status, timestamp)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching conversations:', error);
        return [];
      }

      if (data) {
        return data.map((c: any) => ({
          id: c.id,
          contactName: c.id.split('@')[0], // Simplified since we don't join wa_contacts in this query yet
          contactNumber: c.id.split('@')[0],
          lastMessage: c.last_message,
          timestamp: new Date(c.updated_at),
          unreadCount: c.unread_count,
          status: c.status === 'pending' ? 'pending' : (c.status === 'bot_handling' ? 'bot_handling' : 'active'),
          messages: (c.wa_messages || []).map((m: any) => ({
            id: m.id,
            sender: m.sender_type,
            text: m.text,
            timestamp: new Date(m.timestamp),
            status: m.status
          })).sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()),
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch conversations from Supabase:', e);
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
      { id: 'op-1', name: 'Admin PUPR (Anda)', status: 'online', activeTask: 'Super Admin Operator' }
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


