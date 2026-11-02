/**
 * UNIT TESTS: SIPEKA DAMAGE CALCULATION ENGINE
 * Menguji Prosedur Penilaian 2-Tahap Standar KemenPUPR
 */

import test from 'node:test';
import assert from 'node:assert';
import { hitungKerusakanBG } from './calculator';
import { KomponenPenilaianInput } from '../types';

test('Tahap 1: Visual Safety Gate - Deteksi Bahaya Kolom Patah Langsung Rusak Berat', () => {
  const inputKomponen: KomponenPenilaianInput[] = [
    {
      kode: 'STR_02',
      nama: 'Kolom Praktis & Utama',
      kategori: 'STRUKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 10,
      tingkatKerusakan: 'RUSAK_BERAT',
      isHazard: true, // Kolom patah/miring
      catatanHazard: 'Ditemukan retak struktural geser kritis dan tulangan tertekuk',
    },
    {
      kode: 'ARS_01',
      nama: 'Dinding & Partisi',
      kategori: 'ARSITEKTUR',
      bobotPersen: 21.5,
      volumeRusakPersen: 5,
      tingkatKerusakan: 'RUSAK_RINGAN',
      isHazard: false,
    },
  ];

  const hasil = hitungKerusakanBG({
    altForm: 'ALT_A',
    luasBangunanM2: 120,
    inputKomponen,
  });

  // Verifikasi Safety Gate
  assert.strictEqual(hasil.isKeselamatanTerancam, true, 'isKeselamatanTerancam harus bernilai true');
  assert.strictEqual(hasil.klasifikasi, 'RUSAK_BERAT', 'Kesimpulan harus otomatis RUSAK_BERAT');
  assert.ok(hasil.hazardKomponen.includes('Kolom Praktis & Utama'), 'Kolom harus tercatat dalam hazard list');
  assert.ok(hasil.rekomendasiTeknis.includes('SAFETY HAZARD'), 'Rekomendasi teknis harus memuat peringatan safety');
});

test('Tahap 2: Kuantitatif Form Alt.A (1 Lantai) - Kerusakan Ringan (<= 30%)', () => {
  const inputKomponen: KomponenPenilaianInput[] = [
    {
      kode: 'ARS_08',
      nama: 'Finishing Dinding (Cat/Plesteran)',
      kategori: 'ARSITEKTUR',
      bobotPersen: 4.0,
      volumeRusakPersen: 50,
      tingkatKerusakan: 'RUSAK_RINGAN', // Nilai = 0.35 -> 0.5 * 0.35 * 4 = 0.7%
      isHazard: false,
    },
    {
      kode: 'ARS_02',
      nama: 'Rangka & Penutup Plafond',
      kategori: 'ARSITEKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 20,
      tingkatKerusakan: 'RUSAK_RINGAN', // Nilai = 0.35 -> 0.2 * 0.35 * 10 = 0.7%
      isHazard: false,
    },
  ];

  const hasil = hitungKerusakanBG({
    altForm: 'ALT_A',
    luasBangunanM2: 200,
    inputKomponen,
  });

  assert.strictEqual(hasil.isKeselamatanTerancam, false);
  assert.strictEqual(hasil.klasifikasi, 'RUSAK_RINGAN', 'Harus terklasifikasi sebagai RUSAK RINGAN');
  assert.ok(hasil.persentaseTotal <= 30.0, 'Persentase total harus <= 30%');
});

