'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Copy,
  Printer,
  X,
  Sparkles,
  Building2,
  Share2,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveBriefingModal({ isOpen, onClose }: ExecutiveBriefingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyWA = () => {
    const text = `*🏛️ LAPORAN EKSEKUTIF HARIAN PSIC - DINAS PUPR KABUPATEN GARUT*
*Tanggal:* ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}
*AI Digital Reputation Index:* 88.5 / 100 (SANGAT BAIK)
*Kepatuhan SLA Operator:* 96.2%

*🚨 TOP 3 ISU INFRASTRUKTUR DARURAT HARI INI:*
1. *[KRITIS - SLA 2 Jam]* Jembatan Penghubung Cikajang Amblas (Bidang SDA & Bina Marga) - Satgas Dalam Perjalanan
2. *[TINGGI - SLA 6 Jam]* Jalan Raya Tarogong Depan Bundaran Berlubang (Bidang Bina Marga) - Dalam Jadwal Tambal
3. *[NORMAL]* Pertanyaan Syarat PBG Rumah Tinggal (Bidang Bangunan Gedung) - Diselesaikan AI Bot (99.1% Akurat)

*📊 STATISTIK PELAYANAN OMNICHANNEL (11 KANAL):*
• Total Percakapan Masuk: 142 Tiket
• Diselesaikan Otomatis oleh AI: 115 Tiket (81%)
• Ditangani Operator Bidang: 27 Tiket (19%)

*💡 REKOMENDASI TINDAKAN STRATEGIS KADIS:*
1. Menerbitkan instruksi siaga alat berat di zona selatan (Cikajang-Cisompet) untuk mitigasi curah hujan tinggi.
2. Mempercepat proses PBG daring dengan integrasi loket MPP Garut.

_Dibuat otomatis oleh PURI Social Intelligence Center (PSIC) SMCC Dinas PUPR Kab. Garut_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/60 via-slate-900 to-purple-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  AI Executive Briefing — Kepala Dinas PUPR Garut
                </h3>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                  Daily Report
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Ringkasan Intelijen Sosial, Indeks Reputasi, dan Kepatuhan SLA •{' '}
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Indeks Reputasi Digital</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">88.5</span>
                <span className="text-xs text-emerald-400 font-semibold">/ 100</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Status: SANGAT BAIK (TERPERCAYA)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Kepatuhan SLA (24 Jam Terakhir)</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">96.2%</span>
                <span className="text-xs text-slate-400">Tepat Waktu</span>
              </div>
              <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-blue-500 h-full w-[96.2%]" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Tingkat Penyelesaian Otomatis AI</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">81.0%</span>
                <span className="text-xs text-purple-300">115 dari 142 Tiket</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Menghemat ±18.5 jam kerja operator bidang
              </p>
            </div>
          </div>

          {/* Top 3 Isu Darurat Infrastruktur */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Top 3 Isu Infrastruktur Urgent Hari Ini</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
                      KRITIS (SLA 2 JAM)
                    </Badge>
                    <span className="text-xs font-bold text-white">
                      Jembatan Penghubung Cikajang Amblas
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Banjir bandang memutus akses jalan raya utama. Pelapor: Warga Instagram (@asep_cikajang)
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    Bidang SDA & Bina Marga
                  </Badge>
                  <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                    Satgas Dalam Perjalanan
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                      TINGGI (SLA 6 JAM)
                    </Badge>
                    <span className="text-xs font-bold text-white">
                      Jalan Berlubang Dalam Simpang Lima Tarogong
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Membahayakan pengendara motor saat hujan. Pelapor: Warga Instagram (@asep_garut99)
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    Bidang Bina Marga
                  </Badge>
                  <p className="text-[10px] text-blue-400 mt-1 font-semibold">
                    Jadwal Tambal Cepat
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                      NORMAL (SLA 12 JAM)
                    </Badge>
                    <span className="text-xs font-bold text-white">
                      Pertanyaan Persyaratan PBG & SLF Rumah Tinggal
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Konsultasi izin mendirikan bangunan 2 lantai. Pelapor: Warga WhatsApp (+62812...)
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    Bidang Bangunan Gedung
                  </Badge>
                  <p className="text-[10px] text-purple-400 mt-1 font-semibold">
                    Diselesaikan Otomatis AI (99.1%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Policy Recommendations */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-slate-900 border border-purple-500/30 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Rekomendasi Tindakan Strategis Kepala Dinas (AI PURI Insights)</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Siaga Alat Berat Wilayah Selatan:</strong> Intensitas curah hujan tinggi memicu risiko jembatan dan tebing longsor di Cikajang-Cisompet. Rekomendasi penempatan ekskavator di posko wilayah selatan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Edukasi Daring PBG di Media Sosial:</strong> Tingginya pertanyaan terkait PBG (18% dari total tiket) mengindikasikan perlunya infografis alur SIMBG di Instagram dan Facebook PUPR Garut.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-500">
            Dihasilkan oleh PURI AI Engine v2.0 • Data sinkron realtime dari 11 kanal Omnichannel
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleCopyWA}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Format WA Kadis</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
