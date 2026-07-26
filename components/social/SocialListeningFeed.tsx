'use client';

import React, { useEffect, useState } from 'react';
import {
  Twitter,
  Instagram,
  Facebook,
  MessageCircle,
  Youtube,
  Globe,
  Video,
  MapPin,
  RefreshCcw,
  TrendingUp,
  AlertTriangle,
  Send,
  Building2,
  Hash,
  Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';


interface Mention {
  id: string | number;
  author: string;
  username: string;
  content: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'whatsapp' | 'telegram' | 'threads' | 'google_business' | 'website' | 'portal_pengaduan' | 'email';
  time: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  bidang?: string;
  smart_label?: string;
  avatar?: string;
  location?: string | {
    kecamatan?: string;
    desa?: string;
  };
  kecamatan?: string;
  metrics?: {
    likes: number;
    retweets: number;
  };
  likes: number;
  retweets: number;
  timestamp: string;
  isVerified?: boolean;
  isInfluencer?: boolean;
  sentimentRaw?: string;
  emotion?: string;
  topic: string;
  intent?: string;
  priority?: string;
  status?: string;
  location_data?: {
    kecamatan?: string;
    desa?: string;
  };
}

interface TrendingTopic {
  name: string;
  count: number;
}

export function SocialListeningFeed() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMentions = async () => {
    try {
      const res = await fetch('/api/social-listening');
      const data = await res.json();
      if (data.mentions) {
        setMentions(data.mentions);
      }
      if (data.trending) {
        setTrending(data.trending);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch social mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMentions();
    }, 0);

    const channel = supabase
      .channel('public:psic_mentions_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'psic_conversations',
        },
        () => {
          void fetchMentions();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'tiktok':
        return <Video className="w-4 h-4 text-cyan-400" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-400" />;
      case 'threads':
        return <Hash className="w-4 h-4 text-slate-300" />;
      case 'google_business':
        return <MapPin className="w-4 h-4 text-amber-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-violet-400" />;
      case 'website':
      case 'portal_pengaduan':
      default:
        return <Globe className="w-4 h-4 text-teal-400" />;
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    const s = sentiment?.toLowerCase() || 'neutral';
    if (s.includes('positi')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
          Positif
        </span>
      );
    }
    if (s.includes('negati') || s === 'urgent') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-950 text-red-400 border border-red-800">
          Negatif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Netral
      </span>
    );
  };

  const getBidangBadge = (bidang?: string) => {
    if (!bidang) return null;
    const label = bidang.replace(/_/g, ' ');
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/50">
        <Building2 className="w-3 h-3 mr-1 text-blue-400" />
        {label}
      </span>
    );
  };

  const filteredMentions =
    selectedChannel === 'all'
      ? mentions
      : mentions.filter((m) => m.platform.toLowerCase() === selectedChannel.toLowerCase());

  const channels = [
    { id: 'all', label: 'Semua Kanal' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitter', label: 'X (Twitter)' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Live Omnichannel Social Feed</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Realtime PSIC
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitoring otomatis interaksi warga Garut dari 11 kanal komunikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMentions}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh feed"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel Pill Filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5 pb-3 border-b border-slate-800/80">
        {channels.map((chan) => (
          <button
            key={chan.id}
            onClick={() => setSelectedChannel(chan.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedChannel === chan.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {chan.label}
          </button>
        ))}
      </div>

      {/* Mentions Stream */}
      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            Memuat aliran data PSIC Omnichannel...
          </div>
        ) : filteredMentions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Belum ada interaksi pada kanal yang dipilih.
          </div>
        ) : (
          <AnimatePresence>
            {filteredMentions.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                      {getPlatformIcon(item.platform)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {item.author}
                        </span>
                        {item.isVerified && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">
                            ✔ Verified
                          </span>
                        )}
                        {item.isInfluencer && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">
                            ★ Influencer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                        {item.platform} •{' '}
                        {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getBidangBadge(item.bidang)}
                    {getSentimentBadge(item.sentimentRaw || item.sentiment)}
                  </div>
                </div>

                <p className="text-sm text-slate-200 mb-3 leading-relaxed">
                  {item.content}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/40">
                  <div className="flex items-center gap-3">
                    {(typeof item.location === 'object' ? item.location.kecamatan : (item.kecamatan || item.location)) && (
                      <span className="inline-flex items-center text-slate-300">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {typeof item.location === 'object' ? `Kec. ${item.location.kecamatan}` : (item.kecamatan ? `Kec. ${item.kecamatan}` : item.location)}
                      </span>
                    )}
                    {item.emotion && (
                      <span className="text-slate-400">
                        Emosi: <strong className="text-slate-300">{item.emotion}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span>♥ {item.likes}</span>
                    <span>↻ {item.retweets}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
