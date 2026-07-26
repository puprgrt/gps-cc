# 🌐 PURI Social Intelligence Center (PSIC)
## AI Omnichannel Social Media Command Center
**Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut**

> **Dokumen Blueprint Arsitektur & Konsep Strategis Enterprise**  
> Dokumen ini merupakan landasan arsitektur resmi untuk pengembangan **PURI Social Intelligence Center (PSIC)** yang terintegrasi dengan ekosistem **GPS-CC (Garut Public Service - Command Center)** dan **Hierarchical AI Routing Engine (PURI 6-Tier)**.

---

## 1. VISI & STRATEGI

Membangun **Pusat Monitoring, Analitik, Pelayanan, Pengaduan, Reputasi Digital, dan Social Intelligence** Pemerintah Kabupaten Garut di bidang infrastruktur PUPR yang mampu:
- 📡 **Memantau seluruh media sosial & kanal komunikasi publik** secara real-time (*Omnichannel Listening*).
- 🧠 **Mengidentifikasi isu pelayanan publik & infrastruktur** (Jalan, Jembatan, Drainase, Irigasi, PBG, dll.) dengan AI.
- 🤖 **Menjawab pertanyaan masyarakat secara otomatis** berbasis Knowledge Base resmi dan SOP Dinas PUPR.
- 🔀 **Mendistribusikan pengaduan secara akurat** ke 7 Bidang Resmi di lingkungan Dinas PUPR Kabupaten Garut menggunakan **6-Tier Hierarchical AI Routing Engine**.
- 📊 **Mengukur sentimen publik & emosi warga** untuk memitigasi krisis informasi secara dini.
- 🏛️ **Menyediakan Executive Smart Command Center** bagi Kepala Dinas dan jajaran pimpinan untuk pengambilan keputusan berbasis data (*Data-Driven Policy*).

---

## 2. ARSITEKTUR OMNICHANNEL ENTERPRISE

```
                                [ INTERNET & WARGA GARUT ]
                                             │
      ┌───────────┬───────────┬──────────────┼──────────────┬───────────┬───────────┐
      │           │           │              │              │           │           │
   [Facebook] [Instagram]  [Threads]    [X (Twitter)]   [YouTube]   [TikTok]  [WhatsApp]
      │           │           │              │              │           │           │
   [Telegram] [Website]    [Email]    [Google Business] [Portal]   [PURI Meet] [Voice/Media]
      │           │           │              │              │           │           │
      └───────────┴───────────┴──────────────┼──────────────┴───────────┴───────────┘
                                             ▼
                             ║   SOCIAL CONNECTOR GATEWAY   ║
                             ║ (Chatwoot + n8n / Webhooks)  ║
                                             │
                                             ▼
                     ╔══════════════════════════════════════════════════════╗
                     ║            AI SOCIAL INTELLIGENCE ENGINE             ║
                     ╠══════════════════════════════════════════════════════╣
                     ║ 1. Intent Detection         7. Language Detection    ║
                     ║ 2. Entity Recognition       8. Duplicate Detection   ║
                     ║ 3. Topic & Bidang Routing   9. Priority & SLA Engine ║
                     ║ 4. Sentiment Analysis      10. Knowledge Search (RAG)║
                     ║ 5. Emotion Analysis        11. AI Draft / Auto Reply ║
                     ║ 6. Spam & Fake News Check  12. Crisis Detection      ║
                     ╚══════════════════════════════════════════════════════╝
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │   OPERATOR DASHBOARD    │                 │ EXECUTIVE SMART COMMAND │
          │  (Inbox, Tiket, Draft)  │                 │    (KPI, Heatmap, SLA)  │
          └─────────────────────────┘                 └─────────────────────────┘
```

---

## 3. MODUL-MODUL UTAMA PSIC

### 3.1 Executive Dashboard
Menyajikan matriks kendali operasional secara real-time:
- **Total Percakapan Hari Ini** & per kanal media sosial.
- **Rasio Penyelesaian**: AI Response vs. Manual Response (Operator).
- **Kepatuhan SLA (Service Level Agreement)** per bidang.
- **Indeks Kepuasan Masyarakat (IKM)** & tren **Sentimen Publik**.
- **Trending Topic & Peta Sebaran Masalah (Heatmap)** di Kabupaten Garut.

