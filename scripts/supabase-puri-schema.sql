-- ============================================================================
-- SUPABASE SQL SCHEMA (DEFAULT DATABASE FOR PURI AI ORCHESTRATOR 2026)
-- Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
-- ============================================================================

-- 1. Tabel RAG Knowledge Base untuk 7 Bidang Resmi PUPR Garut
CREATE TABLE IF NOT EXISTS public.puri_rag_knowledge_base (
  id TEXT PRIMARY KEY,
  bidang TEXT NOT NULL,
  title TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian bidang & timestamp
CREATE INDEX IF NOT EXISTS idx_puri_rag_bidang ON public.puri_rag_knowledge_base(bidang);
CREATE INDEX IF NOT EXISTS idx_puri_rag_updated_at ON public.puri_rag_knowledge_base(updated_at DESC);

-- 2. Tabel FAQ 0-Token Semantic & Exact Memory Cache
CREATE TABLE IF NOT EXISTS public.puri_faq_cache (
  query_key TEXT PRIMARY KEY,
  reply_text TEXT NOT NULL,
  category TEXT DEFAULT 'CHAT_GENERAL',
  hit_count INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk sorting performa hit & update
CREATE INDEX IF NOT EXISTS idx_puri_faq_hit_count ON public.puri_faq_cache(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_puri_faq_updated_at ON public.puri_faq_cache(updated_at DESC);

-- 3. Kebijakan Row Level Security (RLS)
ALTER TABLE public.puri_rag_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puri_faq_cache ENABLE ROW LEVEL SECURITY;

-- Drop kebijakan lama jika ada (idempotent schema migration)
DROP POLICY IF EXISTS "Allow public read access on RAG KB" ON public.puri_rag_knowledge_base;
DROP POLICY IF EXISTS "Allow public read access on FAQ Cache" ON public.puri_faq_cache;
DROP POLICY IF EXISTS "Allow service role full access on RAG KB" ON public.puri_rag_knowledge_base;
DROP POLICY IF EXISTS "Allow service role full access on FAQ Cache" ON public.puri_faq_cache;

-- Izinkan publik membaca RAG KB & FAQ Cache (untuk antarmuka web & bot)
CREATE POLICY "Allow public read access on RAG KB"
  ON public.puri_rag_knowledge_base
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access on FAQ Cache"
  ON public.puri_faq_cache
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Izinkan service role (backend server) melakukan insert/update/delete penuh
CREATE POLICY "Allow service role full access on RAG KB"
  ON public.puri_rag_knowledge_base
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access on FAQ Cache"
  ON public.puri_faq_cache
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Tabel Pengaturan Terpusat Model Semua AI (5 AI Providers)
CREATE TABLE IF NOT EXISTS public.puri_ai_provider_settings (
  provider TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.puri_ai_provider_settings ENABLE ROW LEVEL SECURITY;

-- Drop kebijakan lama jika ada pada AI Provider Settings (idempotent schema migration)
DROP POLICY IF EXISTS "Allow public read access on AI Provider Settings" ON public.puri_ai_provider_settings;
DROP POLICY IF EXISTS "Allow service role full access on AI Provider Settings" ON public.puri_ai_provider_settings;

CREATE POLICY "Allow public read access on AI Provider Settings"
  ON public.puri_ai_provider_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access on AI Provider Settings"
  ON public.puri_ai_provider_settings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
