'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Building2, HelpCircle } from 'lucide-react';
import { DamageCalculatorWidget } from '@/components/sipeka/DamageCalculatorWidget';

export default function SipekaCalculatorPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/sipeka"
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#F2A900] uppercase tracking-wider">
                Standar KemenPUPR No. 24/PRT/M/2008
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Kalkulator Penilaian Kerusakan Bangunan Gedung (2-Tahap)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0A2540]/60 px-3.5 py-2 rounded-xl border border-[#F2A900]/20">
          <HelpCircle className="w-4 h-4 text-[#F2A900]" />
          <span>Mendukung Form Alt.A, Alt.B & Alt.C Standar Sekolah & Gedung Negara</span>
        </div>
      </div>

      {/* Interactive Damage Calculator Widget */}
      <DamageCalculatorWidget />
    </div>
  );
}