### 3.2 Live Social Feed & Smart Feed
- **Live Social Feed**: Menggabungkan aliran interaksi dari Instagram, Facebook, Threads, TikTok, YouTube, WhatsApp, Telegram, dan Google Review dalam satu antarmuka terpadu via **Supabase Realtime**.
- **Smart Feed (AI Classification)**:
  ```
  Pertanyaan ──► Pengaduan ──► Saran ──► Kritik ──► Apresiasi
       │                                                │
       └──────► Hoaks ──► Spam ──► Urgent ──► Media ────┴──► Influencer
  ```

### 3.3 Monitoring Platform Omnichannel

| Kanal | Matriks Monitoring | Mode Integrasi |
|-------|--------------------|----------------|
| **Facebook** | Post, Komentar, Mention, Inbox, Reaksi | Meta Graph API / Webhook |
| **Instagram** | Komentar, Mention, DM, Story Mention, Reel Comment | Instagram Graph API |
| **Threads** | Mention, Reply, Komentar, Thread | Threads API / Meta |
| **YouTube** | Komentar, Mention, Live Chat | YouTube Data API v3 |
| **X (Twitter)** | Mention, Reply, Quote, Hashtag | X API v2 (Enterprise/Basic) |
| **TikTok** | Komentar, Mention, Video Tagging | TikTok Display / Research API |
| **Google Business** | Review, Rating, Q&A | Google Business Profile API |
| **Telegram** | Chat, Group, Channel | Telegram Bot API |
| **WhatsApp** | Text Chat, Media (Gambar/Video), Voice Note, Dokumen | Baileys Standalone (Server GPS-CC) |

---

## 4. KECERDASAN BUATAN (AI INTELLIGENCE SUITE)

### 4.1 AI Social Listener & Smart Search
- **Daftar Kata Kunci (Keywords)**: `PUPR Garut`, `Dinas PU`, `Jalan Rusak`, `Jembatan`, `PBG`, `SLF`, `KRK`, `PKKPR`, `Drainase`, `Irigasi`, `Siteplan`, `Trotoar`, `Banjir`, `Longsor`, `Air Bersih`, `Sanitasi`, `RUMIJA`.
- **Ejaan & Istilah Lokal**: Mengenali bahasa Sunda (`jalan ruksak`, `cai saat`, `sasak parat`, `caah`), singkatan, dan typo.
- **Smart Search Expansion**: Saat warga menulis `"Jalan rusak"`, AI secara otomatis memperluas kueri ke: `jalan berlubang`, `jalan ambles`, `jalan hancur`, `jalan rusak berat`, `jalan kabupaten`, `jalan retak`.

### 4.2 AI Sentiment & Emotion AI
- **Skala Sentimen**: `Positif` | `Netral` | `Negatif` | `Sangat Negatif` | `Urgent (Darurat)`
- **Emosi Warga**: `Marah` | `Senang` | `Kecewa` | `Bingung` | `Mendesak` | `Terima Kasih`

### 4.3 AI Issue Detector & Crisis Detection (Early Warning)
- **Issue Detector**: Jika terdapat **≥ 50 posting** mengenai topik serupa (`Jalan Rusak`) dalam sehari, AI membuat tiket **Issue** pada Dashboard Pimpinan.
- **Crisis Detection (High Alert)**:
  ```
  [ ≥ 200 posting ] + [ Topik: Banjir/Longsor ] + [ Waktu ≤ 30 Menit ]
                               │
                               ▼
                        🚨 HIGH ALERT 🚨
         (Push Notifikasi Real-time: Kadis + Kabid SDA + Operator)
  ```

### 4.4 AI 6-Tier Hierarchical Routing (Standar PURI)
Setiap percakapan diklasifikasikan ke dalam **7 Bidang Resmi Dinas PUPR Kab. Garut**:
1. `SEKRETARIAT` (Informasi umum, kepegawaian, surat)
2. `PENATAAN_RUANG` (KRK, PKKPR, Siteplan, RUMIJA)
3. `BANGUNAN_GEDUNG` (PBG, SLF, Gedung Pemerintah)
4. `BINA_MARGA` (Jalan Kabupaten, Jembatan, Trotoar, Drainase Jalan)
5. `SDA` (Irigasi, Sungai, Banjir, Tanggul, Embung)
6. `JASA_KONSTRUKSI` (Sertifikasi, Jasa Konstruksi, Vendor)
7. `AMPL` (Air Minum, Sanitasi, Air Limbah)

