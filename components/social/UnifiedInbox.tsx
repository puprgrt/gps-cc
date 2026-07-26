/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Instagram, Facebook, Twitter, MessageCircle, Youtube, Search, Filter, Mail, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'youtube' | 'website' | 'email';
  senderName: string;
  avatar: string;
  preview: string;
  time: string;
  unread: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  confidence: number;
}

const mockMessages: Message[] = [
  { id: '1', platform: 'instagram', senderName: 'Budi Santoso', avatar: 'https://i.pravatar.cc/150?u=1', preview: 'Min, mau tanya persyaratan PBG untuk rumah tinggal 2 lantai apa saja ya? Apakah bisa daftar online?', time: '2m', unread: true, sentiment: 'neutral', category: 'PBG', confidence: 98 },
  { id: '2', platform: 'twitter', senderName: 'Asep Suparman', avatar: 'https://i.pravatar.cc/150?u=2', preview: 'Tolong @puprgarut jalan di depan Pasar Ciawitali rusak parah dan berlubang, sering terjadi kecelakaan apalagi pas hujan. Mohon segera diperbaiki!', time: '15m', unread: true, sentiment: 'negative', category: 'Jalan', confidence: 95 },
  { id: '3', platform: 'facebook', senderName: 'Warga Garut Peduli', avatar: 'https://i.pravatar.cc/150?u=4', preview: 'Alhamdulillah, jalan raya Samarang sudah dihotmix. Hatur nuhun Dinas PUPR Kabupaten Garut atas respon cepatnya. #GarutMaju', time: '1h', unread: true, sentiment: 'positive', category: 'Jalan', confidence: 96 },
  { id: '4', platform: 'whatsapp', senderName: 'Dina', avatar: 'https://i.pravatar.cc/150?u=3', preview: 'Terima kasih, Pak/Bu. Sertifikat Laik Fungsi (SLF) klinik kami sudah terbit. Pelayanannya sangat cepat dan memuaskan.', time: '2h', unread: false, sentiment: 'positive', category: 'SLF', confidence: 99 },
  { id: '5', platform: 'website', senderName: 'Anonim', avatar: 'https://i.pravatar.cc/150?u=5', preview: 'Info syarat Keterangan Rencana Kabupaten (KRK) bisa diunduh di mana ya? Saya cari di menu download belum ketemu.', time: '3h', unread: false, sentiment: 'neutral', category: 'KRK', confidence: 92 },
  { id: '6', platform: 'youtube', senderName: 'Garut Drone Explorer', avatar: 'https://i.pravatar.cc/150?u=6', preview: 'Keren sekali progres pembangunan irigasi di Cisurupan. Semangat terus PUPR Garut, semoga petani kita makin sejahtera.', time: '5h', unread: false, sentiment: 'positive', category: 'Irigasi', confidence: 97 },
];

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
    case 'twitter': return <Twitter className="w-4 h-4 text-sky-400" />;
    case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
    case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
    case 'website': return <Globe className="w-4 h-4 text-teal-400" />;
    case 'email': return <Mail className="w-4 h-4 text-slate-400" />;
    default: return <MessageCircle className="w-4 h-4 text-slate-400" />;
  }
};

const SentimentEmoji = ({ sentiment }: { sentiment: string }) => {
  switch (sentiment) {
    case 'positive': return <span title="Positive">😊</span>;
    case 'neutral': return <span title="Neutral">😐</span>;
    case 'negative': return <span title="Negative">😡</span>;
    default: return <span>😐</span>;
  }
};

export function UnifiedInbox({ onSelectMessage }: { onSelectMessage: (msg: Message) => void }) {
  const [selectedId, setSelectedId] = useState<string>('1');

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-700/50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-white">Unified Inbox</h2>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            6 New
          </Badge>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-white" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['All', 'Unread', 'PBG', 'Complaint'].map((filter, i) => (
            <button key={i} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {mockMessages.map((msg) => (
          <div 
            key={msg.id}
            onClick={() => { setSelectedId(msg.id); onSelectMessage(msg); }}
            className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors relative ${selectedId === msg.id ? 'bg-blue-900/20' : 'hover:bg-slate-700/30'} ${msg.unread ? 'bg-slate-800/30' : ''}`}
          >
            {msg.unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img src={msg.avatar} alt={msg.senderName} className="w-8 h-8 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                    <PlatformIcon platform={msg.platform} />
                  </div>
                </div>
                <div>
                  <h3 className={`text-sm ${msg.unread ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>{msg.senderName}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <SentimentEmoji sentiment={msg.sentiment} />
                    <span className="mx-1">•</span>
                    <span>{msg.category}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400">{msg.time}</span>
            </div>
            <p className={`text-xs mt-2 line-clamp-2 ${msg.unread ? 'text-slate-300 font-medium' : 'text-slate-400'}`}>
              {msg.preview}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="text-[10px] bg-slate-900/50 border-slate-700">
                AI Confidence: {msg.confidence}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
