# 🤖 AI SMART ROUTING ENGINE (PURI)
## Pelayanan Umum Responsif dan Informatif - Dinas PUPR Kabupaten Garut

> **Spesifikasi Teknis & AI Engineering Rules Resmi**  
> Dokumen ini mendefinisikan arsitektur **Hierarchical AI Routing Engine** untuk sistem GPS-CC (Garut Public Service - Command Center). Setiap pesan publik yang masuk diproses secara otomatis dengan tingkat akurasi tinggi melalui 6 tingkatan klasifikasi sebelum diteruskan ke operator.

---

## 1. OBJECTIVE & PERAN AI

Setiap pesan yang masuk dari berbagai kanal publik:
- **WhatsApp** (Baileys Standalone)
- **Instagram / Facebook / Threads**
- **Telegram**
- **Website Chat & Email**
- **YouTube & Google Business Profile**

**WAJIB** diproses secara otomatis oleh AI sebelum diterima oleh operator. AI bertindak sebagai **Front Office Digital** yang melakukan analisis, klasifikasi, penentuan SLA, penyusunan draf jawaban, dan distribusi tiket ke bidang yang berwenang di lingkungan Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut.

---

## 2. HIERARCHICAL AI ROUTING ENGINE (6-TIER)

Sistem PURI menggunakan pemrosesan berjenjang dari kategori umum hingga penugasan individu:

```
[Bidang PUPR] → [Layanan] → [Jenis Permohonan / Intent] → [Prioritas] → [Operator] → [SLA]
```

1. **Bidang PUPR**: Menentukan bidang penanggung jawab di lingkungan Dinas PUPR Kabupaten Garut.
2. **Layanan**: Menentukan jenis layanan teknis atau administratif spesifik.
3. **Jenis Permohonan (Intent)**: Menganalisis niat dan maksud komunikasi warga.
4. **Prioritas**: Menilai tingkat kedaruratan dan dampak masalah.
5. **Operator**: Memilih petugas online dengan kompetensi sesuai dan beban kerja paling optimal.
6. **SLA (Service Level Agreement)**: Menetapkan batas waktu maksimal penyelesaian respons atau tindakan teknis.

---

## 3. END-TO-END AI WORKFLOW

```
              Pesan Masuk (Multi-Channel)
                          │
                          ▼
                   Deteksi Bahasa
              (Indonesia / Sunda / Inggris)
                          │
                          ▼
                  Intent Detection
       (Informasi / Pengaduan / Persyaratan / dll.)
                          │
                          ▼
                 Klasifikasi Bidang
           (7 Bidang Dinas PUPR Kab. Garut)
                          │
                          ▼
                 Klasifikasi Layanan
               (PBG, SLF, Jalan, IRIGASI, dll.)
                          │
                          ▼
                 Analisis Sentimen
              (Negatif / Netral / Positif)
                          │
                          ▼
                Penentuan Prioritas
            (Rendah / Normal / Tinggi / Kritis)
                          │
                          ▼
                  Deteksi Lokasi
           (Kecamatan, Desa, Kampung, Koordinat)
                          │
                          ▼
            Deteksi Dokumen / Lampiran
        (Foto kerusakan, KTP, Berkas permohonan)
                          │
                          ▼
              Pencarian Knowledge Base
          (SOP, Peraturan, FAQ sesuai Bidang)
                          │
                          ▼
               Menyusun Draft Jawaban
              (Header Resmi "🤖 PURI")
                          │
                          ▼
                 Menentukan Operator
              (Assignment & Load Balancer)
                          │
                          ▼
            Masuk ke Dashboard Operator
        (Antrean khusus masing-masing Bidang)
```

---

## 4. RUANG LINGKUP (SCOPE) & KATA KUNCI 7 BIDANG DINAS PUPR

### 4.1. Sekretariat
- **AI Scope**: Informasi umum, jam pelayanan, lokasi kantor, kontak, surat masuk/keluar, pengaduan umum, website, PPID, informasi publik, permohonan data, administrasi, kepegawaian, keuangan, perencanaan, barang milik daerah.
- **Kata Kunci**: `alamat`, `jam pelayanan`, `kantor`, `telepon`, `email`, `surat`, `administrasi`, `ppid`, `informasi`.

### 4.2. Bidang Penataan Ruang
- **AI Scope**: KRK (Keterangan Rencana Kabupaten), PKKPR, RTRW, RDTR, Zonasi, Tata Ruang, Kesesuaian Pemanfaatan Ruang, Siteplan, Perubahan fungsi lahan, Peruntukan ruang.
- **Kata Kunci**: `krk`, `pkkpr`, `rtrw`, `rdtr`, `zonasi`, `siteplan`, `tata ruang`, `pemanfaatan ruang`.

