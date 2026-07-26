import React from 'react';
import { SurveyResultsSummary } from '@/domain/spms';
import { FileText, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export function SurveyOverview({ survey }: { survey: SurveyResultsSummary | null }) {
  if (!survey) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  const channelData = Object.entries(survey.byChannel).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <FileText className="w-4 h-4 text-pink-400" />
          Rekapitulasi Survei (SKM)
        </h2>
      </div>

      <div className="flex justify-between items-end mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase">Responden Aktif</span>
          <span className="text-2xl font-bold text-white font-mono leading-none mt-1">{survey.totalCompleted}</span>
          <span className="text-[9px] text-slate-500 mt-1">Response Rate: {survey.responseRate.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase">Rata-rata Dimensi</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono leading-none mt-1">
            {survey.avgOverall.toFixed(2)}<span className="text-sm text-slate-500">/5</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        <div className="w-1/2 flex flex-col">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <PieChartIcon className="w-3 h-3" /> Channel
          </h3>
          <div className="flex-1 min-h-[120px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="rgba(255,255,255,0.05)"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-1/2 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Top Dimensi</h3>
          {survey.dimensions.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5).map((dim, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-300 truncate pr-2">{dim.label}</span>
                <span className="text-white font-mono font-bold">{dim.avgScore.toFixed(1)}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(dim.avgScore / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
