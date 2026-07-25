# 🎨 Design System & UI Guidelines
## GPS-CC: Garut Public Service AI Command Center

---

## 1. Design Philosophy

GPS-CC menggunakan pendekatan **Dark Glassmorphism Command Center** — desain yang terinspirasi dari control room militer dan NASA mission control, dengan sentuhan modern glassmorphism.

### Prinsip Desain
1. **Data Density** — Tampilkan sebanyak mungkin informasi tanpa terasa crowded
2. **Glanceable** — Informasi kritis harus bisa dipahami dalam 3 detik
3. **Ambient Awareness** — Warna dan animasi menunjukkan status real-time
4. **Professional Authority** — Desain yang menyampaikan kepercayaan institusi

---

## 2. Color Palette

### Primary Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Garut Blue | `#0F4C81` | `--color-garut-blue` | Primary actions, branding |
| Garut Green | `#2E7D32` | `--color-garut-green` | Success, completed |
| Garut Gold | `#F4B400` | `--color-garut-gold` | Accent, highlights |

### Semantic Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Danger | `#E53935` | `--color-danger` | Errors, critical alerts |
| Warning | `#FB8C00` | `--color-warning` | Warnings, SLA breach |
| Success | `#43A047` | `--color-success` | Completed, online |
| Info | `#039BE5` | `--color-info` | Informational |

### Background & Surface
| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Background Dark | `#0D1117` | `--color-bg-dark` | Page background |
| Card Dark | `#161B22` | `--color-card-dark` | Card/panel surface |
| Glass | `rgba(255,255,255,0.08)` | `--color-glass` | Glassmorphism overlay |
| Glass Border | `rgba(255,255,255,0.1)` | `--color-glass-border` | Subtle borders |

### Status Indicator Colors (dalam Tailwind)
```
Selesai   → green-500 (#22c55e)
Proses    → yellow-500 (#eab308)
Terlambat → red-500 (#ef4444)
Online    → green-400
Busy      → amber-400
Offline   → slate-500
```

---

## 3. Typography

### Font Family
- **Primary**: Inter (Google Fonts) — loaded di `app/layout.tsx`
- **Monospace**: System mono (untuk angka, kode, waktu)

### Scale
| Level | Class | Size | Weight | Usage |
|-------|-------|------|--------|-------|
| Display | `text-3xl` | 30px | Bold (700) | Angka besar, waktu |
| Heading 1 | `text-2xl` | 24px | Bold (700) | Judul halaman |
| Heading 2 | `text-xl` | 20px | Bold (700) | Judul section |
| Heading 3 | `text-base` | 16px | Bold (700) | Judul card |
| Body | `text-sm` | 14px | Regular (400) | Teks umum |
| Caption | `text-xs` | 12px | Regular (400) | Label, metadata |
| Micro | `text-[10px]` | 10px | Medium (500) | Sub-label, tag |
| Nano | `text-[9px]` | 9px | Regular (400) | Smallest text |
| Label | `text-[8px]` | 8px | Bold (700) | Map labels |

### Text Colors
```
Heading      → text-white
Body         → text-slate-300
Secondary    → text-slate-400
Muted        → text-slate-500
Accent       → text-blue-400 / text-green-400
```

---

## 4. Component Library

### Glass Card (`.glass-card`)
Komponen dasar untuk semua panel konten.