### 4.3. Bidang Bangunan Gedung
- **AI Scope**: PBG (Persetujuan Bangunan Gedung), SLF (Sertifikat Laik Fungsi), Bangunan Gedung, Renovasi, Perubahan Bangunan, Bangunan Baru, Bangunan Eksisting, Persyaratan teknis bangunan, Pemeriksaan bangunan.
- **Kata Kunci**: `pbg`, `slf`, `imb`, `gedung`, `bangunan`, `renovasi`, `sertifikat laik fungsi`.

### 4.4. Bidang Bina Marga
- **AI Scope**: Jalan Kabupaten, Jembatan, Trotoar, Bahu Jalan, Marka Jalan, Perkerasan Jalan, Jalan Rusak, Jalan Berlubang, Jalan Longsor.
- **Kata Kunci**: `jalan`, `jembatan`, `trotoar`, `aspal`, `berlubang`, `rusak`, `marka`, `bahu jalan`.

### 4.5. Bidang Sumber Daya Air (SDA)
- **AI Scope**: Irigasi, Drainase, Sungai, Banjir, Saluran, Bendung, Embung, Normalisasi, Pengendalian Banjir.
- **Kata Kunci**: `irigasi`, `drainase`, `banjir`, `saluran`, `sungai`, `embung`, `bendung`.

### 4.6. Bidang Jasa Konstruksi
- **AI Scope**: Badan Usaha Jasa Konstruksi (BUJK), Tenaga Kerja Konstruksi, Sertifikasi, Pelatihan, Pembinaan, Pengawasan Jasa Konstruksi, Rantai Pasok Konstruksi, Informasi penyedia jasa.
- **Kata Kunci**: `jasa konstruksi`, `sertifikasi`, `pelatihan`, `kontraktor`, `konsultan`, `tenaga ahli`.

### 4.7. Bidang Air Minum dan Penyehatan Lingkungan (AMPL)
- **AI Scope**: Sistem Penyediaan Air Minum (SPAM), Air Bersih, Air Minum, Sanitasi, Air Limbah Domestik, Septik, Penyehatan Lingkungan, Pengelolaan Air Limbah.
- **Kata Kunci**: `air minum`, `spam`, `air bersih`, `sanitasi`, `limbah`, `septik`, `penyehatan lingkungan`.

---

## 5. AI INTENT CLASSIFICATION

AI membedakan setiap pesan ke dalam 10 tipe **Intent**:

```
[Informasi] → [Persyaratan] → [Status Permohonan] → [Pengaduan] → [Konsultasi] 
   → [Permohonan Baru] → [Permohonan Dokumen] → [Saran] → [Kritik] → [Apresiasi]
```

---

## 6. SKEMA KLASIFIKASI PENGADUAN (YAML SCHEMA)

Contoh keluaran AI untuk pesan warga: *"Jalan menuju Kampung Cisarua rusak."*

```yaml
Jenis:
  Pengaduan
Bidang:
  Bina Marga
Kategori:
  Jalan Kabupaten
Lokasi:
  Kampung Cisarua
Prioritas:
  Tinggi
Operator:
  BM-01
SLA:
  1 Hari
Confidence:
  99%
```

---

## 7. AI ASSIGNMENT ENGINE & LOAD BALANCER

### 7.1. Alur Penugasan (Assignment Engine)
```
[Bidang] → [Daftar Operator] → [Status Online] → [Beban Kerja] → [Kompetensi] → [Penugasan Otomatis]
```

**Contoh Kasus:**
- Tiket masuk ke **Bidang Bangunan Gedung**.
- Operator `BG-01` → *Offline*.
- Operator `BG-02` → *Online* (5 Tiket Aktif).
- Operator `BG-03` → *Online* (1 Tiket Aktif).
- **Keputusan AI**: Assign otomatis ke **`BG-03`**.

### 7.2. Kriteria Load Balancer
AI wajib menghitung metrik berikut sebelum memberikan penugasan:
1. **Status Online/Offline**: Hanya operator dengan status `ONLINE` yang menerima antrean otomatis.
2. **Jumlah Tiket Aktif (Concurrency)**: Operator dengan beban kerja terendah menjadi prioritas.
3. **Rata-Rata Waktu Respons (Avg Response Time)**: Mencegah penumpukan pada operator yang sedang lambat merespons.
4. **Kompetensi Layanan (Skill Tagging)**: Memastikan operator memiliki keahlian khusus yang dibutuhkan (misal: spesialis struktur jembatan atau ahli SPAM).
5. **Riwayat Penyelesaian**: Mempertimbangkan keberhasilan penyelesaian tiket sejenis sebelumnya.

---

## 8. SMART LABEL & MULTI-LABEL CLASSIFICATION

### 8.1. Daftar Smart Label
`PBG`, `SLF`, `KRK`, `PKKPR`, `Siteplan`, `Jalan`, `Jembatan`, `Drainase`, `Irigasi`, `SPAM`, `Sanitasi`, `Jasa Konstruksi`, `Administrasi`, `Pengaduan`, `Informasi`.

### 8.2. Multi-Label & Multi-Bidang Workflow
Satu percakapan dapat memiliki lebih dari satu label jika warga melaporkan masalah gabungan.

