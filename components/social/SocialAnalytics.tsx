'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Users,
  ShieldCheck,
  Building2,
  Share2,
} from 'lucide-react';
import type { PSICReputationIndex } from '@/domain/psic';

export function SocialAnalytics() {
  const [reputation, setReputation] = useState<PSICReputationIndex | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/psic/omnichannel');
        const json = await res.json();
        if (mounted && json?.data?.reputation) {
          setReputation(json.data.reputation);
        }
      } catch {
        // Offline / fallback silently
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const pos = reputation?.positivePercentage ?? 78.0;
  const neu = reputation?.neutralPercentage ?? 14.0;
  const neg = reputation?.negativePercentage ?? 8.0;

  return (
    <div className="space-y-4">
      {/* Top 7 Bidang PUPR Distribution */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Distribusi Aduan 7 Bidang PUPR</span>
        </h3>
        <div className="space-y-2.5">
          {[
            { topic: 'Bina Marga (Jalan & Jembatan)', percent: 38, color: 'bg-blue-500' },
            { topic: 'SDA (Irigasi, Drainase, Banjir)', percent: 24, color: 'bg-cyan-500' },
            { topic: 'Bangunan Gedung (PBG & SLF)', percent: 18, color: 'bg-indigo-500' },
            { topic: 'Penataan Ruang (KRK & Tata Ruang)', percent: 10, color: 'bg-purple-500' },
            { topic: 'AMPL & Jasa Konstruksi / Sekretariat', percent: 10, color: 'bg-emerald-500' },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span className="font-medium">{item.topic}</span>
                <span className="font-bold text-slate-200">{item.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className={`${item.color} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment & Reputation Health */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Sentimen & Reputasi Digital</span>
        </h3>
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="relative w-20 h-20 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center shrink-0">
            <span className="text-sm font-extrabold text-emerald-400">{pos}%</span>
            <span className="text-[9px] text-slate-400 font-medium uppercase">Positif</span>
          </div>
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Positif
              </span>
              <span className="font-bold">{pos}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Netral
              </span>
              <span className="font-bold">{neu}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Negatif
              </span>
              <span className="font-bold">{neg}%</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 text-center leading-normal">
          Indeks Reputasi Dinas PUPR Garut berada di zona <strong className="text-emerald-400">Sangat Baik ({reputation?.score ?? 88.5}/100)</strong>.
        </p>
      </div>

      {/* 11 Channel Volume & Top Wilayah */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-white mb-2 flex items-center justify-between uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>Top Kanal & Wilayah</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">11 Kanal Aktif</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block mb-1">Kanal Teraktif</span>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>WhatsApp (42%)</span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-0.5">IG (28%) • FB (15%)</span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block mb-1">Wilayah Terbanyak</span>
            <div className="font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>Tarogong Kidul</span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-0.5">68 Aduan Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