test('Tahap 2: Kuantitatif Form Alt.B (2 Lantai) - Kerusakan Sedang (> 30% - 45%)', () => {
  // Simulasi kerusakan sedang pada struktur dan arsitektur
  const inputKomponen: KomponenPenilaianInput[] = [
    {
      kode: 'STR_06',
      nama: 'Kuda-kuda & Rangka Atap',
      kategori: 'STRUKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 80,
      tingkatKerusakan: 'RUSAK_BERAT', // 0.8 * 0.7 * 10 = 5.6%
      isHazard: false,
    },
    {
      kode: 'ARS_01',
      nama: 'Dinding & Partisi',
      kategori: 'ARSITEKTUR',
      bobotPersen: 15.0,
      volumeRusakPersen: 90,
      tingkatKerusakan: 'RUSAK_BERAT', // 0.9 * 0.7 * 15 = 9.45%
      isHazard: false,
    },
    {
      kode: 'ARS_03',
      nama: 'Lantai Keramik/Granit',
      kategori: 'ARSITEKTUR',
      bobotPersen: 9.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_BERAT', // 1.0 * 0.7 * 9 = 6.3%
      isHazard: false,
    },
    {
      kode: 'STR_03',
      nama: 'Balok Induk & Anak',
      kategori: 'STRUKTUR',
      bobotPersen: 12.0,
      volumeRusakPersen: 70,
      tingkatKerusakan: 'RUSAK_BERAT', // 0.7 * 0.7 * 12 = 5.88%
      isHazard: false,
    },
    {
      kode: 'ARS_02',
      nama: 'Rangka & Penutup Plafond',
      kategori: 'ARSITEKTUR',
      bobotPersen: 6.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_BERAT', // 1.0 * 0.7 * 6 = 4.2%
      isHazard: false,
    },
  ];

  const hasil = hitungKerusakanBG({
    altForm: 'ALT_B',
    luasBangunanM2: 300,
    inputKomponen,
  });

  assert.strictEqual(hasil.isKeselamatanTerancam, false);
  assert.ok(hasil.persentaseTotal > 30.0 && hasil.persentaseTotal <= 45.0, `Persentase (${hasil.persentaseTotal}%) harus antara 30-45%`);
  assert.strictEqual(hasil.klasifikasi, 'RUSAK_SEDANG');
});

test('Tahap 2: Kuantitatif Form Alt.C (3+ Lantai) - Kerusakan Berat (> 45%)', () => {
  const inputKomponen: KomponenPenilaianInput[] = [
    {
      kode: 'STR_01',
      nama: 'Pondasi Dalam / Tiang Pancang / Bored Pile',
      kategori: 'STRUKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_SANGAT_BERAT', // 1.0 * 0.85 * 10 = 8.5%
      isHazard: false,
    },
    {
      kode: 'STR_02',
      nama: 'Kolom Utama Multi-Lantai',
      kategori: 'STRUKTUR',
      bobotPersen: 13.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_SANGAT_BERAT', // 1.0 * 0.85 * 13 = 11.05%
      isHazard: false,
    },
    {
      kode: 'STR_03',
      nama: 'Balok Portal Struktur',
      kategori: 'STRUKTUR',
      bobotPersen: 12.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_SANGAT_BERAT', // 1.0 * 0.85 * 12 = 10.2%
      isHazard: false,
    },
    {
      kode: 'STR_04',
      nama: 'Plat Lantai Beton Bertulang',
      kategori: 'STRUKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_SANGAT_BERAT', // 1.0 * 0.85 * 10 = 8.5%
      isHazard: false,
    },
    {
      kode: 'ARS_01',
      nama: 'Dinding & Curtain Wall / Fasad',
      kategori: 'ARSITEKTUR',
      bobotPersen: 6.25,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_SANGAT_BERAT', // 1.0 * 0.85 * 6.25 = 5.31%
      isHazard: false,
    },
    {
      kode: 'ARS_03',
      nama: 'Lantai Ruangan & Koridor',
      kategori: 'ARSITEKTUR',
      bobotPersen: 10.0,
      volumeRusakPersen: 100,
      tingkatKerusakan: 'RUSAK_BERAT', // 1.0 * 0.7 * 10 = 7.0%
      isHazard: false,
    },
  ];

  const hasil = hitungKerusakanBG({
    altForm: 'ALT_C',
    luasBangunanM2: 600,
    inputKomponen,
  });

  assert.ok(hasil.persentaseTotal > 45.0, `Persentase (${hasil.persentaseTotal}%) harus > 45%`);
  assert.strictEqual(hasil.klasifikasi, 'RUSAK_BERAT');
});
