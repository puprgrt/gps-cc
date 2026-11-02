'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DaftarSimakMandiriForm } from '@/components/sipeka/DaftarSimakMandiriForm';

export default function PermohonanBaruPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link
          href="/sipeka"
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#F2A900]">
              Layanan Publik Mandiri • Bidang Bangunan Gedung
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
            Formulir Permohonan Penilaian Kerusakan Bangunan Gedung
          </h1>
        </div>
      </div>

      {/* 5-Step Interactive Daftar Simak Mandiri Form */}
      <DaftarSimakMandiriForm />
    </div>
  );
}
