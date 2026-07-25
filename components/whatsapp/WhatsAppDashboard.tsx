'use client';

import React, { useState } from 'react';
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
  Tag, Plus, ShieldCheck, X, Activity, Layers, CornerDownRight, Check, ChevronLeft
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function WhatsAppDashboard() {
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
  const [replyMode, setReplyMode] = useState<'reply' | 'internal_note'>('reply');
  const [messageText, setMessageText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [dateFilter, setDateFilter] = useState('Hari Ini');
  const [mobileTab, setMobileTab] = useState<'list' | 'chat' | 'info'>('chat');
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'qr' | 'logs'>('info');
  const [dashboardView, setDashboardView] = useState<'chats' | 'logs'>('chats');

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Filtering conversations
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

    const matchesTag = selectedTag ? conv.category === selectedTag || conv.tags?.includes(selectedTag) : true;

    return matchesQuery && matchesFilter && matchesTag;
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

  // Sparkline Mock Datasets
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
    <div className="space-y-5 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* TOP KPI GRID - COMMAND CENTER METRICS                         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* KPI 1: WhatsApp Status */}
        <div className="glass-card p-3.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WHATSAPP STATUS</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Connected</p>
              <p className="text-[10px] text-slate-400 truncate">Aktif: {connectionStatus?.phoneNumber || '+62 812-3456-7890'}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-3">
            <button 
              onClick={() => {
                setRightPanelTab('qr');
                setMobileTab('info');
              }}
              className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3 h-3" /> QR CODE
            </button>
            <button 
              onClick={disconnect}
              className="py-1.5 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Putuskan Koneksi / Log Out"
            >
              PUTUSKAN
            </button>
          </div>
        </div>

        {/* KPI 2: Total Chat */}
        <KpiCard 
          title="TOTAL CHAT" 
          value="1.265" 
          trend="+18.5%" 
          trendType="up" 
          data={totalChatSpark} 
          color="#3b82f6" 
        />

        {/* KPI 3: Belum Dibalas */}
        <KpiCard 
          title="BELUM DIBALAS" 
          value="78" 
          trend="-12.3%" 
          trendType="down" 
          data={pendingSpark} 
          color="#f59e0b" 
        />

        {/* KPI 4: Dijawab AI */}
        <KpiCard 
          title="DIJAWAB AI" 
          value="856" 
          trend="+21.7%" 
          trendType="up" 
          data={aiSpark} 
          color="#10b981" 
        />

        {/* KPI 5: Dijawab Operator */}
        <KpiCard 
          title="DIJAWAB OPERATOR" 
          value="331" 
          trend="+8.2%" 
          trendType="up" 
          data={operatorSpark} 
          color="#0284c7" 
        />

        {/* KPI 6: Rata-Rata Respon */}
        <KpiCard 
          title="RATA-RATA RESPON" 
          value="2m 34s" 
          trend="+9.6%" 
          trendType="up" 
          data={responseTimeSpark} 
          color="#a855f7" 
        />

        {/* KPI 7: Tingkat Kepuasan & Date Filter */}
        <div className="glass-card p-3.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-card relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TINGKAT KEPUASAN</span>
            <div className="relative">
              <select 
                value={dateFilter} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFilter(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
              >
                <option>Hari Ini</option>
                <option>Minggu Ini</option>
                <option>Bulan Ini</option>
              </select>
            </div>
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-white font-mono leading-none">94%</div>
            <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
              {'★'.repeat(5)}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Sangat Baik</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW SWITCHER TABS (CHATS vs REAL-TIME BAILEYS LOGS)    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-white/10 p-1.5 rounded-xl text-xs shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDashboardView('chats')}
            className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'chats'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Ruang Percakapan & Operator</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">
              {filteredConversations.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardView('logs')}
            className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'logs'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Terminal Log Baileys Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 px-2 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Baileys Engine MD: <strong>v6.7.8</strong></span>
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

            {/* Tag Badges row */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {['PBG', 'SLF', 'KRK', 'Pengaduan', 'Urgent'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-[9px] px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                    selectedTag === tag 
                      ? 'bg-blue-500/30 text-blue-300 border-blue-400' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-slate-500'
                  }`}
                >
                  {tag}
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
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
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================== */}
        {/* COLUMN 2: CHAT WINDOW & REPLY BOX (5 Cols)                  */}
        {/* =========================================================== */}
        <div className={`xl:col-span-5 glass-card rounded-2xl border border-white/10 overflow-hidden shadow-card flex-col h-[720px] ${mobileTab === 'chat' ? 'flex' : 'hidden xl:flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Window Header */}
              <div className="p-3.5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setMobileTab('list')}
                    className="xl:hidden p-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    title="Kembali ke Daftar Percakapan"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Daftar</span>
                  </button>
                  <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    <User className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{activeConversation.contactName}</h3>
                      {activeConversation.status === 'pending' && (
                        <Badge variant="warning" className="text-[9px] py-0 px-1.5">Belum Dibalas</Badge>
                      )}
                      {activeConversation.status === 'active' && (
                        <Badge variant="info" className="text-[9px] py-0 px-1.5">Operator</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{activeConversation.location || 'Garut, Jawa Barat'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileTab('info')}
                    className="xl:hidden px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Info & AI</span>
                  </button>
                  <button className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 hidden sm:flex items-center gap-1 transition-colors">
                    Detail
                  </button>
                  <button className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 flex items-center gap-1 transition-colors">
                    Catatan
                  </button>
                  <button className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 hidden sm:flex items-center gap-1 transition-colors">
                    Transfer
                  </button>
                </div>
              </div>

              {/* Chat Stream Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40 scrollbar-thin">
                {/* Date separator */}
                <div className="flex items-center justify-center my-2">
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-white/10 px-3 py-0.5 rounded-full">
                    Hari Ini
                  </span>
                </div>

                {/* Messages stream */}
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
                          className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-white text-slate-900 rounded-tl-none font-normal'
                              : isBot
                              ? 'bg-emerald-600 text-white rounded-tr-none font-normal'
                              : 'bg-blue-600 text-white rounded-tr-none'
                          }`}
                        >
                          {!isUser && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200 mb-1 border-b border-white/20 pb-1">
                              <Bot className="w-3 h-3" /> {msg.senderName || 'AI Assistant PUPR'}
                            </div>
                          )}
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                              isUser ? 'text-slate-500' : 'text-emerald-100'
                            }`}
                          >
                            <span>
                              {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
                            </span>
                            {!isUser && <Check className="w-3 h-3 text-emerald-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Belum ada riwayat pesan untuk percakapan ini.
                  </div>
                )}

                {/* AI Assistant Streaming Indicator */}
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assistant sedang mengetik...</span>
                </div>
              </div>

              {/* Chat Reply Composer (Bottom) */}
              <div className="p-3 border-t border-white/10 bg-slate-900/90 shrink-0 space-y-2">
                {/* Composer Tabs */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-1 text-xs">
                  <button
                    onClick={() => setReplyMode('reply')}
                    className={`pb-1 font-semibold transition-colors ${
                      replyMode === 'reply' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Balas
                  </button>
                  <button
                    onClick={() => setReplyMode('internal_note')}
                    className={`pb-1 font-semibold transition-colors ${
                      replyMode === 'internal_note' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Catatan Internal
                  </button>
                </div>

                {replyMode === 'reply' ? (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <textarea
                      value={messageText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageText(e.target.value)}
                      placeholder="Ketik pesan..."
                      rows={2}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:text-white transition-colors" title="Lampirkan File"><Paperclip className="w-4 h-4" /></button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:text-white transition-colors" title="Kirim Gambar"><ImageIcon className="w-4 h-4" /></button>
                      </div>
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isUploading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> {isUploading ? 'Mengirim...' : 'Kirim'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={internalNoteText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInternalNoteText(e.target.value)}
                      placeholder="Tulis catatan internal untuk tim operator..."
                      rows={2}
                      className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveInternalNote}
                        disabled={!internalNoteText.trim()}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Simpan Catatan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Pilih percakapan dari daftar di sebelah kiri.
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
                  <button
                    onClick={() => activeConversation && applyAiSuggestedReply(activeConversation.id)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Gunakan
                  </button>

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

              {/* Panel 4: LABELS SYSTEM */}
              <div className="glass-card p-3.5 rounded-xl border border-white/10 shadow-card space-y-2">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">LABEL</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PBG</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> SLF</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> KRK / PKKPR</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pengaduan</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Informasi</div>
                </div>
                <button className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 pt-1">
                  <Plus className="w-3 h-3" /> Tambah Label
                </button>
              </div>
            </>
          )}

        </div>
      </div>
      </div>
      )}
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
