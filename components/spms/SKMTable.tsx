'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, RefreshCw, TrendingUp, Users, Star, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPES
// ============================================================

interface SKMRowData {
  no: number;
  unsur: string;
  dimensionId: string;
  totalNilai: number;    // Jumlah total poin yang diberikan
  jumlahResponden: number; // Jumlah responden yang mengisi unsur ini
  nrr: number;           // Nilai Rata-rata = totalNilai / jumlahResponden
  nrrTertimbang: number; // NRR × 0.111 (bobot per unsur = 1/9)
}

interface SKMSummary {
  rows: SKMRowData[];
  totalResponden: number;
  ikmKonversi: number;  // IKM = NRR Tertimbang Total × 25
  kategori: string;
  isLoading: boolean;
  lastUpdated: string | null;
}

// ============================================================
// SKM QUESTION LABELS (Urutan Per Permenpan 14/2017)
// ============================================================
const DEFAULT_DIMENSION_LABELS: Record<string, string> = {
  U1: 'Kesesuaian Persyaratan Pelayanan',
  U2: 'Kemudahan Sistem & Prosedur',
  U3: 'Kecepatan Waktu Pelayanan',
  U4: 'Kesesuaian Biaya/Tarif',
  U5: 'Kualitas Produk Layanan',
  U6: 'Kompetensi/Kemampuan Petugas',
  U7: 'Sikap & Perilaku Petugas',
  U8: 'Kualitas Sarana & Prasarana',
  U9: 'Penanganan Pengaduan & Saran',
};

