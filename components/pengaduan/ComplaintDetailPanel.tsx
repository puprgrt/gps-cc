'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, User, Clock, AlertTriangle, FileText,
  ShieldAlert, ExternalLink, ChevronDown, ChevronUp, CheckCircle,
  Loader2, XCircle, ArrowRight, Send, Image as ImageIcon,
  Paperclip, Upload, Eye, X, MessageSquare, Check
} from 'lucide-react';
import type { ComplaintTicket, ComplaintPriority, ComplaintStatus, BidangPUPR } from '@/domain/models';
import { ForwardToBidangModal } from '@/components/whatsapp/ForwardToBidangModal';
import { ApiService } from '@/services/apiService';

interface ComplaintDetailPanelProps {
  ticket: ComplaintTicket | null;
  onClose: () => void;
  onRequestStatusChange: (status: ComplaintStatus) => void;
}

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; badgeBg: string; badgeText: string }> = {
  KRITIS: { label: 'Kritis', badgeBg: 'bg-red-500/20', badgeText: 'text-red-400' },
  TINGGI: { label: 'Tinggi', badgeBg: 'bg-orange-500/20', badgeText: 'text-orange-400' },
  NORMAL: { label: 'Normal', badgeBg: 'bg-blue-500/20', badgeText: 'text-blue-400' },
  RENDAH: { label: 'Rendah', badgeBg: 'bg-slate-500/20', badgeText: 'text-slate-400' },
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: React.ReactNode; badgeBg: string; badgeText: string }> = {
  PENDING: { label: 'Menunggu', icon: <Clock className="w-3 h-3" />, badgeBg: 'bg-yellow-500/20', badgeText: 'text-yellow-400' },
  DIPROSES: { label: 'Diproses', icon: <Loader2 className="w-3 h-3 animate-spin" />, badgeBg: 'bg-blue-500/20', badgeText: 'text-blue-400' },
  SELESAI: { label: 'Selesai', icon: <CheckCircle className="w-3 h-3" />, badgeBg: 'bg-emerald-500/20', badgeText: 'text-emerald-400' },
  DITOLAK: { label: 'Ditolak', icon: <XCircle className="w-3 h-3" />, badgeBg: 'bg-red-500/20', badgeText: 'text-red-400' },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function ComplaintDetailPanel({
  ticket,
  onClose,
  onRequestStatusChange,
}: ComplaintDetailPanelProps) {
  const [showBotSummary, setShowBotSummary] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [staffName, setStaffName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [notifyCitizen, setNotifyCitizen] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  if (!ticket) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center h-[740px] text-center gap-3">
        <FileText className="w-12 h-12 text-slate-700" />
        <span className="text-sm text-slate-400 font-semibold">Pilih Tiket Pengaduan</span>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          Klik salah satu tiket di daftar sebelah kiri untuk meninjau rincian pengaduan warga, rekomendasi langkah penanganan, serta memperbarui status tindak lanjut.
        </p>
      </div>
    );
  }

  const pri = PRIORITY_CONFIG[ticket.prioritas] || PRIORITY_CONFIG.NORMAL;
  const sts = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !answerText.trim()) return;

    setIsSubmittingAnswer(true);
    try {
      const attachments = [];
      if (photoPreview) {
        attachments.push({
          type: 'image' as const,
          url: photoPreview,
          base64: photoPreview,
          fileName: photoFile ? photoFile.name : `Bukti_Penanganan_${ticket.nomorTiket}.jpg`,
          mimetype: photoFile ? photoFile.type : 'image/jpeg',
          uploadedAt: new Date().toISOString()
        });
      }

      const res = await ApiService.submitComplaintResolution(ticket.id, {
        status: 'SELESAI',
        catatanPetugas: answerText,
        tindakLanjut: {
          jawabanPetugas: answerText,
          namaPetugas: staffName || 'Staf Teknis Dinas PUPR',
          nomorKontakPetugas: '',
          buktiLampiran: attachments
        },
        notifyCitizen: notifyCitizen
      });

      if (res && res.success) {
        onRequestStatusChange('SELESAI');
        setIsAnswerModalOpen(false);
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        alert(res?.error || 'Gagal menyimpan jawaban penanganan.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      alert('Terjadi kesalahan: ' + msg);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const hasResolution = !!(ticket.tindakLanjut || (ticket.buktiLampiran && ticket.buktiLampiran.length > 0));

  return (
    <div className="glass-card p-5 flex flex-col h-[740px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-blue-400 font-bold">{ticket.nomorTiket}</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${pri.badgeBg} ${pri.badgeText}`}>
            {ticket.prioritas}
          </span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sts.badgeBg} ${sts.badgeText}`}>
            {sts.icon} {sts.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
        {/* Title */}
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Judul Pengaduan</span>
          <h3 className="text-sm text-white font-bold leading-snug mt-0.5">{ticket.judul}</h3>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 space-y-2.5 text-[11px]">
          <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Pelapor" value={ticket.pelapor} />
          <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Kontak WhatsApp" value={ticket.nomorKontak || '-'} />
          <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Lokasi & Kecamatan" value={`${ticket.lokasi} (${ticket.kecamatan || 'Garut'})`} />
          <InfoRow icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Bidang Dinas PUPR" value={ticket.bidangLabel || ticket.bidang} />
          <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="Kategori" value={ticket.kategori} />
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Waktu Masuk" value={formatDate(ticket.createdAt)} />
          <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Petugas / Operator" value={ticket.assignedOperator || 'Belum ditugaskan'} />
        </div>

        {/* HASIL & BUKTI PENANGANAN STAF LAPANGAN */}
        {hasResolution && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Hasil & Bukti Jawaban Penanganan Lapangan
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                SELESAI DITINDAKLANJUTI
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-black/20 p-2.5 rounded-lg border border-emerald-500/20 whitespace-pre-line">
              &quot;{ticket.tindakLanjut?.jawabanPetugas || ticket.catatanPetugas}&quot;
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-emerald-500/20 pt-2">
              <div>
                <span className="text-slate-500 block">Petugas Penindak:</span>
                <span className="text-slate-200 font-semibold">{ticket.tindakLanjut?.namaPetugas || ticket.assignedOperator || 'Staf Dinas PUPR'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Waktu Selesai:</span>
                <span className="text-slate-200 font-semibold">{ticket.tindakLanjut?.waktuSelesai ? formatDate(ticket.tindakLanjut.waktuSelesai) : '-'}</span>
              </div>
            </div>

            {/* Gallery Foto Bukti Penanganan */}
            {(ticket.tindakLanjut?.buktiLampiran || ticket.buktiLampiran) && (
              <div className="pt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Foto Bukti Penanganan Lapangan:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(ticket.tindakLanjut?.buktiLampiran || ticket.buktiLampiran || []).map((att, idx) => {
                    const imgSrc = att.url || (att.base64?.startsWith('data:') ? att.base64 : (att.base64 ? `data:image/jpeg;base64,${att.base64}` : ''));
                    return (
                      <div 
                        key={idx}
                        className="group relative rounded-lg overflow-hidden border border-white/10 bg-black/40 hover:border-emerald-400/50 transition-all cursor-pointer"
                        onClick={() => imgSrc && setPreviewImageUrl(imgSrc)}
                      >
                        {imgSrc ? (
                          <div className="relative h-28 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            <img 
                              src={imgSrc} 
                              alt={att.fileName || 'Bukti Pekerjaan'} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[10px] font-bold">
                              <Eye className="w-3.5 h-3.5" /> Lihat Ukuran Penuh
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 flex items-center gap-2 text-xs text-slate-300">
                            <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                            <span className="truncate text-[11px]">{att.fileName || 'Dokumen Bukti'}</span>
                          </div>
                        )}
                        <div className="p-1.5 text-[9px] text-slate-400 bg-slate-950/80 truncate">
                          {att.fileName || `Bukti ${idx + 1}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Petunjuk Flow WA Bot untuk Tim Lapangan */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-blue-300">
          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          <div className="leading-relaxed">
            <span className="font-bold text-white block">Integrasi WhatsApp Bot untuk Staf / TRC:</span>
            <p className="mt-0.5 text-slate-300 text-[10px]">
              Petugas lapangan dapat menyelesaikan tiket & melampirkan foto langsung via chat WhatsApp Bot: kirim foto lalu ketik <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">JAWAB #{ticket.nomorTiket} [rincian penanganan]</code>.
            </p>
          </div>
        </div>

        {/* Deskripsi Asli Pelapor */}
        {ticket.deskripsi && ticket.deskripsi !== ticket.judul && (
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Pesan Warga</span>
            <p className="text-xs text-slate-200 mt-1 italic leading-relaxed">
              &quot;{ticket.deskripsi}&quot;
            </p>
          </div>
        )}

        {/* Langkah Penanganan Teknis */}
        {ticket.langkahPenanganan && (
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Rekomendasi Langkah Penanganan
            </span>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{ticket.langkahPenanganan}</p>
          </div>
        )}

        {/* Catatan Petugas Regular */}
        {!hasResolution && ticket.catatanPetugas && (
          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Catatan Petugas</span>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{ticket.catatanPetugas}</p>
          </div>
        )}

        {/* Source info & WA Link */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {ticket.source === 'WHATSAPP_BOT' ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Rekapitulasi resmi tercatat oleh AI PURI dari WhatsApp
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">Dicatat manual oleh operator</span>
          )}

          <Link
            href="/whatsapp"
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            Buka di WhatsApp Hub <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Collapsible Ringkasan AI PURI */}
        {ticket.ringkasanBot && (
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowBotSummary(!showBotSummary)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 text-left text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <span>Ringkasan AI PURI Lengkap</span>
              {showBotSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showBotSummary && (
              <div className="p-3 bg-slate-950/70 text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {ticket.ringkasanBot}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/10 shrink-0 space-y-2">
        {/* Tombol Utama: Jawab & Lampirkan Bukti Penanganan */}
        <button
          onClick={() => {
            setAnswerText(ticket.tindakLanjut?.jawabanPetugas || ticket.catatanPetugas || '');
            setStaffName(ticket.tindakLanjut?.namaPetugas || ticket.assignedOperator || 'Staf Teknis Dinas PUPR');
            setIsAnswerModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{hasResolution ? 'Perbarui Jawaban & Bukti Penanganan' : 'Jawab & Lampirkan Bukti Penanganan'}</span>
        </button>

        {/* Forward ke WA Bidang Action Button */}
        <button
          onClick={() => setIsForwardModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Forward Disposisi ke WA {ticket.bidangLabel || ticket.bidang}</span>
        </button>

        <div className="flex gap-2">
          {ticket.status !== 'DIPROSES' && ticket.status !== 'SELESAI' && (
            <button
              onClick={() => onRequestStatusChange('DIPROSES')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              <Loader2 className="w-3 h-3" /> Proses Tiket
            </button>
          )}

          {ticket.status !== 'SELESAI' && (
            <button
              onClick={() => onRequestStatusChange('SELESAI')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              <CheckCircle className="w-3 h-3" /> Selesaikan Tiket
            </button>
          )}

          {ticket.status !== 'DITOLAK' && ticket.status !== 'SELESAI' && (
            <button
              onClick={() => onRequestStatusChange('DITOLAK')}
              className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Tolak
            </button>
          )}
        </div>
      </div>

      {/* MODAL JAWAB & LAMPIRKAN BUKTI PENANGANAN */}
      {isAnswerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4 text-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Jawab Laporan & Lampirkan Bukti</h3>
              </div>
              <button onClick={() => setIsAnswerModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="space-y-3.5 text-xs">
              <div className="bg-white/5 p-3 rounded-xl space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-blue-300 font-bold">
                  <span>Tiket: {ticket.nomorTiket}</span>
                  <span className="text-slate-400">{ticket.bidangLabel || ticket.bidang}</span>
                </div>
                <div className="text-white font-semibold truncate">{ticket.judul}</div>
                <div className="text-[10px] text-slate-400">Pelapor: {ticket.pelapor} ({ticket.nomorKontak})</div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Nama Petugas / Tim Lapangan</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Contoh: Ir. Asep (Koordinator TRC Bina Marga)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Hasil / Keterangan Penanganan Teknis</label>
                <textarea
                  rows={4}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Jelaskan tindakan teknis yang telah diselesaikan di lapangan, misalnya: Lubang aspal telah ditutup dengan hotmix, saluran drainase telah dikeruk dari endapan lumpur, dll."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Upload Foto Bukti */}
              <div>
                <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Foto Bukti Penanganan Lapangan
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 cursor-pointer"
                />

                {photoPreview && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-emerald-500/40 w-full h-36 bg-black/40">
                    <img src={photoPreview} alt="Preview Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Checkbox Notifikasi WhatsApp Warga */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyCitizenCheck"
                  checked={notifyCitizen}
                  onChange={(e) => setNotifyCitizen(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="notifyCitizenCheck" className="text-slate-300 font-medium cursor-pointer">
                  Kirim notifikasi otomatis & foto bukti ke WhatsApp pelapor ({ticket.nomorKontak})
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnswerModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnswer}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSubmittingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSubmittingAnswer ? 'Menyimpan & Mengirim...' : 'Simpan & Kirim Jawaban'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW FOTO BUKTI */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] p-2 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImageUrl} 
              alt="Foto Bukti Lapangan" 
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/20" 
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-3 -right-3 p-2 bg-slate-900 border border-white/20 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Forward Disposisi ke WA Bidang */}
      {isForwardModalOpen && (
        <ForwardToBidangModal
          isOpen={isForwardModalOpen}
          onClose={() => setIsForwardModalOpen(false)}
          onSuccess={() => {
            // Optional callback
          }}
          initialData={{
            type: ticket.prioritas === 'KRITIS' ? 'DARURAT' : 'PENGADUAN',
            bidang: (ticket.bidang as BidangPUPR) || 'BINA_MARGA',
            ticketNumber: ticket.nomorTiket,
            pelaporName: ticket.pelapor,
            pelaporPhone: ticket.nomorKontak,
            lokasi: ticket.lokasi,
            kecamatan: ticket.kecamatan,
            layanan: ticket.kategori,
            judul: ticket.judul || '',
            deskripsi: ticket.deskripsi || ticket.judul || '-',
            prioritas: ticket.prioritas,
            langkahPenanganan: ticket.langkahPenanganan,
            catatanDisposisi: ticket.catatanPetugas
          }}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-500 shrink-0 mt-0.5">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
        <span className="text-xs text-slate-200 font-medium truncate">{value}</span>
      </div>
    </div>
  );
}

