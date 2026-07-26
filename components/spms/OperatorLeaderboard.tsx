import React from 'react';
import { OperatorPerformance } from '@/domain/spms';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OperatorLeaderboard({ operators }: { operators: OperatorPerformance[] }) {
  if (!operators || operators.length === 0) {
    return <div className="glass-card p-6 h-64 animate-pulse bg-white/5" />;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 2: return <Medal className="w-4 h-4 text-slate-300" />;
      case 3: return <Medal className="w-4 h-4 text-amber-600" />;
      default: return <span className="text-xs font-bold text-slate-500 w-4 text-center">{rank}</span>;
    }
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          Operator Leaderboard
        </h2>
        <span className="text-[9px] text-slate-500 bg-white/5 px-2 py-1 rounded">Top 5</span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {operators.slice(0, 5).map((op) => (
          <div key={op.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="w-6 shrink-0 flex justify-center">
              {getRankIcon(op.rank)}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {op.avatarUrl ? (
                <img src={op.avatarUrl} alt={op.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  {op.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{op.name}</h3>
              <p className="text-[10px] text-slate-400 truncate">{op.bidangLabel}</p>
            </div>
            
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-emerald-400 font-mono">{op.tingkatKepuasan}%</span>
                <span className="text-[9px] text-slate-500">CSAT</span>
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-white font-mono">{op.jumlahSelesai}</span> selesai
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-2 py-2 border-t border-white/5 text-[10px] text-blue-400 font-medium hover:text-blue-300 hover:bg-blue-900/10 transition-colors">
        Lihat Semua Operator
      </button>
    </div>
  );
}
