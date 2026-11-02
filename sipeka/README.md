# SIPEKA (Sistem Penilaian Kerusakan Bangunan Gedung)
## Bidang Bangunan Gedung — Dinas PUPR Kabupaten Garut
### Arsitektur SPBE & Standar Desain IDDS (Indonesian Digital Design System)

---

## 🏛️ 1. Pendahuluan & Landasan Regulasi

Aplikasi **SIPEKA** dirancang untuk mendigitalisasi, menstandardisasi, dan mempercepat proses pengajuan, verifikasi teknis, penilaian kerusakan kuantitatif, hingga penerbitan **Surat Hasil Analisis Kerusakan Bangunan Gedung** berformat resmi kedinasan lengkap dengan legalitas **Tanda Tangan Elektronik (TTE) BSrE**.

Sistem ini mematuhi regulasi nasional dan daerah:
1. **Peraturan Presiden No. 95 Tahun 2018** tentang Sistem Pemerintahan Berbasis Elektronik (SPBE).
2. **Peraturan Menteri PUPR No. 24/PRT/M/2008** tentang Pedoman Pemeliharaan dan Perawatan Bangunan Gedung.
3. **Buku Panduan Identifikasi & Verifikasi Kerusakan Bangunan Sekolah & Madrasah KemenPUPR (2020)**.
4. **Peraturan PermenPAN-RB No. 14 Tahun 2017** tentang Pedoman Survei Kepuasan Masyarakat (SKM).

---

## 📐 2. Struktur Modul & Folder `sipeka`

```
sipeka/
├── README.md                      # Dokumentasi komprehensif arsitektur sistem
├── migrations/
│   └── 001_sipeka_core_schema.sql # Skrip DDL PostgreSQL 14+ (ENUMs, 8 Tabel, Constraints, Indexes, RLS, Seed)
├── types/
│   └── index.ts                   # Domain types, Enums, Model Data, dan Metadata
├── constants/
│   └── idds.ts                    # IDDS Design tokens (#F2A900 PUPR Gold, #0A2540 PUPR Navy) & 10 Tahap Workflow
├── engine/
│   ├── calculator.ts              # Engine Kalkulasi 2-Tahap (Visual Safety Gate & Kuantitatif Volume/Bobot)
│   ├── weightMatrices.ts          # Matriks Pembobotan Form Alt.A (1 Lt), Alt.B (2 Lt), Alt.C (3+ Lt)
│   └── calculator.test.ts         # Unit Test 2-Tahap Engine PUPR
├── storage/
│   ├── googleDriveStorage.ts      # Delegated Google Drive Storage (0 MB Kuota PUPR, Metadata di PostgreSQL)
│   └── googleDriveStorage.test.ts # Unit Test Struktur Path & MD5 Checksum
├── workflow/
│   ├── stateMachine.ts            # State Machine 10 Tahapan Alur Kerja & Penguncian Dokumen SKM
│   └── stateMachine.test.ts       # Unit Test Transisi Berjenjang & Role-Based Access
└── services/
    ├── sipekaService.ts           # Business Logic Layer & Database Orchestrator (PostgreSQL / In-Memory Fallback)
    ├── skmService.ts              # Engine Kuesioner 9 Indikator PermenPAN-RB & Kalkulasi IKM Konversi
    └── skm.test.ts                # Unit Test IKM Konversi (25.00 - 100.00)
```

---

## 🧮 3. Engine Kalkulasi Kerusakan 2-Tahap Standar PUPR

### Tahap 1: Visual Safety Gate (Pengamatan Visual & Keselamatan)
Sistem melakukan audit keamanan struktural awal pada 7 komponen kritis:
- Pondasi & Sloof
- Kolom Praktis & Utama
- Balok Struktur / Ringbalk
- Plat Lantai Tingkat
- Struktur Tangga & Bordes
- Kuda-kuda & Rangka Atap
- Dinding Struktural Pengikat

> **Aturan Kritis Keselamatan**: Jika salah satu komponen kritis terindikasi bahaya/patah/miring berlebih/runtuh, sistem otomatis menetapkan status **RUSAK BERAT** dengan `is_keselamatan_terancam = true` tanpa memandang hasil penjumlahan aritmatika komponen non-struktural.

