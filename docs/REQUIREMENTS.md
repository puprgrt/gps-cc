# 📐 Technical Requirements
## GPS-CC: Garut Public Service AI Command Center

---

## 1. Functional Requirements

### FR-01: Dashboard Eksekutif
- [FR-01.1] Menampilkan 8 kartu metrik layanan (KRK, PKKPR, Peil, Irigasi, RUMIJA, Siteplan, PBG, SLF)
- [FR-01.2] Setiap kartu menampilkan: total permohonan, tren (%), SLA capaian, sparkline chart
- [FR-01.3] Executive summary: total permohonan, selesai, proses, belum diproses
- [FR-01.4] KPI footer: rata-rata waktu, IKM, pengaduan masuk, AI response rate
- [FR-01.5] Real-time update (polling setiap 30 detik atau WebSocket)

### FR-02: GIS & Peta Interaktif
- [FR-02.1] Peta Kabupaten Garut berbasis Leaflet
- [FR-02.2] Marker real-time berdasarkan status: Selesai (hijau), Proses (kuning), Terlambat (merah)
- [FR-02.3] Filter per jenis layanan
- [FR-02.4] Klik marker menampilkan detail permohonan
- [FR-02.5] Heatmap kepadatan permohonan per kecamatan

### FR-03: WhatsApp Command Center
- [FR-03.1] Koneksi WhatsApp via Baileys (QR Code & Pairing Code)
- [FR-03.2] Dashboard inbox real-time: daftar percakapan aktif
- [FR-03.3] Chat view: riwayat pesan per kontak
- [FR-03.4] AI suggested reply dengan confidence score
- [FR-03.5] Template quick response
- [FR-03.6] Eskalasi ke operator manusia
- [FR-03.7] Internal notes per percakapan
- [FR-03.8] Status operator: online, busy, offline
- [FR-03.9] Bot activity log viewer
- [FR-03.10] Kirim pesan teks, gambar, dan dokumen

### FR-04: Social Media Command Center
- [FR-04.1] Social listening feed: mention dari Twitter/X, Instagram, Facebook, TikTok, YouTube
- [FR-04.2] Sentiment analysis per mention (positif, netral, negatif)
- [FR-04.3] Trending topics
- [FR-04.4] Unified inbox: balas pesan dari semua platform
- [FR-04.5] AI-assisted reply draft
- [FR-04.6] Analytics: engagement rate, response rate, sentiment trend

### FR-05: AI Customer Service
- [FR-05.1] Chatbot berbasis Gemini API
- [FR-05.2] RAG (Retrieval Augmented Generation) dari knowledge base
- [FR-05.3] Context-aware: memahami konteks layanan PUPR Garut
- [FR-05.4] Handoff ke operator jika confidence rendah
- [FR-05.5] Multi-channel: menjawab via WhatsApp & web chat

### FR-06: Pelayanan (CRUD Permohonan)
- [FR-06.1] Form pengajuan permohonan per jenis layanan
- [FR-06.2] Upload dokumen persyaratan
- [FR-06.3] Tracking status permohonan (Diajukan → Verifikasi → Proses → Selesai)
- [FR-06.4] Notifikasi WhatsApp otomatis saat status berubah
- [FR-06.5] Pencarian & filter permohonan

### FR-07: Pengaduan
- [FR-07.1] Form pengaduan warga (kategori, lokasi, foto)
- [FR-07.2] Workflow tiket: Open → Assigned → In Progress → Resolved → Closed
- [FR-07.3] Eskalasi otomatis jika melebihi SLA
- [FR-07.4] Peta lokasi pengaduan (GIS terintegrasi)
- [FR-07.5] Dashboard statistik pengaduan

### FR-08: SLA Monitoring
- [FR-08.1] Dashboard SLA per jenis layanan
- [FR-08.2] Alert real-time jika SLA terancam breach
- [FR-08.3] Historical trend SLA bulanan
- [FR-08.4] Ranking kinerja per bidang/operator
- [FR-08.5] Export laporan SLA (PDF/Excel)

### FR-09: Knowledge Base
- [FR-09.1] Upload & kategorisasi dokumen SOP, Perbup, SK
- [FR-09.2] Full-text search
- [FR-09.3] Integrasi dengan AI chatbot (sumber RAG)
- [FR-09.4] Version history dokumen

### FR-10: Pencarian Global
- [FR-10.1] Pencarian lintas modul (pelayanan, pengaduan, KB, social)
- [FR-10.2] Filter per kategori
- [FR-10.3] Hasil real-time saat mengetik

---

## 2. Non-Functional Requirements

### NFR-01: Performance
- Response time API: < 500ms (P95)
- Page load time: < 2 detik (LCP)
- Dashboard refresh: < 1 detik
- WhatsApp message delivery: < 3 detik
- Concurrent users: minimum 100

### NFR-02: Security
- Autentikasi: Firebase Auth (email/OTP)
- Otorisasi: RBAC (Super Admin, Admin, Operator, Viewer)
- Enkripsi: HTTPS/TLS 1.3 end-to-end
- Data at rest: Firebase server-side encryption
- Session management: JWT token dengan expiry
- CORS: whitelist domain spesifik
- Input validation: server-side + client-side
- Audit trail: log semua aksi sensitif

### NFR-03: Reliability
- Uptime target: 99.5%
- Automatic reconnection: exponential backoff (sudah diimplementasi di Baileys)
- Graceful degradation: fallback ke data cache jika API gagal
- Error handling: global error boundary + structured logging

### NFR-04: Scalability
- Horizontal scaling: stateless frontend (Vercel auto-scale)
- Database: Firestore auto-scaling
- File storage: Firebase Storage (auto-scale)
- WhatsApp: single session per instance (limitasi Baileys)

### NFR-05: Usability
- Responsive: desktop (1920px) → tablet (768px) → mobile (375px)
- Aksesibilitas: WCAG 2.1 Level AA
- Dark mode: default (sesuai desain)
- Bahasa UI: Bahasa Indonesia
- Browser support: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

### NFR-06: Maintainability
- Code coverage: ≥ 80%
- TypeScript strict mode: enabled
- Linting: ESLint dengan rules ketat
- Dokumentasi: inline JSDoc + folder docs/
- CI/CD: automated testing pada setiap PR

---

## 3. Technology Stack (Definitive)

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Frontend Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.9.x |
| Styling | Tailwind CSS | 4.x |
| State Management | Zustand | 5.x |
| Charts | Recharts | 3.x |
| Maps | Leaflet + React-Leaflet | 1.9.x / 5.x |
| Animation | Motion (Framer Motion) | 12.x |
| AI | Google Gemini API (@google/genai) | 2.x |
| Database | Firebase Firestore | 12.x |
| Auth | Firebase Authentication | 12.x |
| Storage | Firebase Storage | 12.x |
| WhatsApp | Baileys (@whiskeysockets/baileys) | 7.x |
| Backend WA | Express.js | 5.x |
| QR Code | qrcode.react | 4.x |
| UI Primitives | Shadcn/UI (Base UI + CVA) | Latest |
| Icons | Lucide React | Latest |

---

## 4. System Requirements

### Development
- Node.js ≥ 20 LTS
- npm ≥ 10 atau Bun ≥ 1.1
- Git ≥ 2.40
- VS Code (recommended)
- OS: Windows 10+, macOS 13+, Linux (Ubuntu 22+)

### Production
- Hosting: Vercel (frontend) + Cloud Run/VPS (Baileys server)
- Database: Firebase Firestore
- CDN: Vercel Edge Network
- SSL: Let's Encrypt / managed SSL
- Domain: subdomain garut.go.id (recommended)
