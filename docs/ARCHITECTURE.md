# 🏗️ System Architecture
## GPS-CC: Garut Public Service AI Command Center

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Users["👥 Users"]
        Warga["Warga Masyarakat<br/>(WhatsApp)"]
        Operator["Operator CS<br/>(Web Dashboard)"]
        Admin["Admin IT<br/>(Web Dashboard)"]
        Eksekutif["Pejabat Eksekutif<br/>(Web Dashboard)"]
    end

    subgraph CDN["🌐 CDN & Edge"]
        Vercel["Vercel Edge Network<br/>(Static Assets + SSR)"]
    end

    subgraph Frontend["🖥️ Frontend (Next.js 15)"]
        AppRouter["App Router<br/>(Server + Client Components)"]
        APIRoutes["API Routes<br/>(Serverless Functions)"]
    end

    subgraph Backend["🖧 Backend Services"]
        BaileysServer["Baileys Express Server<br/>(:3001)"]
    end

    subgraph AI["🤖 AI Services"]
        Gemini["Google Gemini API<br/>(Chat, RAG, Sentiment)"]
    end

    subgraph Database["🗄️ Database & Storage"]
        Firestore["Firebase Firestore<br/>(Document DB)"]
        FireAuth["Firebase Auth<br/>(Authentication)"]
        FireStorage["Firebase Storage<br/>(File Upload)"]
    end

    subgraph External["☁️ External APIs"]
        MetaWA["Meta WhatsApp<br/>(via Baileys Protocol)"]
        SocialAPIs["Social Media APIs<br/>(Twitter, IG, FB)"]
    end

    Warga -->|Chat| MetaWA
    MetaWA <-->|WebSocket| BaileysServer
    Operator --> Vercel
    Admin --> Vercel
    Eksekutif --> Vercel

    Vercel --> AppRouter
    Vercel --> APIRoutes

    APIRoutes --> Gemini
    APIRoutes --> Firestore
    APIRoutes --> FireAuth
    APIRoutes --> FireStorage
    APIRoutes --> BaileysServer
    APIRoutes --> SocialAPIs

    BaileysServer --> MetaWA
    BaileysServer --> Firestore
