/**
 * SIPEKA DOMAIN TYPES & INTERFACES
 * Sistem Penilaian Kerusakan Bangunan Gedung (SIPEKA)
 * Bidang Bangunan Gedung - Dinas PUPR Kabupaten Garut
 * Standard: SPBE, Permen PUPR No. 24/PRT/M/2008 & PermenPAN-RB No. 14/2017
 */

// 1. Roles & Actors SIPEKA
export type UserRoleSipeka =
  | 'PENGELOLA_BG'
  | 'KABID_BG'
  | 'SUBKOORDINATOR'
  | 'TIM_TEKNIS'
  | 'KADIS_PUPR'
  | 'ADMIN_SISTEM';

// 2. 10-Stage Workflow Status
export type StatusPermohonan =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DISPOSISI_SUBKOORD'
  | 'DISPOSISI_TIM_TEKNIS'
  | 'VERIFIKASI_BERKAS'
  | 'MENUNGGU_SURVEY'
  | 'SURVEY_LAPANGAN'
  | 'ANALISIS_TEKNIS'
  | 'VALIDASI_SUBKOORD'
  | 'APPROVAL_KABID'
  | 'GENERATED_SURAT_HASIL'
  | 'APPROVAL_KADIS'
  | 'MENUNGGU_SKM'
  | 'SELESAI';

// 3. Klasifikasi Kerusakan Standar PUPR
export type KlasifikasiKerusakan =
  | 'TIDAK_RUSAK'
  | 'RUSAK_RINGAN'
  | 'RUSAK_SEDANG'
  | 'RUSAK_BERAT';

// 4. Tingkat Kerusakan Komponen (7 Klasifikasi PUPR)
export type TingkatKerusakanKomponen =
  | 'TIDAK_RUSAK'               // Nilai = 0.00
  | 'RUSAK_SANGAT_RINGAN'       // Nilai = 0.20
  | 'RUSAK_RINGAN'              // Nilai = 0.35
  | 'RUSAK_SEDANG'              // Nilai = 0.50
  | 'RUSAK_BERAT'               // Nilai = 0.70
  | 'RUSAK_SANGAT_BERAT'        // Nilai = 0.85
  | 'TIDAK_SESUAI_PERSYARATAN'; // Nilai = 1.00

// 5. Tipe Formulir Penilaian Bangunan
export type TipeFormAlt = 'ALT_A' | 'ALT_B' | 'ALT_C';

export type KategoriElemen = 'STRUKTUR' | 'ARSITEKTUR' | 'UTILITAS';

// 6. Model Entitas Database
export interface Instansi {
  id: string;
  npsn_kategori: string;
  nama_instansi: string;
  alamat_lengkap: string;
  kecamatan: string;
  gdrive_root_folder_id?: string;
  created_at: string;
}

