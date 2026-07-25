'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Pause, Trash2, Download, RefreshCw, 
  Search, Filter, Copy, Check, ShieldAlert, Cpu, 
  CheckCircle2, Radio, ArrowDownCircle, Server
} from 'lucide-react';
import { WhatsAppBotLog } from '@/domain/whatsapp';
import { useWhatsAppStore } from '@/hooks/useWhatsApp';

export interface ExtendedLogItem extends WhatsAppBotLog {
  source?: 'baileys_socket' | 'bot_ai' | 'webhook' | 'system';
  rawPayload?: string;
}

export const WhatsAppLogViewer: React.FC = () => {
  const { logs: initialLogs, connectionStatus } = useWhatsAppStore();
  const [logs, setLogs] = useState<ExtendedLogItem[]>(() => [
    {
      id: 'log-b1',
      timestamp: new Date(Date.now() - 1000 * 120),
      event: 'BAILEYS_SOCKET_INIT',
      details: 'Menginisialisasi WASocket (@whiskeysockets/baileys v6.7.8 MD)...',
      level: 'info',
      source: 'baileys_socket',
      rawPayload: JSON.stringify({ version: [2, 3000, 1015901307], printQRInTerminal: true, markOnlineOnConnect: true }, null, 2),
    },
    {
      id: 'log-b2',
      timestamp: new Date(Date.now() - 1000 * 90),
      event: 'AUTH_STATE_LOADED',
      details: 'Memuat kredensial dari ./baileys_auth_garut/creds.json [AES-256-GCM]',
      level: 'info',
      source: 'baileys_socket',
    },
    {
      id: 'log-b3',
      timestamp: new Date(Date.now() - 1000 * 60),
      event: 'CONNECTION_UPDATE',
      details: 'Connection state changed: connecting -> qr_ready',
      level: 'info',
      source: 'baileys_socket',
      rawPayload: JSON.stringify({ connection: 'connecting', qr: '2@BaileysWABot_PUPRGarut_CommandCenter_Token...' }, null, 2),
    },
    ...useWhatsAppStore.getState().logs.map((l) => ({ ...l, source: 'bot_ai' as const })),
  ]);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'baileys'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [standaloneStatus, setStandaloneStatus] = useState<string>('Memeriksa...');
  const [pingMs, setPingMs] = useState<number>(18);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Live polling simulator & real standalone backend sync
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      // Check real standalone Baileys server if available
      try {
        const start = Date.now();
        // If running in browser, we can just call our own Next.js API which routes it.
        const res = await fetch('/api/whatsapp/baileys', { method: 'GET' });
        const latency = Date.now() - start;
        setPingMs(latency > 0 ? latency : 12);

        if (res.ok) {
          const data = await res.json();
          if (data.source === 'standalone_server') {
            setStandaloneStatus(`Standalone Active • ${data.status}`);
          } else {
            setStandaloneStatus('Internal Simulation Engine (Baileys v6.7.8)');
          }
        }
      } catch {
        setStandaloneStatus('Simulation Engine Active');
      }

      // Randomly append real-time telemetry events when live mode is active
      if (Math.random() > 0.65) {
        const events = [
          {
            event: 'BAILEYS_KEEP_ALIVE',
            details: `Ping WebSocket ke web.whatsapp.com [${Math.floor(Math.random() * 15 + 10)}ms ACK]`,
            level: 'info' as const,
            source: 'baileys_socket' as const,
          },
          {
            event: 'PRESENCE_UPDATE',
            details: 'Aktivitas operator PUPR Garut: Chat disinkronkan',
            level: 'info' as const,
            source: 'system' as const,
          },
          {
            event: 'AI_INTENT_CLASSIFY',
            details: 'Klasifikasi pesan baru: Intent "SOP PBG" (Confidence: 96%)',
            level: 'info' as const,
            source: 'bot_ai' as const,
          },
          {
            event: 'SOCKET_EVENT_HEARTBEAT',
            details: 'Sync session token refreshed securely [AES256]',
            level: 'info' as const,
            source: 'baileys_socket' as const,
          },
        ];

        const selectedEvent = events[Math.floor(Math.random() * events.length)];
        const newLogEntry: ExtendedLogItem = {
          id: `log-live-${Date.now()}`,
          timestamp: new Date(),
          event: selectedEvent.event,
          details: selectedEvent.details,
          level: selectedEvent.level,
          source: selectedEvent.source,
        };

        setLogs((prev) => [newLogEntry, ...prev].slice(0, 200));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Manual Trigger Log Injection
  const handleInjectTestLog = () => {
    const injectedLog: ExtendedLogItem = {
      id: `log-manual-${Date.now()}`,
      timestamp: new Date(),
      event: 'MANUAL_DEBUG_PING',
      details: 'Pengujian manual koneksi socket Baileys oleh Operator Command Center',
      level: 'info',
      source: 'baileys_socket',
      rawPayload: JSON.stringify({
        operator: 'Admin PUPR',
        socketStatus: connectionStatus?.status || 'connected',
        timestamp: new Date().toISOString(),
      }, null, 2),
    };
    setLogs((prev) => [injectedLog, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleCopyLog = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyAll = () => {
    const formatted = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.event}] ${l.details}`)
      .join('\n');
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadLogs = () => {
    const content = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.event}] ${l.details}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pupr-baileys-logs-${new Date().toISOString().slice(0, 10)}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs based on query & level
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      levelFilter === 'all' ? true :
      levelFilter === 'baileys' ? log.source === 'baileys_socket' :
      log.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const infoCount = logs.filter((l) => l.level === 'info').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;
  const errorCount = logs.filter((l) => l.level === 'error').length;
  const baileysCount = logs.filter((l) => l.source === 'baileys_socket').length;

  return (
    <div className="glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-slate-950/95 flex flex-col h-[680px]">
      {/* Top Header Controls Bar */}
      <div className="p-3.5 border-b border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                BAILEYS ENGINE REAL-TIME LOGS
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                {isLive ? 'LIVE STREAM' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <Server className="w-3 h-3 text-slate-500" />
              <span>{standaloneStatus}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono">Ping: {pingMs}ms</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLive
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Jeda Stream' : 'Mulai Stream'}</span>
          </button>

          <button
            onClick={handleInjectTestLog}
            className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Simulasikan Uji Ping / Event Socket Baru"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Uji Telemetri</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Tersalin' : 'Salin Semua'}</span>
          </button>

          <button
            onClick={handleDownloadLogs}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh File Log (.log)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bersihkan Semua Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Header KPI Metrics & Search Filter Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
              levelFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            SEMUA ({logs.length})
          </button>

          <button
            onClick={() => setLevelFilter('baileys')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              levelFilter === 'baileys'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-950/40 text-purple-300 border border-purple-500/20 hover:bg-purple-900/40'
            }`}
          >
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>SOCKET ({baileysCount})</span>
          </button>

          <button
            onClick={() => setLevelFilter('info')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
              levelFilter === 'info'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-blue-400 hover:text-white'
            }`}
          >
            INFO ({infoCount})
          </button>

          <button
            onClick={() => setLevelFilter('warn')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
              levelFilter === 'warn'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-amber-400 hover:text-white'
            }`}
          >
            WARN ({warnCount})
          </button>

          <button
            onClick={() => setLevelFilter('error')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
              levelFilter === 'error'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-red-400 hover:text-white'
            }`}
          >
            ERROR ({errorCount})
          </button>
        </div>

        {/* Search Input & Auto-scroll Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci log..."
              className="bg-slate-950 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
              autoScroll
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-500 border-white/10'
            }`}
            title="Gulir otomatis ke atas pada log terbaru"
          >
            <ArrowDownCircle className={`w-3.5 h-3.5 ${autoScroll ? 'text-emerald-400' : ''}`} />
            <span>Auto Scroll</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Console Content */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent bg-slate-950"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 space-y-2">
            <Filter className="w-8 h-8 text-slate-600" />
            <p className="text-xs">Tidak ada log yang sesuai dengan filter kriteria.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            const isBaileys = log.source === 'baileys_socket' || log.event.includes('BAILEYS');
            const isError = log.level === 'error';
            const isWarn = log.level === 'warn';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border transition-all hover:bg-slate-900/80 group flex flex-col gap-1.5 ${
                  isError
                    ? 'bg-red-950/20 border-red-500/30 text-red-200'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : isBaileys
                    ? 'bg-purple-950/15 border-purple-500/30 text-purple-200'
                    : 'bg-slate-900/40 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>

                    {/* Level Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        isError
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isBaileys
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {log.level}
                    </span>

                    {/* Event Tag */}
                    <span className="text-xs font-bold text-white tracking-wide font-mono">
                      {log.event}
                    </span>

                    {/* Source Tag */}
                    {log.source && (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-white/5 rounded border border-white/5">
                        {log.source}
                      </span>
                    )}
                  </div>

                  {/* Copy Line Button */}
                  <button
                    onClick={() => handleCopyLog(`[${timeStr}] [${log.event}] ${log.details}`, log.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-all cursor-pointer"
                    title="Salin baris ini"
                  >
                    {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Main Details Description */}
                <p className="text-xs font-sans text-slate-200 leading-relaxed font-normal pl-0.5">
                  {log.details}
                </p>

                {/* Expanded Raw Payload if present */}
                {log.rawPayload && (
                  <pre className="mt-1 p-2 bg-black/60 rounded-lg border border-white/10 text-[10px] text-emerald-400 font-mono overflow-x-auto">
                    {log.rawPayload}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="p-2.5 bg-slate-900 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3 h-3" /> WASocket Connection Pool: Active
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">MultiFileAuthState: ./baileys_auth_garut</span>
        </div>
        <div>
          <span>Total Baris Log: <strong className="text-white font-mono">{filteredLogs.length}</strong></span>
        </div>
      </div>
    </div>
  );
};
