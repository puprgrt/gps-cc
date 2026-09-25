'use client';

import React from 'react';
import { Search, Download, X } from 'lucide-react';
import type { UsePengaduanFilters } from '@/hooks/usePengaduan';
import type { BidangPUPR } from '@/domain/models';

interface ComplaintFiltersProps {
  filters: UsePengaduanFilters;
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: () => void;
  onStatusChange: (status?: string) => void;
  onPrioritasChange: (prioritas?: string) => void;
  onBidangChange: (bidang?: string) => void;
  onExportCsv: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const BIDANG_OPTIONS: { id: BidangPUPR | 'SEMUA'; label: string }[] = [
  { id: 'SEMUA', label: 'Semua Bidang' },
  { id: 'BINA_MARGA', label: 'Bina Marga (Jalan & Jembatan)' },
  { id: 'SDA', label: 'Sumber Daya Air (SDA)' },
  { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung' },
  { id: 'AMPL', label: 'AMPL / Sanitasi' },
  { id: 'PENATAAN_RUANG', label: 'Penataan Ruang' },
  { id: 'JASA_KONSTRUKSI', label: 'Jasa Konstruksi' },
  { id: 'SEKRETARIAT', label: 'Sekretariat' },
];

export function ComplaintFilters({
  filters,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onStatusChange,
  onPrioritasChange,
  onBidangChange,
  onExportCsv,
  onResetFilters,
  hasActiveFilters,
}: ComplaintFiltersProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 flex-1 min-w-[240px] max-w-md shadow-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1 px-1"
            placeholder="Cari nomor tiket, pelapor, lokasi, kata kunci..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          />
          {searchInput && (
            <button
              onClick={() => {
                onSearchInputChange('');
                onSearchSubmit();
              }}
              className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onSearchSubmit}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 cursor-pointer transition-colors"
          >
            Cari
          </button>
        </div>

        {/* Bidang Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bidang:</span>
          <select
            value={filters.bidang || 'SEMUA'}
            onChange={(e) => onBidangChange(e.target.value === 'SEMUA' ? undefined : e.target.value)}
            className="bg-slate-900/80 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/20 transition-colors"
          >
            {BIDANG_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" /> Reset Filter
          </button>
        )}

        {/* Export CSV Button */}
        <button
          onClick={onExportCsv}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Ekspor CSV
        </button>
      </div>

      {/* Status & Priority Pills */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
          {['SEMUA', 'PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK'].map((s) => {
            const isSelected = (!filters.status && s === 'SEMUA') || filters.status === s;
            const label = s === 'PENDING' ? 'Menunggu' : s === 'DIPROSES' ? 'Diproses' : s === 'SELESAI' ? 'Selesai' : s === 'DITOLAK' ? 'Ditolak' : 'Semua';
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s === 'SEMUA' ? undefined : s)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Prioritas Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prioritas:</span>
          {['SEMUA', 'KRITIS', 'TINGGI', 'NORMAL'].map((p) => {
            const isSelected = (!filters.prioritas && p === 'SEMUA') || filters.prioritas === p;
            return (
              <button
                key={p}
                onClick={() => onPrioritasChange(p === 'SEMUA' ? undefined : p)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? p === 'KRITIS'
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : p === 'TINGGI'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