```
[Input Omnichannel] ──► [AI Intent & Confidence Score]
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   [Confidence ≥ 95%]                [Confidence < 95%]
             │                                 │
   Auto-assign & Draft Ready            Antrean Supervisor
```

### 4.5 AI Auto Reply, Draft Reply, & Comment Suggestion
- **Auto Reply**: Menjawab seketika pertanyaan umum (FAQ/SOP) seperti jadwal pelayanan atau syarat administrasi PBG.
- **Draft Reply**: Untuk isu teknis kompleks, AI menyusun draft jawaban bersumber dari database SOP/Peraturan, menunggu persetujuan (*approval*) dari Operator/Supervisor.
- **Comment Suggestion**: Memberikan 5 opsi jawaban terbaik (ramah, teknis, empatik, singkat, atau edukatif) saat operator mengetik balasan.

### 4.6 AI Knowledge Search (RAG) & Duplicate Prevention
- **Retrieval-Augmented Generation (RAG)**: AI mencari rujukan resmi pada repositori FAQ, SOP, Perda/Perbup, Dokumen Teknis, dan Portal Resmi sebelum menjawab.
- **Duplicate Prevention**: Jika 100 warga menanyakan topik peristiwa yang sama, AI menggunakan referensi pengetahuan tunggal untuk menjawab secara konsisten tanpa penumpukan antrean manual.

### 4.7 AI Multimodal Analysis (Voice, Image, Video)
- **Voice Analysis (Speech-to-Text)**: Mengubah Voice Note warga di WhatsApp/Telegram menjadi teks menggunakan **Whisper**, lalu diproses klasifikasi tiketnya.
- **Image Analysis (Vision AI)**: Menganalisis foto unggahan warga (lubang jalan, jembatan ambruk, tanggul jebol, sampah drainase) menggunakan **Gemma 3 / Qwen2.5-VL / Florence-2** untuk menetapkan bidang kerja dan tingkat keparahan.
- **Video Analysis**: Mengekstrak frame kunci video pengaduan, meringkas kronologi visual, dan mengikat lampiran bukti ke dalam tiket.

### 4.8 AI Meeting (Integrasi PURI Meet)
Jika permasalahan warga membutuhkan koordinasi tatap muka online (misal sengketa RUMIJA atau penjelasan izin PBG):
```
Operator klik "Buat Meeting" ──► PURI Meet Session ──► Link otomatis terkirim ke Warga
```
- Sistem terintegrasi dengan **PURI Meet** (`app/puri-meet/page.tsx` & tabel Supabase `puri_meet_rooms`).

---

## 5. REKOMENDASI STACK OPEN SOURCE ENTERPRISE

| Modul | Open Source / Stack Pilihan | Peran dalam GPS-CC |
|-------|-----------------------------|--------------------|
| **Social Dashboard & Inbox** | Chatwoot / FreeScout | Omnichannel Helpdesk UI & Live Chat Inbox |
| **Workflow Automation** | n8n | Webhook ingestion & konektor API sosial media |
| **Message Queue** | RabbitMQ / Apache Kafka | Antrean pemrosesan pesan massal & krisis |
| **Search Engine** | OpenSearch | Full-text search & indexing percakapan/isu |
| **Analytics & BI** | Grafana + Metabase | Dashboard analitik eksekutif & visualisasi KPI |
| **Database Utama** | PostgreSQL (Supabase) | Core data engine, Realtime Subscriptions, RLS |
| **Cache & Realtime** | Redis | Rate limiting, session caching, debounce webhook |
| **Vector Database** | Qdrant / Supabase pgvector | Knowledge Base embedding (RAG) untuk AI |
| **Speech-to-Text** | OpenAI Whisper (Local/API) | Transkripsi pesan suara masyarakat |
| **Vision AI (Image/Video)** | Gemma 3 (27B) / Qwen2.5-VL / Florence-2 | Analisis foto jalan rusak, jembatan, drainase |
| **AI Orchestrator** | LangGraph / LangChain + Antigravity Engine | Multi-step reasoning & 6-Tier Smart Routing |
| **Local / Hybrid LLM** | Ollama (Qwen 3 / Gemma 3) + Google Gemini Pro | Pemrosesan LLM kencang, privat, & akurasi tinggi |
| **Embedding Model** | BAAI bge-large-id / Nomic Embed | Representasi semantik dokumen SOP & FAQ bahasa Indonesia |
| **Object Storage** | Supabase Storage / MinIO | Penyimpanan lampiran foto, video, & rekaman PURI Meet |

