# 🔗 API Documentation
## GPS-CC: API Endpoint Reference

---

## Base URLs

| Environment | Frontend | Baileys Server |
|-------------|----------|----------------|
| Development | `http://localhost:3000` | `http://localhost:3001` |
| Staging | TBD | TBD |
| Production | TBD | TBD |

---

## Response Format (Standard)

Semua API mengikuti format response standar:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta"?: {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": "Deskripsi error",
  "code": "ERROR_CODE",
  "timestamp": "2024-05-14T10:00:00.000Z"
}
```

---

## 1. Next.js API Routes (`/api/`)

### 1.1 Gemini AI

#### `POST /api/gemini/assistant`
AI Assistant — percakapan dengan Gemini.

**Request Body:**
```json
{
  "message": "Bagaimana cara mengurus PBG?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "Untuk mengurus PBG, Anda perlu...",
    "sources": ["SOP-PBG-2024.pdf"],
    "confidence": 0.92
  }
}
```

#### `POST /api/gemini/social-reply`
Generate AI reply untuk social media mention.

**Request Body:**
```json
{
  "mentionContent": "Kenapa ngurus PBG lama?",
  "platform": "twitter",
  "sentiment": "negative",
  "tone": "professional"
}
```

---

### 1.2 WhatsApp

#### `GET /api/whatsapp/baileys`
Status koneksi Baileys socket.

**Response:**
```json
{
  "status": "connected",
  "phoneNumber": "+62812...",
  "userJid": "6281...@s.whatsapp.net",
  "pushName": "PUPR Garut",
  "baileysVersion": "@whiskeysockets/baileys v7.x",
  "pingMs": 18,
  "serverTime": "2024-05-14T10:00:00.000Z"
}
```

#### `POST /api/whatsapp/baileys`
Aksi koneksi Baileys.

**Actions:** `connect`, `disconnect`, `reconnect`, `confirm_auth`

```json
{
  "action": "connect",
  "mode": "qr",
  "phoneNumber": "+6281234567890"
}
```

#### `GET /api/whatsapp/messages`
Daftar percakapan aktif + logs.

#### `POST /api/whatsapp/messages`
Kirim pesan atau tambah catatan.

**Actions:** `send_message`, `add_note`

```json
{
  "action": "send_message",
  "conversationId": "conv-1",
  "text": "Terima kasih atas laporannya",
  "sender": "operator"
}
```

#### `GET /api/whatsapp/analytics`
Statistik WhatsApp: total pesan, respons rate, avg response time.

#### `GET /api/whatsapp/operators`
Daftar operator dan status.

#### `GET /api/whatsapp/templates`
Template quick response.

---

### 1.3 Social Listening

#### `GET /api/social-listening`
Daftar mention terbaru + trending topics.

**Response:**
```json
{
  "mentions": [
    {
      "id": 1,
      "platform": "twitter",
      "author": "@wargagarut",
      "content": "...",
      "sentiment": "negative",
      "topic": "Jalan Garut",
      "timestamp": "2024-05-14T10:00:00.000Z",
      "likes": 12,
      "retweets": 4
    }
  ],
  "trending": [
    { "name": "PBG Garut", "count": 5 }
  ]
}
```

---

## 2. Baileys Standalone Server (`/api/`)

Port: `3001` (default)

### Health Check

#### `GET /health`
```json
{ "status": "ok", "timestamp": "..." }
```

### Connection

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/status` | Status socket koneksi |
| `POST` | `/api/connect` | Inisialisasi koneksi baru |
| `POST` | `/api/reconnect` | Manual reconnect |
| `POST` | `/api/disconnect` | Disconnect & logout |

### Messaging

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/send-message` | Kirim pesan teks |
| `POST` | `/api/send-media` | Kirim media (gambar/dokumen) |
| `POST` | `/api/send-presence` | Kirim typing indicator |
| `POST` | `/api/mark-read` | Tandai pesan dibaca |

#### `POST /api/send-message`
```json
{
  "to": "6281234567890",
  "text": "Selamat pagi, permohonan Anda sedang diproses",
  "options": {}
}
```

#### `POST /api/send-media`
```json
{
  "to": "6281234567890",
  "mediaUrl": "https://storage.../dokumen.pdf",
  "caption": "Dokumen terlampir",
  "mediaType": "document"
}
```

### Data Retrieval

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/inbound-messages` | Pesan masuk (cache in-memory) |
| `GET` | `/api/contacts` | Daftar kontak tersinkron |
| `GET` | `/api/profile-picture?jid=...` | Foto profil kontak |
| `GET` | `/api/group-metadata?groupId=...` | Metadata grup |

---

## 3. Planned API Endpoints (v1.1+)

### Permohonan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/permohonan` | List permohonan (filtered/paginated) |
| `GET` | `/api/permohonan/:id` | Detail permohonan |
| `POST` | `/api/permohonan` | Buat permohonan baru |
| `PATCH` | `/api/permohonan/:id` | Update status/data |
| `DELETE` | `/api/permohonan/:id` | Hapus (soft delete) |

### Pengaduan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/pengaduan` | List pengaduan |
| `GET` | `/api/pengaduan/:id` | Detail pengaduan |
| `POST` | `/api/pengaduan` | Buat pengaduan baru |
| `PATCH` | `/api/pengaduan/:id` | Update status |
| `POST` | `/api/pengaduan/:id/assign` | Assign ke petugas |

### Dashboard
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/dashboard/metrics` | Metrik utama dashboard |
| `GET` | `/api/dashboard/sla` | SLA per layanan |
| `GET` | `/api/dashboard/trend` | Trend permohonan |

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user profile |
| `PATCH` | `/api/auth/role` | Update user role (admin) |

---

## 4. Authentication

Semua API routes (kecuali `/health` dan `/api/auth/login`) memerlukan autentikasi.

**Header:**
```
Authorization: Bearer <firebase-id-token>
```

**Error Responses:**
- `401 Unauthorized` — Token missing atau expired
- `403 Forbidden` — Role tidak memiliki akses
