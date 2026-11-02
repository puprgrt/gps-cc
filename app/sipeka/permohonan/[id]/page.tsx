'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  Lock, 
  Unlock, 
  Send, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  Download, 
  PenTool, 
  UserCheck, 
  ShieldCheck,
  Star
} from 'lucide-react';
import { PermohonanPenilaian, StatusPermohonan } from '@/sipeka/types';
import { WorkflowStepper } from '@/components/sipeka/WorkflowStepper';
import { SKMModal } from '@/components/sipeka/SKMModal';
import { cn } from '@/lib/utils';

export default function PermohonanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [permohonan, setPermohonan] = useState<PermohonanPenilaian | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSKMModalOpen, setIsSKMModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [messageNotice, setMessageNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/v1/sipeka/permohonan/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPermohonan(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/v1/sipeka/permohonan/${id}`);
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setPermohonan(json.data);
        }
      } catch (err) {
        if (!ignore) console.error('Gagal mengambil detail:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    if (id) {
      load();
    }
    return () => {
      ignore = true;
    };
  }, [id]);

  // Handler Disposisi Kabid -> Subkoord (Tahap 2)
  const handleDisposisiKabid = async () => {
    setActionLoading(true);
    setMessageNotice(null);
    try {
      const res = await fetch(`/api/v1/sipeka/permohonan/${id}/disposisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Kabid BG
          fromUserRole: 'KABID_BG',
          toUserId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // Subkoord
          targetStatus: 'DISPOSISI_SUBKOORD',
          catatan: 'Segera jadwalkan verifikasi berkas dan lakukan verifikasi lapangan bersama Tim Teknis.',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setMessageNotice({ type: 'success', text: 'Disposisi Kabid BG berhasil diteruskan ke Subkoordinator.' });
      await fetchDetail();
    } catch (err: unknown) {
      setMessageNotice({ type: 'error', text: err instanceof Error ? err.message : 'Gagal disposisi.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler Disposisi Subkoord -> Tim Teknis (Tahap 3)
  const handleDisposisiSubkoord = async () => {
    setActionLoading(true);
    setMessageNotice(null);
    try {
      const res = await fetch(`/api/v1/sipeka/permohonan/${id}/disposisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          fromUserRole: 'SUBKOORDINATOR',
          toUserId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          targetStatus: 'DISPOSISI_TIM_TEKNIS',
          catatan: 'Laksanakan verifikasi administrasi dan lembar simakan mandiri pemohon.',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setMessageNotice({ type: 'success', text: 'Penugasan Tim Teknis berhasil diproses.' });
      await fetchDetail();
    } catch (err: unknown) {
      setMessageNotice({ type: 'error', text: err instanceof Error ? err.message : 'Gagal disposisi.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler Verifikasi Berkas & Penentuan Survey (Tahap 4)
  const handleVerifikasiBerkas = async (butuhSurvey: boolean) => {
    setActionLoading(true);
    setMessageNotice(null);
    try {
      const res = await fetch(`/api/v1/sipeka/permohonan/${id}/verifikasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timTeknisId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          butuhSurvey,
          tanggalSurvey: butuhSurvey ? new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setMessageNotice({ type: 'success', text: data.message });
      await fetchDetail();
    } catch (err: unknown) {
      setMessageNotice({ type: 'error', text: err instanceof Error ? err.message : 'Gagal verifikasi berkas.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler Eksekusi Kalkulasi 2-Tahap (Tahap 5)
  const handleExecuteKalkulasi = async () => {
    setActionLoading(true);
    setMessageNotice(null);
    try {
      // Sampel penilaian realistis sesuai panduan PUPR
      const sampleItems = [
        { kode: 'STR_01', nama: 'Pondasi & Sloof', kategori: 'STRUKTUR', bobotPersen: 12.0, volumeRusakPersen: 20, tingkatKerusakan: 'RUSAK_SEDANG' },
        { kode: 'STR_02', nama: 'Kolom Praktis & Utama', kategori: 'STRUKTUR', bobotPersen: 10.0, volumeRusakPersen: 30, tingkatKerusakan: 'RUSAK_SEDANG' },
        { kode: 'STR_04', nama: 'Kuda-kuda & Rangka Atap', kategori: 'STRUKTUR', bobotPersen: 7.0, volumeRusakPersen: 50, tingkatKerusakan: 'RUSAK_BERAT' },
        { kode: 'ARS_01', nama: 'Dinding & Partisi', kategori: 'ARSITEKTUR', bobotPersen: 21.5, volumeRusakPersen: 40, tingkatKerusakan: 'RUSAK_SEDANG' },
        { kode: 'ARS_02', nama: 'Rangka & Penutup Plafond', kategori: 'ARSITEKTUR', bobotPersen: 10.0, volumeRusakPersen: 60, tingkatKerusakan: 'RUSAK_BERAT' },
        { kode: 'ARS_03', nama: 'Lantai & Rabat', kategori: 'ARSITEKTUR', bobotPersen: 14.5, volumeRusakPersen: 25, tingkatKerusakan: 'RUSAK_SEDANG' },
      ];

      const res = await fetch(`/api/v1/sipeka/permohonan/${id}/survey-analisis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timTeknisId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          altForm: permohonan?.alt_form || 'ALT_A',
          luasBangunanM2: permohonan?.bangunan?.luas_bangunan_m2 || 200,
          inputKomponen: sampleItems,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setMessageNotice({ type: 'success', text: 'Analisis 2-Tahap selesai. Berkas diteruskan ke Subkoordinator.' });
      await fetchDetail();
    } catch (err: unknown) {
      setMessageNotice({ type: 'error', text: err instanceof Error ? err.message : 'Gagal simpan kalkulasi.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler TTE Berjenjang (Subkoord, Kabid, Kadis)
  const handleSignTTE = async (role: 'subkoord' | 'kabid' | 'kadis') => {
    setActionLoading(true);
    setMessageNotice(null);
    try {
      const endpoint = `/api/v1/sipeka/permohonan/${id}/tte-${role}`;
      const nip =
        role === 'subkoord'
          ? '198108152006041008'
          : role === 'kabid'
          ? '197405101999031004'
          : '196802111994021001';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerNip: nip }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setMessageNotice({ type: 'success', text: data.message });
      await fetchDetail();
    } catch (err: unknown) {
      setMessageNotice({ type: 'error', text: err instanceof Error ? err.message : 'Gagal tanda tangan TTE.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-xs text-slate-400 animate-pulse">
        Memuat detail permohonan penilaian bangunan gedung...
      </div>
    );
  }

  if (!permohonan) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4">
        <p className="text-sm text-rose-400">Permohonan tidak ditemukan.</p>
        <Link href="/sipeka" className="text-xs text-[#F2A900] underline">
          Kembali ke Dashboard SIPEKA
        </Link>
      </div>
    );
  }

  const isLocked = permohonan.status !== 'SELESAI';

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sipeka"
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#F2A900]">
                {permohonan.nomor_permohonan}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2540] text-slate-300">
                {permohonan.alt_form}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mt-0.5">
              {permohonan.bangunan?.nama_bangunan || 'Detail Permohonan'}
            </h1>
          </div>
        </div>

        {/* Status Badge & Download Action */}
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border",
            permohonan.status === 'SELESAI' && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            permohonan.status === 'MENUNGGU_SKM' && "bg-amber-500/20 text-amber-300 border-amber-500/40",
            permohonan.status !== 'SELESAI' && permohonan.status !== 'MENUNGGU_SKM' && "bg-blue-500/20 text-blue-300 border-blue-500/40"
          )}>
            {permohonan.status.replace(/_/g, ' ')}
          </span>

          {permohonan.status === 'SELESAI' ? (
            <a
              href={`/api/v1/sipeka/permohonan/${permohonan.id}/download-surat-hasil`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Surat Hasil TTE</span>
            </a>
          ) : (
            <button
              onClick={() => setIsSKMModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center gap-2 hover:bg-slate-700 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Unduh Terkunci (Wajib SKM)</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notifikasi Aksi */}
      {messageNotice && (
        <div className={cn(
          "p-4 rounded-2xl text-xs border flex items-center justify-between animate-in fade-in",
          messageNotice.type === 'success'
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            : "bg-rose-950/40 border-rose-500/40 text-rose-300"
        )}>
          <span>{messageNotice.text}</span>
          <button onClick={() => setMessageNotice(null)} className="text-slate-400 hover:text-white">
            Tutup
          </button>
        </div>
      )}

      {/* 10-Stage Workflow Stepper */}
      <WorkflowStepper currentStatus={permohonan.status} />

      {/* Grid Informasi & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Action Workflow Panel Sesuai Tahapan (7 Kolom) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Panel Eksekusi Workflow Berdasarkan Status */}
          <div className="bg-[#111B2E] border border-[#F2A900]/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-[#F2A900]" />
              <h3 className="text-sm font-bold text-white">Panel Aksi Operasional Berjenjang</h3>
            </div>

            {/* Tahap 1: Baru Diajukan -> Aksi Kabid Disposisi */}
            {permohonan.status === 'SUBMITTED' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <Send className="w-4 h-4" />
                  <span>Tahap 2: Menunggu Disposisi Kepala Bidang Bangunan Gedung</span>
                </div>
                <p className="text-xs text-slate-300">
                  Kepala Bidang memeriksa berkas mandiri dan mendisposisikan kepada Subkoordinator untuk ditindaklanjuti.
                </p>
                <button
                  onClick={handleDisposisiKabid}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{actionLoading ? 'Memproses...' : 'Eksekusi Disposisi ke Subkoordinator'}</span>
                </button>
              </div>
            )}

            {/* Tahap 2: Disposisi Subkoord -> Aksi Subkoord Assign Tim Teknis */}
            {permohonan.status === 'DISPOSISI_SUBKOORD' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Tahap 3: Disposisi Penugasan oleh Subkoordinator</span>
                </div>
                <p className="text-xs text-slate-300">
                  Subkoordinator meneruskan disposisi kepada Tim Teknis penilai lapangan.
                </p>
                <button
                  onClick={handleDisposisiSubkoord}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{actionLoading ? 'Memproses...' : 'Tugaskan Personel Tim Teknis'}</span>
                </button>
              </div>
            )}

            {/* Tahap 3 & 4: Verifikasi Berkas & Gate Keputusan Survey */}
            {(permohonan.status === 'DISPOSISI_TIM_TEKNIS' || permohonan.status === 'VERIFIKASI_BERKAS') && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>Tahap 4: Verifikasi Berkas & Gate Keputusan Survey</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tim Teknis memeriksa berkas dan foto kerusakan. Tentukan apakah memerlukan survey fisik ke lokasi atau dapat langsung dilakukan analisis dokumen.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleVerifikasiBerkas(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5"
                  >
                    <span>Jadwalkan Survey Lapangan</span>
                  </button>
                  <button
                    onClick={() => handleVerifikasiBerkas(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A2540] text-[#F2A900] border border-[#F2A900]/40 hover:bg-[#0A2540]/80 transition-all flex items-center gap-1.5"
                  >
                    <span>Lanjut Analisis (Tanpa Survey)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tahap 5: Survey & Pengisian Analisis 2-Tahap */}
            {(permohonan.status === 'MENUNGGU_SURVEY' || permohonan.status === 'ANALISIS_TEKNIS') && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>Tahap 5: Input Lembar Penilaian & Kalkulasi 2-Tahap</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tim Teknis menginput volume kerusakan dan derajat keparahan komponen. Sistem akan menjalankan Visual Safety Gate dan perhitungan kuantitatif PUPR.
                </p>
                <button
                  onClick={handleExecuteKalkulasi}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{actionLoading ? 'Mengalkulasi...' : 'Simpan Draf Hasil & Teruskan ke Subkoord'}</span>
                </button>
              </div>
            )}

            {/* Tahap 6: Validasi & TTE Subkoordinator */}
            {permohonan.status === 'VALIDASI_SUBKOORD' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <PenTool className="w-4 h-4" />
                  <span>Tahap 6: Validasi & Tanda Tangan Elektronik Subkoordinator</span>
                </div>
                <p className="text-xs text-slate-300">
                  Subkoordinator memeriksa kalkulasi komponen dan membubuhkan TTE tersertifikasi BSrE.
                </p>
                <button
                  onClick={() => handleSignTTE('subkoord')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  <span>{actionLoading ? 'Menandatangani...' : 'Validasi & Bubuhkan TTE Subkoordinator'}</span>
                </button>
              </div>
            )}

            {/* Tahap 7: Approval & TTE Kabid BG */}
            {permohonan.status === 'APPROVAL_KABID' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>Tahap 7: Persetujuan & TTE Kabid Bangunan Gedung</span>
                </div>
                <p className="text-xs text-slate-300">
                  Kepala Bidang meninjau lembar penilaian dan membubuhkan persetujuan TTE berjenjang.
                </p>
                <button
                  onClick={() => handleSignTTE('kabid')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{actionLoading ? 'Menyetujui...' : 'Setujui & Bubuhkan TTE Kabid BG'}</span>
                </button>
              </div>
            )}

            {/* Tahap 8: Approval & TTE Kadis PUPR */}
            {(permohonan.status === 'GENERATED_SURAT_HASIL' || permohonan.status === 'APPROVAL_KADIS') && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F2A900] text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tahap 8: Auto-Generate Surat Hasil Analisis & TTE Kadis PUPR</span>
                </div>
                <p className="text-xs text-slate-300">
                  Kepala Dinas PUPR Garut menerbitkan dan menandatangani secara elektronik dokumen legal Surat Hasil Analisis Kerusakan Bangunan Gedung.
                </p>
                <button
                  onClick={() => handleSignTTE('kadis')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'Menerbitkan...' : 'Terbitkan & Bubuhkan TTE Kadis PUPR'}</span>
                </button>
              </div>
            )}

            {/* Tahap 9: Mandatory SKM Pengelola BG */}
            {permohonan.status === 'MENUNGGU_SKM' && (
              <div className="p-5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Tahap 9: Dokumen Terkunci — Wajib Mengisi Survei Kepuasan (SKM)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Surat Hasil Analisis telah ditandatangani oleh Kepala Dinas PUPR. Sesuai PermenPAN-RB No. 14 Tahun 2017, Pengelola Gedung/Sekolah wajib menyelesaikan 9 indikator survei kepuasan masyarakat untuk membuka akses unduh berkas resmi.
                </p>
                <button
                  onClick={() => setIsSKMModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F2A900] text-[#0A2540] hover:bg-[#D99800] transition-all flex items-center gap-2 shadow-lg shadow-[#F2A900]/20"
                >
                  <Star className="w-4 h-4 fill-[#0A2540]" />
                  <span>Isi 9 Indikator SKM & Buka Kunci Unduh</span>
                </button>
              </div>
            )}

            {/* Tahap 10: Selesai */}
            {permohonan.status === 'SELESAI' && (
              <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tahap 10: Selesai & Terarsip Digital</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Seluruh tahapan telah tuntas. Surat Hasil Analisis bertanda tangan digital BSrE siap diunduh dan tersimpan permanen pada riwayat aset gedung.
                </p>
                <a
                  href={`/api/v1/sipeka/permohonan/${permohonan.id}/download-surat-hasil`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen Surat Hasil Resmi (PDF)</span>
                </a>
              </div>
            )}
          </div>

          {/* Hasil Penilaian & Hash TTE (Jika sudah ada kalkulasi) */}
          {permohonan.history && (
            <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Lembar Hasil Analisis Kuantitatif PUPR</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {permohonan.history.kesimpulan_klasifikasi}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Kerusakan</span>
                  <span className="text-lg font-black text-white">{permohonan.history.persentase_total_kerusakan}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Struktur</span>
                  <span className="text-lg font-bold text-[#F2A900]">{permohonan.history.persentase_struktur}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Arsitektur</span>
                  <span className="text-lg font-bold text-blue-400">{permohonan.history.persentase_arsitektur}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Utilitas</span>
                  <span className="text-lg font-bold text-emerald-400">{permohonan.history.persentase_utilitas}%</span>
                </div>
              </div>

              {/* Rekomendasi */}
              <div className="p-3.5 rounded-xl bg-[#0A2540]/60 border border-[#F2A900]/20 text-xs">
                <span className="font-bold text-[#F2A900] block mb-1">Rekomendasi Teknis Kedinasan:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {permohonan.history.rekomendasi_teknis}
                </p>
              </div>

              {/* Hash Legalitas TTE BSrE */}
              <div className="pt-2 border-t border-white/5 space-y-2 text-[11px]">
                <span className="font-bold text-slate-300 block">Jejak Keabsahan Tanda Tangan Elektronik (TTE):</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>TTE Subkoordinator:</span>
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[200px]">
                      {permohonan.history.tte_subkoor_hash || 'Menunggu TTE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>TTE Kabid BG:</span>
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[200px]">
                      {permohonan.history.tte_kabid_hash || 'Menunggu TTE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>TTE Kadis PUPR:</span>
                    <span className="font-mono text-[10px] text-emerald-400 truncate max-w-[200px]">
                      {permohonan.history.tte_kadis_hash || 'Menunggu TTE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Master Data Bangunan & Delegated Storage (5 Kolom) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Profil Gedung */}
          <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Building2 className="w-5 h-5 text-[#F2A900]" />
              <h3 className="text-sm font-bold text-white">Identitas Bangunan Gedung</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Nama Gedung:</span>
                <span className="font-bold text-white text-right">{permohonan.bangunan?.nama_bangunan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Nomor Aset (BMD / NUP):</span>
                <span className="font-mono font-bold text-[#F2A900]">{permohonan.bangunan?.nup_bmd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Jumlah Lantai:</span>
                <span className="font-bold text-white">{permohonan.bangunan?.jumlah_lantai} Lantai</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Luas Bangunan:</span>
                <span className="font-bold text-white">{permohonan.bangunan?.luas_bangunan_m2} m²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Tahun Pembangunan:</span>
                <span className="font-bold text-white">{permohonan.bangunan?.tahun_dibangun || '-'}</span>
              </div>
            </div>
          </div>

          {/* Card Delegated Google Drive Storage */}
          <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Delegated Storage Pengelola</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                0 MB Kuota PUPR
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Berkas foto dokumentasi tersimpan langsung pada Google Drive pemohon di folder:
            </p>
            <div className="p-3 bg-slate-900/90 rounded-xl font-mono text-[11px] text-slate-300 break-all border border-white/10">
              Google Drive Pengelola/SIPEKA_GARUT/{permohonan.bangunan?.nup_bmd}/Tahun_2026/Permohonan_{permohonan.id}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Status Penyimpanan:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersinkronisasi</span>
              </span>
            </div>
          </div>

          {/* Card Bukti Dokumentasi Tampak Gedung */}
          <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F2A900]" />
                <h3 className="text-sm font-bold text-white">Dokumentasi 4 Tampak Gedung</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Lampiran Mandiri</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'Tampak Depan', id: 'depan' },
                { title: 'Tampak Belakang', id: 'belakang' },
                { title: 'Samping Kanan', id: 'kanan' },
                { title: 'Samping Kiri', id: 'kiri' },
              ].map((tampak) => (
                <div key={tampak.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 block">{tampak.title}</span>
                  <div className="w-full aspect-[4/3] rounded-lg bg-slate-800/80 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                    <span>Dokumentasi #{tampak.id}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Koordinat GPS Terverifikasi:</span>
              <span className="font-mono text-[#F2A900] font-semibold">
                {permohonan.bangunan?.latitude || -7.2144}, {permohonan.bangunan?.longitude || 107.8988}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Wajib SKM PermenPAN-RB */}
      <SKMModal
        isOpen={isSKMModalOpen}
        onClose={() => setIsSKMModalOpen(false)}
        permohonanId={permohonan.id}
        pengelolaId={permohonan.pengelola_id}
        onSuccessUnlock={(url) => {
          setMessageNotice({
            type: 'success',
            text: 'Survei Kepuasan Masyarakat (SKM) berhasil disimpan. Dokumen Surat Hasil TTE telah terbuka!',
          });
          fetchDetail();
        }}
      />
    </div>
  );
}