// ============================================================
// HELPER: Hitung Kategori IKM
// ============================================================
function getIKMKategori(ikm: number): { label: string; color: string } {
  if (ikm >= 88.31) return { label: 'Sangat Baik (A)', color: 'text-emerald-400' };
  if (ikm >= 76.61) return { label: 'Baik (B)', color: 'text-blue-400' };
  if (ikm >= 65.00) return { label: 'Kurang Baik (C)', color: 'text-yellow-400' };
  return { label: 'Tidak Baik (D)', color: 'text-rose-400' };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function SKMTable() {
  const [summary, setSummary] = useState<SKMSummary>({
    rows: [],
    totalResponden: 0,
    ikmKonversi: 0,
    kategori: '-',
    isLoading: true,
    lastUpdated: null
  });

  const fetchSKMData = useCallback(async () => {
    setSummary(prev => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase
        .from('spms_survey_responses')
        .select('dimensions, status')
        .eq('status', 'COMPLETED');

      if (error && error.code !== '42P01') {
        console.error('Error fetching SKM data:', error);
      }

      const responses = data || [];
      const totalResponden = responses.length;

      // Kumpulkan semua dimension IDs
      const dimTotals: Record<string, number> = {};
      const dimCounts: Record<string, number> = {};

      responses.forEach(resp => {
        const dims = typeof resp.dimensions === 'string'
          ? JSON.parse(resp.dimensions)
          : (resp.dimensions || {});

        Object.entries(dims).forEach(([key, val]) => {
          const numVal = Number(val);
          if (!isNaN(numVal) && numVal > 0) {
            dimTotals[key] = (dimTotals[key] || 0) + numVal;
            dimCounts[key] = (dimCounts[key] || 0) + 1;
          }
        });
      });

      // Gabungkan dengan label default — pakai label default jika ada, fallback ke key
      const allDimIds = Object.keys({ ...DEFAULT_DIMENSION_LABELS, ...dimTotals });
      const sortedDimIds = allDimIds.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 999;
        const numB = parseInt(b.replace(/\D/g, '')) || 999;
        return numA - numB;
      });

      const numUnsur = sortedDimIds.length || 9;
      const bobot = 1 / numUnsur; // Bobot per unsur

      const rows: SKMRowData[] = sortedDimIds.map((id, idx) => {
        const total = dimTotals[id] || 0;
        const count = dimCounts[id] || 0;
        const nrr = count > 0 ? total / count : 0;
        const nrrTertimbang = nrr * bobot;

        return {
          no: idx + 1,
          unsur: DEFAULT_DIMENSION_LABELS[id] || id,
          dimensionId: id,
          totalNilai: total,
          jumlahResponden: count,
          nrr: nrr,
          nrrTertimbang: nrrTertimbang
        };
      });

      const totalNrrTertimbang = rows.reduce((acc, r) => acc + r.nrrTertimbang, 0);
      const ikmKonversi = totalNrrTertimbang * 25;
      const { label: kategori } = getIKMKategori(ikmKonversi);

      setSummary({
        rows,
        totalResponden,
        ikmKonversi,
        kategori,
        isLoading: false,
        lastUpdated: new Date().toLocaleTimeString('id-ID')
      });

    } catch (err) {
      console.error('Failed to load SKM data:', err);
      setSummary(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchSKMData();

    // Real-time subscription
    const subscription = supabase
      .channel('skm-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'spms_survey_responses'
      }, () => {
        fetchSKMData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchSKMData]);

  const { rows, totalResponden, ikmKonversi, kategori, isLoading, lastUpdated } = summary;
  const { label: kategoriLabel, color: kategoriColor } = getIKMKategori(ikmKonversi);
  const totalNrrTertimbang = rows.reduce((acc, r) => acc + r.nrrTertimbang, 0);

  return (
    <div className="glass-card border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-garut-blue/20 rounded-xl">
            <ClipboardList className="w-5 h-5 text-garut-blue" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Tabel SKM — Survei Kepuasan Masyarakat
            </h2>
            <p className="text-xs text-slate-500">Berdasarkan PermenPAN-RB No. 14 Tahun 2017</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Diperbarui: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchSKMData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-white/5">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Responden</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalResponden}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Jumlah Unsur</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{rows.length}</p>
        </div>
        <div className="bg-garut-blue/10 border border-garut-blue/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-garut-blue" />
            <span className="text-[10px] text-garut-blue uppercase tracking-wider">Nilai IKM</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {totalResponden === 0 ? '0.00' : ikmKonversi.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-3.5 h-3.5 text-garut-gold" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kategori</span>
          </div>
          <p className={`text-sm font-bold ${totalResponden === 0 ? 'text-slate-500' : kategoriColor}`}>
            {totalResponden === 0 ? 'Belum Ada Data' : kategoriLabel}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-garut-blue animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">Memuat data SKM...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Unsur Pelayanan</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah<br/>Nilai</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah<br/>Responden</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">NRR<br/>(÷ Responden)</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">NRR<br/>Tertimbang</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Kualitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada data survei.</p>
                    <p className="text-xs mt-1">Data akan muncul setelah warga mengisi form survei.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const barWidth = row.nrr > 0 ? (row.nrr / 5) * 100 : 0;
                  const barColor = row.nrr >= 4 ? '#10b981' : row.nrr >= 3 ? '#3b82f6' : row.nrr >= 2 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={row.dimensionId} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{row.no}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-garut-blue/20 text-garut-blue text-xs font-bold font-mono flex-shrink-0">
                            {row.dimensionId}
                          </span>
                          <span className="text-slate-200 text-sm">{row.unsur}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-sm">
                        {row.totalNilai === 0 ? <span className="text-slate-600">0</span> : row.totalNilai}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-sm">
                        {row.jumlahResponden === 0 ? <span className="text-slate-600">0</span> : row.jumlahResponden}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        <span className={row.nrr === 0 ? 'text-slate-600' : 'text-white'}>
                          {row.nrr === 0 ? '0.00' : row.nrr.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold">
                        <span className={row.nrrTertimbang === 0 ? 'text-slate-600' : 'text-garut-gold'}>
                          {row.nrrTertimbang === 0 ? '0.0000' : row.nrrTertimbang.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: row.nrr === 0 ? '#475569' : barColor }}>
                            {row.nrr === 0 ? '—' : row.nrr.toFixed(2) + ' / 5.00'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800/70 border-t-2 border-garut-blue/30">
                <td colSpan={5} className="px-4 py-4 text-right">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Total NRR Tertimbang &amp; Nilai IKM (× 25)
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-garut-gold text-base">
                  {totalNrrTertimbang.toFixed(4)}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-extrabold text-white font-mono">
                      {totalResponden === 0 ? '0.00' : ikmKonversi.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-bold ${totalResponden === 0 ? 'text-slate-600' : kategoriColor}`}>
                      {totalResponden === 0 ? 'Belum ada data' : kategori}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-6 py-3 border-t border-white/5 bg-black/20">
        <p className="text-[10px] text-slate-600">
          Keterangan: NRR = Nilai Rata-rata per Unsur (1–5). NRR Tertimbang = NRR × Bobot Unsur (1/{rows.length || 9} ≈ {(1/(rows.length || 9)).toFixed(3)}).
          IKM Konversi = ∑ NRR Tertimbang × 25. Kategori: ≥88.31=Sangat Baik, 76.61–88.30=Baik, 65.00–76.60=Kurang Baik, &lt;65=Tidak Baik.
          <span className="inline-flex items-center gap-1 ml-2 text-garut-blue/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Real-time
          </span>
        </p>
      </div>
    </div>
  );
}
