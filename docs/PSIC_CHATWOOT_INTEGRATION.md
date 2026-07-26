# ⚡ Integrasi Chatwoot Omnichannel & PURI Social Intelligence Center (PSIC)
**Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut**

---

## 📌 1. Gambaran Umum

Integrasi **Chatwoot + PSIC** memungkinkan Dinas PUPR Kabupaten Garut menghubungkan seluruh kanal komunikasi publik (**WhatsApp, Instagram DM, Facebook Messenger, X/Twitter, Telegram, Email, dan Live Chat Website**) ke dalam satu dasbor komando terpusat yang dilengkapi **6-Tier PURI AI Smart Routing Engine**.

```
+-------------------------------------------------------------------------------+
|                        WARGA & PELAPOR KABUPATEN GARUT                        |
+-------------------------------------------------------------------------------+
       │                  │                  │                  │
    WhatsApp          Instagram           Facebook           Telegram / Email
       │                  │                  │                  │
       +------------------+--------+---------+------------------+
                                   ▼
+-------------------------------------------------------------------------------+
|                      CHATWOOT OMNICHANNEL PLATFORM                            |
|             (Pusat Ingestion 11 Kanal Komunikasi Publik)                      |
+-------------------------------------------------------------------------------+
                                   │
                                   │  1. Inbound Webhook (POST /api/psic/chatwoot)
                                   ▼
+-------------------------------------------------------------------------------+
|                   PURI SOCIAL INTELLIGENCE CENTER (PSIC)                      |
|                  6-Tier Hierarchical AI Routing Engine                        |
|                                                                               |
|  [Tier 1: Bidang]  →  [Tier 2: Intent]  →  [Tier 3: Smart Label]              |
|  [Tier 4: Prioritas] → [Tier 5: Sentimen/Emosi] → [Tier 6: SLA & Assignee]     |
+-------------------------------------------------------------------------------+
         │                                                           ▲
         │ 2. REST API: Auto-Label / Tagging                         │
         │ 3. REST API: Private Note (Internal AI Routing Memo)      │
         │ 4. REST API: Auto-Reply (Jika Keyakinan AI >= 93%)         │
         ▼                                                           │
+--------------------------------------------------------------------+----------+
|                  DATABASE SUPABASE (psic_conversations)                       |
|           • Data real-time tersinkronisasi dengan Executive Dashboard         |
|           • Indeks Reputasi Digital Dinas PUPR Garut                          |
+-------------------------------------------------------------------------------+
```

---

## ⚙️ 2. Konfigurasi Environment Variables (`.env`)

Tambahkan variabel berikut pada file `.env` atau konfigurasi deployment Vercel Anda:

```env
# URL server Chatwoot (Gunakan Cloud Chatwoot atau Self-hosted instance Anda)
CHATWOOT_BASE_URL=https://app.chatwoot.com

# API Access Token dari User Admin / Bot Chatwoot (Profile Settings -> Access Token)
CHATWOOT_API_TOKEN=your_chatwoot_api_access_token_here

# ID Akun Chatwoot (Default: 1)
CHATWOOT_ACCOUNT_ID=1
```

> [!NOTE]
> Jika `CHATWOOT_API_TOKEN` tidak diatur di lingkungan lokal, sistem secara otomatis masuk ke mode **Offline Simulation / Graceful Fallback**, sehingga dasbor PSIC tetap dapat diuji tanpa menghasilkan error koneksi.

---

## 🔗 3. Cara Memasang Webhook di Chatwoot Admin

1. Masuk ke dasbor admin **Chatwoot**.
2. Navigasi ke menu **Settings (Pengaturan)** ➔ **Integrations (Integrasi)** ➔ **Webhooks**.
3. Klik tombol **Add New Webhook (Tambah Webhook Baru)**.
4. Masukkan URL endpoint PSIC:
   ```http
   https://domain-pupr-garut.com/api/psic/chatwoot
   ```
   *(Atau gunakan `https://domain-pupr-garut.com/api/psic/webhook` — kedua endpoint telah dikonfigurasi untuk mendeteksi payload Chatwoot secara otomatis).*
5. Centang event berikut:
   - `message_created` (Wajib)
   - `conversation_created`
   - `conversation_status_changed`
6. Klik **Create Webhook**.

---

## 🤖 4. Alur Kerja Otomatis (6-Tier PURI Routing & Chatwoot API)

