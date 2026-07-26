import React from 'react';
import { BidangPerformance } from '@/domain/spms';
import { BIDANG_LIST } from '@/constants/spms';
import { Layers } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export function BidangPerformanceTable({ data }: { data: BidangPerformance[] }) {
  if (!data || data.length === 0) {
    return <div className="glass-card p-6 h-64 animate-pulse bg-white/5" />;
  }

  const getBidangColor = (bidangId: string) => {
    return BIDANG_LIST.find(b => b.id === bidangId)?.color || '#3b82f6';
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Kinerja Bidang (Peringkat)
        </h2>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-2 font-bold w-1/4">Bidang</th>
              <th className="py-3 px-2 font-bold text-center">Kepuasan</th>
              <th className="py-3 px-2 font-bold text-center">SLA</th>
              <th className="py-3 px-2 font-bold text-center">Selesai</th>
              <th className="py-3 px-2 font-bold text-center">Response (m)</th>
              <th className="py-3 px-2 font-bold w-24">Trend (12B)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.map((row, idx) => {
              const color = getBidangColor(row.bidang);
              const trendData = row.trendBulanan.map((val, i) => ({ i, val }));
              
              return (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: `${color}30`, color: color }}>
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-200 text-xs truncate max-w-[120px]">{row.bidangLabel}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-white font-mono">{row.nilaiKepuasan}%</span>
                      <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.nilaiKepuasan}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-mono text-xs font-bold ${row.slaCompliance >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {row.slaCompliance}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300 font-mono text-xs">
                    {row.totalSelesai}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300 font-mono text-xs">
                    {row.avgResponseTime}
                  </td>
                  <td className="py-3 px-2 h-10 w-24">
                    <div className="w-full h-8 opacity-70 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <YAxis domain={['dataMin', 'dataMax']} hide />
                          <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
