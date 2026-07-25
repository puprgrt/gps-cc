# 📋 PRD - Product Requirements Document
## GPS-CC: Garut Public Service AI Command Center
**Version:** 1.0 | **Last Updated:** 2026-07-25 | **Author:** Tim Pengembang PUPR Garut

---

## 1. Executive Summary

GPS-CC (Garut Public Service AI Command Center) adalah platform **command center** digital berbasis AI untuk Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut. Platform ini mengintegrasikan monitoring pelayanan publik, manajemen pengaduan warga, komunikasi WhatsApp otomatis, social media listening, dan analitik berbasis AI dalam satu dashboard terpadu.

### Visi
> Menjadikan pelayanan publik Dinas PUPR Kabupaten Garut sebagai **pelayanan publik terbaik** di Indonesia melalui digitalisasi dan kecerdasan buatan.

### Misi
1. Mempercepat waktu respon pelayanan publik
2. Meningkatkan transparansi dan akuntabilitas
3. Menyediakan data-driven decision making bagi pejabat eksekutif
4. Mengotomasi proses rutin dengan AI

---

## 2. Problem Statement

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Monitoring pelayanan tersebar di banyak sistem | Data terfragmentasi, sulit dapat gambaran utuh |
| 2 | Respons pengaduan warga lambat | Kepuasan masyarakat rendah |
| 3 | Komunikasi manual via WhatsApp | Operator kewalahan, respons tidak 24/7 |
| 4 | Tidak ada monitoring sentimen publik | Tidak tahu persepsi masyarakat |
| 5 | Keputusan eksekutif berdasarkan intuisi | Bukan data-driven |

---

## 3. Target Users

| Persona | Deskripsi | Kebutuhan Utama |
|---------|-----------|-----------------|
| **Kepala Dinas / Pejabat Eksekutif** | Pengambil keputusan strategis | Dashboard ringkas, insight AI, trend |
| **Kabid / Kasi** | Manajer teknis per bidang layanan | Detail layanan, SLA monitoring |
| **Operator CS** | Petugas front-office pelayanan | Manajemen chat, respons template |
| **Admin IT** | Pengelola sistem | Konfigurasi, monitoring kesehatan sistem |
| **Warga Masyarakat** | Pemohon layanan / pelapor pengaduan | Akses info via WhatsApp, tracking permohonan |

---

## 4. Success Metrics (KPI)

| Metric | Target | Baseline |
|--------|--------|----------|
| SLA Compliance Rate | ≥ 97% | ~94.5% |
| Indeks Kepuasan Masyarakat (IKM) | ≥ 90/100 | ~86.4 |
| Rata-rata Waktu Penyelesaian | ≤ 3 hari | ~4.2 hari |
| First Response Time (WhatsApp) | ≤ 5 menit | Manual |
| AI Auto-Response Rate | ≥ 80% | 0% |
| Pengaduan Terselesaikan | ≥ 95% | ~85% |

---

## 5. Scope

### In Scope (v1.0)
- Executive dashboard dengan 8 metrik layanan
- GIS mapping real-time permohonan
- WhatsApp Business integration (Baileys)
- Social media monitoring (Twitter, Instagram, Facebook)
- AI chatbot pelayanan (Gemini)
- SLA monitoring & alerting
- Manajemen pengaduan warga
- Knowledge base dokumen SOP

### Out of Scope (v1.0)
- Integrasi SIMBG (Sistem Informasi Manajemen Bangunan Gedung)
- Mobile native app (Android/iOS)
- Payment gateway (retribusi)
- Video call consultation
- Multi-dinas (hanya PUPR untuk v1.0)

---

## 6. Constraints & Assumptions

### Constraints
- Infrastruktur: Hosting cloud (Vercel/Cloud Run) atau server Pemkab
- Budget: Terbatas — prioritaskan open-source stack
- Regulasi: Harus comply dengan Perbup dan regulasi pelayanan publik

### Assumptions
- Koneksi internet stabil di lingkungan kantor Dinas PUPR
- Pegawai sudah familiar dengan WhatsApp
- Data layanan existing bisa dimigrasi ke Firestore
- API social media (Twitter/X, Instagram, Facebook) bisa diakses

---

## 7. Layanan yang Dikelola (8 Jenis)

| # | Kode | Nama Layanan | Deskripsi |
|---|------|-------------|-----------|
| 1 | KRK | Keterangan Rencana Kota | Informasi tata ruang & zonasi |
| 2 | PKKPR | Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang | Izin pemanfaatan ruang |
| 3 | PEIL | Peil Banjir | Rekomendasi teknis ketinggian banjir |
| 4 | IRIGASI | Rekomendasi Teknis Irigasi | Izin penggunaan saluran irigasi |
| 5 | RUMIJA | Ruang Milik Jalan | Izin pemanfaatan bahu jalan |
| 6 | SITEPLAN | Pengesahan Siteplan | Pengesahan rencana tapak |
| 7 | PBG | Persetujuan Bangunan Gedung | Izin mendirikan bangunan |
| 8 | SLF | Sertifikat Laik Fungsi | Sertifikasi kelayakan bangunan |
