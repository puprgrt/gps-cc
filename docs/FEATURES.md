# 🧩 Feature Specifications
## GPS-CC: Garut Public Service AI Command Center

---

## Modul 1: Executive Dashboard (`/`)

### Status: ✅ Implemented (UI) | 🔴 Data Mock

| Feature | Status | Prioritas |
|---------|--------|-----------|
| 8 Metric Cards (KRK, PKKPR, Peil, Irigasi, RUMIJA, Siteplan, PBG, SLF) | ✅ UI | P0 |
| Sparkline chart per kartu | ✅ UI | P1 |
| Executive Summary (4-grid) | ✅ UI | P0 |
| GIS Map Placeholder | ✅ UI | P1 |
| Social Media & Komunikasi widget | ✅ UI | P2 |
| Sentiment Analysis (Pie Chart) | ✅ UI | P2 |
| Trend Permohonan (Line Chart) | ✅ UI | P1 |
| Top 5 Kecamatan (Bar Chart) | ✅ UI | P1 |
| SLA Performance gauge | ✅ UI | P0 |
| Pengaduan Terkini feed | ✅ UI | P1 |
| AI Insight floating box | ✅ UI | P2 |
| Floating AI Assistant Chat | ✅ UI/Function | P1 |
| **Real Firestore data binding** | 🔴 TODO | **P0** |

---

## Modul 2: WhatsApp Center (`/whatsapp`)

### Status: ✅ Implemented (Full Stack) | 🟡 Perlu Penyempurnaan

| Feature | Status | Prioritas |
|---------|--------|-----------|
| QR Code Login (Baileys) | ✅ Full | P0 |
| Phone Pairing Code | ✅ Full | P0 |
| Conversation List (Inbox) | ✅ Full | P0 |
| Chat Message View | ✅ Full | P0 |
| Send Text Message | ✅ Full | P0 |
| Send Media (Image/Document) | ✅ Backend | P1 |
| AI Suggested Reply | ✅ UI | P1 |
| Internal Notes | ✅ Full | P1 |
| Operator Status Panel | ✅ UI + Mock | P1 |
| Bot Activity Logs | ✅ Full | P1 |
| Connection Status Monitor | ✅ Full | P0 |
| Auto-reconnect (Exponential Backoff) | ✅ Full | P0 |
| Template Quick Responses | 🟡 API Ready | P1 |
| WhatsApp Analytics | 🟡 API Ready | P2 |
| **Auto-reply Bot (AI + FAQ)** | 🔴 TODO | **P0** |

---

## Modul 3: Social Media Center (`/social`)

### Status: ✅ Implemented (UI) | 🟡 Mock Data

| Feature | Status | Prioritas |
|---------|--------|-----------|
| Social KPI Cards | ✅ UI | P1 |
| Social Listening Feed | ✅ UI + Mock API | P1 |
| Sentiment Badge per Post | ✅ UI | P1 |
| Trending Topics | ✅ API | P1 |
| Unified Inbox | ✅ UI | P1 |
| Conversation View | ✅ UI | P1 |
| AI Assistant (Reply Draft) | ✅ UI | P2 |
| Social Analytics Charts | ✅ UI | P2 |
| **Real Social Media API Integration** | 🔴 TODO | **P1** |
| **AI Sentiment Analysis Engine** | 🔴 TODO | **P1** |

---

## Modul 4: Pencarian Global (`/search`)

### Status: ✅ Implemented (Full)

| Feature | Status | Prioritas |
|---------|--------|-----------|
| Cross-module search | ✅ Full | P0 |
| Category filter pills | ✅ Full | P1 |
| URL query sync | ✅ Full | P1 |
| Result cards with icons | ✅ Full | P1 |
| Empty state | ✅ Full | P1 |
| **Full-text search across Firestore data** | 🔴 TODO | **P1** |

---

## Modul 5-12: Placeholder Modules

### Status: 🔴 Placeholder Only

| Modul | Route | Prioritas Pengembangan |
|-------|-------|----------------------|
| AI Customer Service | `/ai-cs` | P1 |
| AI Dashboard | `/ai-dashboard` | P2 |
| Analytics | `/analisis` | P1 |
| GIS & Peta | `/gis` | P1 |
| Knowledge Base | `/kb` | P2 |
| Pegawai | `/pegawai` | P2 |
| Pelayanan | `/pelayanan` | **P0** |
| Pengaduan | `/pengaduan` | **P0** |
| SLA Monitoring | `/sla` | P1 |

---

## Feature Priority Matrix

```
P0 (Harus Ada)     P1 (Penting)         P2 (Nice to Have)
─────────────────   ──────────────────   ──────────────────
Dashboard Real Data GIS Peta Interaktif  AI Dashboard
Pelayanan CRUD      SLA Monitoring       Knowledge Base
Pengaduan           AI Customer Service  Pegawai Management
WhatsApp Auto-Bot   Social Media API     Social Analytics
Auth & RBAC         Analytics            AI Insight Engine
Firebase Security   Global Search (FTS)  Sentiment AI
```