```

---

## 2. Application Layer Architecture

```mermaid
graph LR
    subgraph Presentation["Presentation Layer"]
        Pages["Pages<br/>(app/)"]
        Components["Components<br/>(components/)"]
    end

    subgraph Application["Application Layer"]
        Hooks["Hooks & Stores<br/>(hooks/)"]
        Services["Services<br/>(services/)"]
    end

    subgraph Domain["Domain Layer"]
        Models["Models & Types<br/>(domain/)"]
        Constants["Constants<br/>(constants/)"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Firebase["Firebase Client<br/>(lib/firebase.ts)"]
        APIClient["API Routes<br/>(app/api/)"]
        BaileysBackend["Baileys Server<br/>(server/)"]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Services
    Services --> Models
    Services --> APIClient
    Services --> Firebase
    APIClient --> BaileysBackend
    Constants --> Components
```

---

## 3. Baileys Server Internal Architecture

```mermaid
graph TB
    subgraph Express["Express Server (:3001)"]
        Middleware["Middleware<br/>(CORS, JSON Parser,<br/>Error Handler)"]
        Routes["Routes<br/>(baileysRoutes.js)"]
        Controller["Controller<br/>(baileysController.js)"]
    end

    subgraph Core["Baileys Core"]
        WASocket["WASocket Service<br/>(waSocket.js)"]
        AuthState["Multi-File Auth State<br/>(baileys_auth_garut/)"]
    end

    subgraph InMemory["In-Memory Cache"]
        MsgCache["Messages Cache<br/>(max 100)"]
        ContactCache["Contacts Cache<br/>(Map)"]
        PresenceCache["Presence Cache<br/>(Map)"]
        LogCache["Socket Logs<br/>(max 200)"]
    end

    subgraph EventListeners["Event Listeners"]
        CredUpdate["creds.update"]
        ConnUpdate["connection.update"]
        MsgUpsert["messages.upsert"]
        MsgUpdate["messages.update"]
        ContactSync["contacts.upsert"]
        Presence["presence.update"]
        GroupEvent["group-participants.update"]
    end

    Middleware --> Routes
    Routes --> Controller
    Controller --> WASocket
    WASocket --> AuthState
    WASocket --> EventListeners
    EventListeners --> InMemory

    WASocket -->|"Reconnect Strategy<br/>(Exponential Backoff<br/>Max 15 attempts)"| WASocket
```

---

## 4. Data Flow Architecture

```mermaid
sequenceDiagram
    participant W as Warga (WhatsApp)
    participant B as Baileys Server
    participant N as Next.js API
    participant G as Gemini AI
    participant F as Firestore
    participant D as Dashboard

    W->>B: Kirim pesan WhatsApp
    B->>B: messages.upsert event
    B->>F: Simpan pesan ke wa_conversations
    B->>N: Webhook / polling
    N->>G: Analisis intent + generate reply
    G-->>N: AI Reply + confidence
    N->>F: Simpan AI suggestion
    N-->>B: Send auto-reply (jika confidence > 80%)
    B-->>W: Kirim balasan

    D->>N: Poll dashboard data
    N->>F: Query metrics
    F-->>N: Aggregated data
    N-->>D: Render dashboard
```

---

## 5. Deployment Architecture

```mermaid
graph TB
    subgraph Production["Production Environment"]
        subgraph Vercel["Vercel"]
            NextApp["Next.js App<br/>(Auto-scaled)"]
            ServerlessFn["Serverless Functions<br/>(API Routes)"]
            EdgeFn["Edge Functions<br/>(Middleware)"]
        end

        subgraph VPS["VPS / Cloud Run"]
            BaileysApp["Baileys Server<br/>(Docker Container)"]
            AuthFiles["Auth Session Files<br/>(Persistent Volume)"]
        end

        subgraph Firebase["Firebase"]
            FS["Firestore"]
            FA["Firebase Auth"]
            FSt["Firebase Storage"]
        end
    end

    subgraph Monitoring["Monitoring"]
        Sentry["Sentry<br/>(Error Tracking)"]
        Analytics["Firebase Analytics"]
    end

    NextApp --> ServerlessFn
    ServerlessFn --> BaileysApp
    ServerlessFn --> FS
    ServerlessFn --> FA
    BaileysApp --> AuthFiles
    NextApp --> Sentry
    BaileysApp --> Sentry
    NextApp --> Analytics
```

---

## 6. Security Architecture

```mermaid
graph TB
    subgraph Client["Client Browser"]
        JWT["JWT Token<br/>(Firebase Auth)"]
    end

    subgraph Edge["Edge Layer"]
        CORS["CORS Policy"]
        RateLimit["Rate Limiting"]
        CSP["Content Security Policy"]
    end

    subgraph Auth["Authentication"]
        FireAuth["Firebase Auth<br/>(Email/OTP)"]
        RBAC["RBAC Middleware<br/>(Role Check)"]
    end

    subgraph Data["Data Security"]
        Rules["Firestore Rules<br/>(Auth + Role)"]
        Validation["Input Validation<br/>(Zod Schema)"]
        Sanitize["Input Sanitization"]
    end

    subgraph Secrets["Secret Management"]
        EnvVars["Environment Variables<br/>(.env - NOT committed)"]
    end

    Client -->|Bearer Token| CORS
    CORS --> RateLimit
    RateLimit --> FireAuth
    FireAuth --> RBAC
    RBAC --> Validation
    Validation --> Sanitize
    Sanitize --> Rules
    EnvVars -.->|"API Keys,<br/>Firebase Config"| Auth
```

---

## 7. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | SSR, routing, API routes |
| **UI** | React 19 + Tailwind CSS 4 | Component rendering + styling |
| **State** | Zustand 5 | Client-side state management |
| **Charts** | Recharts 3 | Data visualization |
| **Maps** | Leaflet + React-Leaflet | GIS mapping |
| **Animation** | Motion 12 | UI animations |
| **Icons** | Lucide React | Icon system |
| **AI** | Google Gemini API | NLP, chatbot, sentiment |
| **Database** | Firebase Firestore | NoSQL document store |
| **Auth** | Firebase Authentication | User auth + JWT |
| **Storage** | Firebase Storage | File uploads |
| **WhatsApp** | Baileys (WebSocket) | WA Business API |
| **Backend WA** | Express 5 | REST API for Baileys |
| **Logging** | Pino | Structured logging |
| **QR Code** | qrcode.react | QR rendering |