### Tahap 2: Kuantitatif Volume & Bobot Komponen
Perhitungan persentase kerusakan menggunakan rumus resultante PUPR:
$$\text{Total Kerusakan (\%)} = \sum_{k=1}^n \left( \frac{\text{Volume Rusak}_k}{100} \times \text{Nilai Klasifikasi}_k \times \text{Bobot Komponen}_k \right)$$

Tingkat Keparahan (7 Klasifikasi PUPR):
1. **Tidak Rusak** ($0.00$)
2. **Rusak Sangat Ringan** ($0.20$)
3. **Rusak Ringan** ($0.35$)
4. **Rusak Sedang** ($0.50$)
5. **Rusak Berat** ($0.70$)
6. **Rusak Sangat Berat** ($0.85$)
7. **Tidak Sesuai Persyaratan Teknis / Hilang** ($1.00$)

Ambang Batas Kategori:
- $\le 30.00\%$: **RUSAK RINGAN**
- $> 30.00\% - 45.00\%$: **RUSAK SEDANG**
- $> 45.00\%$ atau Lolos Aspek Keselamatan: **RUSAK BERAT**

---

## ☁️ 4. Integrasi Google Drive Delegated Storage (0 MB Kuota PUPR)

Untuk melindungi kuota penyimpanan internal Dinas PUPR Kabupaten Garut dari ratusan megabyte foto kerusakan beresolusi tinggi, SIPEKA menggunakan arsitektur **Delegated Storage**:

1. **OAuth 2.0 Authorization**: Pengelola BG / Sekolah memberikan izin delegasi penyimpanan berkas aplikasi via OAuth 2.0.
2. **Automated Folder Tree**: Berkas otomatis terorganisir di Google Drive sekolah pemohon:
   ```
   Google Drive Pengelola/
   └── SIPEKA_GARUT/
       └── [NPSN]_[NUP]_[NamaBangunan]/
           └── Tahun_2026/
               └── Permohonan_[ID]/
                   ├── surat_permohonan_registrasi.pdf
                   ├── bukti_foto_pondasi.jpg
                   └── surat_hasil_analisis_tte.pdf
   ```
3. **PUPR Database Metadata**: PostgreSQL internal Dinas PUPR hanya menyimpan metadata:
   - `file_id` (Google Drive Unique File ID)
   - `view_link` (Direct sharing link untuk verifikasi pemeriksa)
   - `md5_checksum` (Audit integritas file anti-manipulasi)
   - `file_size`, `mime_type`, `folder_path`
   - **Hasil: Kuota Dinas PUPR Garut tetap 0 MB terpakai!**

---

## 🔄 5. Alur Bisnis 10 Tahapan Workflow

```
[1. Permohonan Mandiri] ──> [2. Disposisi Kabid] ──> [3. Disposisi Subkoord]
                                                              │
                                                              ▼
[5. Survey & Analisis 2-Tahap] <── [4. Verifikasi & Gate Survey Tim Teknis]
        │
        ▼
[6. Validasi & TTE Subkoord] ──> [7. Approval & TTE Kabid] ──> [8. Auto-Generate Surat Hasil & TTE Kadis]
                                                                               │
                                                                               ▼
[10. Selesai & Arsip] <── [9. Mandatory SKM Pengelola BG (Unlocking Gate)] <───┘
```

> **Mandatory SKM Gate**: Sebelum pengelola BG dapat mengunduh berkas Surat Hasil Analisis bertanda tangan digital (TTE BSrE), pengelola **wajib menyelesaikan 9 indikator survei kepuasan masyarakat** sesuai PermenPAN-RB No. 14/2017.

---

## 🎨 6. Standar Antarmuka IDDS (Indonesian Digital Design System)

- **PUPR Gold**: `#F2A900` (Warna identitas kedinasan primer, aksen tombol, sorotan aktif)
- **PUPR Navy**: `#0A2540` (Header, sidebar, elemen status resmi)
- **WCAG 2.1 AA Compliant**: Kontras teks tinggi pada seluruh elemen input dan tombol.
- **Mobile-First Responsive Stepper**: Wizard interaktif yang memandu pemohon maupun aparatur ASN dalam memantau posisi berkas secara real-time.

