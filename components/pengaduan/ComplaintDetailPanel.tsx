'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, User, Clock, AlertTriangle, FileText,
  ShieldAlert, ExternalLink, ChevronDown, ChevronUp, CheckCircle,
  Loader2, XCircle, ArrowRight
} from 'lucide-react';
import type { ComplaintTicket, ComplaintPriority, ComplaintStatus } from '@/domain/models';

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

        {/* Catatan Petugas */}
        {ticket.catatanPetugas && (
          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Catatan Tindak Lanjut Petugas</span>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{ticket.catatanPetugas}</p>
          </div>
        )}

        {/* Source info & WA Link */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {ticket.source === 'WHATSAPP_BOT' ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Tercatat otomatis oleh AI PURI dari WhatsApp
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
      <div className="pt-3 border-t border-white/10 shrink-0 flex gap-2">
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
