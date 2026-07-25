# GPS-CC Agent Rules
# Garut Public Working Service AI Command Center - Development Standards

> Aturan ini berlaku untuk SEMUA agen AI yang bekerja pada proyek GPS-CC.
> Setiap kode yang dihasilkan HARUS mematuhi aturan ini tanpa terkecuali.

---

## 🌐 Bahasa

- Kode: **English** (variabel, fungsi, komentar teknis)
- UI Text / Label: **Bahasa Indonesia** (sesuai konteks pelayanan publik Pemkab Garut)
- Dokumentasi: **Bahasa Indonesia** untuk user-facing, English untuk komentar kode
- Git commit: **English** (Conventional Commits)

---

## 🏛️ Arsitektur & Pola Desain

### Clean Architecture Layers
Proyek ini mengikuti **Clean Architecture** dengan pemisahan yang ketat:

```
domain/       → Pure TypeScript interfaces & types (TIDAK boleh import library)
services/     → Business logic & API client layer
hooks/        → React hooks & Zustand stores (state management)
components/   → React UI components (presentational & container)
app/          → Next.js pages & API routes (routing layer)
lib/          → Shared utilities & third-party config
constants/    → Static values, enums, design tokens
server/       → Standalone Express backend (Baileys WhatsApp)
```

### Aturan Dependensi (Dependency Rule)
- `domain/` → TIDAK BOLEH import dari layer manapun
- `services/` → Hanya import dari `domain/`
- `hooks/` → Import dari `domain/` dan `services/`
- `components/` → Import dari `hooks/`, `domain/`, `lib/`, `constants/`
- `app/` → Import dari semua layer

### State Management
- Gunakan **Zustand** untuk global state (BUKAN Context API)
- Setiap store harus didefinisikan di `hooks/` dengan prefix `use`
- Store harus typed dengan interface yang didefinisikan di `domain/`
- Hindari prop drilling lebih dari 2 level — gunakan store

---

## 📝 Konvensi Penamaan

| Tipe | Konvensi | Contoh | Anti-Pattern |
|------|----------|--------|-------------|
| File komponen | PascalCase.tsx | `MetricCard.tsx` | `metricCard.tsx` |
| File halaman | `page.tsx` (Next.js convention) | `app/whatsapp/page.tsx` | `WhatsAppPage.tsx` |
| File hook | camelCase + prefix `use` | `useWhatsApp.ts` | `whatsappHook.ts` |
| File service | camelCase + suffix `Service` | `apiService.ts` | `api.ts` |
| File domain model | camelCase | `models.ts` | `Models.ts` |
| Interface/Type | PascalCase | `DashboardMetrics` | `dashboardMetrics` |
| Enum | PascalCase (member: UPPER_SNAKE) | `TicketStatus.IN_PROGRESS` | - |
| Konstanta | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` | `maxRetry` |
| CSS class custom | kebab-case | `glass-card` | `glassCard` |
| Route segment (URL) | kebab-case | `/ai-dashboard` | `/aiDashboard` |
| Event handler | handle + Verb + Noun | `handleSubmitForm` | `onClickBtn` |
| Boolean variable | is/has/should prefix | `isLoading`, `hasError` | `loading` |

---

## 🧩 Struktur Komponen React

Setiap komponen HARUS mengikuti urutan berikut:

```typescript
// ============================================================
// 1. IMPORTS (terkelompok dan terurut)
// ============================================================
// a. React / Next.js core
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// b. Third-party libraries
import { motion } from 'motion/react';

// c. Internal components
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';

// d. Hooks & stores
import { useWhatsApp } from '@/hooks/useWhatsApp';

// e. Domain types & constants
import type { DashboardMetrics } from '@/domain/models';
import { THEME_COLORS } from '@/constants/theme';

// f. Utilities (terakhir)
import { cn } from '@/lib/utils';

// ============================================================
// 2. TYPES & INTERFACES (jika lokal ke komponen ini)
// ============================================================
interface ComponentNameProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

