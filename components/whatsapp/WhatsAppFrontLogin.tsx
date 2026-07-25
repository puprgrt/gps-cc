'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, QrCode, Smartphone, RefreshCw, CheckCircle2, 
  Sparkles, Terminal, Lock, Copy, Check, Info, Server, MessageSquare
} from 'lucide-react';
import { WhatsAppConnectionStatus, WhatsAppBotLog } from '@/domain/whatsapp';

interface WhatsAppFrontLoginProps {
  connectionStatus: WhatsAppConnectionStatus | null;
  pairingMode: 'qr' | 'pairing';
  setPairingMode: (mode: 'qr' | 'pairing') => void;
  regenerateBaileysQr: () => void;
  confirmAuthentication: () => Promise<void>;
  connect: (mode?: 'qr' | 'pairing', phoneNumber?: string) => Promise<void>;
  refreshConnection?: () => Promise<void>;
  logs: WhatsAppBotLog[];
}

export function WhatsAppFrontLogin({
  connectionStatus,
  pairingMode,
  setPairingMode,
  regenerateBaileysQr,
  confirmAuthentication,
  connect,
  refreshConnection,
  logs
}: WhatsAppFrontLoginProps) {
  const [countdown, setCountdown] = useState(45);
  const [phoneNumberInput, setPhoneNumberInput] = useState('+62 812-3456-7890');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 45-second QR auto-rotation timer
  useEffect(() => {
    if (pairingMode !== 'qr') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            regenerateBaileysQr();
          }, 0);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pairingMode, regenerateBaileysQr]);

  // Auto-poll connection status every 3 seconds
  useEffect(() => {
    if (!refreshConnection) return;
    const pollTimer = setInterval(() => {
      refreshConnection();
    }, 3000);
    return () => clearInterval(pollTimer);
  }, [refreshConnection]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    regenerateBaileysQr();
    setCountdown(45);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGeneratePairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await connect('pairing', phoneNumberInput);
  };

  const handleCopyCode = () => {
    if (connectionStatus?.pairingCode) {
      navigator.clipboard.writeText(connectionStatus.pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const qrString = connectionStatus?.qrCodeRaw || '2@baileys_initial_qr_string_sample_pupr_garut_6281234567890';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header Announcement Banner */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0 shadow-inner">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">WhatsApp Gateway PUPR Garut</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 font-semibold">
                  Baileys MD v6.7
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Pautkan akun WhatsApp resmi Dinas Pekerjaan Umum & Penataan Ruang Kabupaten Garut.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-slate-950/70 p-2.5 rounded-xl border border-white/10 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-mono text-amber-300 font-bold">STATUS: MENUNGGU LOG IN</span>
          </div>
        </div>
      </div>

      {/* Main Front QR Gateway Card */}
      <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Gateway Tabs Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-white/10 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Metode Pemautan Perangkat</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setPairingMode('qr');
                connect('qr');
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                pairingMode === 'qr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Pindai QR Code</span>
            </button>
            <button
              onClick={() => {
                setPairingMode('pairing');
                connect('pairing');
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                pairingMode === 'pairing'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Kode Tautan Telepon</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {pairingMode === 'qr' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* QR Box Container (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl relative border border-slate-200">
                <div className="p-3 bg-white rounded-xl flex items-center justify-center w-full max-w-[220px] aspect-square relative">
                  <QRCodeSVG 
                    value={qrString} 
                    size={220}
                    level="M"
                    includeMargin={true}
                    className="w-full h-full"
                  />
                </div>

                {/* QR Rotation Timer & Refresh Button */}
                <div className="mt-4 flex items-center justify-between w-full px-1 text-xs text-slate-800 gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-600">
                    Kedaluwarsa: <strong className="text-slate-900 font-mono text-sm">{countdown}s</strong>
                  </span>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Perbarui QR</span>
                  </button>
                </div>
              </div>

              {/* Instructions & Simulation Action (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Langkah Mudah Menghubungkan WhatsApp</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gunakan aplikasi WhatsApp di smartphone resmi PUPR Garut untuk memindai kode QR di sebelah kiri.
                  </p>
                </div>

                <ol className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">1</span>
                    <div>
                      <strong className="text-white font-semibold">Buka WhatsApp</strong> di HP dinas PUPR Garut.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">2</span>
                    <div>
                      Masuk ke <strong className="text-white font-semibold">Pengaturan</strong> / titik tiga (⋮) &rarr; <strong className="text-white font-semibold">Perangkat Tertaut</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">3</span>
                    <div>
                      Tekan <strong className="text-white font-semibold">Tautkan Perangkat</strong> lalu arahkan kamera ke <strong className="text-white font-semibold">Kode QR</strong>.
                    </div>
                  </li>
                </ol>

                <div className="pt-2">
                  {/* Notice Box about Meta Server QR Validation */}
                  <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-semibold block mb-0.5">Catatan Pemautan Kamera HP:</strong>
                        Aplikasi WhatsApp HP memverifikasi token QR langsung ke server Meta (<code className="text-amber-200 font-mono">web.whatsapp.com</code>). Untuk menyambung langsung dengan HP fisik, hubungkan instance backend Node.js Baileys. Gunakan tombol di bawah ini atau <strong className="text-white">Kode Tautan Telepon</strong> untuk menguji penuh fitur Command Center.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={confirmAuthentication}
                    className="hidden w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-emerald-900/40 transition-all items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Simulasikan Berhasil Pindai & Masuk Ke Dashboard</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Klik tombol di atas untuk menyelesaikan autentikasi dan masuk ke Command Center.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Pairing Code View - Formatted in 2-Column Grid matching QR layout */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Phone Input & 8-Digit Pairing Code Display (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-center p-5 bg-slate-950/80 border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Nomor Telepon WhatsApp</span>
                  </label>
                  <form onSubmit={handleGeneratePairingCode} className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+62 8xx-xxxx-xxxx"
                      className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0"
                    >
                      Dapatkan Kode
                    </button>
                  </form>
                </div>

                {/* 8-Character Pairing Code Display Container */}
                {(() => {
                  const rawCode = connectionStatus?.pairingCode || 'K9X2-M7P4';
                  const cleanCode = rawCode.replace('-', '');
                  const group1 = cleanCode.substring(0, 4).split('');
                  const group2 = cleanCode.substring(4, 8).split('');

                  return (
                    <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-center shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Kode Tautan 8 Karakter
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Official WhatsApp Web Style 8-Character Digit Boxes */}
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1">
                        <div className="flex gap-1 sm:gap-1.5">
                          {group1.map((char, idx) => (
                            <div
                              key={`g1-${idx}`}
                              className="w-9 h-11 sm:w-11 sm:h-12 bg-slate-950 border-2 border-emerald-500/60 rounded-xl flex items-center justify-center text-lg sm:text-xl font-mono font-extrabold text-white shadow-md"
                            >
                              {char}
                            </div>
                          ))}
                        </div>

                        <span className="text-slate-500 font-bold text-lg sm:text-xl">-</span>

                        <div className="flex gap-1 sm:gap-1.5">
                          {group2.map((char, idx) => (
                            <div
                              key={`g2-${idx}`}
                              className="w-9 h-11 sm:w-11 sm:h-12 bg-slate-950 border-2 border-emerald-500/60 rounded-xl flex items-center justify-center text-lg sm:text-xl font-mono font-extrabold text-white shadow-md"
                            >
                              {char}
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-tight">
                        Kode ini akan berubah otomatis jika waktu sesi habis.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Step-by-Step Guide & Simulation Action (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Langkah Pemautan Menggunakan Nomor HP</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Masukkan kode 8 karakter dari kotak sebelah kiri langsung ke aplikasi WhatsApp di HP Anda.
                  </p>
                </div>

                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">1</span>
                    <div>
                      <strong className="text-white font-semibold">Buka WhatsApp</strong> di HP dinas PUPR Garut.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">2</span>
                    <div>
                      Pilih <strong className="text-white font-semibold">Pengaturan</strong> / titik tiga (⋮) &rarr; <strong className="text-white font-semibold">Perangkat Tertaut</strong> &rarr; <strong className="text-white font-semibold">Tautkan Perangkat</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">3</span>
                    <div>
                      Tekan opsi <strong className="text-emerald-400 font-semibold">&quot;Tautkan dengan nomor telepon saja&quot;</strong> di bagian bawah layar HP.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">4</span>
                    <div>
                      Ketikkan <strong className="text-white font-semibold">Kode 8 Karakter</strong> di sebelah kiri ke dalam aplikasi WhatsApp.
                    </div>
                  </li>
                </ol>

                <div className="pt-1">
                  <button
                    onClick={confirmAuthentication}
                    className="hidden w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-emerald-900/40 transition-all items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Simulasikan Kode Tautan Berhasil & Masuk Dashboard</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Memasukkan kode ini akan menautkan sesi Baileys PUPR Garut secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Baileys Socket Terminal */}
        <div className="bg-slate-950 border-t border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300">BAILEYS WEBSOCKET EVENT LOG STREAM</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <Server className="w-3 h-3 text-blue-400" />
              <span>Session: ./baileys_auth_info</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 h-28 overflow-y-auto space-y-1 scrollbar-thin">
            <div className="text-emerald-400">[Baileys WS] Handshake established with wss://web.whatsapp.com/ws/chat</div>
            <div className="text-blue-400">[Baileys Auth] Noise protocol keys initialized (session: garut_pupr)</div>
            <div className="text-amber-300">[Baileys QR] Multi-device payload active. Expiry: 45s</div>
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} className="text-slate-400 truncate">
                [{typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toLocaleTimeString('id-ID')}] [{log.level.toUpperCase()}] {log.event} - {log.details}
              </div>
            ))}
            <div className="text-slate-500 italic animate-pulse">[Baileys System] Menunggu respon pemindai dari perangkat WhatsApp...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
