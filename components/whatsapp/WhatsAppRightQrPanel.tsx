'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, Smartphone, RefreshCw, CheckCircle2, 
  Copy, Check, Info, ShieldCheck, Wifi, LogOut 
} from 'lucide-react';
import { useWhatsAppStore } from '@/hooks/useWhatsApp';

export const WhatsAppRightQrPanel: React.FC = () => {
  const { 
    connectionStatus, 
    pairingMode, 
    setPairingMode, 
    refreshConnection,
    regenerateBaileysQr, 
    confirmAuthentication, 
    connect,
    disconnect 
  } = useWhatsAppStore();

  const [phoneInput, setPhoneInput] = useState('+62 812-3456-7890');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [standaloneUrl, setStandaloneUrl] = useState('http://localhost:3001');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverStatusMsg, setServerStatusMsg] = useState<string | null>(null);

  // Default simulated Baileys QR String
  const qrString = connectionStatus?.qrCodeRaw || 
    '2@BaileysWABot_PUPRGarut_CommandCenter_Token_2026_LiveSync_v6_7_8_AES256GCM';

  const handleConnectStandaloneServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerStatusMsg('Mencoba terhubung ke backend Node.js...');
    try {
      const res = await fetch(`/api/whatsapp/baileys?serverUrl=${encodeURIComponent(standaloneUrl)}`);
      const data = await res.json();
      if (data.source === 'standalone_server') {
        setServerStatusMsg(`Terhubung ke Baileys Server Standalone! Status: ${data.status}`);
      } else if (data.source === 'standalone_error') {
        setServerStatusMsg(data.error);
      } else {
        setServerStatusMsg('Backend lokal aktif (Simulasi Baileys MD v6.7.8).');
      }
    } catch {
      setServerStatusMsg('Gagal menjangkau URL server. Pastikan server/baileys-server.js berjalan.');
    }
  };

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshConnection();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshConnection]);

  const handleRefreshQr = async () => {
    setIsRefreshing(true);
    await refreshConnection();
    setCountdown(45);
    setIsRefreshing(false);
  };

  const handleGeneratePairingCode = (e: React.FormEvent) => {
    e.preventDefault();
    connect('pairing', phoneInput);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">PEMAUTAN PERANGKAT</h3>
            <p className="text-[10px] text-slate-400">Hubungkan WhatsApp Dinas PUPR Garut</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{connectionStatus?.status === 'connected' ? 'TERTAUT' : 'MENUNGGU'}</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10">
        <button
          onClick={() => {
            setPairingMode('qr');
            connect('qr');
          }}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            pairingMode === 'qr'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Kode QR</span>
        </button>

        <button
          onClick={() => {
            setPairingMode('pairing');
            connect('pairing');
          }}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            pairingMode === 'pairing'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Kode Tautan</span>
        </button>
      </div>

      {/* TAB CONTENT 1: QR CODE */}
      {pairingMode === 'qr' ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
            <div className="p-2 bg-white rounded-lg flex items-center justify-center w-full max-w-[170px] aspect-square">
              <QRCodeSVG 
                value={qrString} 
                size={170}
                level="M"
                includeMargin={true}
                className="w-full h-full"
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full px-1 text-xs text-slate-800 border-t border-slate-100 pt-2.5">
              <span className="text-[11px] font-medium text-slate-600">
                Kedaluwarsa: <strong className="text-slate-900 font-mono">{countdown}s</strong>
              </span>
              <button
                onClick={handleRefreshQr}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Perbarui</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Buka WhatsApp &rarr; Perangkat Tertaut &rarr; Tautkan Perangkat untuk memindai QR ini.</span>
            </div>
          </div>

          <button
            onClick={confirmAuthentication}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulasikan Pindai QR Berhasil</span>
          </button>
        </div>
      ) : (
        /* TAB CONTENT 2: PAIRING CODE (PHONE LINKING) */
        <div className="space-y-3">
          <form onSubmit={handleGeneratePairingCode} className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nomor Telepon WhatsApp</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+62 8xx-xxxx-xxxx"
                className="flex-1 bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Dapatkan
              </button>
            </div>
          </form>

          {/* 8-Character Official WhatsApp Web Box Display */}
          {(() => {
            const rawCode = connectionStatus?.pairingCode || 'K9X2-M7P4';
            const cleanCode = rawCode.replace('-', '');
            const group1 = cleanCode.substring(0, 4).split('');
            const group2 = cleanCode.substring(4, 8).split('');

            return (
              <div className="bg-slate-950 border border-emerald-500/30 p-3 rounded-xl space-y-2.5 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Kode Tautan 8 Karakter
                  </span>
                  <button
                    onClick={() => handleCopyCode(rawCode)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 8-Digit Boxes */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <div className="flex gap-1">
                    {group1.map((char, idx) => (
                      <div
                        key={`right-g1-${idx}`}
                        className="w-7 h-9 bg-slate-900 border border-emerald-500/50 rounded-lg flex items-center justify-center text-sm font-mono font-extrabold text-white shadow-sm"
                      >
                        {char}
                      </div>
                    ))}
                  </div>

                  <span className="text-slate-500 font-bold text-sm">-</span>

                  <div className="flex gap-1">
                    {group2.map((char, idx) => (
                      <div
                        key={`right-g2-${idx}`}
                        className="w-7 h-9 bg-slate-900 border border-emerald-500/50 rounded-lg flex items-center justify-center text-sm font-mono font-extrabold text-white shadow-sm"
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-tight">
                  Di HP: Perangkat Tertaut &rarr; Tautkan Perangkat &rarr; <strong className="text-emerald-300">&quot;Tautkan dengan nomor telepon saja&quot;</strong>.
                </p>
              </div>
            );
          })()}

          <button
            onClick={confirmAuthentication}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulasikan Tautan Kode Berhasil</span>
          </button>
        </div>
      )}

      {/* Standalone Server Configuration Toggle */}
      <div className="border-t border-white/10 pt-2.5">
        <button
          onClick={() => setShowServerSettings(!showServerSettings)}
          className="text-[10px] text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-full"
        >
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>{showServerSettings ? 'Sembunyikan' : 'Hubungkan Backend Node.js Standalone (Opsional)'}</span>
        </button>

        {showServerSettings && (
          <form onSubmit={handleConnectStandaloneServer} className="mt-2.5 space-y-2 p-2.5 bg-slate-950/90 rounded-xl border border-white/10 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-300">URL Node.js Baileys Server:</label>
              <input
                type="text"
                value={standaloneUrl}
                onChange={(e) => setStandaloneUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              Cek & Hubungkan Server
            </button>
            {serverStatusMsg && (
              <p className="text-[10px] text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-500/20 leading-tight">
                {serverStatusMsg}
              </p>
            )}
            <p className="text-[9px] text-slate-400 leading-tight">
              Gunakan file <code className="text-amber-300">server/baileys-server.js</code> untuk menjalankan backend Baileys tersendiri pada server/VPS PUPR Garut.
            </p>
          </form>
        )}
      </div>

      {/* Connected Account Footer Info */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="truncate max-w-[140px]">
            {connectionStatus?.phoneNumber || '+62 812-3456-7890'}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-red-400 hover:text-red-300 font-bold text-[10px] flex items-center gap-1 hover:underline cursor-pointer"
        >
          <LogOut className="w-3 h-3" /> Putuskan Sesi
        </button>
      </div>
    </div>
  );
};
