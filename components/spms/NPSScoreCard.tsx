import React from 'react';
import { SPMSMetrics } from '@/domain/spms';
import { BarChart2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

export function NPSScoreCard({ metrics }: { metrics: SPMSMetrics | null }) {
  if (!metrics) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  // NPS is calculated as % Promoters - % Detractors
  const total = metrics.npsPromoters + metrics.npsPassives + metrics.npsDetractors;
  const promPct = total > 0 ? Math.round((metrics.npsPromoters / total) * 100) : 0;
  const passPct = total > 0 ? Math.round((metrics.npsPassives / total) * 100) : 0;
  const detPct = total > 0 ? Math.round((metrics.npsDetractors / total) * 100) : 0;

  // NPS scale -100 to 100
  let npsColor = 'text-blue-400';
  if (metrics.nps > 50) npsColor = 'text-emerald-400';
  else if (metrics.nps < 0) npsColor = 'text-rose-400';

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          Net Promoter Score
        </h2>
      </div>

      <div className="flex-1 flex items-center justify-between gap-4">
        <div className="flex flex-col justify-center items-center p-4 bg-white/5 rounded-xl border border-white/5 w-1/3 aspect-square">
          <span className={`text-3xl font-black ${npsColor} font-mono leading-none`}>
            {metrics.nps > 0 ? '+' : ''}{metrics.nps}
          </span>
          <span className="text-[8px] text-slate-400 uppercase mt-2 text-center">Skor NPS</span>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-3 h-3 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>Promoters (9-10)</span>
                <span className="font-mono text-emerald-400">{promPct}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${promPct}%` }} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 text-slate-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>Passives (7-8)</span>
                <span className="font-mono text-slate-400">{passPct}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${passPct}%` }} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThumbsDown className="w-3 h-3 text-rose-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>Detractors (0-6)</span>
                <span className="font-mono text-rose-400">{detPct}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${detPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
