/**
 * UNIT TESTS: SIPEKA SKM (SURVEI KEPUASAN MASYARAKAT)
 * Menguji Kalkulasi Nilai IKM PermenPAN-RB No. 14 Tahun 2017
 */

import test from 'node:test';
import assert from 'node:assert';
import { SkmService, SkmInput } from './skmService';

test('SKM: Perhitungan IKM Konversi Skor Maksimal (Pelayanan Prima - Mutu A)', () => {
  const inputSkm: SkmInput = {
    permohonanId: 'req-001',
    pengelolaId: 'usr-001',
    u1_persyaratan: 4,
    u2_prosedur: 4,
    u3_waktu_pelayanan: 4,
    u4_biaya_tarif: 4,
    u5_produk_spesifikasi: 4,
    u6_kompetensi_pelaksana: 4,
    u7_perilaku_pelaksana: 4,
    u8_maklumat_pelayanan: 4,
    u9_penanganan_pengaduan: 4,
  };

  const res = SkmService.calculateIKM(inputSkm);
  assert.strictEqual(res.rerataSkor, 4.0);
  assert.strictEqual(res.ikmKonversi, 100.0);
  assert.strictEqual(res.mutuPelayanan, 'A');
});

test('SKM: Perhitungan IKM Konversi Mutu B (Baik)', () => {
  const inputSkm: SkmInput = {
    permohonanId: 'req-002',
    pengelolaId: 'usr-002',
    u1_persyaratan: 3,
    u2_prosedur: 3,
    u3_waktu_pelayanan: 3,
    u4_biaya_tarif: 4,
    u5_produk_spesifikasi: 3,
    u6_kompetensi_pelaksana: 4,
    u7_perilaku_pelaksana: 3,
    u8_maklumat_pelayanan: 3,
    u9_penanganan_pengaduan: 3,
  };

  const res = SkmService.calculateIKM(inputSkm);
  // (29 / 9) = 3.22 -> 3.22 * 25 = 80.5 (Mutu B)
  assert.strictEqual(res.mutuPelayanan, 'B');
  assert.ok(res.ikmKonversi >= 76.61 && res.ikmKonversi <= 88.3);
});

test('SKM: Validasi Skala Skor 1-4 Menolak Nilai Diluar Batas', () => {
  const invalidInput: SkmInput = {
    permohonanId: 'req-003',
    pengelolaId: 'usr-003',
    u1_persyaratan: 5, // Invalid! Maksimal 4
    u2_prosedur: 3,
    u3_waktu_pelayanan: 3,
    u4_biaya_tarif: 3,
    u5_produk_spesifikasi: 3,
    u6_kompetensi_pelaksana: 3,
    u7_perilaku_pelaksana: 3,
    u8_maklumat_pelayanan: 3,
    u9_penanganan_pengaduan: 3,
  };

  assert.throws(() => {
    SkmService.calculateIKM(invalidInput);
  }, /skala 1 sampai 4/);
});