// ============================================================
// 3. COMPONENT DEFINITION
// ============================================================
export function ComponentName({ title, onAction, className }: ComponentNameProps) {
  // a. Hooks (selalu di atas)
  const router = useRouter();
  const { data, isLoading } = useWhatsApp();

  // b. Local state
  const [isOpen, setIsOpen] = useState(false);

  // c. Derived state / computed values
  const completionRate = data ? (data.selesai / data.total) * 100 : 0;

  // d. Effects
  useEffect(() => {
    // Side effect logic
  }, [dependency]);

  // e. Event handlers
  const handleClick = () => {
    setIsOpen(true);
    onAction?.();
  };

  // f. Early returns (loading, error, empty states)
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState />;

  // g. Render
  return (
    <div className={cn("base-classes", className)}>
      {/* JSX content */}
    </div>
  );
}
```

---

## 🎨 Styling & Design System

### Tailwind CSS v4
- Gunakan **Tailwind CSS v4** (sudah terkonfigurasi)
- JANGAN tambahkan TailwindCSS v3 atau library CSS lain
- Design tokens didefinisikan di `app/globals.css` dan `constants/theme.ts`

### Warna Tema GPS-CC
```
--color-garut-blue: #0F4C81    (Primary)
--color-garut-green: #2E7D32   (Success)
--color-garut-gold: #F4B400    (Accent)
--color-danger: #E53935        (Error/Danger)
--color-warning: #FB8C00       (Warning)
--color-bg-dark: #0D1117       (Background)
--color-card-dark: #161B22     (Card/Panel)
```

### Aturan Styling
1. Gunakan `cn()` dari `@/lib/utils` untuk conditional classes
2. Gunakan class `glass-card` untuk card styling (sudah terdefinisi global)
3. Gunakan class `glass-panel` untuk panel/sidebar styling
4. JANGAN buat inline styles kecuali untuk nilai dinamis (e.g., `style={{ width: `${percentage}%` }}`)
5. Responsive: selalu mulai dari mobile (`base`), lalu `md:`, `lg:`, `xl:`
6. Spacing: gunakan skala Tailwind standar (4px grid system)
7. Font: Inter (sudah dikonfigurasi di layout.tsx)

### Komponen UI (Shadcn)
- Komponen primitif ada di `components/ui/`
- JANGAN modifikasi komponen UI primitif langsung — extend melalui komposisi
- Untuk komponen baru: ikuti pola CVA (Class Variance Authority) yang sudah ada

---

## 🔒 Keamanan (OWASP Compliance)

### Environment Variables
- **WAJIB**: Semua kredensial (API key, secret) harus ada di `.env`
- **DILARANG**: Hardcode kredensial dalam source code
- Firebase client keys gunakan prefix `NEXT_PUBLIC_FIREBASE_*`
- Server-side secrets JANGAN gunakan prefix `NEXT_PUBLIC_`

### Input Validation
- Validasi SEMUA input user di sisi client DAN server
- Gunakan TypeScript strict types — JANGAN gunakan `any`
- Sanitasi input teks sebelum menyimpan ke Firestore
- Gunakan `zod` atau `@hookform/resolvers` untuk form validation

### API Routes
- Setiap API route HARUS memiliki error handling dengan try-catch
- Return format standar: `{ success: boolean, data?: T, error?: string }`
- Gunakan HTTP status codes yang benar (200, 201, 400, 401, 403, 404, 500)
- JANGAN expose internal error messages ke client di production

### Firestore
- Gunakan Firestore security rules (BUKAN trust client-side validation saja)
- JANGAN query seluruh collection — selalu gunakan filter/limit
- Gunakan server-side Firestore Admin SDK untuk operasi sensitif

---

## 📐 TypeScript Standards

### Strict Mode
- `strict: true` sudah aktif di tsconfig.json — JANGAN nonaktifkan
- DILARANG KERAS menggunakan `any` — gunakan `unknown` jika tipe tidak diketahui
- Selalu definisikan return type untuk fungsi publik
- Gunakan `interface` untuk object shapes, `type` untuk unions/intersections

### Contoh Pattern
```typescript
// ✅ BENAR
interface UserData {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
}

async function fetchUser(id: string): Promise<UserData | null> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return null;
    return res.json() as Promise<UserData>;
  } catch {
    return null;
  }
}

// ❌ SALAH
async function fetchUser(id: any): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

