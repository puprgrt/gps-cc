/**
 * UNIT TESTS: SIPEKA 10-STAGE WORKFLOW ENGINE
 * Menguji Transisi Alur Bisnis 10 Tahapan dan Penguncian Berkas SKM
 */

import test from 'node:test';
import assert from 'node:assert';
import { SipekaWorkflowEngine } from './stateMachine';

test('Workflow: Validasi Transisi Disposisi Kabid ke Subkoordinator', () => {
  // Kabid diizinkan mendisposisikan SUBMITTED -> DISPOSISI_SUBKOORD
  const resultKabid = SipekaWorkflowEngine.canTransition('SUBMITTED', 'DISPOSISI_SUBKOORD', 'KABID_BG');
  assert.strictEqual(resultKabid.allowed, true, 'Kabid BG harus diizinkan mendisposisikan');

  // Pengelola BG dilarang melakukan aksi disposisi
  const resultPengelola = SipekaWorkflowEngine.canTransition('SUBMITTED', 'DISPOSISI_SUBKOORD', 'PENGELOLA_BG');
  assert.strictEqual(resultPengelola.allowed, false, 'Pengelola BG tidak boleh mendisposisikan');
});

test('Workflow: Validasi Transisi TTE Kadis PUPR menuju MENUNGGU_SKM', () => {
  // Kadis PUPR diizinkan TTE dari APPROVAL_KADIS -> MENUNGGU_SKM
  const resKadis = SipekaWorkflowEngine.canTransition('APPROVAL_KADIS', 'MENUNGGU_SKM', 'KADIS_PUPR');
  assert.strictEqual(resKadis.allowed, true);

  // Tim teknis dilarang TTE atas nama Kadis
  const resTeknis = SipekaWorkflowEngine.canTransition('APPROVAL_KADIS', 'MENUNGGU_SKM', 'TIM_TEKNIS');
  assert.strictEqual(resTeknis.allowed, false);
});

test('Workflow: Penguncian Unduh Dokumen (Mandatory SKM Gate)', () => {
  // Saat draft atau proses review, berkas terkunci
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('DRAFT'), true);
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('ANALISIS_TEKNIS'), true);
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('VALIDASI_SUBKOORD'), true);
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('APPROVAL_KADIS'), true);

  // Saat surat hasil telah terbit namun belum mengisi SKM, berkas TETAP TERKUNCI!
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('MENUNGGU_SKM'), true, 'MENUNGGU_SKM harus tetap terkunci');

  // Hanya saat SELESAI (pasca pengisian SKM 9 indikator), berkas DIBUKA!
  assert.strictEqual(SipekaWorkflowEngine.isDownloadLocked('SELESAI'), false, 'SELESAI membuka akses unduh');
});

