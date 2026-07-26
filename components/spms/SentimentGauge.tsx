import React from 'react';
import { SPMSMetrics } from '@/domain/spms';
import { MessageCircle, Smile, Meh, Frown } from 'lucide-react';

export function SentimentGauge({ metrics }: { metrics: SPMSMetrics | null }) {
  if (!metrics) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  const total = metrics.sentimentPositif + metrics.sentimentNetral + metrics.sentimentNegatif;
  const posPct = total > 0 ? (metrics.sentimentPositif / total) * 100 : 0;
  const neuPct = total > 0 ? (metrics.sentimentNetral / total) * 100 : 0;
  const negPct = total > 0 ? (metrics.sentimentNegatif / total) * 100 : 0;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-sky-400" />
          Sentimen Warga
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Simple Bar Gauge */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/5">
          <div style={{ width: `${posPct}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
          <div style={{ width: `${neuPct}%` }} className="h-full bg-amber-500 transition-all duration-500" />
          <div style={{ width: `${negPct}%` }} className="h-full bg-rose-500 transition-all duration-500" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <Smile className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Positif</span>
            <span className="text-sm font-bold text-white font-mono">{metrics.sentimentPositif}</span>
            <span className="text-[9px] text-emerald-400 font-mono">{posPct.toFixed(1)}%</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <Meh className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Netral</span>
            <span className="text-sm font-bold text-white font-mono">{metrics.sentimentNetral}</span>
            <span className="text-[9px] text-amber-400 font-mono">{neuPct.toFixed(1)}%</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded bg-rose-500/10 border border-rose-500/20">
            <Frown className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Negatif</span>
            <span className="text-sm font-bold text-white font-mono">{metrics.sentimentNegatif}</span>
            <span className="text-[9px] text-rose-400 font-mono">{negPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
