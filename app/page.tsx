'use client';

import React from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AIAssistantWidget } from '@/components/dashboard/AIAssistantWidget';
import { 
  Map as MapIcon, FileCheck, Droplet, Waves, 
  MapPin, FileSignature, Building, FileBadge,
  Calendar, CheckCircle, Clock, AlertCircle,
  MessageSquare, UserCheck, Search, Zap, Check, ChevronDown, Sparkles, X, Focus, MessageCircle, Bot
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

import { useDashboard } from '@/hooks/useDashboard';

const trendData = [
  { name: 'Des 2023', Masuk: 2000, Selesai: 1500 },
  { name: 'Jan 2024', Masuk: 3000, Selesai: 2500 },
  { name: 'Feb 2024', Masuk: 4000, Selesai: 3200 },
  { name: 'Mar 2024', Masuk: 5500, Selesai: 4800 },
  { name: 'Apr 2024', Masuk: 6500, Selesai: 6000 },
  { name: 'Mei 2024', Masuk: 7500, Selesai: 7000 },
];

const topKecamatanData = [
  { name: 'Tarogong Kidul', value: 1254 },
  { name: 'Tarogong Kaler', value: 892 },
  { name: 'Garut Kota', value: 743 },
  { name: 'Banyuresmi', value: 612 },
  { name: 'Cibatu', value: 489 },
];

const sentimentData = [
  { name: 'Positif', value: 612, color: '#22c55e' },
  { name: 'Netral', value: 207, color: '#f59e0b' },
  { name: 'Negatif', value: 81, color: '#ef4444' },
];

const slaData = [
  { name: 'Tercapai', value: 97.2, color: '#22c55e' },
  { name: 'Tidak', value: 2.8, color: '#1e293b' },
];

export default function Dashboard() {
  const { metrics, layanan, isLiveSyncing, lastUpdated, refetch } = useDashboard();

  // Helper untuk mendapatkan data per layanan
  const getLayananData = (nama: string) => {
    const item = layanan.find((l) => l.nama.toLowerCase() === nama.toLowerCase());
    return {
      total: item ? item.total.toLocaleString('id-ID') : '0',
      sla: item ? `${item.sla}%` : '0%'
    };
  };

  const krkData = getLayananData('KRK');
  const pkkprData = getLayananData('PKKPR');
  const peilData = getLayananData('Peil Banjir');
  const irigasiData = getLayananData('Irigasi');
  const rumijaData = getLayananData('RUMIJA');
  const siteplanData = getLayananData('Siteplan');
  const pbgData = getLayananData('PBG');
  const slfData = getLayananData('SLF');

  return (
    <div className="flex flex-col gap-4 pb-12 w-full max-w-[1600px] mx-auto">
      
      {/* Realtime Live Sync Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveSyncing ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveSyncing ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-bold text-emerald-400 tracking-wider text-xs uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            LIVE REALTIME SYNC
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline border-l border-white/10 pl-2.5">
            Terakhir diperbarui: <span className="font-mono text-slate-200">{lastUpdated.toLocaleTimeString('id-ID')}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
            Auto-Polling 5s & WebSocket
          </span>
          <button 
            onClick={() => refetch()} 
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-lg border border-white/10 text-slate-200 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            Segarkan Data
          </button>
        </div>
      </div>

      {/* 8 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard 
          title="KRK" subtitle="Keterangan Rencana Kota" value={krkData.total} trend="0%" sla={krkData.sla} slaTarget="98%"
          icon={<MapIcon className="w-5 h-5 text-white" />} color="bg-blue-600"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="PKKPR" subtitle="Persetujuan Kesesuaian Kegiatan" value={pkkprData.total} trend="0%" sla={pkkprData.sla} slaTarget="96%"
          icon={<FileCheck className="w-5 h-5 text-white" />} color="bg-green-600"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="Peil Banjir" subtitle="Rekomendasi Teknis" value={peilData.total} trend="0%" sla={peilData.sla} slaTarget="97%"
          icon={<Droplet className="w-5 h-5 text-white" />} color="bg-cyan-600"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="Irigasi" subtitle="Rekomendasi Teknis" value={irigasiData.total} trend="0%" sla={irigasiData.sla} slaTarget="98%"
          icon={<Waves className="w-5 h-5 text-white" />} color="bg-blue-500"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="RUMIJA" subtitle="Rekomendasi Teknis" value={rumijaData.total} trend="0%" sla={rumijaData.sla} slaTarget="98%"
          icon={<MapPin className="w-5 h-5 text-white" />} color="bg-purple-600"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="Siteplan" subtitle="Pengesahan Siteplan" value={siteplanData.total} trend="0%" sla={siteplanData.sla} slaTarget="97%"
          icon={<FileSignature className="w-5 h-5 text-white" />} color="bg-orange-500"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="PBG" subtitle="Persetujuan Bangunan Gedung" value={pbgData.total} trend="0%" sla={pbgData.sla} slaTarget="97%"
          icon={<Building className="w-5 h-5 text-white" />} color="bg-red-500"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
        <MetricCard 
          title="SLF" subtitle="Sertifikat Laik Fungsi" value={slfData.total} trend="0%" sla={slfData.sla} slaTarget="97%"
          icon={<FileBadge className="w-5 h-5 text-white" />} color="bg-teal-600"
          data={[0, 0, 0, 0, 0, 0, 0, 0, 0]}
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[420px]">
        {/* Executive Summary */}
        <div className="lg:col-span-3 glass-card p-5 flex flex-col">
          <h2 className="text-xs font-bold text-slate-300 mb-4 tracking-wider uppercase flex items-center justify-between">
            <span>EXECUTIVE SUMMARY</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><Zap className="w-3 h-3"/> LIVE</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="flex flex-col gap-1 border-r border-b border-white/5 pb-2 pr-2">
              <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center mb-1">
                <Calendar className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-[9px] text-slate-400 uppercase font-bold">TOTAL PERMOHONAN</span>
              <span className="text-2xl font-bold text-white font-mono leading-none mt-1">
                {metrics ? metrics.totalPermohonan.toLocaleString('id-ID') : '0'}
              </span>
              <span className="text-[9px] text-green-400 mt-1">▲ 0% <span className="text-slate-500">hari ini ({metrics?.hariIni ?? 0})</span></span>
            </div>
            <div className="flex flex-col gap-1 border-b border-white/5 pb-2 pl-2">
              <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center mb-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-[9px] text-slate-400 uppercase font-bold">SELESAI</span>
              <span className="text-2xl font-bold text-white font-mono leading-none mt-1">
                {metrics ? Math.round(metrics.totalPermohonan * (metrics.persentasePenyelesaian / 100)).toLocaleString('id-ID') : '0'}
              </span>
              <span className="text-sm text-green-400 mt-1 font-bold">{metrics?.persentasePenyelesaian ?? 0}%</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-white/5 pt-2 pr-2">
              <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center mb-1">
                <Clock className="w-3 h-3 text-yellow-400" />
              </div>
              <span className="text-[9px] text-slate-400 uppercase font-bold">SEDANG DIPROSES</span>
              <span className="text-2xl font-bold text-white font-mono leading-none mt-1">
                {metrics ? Math.round(metrics.totalPermohonan * (1 - (metrics.persentasePenyelesaian || 0) / 100)).toLocaleString('id-ID') : '0'}
              </span>
              <span className="text-sm text-yellow-400 mt-1 font-bold">{metrics ? (100 - (metrics.persentasePenyelesaian || 0)).toFixed(1) : 0}%</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 pl-2">
              <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center mb-1">
                <AlertCircle className="w-3 h-3 text-orange-400" />
              </div>
              <span className="text-[9px] text-slate-400 uppercase font-bold">PENGADUAN TERBANYAK</span>
              <span className="text-2xl font-bold text-white font-mono leading-none mt-1">
                {metrics?.totalPengaduan ? metrics.totalPengaduan.toLocaleString('id-ID') : '0'}
              </span>
              <span className="text-sm text-orange-400 mt-1 font-bold">{metrics?.totalPengaduan ? 'Jalan & Drainase' : 'Belum Ada'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
             <div className="flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mb-1 text-blue-400"><Clock className="w-3 h-3"/></div>
                <span className="text-[8px] text-slate-400 uppercase font-bold whitespace-nowrap">RATA-RATA WAKTU</span>
                <span className="text-sm font-bold text-white mt-1">0 <span className="text-[10px] font-normal">Hari</span></span>
                <span className="text-[9px] text-slate-400 mt-1">-</span>
             </div>
             <div className="flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mb-1 text-green-400"><UserCheck className="w-3 h-3"/></div>
                <span className="text-[8px] text-slate-400 uppercase font-bold whitespace-nowrap">IKM (INDEX KEPUASAN)</span>
                <span className="text-sm font-bold text-white mt-1">{metrics?.ikm ?? 0}</span>
                <span className="text-[9px] text-emerald-400 mt-1">{metrics?.ikm ? 'Sangat Baik' : '-'}</span>
             </div>
             <div className="flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center mb-1 text-red-400"><AlertCircle className="w-3 h-3"/></div>
                <span className="text-[8px] text-slate-400 uppercase font-bold whitespace-nowrap">PENGADUAN MASUK</span>
                <span className="text-sm font-bold text-white mt-1">{metrics?.totalPengaduan ?? 0}</span>
                <span className="text-[9px] text-slate-400 mt-1">Realtime</span>
             </div>
             <div className="flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center mb-1 text-teal-400"><Zap className="w-3 h-3"/></div>
                <span className="text-[8px] text-slate-400 uppercase font-bold whitespace-nowrap">AI RESPONSES</span>
                <span className="text-sm font-bold text-white mt-1">{metrics?.aiActivity ?? 0}</span>
                <span className="text-[9px] text-emerald-400 mt-1">Sync</span>
             </div>
          </div>
        </div>

        {/* GIS Map */}
        <div className="lg:col-span-6 glass-card p-0 flex flex-col relative overflow-hidden h-[420px]">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <h2 className="text-xs font-bold text-white tracking-wider uppercase bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10">GIS PERMOHONAN REAL-TIME</h2>
            <button className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 text-xs text-slate-200">
              Semua Layanan <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="absolute left-4 top-14 z-10 flex flex-col gap-1 bg-black/40 p-1 rounded-md backdrop-blur-md border border-white/10">
            <button className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded"><span className="text-lg leading-none">+</span></button>
            <button className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded"><span className="text-lg leading-none">-</span></button>
            <button className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded mt-2"><Focus className="w-3 h-3" /></button>
          </div>

          <div className="flex-1 w-full h-full relative border border-white/5 rounded-xl bg-[#091524]">
             {/* Map Placeholder Graphic */}
             <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/4b/Garut_Regency_in_West_Java.svg')] bg-center bg-no-repeat bg-contain filter brightness-0 invert"></div>
             
             {/* Map Data Points Placeholder */}
             <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-50"></div>
             <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full mt-1 ml-1"></div>
             <div className="absolute top-1/4 left-1/4 -mt-4 -ml-4 text-[8px] text-white bg-black/50 px-1 rounded">PAMULIHAN</div>

             <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-yellow-500 rounded-full animate-ping opacity-50"></div>
             <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full mt-1.5 ml-1.5 shadow-[0_0_15px_#facc15]"></div>
             <div className="absolute top-1/2 left-1/2 -mt-4 -ml-4 text-[8px] text-white bg-black/50 px-1 rounded">GARUT KOTA</div>

             <div className="absolute bottom-1/3 right-1/3 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-50"></div>
             <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-red-500 rounded-full mt-2 ml-2 shadow-[0_0_15px_#ef4444]"></div>
             <div className="absolute bottom-1/3 right-1/3 -mt-4 -ml-6 text-[8px] text-white bg-black/50 px-1 rounded">TAROGONG KIDUL</div>

             <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-50"></div>
             <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-green-400 rounded-full mt-[3px] ml-[3px]"></div>
             <div className="absolute top-1/3 right-1/4 -mt-4 -ml-4 text-[8px] text-white bg-black/50 px-1 rounded">KARANGPAWITAN</div>
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span>
              <span className="text-[10px] text-slate-200">Selesai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500"></span>
              <span className="text-[10px] text-slate-200">Proses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
              <span className="text-[10px] text-slate-200">Terlambat</span>
            </div>
          </div>
        </div>

        {/* Social & Sentiment */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          <div className="glass-card p-5 flex-1">
            <h2 className="text-xs font-bold text-slate-300 mb-4 tracking-wider uppercase">SOCIAL MEDIA & KOMUNIKASI</h2>
            <div className="flex justify-between items-center px-1">
              {[
                { name: 'WhatsApp', color: 'bg-green-500', count: 128, label: 'Aktif', icon: <MessageCircle className="w-5 h-5 text-white" /> },
                { name: 'Instagram', color: 'bg-pink-600', count: 86, label: 'Mention', icon: <div className="w-5 h-5 border-2 border-white rounded-md flex items-center justify-center"><div className="w-2 h-2 rounded-full border-2 border-white"></div></div> },
                { name: 'Facebook', color: 'bg-blue-600', count: 64, label: 'Komentar', icon: <div className="text-white font-bold text-lg leading-none">f</div> },
                { name: 'X', color: 'bg-black', count: 42, label: 'Mention', icon: <div className="text-white font-bold leading-none">X</div> },
                { name: 'TikTok', color: 'bg-slate-900', count: 37, label: 'Komentar', icon: <div className="text-white font-bold leading-none">d</div> },
                { name: 'YouTube', color: 'bg-red-600', count: 18, label: 'Komentar', icon: <div className="w-4 h-3 bg-white flex items-center justify-center rounded-[2px]"><div className="w-0 h-0 border-t-2 border-t-transparent border-l-[3px] border-l-red-600 border-b-2 border-b-transparent"></div></div> },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center shadow-lg border border-white/20`}>
                    {s.icon}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-white text-sm leading-tight">{s.count}</span>
                    <span className="text-[8px] text-slate-400">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-5 flex-[1.2] flex flex-col">
            <h2 className="text-xs font-bold text-slate-300 mb-2 tracking-wider uppercase">SENTIMEN MASYARAKAT <span className="text-[9px] text-slate-500 normal-case ml-1">(7 HARI TERAKHIR)</span></h2>
            <div className="flex-1 flex items-center justify-between pr-4">
              <div className="h-32 w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white leading-none">900</span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {sentimentData.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-16">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-bold text-white">{Math.round((item.value/900)*100)}%</span>
                      <span className="text-[10px] text-slate-500">({item.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[300px]">
        {/* Trend Permohonan */}
        <div className="lg:col-span-4 glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase">TREND PERMOHONAN <span className="text-[9px] text-slate-500 normal-case ml-1">(6 BULAN TERAKHIR)</span></h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="text-[10px] text-slate-300">Masuk</span></div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-sm"></span><span className="text-[10px] text-slate-300">Selesai</span></div>
          </div>
          <div className="flex-1 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `${value/1000}K`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="Masuk" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Selesai" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Kecamatan & SLA Performance */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="glass-card p-5 flex flex-col">
            <h2 className="text-xs font-bold text-slate-300 mb-4 tracking-wider uppercase">TOP 5 KECAMATAN <span className="text-[9px] text-slate-500 normal-case ml-1">(PERMOHONAN)</span></h2>
            <div className="flex-1 flex flex-col justify-between py-2">
              {topKecamatanData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-[10px] text-slate-300 truncate">{item.name}</div>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden flex items-center">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(item.value / topKecamatanData[0].value) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-8 text-[10px] font-bold text-white text-right">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-5 flex flex-col items-center text-center">
            <h2 className="text-xs font-bold text-slate-300 mb-2 tracking-wider uppercase w-full text-left">SLA PERFORMANCE</h2>
            <div className="flex-1 w-full relative flex items-center justify-center">
               <div className="w-40 h-24 relative overflow-hidden flex items-end justify-center pb-2">
                  <div className="w-40 h-40 border-[16px] border-white/5 rounded-full absolute top-0"></div>
                  <div className="w-40 h-40 border-[16px] border-green-500 rounded-full absolute top-0" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: 'rotate(-45deg)' }}></div>
                  <div className="flex flex-col items-center">
                     <span className="text-3xl font-bold text-white font-mono leading-none">97.2%</span>
                     <span className="text-[10px] text-slate-400 mt-1">SLA Tercapai</span>
                  </div>
               </div>
            </div>
            <div className="w-full flex justify-between px-4 mt-2 border-t border-white/10 pt-3">
               <div className="text-[10px] text-slate-400">Target 95%</div>
               <div className="text-[10px] text-slate-200 font-bold">Capaian 97.2%</div>
            </div>
          </div>
        </div>

        {/* Pengaduan Terkini */}
        <div className="lg:col-span-3 glass-card p-5 flex flex-col relative overflow-hidden">
          <h2 className="text-xs font-bold text-slate-300 mb-4 tracking-wider uppercase">PENGADUAN TERKINI</h2>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden relative z-10">
             {[
               { title: 'Drainase Tersumbat di Jl. Ahmad Yani', loc: 'Tarogong Kidul', time: '10:21', color: 'bg-orange-500' },
               { title: 'Jalan Rusak di Kp. Sukaluyu', loc: 'Samarang', time: '10:15', color: 'bg-orange-500' },
               { title: 'Lampu Jalan Mati di Jl. Raya Leles', loc: 'Leles', time: '10:08', color: 'bg-red-500' },
               { title: 'Sampah Menumpuk di Pasar Ciawitali', loc: 'Garut Kota', time: '10:02', color: 'bg-red-500' },
             ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                   <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <AlertCircle className="w-3 h-3 text-white" />
                   </div>
                   <div className="flex flex-col flex-1">
                      <span className="text-[11px] text-white font-medium leading-tight">{item.title}</span>
                      <span className="text-[9px] text-slate-400">{item.loc}</span>
                   </div>
                   <span className="text-[10px] text-slate-500 shrink-0">{item.time}</span>
                </div>
             ))}
          </div>
          <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium rounded-lg mt-3 transition-colors">
            Lihat Semua Pengaduan
          </button>
          
          {/* AI Insight Floating Box inside Pengaduan (as per design) */}
          <div className="absolute top-12 -left-32 w-64 bg-blue-900/90 backdrop-blur-md border border-blue-400/30 rounded-xl p-3 shadow-2xl z-20 transform translate-x-12 opacity-90 hidden 2xl:block">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">AI INSIGHT <Sparkles className="w-3 h-3 text-yellow-300"/></span>
             </div>
             <p className="text-[9px] text-slate-200 mb-1">Permohonan PBG dan SLF meningkat signifikan minggu ini.</p>
             <p className="text-[9px] text-slate-200 mb-1">Kecamatan Tarogong Kidul memiliki permohonan tertinggi.</p>
             <p className="text-[9px] text-slate-200 mb-2">Pengaduan terkait drainase meningkat 18%.</p>
             <p className="text-[9px] text-blue-300 italic">AI merekomendasikan penambahan personil verifikator PBG.</p>
          </div>
        </div>
      </div>
      
      {/* Floating AI Assistant Chat */}
      <AIAssistantWidget />

    </div>
  );
}
