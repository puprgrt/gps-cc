import { useEffect } from 'react';
import { create } from 'zustand';
import { WhatsAppConnectionStatus, WhatsAppConversation, WhatsAppBotLog, OperatorStatus, WhatsAppMessage } from '../domain/whatsapp';
import { WhatsAppService } from '../services/whatsappService';
import { BaileysService } from '../services/baileysService';
import { supabase } from '../lib/supabase';

interface WhatsAppState {
  activeTab: string;
  connectionStatus: WhatsAppConnectionStatus | null;
  conversations: WhatsAppConversation[];
  activeConversationId: string | null;
  operators: OperatorStatus[];
  logs: WhatsAppBotLog[];
  loading: boolean;
  error: string | null;
  showQrModal: boolean;
  pairingMode: 'qr' | 'pairing';
  
  setActiveTab: (tab: string) => void;
  setActiveConversationId: (id: string | null) => void;
  setShowQrModal: (show: boolean) => void;
  setPairingMode: (mode: 'qr' | 'pairing') => void;
  fetchData: () => Promise<void>;
  sendMessage: (conversationId: string, text: string, sender?: 'user' | 'bot' | 'operator') => void;
  sendMedia: (conversationId: string, file: File, caption?: string) => Promise<void>;
  addInternalNote: (conversationId: string, note: string) => void;
  applyAiSuggestedReply: (conversationId: string) => void;
  connect: (mode?: 'qr' | 'pairing', phoneNumber?: string) => Promise<void>;
  confirmAuthentication: () => Promise<void>;
  regenerateBaileysQr: () => void;
  disconnect: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({
  activeTab: 'conversations',
  connectionStatus: null,
  conversations: [],
  activeConversationId: 'conv-1',
  operators: [],
  logs: [],
  loading: true,
  error: null,
  showQrModal: false,
  pairingMode: 'qr',
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setShowQrModal: (show) => set({ showQrModal: show }),
  setPairingMode: (mode) => set({ pairingMode: mode }),

  fetchData: async () => {
    try {
      set({ loading: true, error: null });
      const [statusData, convData, logsData, opData] = await Promise.all([
        WhatsAppService.getConnectionStatus(),
        WhatsAppService.getActiveConversations(),
        WhatsAppService.getBotLogs(),
        WhatsAppService.getOperators(),
      ]);
      set({ 
        connectionStatus: statusData, 
        conversations: convData, 
        logs: logsData,
        operators: opData,
        loading: false 
      });
    } catch {
      set({ error: 'Gagal memuat data WhatsApp Center', loading: false });
    }
  },

  sendMessage: async (conversationId, text, sender = 'operator') => {
    if (!text.trim()) return;
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName: sender === 'operator' ? 'Admin PUPR' : 'AI Assistant PUPR',
      text,
      timestamp: new Date(),
      status: 'sent',
    };

    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: text,
            timestamp: new Date(),
            status: sender === 'operator' ? 'active' : c.status,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      }),
    }));

    // Send via API
    try {
      const apiResult = await WhatsAppService.sendMessageApi(conversationId, text, sender);
      if (apiResult?.updatedConversation) {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...apiResult.updatedConversation,
                timestamp: new Date(apiResult.updatedConversation.timestamp),
                messages: (apiResult.updatedConversation.messages || []).map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                })),
              };
            }
            return c;
          }),
        }));
      }
    } catch (e) {
      console.warn('Error syncing message with backend:', e);
    }
  },

  sendMedia: async (conversationId, file, caption = '') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const type = file.type.startsWith('image/') ? 'image' : 'document';
          const apiResult = await WhatsAppService.sendMediaApi(
            conversationId, 
            base64Data, 
            type, 
            caption, 
            file.name, 
            file.type
          );
          
          if (apiResult?.saved) {
             // Append visually
             set((state) => ({
                conversations: state.conversations.map((c) => {
                  if (c.id === conversationId) {
                    return {
                      ...c,
                      lastMessage: caption || '[Media]',
                      timestamp: new Date(),
                      messages: [...c.messages, {
                        ...apiResult.saved,
                        timestamp: new Date(apiResult.saved.timestamp)
                      }],
                    };
                  }
                  return c;
                }),
              }));
          }
          resolve();
        } catch (e) {
          console.error(e);
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  addInternalNote: async (conversationId, note) => {
    if (!note.trim()) return;
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            notes: [...(c.notes || []), note],
          };
        }
        return c;
      }),
    }));
    await WhatsAppService.addNoteApi(conversationId, note);
  },

  applyAiSuggestedReply: (conversationId) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (conv && conv.aiSuggestedReply) {
      get().sendMessage(conversationId, conv.aiSuggestedReply.text, 'bot');
    }
  },

  connect: async (mode = 'qr', phoneNumber?: string) => {
    try {
      set({ loading: true, error: null });
      const handshake = await BaileysService.startBaileysHandshake(mode, phoneNumber);
      set({ 
        connectionStatus: handshake.status,
        loading: false,
        showQrModal: true,
        pairingMode: mode,
      });
    } catch {
      set({ error: 'Koneksi Baileys gagal', loading: false });
    }
  },

  regenerateBaileysQr: () => {
    const freshQr = BaileysService.generateBaileysQrString();
    set((state) => ({
      connectionStatus: state.connectionStatus ? {
        ...state.connectionStatus,
        status: 'qr_ready',
        qrCodeRaw: freshQr,
        lastSync: new Date(),
      } : null
    }));
  },

  confirmAuthentication: async () => {
    try {
      set({ loading: true });
      const status = await BaileysService.confirmAuthentication();
      set({
        connectionStatus: status,
        loading: false,
        showQrModal: false,
      });
    } catch {
      set({ error: 'Autentikasi gagal', loading: false });
    }
  },

  disconnect: async () => {
    try {
      set({ loading: true, error: null });
      const status = await BaileysService.disconnectBaileys();
      set({ 
        connectionStatus: status,
        loading: false,
        showQrModal: false
      });
    } catch {
      set({ error: 'Gagal memutuskan koneksi', loading: false });
    }
  },

  refreshConnection: async () => {
    try {
      set({ error: null });
      const data = await WhatsAppService.getConnectionStatus();
      set({ connectionStatus: data });
    } catch {
      set({ error: 'Gagal memperbarui status koneksi' });
    }
  },

  refreshLogs: async () => {
    try {
      const data = await WhatsAppService.getBotLogs();
      set({ logs: data });
    } catch {
      set({ error: 'Gagal memperbarui bot logs' });
    }
  }
}));

export function useWhatsApp() {
  const store = useWhatsAppStore();
  
  useEffect(() => {
    if (!store.conversations.length) {
      store.fetchData();
    }

    // Supabase Realtime Subscription
    const channel = supabase.channel('whatsapp_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wa_messages' },
        (payload) => {
          console.log('[Supabase Realtime] Pesan baru:', payload);
          // Fetch ulang data agar data conversation dan message terbaru termuat 
          // (ideal nya di-merge ke state lokal untuk optimasi)
          store.fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wa_conversations' },
        (payload) => {
          console.log('[Supabase Realtime] Update percakapan:', payload);
          store.fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return store;
}

