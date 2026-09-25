'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import type { ComplaintTicket, ComplaintPriority, BidangPUPR } from '@/domain/models';

interface CreateComplaintModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ComplaintTicket>) => Promise<boolean>;
}

const KECAMATAN_GARUT = [
  'Garut Kota', 'Tarogong Kidul', 'Tarogong Kaler', 'Samarang', 'Pasirwangi',
  'Bayongbong', 'Cilawu', 'Cikajang', 'Banyuresmi', 'Leles', 'Kadungora',
  'Cibatu', 'Kersamanah', 'Malangbong', 'Karangpawitan', 'Wanaraja', 'Pangatikan',
  'Sucinaraja', 'Cisurupan', 'Sukaresmi', 'Cigedug', 'Banjarwangi', 'Singajaya',
  'Peundeuy', 'Cihurip', 'Cikamat', 'Pakenjeng', 'Pamulihan', 'Bungbulang',
  'Mekarmukti', 'Carengceng', 'Talegong', 'Cisewu', 'Caringin', 'Cibalong',
  'Pameungpeuk', 'Cikelet'
];

const BIDANG_OPTIONS: { id: BidangPUPR; label: string }[] = [
  { id: 'BINA_MARGA', label: 'Bina Marga (Jalan & Jembatan)' },
  { id: 'SDA', label: 'Sumber Daya Air (SDA)' },
  { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung' },
  { id: 'AMPL', label: 'Air Minum & Penyehatan Lingkungan (AMPL)' },
  { id: 'PENATAAN_RUANG', label: 'Penataan Ruang' },
  { id: 'JASA_KONSTRUKSI', label: 'Jasa Konstruksi' },
  { id: 'SEKRETARIAT', label: 'Sekretariat' },
];

export function CreateComplaintModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateComplaintModalProps) {
  const [pelapor, setPelapor] = useState('');
  const [nomorKontak, setNomorKontak] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [kecamatan, setKecamatan] = useState('Garut Kota');
  const [bidang, setBidang] = useState<BidangPUPR>('BINA_MARGA');
  const [kategori, setKategori] = useState('Kerusakan Jalan');
  const [prioritas, setPrioritas] = useState<ComplaintPriority>('NORMAL');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [assignedOperator, setAssignedOperator] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!pelapor.trim() || !lokasi.trim() || !judul.trim()) {
      setFormError('Nama pelapor, lokasi, dan judul pengaduan wajib diisi.');
      return;
    }

    const selectedBidangObj = BIDANG_OPTIONS.find((b) => b.id === bidang);

    const payload: Partial<ComplaintTicket> = {
      pelapor: pelapor.trim(),
      nomorKontak: nomorKontak.trim(),
      lokasi: lokasi.trim(),
      kecamatan,
      bidang,
      bidangLabel: selectedBidangObj?.label || bidang,
      kategori: kategori.trim() || 'Pengaduan Layanan',
      prioritas,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || judul.trim(),
      assignedOperator: assignedOperator.trim() || 'Operator Command Center',
      source: 'MANUAL',
    };

    const success = await onSubmit(payload);
    if (success) {
      // Reset form
      setPelapor('');
      setNomorKontak('');
      setLokasi('');
      setJudul('');
      setDeskripsi('');
      setAssignedOperator('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-card max-w-2xl w-full p-6 border border-white/20 shadow-2xl relative bg-slate-900/95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <PlusCircle className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Catat Pengaduan Warga Baru</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Pendaftaran tiket pengaduan manual oleh operator Command Center Dinas PUPR Garut.
        </p>

        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nama Pelapor <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={pelapor}
                onChange={(e) => setPelapor(e.target.value)}
                placeholder="Contoh: Bpk. Kurnia / Warga RW 05"
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nomor Kontak / WhatsApp
              </label>
              <input
                value={nomorKontak}
                onChange={(e) => setNomorKontak(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Lokasi Detail <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Jl. Pembangunan No. 12, Kp. Sukaregang"
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Kecamatan
              </label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50 cursor-pointer"
              >
                {KECAMATAN_GARUT.map((kec) => (
                  <option key={kec} value={kec} className="bg-slate-900 text-white">
                    {kec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Bidang PUPR
              </label>
              <select
                value={bidang}
                onChange={(e) => {
                  const b = e.target.value as BidangPUPR;
                  setBidang(b);
                  if (b === 'BINA_MARGA') setKategori('Kerusakan Jalan');
                  else if (b === 'SDA') setKategori('Sungai & Pengendalian Banjir');
                  else if (b === 'BANGUNAN_GEDUNG') setKategori('Bangunan Gedung / PBG');
                  else if (b === 'AMPL') setKategori('Drainase & Sanitasi');
                  else if (b === 'PENATAAN_RUANG') setKategori('Tata Ruang / KRK');
                }}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50 cursor-pointer"
              >
                {BIDANG_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Kategori Permasalahan
              </label>
              <input
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="Contoh: Kerusakan Jalan, Irigasi"
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as ComplaintPriority)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="NORMAL" className="bg-slate-900 text-white">NORMAL</option>
                <option value="TINGGI" className="bg-slate-900 text-white">TINGGI</option>
                <option value="KRITIS" className="bg-slate-900 text-white">KRITIS (Darurat)</option>
                <option value="RENDAH" className="bg-slate-900 text-white">RENDAH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Judul Pengaduan <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Jalan Ambles Sedalam 30cm Rawan Kecelakaan di Dekat Jembatan"
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Keterangan / Rincian Pengaduan
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan kondisi kronologi kerusakan atau permohonan penanganan secara lengkap..."
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Petugas / Operator yang Ditugaskan
            </label>
            <input
              value={assignedOperator}
              onChange={(e) => setAssignedOperator(e.target.value)}
              placeholder="Contoh: TRC Bina Marga (Pak Dedi) / Tim OP Irigasi SDA"
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" /> Daftarkan Tiket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
