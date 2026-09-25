'use client';

import React from 'react';
import {
  Clock, CheckCircle, Loader2, MapPin, User,
  FileText, XCircle
} from 'lucide-react';
import type { ComplaintTicket, ComplaintPriority, ComplaintStatus } from '@/domain/models';

interface ComplaintTableListProps {
  complaints: ComplaintTicket[];
  selectedTicket: ComplaintTicket | null;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  loading: boolean;
}

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; badgeBg: string; badgeText: string; dotColor: string }> = {
  KRITIS: { label: 'Kritis', badgeBg: 'bg-red-500/20', badgeText: 'text-red-400', dotColor: 'bg-red-500' },
  TINGGI: { label: 'Tinggi', badgeBg: 'bg-orange-500/20', badgeText: 'text-orange-400', dotColor: 'bg-orange-500' },
  NORMAL: { label: 'Normal', badgeBg: 'bg-blue-500/20', badgeText: 'text-blue-400', dotColor: 'bg-blue-500' },
  RENDAH: { label: 'Rendah', badgeBg: 'bg-slate-500/20', badgeText: 'text-slate-400', dotColor: 'bg-slate-500' },
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

export function ComplaintTableList({
  complaints,
  selectedTicket,
  onSelectTicket,
  loading,
}: ComplaintTableListProps) {
  return (
    <div className="glass-card p-0 overflow-hidden flex flex-col h-[740px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Daftar Tiket Pengaduan ({complaints.length})
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Sinkronisasi Realtime</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {loading && complaints.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="ml-2 text-xs text-slate-400">Memuat data pengaduan...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
            <FileText className="w-10 h-10 text-slate-600" />
            <span className="text-sm text-slate-400 font-medium">Belum ada tiket pengaduan ditemukan.</span>
            <span className="text-[11px] text-slate-600 max-w-xs">
              Tiket baru dari WA BOT PURI atau penambahan manual akan otomatis muncul di sini.
            </span>
          </div>
        ) : (
          complaints.map((ticket) => {
            const pri = PRIORITY_CONFIG[ticket.prioritas] || PRIORITY_CONFIG.NORMAL;
            const sts = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING;
            const isSelected = selectedTicket?.id === ticket.id;

            return (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-l-2 border-l-blue-400'
                    : 'hover:bg-white/5 border-l-2 border-l-transparent'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${pri.dotColor} shrink-0 mt-1.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{ticket.nomorTiket}</span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${pri.badgeBg} ${pri.badgeText}`}>
                      {ticket.prioritas}
                    </span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sts.badgeBg} ${sts.badgeText}`}>
                      {sts.icon} {sts.label}
                    </span>
                    <span className="text-[8px] font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded ml-auto">
                      {ticket.bidangLabel || ticket.bidang}
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium leading-snug line-clamp-2 mb-1.5">
                    {ticket.judul}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-2.5 h-2.5 text-slate-500" /> {ticket.pelapor}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-500" /> {ticket.kecamatan || 'Garut Kota'}
                    </span>
                    <span className="text-slate-500 ml-auto font-mono text-[9px]">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
