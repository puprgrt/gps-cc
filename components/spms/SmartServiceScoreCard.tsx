import React from 'react';
import { SmartServiceScore } from '@/domain/spms';
import { SSS_GRADES } from '@/constants/spms';
import { Award, TrendingUp, TrendingDown, Info } from 'lucide-react';

export function SmartServiceScoreCard({ sss }: { sss: SmartServiceScore | null }) {
  if (!sss) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  const gradeConfig = SSS_GRADES.find(g => g.grade === sss.grade) || SSS_GRADES[4];
  const isTrendUp = sss.trend >= 0;

  return (
    <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">
      {/* Background glow based on grade */}
      <div 
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: gradeConfig.color }}
      />

      <div className="flex items-center justify-between mb-6 z-10">
        <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Smart Service Score
        </h2>
        <div className="group relative">
          <Info className="w-4 h-4 text-slate-500 hover:text-white cursor-help transition-colors" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-[10px] text-slate-300">
            Nilai komposit yang memperhitungkan IKM, SLA, Kecepatan Respons, Penyelesaian, Kualitas AI, dan Penanganan Pengaduan.
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        {/* Simple SVG Gauge */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              fill="none"
              strokeDasharray="251.2"
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={gradeConfig.color}
              strokeWidth="12"
              fill="none"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * sss.totalScore) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white font-mono leading-none tracking-tighter">
              {sss.grade}
            </span>
            <span className="text-xs font-bold uppercase mt-1" style={{ color: gradeConfig.color }}>
              {gradeConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 z-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Total Skor</span>
            <span className="text-2xl font-bold text-white font-mono leading-none mt-1">
              {sss.totalScore.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase">vs Bulan Lalu</span>
            <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${isTrendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {isTrendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(sss.trend)}%
            </div>
          </div>
        </div>
        
        {/* Top 3 Components Contribution */}
        <div className="mt-2 pt-4 border-t border-white/10 space-y-2">
          {sss.components.sort((a, b) => b.weighted - a.weighted).slice(0, 3).map((comp, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 truncate pr-2">{comp.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">+{comp.weighted.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
