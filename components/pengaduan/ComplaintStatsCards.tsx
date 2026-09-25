'use client';

import React from 'react';
import type { ComplaintStats } from '@/domain/models';

interface ComplaintStatsCardsProps {
  stats: ComplaintStats;
}

export function ComplaintStatsCards({ stats }: ComplaintStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <StatsCard label="Total Pengaduan" value={stats.total} color="bg-slate-400" />
      <StatsCard label="Kritis" value={stats.kritis} color="bg-red-500" highlight={stats.kritis > 0} />
      <StatsCard label="Tinggi" value={stats.tinggi} color="bg-orange-500" />
      <StatsCard label="Normal" value={stats.normal} color="bg-blue-500" />
      <StatsCard label="Menunggu" value={stats.pending} color="bg-yellow-500" />
      <StatsCard label="Diproses" value={stats.diproses} color="bg-cyan-500" />
      <StatsCard label="Selesai" value={stats.selesai} color="bg-emerald-500" />
    </div>
  );
}

function StatsCard({
  label,
  value,
  color,
  highlight = false,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-card p-3 flex flex-col gap-1.5 transition-all ${
        highlight ? 'border-red-500/30 bg-red-950/20' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
      </div>
      <span className="text-xl font-bold text-white font-mono">{value}</span>
    </div>
  );
}