**Contoh Pesan:** *"Saya ingin mengurus PBG, tetapi akses jalan menuju lokasi juga rusak."*

**Keluaran AI:**
```yaml
Label:
  - PBG
  - Bina Marga
Bidang:
  - Bangunan Gedung
  - Bina Marga
Status:
  Multi Bidang
Workflow:
  Kolaborasi
```
> *Catatan*: Pada kasus Multi-Bidang, sistem membuat **Satu Tiket Utama** dengan **Sub-Tugas** untuk masing-masing bidang (Bangunan Gedung & Bina Marga), sehingga warga cukup memantau satu nomor tiket tanpa melapor ulang.

---

## 9. AI SMART ESCALATION & KNOWLEDGE ROUTING

### 9.1. Alur Eskalasi (Smart Escalation)
Jika pesan berada di luar wilayah yang jelas atau memiliki ambiguitas tinggi:
```
[AI] → [Sekretariat] → [Supervisor] → [Disposisi Kepala Dinas] → [Bidang Terkait]
```

### 9.2. Knowledge Routing (RAG Pipeline)
Sebelum merancang draf jawaban, AI menelusuri repositori pengetahuan spesifik:
```
[PBG] → [Knowledge Bangunan Gedung] → [SOP PBG] → [FAQ PBG] → [Peraturan Terkait] → [Draft Jawaban]
```

---

## 10. DASHBOARD OPERATOR BERDASARKAN BIDANG

Setiap operator **hanya** melihat antrean tiket sesuai dengan bidangnya untuk menjaga fokus dan privasi data pelayanan:

| Bidang | Antrean & Layanan yang Dilihat |
| :--- | :--- |
| **Bina Marga** | Pengaduan Jalan, Jembatan, Trotoar, Bahu Jalan, Marka |
| **Sumber Daya Air (SDA)** | Irigasi, Drainase, Sungai, Banjir, Embung, Bendung |
| **Bangunan Gedung** | PBG, SLF, IMB, Pemeriksaan Teknis Gedung |
| **Penataan Ruang** | KRK, PKKPR, RTRW, RDTR, Siteplan, Zonasi |
| **Jasa Konstruksi** | Sertifikasi BUJK/Tenaga Ahli, Pembinaan, Pelatihan, Konsultasi |
| **AMPL** | SPAM, Air Minum, Sanitasi, Air Limbah Domestik, Septik |
| **Sekretariat** | Informasi Umum, PPID, Administrasi, Surat, Pengaduan Umum |

---

## 11. AI DECISION RULES (ATURAN KEPUTUSAN PURI)

Sistem PURI **WAJIB** mematuhi aturan keputusan berikut tanpa terkecuali:

1. **Satu Bidang (Single-Domain)**: Otomatis diarahkan ke operator bidang tersebut dengan beban kerja paling ringan.
2. **Lebih dari Satu Bidang (Multi-Domain)**: Dibuatkan **satu tiket utama** yang bercabang menjadi sub-tugas kepada beberapa bidang terkait agar pelapor tidak perlu membuat laporan berulang.
3. **Confidence AI ≥ 95%**: AI menyiapkan **draf jawaban lengkap** dan merekomendasikan operator yang sesuai; operator tinggal klik *Approve/Send* atau membalas otomatis.
4. **Confidence AI < 95%**: Percakapan diarahkan ke **Supervisor** untuk validasi manual sebelum tiket diteruskan ke operator bidang.
5. **Pengaduan Darurat (Critical Priority)**: 
   - Kejadian kritis seperti: *Jalan putus, jembatan ambruk, banjir mengancam keselamatan warga, atau bangunan berpotensi runtuh*.
   - AI otomatis menandai tiket sebagai **Prioritas Kritis (SLA < 2 Jam)**.
   - Memicu **Notifikasi Real-Time (SMS/WhatsApp Alert/Push Notification)** kepada Pejabat Berwenang / Kepala Bidang / Kepala Dinas.

---

## 12. AI LEARNING ENGINE (ADAPTIVE FEEDBACK LOOP)

Sistem dilengkapi dengan **AI Learning Engine** yang terus belajar secara inkremental dari tindakan dan koreksi operator:

- **Rekam Koreksi Operator**: Ketika operator mengubah klasifikasi AI (misalnya mengubah Bidang dari *SDA* ke *AMPL*, atau mengoreksi jenis *Intent*), koreksi dicatat dalam log umpan balik (`AILearningFeedback`).
- **Adaptasi Istilah Lokal Garut**: Sistem menggunakan riwayat umpan balik untuk mempelajari sinonim, istilah lokal Sunda/Garut (misal: *solokan*, *gorong-gorong*, *caah*), serta pola pertanyaan masyarakat tanpa memerlukan pelatihan ulang model dasar secara penuh (*zero-downtime adaptive prompting / dynamic few-shot injection*).
- **Akurasi Berkelanjutan**: Mengurangi angka kesalahan pengelompokan (*misclassification rate*) seiring berjalannya waktu pelayanan.
