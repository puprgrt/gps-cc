# 📡 API Endpoint Documentation

Ini adalah dokumentasi endpoint API internal yang disediakan oleh Next.js untuk dikonsumsi oleh dashboard dan layanan eksternal terkait WhatsApp.
Semua request memerlukan Content-Type `application/json`.

## Base URL
`/api` (contoh: `http://localhost:3000/api`)

---

## 1. WhatsApp Connection Status
**Endpoint**: `/api/whatsapp/status`  
**Method**: `GET`  
**Description**: Mengambil status koneksi dan info perangkat bot saat ini.  

### Response (200 OK)
```json
{
  "status": "online",
  "qr": null,
  "info": {
    "id": "6281234567890:1@s.whatsapp.net",
    "name": "PUPR Garut Bot"
  }
}
```
*Note: Jika status "qr", maka field `qr` akan berisi string Data URI Base64 untuk ditampilkan sebagai gambar.*

---

## 2. WhatsApp Messages Fetch
**Endpoint**: `/api/whatsapp/messages`  
**Method**: `GET`  
**Description**: Mengambil riwayat pesan terbaru dari basis data atau API proxy (dengan fallback yang sesuai jika bot sedang terputus).  

### Query Parameters
- `limit` (opsional): Jumlah batas pesan (default: 50)
- `offset` (opsional): Titik mulai (default: 0)

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-12345",
      "conversation_id": "628999999999@s.whatsapp.net",
      "body": "Isi pesan masuk...",
      "from_me": false,
      "created_at": "2026-07-25T12:00:00Z",
      "status": "read"
    },
    {
      "id": "msg-12346",
      "conversation_id": "628999999999@s.whatsapp.net",
      "body": "PURI: Baik, saya bantu...",
      "from_me": true,
      "created_at": "2026-07-25T12:00:05Z",
      "status": "sent"
    }
  ]
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Failed to fetch messages. Please check server logs."
}
```

---

## 3. WhatsApp Message Send (Manual)
**Endpoint**: `/api/whatsapp/messages`  
**Method**: `POST`  
**Description**: Mengirim pesan secara manual (dari operator via Dashboard) ke kontak tertentu.

### Request Body
```json
{
  "phone": "628999999999",
  "message": "Halo, ini balasan langsung dari operator (Non-AI)."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "messageId": "new-msg-id"
}
```

### Error Response (400)
```json
{
  "success": false,
  "error": "Nomor tujuan atau pesan tidak valid"
}
```

### Error Response (503)
```json
{
  "success": false,
  "error": "WhatsApp tidak terkoneksi. Silakan periksa status koneksi."
}
```
