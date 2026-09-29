'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, X, Building2, Phone, ShieldAlert, CheckCircle2, 
  AlertTriangle, MessageSquare, Loader2, Sparkles, Copy, Check 
} from 'lucide-react';
import { WhatsAppService } from '@/services/whatsappService';
import type { BidangPUPR } from '@/domain/aiRouting';
import type { 
  BidangWhatsAppContact, 
  BidangForwardingSettings, 
  ForwardDispatchInput, 
  ForwardDispatchResult 
} from '@/domain/whatsappIntegration';

interface ForwardToBidangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: ForwardDispatchResult) => void;
  initialData: {
    type: 'PENGADUAN' | 'PERMOHONAN' | 'DARURAT' | 'KONSULTASI';
    bidang: BidangPUPR;
    ticketNumber?: string;
    pelaporName: string;
    pelaporPhone?: string;
    lokasi?: string;
    kecamatan?: string;
    layanan?: string;
    judul: string;
    deskripsi: string;
    prioritas: string;
    langkahPenanganan?: string;
    catatanDisposisi?: string;
    conversationId?: string;
  };
}

const BIDANG_OPTIONS: { id: BidangPUPR; label: string; badge: string; color: string }[] = [
  { id: 'BINA_MARGA', label: 'Bina Marga (Jalan & Jembatan)', badge: '🛣️ Bina Marga', color: 'border-amber-500/40 text-amber-300' },
  { id: 'SDA', label: 'Sumber Daya Air (Irigasi & Banjir)', badge: '💧 SDA', color: 'border-blue-500/40 text-blue-300' },
  { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung (PBG & SLF)', badge: '🏢 Bangunan Gedung', color: 'border-emerald-500/40 text-emerald-300' },
  { id: 'PENATAAN_RUANG', label: 'Penataan Ruang (KRK & PKKPR)', badge: '🗺️ Penataan Ruang', color: 'border-purple-500/40 text-purple-300' },
  { id: 'AMPL', label: 'AMPL (SPAM & Sanitasi)', badge: '🚰 AMPL', color: 'border-cyan-500/40 text-cyan-300' },
  { id: 'JASA_KONSTRUKSI', label: 'Jasa Konstruksi (Jakon)', badge: '🏗️ Jasa Konstruksi', color: 'border-indigo-500/40 text-indigo-300' },
  { id: 'SEKRETARIAT', label: 'Sekretariat / Loket Umum', badge: '📋 Sekretariat', color: 'border-slate-500/40 text-slate-300' }
];

export function ForwardToBidangModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: ForwardToBidangModalProps) {
  const [selectedBidang, setSelectedBidang] = useState<BidangPUPR>(initialData.bidang || 'BINA_MARGA');
  const [catatanDisposisi, setCatatanDisposisi] = useState(initialData.catatanDisposisi || '');
  const [notifyCitizen, setNotifyCitizen] = useState(true);
  const [settings, setSettings] = useState<BidangForwardingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<ForwardDispatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedBidang(initialData.bidang || 'BINA_MARGA');
      setCatatanDisposisi(initialData.catatanDisposisi || '');
      setSendResult(null);
      setErrorMessage(null);
      loadBidangSettings();
    }
  }, [isOpen, initialData]);

  const loadBidangSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await WhatsAppService.getBidangContacts();
      if (res && res.data) {
        setSettings(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const currentContact: BidangWhatsAppContact | undefined = settings?.contacts?.[selectedBidang];

  // Hitung Preview Teks WhatsApp
  const generatePreviewText = (): string => {
    if (!settings) return 'Memuat format pesan...';
    const isPengaduan = initialData.type === 'PENGADUAN' || initialData.type === 'DARURAT';
    const rawTemplate = currentContact?.customTemplate || 
      (isPengaduan ? settings.defaultTemplatePengaduan : settings.defaultTemplatePermohonan);

    const replacements: Record<string, string> = {
      '{{namaBidang}}': currentContact?.namaBidang || selectedBidang,
      '{{nomorTiket}}': initialData.ticketNumber || `TKT-${Date.now().toString().slice(-6)}`,
      '{{prioritas}}': initialData.prioritas || 'NORMAL',
      '{{pelapor}}': initialData.pelaporName || 'Warga Garut',
      '{{kontak}}': initialData.pelaporPhone || '-',
      '{{lokasi}}': initialData.lokasi || 'Kabupaten Garut',
      '{{kecamatan}}': initialData.kecamatan || 'Garut Kota',
      '{{kategori}}': initialData.layanan || 'Infrastruktur Publik',
      '{{layanan}}': initialData.layanan || 'Layanan PUPR',
      '{{deskripsi}}': initialData.deskripsi || initialData.judul || '-',
      '{{langkahPenanganan}}': initialData.langkahPenanganan || 'Segera lakukan koordinasi teknis dan peninjauan lapangan.',
      '{{catatanDisposisi}}': catatanDisposisi.trim() || 'Diteruskan langsung dari Command Center Dinas PUPR Garut.'
    };

    let res = rawTemplate;
    for (const [k, v] of Object.entries(replacements)) {
      res = res.split(k).join(v);
    }
    return res;
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(generatePreviewText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendForward = async () => {
    if (!currentContact?.nomorWa) {
      setErrorMessage('Nomor WhatsApp untuk bidang ini belum dikonfigurasi.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    const payload: ForwardDispatchInput = {
      type: initialData.type,
      bidang: selectedBidang,
      targetNomorWa: currentContact.nomorWa,
      ticketNumber: initialData.ticketNumber,
      pelaporName: initialData.pelaporName,
      pelaporPhone: initialData.pelaporPhone,
      lokasi: initialData.lokasi,
      kecamatan: initialData.kecamatan,
      layanan: initialData.layanan,
      judul: initialData.judul,
      deskripsi: initialData.deskripsi,
      prioritas: initialData.prioritas,
      langkahPenanganan: initialData.langkahPenanganan,
      catatanDisposisi: catatanDisposisi.trim() || undefined,
      conversationId: initialData.conversationId,
      sendCitizenConfirmation: notifyCitizen
    };

    try {
      const result = await WhatsAppService.forwardToBidang(payload);
      if (result.success) {
        setSendResult(result);
        onSuccess?.(result);
      } else {
        setErrorMessage(result.error || 'Gagal mengirim pesan forward ke nomor WA bidang.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161B22]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Forward Disposisi ke WhatsApp Bidang
                {initialData.ticketNumber && (
                  <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {initialData.ticketNumber}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Teruskan pengaduan atau permohonan secara komprehensif ke pejabat teknis terkait.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Success Banner */}
          {sendResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5"
            >
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pesan Berhasil Terkirim ke WhatsApp Bidang!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Disposisi telah diteruskan ke nomor <strong>+{sendResult.targetWa}</strong> ({sendResult.targetName}).
                {sendResult.citizenNotified && ' Notifikasi konfirmasi juga telah dikirimkan ke nomor WhatsApp pelapor.'}
              </p>
            </motion.div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bidang Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Pilih Bidang Dinas PUPR Tujuan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BIDANG_OPTIONS.map((opt) => {
                const isSelected = selectedBidang === opt.id;
                const contact = settings?.contacts?.[opt.id];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBidang(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{opt.badge}</span>
                      {contact?.isActive ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 truncate">
                      {contact?.namaPejabat || opt.label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                      {contact?.nomorWa ? `+${contact.nomorWa}` : 'Belum diatur'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Info Box */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Nomor Tujuan WA Bidang</span>
                <span className="text-xs font-mono font-bold text-white">
                  {currentContact?.nomorWa ? `+${currentContact.nomorWa}` : 'Nomor belum dikonfigurasi'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {currentContact?.namaPejabat || 'Pejabat Teknis Bidang'} ({currentContact?.jabatan || 'Koordinator'})
                </span>
              </div>
            </div>
            {currentContact?.autoForwardPengaduan && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Auto-Forward Aktif
              </span>
            )}
          </div>

          {/* Catatan Disposisi Tambahan */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Catatan Disposisi Khusus (Instruksi Petugas Command Center)
            </label>
            <textarea
              rows={2}
              value={catatanDisposisi}
              onChange={(e) => setCatatanDisposisi(e.target.value)}
              placeholder="Contoh: Mohon TRC segera cek lokasi Samarang dan koordinasikan alat berat jika diperlukan..."
              className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Live WhatsApp Bubble Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Preview Pesan WhatsApp Resmi
              </label>
              <button
                type="button"
                onClick={handleCopyPreview}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B141A] border border-white/10 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto shadow-inner">
              {generatePreviewText()}
            </div>
          </div>

          {/* Citizen Confirmation Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="notifyCitizenCheck"
              checked={notifyCitizen}
              onChange={(e) => setNotifyCitizen(e.target.checked)}
              className="rounded bg-slate-800 border-white/20 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="notifyCitizenCheck" className="text-xs text-slate-300 cursor-pointer select-none">
              Kirimkan juga pesan konfirmasi via WhatsApp ke warga pelapor ({initialData.pelaporPhone || 'Nomor Warga'}) bahwa laporan sudah didisposisikan.
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#161B22]/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            {sendResult ? 'Tutup' : 'Batal'}
          </button>

          <button
            type="button"
            disabled={isSending || isLoadingSettings || !currentContact?.nomorWa}
            onClick={handleSendForward}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-900/30 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengirim ke WA Bidang...</span>
              </>
            ) : sendResult ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kirim Ulang Disposisi</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Disposisi ke WA Bidang</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
