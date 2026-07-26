import React, { useState } from 'react';
import { AIRecommendation } from '@/domain/spms';
import { Lightbulb, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIRecommendationsPanel({ recommendations }: { recommendations: AIRecommendation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(recommendations[0]?.id || null);

  if (!recommendations || recommendations.length === 0) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          Rekomendasi PURI AI
        </h2>
        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-bold">
          {recommendations.length} Actionable Items
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
        {recommendations.map((rec) => {
          const isExpanded = expandedId === rec.id;
          
          return (
            <div 
              key={rec.id} 
              className={cn(
                "rounded-lg border transition-all duration-200 overflow-hidden",
                isExpanded ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 bg-white/5 hover:border-white/10"
              )}
            >
              <button 
                className="w-full text-left p-3 flex items-start gap-3"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold font-mono mt-0.5 shrink-0 border", getPriorityColor(rec.priority))}>
                  {rec.priority}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-xs font-bold truncate", isExpanded ? "text-blue-300" : "text-slate-200")}>
                    {rec.title}
                  </h4>
                  {!isExpanded && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{rec.description}</p>
                  )}
                </div>
                
                <ChevronRight className={cn("w-4 h-4 text-slate-500 shrink-0 transition-transform", isExpanded && "rotate-90 text-blue-400")} />
              </button>

              {isExpanded && (
                <div className="px-3 pb-4 pt-1 text-[10px] border-t border-white/5 ml-12">
                  <p className="text-slate-300 leading-relaxed mb-3">{rec.description}</p>
                  
                  <div className="mb-3">
                    <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold block mb-1">Rasional</span>
                    <p className="text-amber-200/70 italic bg-black/20 p-2 rounded">{rec.rationale}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold block mb-1">Tindakan Disarankan</span>
                    <ul className="space-y-1">
                      {rec.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold block mb-1">Potensi Dampak</span>
                    <p className="text-emerald-400 font-medium flex items-center gap-1">
                      {rec.impact}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-[10px] font-bold transition-colors">
                      Implementasikan
                    </button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 rounded text-[10px] font-bold transition-colors">
                      Tolak
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
