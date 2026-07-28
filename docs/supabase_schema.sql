-- Supabase PostgreSQL Schema untuk GPS-CC WhatsApp Command Center
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Buku Kontak
CREATE TABLE IF NOT EXISTS wa_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(50) UNIQUE NOT NULL, -- Format: 6281234567890
  name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Percakapan (Sesi Obrolan)
CREATE TABLE IF NOT EXISTS wa_conversations (
  id VARCHAR(100) PRIMARY KEY, -- Format: 6281234567890@s.whatsapp.net
  contact_id UUID REFERENCES wa_contacts(id) ON DELETE SET NULL,
  last_message TEXT,
  unread_count INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending', -- pending, active, bot_handling, resolved
  category VARCHAR(50) DEFAULT 'UMUM',
  bidang VARCHAR(100) DEFAULT 'Sekretariat', -- 7 Bidang Resmi PUPR Garut
  prioritas VARCHAR(30) DEFAULT 'NORMAL', -- NORMAL, TINGGI, KRITIS
  layanan VARCHAR(150) DEFAULT 'Informasi Umum',
  smart_labels TEXT[] DEFAULT '{}',
  assigned_operator VARCHAR(100), -- ID/Kode Operator bidang
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pesan (Riwayat Chat)
CREATE TABLE IF NOT EXISTS wa_messages (
  id VARCHAR(100) PRIMARY KEY, -- ID unik pesan dari Baileys (contoh: BAEG...)
  conversation_id VARCHAR(100) REFERENCES wa_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- user, bot, operator
  text TEXT,
  media_url TEXT,
  media_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Template (Balasan Cepat)
CREATE TABLE IF NOT EXISTS wa_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortcut VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'UMUM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Broadcast (Pesan Massal)
CREATE TABLE IF NOT EXISTS wa_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  target_tags TEXT[] DEFAULT '{}',
  message_text TEXT NOT NULL,
  media_url TEXT,
  status VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, RUNNING, COMPLETED, FAILED
  scheduled_at TIMESTAMP WITH TIME ZONE,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bot Flows (Menu Interaktif Auto-Responder)
CREATE TABLE IF NOT EXISTS wa_bot_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_keyword VARCHAR(100) NOT NULL,
  match_type VARCHAR(30) DEFAULT 'EXACT', -- EXACT, CONTAINS, REGEX
  response_type VARCHAR(30) DEFAULT 'TEXT', -- TEXT, BUTTONS, LIST
  response_content TEXT NOT NULL,
  priority_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bot AI Settings
CREATE TABLE IF NOT EXISTS wa_bot_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  is_active BOOLEAN DEFAULT TRUE,
  is_menu_active BOOLEAN DEFAULT TRUE,
  is_keyword_active BOOLEAN DEFAULT TRUE,
  model VARCHAR(50) DEFAULT 'gemini-3.6-flash',
  system_prompt TEXT,
  min_text_length INT DEFAULT 2,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Menu Interaktif & Sub-Menu Flow
CREATE TABLE IF NOT EXISTS wa_bot_menu_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES wa_bot_menu_flows(id) ON DELETE CASCADE,
  menu_key VARCHAR(50) UNIQUE NOT NULL, -- Contoh: 'menu', '1', '1.1', '2', '3'
  title VARCHAR(100) NOT NULL,
  description TEXT,
  reply_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Keyword Reply Rules (Auto-Response Kata Kunci)
CREATE TABLE IF NOT EXISTS wa_bot_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(100) UNIQUE NOT NULL,
  match_type VARCHAR(30) DEFAULT 'CONTAINS', -- CONTAINS, EXACT, STARTS_WITH
  reply_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime Configuration
-- Mengaktifkan pengiriman event realtime untuk tabel-tabel penting ke Frontend (Vercel) (idempotent block)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_conversations;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_bot_settings;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_bot_menu_flows;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_bot_keywords;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;
