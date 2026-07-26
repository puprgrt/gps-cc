import React from 'react';
import { EarlyWarning } from '@/domain/spms';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

export function EarlyWarningTicker({ warnings }: { warnings: EarlyWarning[] }) {
  if (!warnings || warnings.length === 0) return null;

  const getIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default: return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'border-l-rose-500 bg-rose-500/5';
      case 'WARNING': return 'border-l-amber-500 bg-amber-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {warnings.map((warning) => (
        <div 
          key={warning.id} 
          className={`flex items-start gap-3 p-3 rounded-r-lg border border-white/5 border-l-4 ${getBorderColor(warning.level)} backdrop-blur-sm relative group`}
        >
          {getIcon(warning.level)}
          
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-200 mb-0.5">{warning.title}</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">{warning.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-mono text-slate-500 bg-black/20 px-1.5 py-0.5 rounded">
                {warning.affectedBidang} {warning.affectedLayanan ? `• ${warning.affectedLayanan}` : ''}
              </span>
              <span className="text-[9px] font-mono font-bold text-white">
                {warning.currentValue} / {warning.threshold}
              </span>
            </div>
          </div>
          
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded absolute top-2 right-2 text-slate-500 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
