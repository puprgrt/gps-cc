'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Video, Calendar, Clock, Users } from 'lucide-react';
import type { MeetingStats as MeetingStatsType } from '@/domain/puriMeet';
import { cn } from '@/lib/utils';

interface MeetingStatsProps {
  stats: MeetingStatsType | null;
  className?: string;
}

const STAT_CARDS = [
  {
    key: 'meetingHariIni' as const,
    label: 'Meeting Hari Ini',
    icon: Video,
    color: 'from-blue-600 to-blue-800',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    key: 'meetingMingguIni' as const,
    label: 'Jadwal Minggu Ini',
    icon: Calendar,
    color: 'from-emerald-600 to-emerald-800',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    key: 'durasiRataRata' as const,
    label: 'Durasi Rata-rata',
    icon: Clock,
    color: 'from-amber-600 to-amber-800',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    suffix: ' min',
  },
  {
    key: 'totalPesertaBulanIni' as const,
    label: 'Peserta Bulan Ini',
    icon: Users,
    color: 'from-purple-600 to-purple-800',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
  },
];

export function MeetingStats({ stats, className }: MeetingStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {STAT_CARDS.map((card, idx) => {
        const IconComp = card.icon;
        const value = stats ? stats[card.key] : 0;
        const suffix = 'suffix' in card ? card.suffix : '';

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="glass-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
          >
            {/* Gradient accent */}
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br',
              card.color
            )} />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {value}{suffix}
                </p>
              </div>
              <div className={cn('p-2.5 rounded-xl', card.iconBg)}>
                <IconComp className={cn('w-5 h-5', card.iconColor)} />
              </div>
            </div>

            {/* Live indicator for active meetings */}
            {card.key === 'meetingHariIni' && stats && stats.meetingAktif > 0 && (
              <div className="relative z-10 mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs text-red-400 font-medium">
                  {stats.meetingAktif} meeting aktif
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
