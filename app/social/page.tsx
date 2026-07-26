'use client';

import React, { useState } from 'react';
import { SocialKPI } from '@/components/social/SocialKPI';
import { UnifiedInbox } from '@/components/social/UnifiedInbox';
import { ConversationView } from '@/components/social/ConversationView';
import { AIAssistant } from '@/components/social/AIAssistant';
import { SocialAnalytics } from '@/components/social/SocialAnalytics';
import { SocialListeningFeed } from '@/components/social/SocialListeningFeed';
import {
  ShieldCheck,
  Radio,
  Building2,
  Video,
  Share2,
  ExternalLink,
  Sparkles,
  FileText,
  AlertTriangle,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { ExecutiveBriefingModal } from '@/components/social/ExecutiveBriefingModal';
import { RAGSearchModal } from '@/components/social/RAGSearchModal';
import { TrendForecastModal } from '@/components/social/TrendForecastModal';
import { NativeGatewayModal } from '@/components/social/NativeGatewayModal';

export default function SocialMediaCommandCenter() {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isRagOpen, setIsRagOpen] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isNativeOpen, setIsNativeOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-12">
      {/* Top Banner Ticker */}
      <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900/80 border border-blue-500/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>PSIC LIVE CONNECTED</span>
          </div>
          <span className="text-xs text-slate-300 hidden sm:inline">
            11 Kanal Omnichannel Terintegrasi • 6-Tier Hierarchical AI Routing Engine (PURI)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/puri-meet"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            <span>PURI Meet Kolaborasi</span>
          </Link>
          <Link
            href="/whatsapp"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>WA Command Center</span>
          </Link>
        </div>
      </div>

      {/* 🚨 KRITIS EMERGENCY ALERT BANNER */}
      <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-slate-900 border border-rose-500/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
            🚨 DARURAT KRITIS (SLA 2 JAM)
          </span>
          <span className="text-xs font-bold text-white">
            Jembatan Penghubung Cikajang Amblas akibat Banjir Bandang — Akses jalan terputus
          </span>
          <span className="text-xs text-rose-300 hidden md:inline">
            • Bidang SDA & Bina Marga dikerahkan
          </span>
        </div>
        <button
          onClick={() => setIsBriefingOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lihat Laporan Darurat Kadis</span>
        </button>
      </div>

      {/* Main Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <span>PURI Social Intelligence Center (PSIC)</span>
            <span className="text-xs bg-purple-950 text-purple-300 border border-purple-700/50 px-2.5 py-0.5 rounded-full font-mono font-normal">
              v2.0 Enterprise
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            AI Omnichannel Social Media Command Center — Dinas PUPR Kabupaten Garut
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNativeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all border border-emerald-400/30 shadow-lg shadow-emerald-600/20"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>🌐 Supabase-Native Gateway (0 Rupiah)</span>
          </button>
          <button
            onClick={() => setIsRagOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold transition-all border border-blue-500/40 shadow-md"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>📚 SOP RAG Search</span>
          </button>
          <button
            onClick={() => setIsTrendOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold transition-all border border-purple-500/40 shadow-md"
          >
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>📈 AI Trend Forecast</span>
          </button>
          <button
            onClick={() => setIsBriefingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 border border-purple-500/30"
          >
            <FileText className="w-4 h-4" />
            <span>📑 AI Executive Briefing</span>
          </button>
        </div>
      </div>

      {/* Top KPIs & Digital Reputation Index */}
      <SocialKPI />

      {/* Row 1: Live Social Feed (8 cols) & Analytics (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SocialListeningFeed />
        </div>
        <div className="lg:col-span-4">
          <SocialAnalytics />
        </div>
      </div>

      {/* Row 2: Unified Inbox (4 cols), Conversation View (5 cols), AI Assistant (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <UnifiedInbox onSelectMessage={setSelectedMessage} />
        </div>
        <div className="lg:col-span-5">
          <ConversationView message={selectedMessage} />
        </div>
        <div className="lg:col-span-3">
          <AIAssistant message={selectedMessage} />
        </div>
      </div>

      {/* Modals */}
      <ExecutiveBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
      />
      <RAGSearchModal
        isOpen={isRagOpen}
        onClose={() => setIsRagOpen(false)}
      />
      <TrendForecastModal
        isOpen={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
      />
      <NativeGatewayModal
        isOpen={isNativeOpen}
        onClose={() => setIsNativeOpen(false)}
      />
    </div>
  );
}
