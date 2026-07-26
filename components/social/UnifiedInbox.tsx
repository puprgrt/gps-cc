'use client';

import React, { useState, useEffect } from 'react';
import {
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Youtube,
  Search,
  Filter,
  Mail,
  Globe,
  Video,
  Send,
  Building2,
  AlertCircle,
  Clock,
  MapPin,
  Hash,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PSICConversation } from '@/domain/psic';
import { supabase } from '@/lib/supabase';

interface UnifiedInboxProps {
  onSelectMessage?: (conversation: PSICConversation) => void;
}


const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'facebook':
      return <Facebook className="w-4 h-4 text-blue-600" />;
    case 'twitter':
    case 'x':
      return <Twitter className="w-4 h-4 text-sky-400" />;
    case 'whatsapp':
      return <MessageCircle className="w-4 h-4 text-emerald-400" />;
    case 'youtube':
      return <Youtube className="w-4 h-4 text-red-500" />;
    case 'tiktok':
      return <Video className="w-4 h-4 text-cyan-400" />;
    case 'telegram':
      return <Send className="w-4 h-4 text-sky-400" />;
    case 'threads':
      return <Hash className="w-4 h-4 text-slate-300" />;
    case 'google_business':
      return <MapPin className="w-4 h-4 text-amber-400" />;
    case 'website':
    case 'portal_pengaduan':
      return <Globe className="w-4 h-4 text-teal-400" />;
    case 'email':
      return <Mail className="w-4 h-4 text-slate-400" />;
    default:
      return <MessageCircle className="w-4 h-4 text-slate-400" />;
  }
};

const SentimentEmoji = ({ sentiment }: { sentiment?: string }) => {
  const s = sentiment?.toLowerCase() || 'netral';
  if (s.includes('positi')) return <span title="Positif">😊</span>;
  if (s.includes('negati')) return <span title="Negatif">😡</span>;
  return <span title="Netral">😐</span>;
};

export function UnifiedInbox({ onSelectMessage }: UnifiedInboxProps) {
  const [conversations, setConversations] = useState<PSICConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterBidang, setFilterBidang] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/psic/omnichannel');
      const json = await res.json();
      if (json?.data?.conversations) {
        setConversations(json.data.conversations);
        if (json.data.conversations.length > 0 && !selectedId) {
          const first = json.data.conversations[0];
          setSelectedId(first.id);
          onSelectMessage?.(first);
        }
      }
    } catch {
      // Abaikan jika error jaringan/offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 0);

    // 1. Supabase Realtime WebSocket subscription untuk pembaruan instan
    const channel = supabase
      .channel('psic_inbox_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'psic_conversations' },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    // 2. Auto-polling setiap 10 detik sebagai pelengkap fallback
    const pollInterval = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (conv: PSICConversation) => {
    setSelectedId(conv.id);
    onSelectMessage?.(conv);
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.author.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel =
      filterChannel === 'all' || c.channelType.toLowerCase() === filterChannel.toLowerCase();
    const matchesBidang =
      filterBidang === 'all' || c.bidang === filterBidang;
    return matchesSearch && matchesChannel && matchesBidang;
  });

  return (
    <div className="flex flex-col h-[700px] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Inbox Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Omnichannel Inbox</h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              {filteredConversations.length} Percakapan
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Realtime Sync
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono hidden sm:inline">
              PSIC
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari warga, judul tiket, atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Kanal (11)</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">X / Twitter</option>
            <option value="youtube">YouTube</option>
          </select>

          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Bidang (7)</option>
            <option value="BINA_MARGA">Bina Marga</option>
            <option value="SDA">Sumber Daya Air</option>
            <option value="BANGUNAN_GEDUNG">Bangunan Gedung</option>
            <option value="PENATAAN_RUANG">Penataan Ruang</option>
            <option value="AMPL">AMPL</option>
            <option value="JASA_KONSTRUKSI">Jasa Konstruksi</option>
            <option value="SEKRETARIAT">Sekretariat</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Memuat kotak masuk PSIC Omnichannel...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada percakapan yang cocok dengan filter Anda.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedId === conv.id;
            const isHighPriority = conv.priority === 'TINGGI' || conv.priority === 'KRITIS';

            return (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-slate-800 border border-slate-700">
                      <PlatformIcon platform={conv.channelType} />
                    </div>
                    <span className="text-sm font-semibold text-white truncate">
                      {conv.author.name}
                    </span>
                    {conv.author.isVerified && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-bold">
                        ✔
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <SentimentEmoji sentiment={conv.sentiment} />
                    <span className="text-[10px] text-slate-400">
                      {new Date(conv.lastMessageAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                  {conv.title}
                </p>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-blue-950 text-blue-300 border border-blue-800">
                      <Building2 className="w-2.5 h-2.5 mr-1 text-blue-400" />
                      {conv.bidang?.replace(/_/g, ' ')}
                    </span>
                    {conv.smartLabel && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        #{conv.smartLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isHighPriority && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-bold bg-red-950 text-red-400 border border-red-800">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                        Prioritas Tinggi
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                      {conv.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
