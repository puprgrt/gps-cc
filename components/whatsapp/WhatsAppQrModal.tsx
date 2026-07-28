'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, RefreshCw, Smartphone, QrCode, ShieldCheck, CheckCircle2, Terminal, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';
import { useWhatsAppStore } from '../../hooks/useWhatsApp';

export const WhatsAppQrModal: React.FC = () => {
  const { 
    showQrModal, 
    setShowQrModal, 
    connectionStatus, 
    regenerateBaileysQr, 
    confirmAuthentication, 
    connect,
    pairingMode,
    setPairingMode
  } = useWhatsAppStore();

  const [phoneInput, setPhoneInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[Baileys WASocket] Engine initialized @whiskeysockets/baileys v6.7.8',
    '[Baileys Auth] Loading multi-device auth credentials from ./baileys_auth_info...',
    '[Baileys WS] Connecting to wss://web.whatsapp.com/ws/chat...',
  ]);

  useEffect(() => {
    if (!showQrModal) return;

    if (connectionStatus?.status === 'qr_ready' && connectionStatus.qrCodeRaw) {
      const timeout = setTimeout(() => {
        setTerminalLogs(prev => {
          const logMsg = `[Baileys Event] connection.update -> qr: "${connectionStatus.qrCodeRaw?.substring(0, 30)}..."`;
          if (prev.includes(logMsg)) return prev;
          return [
            ...prev,
            logMsg,
            '[Baileys Scanner] Waiting for WhatsApp scanner pairing...'
          ];
        });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [showQrModal, connectionStatus?.status, connectionStatus?.qrCodeRaw]);

  // Countdown timer for QR refresh
  useEffect(() => {
    if (!showQrModal || pairingMode !== 'qr') return;

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
  }, [showQrModal, pairingMode, regenerateBaileysQr]);

  if (!showQrModal) return null;

  const handleCopyPairingCode = (code: string) => {
    navigator.clipboard.writeText(code.replace('-', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    await connect('pairing', phoneInput);
    setTerminalLogs(prev => [
      ...prev,
      `[Baileys Auth] Requesting 8-digit pairing code for number ${phoneInput}...`,
      '[Baileys Auth] Pairing code generated successfully.'
    ]);
  };

  const handleManualRefresh = () => {
    regenerateBaileysQr();
    setCountdown(45);
    setTerminalLogs(prev => [
      ...prev,
      '[Baileys WASocket] Manual refresh triggered. Regenerating fresh Noise protocol QR pair...'
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto overflow-x-hidden">
      <div className="relative modal-container bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] min-w-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950/90 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>WhatsApp Web Gateway</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-500/30">
                  Baileys v6.7
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Pautkan perangkat WhatsApp Resmi PUPR Garut
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowQrModal(false)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-w-0">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-950/70 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setPairingMode('qr');
                connect('qr');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pairingMode === 'qr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={() => setPairingMode('pairing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pairingMode === 'pairing'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Kode Tautan Telepon</span>
            </button>
          </div>

          {/* QR Code Tab View */}
          {pairingMode === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* QR Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl relative group min-w-0 border border-slate-200">
                {connectionStatus?.qrCodeRaw ? (
                  <div className="p-2 bg-white rounded-xl flex items-center justify-center w-full max-w-[200px] aspect-square">
                    <QRCodeSVG 
                      value={connectionStatus.qrCodeRaw} 
                      size={200}
                      level="M"
                      includeMargin={true}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-3 text-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold text-center">Menunggu QR Code dari server WhatsApp...</span>
                    <span className="text-[10px] text-slate-500">Pastikan server Baileys berjalan</span>
                  </div>
                )}

                {/* QR Timer & Refresh */}
                <div className="mt-3 flex items-center justify-between w-full px-1 text-xs text-slate-800 gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-600">
                    Kedaluwarsa: <strong className="text-slate-900 font-mono text-sm">{countdown}s</strong>
                  </span>
                  <button
                    onClick={handleManualRefresh}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    Perbarui
                  </button>
                </div>
              </div>

              {/* Steps Guide */}
              <div className="space-y-4 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Panduan Pemautan</span>
                </h4>
                <ol className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">1</span>
                    <span>Buka **WhatsApp** di HP resmi PUPR.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">2</span>
                    <span>Pilih **Perangkat Tertaut** &rarr; **Tautkan Perangkat**.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">3</span>
                    <span>Arahkan kamera ke **Kode QR**.</span>
                  </li>
                </ol>

                <div className="pt-1">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 leading-relaxed text-center">
                    QR Code dihasilkan langsung dari server Meta WhatsApp. Pindai dengan kamera HP untuk menautkan perangkat.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pairing Code Tab View */}
          {pairingMode === 'pairing' && (
            <div className="space-y-5">
              <form onSubmit={handleRequestPairing} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Masukkan Nomor WhatsApp Resmi PUPR Garut:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Dapatkan Kode
                  </button>
                </div>
              </form>

              {connectionStatus?.pairingCode && (() => {
                const cleanCode = connectionStatus.pairingCode.replace('-', '');
                const group1 = cleanCode.substring(0, 4).split('');
                const group2 = cleanCode.substring(4, 8).split('');

                return (
                  <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                        Kode Tautan Perangkat
                      </p>
                      <button
                        onClick={() => handleCopyPairingCode(connectionStatus.pairingCode!)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2">
                      <div className="flex gap-1">
                        {group1.map((char, idx) => (
                          <div
                            key={`modal-g1-${idx}`}
                            className="w-8 h-10 sm:w-10 sm:h-12 bg-slate-900 border-2 border-emerald-500/50 rounded-lg flex items-center justify-center text-lg sm:text-xl font-mono font-extrabold text-white"
                          >
                            {char}
                          </div>
                        ))}
                      </div>

                      <span className="text-slate-500 font-bold text-lg sm:text-xl">-</span>

                      <div className="flex gap-1">
                        {group2.map((char, idx) => (
                          <div
                            key={`modal-g2-${idx}`}
                            className="w-8 h-10 sm:w-10 sm:h-12 bg-slate-900 border-2 border-emerald-500/50 rounded-lg flex items-center justify-center text-lg sm:text-xl font-mono font-extrabold text-white"
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Buka WhatsApp &rarr; Perangkat Tertaut &rarr; Tautkan dengan nomor telepon saja &rarr; Masukkan 8 karakter di atas.
                    </p>
                  </div>
                );
              })()}

              <div className="pt-2">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 leading-relaxed text-center">
                  Kode tautan dihasilkan dari server Baileys. Masukkan kode ini di HP WhatsApp untuk menautkan perangkat.
                </div>
              </div>
            </div>
          )}

          {/* Baileys WebSocket Terminal Log Stream */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono flex items-center gap-1.5 font-semibold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Baileys Socket Event Stream Log
              </span>
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Socket Active
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto leading-relaxed shadow-inner">
              {terminalLogs.length > 0 ? (
                terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-600 shrink-0">&gt;</span>
                    <span className={log.includes('Event') || log.includes('QR') ? 'text-emerald-400' : log.includes('WS') || log.includes('Connecting') ? 'text-blue-300' : log.includes('Error') || log.includes('Gagal') ? 'text-red-400' : 'text-slate-400'}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-slate-600">&gt;</span>
                  <span className="text-slate-500 animate-pulse">Menunggu koneksi ke server Baileys...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Koneksi aman menggunakan skema terenkripsi end-to-end Multi-Device Baileys.</span>
          </div>
          <button
            onClick={() => setShowQrModal(false)}
            className="text-slate-300 hover:text-white font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
