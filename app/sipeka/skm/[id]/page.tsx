'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { SKM_INDIKATOR_QUESTIONS, SkmService } from '@/sipeka/services/skmService';
import { cn } from '@/lib/utils';

export default function DedicatedSKMPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [answers, setAnswers] = useState<Record<string, number>>({
    U1: 4,
    U2: 4,
    U3: 4,
    U4: 4,
    U5: 4,
    U6: 4,
    U7: 4,
    U8: 4,
    U9: 4,
  });
  const [saran, setSaran] = useState<string>('Pelayanan penilaian bangunan gedung sangat memuaskan, objektif, dan transparan.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/sipeka/skm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permohonanId: id,
          pengelolaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          u1_persyaratan: answers.U1,
          u2_prosedur: answers.U2,
          u3_waktu_pelayanan: answers.U3,
          u4_biaya_tarif: answers.U4,
          u5_produk_spesifikasi: answers.U5,
          u6_kompetensi_pelaksana: answers.U6,
          u7_perilaku_pelaksana: answers.U7,
          u8_maklumat_pelayanan: answers.U8,
          u9_penanganan_pengaduan: answers.U9,
          saran_masukan: saran,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim survei SKM.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kendala saat mengirim survei.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="bg-[#111B2E] border border-emerald-500/40 rounded-3xl p-8 max-w-lg text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Survei Kepuasan Berhasil Disimpan</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Terima kasih atas partisipasi Anda dalam survei SKM PermenPAN-RB No. 14 Tahun 2017. Akses unduh berkas legal Surat Hasil Analisis telah dibuka secara otomatis.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`/api/v1/sipeka/permohonan/${id}/download-surat-hasil`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
            >
              Unduh Surat Hasil TTE (PDF)
            </a>
            <Link
              href={`/sipeka/permohonan/${id}`}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Kembali ke Detail Permohonan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link
          href={`/sipeka/permohonan/${id}`}
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#F2A900]">
            PermenPAN-RB No. 14 Tahun 2017
          </span>
          <h1 className="text-lg md:text-xl font-black text-white">
            Survei Kepuasan Masyarakat (Mandatory SKM)
          </h1>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 flex items-center gap-3 text-xs text-[#F2A900]">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Survei ini bersifat wajib untuk membuka kunci unduh Surat Hasil Analisis bertanda tangan digital BSrE.</span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Pertanyaan Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {SKM_INDIKATOR_QUESTIONS.map((q, idx) => {
          const currentVal = answers[q.code] || 4;
          return (
            <div key={q.code} className="p-5 rounded-2xl bg-[#111B2E] border border-white/10 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#0A2540] text-[#F2A900] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{q.name}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{q.pertanyaan}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.code]: opt.score }))}
                    className={cn(
                      "p-3 rounded-xl text-left text-xs font-medium transition-all flex items-center gap-2.5 border",
                      currentVal === opt.score
                        ? "bg-[#0A2540] text-[#F2A900] border-[#F2A900]/50 shadow-md"
                        : "bg-slate-900/40 text-slate-400 border-white/5 hover:border-white/15"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      currentVal === opt.score ? "bg-[#F2A900] text-[#0A2540]" : "bg-slate-800 text-slate-400"
                    )}>
                      {opt.score}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="p-5 rounded-2xl bg-[#111B2E] border border-white/10 space-y-2">
          <label className="text-xs font-bold text-white">Saran & Masukan:</label>
          <textarea
            rows={3}
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl text-sm font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#F2A900]/20"
        >
          <Star className="w-5 h-5 fill-[#0A2540]" />
          <span>{isSubmitting ? 'Mengirim Survei...' : 'Kirim Survei & Buka Kunci Unduh Surat Hasil'}</span>
        </button>
      </form>
    </div>
  );
}

