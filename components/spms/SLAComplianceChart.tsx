import React from 'react';
import { BidangPerformance } from '@/domain/spms';
import { SLA_TARGETS, LAYANAN_LIST } from '@/constants/spms';
import { Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export function SLAComplianceChart({ data }: { data: BidangPerformance[] }) {
  if (!data || data.length === 0) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  // Transform data for chart
  const chartData = data.map(b => ({
    name: b.bidangLabel.replace(' ', '\n'), // break into 2 lines if possible
    shortName: b.bidangLabel.substring(0, 15) + (b.bidangLabel.length > 15 ? '...' : ''),
    sla: b.slaCompliance,
    target: 95, // Default target for all, although it varies by layanan internally
    color: b.slaCompliance >= 95 ? '#10b981' : b.slaCompliance >= 85 ? '#f59e0b' : '#ef4444'
  }));

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Kepatuhan SLA per Bidang
        </h2>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm"></span> Tercapai</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-sm"></span> Mendekati</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-sm"></span> Terlampaui</span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="shortName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9 }} 
              interval={0}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/90 border border-white/10 px-3 py-2 rounded shadow-xl">
                      <p className="text-xs font-bold text-white mb-1">{data.name}</p>
                      <p className="text-[10px] text-slate-300">
                        SLA Compliance: <span className="font-mono font-bold" style={{ color: data.color }}>{data.sla}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Target 95%', fill: '#ef4444', fontSize: 10 }} />
            <Bar dataKey="sla" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
