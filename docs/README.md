# GPS-CC (Garut Public Service - Command Center) 🏛️

GPS-CC adalah sistem pelayanan publik terpadu berbasis WhatsApp untuk Dinas PUPR Kabupaten Garut. Sistem ini menggunakan arsitektur bot WhatsApp mandiri (Baileys) yang terintegrasi dengan dashboard Next.js dan Supabase.

Bot ini dikenal dengan identitas **"PURI"** (Pelayanan Umum & Informasi PUPR Garut) dan dirancang untuk beroperasi secara mandiri 24/7.

## 🚀 Instalasi & Menjalankan Sistem

Sistem ini terdiri dari dua bagian utama yang berjalan bersamaan:
1. **Frontend/Dashboard**: Aplikasi Next.js (App Router).
2. **Backend/Bot**: Server Node.js (Baileys) standalone.

### Prasyarat
- Node.js (v18+)
- NPM/Yarn
- Akun Supabase (untuk database dan realtime)
- API Key Google Gemini (`gemini-2.5-flash`)

### Langkah Instalasi
1. Clone repositori proyek.
2. Salin `.env.example` ke `.env` (atau `.env.local`) dan isi variabel yang dibutuhkan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Instal semua dependensi:
   ```bash
   npm install
   ```

### Menjalankan Mode Development
Untuk menjalankan Next.js dan Bot Server secara bersamaan:
```bash
npm run dev:all
```
- Dashboard akan tersedia di: `http://localhost:3000`
- Proses bot akan berjalan secara terpisah dan meng-handle koneksi WhatsApp.

---

## 🏗️ Penjelasan Arsitektur

GPS-CC menggunakan pendekatan *Clean Architecture* dan berjalan dalam lingkungan terpisah antara client dan server WhatsApp.

- **Next.js (App Router)**: Digunakan untuk UI/UX Dashboard, routing, dan API proxy.
- **Baileys**: Berada di folder `server/`, berfungsi sebagai *standalone server* untuk koneksi WhatsApp tanpa instance browser (lebih ringan).
- **Supabase Realtime**: Menyimpan log pesan dan meng-update UI dashboard secara *realtime* (tabel `wa_messages` dan `wa_conversations`). Tanpa perlu polling API.
- **Google Generative AI**: Terintegrasi pada bot untuk menjawab pesan di luar *keyword* statis, menggunakan model `gemini-2.5-flash` untuk stabilitas dan keandalan.

Baca lebih lanjut di [ARCHITECTURE.md](./ARCHITECTURE.md) dan [API.md](./API.md).

---

## 🔧 Prosedur Maintenance

Sistem ini didesain agar stabil 24/7, namun beberapa tindakan *maintenance* kadang diperlukan.

### 1. Pembersihan Sesi (Error 440 / Koneksi Terputus)
Jika bot tidak bisa terhubung, conflict device, atau terjadi error 440 (konflik sesi):
- Sistem **secara otomatis** akan mencoba menghapus folder `./baileys_auth_garut` dan meminta scan ulang.
- Jika perlu dilakukan secara manual, hapus folder `baileys_auth_garut` di root project, lalu restart aplikasi (`npm run dev:all`) dan scan ulang QR Code di Dashboard.

### 2. Rotasi API Key (Gemini)
Google AI bisa membatasi atau menonaktifkan API Key (terutama jika key bocor di public repo, memunculkan error `403 Permission Denied`).
- Dapatkan API Key baru dari Google AI Studio.
- Perbarui `GEMINI_API_KEY` di file `.env`.
- Restart sistem menggunakan `npm run dev:all`.

---

## 👨‍💻 Panduan Penggunaan Dashboard untuk Operator

1. **Memulai Bot (Scan QR)**:
   - Buka Dashboard (http://localhost:3000/whatsapp).
   - Klik tombol **QR Code** di pojok kanan atas.
   - Scan menggunakan aplikasi WhatsApp di handphone (seperti menautkan perangkat WhatsApp Web biasa).
   - Jika berhasil, status akan berubah menjadi **Online**.

2. **Memantau Pesan**:
   - Pesan masuk akan muncul secara *realtime* di Dashboard tanpa perlu *refresh* halaman (berkat Supabase Realtime).
   - Bot (PURI) akan membalas secara otomatis dengan struktur berjenjang (Menu Interaktif -> Keyword -> AI).
   - Setiap balasan AI akan memiliki header resmi **"PURI"**.

3. **Mengubah Setting Bot**:
   - Jika sewaktu-waktu operator perlu mengambil alih chat sepenuhnya (balas manual via HP atau Dashboard), fitur AI dapat dinonaktifkan dari Dashboard. (Pengembangan lebih lanjut)
