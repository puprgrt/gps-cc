'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  MoreVertical,
  Building2,
  Video,
  AlertCircle,
  MapPin,
  Bot,
  User,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function ConversationView({ message }: { message: any | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Jika message berupa PSICConversation atau legacy Message, buat ID standar
  const convId = message?.id || '';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!convId) {
        setMessages([]);
        return;
      }

      // Jika memiliki data preview default atau muat pesan contoh
      const defaultMsg = [
        {
          id: '1',
          senderType: 'USER',
          senderName: message?.author?.name || message?.senderName || 'Warga Garut',
          content: message?.title || message?.preview || 'Laporan Pengaduan PUPR',
          createdAt: message?.createdAt || new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          senderType: 'AI_BOT',
          senderName: 'PURI (AI Bot)',
          content: `Halo ${
            message?.author?.name || message?.senderName || 'Warga'
          }, terima kasih telah menghubungi Dinas PUPR Kabupaten Garut. 🙏\n\nAI PURI telah mengklasifikasikan pesan ini ke **${
            message?.bidang || 'Bidang Bina Marga'
          }** dengan prioritas **${message?.priority || 'NORMAL'}**. Tim operator kami akan segera meninjau pesan Anda.`,
          createdAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
        },
      ];

      setMessages(defaultMsg);
    }, 0);

    // Subscribe Realtime ke tabel psic_messages untuk percakapan ini
    const channel = supabase
      .channel(`psic_messages_${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'psic_messages',
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as any;
            if (String(row.conversation_id) === String(convId)) {
              setMessages((prev) => [
                ...prev,
                {
                  id: row.id || `msg-${Date.now()}`,
                  senderType: row.sender_type || 'USER',
                  senderName: row.sender_name || 'Warga Garut',
                  content: row.content || '',
                  createdAt: row.created_at || new Date().toISOString(),
                },
              ]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [convId, message]);

  if (!message) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl h-[700px] flex flex-col items-center justify-center p-8 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Pilih Percakapan Warga</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Pilih salah satu tiket dari kotak masuk Omnichannel di kiri untuk melihat riwayat pesan lengkap, klasifikasi AI 6-Tier PURI, dan memulai kolaborasi.
        </p>
      </div>
    );
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    const sentText = replyText;
    const newMsg = {
      id: `msg-operator-${Date.now()}`,
      senderType: 'OPERATOR',
      senderName: 'Operator PUPR Garut',
      content: sentText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyText('');
    setIsSending(false);

    // Kirim secara asinkron ke Chatwoot via REST API
    try {
      await fetch('/api/psic/chatwoot/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          content: sentText,
          senderName: 'Operator PUPR Garut',
        }),
      });
    } catch {
      // Offline fallback silent
    }
  };

  const openCollaborationRoom = () => {
    const roomName = `psic-${convId}`;
    router.push(`/puri-meet?room=${encodeURIComponent(roomName)}`);
  };

  const isHighPriority = message.priority === 'TINGGI' || message.priority === 'KRITIS';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl h-[700px] flex flex-col overflow-hidden shadow-xl">
      {/* Top Header: Identity & 6-Tier Routing Badge */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-sm">
              {(message.author?.name || message.senderName || 'W').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">
                  {message.author?.name || message.senderName || 'Warga Garut'}
                </h2>
                {(message.author?.isVerified || message.isVerified) && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-bold">
                    ✔ Verified
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="uppercase font-semibold text-blue-400">
                  {message.channelType || message.platform || 'WhatsApp'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                </span>
                <span>•</span>
                <span className="text-purple-300 flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  ⚡ Chatwoot Synced
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCollaborationRoom}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>PURI Meet</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 6-Tier PURI Routing Info Banner */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-blue-950 text-blue-300 border border-blue-800">
              <Building2 className="w-3 h-3 mr-1 text-blue-400" />
              {message.bidang?.replace(/_/g, ' ') || 'BINA MARGA'}
            </span>

            {message.smartLabel && (
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                #{message.smartLabel}
              </span>
            )}

            {message.location?.kecamatan && (
              <span className="inline-flex items-center text-slate-300">
                <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                Kec. {message.location.kecamatan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isHighPriority && (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                <AlertCircle className="w-3 h-3 mr-1" />
                Prioritas Tinggi
              </span>
            )}
            <span className="text-slate-400 font-mono">
              SLA: <strong className="text-emerald-400">2 Jam</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
        <div className="flex justify-center">
          <span className="text-[10px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 font-mono uppercase tracking-wider">
            Percakapan Terenkripsi • AI Omnichannel
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.senderType === 'USER';
          const isAI = msg.senderType === 'AI_BOT';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${isUser ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 border border-slate-700 text-slate-300'
                    : isAI
                    ? 'bg-purple-900/60 border border-purple-600 text-purple-300'
                    : 'bg-blue-600 border border-blue-500 text-white'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : isAI ? <Bot className="w-3.5 h-3.5" /> : 'OP'}
              </div>

              <div
                className={`rounded-2xl p-3.5 border ${
                  isUser
                    ? 'bg-slate-800/80 border-slate-700/70 text-slate-200 rounded-tl-none'
                    : isAI
                    ? 'bg-purple-950/40 border-purple-800/50 text-purple-100 rounded-tr-none'
                    : 'bg-blue-600/20 border-blue-500/40 text-blue-100 rounded-tr-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Input Box */}
      <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Lampirkan foto/dokumen"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Emoji"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Ketik balasan untuk warga (atau perintah /ai untuk draft balasan otomatis)..."
          className="flex-1 px-3.5 py-2 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!replyText.trim() || isSending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Kirim</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
