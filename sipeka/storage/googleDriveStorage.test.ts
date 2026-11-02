/**
 * UNIT TESTS: SIPEKA GOOGLE DRIVE DELEGATED STORAGE
 * Menguji Struktur Path Folder Delegasi dan Perhitungan Checksum MD5
 */

import test from 'node:test';
import assert from 'node:assert';
import { GoogleDriveDelegatedStorage } from './googleDriveStorage';

test('Storage: Struktur Path Otomatis Google Drive Pengelola (0 MB Kuota PUPR)', () => {
  const storage = new GoogleDriveDelegatedStorage();
  const tahunIni = new Date().getFullYear();

  const folderPath = storage.generateFolderPath(
    '20224001',
    'BMD-12',
    'Gedung Ruang Kelas 1-3',
    'req-9901'
  );

  const expectedPrefix = `SIPEKA_GARUT/20224001_BMD-12_Gedung_Ruang_Kelas_1-3/Tahun_${tahunIni}/Permohonan_req-9901`;
  assert.strictEqual(folderPath, expectedPrefix, 'Format path harus sesuai spesifikasi delegasi folder pengelola');
});

test('Storage: Perhitungan MD5 Checksum untuk Integritas Berkas di PostgreSQL', () => {
  const storage = new GoogleDriveDelegatedStorage();
  const sampleBuffer = Buffer.from('Foto Bukti Kerusakan Kolom Retak 2026');
  const checksum = storage.calculateMD5(sampleBuffer);

  assert.strictEqual(typeof checksum, 'string');
  assert.strictEqual(checksum.length, 32, 'MD5 Checksum harus memiliki panjang 32 karakter hex');
});

test('Storage: Upload Delegated Storage Menghasilkan Metadata Lengkap', async () => {
  const storage = new GoogleDriveDelegatedStorage();
  const dummyFile = Buffer.from('PDF_DOKUMEN_BUKTI_SURVEY_PUPR_GARUT');

  const metadata = await storage.uploadToApplicantDrive({
    instansiNpsn: '20224055',
    bangunanNup: 'NUP-001',
    bangunanNama: 'Gedung Laboratorium',
    permohonanId: 'req-002',
    fileName: 'bukti_foto_pondasi.jpg',
    mimeType: 'image/jpeg',
    fileBuffer: dummyFile,
  });

  assert.ok(metadata.fileId, 'File ID harus terbentuk');
  assert.ok(metadata.viewLink.includes('drive.google.com'), 'View link harus mengarah ke Google Drive');
  assert.strictEqual(metadata.fileName, 'bukti_foto_pondasi.jpg');
  assert.strictEqual(metadata.fileSize, dummyFile.length);
  assert.ok(metadata.md5Checksum, 'MD5 Checksum harus ada');
});

