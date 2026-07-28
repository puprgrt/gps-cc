'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings, CloudSun, Menu, Search, LogOut } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { toggle, toggleCollapse } = useSidebar();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      setTime(new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
    };
    updateTime();
    const timer = setTimeout(() => setIsMounted(true), 0);
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <header className="h-[72px] flex items-center justify-between px-6 z-40 w-full relative bg-[#0D1117]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SECTION: EXECUTIVE TITLE & GLOBAL SEARCH              */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={toggleCollapse} 
          className="hidden md:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button 
          onClick={toggle} 
          className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-wide truncate">
              EXECUTIVE SMART COMMAND CENTER
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
              🏛️ PUPR GARUT
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              📍 Situ Bagendit
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
            Monitoring, Pengaduan Warga &amp; AI Pelayanan Publik Terintegrasi
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden xl:flex items-center ml-4 w-64 2xl:w-80" suppressHydrationWarning>
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul, layanan, pengaduan..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            suppressHydrationWarning
          />
          <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10">
            Ctrl+K
          </span>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. RIGHT SECTION: TIME/WEATHER, AI STATUS & USER CONTROLS     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-4 lg:gap-6 shrink-0">
        
        {/* Time & Weather Executive Widget */}
        <div className="hidden lg:flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 shadow-sm">
          <div className="flex flex-col text-right">
            <div className="text-sm font-bold text-white font-mono leading-none">
              {isMounted ? time : '10:24:56'} <span className="text-[10px] text-slate-400 font-sans font-normal">WIB</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">Selasa, 14 Mei 2024</span>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col leading-none">
              <span className="text-xs font-extrabold text-white">22°C</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Cerah Berawan</span>
            </div>
          </div>
        </div>

        {/* AI System Status Compact Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900/80 border border-blue-500/30 shadow-sm">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 shrink-0 overflow-hidden p-0.5 shadow-sm">
            <img src="/favicon.ico" alt="PURI" className="w-full h-full object-contain" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-blue-200 tracking-wider">PURI AI ENGINE</span>
              <Badge variant="success" className="text-[8px] px-1.5 py-0">ONLINE</Badge>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              6-Tier Routing • <strong className="text-slate-200">12.350</strong> Docs KB
            </span>
          </div>
        </div>

        {/* User Actions & Notifications (Horizontally Aligned!) */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-white/10 pl-3 sm:pl-4">
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors relative cursor-pointer"
              title="Notifikasi Masuk"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0D1117]">
                12
              </span>
            </button>
            <button 
              onClick={() => router.push('/ai-dashboard')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Pengaturan & AI Center"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          {/* Executive Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-garut-blue to-blue-600 overflow-hidden border border-blue-400/30 shadow-md flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AP'}
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name || "Admin PUPR"}</span>
              <span className="text-[10px] text-slate-400">{user?.role === "operator" ? "Operator TIK" : "Super Admin"}</span>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar Sesi (Logout)"
              className="ml-1.5 p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
      
    </header>
  );
}
