# 🔄 User Flow Diagrams
## GPS-CC: Garut Public Service AI Command Center

---

## 1. Flow Autentikasi & Akses

```mermaid
flowchart TD
    A[Buka GPS-CC] --> B{Sudah Login?}
    B -->|Ya| C{Cek Role}
    B -->|Tidak| D[Halaman Login]
    D --> E[Input Email / OTP]
    E --> F{Valid?}
    F -->|Tidak| D
    F -->|Ya| G[Generate JWT Token]
    G --> C

    C -->|Super Admin| H[Full Access: Semua Modul]
    C -->|Admin| I[Dashboard + Pelayanan + Pengaduan + WA]
    C -->|Operator| J[WhatsApp Center + Pengaduan]
    C -->|Viewer| K[Dashboard Read-Only]

    H --> L[Dashboard Utama]
    I --> L
    J --> M[WhatsApp Center]
    K --> L
```

---

## 2. Flow Permohonan Layanan (Warga → Dinas)

```mermaid
flowchart TD
    A[Warga Menghubungi] --> B{Via Channel?}
    B -->|WhatsApp| C[Bot Auto-Response]
    B -->|Web Portal| D[Form Online]
    B -->|Walk-in| E[Operator Input Manual]

    C --> F{FAQ / Permohonan Baru?}
    F -->|FAQ| G[AI Jawab Otomatis]
    F -->|Permohonan| H[Panduan Persyaratan]
    H --> I[Warga Upload Dokumen]

    D --> I
    E --> I

    I --> J[Status: DIAJUKAN]
    J --> K[Verifikasi Dokumen]
    K --> L{Dokumen Lengkap?}
    L -->|Tidak| M[Notifikasi WhatsApp: Kekurangan Dokumen]
    M --> I
    L -->|Ya| N[Status: DIVERIFIKASI]
    N --> O[Proses Teknis oleh Tim Lapangan]
    O --> P[Status: DIPROSES]
    P --> Q[Review & Penerbitan]
    Q --> R[Status: SELESAI]
    R --> S[Notifikasi WhatsApp: Dokumen Siap Diambil]
    S --> T[Warga Mengambil Dokumen]
    T --> U[Survey Kepuasan - IKM]
```

---

## 3. Flow WhatsApp Auto-Response

```mermaid
flowchart TD
    A[Pesan Masuk dari Warga] --> B[Baileys Socket Receive]
    B --> C{Kontak Baru?}
    C -->|Ya| D[Kirim Greeting + Menu Utama]
    C -->|Tidak| E{Analisis Intent}

    E -->|FAQ Umum| F[Jawab dari Knowledge Base]
    E -->|Cek Status Permohonan| G[Query Firestore]
    G --> H[Kirim Status Terkini]
    E -->|Pengaduan| I[Form Pengaduan via Chat]
    I --> J[Simpan ke Firestore]
    J --> K[Notifikasi ke Operator]
    E -->|Tidak Dimengerti| L{Confidence < 60%?}
    L -->|Ya| M[Eskalasi ke Operator Manusia]
    L -->|Tidak| N[Kirim Opsi Menu]

    F --> O[Log Aktivitas Bot]
    H --> O
    K --> O
    M --> O
    N --> O
```

---

## 4. Flow Pengaduan Warga

```mermaid
flowchart TD
    A[Warga Membuat Pengaduan] --> B{Via Channel?}
    B -->|WhatsApp| C[Input via Chat Bot]
    B -->|Web| D[Form Pengaduan Online]
    B -->|Social Media| E[Captured by Social Listening]

    C --> F[Simpan ke Firestore]
    D --> F
    E --> G[Verifikasi Manual oleh Admin]
    G --> F

    F --> H[Status: OPEN]
    H --> I[AI Kategorisasi & Prioritas]
    I --> J[Assign ke Bidang Terkait]
    J --> K[Status: ASSIGNED]
    K --> L[Petugas Menindaklanjuti]
    L --> M[Status: IN PROGRESS]
    M --> N{Selesai?}
    N -->|Belum| O{Melebihi SLA?}
    O -->|Ya| P[Eskalasi Otomatis ke Kabid]
    O -->|Tidak| L
    N -->|Ya| Q[Status: RESOLVED]
    Q --> R[Notifikasi WhatsApp ke Warga]
    R --> S[Warga Konfirmasi]
    S --> T[Status: CLOSED]
    T --> U[Update Dashboard & Analytics]
```

---

## 5. Flow Social Media Monitoring

```mermaid
flowchart TD
    A[Social Media APIs] --> B[Polling / Webhook]
    B --> C[Ingest ke Database]
    C --> D[AI Sentiment Analysis]
    D --> E{Sentiment?}

    E -->|Positif| F[Log & Dashboard Only]
    E -->|Netral| G[Queue for Review]
    E -->|Negatif| H{Urgency?}

    H -->|Tinggi - Viral/Pejabat| I[Alert Real-time ke Admin]
    I --> J[Draft AI Response]
    J --> K[Review oleh Admin]
    K --> L[Kirim Balasan via Platform]

    H -->|Sedang| M[Masuk Unified Inbox]
    M --> N[Operator Balas Manual + AI Assist]

    H -->|Rendah| G

    F --> O[Update Dashboard Analytics]
    L --> O
    N --> O
```

---

## 6. Flow Eksekutif Decision Support

```mermaid
flowchart TD
    A[Kepala Dinas Buka Dashboard] --> B[Lihat Executive Summary]
    B --> C{Ada Anomali?}

    C -->|SLA Drop| D[Drill-down ke SLA Monitor]
    D --> E[Identifikasi Layanan Bermasalah]
    E --> F[AI Rekomendasi Tindakan]
    F --> G[Disposisi ke Kabid Terkait]

    C -->|Pengaduan Spike| H[Drill-down ke Pengaduan]
    H --> I[Cek Peta GIS Lokasi Pengaduan]
    I --> J[Identifikasi Area Hotspot]
    J --> K[Alokasi Tim Lapangan]

    C -->|Sentimen Negatif| L[Drill-down ke Social Media]
    L --> M[Cek Root Cause]
    M --> N[Instruksi Press Release / Klarifikasi]

    C -->|Semua Normal| O[Review AI Insight & Rekomendasi]
    O --> P[Approve / Adjust Kebijakan]
```