---

## 🧪 Testing Standards

### Test File Naming
- Unit tests: `*.test.ts` atau `*.test.tsx` (co-located dengan source)
- Integration tests: `__tests__/integration/`
- E2E tests: `e2e/`

### Minimum Coverage Target
- Hooks: ≥ 80%
- Services: ≥ 90%
- Utility functions: ≥ 95%
- Components: ≥ 70% (snapshot + interaction)

### Test Pattern
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should return expected result when given valid input', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error gracefully', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## 🔀 Git Workflow

### Branch Strategy
```
main          ← Production (protected, deploy otomatis)
├── staging   ← Pre-production testing
└── dev       ← Development integration
    ├── feature/fitur-baru
    ├── fix/perbaikan-bug
    ├── hotfix/perbaikan-darurat
    └── chore/maintenance
```

### Commit Messages (Conventional Commits)
```
feat(module): deskripsi singkat fitur baru
fix(module): deskripsi perbaikan bug
refactor(module): deskripsi refactoring
chore(deps): update dependencies
docs(module): update dokumentasi
test(module): tambah/perbaiki test
perf(module): optimasi performa
style(module): formatting, tidak ada perubahan logika
ci(pipeline): perubahan CI/CD
```

### Contoh:
```
feat(whatsapp): implement auto-reply bot for FAQ
fix(dashboard): handle null metrics data gracefully
refactor(services): migrate apiService from mock to Firestore
chore(deps): update @whiskeysockets/baileys to v7.1.0
docs(api): add WhatsApp endpoint documentation
```

---

## 📊 Performance Standards

- Lighthouse Performance Score: ≥ 90
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1
- Bundle size per page: < 200KB gzipped

### Optimization Rules
1. Gunakan `dynamic()` import untuk komponen besar (>50KB)
2. Gunakan `Image` dari `next/image` — BUKAN `<img>` tag
3. Gunakan `React.memo()` hanya jika profiling menunjukkan re-render masalah
4. JANGAN import seluruh library — gunakan tree-shaking (`import { X } from 'lib'`)
5. Data fetching: gunakan Server Components jika memungkinkan

---

## ♿ Accessibility (WCAG 2.1 AA)

- Semua button/link HARUS memiliki teks yang accessible
- Semua form input HARUS memiliki `<label>` atau `aria-label`
- Kontras warna minimum 4.5:1 untuk teks normal
- Keyboard navigation harus berfungsi pada semua elemen interaktif
- Gunakan semantic HTML (`<nav>`, `<main>`, `<article>`, `<section>`)
- Tambahkan `alt` text pada semua `<Image>` / `<img>`

---

## 📁 Dokumentasi Proyek

Semua dokumentasi proyek berada di folder `docs/`:

| File | Deskripsi |
|------|-----------|
| `docs/PRD.md` | Product Requirements Document |
| `docs/REQUIREMENTS.md` | Technical Requirements |
| `docs/FEATURES.md` | Feature Specifications |
| `docs/USERFLOW.md` | User Flow Diagrams |
| `docs/DATABASE.md` | Database Schema & Collections |
| `docs/API.md` | API Endpoint Documentation |
| `docs/ARCHITECTURE.md` | System Architecture |
| `docs/DESIGN.md` | Design System & UI Guidelines |
| `docs/ROADMAP.md` | Development Roadmap |

---

## 🚨 Hal yang DILARANG

1. ❌ JANGAN gunakan `any` sebagai type
2. ❌ JANGAN hardcode credentials/secrets dalam source code
3. ❌ JANGAN commit file `.env` ke repository
4. ❌ JANGAN gunakan `console.log` di production — gunakan logger terstruktur
5. ❌ JANGAN disable ESLint rules tanpa justifikasi komentar
6. ❌ JANGAN buat komponen lebih dari 300 baris — pecah menjadi sub-komponen
7. ❌ JANGAN query Firestore tanpa `limit()` pada collection besar
8. ❌ JANGAN gunakan `dangerouslySetInnerHTML` tanpa sanitasi
9. ❌ JANGAN bypass TypeScript errors dengan `@ts-ignore`
10. ❌ JANGAN push langsung ke branch `main`