```css
.glass-card {
  background: var(--color-card-dark);    /* #161B22 */
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-glass-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

### Glass Panel (`.glass-panel`)
Untuk sidebar dan header area.

```css
.glass-panel {
  background: var(--color-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-glass-border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

### Metric Card Pattern
```
┌─────────────────────────┐
│ [icon]  TITLE           │
│         Subtitle        │
│                         │
│    ████  VALUE          │
│    ████                 │
│         ▲ 12.5%         │
│                         │
│  SLA: 98% / Target 98%  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░        │
│  [sparkline chart]      │
└─────────────────────────┘
```

### Badge Variants
| Variant | Classes | Usage |
|---------|---------|-------|
| Success | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` | Online, completed |
| Warning | `bg-amber-500/10 text-amber-400 border-amber-500/20` | In progress |
| Danger | `bg-rose-500/10 text-rose-400 border-rose-500/20` | Error, critical |
| Info | `bg-sky-500/10 text-sky-400 border-sky-500/20` | Informational |
| Neutral | `bg-slate-500/10 text-slate-400 border-slate-500/20` | Default |

---

## 5. Spacing System

Mengikuti 4px grid system (Tailwind default):

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 4px | `gap-1`, `p-1` | Elemen sangat rapat |
| sm | 8px | `gap-2`, `p-2` | Spacing dalam komponen |
| md | 16px | `gap-4`, `p-4` | Spacing antar elemen |
| lg | 24px | `gap-6`, `p-6` | Spacing antar section |
| xl | 32px | `gap-8`, `p-8` | Spacing besar |
| 2xl | 48px | `gap-12`, `p-12` | Spacing terluar |

---

## 6. Layout Grid

### Dashboard Grid
```
Desktop (≥1024px):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ KRK │PKKPR│PEIL │IRIG │RUMI │SITE │ PBG │ SLF │  ← 8 cols
├─────┴──┬──┴─────┴─────┴──┬──┴─────┴─────┴─────┤
│ Exec   │   GIS MAP       │ Social & Sentiment  │  ← 3+6+3
│Summary │                 │                      │
├────────┼─────────┬───────┼──────────────────────┤
│ Trend  │ Top5 Kec│ SLA   │ Pengaduan Terkini    │  ← 4+5+3
│ Chart  │         │ Gauge │                      │
└────────┴─────────┴───────┴──────────────────────┘

Tablet (768-1023px): 4 cols → 2 rows metric cards
Mobile (<768px): 2 cols → 4 rows metric cards, stacked sections
```

### Sidebar
- Expanded: 260px
- Collapsed: 80px (icon only)
- Mobile: Full overlay with backdrop

### Topbar
- Height: 100px
- Contains: hamburger, title, search, clock, AI status, user

---

## 7. Animation Guidelines

### Transitions
- Default duration: `300ms`
- Easing: `ease-in-out`
- Use Tailwind: `transition-all duration-300 ease-in-out`

### Micro-animations
| Element | Animation | Duration |
|---------|-----------|----------|
| Card hover | `hover:bg-white/5` | 200ms |
| Button hover | Scale 1.02 + shadow | 200ms |
| Menu item active | Background slide | 250ms |
| Data point ping | `animate-ping` | Infinite |
| Sidebar toggle | Width transition | 300ms |
| Modal appear | Fade + scale | 300ms |
| Toast notification | Slide-in from top | 300ms |

### Loading States
- Skeleton: `bg-slate-700 animate-pulse rounded`
- Spinner: SVG atau Lucide `Loader2` icon with `animate-spin`

---

## 8. Iconography

### Library: Lucide React
- Style: Outline (stroke)
- Default size: `w-5 h-5`
- Color: inherit from parent text color

### Icon Sizes
| Context | Size | Class |
|---------|------|-------|
| Navigation | 20px | `w-5 h-5` |
| Card header | 20px | `w-5 h-5` |
| Button inline | 16px | `w-4 h-4` |
| Status indicator | 12px | `w-3 h-3` |
| Large display | 24px | `w-6 h-6` |

---

## 9. Responsive Breakpoints

| Name | Min Width | Tailwind Prefix | Target Device |
|------|-----------|-----------------|---------------|
| Mobile | 0px | (none) | Phone |
| Tablet | 768px | `md:` | Tablet |
| Desktop | 1024px | `lg:` | Laptop |
| Large Desktop | 1280px | `xl:` | Desktop monitor |
| Ultra-wide | 1536px | `2xl:` | Command center display |

### Max Width
Dashboard content area: `max-w-[1600px] mx-auto`

---

## 10. Dark Mode

GPS-CC menggunakan **dark mode only** sebagai default (command center aesthetic).

- `<html lang="id" className="dark">`
- Background: `#0D1117` dengan background image overlay
- Semua warna dioptimasi untuk dark background
- Kontras minimum 4.5:1 untuk aksesibilitas
