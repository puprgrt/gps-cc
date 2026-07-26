'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Server,
  Radio,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Database,
  Smartphone,
  Globe,
  Mail,
  Share2,
} from 'lucide-react';

interface NativeGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NativeGatewayModal({ isOpen, onClose }: NativeGatewayModalProps) {
  const [channel, setChannel] = useState<'whatsapp' | 'telegram' | 'website' | 'portal_pengaduan'>('whatsapp');
  const [senderName, setSenderName] = useState('Dedi Mulyana');
  const [kecamatan, setKecamatan] = useState('Tarogong Kidul');
  const [content, setContent] = useState(
    'Lapor Pak, jembatan gantung penghubung desa di Cikajang amblas tergerus banjir bandang semalam. Mohon penanganan darurat!'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/psic/omnichannel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelType: channel,
          externalId: `${channel}_${Date.now()}`,
          authorName: senderName,
          authorUsername: `@${senderName.toLowerCase().replace(/\s+/g, '_')}`,
          content,
          kecamatan,
          desa: 'Desa Mandiri',
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Gagal mengirim simulasi pesan native:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Supabase-Native Omnichannel Gateway (GPS-CC Built-in)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  100% GRATIS (Rp 0 / TANPA TOKEN)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kedaulatan Data Penuh di Server Pemerintah Kabupaten Garut • Tanpa Ketergantungan Pihak Ketiga
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Arsitektur 0-Rupiah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Penyimpanan & WebSocket
                </span>
                <span className="text-sm font-bold text-white">
                  Supabase Realtime (0ms)
                </span>
                <span className="text-[11px] text-emerald-400 block mt-0.5">
                  ✓ Tanpa Biaya Token Webhook
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  WhatsApp Baileys Gateway
                </span>
                <span className="text-sm font-bold text-white">
                  Built-in Server (/server)
                </span>
                <span className="text-[11px] text-blue-400 block mt-0.5">
                  ✓ Tanpa Biaya Per-Pesan Meta
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Kedaulatan & Keamanan Data
                </span>
                <span className="text-sm font-bold text-white">
                  100% Server Pemkab Garut
                </span>
                <span className="text-[11px] text-purple-400 block mt-0.5">
                  ✓ Enkripsi TLS & SQL Strict Rules
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Kanal Terkoneksi (12 Kanal Omnichannel Resmi) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Status Koneksi Semua 12 Kanal Omnichannel Resmi (100% Native Gateway)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
              {[
                { id: 'whatsapp', label: 'WhatsApp Baileys', desc: 'WebSocket Server Unmetered', color: 'text-emerald-400' },
                { id: 'telegram', label: 'Telegram Bot', desc: '@BotFather API Resmi', color: 'text-sky-400' },
                { id: 'instagram', label: 'Instagram DM', desc: '@puprgarut Direct Messenger', color: 'text-pink-400' },
                { id: 'facebook', label: 'Facebook Page', desc: 'Dinas PUPR Garut Messenger', color: 'text-blue-400' },
                { id: 'threads', label: 'Threads', desc: '@puprgarut Public Thread', color: 'text-slate-300' },
                { id: 'twitter', label: 'X / Twitter', desc: '@pupr_garut Tweet mentions', color: 'text-sky-300' },
                { id: 'tiktok', label: 'TikTok', desc: '@puprkabgarut Video comment', color: 'text-cyan-400' },
                { id: 'youtube', label: 'YouTube TV', desc: 'PUPR Garut TV Channel', color: 'text-rose-400' },
                { id: 'google_business', label: 'Google Review', desc: 'Google Maps Ulasan Warga', color: 'text-amber-400' },
                { id: 'website', label: 'Website Chat', desc: 'Supabase Direct Socket 0ms', color: 'text-teal-400' },
                { id: 'portal_pengaduan', label: 'Portal Pemkab', desc: 'SIPPN / Lapor PUPR Garut', color: 'text-indigo-400' },
                { id: 'email', label: 'Email Resmi', desc: 'pupr@garutkab.go.id IMAP', color: 'text-violet-400' },
              ].map((ch) => (
                <div key={ch.id} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${ch.color} truncate`}>
                      {ch.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Uji Kirim Simulasi Inbound */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Uji Kirim Pesan Real-time ke Native Gateway</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pesan di bawah ini akan diproses langsung oleh endpoint <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">POST /api/psic/omnichannel</code> secara gratis tanpa webhook Chatwoot, menghasilkan klasifikasi AI & RAG SOP instan.
            </p>

            <form onSubmit={handleSimulateInbound} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kanal Pengaduan (12 Pilihan Resmi)
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="whatsapp">📱 WhatsApp Baileys (WA Warga)</option>
                    <option value="telegram">✈️ Telegram Bot (@warga_garut)</option>
                    <option value="instagram">📸 Instagram DM (@puprgarut)</option>
                    <option value="facebook">👥 Facebook Messenger (Dinas PUPR)</option>
                    <option value="threads">🧵 Threads (@puprgarut)</option>
                    <option value="twitter">🐦 X / Twitter (@pupr_garut)</option>
                    <option value="tiktok">🎵 TikTok (@puprkabgarut)</option>
                    <option value="youtube">▶️ YouTube Comment (PUPR Garut TV)</option>
                    <option value="google_business">⭐ Google Maps Review (PUPR Garut)</option>
                    <option value="website">🌐 Website Live Chat Dinas PUPR</option>
                    <option value="portal_pengaduan">🏛️ Portal Pengaduan Pemkab Garut</option>
                    <option value="email">📧 Email Resmi (pupr@garutkab.go.id)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Warga Pelapor
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kecamatan
                  </label>
                  <select
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tarogong Kidul">Tarogong Kidul</option>
                    <option value="Tarogong Kaler">Tarogong Kaler</option>
                    <option value="Cikajang">Cikajang (Garut Selatan)</option>
                    <option value="Cisompet">Cisompet</option>
                    <option value="Karangpawitan">Karangpawitan</option>
                    <option value="Banyuresmi">Banyuresmi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Isi Pengaduan / Pesan Warga
                </label>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Tulis pesan pengaduan warga di sini..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-500/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses PURI AI Routing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>🚀 Kirim Pesan ke Native Gateway (0 Rupiah)</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Hasil Eksekusi Simulasi */}
            {result && result.success && (
              <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pesan Sukses Diproses oleh Native Gateway</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                    {result.data.gateway.provider} ({result.data.gateway.tokenCost})
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 rounded bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">Bidang Ditugaskan</span>
                    <span className="font-bold text-blue-300">
                      {result.data.aiRouting.assignedBidang}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">Prioritas AI</span>
                    <span
                      className={`font-bold ${
                        result.data.aiRouting.priority === 'KRITIS' ||
                        result.data.aiRouting.priority === 'TINGGI'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {result.data.aiRouting.priority}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sentimen & Emosi</span>
                    <span className="font-bold text-slate-200">
                      {result.data.aiRouting.sentiment} • {result.data.aiRouting.emotion}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">SOP RAG Terpilih</span>
                    <span className="font-bold text-amber-300 truncate block">
                      {result.data.matchedSOP ? result.data.matchedSOP.code : 'Umum'}
                    </span>
                  </div>
                </div>

                {result.data.matchedSOP && (
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs">
                    <span className="font-bold text-blue-300 block">
                      📚 {result.data.matchedSOP.title} (SLA: {result.data.matchedSOP.slaHours} Jam)
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Akurasi Pencocokan RAG: {result.data.matchedSOP.relevanceScore}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>PURI AI Routing Engine v2.0 • Dinas PUPR Kabupaten Garut</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Tutup Windows
          </button>
        </div>
      </div>
    </div>
  );
}
