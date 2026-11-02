'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Calculator, 
  Building2, 
  Layers, 
  Coins, 
  FileCheck2, 
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { TipeFormAlt, TingkatKerusakanKomponen, KomponenPenilaianInput } from '@/sipeka/types';
import { getWeightMatrixByForm, TINGKAT_KERUSAKAN_MAP } from '@/sipeka/engine/weightMatrices';
import { hitungKerusakanBG } from '@/sipeka/engine/calculator';
import { cn } from '@/lib/utils';

interface DamageCalculatorWidgetProps {
  initialForm?: TipeFormAlt;
  initialLuas?: number;
  onCalculationChange?: (result: ReturnType<typeof hitungKerusakanBG>) => void;
  className?: string;
}

export function DamageCalculatorWidget({
  initialForm = 'ALT_A',
  initialLuas = 180,
  onCalculationChange,
  className,
}: DamageCalculatorWidgetProps) {
  const [altForm, setAltForm] = useState<TipeFormAlt>(initialForm);
  const [luasM2, setLuasM2] = useState<number>(initialLuas);
  const [isHazardGateActive, setIsHazardGateActive] = useState<boolean>(false);
  const [hazardReason, setHazardReason] = useState<string>('Kolom struktur mengalami retak geser tembus dan deformasi miring.');
  const [activeTab, setActiveTab] = useState<'STRUKTUR' | 'ARSITEKTUR' | 'UTILITAS'>('STRUKTUR');

  // Ambil template matriks pembobotan
  const templateMatrix = useMemo(() => getWeightMatrixByForm(altForm), [altForm]);

  // State nilai kerusakan tiap komponen
  const [componentStates, setComponentStates] = useState<
    Record<string, { volumeRusak: number; tingkatKerusakan: TingkatKerusakanKomponen }>
  >(() => {
    const initial: Record<string, { volumeRusak: number; tingkatKerusakan: TingkatKerusakanKomponen }> = {};
    for (const tpl of templateMatrix) {
      initial[tpl.kode] = { volumeRusak: 0, tingkatKerusakan: 'TIDAK_RUSAK' };
    }
    return initial;
  });

  // Saat ganti form alt, perbarui template
  const handleFormChange = (newForm: TipeFormAlt) => {
    setAltForm(newForm);
    const newTemplates = getWeightMatrixByForm(newForm);
    const nextStates: Record<string, { volumeRusak: number; tingkatKerusakan: TingkatKerusakanKomponen }> = {};
    for (const tpl of newTemplates) {
      nextStates[tpl.kode] = componentStates[tpl.kode] || { volumeRusak: 0, tingkatKerusakan: 'TIDAK_RUSAK' };
    }
    setComponentStates(nextStates);
  };

  const handleUpdateComponent = (
    kode: string,
    field: 'volumeRusak' | 'tingkatKerusakan',
    value: number | TingkatKerusakanKomponen
  ) => {
    setComponentStates((prev) => ({
      ...prev,
      [kode]: {
        ...prev[kode],
        [field]: value,
      },
    }));
  };

  // Susun input data untuk engine kalkulasi
  const calculationResult = useMemo(() => {
    const inputItems: KomponenPenilaianInput[] = templateMatrix.map((tpl) => {
      const state = componentStates[tpl.kode] || { volumeRusak: 0, tingkatKerusakan: 'TIDAK_RUSAK' };
      const isItemHazard = isHazardGateActive && tpl.kode === 'STR_02'; // Kolom dipicu jika gate aktif

      return {
        kode: tpl.kode,
        nama: tpl.nama,
        kategori: tpl.kategori,
        bobotPersen: tpl.bobotPersen,
        volumeRusakPersen: state.volumeRusak,
        tingkatKerusakan: state.tingkatKerusakan,
        isHazard: isItemHazard,
        catatanHazard: isItemHazard ? hazardReason : undefined,
      };
    });

    const res = hitungKerusakanBG({
      altForm,
      luasBangunanM2: luasM2,
      inputKomponen: inputItems,
    });

    onCalculationChange?.(res);
    return res;
  }, [altForm, luasM2, templateMatrix, componentStates, isHazardGateActive, hazardReason, onCalculationChange]);

  const componentsInActiveTab = templateMatrix.filter((c) => c.kategori === activeTab);

  // Kategori Badge Color
  const badgeStyle = {
    TIDAK_RUSAK: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    RUSAK_RINGAN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    RUSAK_SEDANG: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    RUSAK_BERAT: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-2 ring-rose-500/30',
  }[calculationResult.klasifikasi];

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6", className)}>
      {/* Kolom Kiri: Input Formulir & Komponen (8 Kolom) */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        {/* Panel Kontrol Atas: Pilihan Alt Form & Luas */}
        <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#F2A900] uppercase tracking-wider">
                Standar Panduan KemenPUPR
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#F2A900]" />
                Kalkulator Kerusakan Bangunan Gedung
              </h2>
            </div>

            {/* Pilihan Form Alt */}
            <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-white/10">
              {(['ALT_A', 'ALT_B', 'ALT_C'] as TipeFormAlt[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFormChange(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    altForm === f
                      ? "bg-[#F2A900] text-[#0A2540] shadow-md shadow-[#F2A900]/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {f === 'ALT_A' ? 'Alt.A (1 Lt)' : f === 'ALT_B' ? 'Alt.B (2 Lt)' : 'Alt.C (3+ Lt)'}
                </button>
              ))}
            </div>
          </div>

          {/* Input Luas Bangunan */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Luas Total Bangunan Gedung:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                value={luasM2}
                onChange={(e) => setLuasM2(Math.max(Number(e.target.value) || 0, 1))}
                className="w-24 px-3 py-1 text-sm font-bold text-white bg-slate-900 border border-white/20 rounded-lg focus:outline-none focus:border-[#F2A900] text-right"
              />
              <span className="text-xs text-slate-400 font-semibold">m²</span>
            </div>
          </div>
        </div>

        {/* TAHAP 1: VISUAL SAFETY GATE TOGGLE BANNER */}
        <div className={cn(
          "rounded-2xl p-4 md:p-5 border transition-all duration-300",
          isHazardGateActive
            ? "bg-rose-950/40 border-rose-500/50 shadow-xl shadow-rose-950/50"
            : "bg-slate-900/60 border-white/10 hover:border-white/20"
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-2.5 rounded-xl shrink-0 mt-0.5",
              isHazardGateActive ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
            )}>
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-white">
                  Tahap 1: Visual Safety Gate (Pemeriksaan Bahaya Keselamatan)
                </h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHazardGateActive}
                    onChange={(e) => setIsHazardGateActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Aktifkan jika komponen kritis (Pondasi, Kolom, Balok, Pelat, Tangga, Atap, Dinding) terindikasi patah, miring ekstrem, atau berisiko roboh. Sistem akan <strong>otomatis menetapkan kategori RUSAK BERAT</strong>.
              </p>

              {isHazardGateActive && (
                <div className="mt-3 pt-3 border-t border-rose-500/20">
                  <label className="text-[11px] font-bold text-rose-300 block mb-1">
                    Catatan Bahaya Keselamatan (Wajib Kedinasan):
                  </label>
                  <input
                    type="text"
                    value={hazardReason}
                    onChange={(e) => setHazardReason(e.target.value)}
                    placeholder="Tuliskan temuan kegagalan struktur..."
                    className="w-full px-3 py-1.5 text-xs text-white bg-rose-950/70 border border-rose-500/40 rounded-lg focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAHAP 2: DAFTAR SIMAK KOMPONEN (TABS STRUKTUR, ARSITEKTUR, UTILITAS) */}
        <div className="bg-[#111B2E] border border-white/10 rounded-2xl p-5 shadow-lg">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 pb-3 gap-2">
            {(['STRUKTUR', 'ARSITEKTUR', 'UTILITAS'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTab(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === cat
                    ? "bg-[#0A2540] text-[#F2A900] border border-[#F2A900]/40 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                )}
              >
                <span>{cat === 'STRUKTUR' ? '1. Struktur' : cat === 'ARSITEKTUR' ? '2. Arsitektur' : '3. Utilitas'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-300">
                  {templateMatrix.filter((c) => c.kategori === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* List Komponen dalam Tab Aktif */}
          <div className="divide-y divide-white/5 mt-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {componentsInActiveTab.map((comp) => {
              const state = componentStates[comp.kode] || { volumeRusak: 0, tingkatKerusakan: 'TIDAK_RUSAK' };
              const currentVal = TINGKAT_KERUSAKAN_MAP[state.tingkatKerusakan] ?? 0;
              const subtotal = Number(((state.volumeRusak / 100) * currentVal * comp.bobotPersen).toFixed(2));

              return (
                <div key={comp.kode} className="py-3.5 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{comp.nama}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0A2540] text-[#F2A900] border border-[#F2A900]/20">
                          Bobot: {comp.bobotPersen}%
                        </span>
                        {comp.isStrukturalKritis && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-500/20">
                            Kritis
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{comp.deskripsiStandar}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#F2A900]">
                        Kerusakan: {subtotal}%
                      </span>
                    </div>
                  </div>

                  {/* Kontrol Volume Rusak & Tingkat Kerusakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                    {/* Volume Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 text-slate-300">
                        <span>Volume Kerusakan:</span>
                        <span className="font-bold text-white">{state.volumeRusak}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={state.volumeRusak}
                        onChange={(e) => handleUpdateComponent(comp.kode, 'volumeRusak', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F2A900]"
                      />
                    </div>

                    {/* Tingkat Kerusakan Dropdown */}
                    <div>
                      <div className="text-[11px] mb-1 text-slate-300">Klasifikasi Derajat Kerusakan:</div>
                      <select
                        value={state.tingkatKerusakan}
                        onChange={(e) =>
                          handleUpdateComponent(
                            comp.kode,
                            'tingkatKerusakan',
                            e.target.value as TingkatKerusakanKomponen
                          )
                        }
                        className="w-full px-2.5 py-1 text-xs text-white bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:border-[#F2A900]"
                      >
                        <option value="TIDAK_RUSAK">Tidak Rusak (0.00)</option>
                        <option value="RUSAK_SANGAT_RINGAN">Rusak Sangat Ringan (0.20)</option>
                        <option value="RUSAK_RINGAN">Rusak Ringan (0.35)</option>
                        <option value="RUSAK_SEDANG">Rusak Sedang (0.50)</option>
                        <option value="RUSAK_BERAT">Rusak Berat (0.70)</option>
                        <option value="RUSAK_SANGAT_BERAT">Rusak Sangat Berat (0.85)</option>
                        <option value="TIDAK_SESUAI_PERSYARATAN">Tidak Sesuai Teknis (1.00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Ringkasan Hasil Kalkulasi & Estimasi Biaya (4 Kolom) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Card Hasil Utama */}
        <div className="bg-[#111B2E] border border-[#F2A900]/30 rounded-2xl p-5 shadow-xl flex flex-col gap-4 sticky top-6">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hasil Kesimpulan PUPR
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-3xl font-black text-white tracking-tight">
                {calculationResult.persentaseTotal}%
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border", badgeStyle)}>
                {calculationResult.klasifikasi.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Breakdown Sub-Komponen */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-300">1. Struktur:</span>
                <span className="text-[#F2A900]">{calculationResult.persentaseStruktur}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#F2A900] h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((calculationResult.persentaseStruktur / 55) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-300">2. Arsitektur:</span>
                <span className="text-blue-400">{calculationResult.persentaseArsitektur}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((calculationResult.persentaseArsitektur / 58) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-300">3. Utilitas:</span>
                <span className="text-emerald-400">{calculationResult.persentaseUtilitas}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((calculationResult.persentaseUtilitas / 6) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Estimasi Biaya Perbaikan */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/10 mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Coins className="w-4 h-4 text-[#F2A900]" />
              <span>Estimasi Anggaran Rehabilitasi:</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">
              Rp {calculationResult.estimasiBiayaPerbaikan.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Standar HSBGN Garut (Rp 3,85 Jt/m²) × Luas ({luasM2} m²)
            </div>
          </div>

          {/* Draf Rekomendasi Teknis */}
          <div className="p-3 bg-[#0A2540]/60 rounded-xl border border-[#F2A900]/20 text-xs">
            <div className="flex items-center gap-1.5 text-[#F2A900] font-bold mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>Rekomendasi Teknis Kedinasan:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {calculationResult.rekomendasiTeknis}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

