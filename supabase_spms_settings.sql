-- ============================================================================
-- SQL Script untuk Supabase: Pengaturan Survei SPMS Dinamis
-- Eksekusi di Supabase SQL Editor
-- ============================================================================

-- 1. Tabel: Pengaturan Survei (spms_survey_settings)
CREATE TABLE IF NOT EXISTS public.spms_survey_settings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Survei Kepuasan Masyarakat',
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    layanan_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    personal_data_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Jika tabel sudah ada, tambahkan kolom baru
ALTER TABLE public.spms_survey_settings 
  ADD COLUMN IF NOT EXISTS personal_data_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Tabel: Respons Survei (spms_survey_responses)
CREATE TABLE IF NOT EXISTS public.spms_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    respondent_name TEXT,
    respondent_phone TEXT,
    gender TEXT,         -- Jenis Kelamin
    education TEXT,      -- Pendidikan Terakhir
    occupation TEXT,     -- Pekerjaan
    layanan TEXT NOT NULL,
    channel TEXT DEFAULT 'WEBSITE',
    status TEXT DEFAULT 'COMPLETED',
    dimensions JSONB DEFAULT '{}'::jsonb,
    nps_score INTEGER,
    comment TEXT,
    sentimen TEXT DEFAULT 'NETRAL',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Jika tabel responses sudah ada, tambahkan kolom demografi
ALTER TABLE public.spms_survey_responses 
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT;

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.spms_survey_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spms_survey_responses ENABLE ROW LEVEL SECURITY;

-- Settings dapat dibaca publik
DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.spms_survey_settings;
CREATE POLICY "Settings viewable by everyone"
ON public.spms_survey_settings FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Allow all updates for testing" ON public.spms_survey_settings;
CREATE POLICY "Allow all updates for testing" 
ON public.spms_survey_settings FOR UPDATE USING ( true );

DROP POLICY IF EXISTS "Allow all inserts for settings" ON public.spms_survey_settings;
CREATE POLICY "Allow all inserts for settings" 
ON public.spms_survey_settings FOR INSERT WITH CHECK ( true );

-- Responses dapat diinsert publik (anonim)
DROP POLICY IF EXISTS "Anyone can submit survey" ON public.spms_survey_responses;
CREATE POLICY "Anyone can submit survey"
ON public.spms_survey_responses FOR INSERT WITH CHECK ( true );

-- Responses hanya bisa dibaca admin (authenticated)
DROP POLICY IF EXISTS "Authenticated users can read responses" ON public.spms_survey_responses;
CREATE POLICY "Authenticated users can read responses"
ON public.spms_survey_responses FOR SELECT USING ( auth.role() = 'authenticated' );

-- ============================================================================
-- 4. Data Awal (Insert Default Settings)
-- ============================================================================
INSERT INTO public.spms_survey_settings (id, title, description, questions, layanan_options, personal_data_fields)
VALUES (
  'default',
  'Survei Kepuasan Masyarakat',
  'Partisipasi Anda sangat berarti untuk meningkatkan kualitas pelayanan publik kami. Data Anda dijamin kerahasiaannya.',
  '[
    {"id": "U1", "label": "Kesesuaian Persyaratan Pelayanan", "order": 1, "isActive": true},
    {"id": "U2", "label": "Kemudahan Sistem & Prosedur", "order": 2, "isActive": true},
    {"id": "U3", "label": "Kecepatan Waktu Pelayanan", "order": 3, "isActive": true},
    {"id": "U4", "label": "Kesesuaian Biaya/Tarif", "order": 4, "isActive": true},
    {"id": "U5", "label": "Kualitas Produk Layanan", "order": 5, "isActive": true},
    {"id": "U6", "label": "Kompetensi/Kemampuan Petugas", "order": 6, "isActive": true},
    {"id": "U7", "label": "Sikap & Perilaku Petugas", "order": 7, "isActive": true},
    {"id": "U8", "label": "Kualitas Sarana & Prasarana", "order": 8, "isActive": true},
    {"id": "U9", "label": "Penanganan Pengaduan & Saran", "order": 9, "isActive": true}
  ]',
  '[
    {"value": "KRK", "label": "Keterangan Rencana Kabupaten (KRK)", "isActive": true},
    {"value": "PKKPR", "label": "Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)", "isActive": true},
    {"value": "PEIL_BANJIR", "label": "Rekomendasi Peil Banjir", "isActive": true},
    {"value": "IRIGASI", "label": "Rekomendasi Teknis Pemanfaatan Air Irigasi", "isActive": true},
    {"value": "RUMIJA", "label": "Rekomendasi Pemanfaatan Ruang Milik Jalan (RUMIJA)", "isActive": true},
    {"value": "SITEPLAN", "label": "Pengesahan Siteplan", "isActive": true},
    {"value": "PBG", "label": "Persetujuan Bangunan Gedung (PBG)", "isActive": true},
    {"value": "SLF", "label": "Sertifikat Laik Fungsi (SLF)", "isActive": true},
    {"value": "PENGADUAN", "label": "Layanan Pengaduan Masyarakat", "isActive": true},
    {"value": "INFORMASI_PUBLIK", "label": "Layanan Informasi Publik", "isActive": true}
  ]',
  '[
    {"id": "respondentName", "label": "Nama Lengkap", "isActive": true, "isRequired": false, "fieldType": "text"},
    {"id": "respondentPhone", "label": "Nomor WhatsApp", "isActive": true, "isRequired": false, "fieldType": "tel"},
    {"id": "gender", "label": "Jenis Kelamin", "isActive": true, "isRequired": false, "fieldType": "select", "options": ["Laki-laki", "Perempuan"]},
    {"id": "education", "label": "Pendidikan Terakhir", "isActive": true, "isRequired": false, "fieldType": "select", "options": ["SD/Sederajat", "SMP/Sederajat", "SMA/SMK/Sederajat", "D1/D2/D3", "S1/D4", "S2", "S3"]},
    {"id": "occupation", "label": "Pekerjaan", "isActive": true, "isRequired": false, "fieldType": "select", "options": ["PNS/TNI/Polri", "Pegawai Swasta", "Wiraswasta/Pengusaha", "Pelajar/Mahasiswa", "Petani/Nelayan", "Ibu Rumah Tangga", "Pensiunan", "Lainnya"]}
  ]'
) ON CONFLICT (id) DO UPDATE SET
  personal_data_fields = EXCLUDED.personal_data_fields,
  updated_at = now();
