'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Loader2, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import type { ComplaintTicket, ComplaintStatus } from '@/domain/models';

interface UpdateStatusModalProps {
  isOpen: boolean;
  ticket: ComplaintTicket | null;
  targetStatus: ComplaintStatus;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (catatan: string, notifyCitizen: boolean) => Promise<void>;
}

const PRESET_NOTES: Record<ComplaintStatus, string[]> = {
  DIPROSES: [
    'Tim Reaksi Cepat (TRC) telah ditugaskan dan meluncur ke lokasi penanganan.',
    'Pemeriksaan dan survei lapangan awal sedang dilakukan oleh tim teknis.',
    'Koordinasi dengan pihak UPT dan pemangku wilayah setempat telah dimulai.',
  ],
  SELESAI: [
    'Penanganan dan perbaikan infrastruktur telah selesai 100% di lokasi.',
    'Pembersihan saluran dan pengerukan endapan lumpur telah tuntas dilaksanakan.',
    'Pemasangan rambu pengaman dan perbaikan darurat telah selesai dikerjakan.',
  ],
  DITOLAK: [
    'Lokasi bukan merupakan kewenangan Dinas PUPR Garut (jalan nasional/provinsi/swasta).',
    'Data lokasi atau rincian pengaduan tidak valid setelah dilakukan verifikasi.',
    'Laporan terduplikasi dengan pengaduan warga yang sudah ditangani sebelumnya.',
  ],
  PENDING: [
    'Menunggu verifikasi lebih lanjut dari supervisor bidang.',
  ],
};

export function UpdateStatusModal({
  isOpen,
  ticket,
  targetStatus,
  isUpdating,
  onClose,
  onSubmit,
}: UpdateStatusModalProps) {
  const [catatan, setCatatan] = useState('');
  const [notifyCitizen, setNotifyCitizen] = useState(true);

  if (!isOpen || !ticket) return null;

  const presets = PRESET_NOTES[targetStatus] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(catatan.trim(), notifyCitizen);
  };

  const statusLabel =
    targetStatus === 'DIPROSES'
      ? 'DIPROSES'
      : targetStatus === 'SELESAI'
      ? 'SELESAI'
      : targetStatus === 'DITOLAK'
      ? 'DITOLAK'
      : targetStatus;

  const badgeColor =
    targetStatus === 'DIPROSES'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : targetStatus === 'SELESAI'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-card max-w-lg w-full p-6 border border-white/20 shadow-2xl relative bg-slate-900/95">
        <button
          onClick={onClose}
          disabled={isUpdating}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-slate-400 font-bold">{ticket.nomorTiket}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
            Status Baru: {statusLabel}
          </span>
        </div>

        <h2 className="text-base font-bold text-white mb-1">Perbarui Status Penanganan Tiket</h2>
        <p className="text-xs text-slate-400 mb-4 truncate">{ticket.judul}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Catatan Tindak Lanjut Petugas
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan keterangan tindakan penanganan di lapangan..."
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-all resize-none"
            />

            {/* Quick preset chips */}
            {presets.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold">Saran Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCatatan(p)}
                      className="text-[10px] text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-left transition-colors cursor-pointer"
                    >
                      {p.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Notification Toggle */}
          {ticket.nomorKontak && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCitizen}
                onChange={(e) => setNotifyCitizen(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <div className="flex flex-col text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  Kirim Notifikasi Otomatis ke WhatsApp Pelapor
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Kirim pesan status terbaru ke nomor <strong>{ticket.nomorKontak}</strong> ({ticket.pelapor}).
                </span>
              </div>
            </label>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Simpan & Perbarui
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
