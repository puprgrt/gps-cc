-- ==============================================================================
-- PURI MEET - ADDITIONAL FEATURES DATABASE SETUP (SUPABASE SQL)
-- Jalankan script ini di menu "SQL Editor" pada Supabase Dashboard Anda.
-- ==============================================================================

-- 1. MEETING CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.meeting_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL, -- Di-design agar independen, bisa di-link ke FK meetings jika tabel meetings ada
  sender_name TEXT NOT NULL,
  sender_role TEXT DEFAULT 'PARTICIPANT',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Chat
ALTER TABLE public.meeting_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Enable read access for all users" ON public.meeting_chat_messages
  FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Enable insert for all users" ON public.meeting_chat_messages
  FOR INSERT WITH CHECK (true);


-- 2. MEETING FILES
CREATE TABLE IF NOT EXISTS public.meeting_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Files
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Enable read access for all users" ON public.meeting_files
  FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Enable insert for all users" ON public.meeting_files
  FOR INSERT WITH CHECK (true);

-- Allow delete access
CREATE POLICY "Enable delete for all users" ON public.meeting_files
  FOR DELETE USING (true);


-- 3. STORAGE BUCKET
-- Pastikan ekstensi storage diaktifkan
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-files', 'meeting-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies untuk meeting-files
CREATE POLICY "Enable read access for all users" ON storage.objects
  FOR SELECT USING (bucket_id = 'meeting-files');

CREATE POLICY "Enable insert for all users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meeting-files');

CREATE POLICY "Enable update for all users" ON storage.objects
  FOR UPDATE USING (bucket_id = 'meeting-files');

CREATE POLICY "Enable delete for all users" ON storage.objects
  FOR DELETE USING (bucket_id = 'meeting-files');
