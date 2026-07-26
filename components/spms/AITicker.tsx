import React from 'react';
import { AIInsight } from '@/domain/spms';
import { Sparkles } from 'lucide-react';

export function AITicker({ insights }: { insights: AIInsight[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="glass-card flex items-center overflow-hidden h-10 px-4 border border-blue-500/20 bg-blue-500/5">
      <div className="flex items-center gap-2 shrink-0 mr-4 z-10 bg-slate-900/50 pr-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">AI Insights</span>
        <div className="w-[1px] h-4 bg-white/20 ml-2" />
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* CSS Marquee Animation */}
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12">
          {insights.map((insight, idx) => (
            <span key={insight.id} className="text-xs text-slate-300 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                insight.priority === 'HIGH' ? 'bg-rose-500' : 
                insight.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              {insight.text}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {insights.map((insight, idx) => (
            <span key={`dup-${insight.id}`} className="text-xs text-slate-300 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                insight.priority === 'HIGH' ? 'bg-rose-500' : 
                insight.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              {insight.text}
            </span>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
