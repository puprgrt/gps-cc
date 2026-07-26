import React from 'react';
import { SPMSPeriod, LayananType } from '@/domain/spms';
import { BidangPUPR } from '@/domain/aiRouting';
import { Calendar, Filter, Layers, Briefcase } from 'lucide-react';
import { BIDANG_LIST, LAYANAN_LIST } from '@/constants/spms';

interface DashboardFiltersProps {
  period: SPMSPeriod;
  bidang: BidangPUPR | 'ALL';
  layanan: LayananType | 'ALL';
  onPeriodChange: (p: SPMSPeriod) => void;
  onBidangChange: (b: BidangPUPR | 'ALL') => void;
  onLayananChange: (l: LayananType | 'ALL') => void;
}

export function DashboardFilters({
  period, bidang, layanan, onPeriodChange, onBidangChange, onLayananChange
}: DashboardFiltersProps) {
  
  const periods: { value: SPMSPeriod; label: string }[] = [
    { value: 'TODAY', label: 'Hari Ini' },
    { value: 'WEEK', label: 'Minggu Ini' },
    { value: 'MONTH', label: 'Bulan Ini' },
    { value: 'QUARTER', label: 'Kuartal Ini' },
    { value: 'YEAR', label: 'Tahun Ini' },
  ];

  const availableLayanan = bidang === 'ALL' 
    ? LAYANAN_LIST 
    : LAYANAN_LIST.filter(l => l.bidang === bidang);

  return (
    <div className="glass-card p-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mr-2">Filter:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Period Filter */}
        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${
                period === p.value 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Bidang Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-1.5 border border-white/5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={bidang}
            onChange={(e) => {
              onBidangChange(e.target.value as any);
              onLayananChange('ALL'); // Reset layanan when bidang changes
            }}
            className="bg-transparent text-[10px] font-bold text-slate-200 focus:outline-none appearance-none cursor-pointer pr-4"
          >
            <option value="ALL" className="bg-slate-800">Semua Bidang</option>
            {BIDANG_LIST.map(b => (
              <option key={b.id} value={b.id} className="bg-slate-800">{b.label}</option>
            ))}
          </select>
        </div>

        {/* Layanan Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-1.5 border border-white/5">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={layanan}
            onChange={(e) => onLayananChange(e.target.value as any)}
            className="bg-transparent text-[10px] font-bold text-slate-200 focus:outline-none appearance-none cursor-pointer pr-4 max-w-[200px] truncate"
          >
            <option value="ALL" className="bg-slate-800">Semua Layanan</option>
            {availableLayanan.map(l => (
              <option key={l.id} value={l.id} className="bg-slate-800">{l.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Custom Range</span>
        </button>
      </div>
    </div>
  );
}
