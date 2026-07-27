import React from 'react';
import { AIPerformance } from '@/domain/spms';
import { Bot, Zap, BrainCircuit, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function AIPerformanceCard({ ai }: { ai: AIPerformance | null }) {
  if (!ai) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col border-t-2 border-t-purple-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <img src="/favicon.ico" alt="PURI" className="w-4 h-4 object-contain" />
          PURI AI Quality Index
        </h2>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">v2.4</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-3xl font-black text-white font-mono leading-none">{ai.asqiScore}</span>
          <span className="text-[9px] text-slate-400 mt-1 uppercase">Skor ASQI</span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400">Total Interaksi</span>
          <span className="text-sm font-bold text-white font-mono">{ai.totalRequests.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 justify-center">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-300">
            <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-blue-400"/> Akurasi Klasifikasi</span>
            <span className="font-mono">{ai.classificationAccuracy}%</span>
          </div>
          <Progress value={ai.classificationAccuracy} className="h-1.5 bg-white/5" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-300">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400"/> Akurasi Jawaban</span>
            <span className="font-mono">{ai.answerAccuracy}%</span>
          </div>
          <Progress value={ai.answerAccuracy} className="h-1.5 bg-white/5 [&>div]:bg-emerald-500" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-300">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400"/> Auto-Answer Rate</span>
            <span className="font-mono">{ai.autoAnswerRate}%</span>
          </div>
          <Progress value={ai.autoAnswerRate} className="h-1.5 bg-white/5 [&>div]:bg-yellow-500" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-[10px]">
        <div className="flex flex-col">
          <span className="text-slate-400">Response Time</span>
          <span className="text-white font-mono font-bold">{ai.avgResponseTimeMs} ms</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-400">Eskalasi ke Operator</span>
          <span className="text-rose-400 font-mono font-bold">{ai.escalationCount} tiket</span>
        </div>
      </div>
    </div>
  );
}
