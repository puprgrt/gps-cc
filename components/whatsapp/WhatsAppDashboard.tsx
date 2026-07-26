'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppQrModal } from './WhatsAppQrModal';
import { WhatsAppFrontLogin } from './WhatsAppFrontLogin';
import { WhatsAppRightQrPanel } from './WhatsAppRightQrPanel';
import { WhatsAppLogViewer } from './WhatsAppLogViewer';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, MessageSquare, Terminal, RefreshCw, Phone, CheckCircle, 
  Clock, Search, Filter, Send, Paperclip, Smile, Image as ImageIcon, 
  FileText, User, MapPin, Star, Bot, Sparkles, UserCheck, 
  ArrowUpRight, ArrowDownRight, MoreVertical, Bookmark, Share2, 
  Tag, Plus, ShieldCheck, X, Activity, Layers, CornerDownRight, Check, ChevronLeft,
  Download, Eye, ExternalLink, Film, Mic
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const BIDANG_PUPR_LIST = [
  { id: 'ALL', label: 'Semua Bidang', badge: '🏛️ Semua', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { id: 'BINA_MARGA', label: 'Bina Marga', badge: '🛣️ Bina Marga', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'SDA', label: 'SDA (Irigasi)', badge: '💧 SDA', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung', badge: '🏢 Bangunan Gedung', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'PENATAAN_RUANG', label: 'Penataan Ruang', badge: '🗺️ Penataan Ruang', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'AMPL', label: 'AMPL (SPAM)', badge: '🚰 AMPL', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'JASA_KONSTRUKSI', label: 'Jasa Konstruksi', badge: '🏗️ Jasa Konstruksi', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'SEKRETARIAT', label: 'Sekretariat', badge: '📋 Sekretariat', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
];

const PURI_SMART_LABELS = [
  { name: 'PBG', color: 'bg-emerald-500', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', bidang: 'Bangunan Gedung' },
  { name: 'SLF', color: 'bg-blue-500', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40', bidang: 'Bangunan Gedung' },
  { name: 'KRK', color: 'bg-amber-500', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', bidang: 'Penataan Ruang' },
  { name: 'PKKPR', color: 'bg-purple-500', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40', bidang: 'Penataan Ruang' },
  { name: 'Siteplan', color: 'bg-violet-500', badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40', bidang: 'Penataan Ruang' },
  { name: 'Jalan', color: 'bg-amber-500', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', bidang: 'Bina Marga' },
  { name: 'Jembatan', color: 'bg-orange-500', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40', bidang: 'Bina Marga' },
  { name: 'Drainase', color: 'bg-cyan-500', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', bidang: 'SDA' },
  { name: 'Irigasi', color: 'bg-sky-500', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40', bidang: 'SDA' },
  { name: 'SPAM', color: 'bg-teal-500', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40', bidang: 'AMPL' },
  { name: 'Sanitasi', color: 'bg-cyan-600', badgeColor: 'bg-cyan-600/20 text-cyan-200 border-cyan-600/40', bidang: 'AMPL' },
  { name: 'Jasa Konstruksi', color: 'bg-indigo-500', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', bidang: 'Jasa Konstruksi' },
  { name: 'Administrasi', color: 'bg-slate-400', badgeColor: 'bg-slate-400/20 text-slate-300 border-slate-400/40', bidang: 'Sekretariat' },
  { name: 'Pengaduan', color: 'bg-rose-500', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40', bidang: 'Umum' },
  { name: 'Informasi', color: 'bg-slate-400', badgeColor: 'bg-slate-400/20 text-slate-300 border-slate-400/40', bidang: 'Umum' },
  { name: 'Kritis', color: 'bg-rose-600', badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-600/40', bidang: 'Darurat' },
];

export function WhatsAppDashboard() {
  const router = useRouter();
  const { 
    connectionStatus, 
    conversations, 
    activeConversationId, 
    setActiveConversationId,
    operators,
    logs,
    sendMessage,
    sendMedia,
    addInternalNote,
    applyAiSuggestedReply,
    refreshConnection,
    setShowQrModal,
    connect,
    pairingMode,
    setPairingMode,
    regenerateBaileysQr,
    confirmAuthentication,
    disconnect
  } = useWhatsApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'pending' | 'ai' | 'operator' | 'resolved'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterBidang, setFilterBidang] = useState<string>('ALL');
  const [replyMode, setReplyMode] = useState<'reply' | 'internal_note'>('reply');
  const [messageText, setMessageText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [dateFilter, setDateFilter] = useState('Hari Ini');
  const [mobileTab, setMobileTab] = useState<'list' | 'chat' | 'info'>('chat');
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'qr' | 'logs'>('info');
  const [dashboardView, setDashboardView] = useState<'chats' | 'logs'>('chats');

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Filtering conversations using PURI 6-Tier rules (Bidang, Smart Labels, Status)
  const filteredConversations = conversations.filter((conv) => {
    const matchesQuery = 
      conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactNumber.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterCategory === 'all' ? true :
      filterCategory === 'pending' ? conv.status === 'pending' :
      filterCategory === 'ai' ? conv.status === 'bot_handling' :
      filterCategory === 'operator' ? conv.status === 'active' :
      conv.status === 'resolved';

    const matchesTag = selectedTag ? 
      conv.category === selectedTag || 
      conv.tags?.includes(selectedTag) || 
      conv.smartLabels?.includes(selectedTag) : true;

    const matchesBidang = filterBidang === 'ALL' ? true :
      Array.isArray(conv.bidang) 
        ? conv.bidang.includes(filterBidang) 
        : conv.bidang === filterBidang;

    return matchesQuery && matchesFilter && matchesTag && matchesBidang;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    sendMessage(activeConversation.id, messageText, 'operator');
    setMessageText('');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    try {
      setIsUploading(true);
      await sendMedia(activeConversation.id, file, `File: ${file.name}`);
    } catch (error) {
      console.error('Failed to upload', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveInternalNote = () => {
    if (!internalNoteText.trim() || !activeConversation) return;
    addInternalNote(activeConversation.id, internalNoteText);
    setInternalNoteText('');
  };

  // Analytics Donut Chart Data
  const donutData = [
    { name: 'AI', value: 108, color: '#2E7D32' },
    { name: 'Operator', value: 34, color: '#0F4C81' },
    { name: 'Belum Dibalas', value: 14, color: '#F6B100' },
  ];

  // Real Analytics Data based on `conversations`
  const totalChatCount = conversations.length;
  const pendingCount = conversations.filter(c => c.status === 'pending').length;
  const aiCount = conversations.filter(c => c.status === 'bot_handling').length;
  const operatorCount = conversations.filter(c => c.status === 'active' || c.status === 'resolved').length;
  
  // Keep sparkline visual mock data for now, but update the big numbers
  const totalChatSpark = [110, 115, 118, 122, 126, 124, 126.5];
  const pendingSpark = [90, 88, 85, 82, 80, 79, 78];
  const aiSpark = [650, 700, 740, 780, 810, 830, 856];
  const operatorSpark = [290, 295, 305, 312, 320, 328, 331];
  const responseTimeSpark = [3.5, 3.2, 3.0, 2.8, 2.6, 2.5, 2.34];

  // Render Front QR Gateway when not logged in / not connected
  if (connectionStatus?.status !== 'connected') {
    return (
      <div className="space-y-5 pb-8">
        <WhatsAppFrontLogin 
          connectionStatus={connectionStatus}
          pairingMode={pairingMode}
          setPairingMode={setPairingMode}
          regenerateBaileysQr={regenerateBaileysQr}
          confirmAuthentication={confirmAuthentication}
          connect={connect}
          refreshConnection={refreshConnection}
          logs={logs}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. SLEEK SMART FRONT OFFICE HEADER BAR (1 BARIS BERKELAS)      */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-card rounded-2xl border border-white/10 px-5 py-4 shadow-xl bg-gradient-to-r from-[#0F4C81]/40 via-[#161B22] to-[#0D1117] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-extrabold text-white tracking-tight truncate">
                Smart Front Office — WhatsApp Center PUPR Garut
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                24/7 ONLINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ⚡ 6-Tier AI Routing
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Pusat pelayanan obrolan publik & aduan infrastruktur terintegrasi PURI Multi-Model AI Orchestrator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Server Connection Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-300 font-mono text-[11px]">
              {connectionStatus?.phoneNumber || '+62 812-3456-7890'}
            </span>
            <button
              onClick={() => {
                setShowQrModal(true);
                connect('qr');
                setRightPanelTab('qr');
                setMobileTab('info');
              }}
              className="text-[10px] text-emerald-400 font-bold hover:underline ml-1"
            >
              [QR]
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshConnection}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Refresh Status Server"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Direct AI Center Config Button */}
          <button
            onClick={() => router.push('/ai-dashboard')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg border border-emerald-400/30 transition-all flex items-center gap-1.5 group cursor-pointer"
            title="Buka AI Center untuk mengelola pengaturan Bot, Model, dan Prompt"
          >
            <Bot className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>⚙️ Pengaturan di AI Center</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CLEAN MINIMAL 4-CARD STATUS BAR (BERSIH & ELEGAN)           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL ANTREAN CHAT</div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">{totalChatCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DIJAWAB OTOMATIS AI PURI</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">{aiCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DITANGANI OPERATOR</div>
            <div className="text-xl font-extrabold text-sky-400 font-mono mt-0.5">{operatorCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RATA-RATA RESPON SLA</div>
            <div className="text-xl font-extrabold text-purple-400 font-mono mt-0.5">2m 34s</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SLEEK APPLE-STYLE SEGMENTED VIEW SWITCHER                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDashboardView('chats')}
            className={`py-1.5 px-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'chats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ruang Percakapan & Operator</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">
              {filteredConversations.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardView('logs')}
            className={`py-1.5 px-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'logs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Terminal Log Baileys Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 px-3 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Baileys MD: <strong>v6.7.8</strong></span>
        </div>
      </div>

      {dashboardView === 'logs' ? (
        /* Full-width Log Viewer View */
        <div className="animate-fade-in">
          <WhatsAppLogViewer />
        </div>
      ) : (
        /* 3-Column Command Center Chat View */
        <div>
          {/* Mobile Screen Segmented Navigation (xl:hidden) */}
          <div className="xl:hidden flex items-center justify-between bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs shadow-md mb-3">
            <button
              onClick={() => setMobileTab('list')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-xs ${
                mobileTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Daftar Chat</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">{filteredConversations.length}</span>
            </button>

            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-xs ${
                mobileTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ruang Chat</span>
            </button>

            <button
              onClick={() => setMobileTab('info')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-xs ${
                mobileTab === 'info'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Info & AI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">

        {/* =========================================================== */}
        {/* COLUMN 1: CONVERSATION LIST (3 Cols)                       */}
        {/* =========================================================== */}
        <div className={`xl:col-span-3 glass-card rounded-2xl border border-white/10 overflow-hidden shadow-card flex-col h-[720px] ${mobileTab === 'list' ? 'flex' : 'hidden xl:flex'}`}>
          {/* List Header */}
          <div className="p-3.5 border-b border-white/10 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                DAFTAR PERCAKAPAN
              </h2>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                  {conversations.length}
                </span>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Cari kontak atau pesan..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-black/30 p-1 rounded-lg border border-white/5 text-[10px]">
              <button
                onClick={() => setFilterCategory('all')}
                className={`py-1 rounded font-medium transition-colors ${filterCategory === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterCategory('pending')}
                className={`py-1 rounded font-medium transition-colors ${filterCategory === 'pending' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Belum
              </button>
              <button
                onClick={() => setFilterCategory('ai')}
                className={`py-1 rounded font-medium transition-colors ${filterCategory === 'ai' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                AI
              </button>
              <button
                onClick={() => setFilterCategory('operator')}
                className={`py-1 rounded font-medium transition-colors ${filterCategory === 'operator' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Operator
              </button>
            </div>

            {/* Filter 7 Bidang PUPR */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              {BIDANG_PUPR_LIST.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setFilterBidang(b.id)}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap font-medium flex items-center gap-1 ${
                    filterBidang === b.id 
                      ? 'bg-garut-blue/40 text-blue-200 border-blue-400 shadow-sm' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-slate-500'
                  }`}
                >
                  <span>{b.badge}</span>
                </button>
              ))}
            </div>

            {/* Filter Smart Labels PURI */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              {PURI_SMART_LABELS.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                  className={`text-[8px] px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                    selectedTag === tag.name 
                      ? 'bg-blue-500/30 text-blue-300 border-blue-400 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-slate-500'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Cards Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileTab('chat');
                  }}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 relative ${
                    isSelected ? 'bg-blue-600/15 border-l-4 border-l-blue-500' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-bold text-xs">
                      {conv.contactName.startsWith('+') ? <User className="w-4 h-4 text-blue-400" /> : conv.contactName.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-semibold text-white truncate">{conv.contactName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(conv.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 truncate leading-tight mb-1.5">
                      {conv.lastMessage}
                    </p>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-wrap">
                          {conv.status === 'pending' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                              Belum Dibalas
                            </span>
                          )}
                          {conv.status === 'bot_handling' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                              AI Menjawab
                            </span>
                          )}
                          {conv.status === 'active' && (
                            <span className="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-medium">
                              Operator
                            </span>
                          )}
                          {conv.status === 'resolved' && (
                            <span className="text-[9px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-1.5 py-0.2 rounded font-medium">
                              Selesai
                            </span>
                          )}

                          {/* PURI Priority / Emergency badge */}
                          {conv.prioritas === 'KRITIS' && (
                            <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1.5 py-0.2 rounded font-bold animate-pulse flex items-center gap-0.5">
                              ⚡ KRITIS
                            </span>
                          )}

                          {/* Bidang Badge */}
                          {conv.bidang && (
                            <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-medium truncate max-w-[110px]">
                              🏛️ {Array.isArray(conv.bidang) ? conv.bidang.join('+') : conv.bidang}
                            </span>
                          )}
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Smart Labels list row */}
                      {conv.smartLabels && conv.smartLabels.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {conv.smartLabels.slice(0, 3).map((lbl, idx) => (
                            <span key={idx} className="text-[8px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 border border-white/10">
                              #{lbl}
                            </span>
                          ))}
                          {conv.smartLabels.length > 3 && (
                            <span className="text-[8px] text-slate-400">+{conv.smartLabels.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================== */}
        {/* COLUMN 2: EXECUTIVE SMART CHAT CONSOLE (5 Cols)             */}
        {/* =========================================================== */}
        <div className={`xl:col-span-5 glass-card rounded-2xl border border-white/10 overflow-hidden shadow-card flex-col h-[720px] bg-[#090D16]/80 ${mobileTab === 'chat' ? 'flex' : 'hidden xl:flex'}`}>
          {activeConversation ? (
            <>
              {/* --------------------------------------------------------- */}
              {/* 1. EXECUTIVE WORKBENCH HEADER                             */}
              {/* --------------------------------------------------------- */}
              <div className="p-3.5 border-b border-white/10 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileTab('list')}
                    className="xl:hidden p-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    title="Kembali ke Daftar Percakapan"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Daftar</span>
                  </button>

                  {/* Avatar with Live Status Ring */}
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-garut-blue to-blue-700 border border-blue-400/40 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                    <User className="w-5 h-5 text-blue-200" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F172A]" title="Online 24/7" />
                  </div>

                  {/* Contact & Active Ticket Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-extrabold text-white tracking-wide truncate">
                        {activeConversation.contactName}
                      </h3>
                      
                      {/* Official PURI Ticket Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        #PURI-2024-0514
                      </span>

                      {/* AI vs Operator Status Badge */}
                      {activeConversation.status === 'pending' && (
                        <Badge variant="warning" className="text-[9px] py-0 px-2 font-bold">🟡 Belum Dibalas</Badge>
                      )}
                      {activeConversation.status === 'active' && (
                        <Badge variant="info" className="text-[9px] py-0 px-2 font-bold">🧑‍💻 Operator</Badge>
                      )}
                      {activeConversation.status === 'bot_handling' && (
                        <Badge variant="success" className="text-[9px] py-0 px-2 font-bold">🤖 AI Menjawab</Badge>
                      )}
                      {activeConversation.status === 'resolved' && (
                        <Badge variant="outline" className="text-[9px] py-0 px-2 text-slate-300 font-bold">🟢 Selesai</Badge>
                      )}

                      {/* 7 Bidang PUPR Official Badge */}
                      {activeConversation.bidang && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          🏛️ {Array.isArray(activeConversation.bidang) ? activeConversation.bidang.join(' + ') : activeConversation.bidang}
                        </span>
                      )}

                      {/* Realtime SLA Badge */}
                      {activeConversation.prioritas && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                          activeConversation.prioritas === 'KRITIS'
                            ? 'bg-rose-500/30 text-rose-300 border-rose-500 animate-pulse'
                            : activeConversation.prioritas === 'TINGGI'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {activeConversation.prioritas === 'KRITIS' ? '⚡' : '⏱️'} {activeConversation.prioritas} • SLA: &lt; 15m
                        </span>
                      )}
                    </div>

                    {/* Sub-line Info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">{activeConversation.location || 'Garut, Jawa Barat'}</span>
                      </div>
                      {activeConversation.layanan && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">•</span>
                          <span>Layanan: <strong className="text-sky-300">{activeConversation.layanan}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">•</span>
                        <span>Operator: <strong className="text-emerald-300 font-semibold">{activeConversation.assignedOperator || 'BC-01 (Online)'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Action Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setMobileTab('info')}
                    className="xl:hidden px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">AI Info</span>
                  </button>
                  <button 
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-semibold text-slate-300 hidden md:flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Lihat Detail Kontak & Tiket"
                  >
                    Detail
                  </button>
                  <button 
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Catatan Internal Operasional"
                  >
                    Catatan
                  </button>
                  <button 
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-semibold text-slate-300 hidden lg:flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Transfer ke Bidang PUPR Lain"
                  >
                    Transfer
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Selesaikan Tiket & Arsip"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Selesai</span>
                  </button>
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* 2. CHAT STREAM CANVAS (MODERN GLASSMORPHIC BUBBLES)      */}
              {/* --------------------------------------------------------- */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#090D16]/90 scrollbar-thin relative">
                
                {/* Date / Status Separator Badge */}
                <div className="flex items-center justify-center my-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-[#0F172A] border border-white/10 px-3.5 py-1 rounded-full shadow-sm">
                    Hari Ini • SLA Aktif 24/7 (PURI AI Routing)
                  </span>
                </div>

                {/* Message Bubbles Stream */}
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isBot = msg.sender === 'bot';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-md border ${
                            isUser
                              ? 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 text-slate-100 rounded-tl-sm'
                              : isBot
                              ? 'bg-gradient-to-br from-emerald-900/85 via-emerald-950/90 to-slate-900/95 border-emerald-500/40 text-emerald-100 rounded-tr-sm'
                              : 'bg-gradient-to-br from-[#0F4C81]/90 to-blue-900/95 border-blue-400/40 text-white rounded-tr-sm'
                          }`}
                        >
                          {/* Header Identity for Bot AI / Operator */}
                          {!isUser && (
                            <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold mb-1.5 border-b border-white/15 pb-1.5">
                              <span className="flex items-center gap-1.5">
                                {isBot ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <Bot className="w-3.5 h-3.5 text-emerald-300" />
                                    <span className="text-emerald-300 tracking-wide">PURI AI • 6-TIER SMART RESPONSE</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3.5 h-3.5 text-blue-300" />
                                    <span className="text-blue-200 tracking-wide">🧑‍💻 OPERATOR RESMI PUPR GARUT</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {isBot ? 'Confidence: 98%' : 'Verified'}
                              </span>
                            </div>
                          )}

                          {/* Image Media Attachment Card */}
                          {msg.type === 'image' && (
                            <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 shadow-md bg-black/40 group relative">
                              {msg.metadata?.fileUrl || msg.attachments?.[0]?.url ? (
                                <div className="relative">
                                  <img
                                    src={msg.metadata?.fileUrl || msg.attachments?.[0]?.url}
                                    alt={msg.metadata?.fileName || 'Foto Laporan Warga'}
                                    className="w-full max-h-60 object-cover rounded-t-lg transition-transform group-hover:scale-105"
                                  />
                                  <a
                                    href={msg.metadata?.fileUrl || msg.attachments?.[0]?.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/80 hover:bg-black/90 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm border border-white/20 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-sky-400" /> Buka Foto HD
                                  </a>
                                </div>
                              ) : (
                                <div className="p-5 flex items-center justify-center text-slate-400 gap-2 bg-slate-900/80">
                                  <ImageIcon className="w-6 h-6 text-sky-400 animate-pulse" />
                                  <span>[Lampiran Gambar / Foto Laporan]</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Document PDF/Docx Attachment Card */}
                          {msg.type === 'document' && (
                            <div className={`flex items-center gap-3 p-3 rounded-xl border mb-2.5 shadow-inner ${
                              isUser 
                                ? 'bg-slate-900/60 border-white/10 text-slate-100' 
                                : 'bg-black/30 border-white/15 text-white'
                            }`}>
                              <div className="p-2.5 rounded-lg shrink-0 bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate leading-snug">
                                  {msg.metadata?.fileName || msg.attachments?.[0]?.name || msg.text || 'Dokumen_Permohonan.pdf'}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                  {msg.metadata?.mimetype || 'PDF / Dokumen Resmi PUPR'} 
                                  {msg.metadata?.size ? ` • ${(msg.metadata.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                                </span>
                              </div>
                              {(msg.metadata?.fileUrl || msg.attachments?.[0]?.url) && (
                                <a
                                  href={msg.metadata?.fileUrl || msg.attachments?.[0]?.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shrink-0 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5" /> Buka
                                </a>
                              )}
                            </div>
                          )}

                          {/* Video Attachment Card */}
                          {msg.type === 'video' && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/15 mb-2.5">
                              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-lg shrink-0 border border-purple-500/30">
                                <Film className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">Lampiran Video Rekaman</p>
                                <span className="text-[10px] text-slate-400">Video HD • {msg.metadata?.seconds || 30} detik</span>
                              </div>
                            </div>
                          )}

                          {/* Audio / Voice Note Card */}
                          {msg.type === 'audio' && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/15 mb-2.5">
                              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full shrink-0 border border-emerald-500/30">
                                <Mic className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white">Pesan Suara (Voice Note)</p>
                                <span className="text-[10px] text-slate-400">{msg.metadata?.seconds || 12} detik</span>
                              </div>
                            </div>
                          )}

                          {/* Message Text / Caption */}
                          {msg.text && (
                            <p className="whitespace-pre-line leading-relaxed text-xs">
                              {msg.type === 'document' && msg.metadata?.caption ? msg.metadata.caption : msg.text}
                            </p>
                          )}

                          {/* Timestamp & Delivery Status */}
                          <div
                            className={`text-[9px] mt-2 flex items-center justify-end gap-1 font-mono ${
                              isUser ? 'text-slate-400' : 'text-emerald-200/80'
                            }`}
                          >
                            <span>
                              {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
                            </span>
                            {!isUser && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    Belum ada riwayat pesan untuk percakapan ini.
                  </div>
                )}

                {/* AI Assistant Streaming / Typing Indicator */}
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PURI AI Orchestrator sedang menganalisis pesan...</span>
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* 3. EXECUTIVE SMART COMPOSER (BOTTOM REPLY BAR)            */}
              {/* --------------------------------------------------------- */}
              <div className="p-3.5 border-t border-white/10 bg-[#0F172A]/95 backdrop-blur-md shrink-0 space-y-2.5 shadow-lg">
                
                {/* Mode Switcher Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setReplyMode('reply')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        replyMode === 'reply'
                          ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      💬 Balas Pesan Warga
                    </button>
                    <button
                      onClick={() => setReplyMode('internal_note')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        replyMode === 'internal_note'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      🔒 Catatan Internal Tim
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                    Tekan <strong className="text-slate-400">Enter ↵</strong> untuk kirim
                  </span>
                </div>

                {replyMode === 'reply' ? (
                  <form onSubmit={handleSendMessage} className="space-y-2.5">
                    <textarea
                      value={messageText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageText(e.target.value)}
                      placeholder="Ketik balasan untuk pemohon... (Draf AI otomatis tersedia)"
                      rows={2}
                      className="w-full bg-[#0B0F19]/90 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all resize-none shadow-inner leading-relaxed"
                    />
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold text-slate-300"
                          title="Lampirkan Dokumen/File"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden md:inline">Lampiran</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold text-slate-300"
                          title="Kirim Foto"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden md:inline">Foto</span>
                        </button>
                        <button 
                          type="button" 
                          className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          title="Gunakan Template Cepat"
                        >
                          ⚡ Template
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!messageText.trim() || isUploading}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Mengunggah...' : 'Kirim Balasan'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2.5">
                    <textarea
                      value={internalNoteText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInternalNoteText(e.target.value)}
                      placeholder="Tulis catatan internal untuk koordinasi tim operasional (Rahasia)..."
                      rows={2}
                      className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 resize-none shadow-inner leading-relaxed"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-300/80 flex items-center gap-1 font-medium">
                        🔒 Catatan ini tersimpan secara internal di arsip tiket PURI
                      </span>
                      <button
                        onClick={handleSaveInternalNote}
                        disabled={!internalNoteText.trim()}
                        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                      >
                        Simpan Catatan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-400">Pilih percakapan dari daftar antrean di sebelah kiri.</p>
              <span className="text-[11px] text-slate-500">
                PURI 6-Tier Smart Routing Siap Menganalisis Percakapan Masuk
              </span>
            </div>
          )}
        </div>

        {/* =========================================================== */}
        {/* COLUMN 3: SIDE PANELS & AI CENTER (4 Cols)                 */}
        {/* =========================================================== */}
        <div className={`xl:col-span-4 space-y-4 ${mobileTab === 'info' ? 'block' : 'hidden xl:block'}`}>

          {/* Right Panel Header Sub-Tabs */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-white/10 rounded-xl text-xs shadow-md">
            <button
              onClick={() => setRightPanelTab('info')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'info'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Info Kontak</span>
            </button>

            <button
              onClick={() => setRightPanelTab('qr')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'qr'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kode QR</span>
            </button>

            <button
              onClick={() => setRightPanelTab('logs')}
              className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Log Stream</span>
            </button>
          </div>

          {rightPanelTab === 'qr' ? (
            /* Render QR & Link Code Panel directly in right tab without modal */
            <WhatsAppRightQrPanel />
          ) : rightPanelTab === 'logs' ? (
            /* Render Baileys Terminal Log Stream in Right Column */
            <WhatsAppLogViewer />
          ) : (
            <>
              {/* Panel 1: INFORMASI KONTAK */}
              <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-card space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>INFORMASI KONTAK</span>
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </h3>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeConversation?.contactName || '-'}</h4>
                    <p className="text-xs text-slate-400">{activeConversation?.location || 'Garut, Jawa Barat'}</p>
                    <p className="text-[10px] text-slate-500">Bergabung: {activeConversation?.joinedDate || '14/05/2024 10:10'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2 text-slate-300">
                  <div><span className="text-slate-500">Sumber:</span> WhatsApp</div>
                  <div><span className="text-slate-500">Total Chat:</span> {activeConversation?.totalChatCount || 3}</div>
                </div>

                <button className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 transition-colors">
                  LIHAT PROFIL LENGKAP
                </button>
              </div>

              {/* Panel 2: AI SUGGESTED REPLY */}
              <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-card space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> AI SUGGESTED REPLY
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push('/ai-dashboard')}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Buka AI Center untuk mengatur Model AI Bot dan System Prompt"
                    >
                      <Bot className="w-3 h-3 text-emerald-400" />
                      <span>AI Center</span>
                    </button>
                    <button
                      onClick={() => activeConversation && applyAiSuggestedReply(activeConversation.id)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Gunakan
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5 font-mono whitespace-pre-line max-h-36 overflow-y-auto">
                  {activeConversation?.aiSuggestedReply?.text || 'Waalaikumsalam, terima kasih telah menghubungi Dinas PUPR Kabupaten Garut.'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Confidence Score: <strong className="text-emerald-400">{activeConversation?.aiSuggestedReply?.confidence || 95}%</strong></span>
                  <RefreshCw className="w-3 h-3 text-slate-400 cursor-pointer hover:rotate-180 transition-transform" />
                </div>
              </div>

              {/* Panel 3: STATISTIK HARI INI & AKTIVITAS OPERATOR Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Donut Stats */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 shadow-card flex flex-col justify-between">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">STATISTIK HARI INI</h4>
                  <div className="h-28 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value">
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <span className="text-xs font-bold text-white block leading-none">156</span>
                      <span className="text-[8px] text-slate-400">Total Chat</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-300 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> AI</span>
                      <span>108 (69%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Operator</span>
                      <span>34 (22%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Belum Dibalas</span>
                      <span>14 (9%)</span>
                    </div>
                  </div>
                </div>

                {/* Operator Activity */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 shadow-card flex flex-col justify-between">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">AKTIVITAS OPERATOR</h4>
                  <div className="space-y-2 overflow-y-auto max-h-32 text-xs scrollbar-none">
                    {operators.map((op) => (
                      <div key={op.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-200 truncate max-w-[90px]">{op.name}</span>
                        <span className={`text-[9px] font-medium ${
                          op.status === 'online' ? 'text-emerald-400' :
                          op.status === 'busy' ? 'text-emerald-300/80' : 'text-slate-500'
                        }`}>
                          {op.status === 'online' ? 'Online' : op.status === 'busy' ? 'Membalas chat' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-[10px] font-semibold text-blue-400 hover:underline text-left">
                    LIHAT SEMUA OPERATOR
                  </button>
                </div>
              </div>

              {/* Panel 4: AI SMART ROUTING ENGINE (PURI 6-TIER) & SISTEM LABELING */}
              <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 to-slate-900/60 shadow-card space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> AI ROUTING ENGINE (PURI 6-TIER)
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Aktif • 99% Akurat
                  </span>
                </div>

                {/* 6-Tier Hierarchical Decision Card for Active Conversation */}
                {activeConversation && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">1. Bidang PUPR</span>
                      <span className="text-blue-300 font-bold bg-blue-900/40 px-2 py-0.5 rounded text-[10px] border border-blue-500/30">
                        {Array.isArray(activeConversation.bidang) ? activeConversation.bidang.join(' + ') : (activeConversation.bidang || 'Umum')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">2. Layanan</span>
                      <span className="text-sky-300 font-medium text-[11px] truncate max-w-[150px]">
                        {activeConversation.layanan || 'Pelayanan Umum'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">3. Intent / Permohonan</span>
                      <span className="text-emerald-300 font-semibold text-[11px]">
                        {activeConversation.intent || 'INFORMASI'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">4. Prioritas & SLA</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          activeConversation.prioritas === 'KRITIS' ? 'bg-rose-500/30 text-rose-300 border border-rose-500' :
                          activeConversation.prioritas === 'TINGGI' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {activeConversation.prioritas || 'NORMAL'}
                        </span>
                        <span className="text-[10px] text-slate-300 bg-white/5 px-1.5 py-0.5 rounded">
                          SLA: {activeConversation.sla || '1 Hari'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">5. Operator Bidang</span>
                      <span className="text-white font-medium text-[11px]">
                        {activeConversation.assignedOperator || 'PURI AI Front Office'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">6. AI Confidence</span>
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        ✓ {activeConversation.confidenceScore || 98}% (Lolos Validasi)
                      </span>
                    </div>
                  </div>
                )}

                {/* SMART LABELS LIST & FILTER ENGINE */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                      DAFTAR LABEL PURI (16 KLASIFIKASI)
                    </h4>
                    {selectedTag && (
                      <button 
                        onClick={() => setSelectedTag(null)} 
                        className="text-[9px] text-rose-400 hover:underline font-semibold"
                      >
                        Reset Filter #{selectedTag}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                    {PURI_SMART_LABELS.map((lbl) => {
                      const isActiveFilter = selectedTag === lbl.name;
                      const count = conversations.filter(c => c.category === lbl.name || c.tags?.includes(lbl.name) || c.smartLabels?.includes(lbl.name)).length;
                      return (
                        <button
                          key={lbl.name}
                          onClick={() => setSelectedTag(isActiveFilter ? null : lbl.name)}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-all ${
                            isActiveFilter
                              ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm font-bold'
                              : 'bg-black/30 border-white/10 hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${lbl.color} shrink-0`}></span>
                            <span className="text-[11px] truncate">{lbl.name}</span>
                          </div>
                          <span className="text-[9px] font-mono bg-white/10 px-1.5 py-0.2 rounded text-slate-400">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-white/5">
                  <span>Klik label untuk memfilter daftar percakapan</span>
                  <button 
                    onClick={() => {
                      setFilterBidang('ALL');
                      setSelectedTag(null);
                    }}
                    className="text-blue-400 hover:underline font-semibold"
                  >
                    Reset Semua
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
      </div>
      )}

      {/* QR CODE POPUP MODAL */}
      <WhatsAppQrModal />
    </div>
  );
}

// Sparkline KPI Subcomponent
function KpiCard({ 
  title, 
  value, 
  trend, 
  trendType, 
  data, 
  color 
}: { 
  title: string; 
  value: string; 
  trend: string; 
  trendType: 'up' | 'down'; 
  data: number[]; 
  color: string;
}) {
  const chartData = data.map((val, i) => ({ name: i, value: val }));
  const sanitizedId = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

  return (
    <div className="glass-card p-3.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-card relative overflow-hidden">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xl font-bold text-white font-mono">{value}</span>
          <span className={`text-[10px] font-bold flex items-center ${trendType === 'up' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {trendType === 'up' ? '▲' : '▼'} {trend}
          </span>
        </div>
        <span className="text-[9px] text-slate-500">dari kemarin</span>
      </div>

      <div className="h-8 mt-2 -mx-2 -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`kpi-grad-${sanitizedId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#kpi-grad-${sanitizedId})`} 
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