Setiap kali warga mengirim pesan ke salah satu kanal di Chatwoot:

### 1. **Penerimaan & Klasifikasi (6-Tier PURI Routing)**
   Pesan diklasifikasikan berdasarkan hierarki PURI:
   - **Bidang PUPR**: `BINA_MARGA`, `SDA`, `BANGUNAN_GEDUNG`, `PENATAAN_RUANG`, `AMPL`, `JASA_KONSTRUKSI`, atau `SEKRETARIAT`.
   - **Layanan / Intent**: `PENGADUAN`, `PERSYARATAN`, `INFORMASI`, `APRESIASI`, atau `LAINNYA`.
   - **Smart Label**: Contoh: `"Jalan"`, `"Jembatan"`, `"Drainase"`, `"PBG"`, `"SLF"`, `"KRK"`.
   - **Prioritas & SLA**:
     - `KRITIS` (SLA 2 Jam) — Darurat jalan putus, jembatan ambruk, banjir kritis.
     - `TINGGI` (SLA 6–8 Jam) — Jalan rusak parah, drainase tersumbat.
     - `NORMAL` (SLA 12–24 Jam) — Pertanyaan persyaratan PBG/KRK atau apresiasi.

### 2. **Pemasangan Label Otomatis di Chatwoot**
   PSIC memanggil API Chatwoot `POST /api/v1/accounts/1/conversations/{id}/labels` dan memasang tag:
   ```json
   {
     "labels": ["Bina Marga", "Priority: TINGGI", "Jalan"]
   }
   ```

### 3. **Catatan Internal untuk Operator (`Private Note`)**
   PSIC mengirim pesan internal (warna kuning di Chatwoot, tidak terlihat oleh warga):
   ```text
   🤖 [PURI AI 6-Tier Smart Routing]
   • Bidang: BINA MARGA
   • Layanan/Intent: PENGADUAN (Jalan)
   • Prioritas: TINGGI
   • Sentimen: NEGATIF (Emosi: MARAH)
   • SLA Target: 6 Jam
   • Akurasi AI: 96%
   ```

### 4. **Balasan Otomatis (AI Auto-Reply)**
   Jika *Confidence Score* $\ge 93\%$ (misalnya laporan darurat atau pertanyaan FAQ PBG), AI PURI otomatis mengirim balasan pertama kepada pelapor agar meredakan ketegangan dan menginformasikan bahwa tim teknis bidang terkait sedang menangani tiket tersebut.

---

## 🧪 5. Contoh Pengujian Webhook dengan cURL

Anda dapat mensimulasikan pesan WhatsApp masuk dari Chatwoot menggunakan perintah terminal berikut:

```bash
curl -X POST http://localhost:3000/api/psic/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "message_type": "incoming",
    "id": 101,
    "content": "Jalan raya di Samarang Garut berlubang parah dan membahayakan pengendara motor, mohon segera diperbaiki!",
    "conversation": {
      "id": 501,
      "inbox_id": 1,
      "channel": "Channel::Whatsapp"
    },
    "sender": {
      "id": 88,
      "name": "Budi Santoso",
      "phone_number": "+6281234567890"
    }
  }'
```

### **Respons JSON yang Diharapkan:**
```json
{
  "success": true,
  "event": "message_created",
  "conversationId": "chatwoot_conv_501",
  "classification": {
    "bidang": "BINA_MARGA",
    "intent": "PENGADUAN",
    "smartLabel": "Jalan",
    "priority": "TINGGI",
    "sentiment": "NEGATIF",
    "emotion": "MARAH",
    "confidenceScore": 96,
    "slaHours": 6
  },
  "message": "Webhook Chatwoot berhasil diproses dengan 6-Tier PURI Routing."
}
```

---

## 🛡️ 6. Outbound Messaging dari Dasbor PSIC

Ketika Operator Dinas PUPR Garut membalas pesan melalui halaman **Executive Command Center (`/social`)**, permintaan akan dialirkan ke:
```http
POST /api/psic/chatwoot/reply
```
Endpoint ini akan secara otomatis meneruskan balasan operator ke kanal asal warga (WhatsApp, Instagram, Facebook, dll.) melalui Chatwoot REST API, serta menyimpan log interaksi ke dalam tabel `psic_messages` di Supabase.