export interface UserSipeka {
  id: string;
  username: string;
  email: string;
  nama_lengkap: string;
  nip?: string;
  role: UserRoleSipeka;
  instansi_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Bangunan {
  id: string;
  instansi_id: string;
  nup_bmd: string;
  nama_bangunan: string;
  jumlah_lantai: number;
  luas_bangunan_m2: number;
  tahun_dibangun?: number;
  latitude?: number;
  longitude?: number;
  gdrive_folder_id?: string;
  created_at: string;
}

export interface PermohonanPenilaian {
  id: string;
  nomor_permohonan: string;
  pengelola_id: string;
  bangunan_id: string;
  status: StatusPermohonan;
  alt_form: TipeFormAlt;
  butuh_survey: boolean;
  tanggal_survey_dijadwalkan?: string;
  surat_permohonan_gdrive_id?: string;
  surat_hasil_gdrive_id?: string;
  tte_subkoord_status: boolean;
  tte_kabid_status: boolean;
  tte_kadis_status: boolean;
  created_at: string;
  // Relasi opsional untuk presentation
  bangunan?: Bangunan;
  pengelola?: UserSipeka;
  history?: HistoryPenilaian;
  skm?: SkmRespon;
}

export interface DisposisiLog {
  id: string;
  permohonan_id: string;
  from_user_id: string;
  to_user_id: string;
  catatan_disposisi?: string;
  created_at: string;
  // Detail pengguna
  from_user_name?: string;
  to_user_name?: string;
}

export interface HistoryPenilaian {
  id: string;
  permohonan_id: string;
  bangunan_id: string;
  penilaian_ke: number;
  tanggal_penilaian: string;
  is_keselamatan_terancam: boolean;
  hazard_komponen?: string[];
  hazard_catatan?: string;
  persentase_total_kerusakan: number;
  persentase_struktur: number;
  persentase_arsitektur: number;
  persentase_utilitas: number;
  kesimpulan_klasifikasi: KlasifikasiKerusakan;
  rekomendasi_teknis: string;
  tim_teknis_id: string;
  tte_subkoor_hash?: string;
  tte_kabid_hash?: string;
  tte_kadis_hash?: string;
  created_at: string;
  details?: DetailPenilaianKomponen[];
}

export interface DetailPenilaianKomponen {
  id: string;
  history_penilaian_id: string;
  nama_komponen: string;
  kategori_elemen: KategoriElemen;
  bobot_komponen_persen: number;
  tingkat_kerusakan_val: number; // 0.00 - 1.00
  volume_rusak_persen: number;   // 0.00 - 100.00%
  hasil_kerusakan_komponen: number; // terbobot
  foto_bukti_gdrive_id?: string;
  foto_view_link?: string;
  catatan?: string;
  created_at: string;
}

export interface SkmRespon {
  id: string;
  permohonan_id: string;
  pengelola_id: string;
  u1_persyaratan: number;       // 1 - 4
  u2_prosedur: number;          // 1 - 4
  u3_waktu_pelayanan: number;   // 1 - 4
  u4_biaya_tarif: number;       // 1 - 4
  u5_produk_spesifikasi: number;// 1 - 4
  u6_kompetensi_pelaksana: number;// 1 - 4
  u7_perilaku_pelaksana: number;// 1 - 4
  u8_maklumat_pelayanan: number;// 1 - 4
  u9_penanganan_pengaduan: number;// 1 - 4
  rerata_skor: number;          // Skala 1.00 - 4.00
  ikm_konversi: number;         // Skala 25.00 - 100.00
  mutu_pelayanan: 'A' | 'B' | 'C' | 'D';
  saran_masukan?: string;
  created_at: string;
}

// 7. Input Data untuk Engine Kalkulasi
export interface KomponenPenilaianInput {
  kode: string;
  nama: string;
  kategori: KategoriElemen;
  bobotPersen: number;
  volumeRusakPersen: number;     // 0 - 100%
  tingkatKerusakan: TingkatKerusakanKomponen;
  isHazard?: boolean;            // Tahap 1: Safety Hazard Flag
  catatanHazard?: string;
  fotoBuktiId?: string;
  fotoViewLink?: string;
}

export interface HasilKalkulasiKerusakan {
  isKeselamatanTerancam: boolean;
  hazardKomponen: string[];
  hazardCatatan: string;
  persentaseTotal: number;
  persentaseStruktur: number;
  persentaseArsitektur: number;
  persentaseUtilitas: number;
  klasifikasi: KlasifikasiKerusakan;
  rekomendasiTeknis: string;
  estimasiBiayaPerbaikan: number;
  detailKomponen: DetailPenilaianKomponen[];
}

// 8. Storage Metadata Google Drive
export interface GDriveFileMetadata {
  fileId: string;
  fileName: string;
  viewLink: string;
  downloadLink?: string;
  fileSize: number;
  mimeType: string;
  md5Checksum?: string;
  folderPath: string;
  uploadedAt: string;
}

