/**
 * END-TO-END WORKFLOW INTEGRATION TEST: SIPEKA SPRINT 1
 * Menguji Siklus Lengkap 10-Tahap dari Permohonan Mandiri hingga Unlocking SKM
 */

import test from 'node:test';
import assert from 'node:assert';
import { SipekaService } from '../services/sipekaService';
import { SipekaWorkflowEngine } from '../workflow/stateMachine';

test('E2E Sprint 1: Siklus Penuh 10 Tahapan Workflow SIPEKA', async () => {
  // 1. TAHAP 1: Pengajuan Mandiri oleh Pengelola BG
  const created = await SipekaService.createPermohonan({
    pengelolaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    bangunanId: 'b1111111-1111-1111-1111-111111111111',
    altForm: 'ALT_A',
  });

  assert.ok(created.id, 'ID Permohonan harus terbentuk');
  assert.strictEqual(created.status, 'SUBMITTED', 'Status awal harus SUBMITTED');
  assert.ok(created.nomor_permohonan.startsWith('SIPEKA/GRT/'), 'Nomor registrasi format SIPEKA/GRT/YYYYMMDD/XXXX');
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked(created.status), true, 'Unduh harus terkunci');

  // 2. TAHAP 2: Disposisi Kabid BG ke Subkoordinator
  const dispKabid = await SipekaService.disposisiPermohonan({
    permohonanId: created.id,
    fromUserId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    fromUserRole: 'KABID_BG',
    toUserId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    targetStatus: 'DISPOSISI_SUBKOORD',
    catatan: 'Segera tindak lanjuti pemeriksaan lapangan.',
  });
  assert.strictEqual(dispKabid.success, true);

  // 3. TAHAP 3: Disposisi Subkoordinator ke Tim Teknis
  const dispSubkoord = await SipekaService.disposisiPermohonan({
    permohonanId: created.id,
    fromUserId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    fromUserRole: 'SUBKOORDINATOR',
    toUserId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    targetStatus: 'DISPOSISI_TIM_TEKNIS',
    catatan: 'Laksanakan verifikasi berkas teknis.',
  });
  assert.strictEqual(dispSubkoord.success, true);

  // 4. TAHAP 4: Verifikasi Berkas & Penentuan Survey
  const verif = await SipekaService.verifikasiBerkas({
    permohonanId: created.id,
    timTeknisId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    butuhSurvey: false,
  });
  assert.strictEqual(verif.status, 'ANALISIS_TEKNIS');

  // 5. TAHAP 5: Input Lembar Penilaian & Kalkulasi Kerusakan 2-Tahap
  const calc = await SipekaService.executeKalkulasiKerusakan(
    created.id,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    {
      altForm: 'ALT_A',
      luasBangunanM2: 240,
      inputKomponen: [
        {
          kode: 'STR_01',
          nama: 'Pondasi & Sloof',
          kategori: 'STRUKTUR',
          bobotPersen: 12.0,
          volumeRusakPersen: 20,
          tingkatKerusakan: 'RUSAK_SEDANG',
        },
        {
          kode: 'ARS_01',
          nama: 'Dinding & Partisi',
          kategori: 'ARSITEKTUR',
          bobotPersen: 21.5,
          volumeRusakPersen: 30,
          tingkatKerusakan: 'RUSAK_RINGAN',
        },
      ],
    }
  );
  assert.ok(calc.persentaseTotal > 0, 'Persentase kerusakan harus terhitung');

  // 6. TAHAP 6: Validasi & TTE Subkoordinator
  const tteSub = await SipekaService.executeTTE({
    permohonanId: created.id,
    signerRole: 'SUBKOORDINATOR',
    signerNip: '198108152006041008',
  });
  assert.strictEqual(tteSub.status, 'APPROVAL_KABID');
  assert.ok(tteSub.hashTTE.startsWith('BSrE-'));

  // 7. TAHAP 7: Persetujuan & TTE Kabid BG
  const tteKabid = await SipekaService.executeTTE({
    permohonanId: created.id,
    signerRole: 'KABID_BG',
    signerNip: '197405101999031004',
  });
  assert.strictEqual(tteKabid.status, 'APPROVAL_KADIS');
  assert.ok(tteKabid.hashTTE.startsWith('BSrE-'));

  // 8. TAHAP 8: TTE Kadis PUPR & Menuju Gerbang Menunggu SKM
  const tteKadis = await SipekaService.executeTTE({
    permohonanId: created.id,
    signerRole: 'KADIS_PUPR',
    signerNip: '196802111994021001',
  });
  assert.strictEqual(tteKadis.status, 'MENUNGGU_SKM');
  assert.ok(tteKadis.hashTTE.startsWith('BSrE-'));

  // UJI GERBANG KESELAMATAN SKM: Saat status MENUNGGU_SKM, dokumen harus tetap terkunci!
  const statusSebelumSKM = SipekaWorkflowEngine.isDownloadLocked(tteKadis.status);
  assert.strictEqual(statusSebelumSKM, true, 'Dokumen harus tetap terkunci pada tahap MENUNGGU_SKM');

  // 9. TAHAP 9: Pengisian Wajib SKM 9 Indikator oleh Pengelola BG
  const skmSubmit = await SipekaService.submitSKM({
    permohonanId: created.id,
    pengelolaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    u1_persyaratan: 4,
    u2_prosedur: 4,
    u3_waktu_pelayanan: 4,
    u4_biaya_tarif: 4,
    u5_produk_spesifikasi: 4,
    u6_kompetensi_pelaksana: 4,
    u7_perilaku_pelaksana: 4,
    u8_maklumat_pelayanan: 4,
    u9_penanganan_pengaduan: 4,
    saran_masukan: 'Pelayanan sangat memuaskan dan transparan.',
  });

  // 10. TAHAP 10: Status menjadi SELESAI dan Download Berkas Terbuka!
  assert.strictEqual(skmSubmit.downloadUnlocked, true, 'Kunci unduh harus terbuka setelah SKM dikirim');
  assert.ok(skmSubmit.downloadUrl.includes('download-surat-hasil'), 'URL unduh berkas hasil tersedia');

  const finalDetail = await SipekaService.getPermohonanById(created.id);
  assert.strictEqual(finalDetail?.status, 'SELESAI', 'Status akhir harus SELESAI');
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked(finalDetail!.status), false, 'Download tidak lagi terkunci');
});

