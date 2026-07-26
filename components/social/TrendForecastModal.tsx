'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CloudRain,
  ShieldCheck,
  Clock,
  Sparkles,
  Copy,
  Check,
  X,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendForecastService,
  type TrendForecastReport,
  type BidangForecast,
} from '@/services/trendForecastService';

interface TrendForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrendForecastModal({ isOpen, onClose }: TrendForecastModalProps) {
  const [period, setPeriod] = useState<7 | 14 | 30>(14);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const report: TrendForecastReport = TrendForecastService.getForecast(period);

  const handleCopyWA = () => {
    const text = `*📈 LAPORAN PREDIKSI TREN AI (${report.forecastPeriodDays} HARI KE DEPAN)*
*Dinas PUPR Kabupaten Garut - PSIC Command Center*
*Indeks Risiko Hidrometeorologi:* ${report.weatherRiskIndex} / 100 (SIAGA 1)
*Prakiraan BMKG:* ${report.weatherCondition}

*📊 PROYEKSI LONJAKAN PENGADUAN PUBLIK:*
• Volume Saat Ini: ±142 tiket/minggu
• Prediksi Lonjakan: +${report.changeVsPreviousPeriod}% (${report.totalPredictedVolume} tiket)

*🚨 SOROTAN RISIKO BIDANG PUPR:*
${report.bidangForecasts
  .map(
    (b) =>
      `• *[${b.riskLevel}] ${b.bidangLabel}:* ${b.currentWeeklyVolume} -> *${b.predictedWeeklyVolume} tiket (${
        b.changePercentage >= 0 ? `+${b.changePercentage}%` : `${b.changePercentage}%`
      })*\n  _Pemicu:_ ${b.primaryDriver}`
  )
  .join('\n\n')}

*💡 REKOMENDASI MITIGASI STRATEGIS KADIS:*
1. Siaga alat berat ekskavator di posko Cikajang (SDA).
2. Stok aspal dingin untuk penambalan 2 jam jalur arteri raya (Bina Marga).
3. Penguatan SIAGA 1 armada tangki air bersih (AMPL).

_Dihasilkan oleh PURI AI Time-Series Forecasting Engine v2.0_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getRiskBadge = (risk: 'KRITIS' | 'TINGGI' | 'NORMAL') => {
    if (risk === 'KRITIS') {
      return (
        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
          RISIKO KRITIS
        </Badge>
      );
    }
    if (risk === 'TINGGI') {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
          RISIKO TINGGI
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
        STABIL / NORMAL
      </Badge>
    );
  };

  const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-rose-400" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/60 via-slate-900 to-purple-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  AI Trend Forecasting & Predictive Analytics
                </h3>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                  Time-Series Model
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Proyeksi lonjakan laporan publik dan pemetaan risiko infrastruktur Dinas PUPR Kab. Garut
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

        {/* Period Selector & Weather Alert */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cakupan Prakiraan:</span>
            </span>
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  period === d
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {d} Hari Ke Depan
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <CloudRain className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Indeks Hidrometeorologi: {report.weatherRiskIndex}/100 (SIAGA 1)</span>
          </div>
        </div>

        {/* Results Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Executive Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-blue-950/50 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Ringkasan Prediksi AI PURI ({report.forecastPeriodDays} Hari Ke Depan)</span>
              </span>
              <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                Prediksi Lonjakan: +{report.changeVsPreviousPeriod}%
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{report.executiveSummary}</p>
          </div>

          {/* Bidang Breakdown Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Proyeksi Beban Kerja & Rekomendasi Mitigasi per Bidang PUPR
            </h4>

            <div className="space-y-3">
              {report.bidangForecasts.map((bf) => (
                <div
                  key={bf.bidang}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-purple-500/50 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getRiskBadge(bf.riskLevel)}
                      <h5 className="text-sm font-extrabold text-white">{bf.bidangLabel}</h5>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <span>{bf.currentWeeklyVolume}</span>
                        <span className="text-slate-500">→</span>
                        <span
                          className={
                            bf.changePercentage > 0
                              ? 'text-rose-400'
                              : bf.changePercentage < 0
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }
                        >
                          {bf.predictedWeeklyVolume} Tiket (
                          {bf.changePercentage >= 0
                            ? `+${bf.changePercentage}%`
                            : `${bf.changePercentage}%`}
                          )
                        </span>
                        {getTrendIcon(bf.trendDirection)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Pemicu Lonjakan (Driver):
                      </span>
                      <p className="text-slate-300">{bf.primaryDriver}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1">
                      <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Rekomendasi Tindakan Mitigasi:</span>
                      </span>
                      <p className="text-slate-200">{bf.mitigationRecommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-500">
            Dihasilkan oleh PURI Time-Series AI • Berdasarkan curah hujan BMKG & riwayat GPS-CC
          </span>

          <div className="flex items-center gap-2">
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
                  <span>Salin Prakiraan WA Kadis</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
