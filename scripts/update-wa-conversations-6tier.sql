-- ============================================================================
-- MIGRATION SQL: PURI 6-Tier Smart Routing untuk WhatsApp Center GPS-CC 2026
-- Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
-- ============================================================================
-- Skrip ini bersifat idempotent (aman dijalankan berulang tanpa eror)
-- Gunakan skrip ini di Supabase SQL Editor untuk memperbarui skema tabel wa_conversations

-- 1. Tambahkan kolom-kolom baru untuk menampung metadata PURI 6-Tier Routing
ALTER TABLE IF EXISTS public.wa_conversations 
  ADD COLUMN IF NOT EXISTS bidang VARCHAR(100) DEFAULT 'Sekretariat',
  ADD COLUMN IF NOT EXISTS prioritas VARCHAR(30) DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS layanan VARCHAR(150) DEFAULT 'Informasi Umum',
  ADD COLUMN IF NOT EXISTS smart_labels TEXT[] DEFAULT '{}';

-- 2. Ubah tipe data assigned_operator menjadi VARCHAR/TEXT agar mendukung ID string seperti 'OP-SEKRETARIAT-01'
-- (Jika sebelumnya UUID, kita ubah ke VARCHAR agar kompatibel dengan sistem operator online PUPR)
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'wa_conversations' 
      AND column_name = 'assigned_operator' 
      AND data_type = 'uuid'
  ) THEN 
    ALTER TABLE public.wa_conversations ALTER COLUMN assigned_operator TYPE VARCHAR(100) USING assigned_operator::VARCHAR;
  END IF;
END $$;

-- 3. Buat indeks (Index) untuk mempercepat query filtering di Dashboard WhatsApp
CREATE INDEX IF NOT EXISTS idx_wa_conv_bidang ON public.wa_conversations(bidang);
CREATE INDEX IF NOT EXISTS idx_wa_conv_prioritas ON public.wa_conversations(prioritas);
CREATE INDEX IF NOT EXISTS idx_wa_conv_status ON public.wa_conversations(status);
CREATE INDEX IF NOT EXISTS idx_wa_conv_updated_at ON public.wa_conversations(updated_at DESC);

-- 4. Aktifkan Realtime Publication untuk tabel wa_conversations & wa_messages (jika belum)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'wa_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_conversations;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'wa_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication notice: %', SQLERRM;
END $$;
