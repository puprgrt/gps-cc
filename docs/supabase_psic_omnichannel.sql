-- ============================================================================
-- PURI SOCIAL INTELLIGENCE CENTER (PSIC) - OMNICHANNEL SUPABASE SCHEMA
-- Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
-- ============================================================================
--
-- File migrasi ini mendefinisikan tabel-tabel utama untuk mendukung
-- arsitektur AI Omnichannel Social Media Command Center (PSIC)
-- yang terintegrasi dengan 6-Tier Hierarchical AI Routing Engine (PURI)
-- dan 7 Bidang Resmi di lingkungan Dinas PUPR Kabupaten Garut.
--
-- Jalankan skrip ini di Supabase SQL Editor untuk membuat tabel dan seed sample data.
-- ============================================================================

-- 1. TABEL REGISTRI KANAL OMNICHANNEL (psic_channels)
CREATE TABLE IF NOT EXISTS public.psic_channels (
  id VARCHAR(64) PRIMARY KEY, -- 'whatsapp', 'instagram', 'facebook', 'threads', 'twitter', 'youtube', 'tiktok', 'telegram', 'google_business', 'website', 'portal_pengaduan'
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'SOCIAL_MEDIA', 'MESSENGER', 'REVIEW', 'PORTAL'
  is_active BOOLEAN DEFAULT TRUE,
  api_provider VARCHAR(50) DEFAULT 'NATIVE', -- 'META', 'BAILEYS', 'N8N_WEBHOOK', 'CHATWOOT'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PERCAKAPAN OMNICHANNEL (psic_conversations)
CREATE TABLE IF NOT EXISTS public.psic_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type VARCHAR(64) NOT NULL REFERENCES public.psic_channels(id) ON DELETE RESTRICT,
  external_id VARCHAR(255) NOT NULL, -- ID Unik dari Platform (e.g. IG Thread ID, FB Post ID, WA Jid)
  title TEXT,
  
  -- Metadata Penulis / Masyarakat
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_username VARCHAR(255),
  author_avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_influencer BOOLEAN DEFAULT FALSE,
  is_media BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,

  -- 6-Tier Hierarchical AI Routing Engine
  bidang VARCHAR(64) DEFAULT 'SEKRETARIAT', -- 'SEKRETARIAT','PENATAAN_RUANG','BANGUNAN_GEDUNG','BINA_MARGA','SDA','JASA_KONSTRUKSI','AMPL'
  intent VARCHAR(64) DEFAULT 'INFORMASI',
  smart_label VARCHAR(64), -- 'PBG','SLF','KRK','PKKPR','JALAN_RUSAK', dll.
  priority VARCHAR(32) DEFAULT 'NORMAL', -- 'RENDAH','NORMAL','TINGGI','KRITIS'
  
  -- AI Social Intelligence Classifications
  sentiment VARCHAR(32) DEFAULT 'NETRAL', -- 'POSITIF','NETRAL','NEGATIF','SANGAT_NEGATIF','URGENT'
  emotion VARCHAR(32) DEFAULT 'NETRAL', -- 'MARAH','SENANG','KECEWA','BINGUNG','MENDESAK','TERIMA_KASIH'
  feed_category VARCHAR(64) DEFAULT 'PERTANYAAN', -- 'PERTANYAAN','PENGADUAN','SARAN','KRITIK','APRESIASI','HOAKS','SPAM','URGENT','MEDIA','INFLUENCER','INTERNAL'
  confidence_score NUMERIC(5,2) DEFAULT 95.00,

  -- Status & SLA
  status VARCHAR(64) DEFAULT 'UNREAD', -- 'UNREAD','AI_AUTO_RESOLVED','WAITING_OPERATOR','WAITING_SUPERVISOR_APPROVAL','IN_PROGRESS','COLLABORATION_MEETING','RESOLVED','ARCHIVED'
  sla_deadline TIMESTAMPTZ,
  is_sla_breached BOOLEAN DEFAULT FALSE,

  -- Regional Geospasial Kabupaten Garut
  kecamatan VARCHAR(100),
  desa VARCHAR(100),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  address_detail TEXT,

  -- Deteksi Hoaks & Duplikasi
  is_potential_fake_news BOOLEAN DEFAULT FALSE,
  fake_news_reason TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_reference_id UUID,
  
  -- Integrasi PURI Meet (Jika Ada)
  puri_meet_room_id VARCHAR(100),

  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk Pencarian & Dasbor
CREATE INDEX IF NOT EXISTS idx_psic_conv_channel ON public.psic_conversations(channel_type);
CREATE INDEX IF NOT EXISTS idx_psic_conv_bidang ON public.psic_conversations(bidang);
CREATE INDEX IF NOT EXISTS idx_psic_conv_status ON public.psic_conversations(status);
CREATE INDEX IF NOT EXISTS idx_psic_conv_sentiment ON public.psic_conversations(sentiment);
CREATE INDEX IF NOT EXISTS idx_psic_conv_kecamatan ON public.psic_conversations(kecamatan);

-- 3. TABEL PESAN OMNICHANNEL (psic_messages)
CREATE TABLE IF NOT EXISTS public.psic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.psic_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(32) NOT NULL DEFAULT 'USER', -- 'USER','AI_BOT','OPERATOR','SYSTEM'
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  attachment_type VARCHAR(32) DEFAULT 'text', -- 'text','image','voice','video','document','link'
  attachment_url TEXT,

  -- AI Multimodal Extraction (Whisper & Vision AI)
  voice_transcription TEXT,
  vision_analysis_summary TEXT,

  -- Sentimen & Emosi Per Pesan
  sentiment VARCHAR(32),
  emotion VARCHAR(32),

  -- Info Draft Reply Operator
  is_draft BOOLEAN DEFAULT FALSE,
  draft_approved_by VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psic_msg_conv_id ON public.psic_messages(conversation_id);

-- 4. TABEL DETEKSI ISU & KRISIS (psic_issues)
CREATE TABLE IF NOT EXISTS public.psic_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  bidang VARCHAR(64) NOT NULL DEFAULT 'BINA_MARGA',
  total_mentions INTEGER DEFAULT 1,
  time_window_hours INTEGER DEFAULT 24,
  sentiment_trend VARCHAR(32) DEFAULT 'NEGATIF',
  is_crisis_alert BOOLEAN DEFAULT FALSE, -- True jika >= 200 posting dalam 30 menit
  affected_kecamatan JSONB DEFAULT '[]'::JSONB,
  status VARCHAR(64) DEFAULT 'MONITORING', -- 'MONITORING','INVESTIGATING','ESCALATED_KADIS','RESOLVED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TIKET KOLABORASI LINTAS BIDANG (psic_collaboration_tickets)
CREATE TABLE IF NOT EXISTS public.psic_collaboration_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_conversation_id UUID REFERENCES public.psic_conversations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  priority VARCHAR(32) DEFAULT 'TINGGI',
  sub_tasks JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of { id, bidang, title, status, assignedOperator }
  status VARCHAR(64) DEFAULT 'OPEN', -- 'OPEN','IN_PROGRESS','RESOLVED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL INDEKS REPUTASI DIGITAL PUPR (psic_reputation_index)
CREATE TABLE IF NOT EXISTS public.psic_reputation_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score NUMERIC(5,2) NOT NULL DEFAULT 85.00, -- 0 - 100
  positive_percentage NUMERIC(5,2) DEFAULT 75.00,
  neutral_percentage NUMERIC(5,2) DEFAULT 15.00,
  negative_percentage NUMERIC(5,2) DEFAULT 10.00,
  sla_compliance_rate NUMERIC(5,2) DEFAULT 94.50,
  total_conversations INTEGER DEFAULT 0,
  total_resolved_by_ai INTEGER DEFAULT 0,
  total_resolved_by_operator INTEGER DEFAULT 0,
  period_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AKTIFKAN REALTIME UNTUK DASHBOARD OMNICHANNEL (idempotent block)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_conversations;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_issues;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

-- 8. ROW LEVEL SECURITY (RLS) & POLICY
ALTER TABLE public.psic_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psic_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psic_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psic_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psic_collaboration_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psic_reputation_index ENABLE ROW LEVEL SECURITY;

-- Allow read & write for authenticated users (idempotent migration)
DROP POLICY IF EXISTS "Enable all access for psic_channels" ON public.psic_channels;
CREATE POLICY "Enable all access for psic_channels" ON public.psic_channels FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for psic_conversations" ON public.psic_conversations;
CREATE POLICY "Enable all access for psic_conversations" ON public.psic_conversations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for psic_messages" ON public.psic_messages;
CREATE POLICY "Enable all access for psic_messages" ON public.psic_messages FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for psic_issues" ON public.psic_issues;
CREATE POLICY "Enable all access for psic_issues" ON public.psic_issues FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for psic_collaboration_tickets" ON public.psic_collaboration_tickets;
CREATE POLICY "Enable all access for psic_collaboration_tickets" ON public.psic_collaboration_tickets FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for psic_reputation_index" ON public.psic_reputation_index;
CREATE POLICY "Enable all access for psic_reputation_index" ON public.psic_reputation_index FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 9. SEED DATA AWAL - KANAL OMNICHANNEL & SAMPLE TICKETS
-- ============================================================================

INSERT INTO public.psic_channels (id, name, category, api_provider)
VALUES 
  ('whatsapp', 'WhatsApp Bot (PURI)', 'MESSENGER', 'BAILEYS'),
  ('instagram', 'Instagram (@puprgarut)', 'SOCIAL_MEDIA', 'META'),
  ('facebook', 'Facebook (Dinas PUPR Garut)', 'SOCIAL_MEDIA', 'META'),
  ('threads', 'Threads (@puprgarut)', 'SOCIAL_MEDIA', 'META'),
  ('twitter', 'X (@pupr_garut)', 'SOCIAL_MEDIA', 'NATIVE'),
  ('tiktok', 'TikTok (@puprkabgarut)', 'SOCIAL_MEDIA', 'NATIVE'),
  ('youtube', 'YouTube (PUPR Garut TV)', 'SOCIAL_MEDIA', 'NATIVE'),
  ('telegram', 'Telegram Bot PUPR Garut', 'MESSENGER', 'NATIVE'),
  ('google_business', 'Google Review PUPR Garut', 'REVIEW', 'NATIVE'),
  ('website', 'Website Chat Dinas PUPR', 'PORTAL', 'NATIVE'),
  ('portal_pengaduan', 'Portal Pengaduan Pemkab Garut', 'PORTAL', 'NATIVE'),
  ('email', 'Email Resmi pupr@garutkab.go.id', 'PORTAL', 'IMAP')
ON CONFLICT (id) DO NOTHING;

-- Seed 1 Sampel Percakapan Instagram (Pengaduan Jalan Rusak Tarogong)
INSERT INTO public.psic_conversations (
  channel_type, external_id, title, author_id, author_name, author_username, 
  bidang, intent, smart_label, priority, sentiment, emotion, feed_category, 
  status, kecamatan, desa, address_detail, confidence_score
) VALUES (
  'instagram', 'ig_comment_99812', 'Laporan Jalan Berlubang Raya Tarogong', 
  'user_ig_01', 'Kang Asep Garut', 'asep_garut99',
  'BINA_MARGA', 'PENGADUAN', 'JALAN_RUSAK', 'TINGGI', 'NEGATIF', 'MARAH', 'PENGADUAN',
  'IN_PROGRESS', 'Tarogong Kidul', 'Sukagalih', 'Jl. Raya Tarogong depan bundaran simpang lima berlubang cukup dalam', 97.50
) ON CONFLICT DO NOTHING;

-- Seed 1 Sampel Percakapan Facebook (Pertanyaan Syarat PBG)
INSERT INTO public.psic_conversations (
  channel_type, external_id, title, author_id, author_name, author_username, 
  bidang, intent, smart_label, priority, sentiment, emotion, feed_category, 
  status, kecamatan, desa, confidence_score
) VALUES (
  'facebook', 'fb_post_88123', 'Pertanyaan Syarat Izin PBG Rumah Tinggal', 
  'user_fb_02', 'Hj. Siti Rahma', 'siti.rahma.garut',
  'BANGUNAN_GEDUNG', 'PERSYARATAN', 'PBG', 'NORMAL', 'POSITIF', 'SENANG', 'PERTANYAAN',
  'AI_AUTO_RESOLVED', 'Garut Kota', 'Regol', 99.10
) ON CONFLICT DO NOTHING;

-- Seed 1 Sampel Indeks Reputasi Digital Hari Ini
INSERT INTO public.psic_reputation_index (
  score, positive_percentage, neutral_percentage, negative_percentage,
  sla_compliance_rate, total_conversations, total_resolved_by_ai, total_resolved_by_operator, period_date
) VALUES (
  88.50, 78.00, 14.00, 8.00, 96.20, 142, 115, 27, CURRENT_DATE
) ON CONFLICT (period_date) DO UPDATE SET
  score = EXCLUDED.score,
  total_conversations = EXCLUDED.total_conversations,
  total_resolved_by_ai = EXCLUDED.total_resolved_by_ai;

-- =========================================================================
-- 9. AKTIFKAN SUPABASE REALTIME (postgres_changes publication)
-- =========================================================================
-- Mengaktifkan publikasi realtime agar event INSERT/UPDATE/DELETE
-- langsung diterima oleh aplikasi klien via WebSocket (0ms delay)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.psic_reputation_index;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Abaikan jika tabel sudah terdaftar dalam publikasi realtime
    NULL;
END $$;

