'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { TipeFormAlt } from '@/sipeka/types';
import { cn } from '@/lib/utils';

export default function PermohonanBaruPage() {
  const router = useRouter();
  const [altForm, setAltForm] = useState<TipeFormAlt>('ALT_A');
  const [namaBangunan, setNamaBangunan] = useState('Gedung Kelas 1-3 SDN 1 Tarogong Kidul');
  const [nupBmd, setNupBmd] = useState('BMD-2022-0012');
  const [jumlahLantai, setJumlahLantai] = useState(1);
  const [luasM2, setLuasM2] = useState(240);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/sipeka/permohonan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengelolaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Pengelola SDN 1
          bangunanId: 'b1111111-1111-1111-1111-111111111111',
          altForm,
          suratPermohonanGdriveId: `gdrive_surat_permohonan_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengajukan permohonan.');
      }

      router.push(`/sipeka/permohonan/${data.data.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link
          href="/sipeka"
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#F2A900]">
            Tahap 1: Pengajuan Mandiri
          </span>
          <h1 className="text-lg md:text-xl font-black text-white">
            Formulir Permohonan Penilaian Kerusakan Bangunan Gedung
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111B2E] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Nama Gedung / Ruangan:</label>
          <input
            type="text"
            required
            value={namaBangunan}
            onChange={(e) => setNamaBangunan(e.target.value)}
            className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nomor Aset BMD / NUP:</label>
            <input
              type="text"
              required
              value={nupBmd}
              onChange={(e) => setNupBmd(e.target.value)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Pilihan Formulir (Standar PUPR):</label>
            <select
              value={altForm}
              onChange={(e) => {
                const f = e.target.value as TipeFormAlt;
                setAltForm(f);
                if (f === 'ALT_A') setJumlahLantai(1);
                else if (f === 'ALT_B') setJumlahLantai(2);
                else setJumlahLantai(3);
              }}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            >
              <option value="ALT_A">Form Alt.A (Bangunan 1 Lantai)</option>
              <option value="ALT_B">Form Alt.B (Bangunan 2 Lantai / Panggung)</option>
              <option value="ALT_C">Form Alt.C (Bangunan 3+ Lantai)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Jumlah Lantai:</label>
            <input
              type="number"
              min="1"
              value={jumlahLantai}
              onChange={(e) => setJumlahLantai(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Luas Bangunan (m²):</label>
            <input
              type="number"
              min="10"
              value={luasM2}
              onChange={(e) => setLuasM2(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            />
          </div>
        </div>

        {/* Delegated Storage Notice */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <UploadCloud className="w-4 h-4" />
            <span>Penyimpanan Google Drive Terdelegasi (0 MB Kuota PUPR)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Berkas foto kerusakan dan kover permohonan akan tersimpan langsung di Google Drive pengelola instansi pada folder kedinasan otomatis.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F2A900]/20"
        >
          <FileText className="w-4 h-4" />
          <span>{isSubmitting ? 'Mendaftarkan Permohonan...' : 'Daftarkan & Terbitkan Surat Permohonan Mandiri'}</span>
        </button>
      </form>
    </div>
  );
}

