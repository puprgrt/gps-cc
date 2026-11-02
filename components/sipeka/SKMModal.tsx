'use client';

import React, { useState, useMemo } from 'react';
import { Star, CheckCircle, X, Award, AlertCircle, Sparkles } from 'lucide-react';
import { SKM_INDIKATOR_QUESTIONS, SkmService } from '@/sipeka/services/skmService';
import { cn } from '@/lib/utils';

interface SKMModalProps {
  isOpen: boolean;
  onClose: () => void;
  permohonanId: string;
  pengelolaId: string;
  onSuccessUnlock: (downloadUrl: string) => void;
}

export function SKMModal({ isOpen, onClose, permohonanId, pengelolaId, onSuccessUnlock }: SKMModalProps) {
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
  const [saran, setSaran] = useState<string>('Pelayanan aplikasi SIPEKA sangat cepat, transparan, dan mempermudah sekolah kami.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kalkulasi IKM Real-Time
  const currentIKM = useMemo(() => {
    try {
      return SkmService.calculateIKM({
        permohonanId,
        pengelolaId,
        u1_persyaratan: answers.U1 || 4,
        u2_prosedur: answers.U2 || 4,
        u3_waktu_pelayanan: answers.U3 || 4,
        u4_biaya_tarif: answers.U4 || 4,
        u5_produk_spesifikasi: answers.U5 || 4,
        u6_kompetensi_pelaksana: answers.U6 || 4,
        u7_perilaku_pelaksana: answers.U7 || 4,
        u8_maklumat_pelayanan: answers.U8 || 4,
        u9_penanganan_pengaduan: answers.U9 || 4,
      });
    } catch {
      return { rerataSkor: 4.0, ikmKonversi: 100.0, mutuPelayanan: 'A' as const, kategoriLabel: 'Sangat Baik' };
    }
  }, [answers, permohonanId, pengelolaId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/sipeka/skm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permohonanId,
          pengelolaId,
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
        throw new Error(data.error || 'Gagal mengirimkan survei SKM.');
      }

      onSuccessUnlock(data.data.downloadUrl);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan pengiriman survei.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A111F] border border-[#F2A900]/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0A2540] to-[#0A111F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2A900]/20 border border-[#F2A900]/30 flex items-center justify-center text-[#F2A900]">
              <Star className="w-5 h-5 fill-[#F2A900]" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#F2A900]">
                PermenPAN-RB No. 14 Tahun 2017
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                Survei Kepuasan Masyarakat (Mandatory SKM)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Alert Mandatori */}
        <div className="px-5 py-3 bg-[#F2A900]/10 border-b border-[#F2A900]/20 flex items-center gap-2 text-xs text-[#F2A900]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Pengisian 9 indikator survei ini wajib dilakukan untuk <strong>membuka kunci unduh</strong> Surat Hasil Analisis bertanda tangan elektronik (TTE BSrE).</span>
        </div>

        {/* Content Form Pertanyaan */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Nilai IKM Live Meter */}
          <div className="p-4 rounded-2xl bg-[#111B2E] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Prediksi Indeks Kepuasan (IKM):</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-white">{currentIKM.ikmKonversi}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Mutu Pelayanan:</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                <Award className="w-4 h-4" />
                <span>Mutu {currentIKM.mutuPelayanan} ({currentIKM.kategoriLabel})</span>
              </div>
            </div>
          </div>

          {/* 9 Indikator Questions */}
          <div className="space-y-4">
            {SKM_INDIKATOR_QUESTIONS.map((q, idx) => {
              const currentVal = answers[q.code] || 4;
              return (
                <div key={q.code} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0A2540] text-[#F2A900] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{q.name}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">{q.pertanyaan}</p>
                    </div>
                  </div>

                  {/* 4 Opsi Jawaban Radio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.code]: opt.score }))}
                        className={cn(
                          "px-3 py-2 rounded-lg text-left text-[11px] font-medium transition-all flex items-center gap-2 border",
                          currentVal === opt.score
                            ? "bg-[#0A2540] text-[#F2A900] border-[#F2A900]/40 shadow-sm"
                            : "bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10"
                        )}
                      >
                        <span className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                          currentVal === opt.score ? "bg-[#F2A900] text-[#0A2540]" : "bg-slate-800 text-slate-400"
                        )}>
                          {opt.score}
                        </span>
                        <span className="line-clamp-1">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Saran dan Masukan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Saran, Kritik, atau Masukan untuk Pelayanan Dinas PUPR Garut:
            </label>
            <textarea
              rows={3}
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
              placeholder="Tuliskan pengalaman Anda dalam pengurusan penilaian kerusakan gedung..."
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2 shadow-lg shadow-[#F2A900]/20"
            >
              {isSubmitting ? (
                <span>Menyimpan & Membuka Kunci...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim SKM & Buka Kunci Unduh</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