---

## 6. INOVASI TINGKAT LANJUT (NEXT-GEN CAPABILITIES)

### 6.1 AI Reputation Index
Mengukur Indeks Reputasi Digital Dinas PUPR Kabupaten Garut dari skala **0 - 100**, dihitung dari kombinasi:
$$\text{Reputation Index} = w_1(\text{Sentimen Positif}) + w_2(\text{SLA Compliance}) + w_3(\text{Resolution Rate}) - w_4(\text{Crisis Severity})$$

### 6.2 AI Trend Forecast
Memanfaatkan analisis deret waktu (*time-series forecasting*) untuk memprediksi puncak laporan musim hujan (banjir/drainase) atau kerusak-an jalan pasca-arus mudik, memungkinkan intervensi komunikasi proaktif dari Humas Dinas.

### 6.3 AI Content Assistant (Humas PUPR)
Membantu tim Humas menghasilkan infografis, rilis pers, draf klarifikasi, dan konten edukasi Instagram/Facebook yang disesuaikan dengan topik yang sedang ramai dibicarakan (*trending topics*).

### 6.4 AI Executive Briefing (Daily & Weekly Brief)
Setiap pukul 06.00 WIB dan akhir pekan, AI menyusun laporan ringkas eksekutif bagi Kepala Dinas dan Sekretaris Dinas berisi:
- Top 3 Isu Infrastruktur Paling Urgent.
- Bidang dengan volume penanganan tertinggi.
- Kinerja SLA Operator & Peringatan Dini Reputasi.

### 6.5 AI Collaboration Hub (Cross-Domain Ticket)
Satu permasalahan publik sering melibatkan lebih dari satu bidang (misalnya: *longsor yang memutus jalan dan merusak saluran irigasi*). AI Collaboration Hub membuat **Tiket Induk (Parent Ticket)** dengan sub-tugas otomatis ke:
- **Bidang Bina Marga** (pemulihan jalan)
- **Bidang SDA** (perbaikan irigasi/tanggul)
- **Bidang Penataan Ruang** (asesmen zona rawan)

---

## 7. PEMETAAN ROADMAP INTEGRASI DENGAN GPS-CC

```
[FASE 1: CORE READY] (Eksisting di GPS-CC)
 ├── WhatsApp Standalone Engine (Baileys) di server/
 ├── 6-Tier Hierarchical AI Routing (domain/aiRouting.ts)
 ├── 7 Bidang PUPR & SLA Monitoring
 └── PURI Meet Video Collaboration (app/puri-meet/)

[FASE 2: SOCIAL GATEWAY & OMNICHANNEL INBOX] (Q3 2026)
 ├── Integrasi Webhook n8n untuk Meta API (IG, FB, Threads)
 ├── Telegram Bot & Website Chat Widget
 └── Omnichannel Unified Dashboard Feed (Supabase Realtime)

[FASE 3: ADVANCED AI & RAG INTELLIGENCE] (Q4 2026)
 ├── Qdrant / pgvector Knowledge Search (SOP & Peraturan)
 ├── Whisper Speech-to-Text & Multimodal Vision AI
 └── AI Crisis Detection (High Alert Push Notification)

[FASE 4: EXECUTIVE COMMAND CENTER & INOVASI] (2027)
 ├── AI Reputation Index & Trend Forecasting
 ├── AI Executive Briefing (Daily Reports)
 └── AI Collaboration Hub (Cross-Domain Multi-Bidang Tickets)
```
