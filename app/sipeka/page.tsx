'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Calculator, 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Send, 
  Award,
  Search,
  Filter
} from 'lucide-react';
import { PermohonanPenilaian, StatusPermohonan } from '@/sipeka/types';
import { WorkflowStepper } from '@/components/sipeka/WorkflowStepper';
import { cn } from '@/lib/utils';

export default function SipekaDashboardPage() {
  const [permohonanList, setPermohonanList] = useState<PermohonanPenilaian[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/v1/sipeka/permohonan');
        const json = await res.json();
        if (json.success && json.data) {
          setPermohonanList(json.data);
        }
      } catch (err) {
        console.error('Gagal mengambil data permohonan SIPEKA:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered List
  const filteredList = permohonanList.filter((p) => {
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchSearch =
      searchQuery === '' ||
      p.nomor_permohonan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bangunan?.nama_bangunan && p.bangunan.nama_bangunan.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  // Metrik Ringkasan
  const totalPermohonan = permohonanList.length;
  const dalamProses = permohonanList.filter((p) => p.status !== 'SELESAI' && p.status !== 'DRAFT').length;
  const menungguSkm = permohonanList.filter((p) => p.status === 'MENUNGGU_SKM').length;
  const selesaiArsip = permohonanList.filter((p) => p.status === 'SELESAI').length;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Kedinasan PUPR Garut */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A2540] via-[#0D1B2A] to-[#0A111F] border border-[#F2A900]/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#F2A900]/20 text-[#F2A900] border border-[#F2A900]/40">
              <Building2 className="w-4 h-4" />
              <span>Bidang Bangunan Gedung • Dinas PUPR Kabupaten Garut</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              SIPEKA (Sistem Penilaian Kerusakan Bangunan Gedung)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Platform SPBE terpadu dengan standar IDDS untuk penilaian kuantitatif 2-tahap KemenPUPR, delegated cloud storage 0 MB Dinas, validasi berjenjang, dan Tanda Tangan Elektronik (TTE) legal BSrE.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/sipeka/kalkulator"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-[#F2A900] border border-[#F2A900]/40 hover:bg-[#0A2540]/80 transition-all flex items-center gap-2 shadow-md"
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator PUPR</span>
            </Link>

            <Link
              href="/sipeka/permohonan/baru"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2 shadow-lg shadow-[#F2A900]/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajukan Permohonan</span>
            </Link>
          </div>
        </div>

        {/* Ornamen Latar IDDS */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#F2A900]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stepper Workflow 10 Tahap IDDS (Default sample pada tahap 2) */}
      <WorkflowStepper currentStatus={permohonanList[0]?.status || 'SUBMITTED'} />

      {/* Grid Metrik Ringkasan (IDDS KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111B2E] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Permohonan</span>
            <FileText className="w-4 h-4 text-[#F2A900]" />
          </div>
          <div className="text-2xl font-black text-white">{totalPermohonan}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tercatat di Database</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B2E] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Dalam Proses / Disposisi</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{dalamProses}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tahap 2 s/d Tahap 8</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B2E] border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Menunggu SKM</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{menungguSkm}</div>
          <span className="text-[10px] text-amber-300 mt-1 block">Unduh Terkunci Gate SKM</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B2E] border border-emerald-500/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Selesai & Ter-TTE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{selesaiArsip}</div>
          <span className="text-[10px] text-emerald-300 mt-1 block">Legalitas BSrE Terbit</span>
        </div>
      </div>

      {/* Bagian Daftar Permohonan Penilaian */}
      <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Daftar Berkas Permohonan Penilaian Kerusakan</h3>
            <p className="text-xs text-slate-400">Pantau proses permohonan mandiri, disposisi, dan legalitas TTE</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor tiket atau gedung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900] w-52 md:w-64"
              />
            </div>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#F2A900]"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUBMITTED">Tahap 1: Pengajuan Mandiri</option>
              <option value="DISPOSISI_SUBKOORD">Tahap 2: Disposisi Kabid</option>
              <option value="DISPOSISI_TIM_TEKNIS">Tahap 3: Disposisi Subkoord</option>
              <option value="VERIFIKASI_BERKAS">Tahap 4: Verifikasi Berkas</option>
              <option value="ANALISIS_TEKNIS">Tahap 5: Analisis 2-Tahap</option>
              <option value="VALIDASI_SUBKOORD">Tahap 6: Validasi Subkoord</option>
              <option value="APPROVAL_KADIS">Tahap 8: Approval Kadis</option>
              <option value="MENUNGGU_SKM">Tahap 9: Menunggu SKM</option>
              <option value="SELESAI">Tahap 10: Selesai</option>
            </select>
          </div>
        </div>

        {/* Tabel / Kartu Permohonan */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Memuat data permohonan penilaian bangunan gedung...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada permohonan yang sesuai kriteria pencarian.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredList.map((item) => {
              const isLocked = item.status !== 'SELESAI';
              return (
                <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] p-3 rounded-xl transition-colors">
                  {/* Info Gedung & Tiket */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#F2A900]">
                        {item.nomor_permohonan}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A2540] text-slate-300 border border-white/10">
                        {item.alt_form === 'ALT_A' ? '1 Lantai' : item.alt_form === 'ALT_B' ? '2 Lantai' : '3+ Lantai'}
                      </span>
                      {item.butuh_survey && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30">
                          Survey Lapangan
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {item.bangunan?.nama_bangunan || 'Gedung Bangunan Negara'}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Pemohon: {item.pengelola?.nama_lengkap || 'Pengelola BG'}</span>
                      <span>•</span>
                      <span>Tanggal: {item.created_at.split('T')[0]}</span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    {/* Status Badge */}
                    <div className="text-left md:text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold inline-block border",
                        item.status === 'SELESAI' && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                        item.status === 'MENUNGGU_SKM' && "bg-amber-500/20 text-amber-300 border-amber-500/40",
                        item.status !== 'SELESAI' && item.status !== 'MENUNGGU_SKM' && "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      )}>
                        {item.status.replace(/_/g, ' ')}
                      </span>

                      {/* Download Lock status */}
                      <div className="flex items-center md:justify-end gap-1 text-[10px] text-slate-400 mt-1">
                        {isLocked ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Unduh Terkunci (SKM)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span>Surat Legal Terbuka</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi Detail */}
                    <Link
                      href={`/sipeka/permohonan/${item.id}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0A2540] text-[#F2A900] border border-[#F2A900]/30 hover:bg-[#0A2540]/80 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Kelola & Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

