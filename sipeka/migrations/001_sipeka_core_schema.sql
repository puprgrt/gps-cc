-- ============================================================================
-- SIPEKA CORE DATABASE SCHEMA (POSTGRESQL 14+)
-- Sistem Penilaian Kerusakan Bangunan Gedung (SIPEKA)
-- Bidang Bangunan Gedung - Dinas PUPR Kabupaten Garut
-- Architecture: SPBE, IDDS, Permen PUPR No. 24/PRT/M/2008 & PermenPAN-RB No. 14/2017
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerated Types (ENUMs)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'PENGELOLA_BG', 
            'KABID_BG', 
            'SUBKOORDINATOR', 
            'TIM_TEKNIS', 
            'KADIS_PUPR', 
            'ADMIN_SISTEM'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_permohonan') THEN
        CREATE TYPE status_permohonan AS ENUM (
            'DRAFT', 
            'SUBMITTED', 
            'DISPOSISI_SUBKOORD', 
            'DISPOSISI_TIM_TEKNIS', 
            'VERIFIKASI_BERKAS', 
            'MENUNGGU_SURVEY', 
            'SURVEY_LAPANGAN', 
            'ANALISIS_TEKNIS', 
            'VALIDASI_SUBKOORD', 
            'APPROVAL_KABID', 
            'GENERATED_SURAT_HASIL', 
            'APPROVAL_KADIS', 
            'MENUNGGU_SKM', 
            'SELESAI'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'klasifikasi_kerusakan') THEN
        CREATE TYPE klasifikasi_kerusakan AS ENUM (
            'TIDAK_RUSAK', 
            'RUSAK_RINGAN', 
            'RUSAK_SEDANG', 
            'RUSAK_BERAT'
        );
    END IF;
END $$;

-- 3. Tabel Master Instansi (Sekolah / OPD Pemohon)
CREATE TABLE IF NOT EXISTS public.instansi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn_kategori VARCHAR(50) NOT NULL UNIQUE,
    nama_instansi VARCHAR(255) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    gdrive_root_folder_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pengguna (Users SIPEKA / SSO ASN Pemkab Garut)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    nip VARCHAR(30) UNIQUE,
    role user_role NOT NULL,
    instansi_id UUID REFERENCES public.instansi(id) ON DELETE SET NULL,
    google_oauth_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Master Bangunan Gedung (NUP / BMD & History Identifier)
CREATE TABLE IF NOT EXISTS public.bangunan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instansi_id UUID NOT NULL REFERENCES public.instansi(id) ON DELETE CASCADE,
    nup_bmd VARCHAR(100) NOT NULL,
    nama_bangunan VARCHAR(255) NOT NULL,
    jumlah_lantai INT NOT NULL CHECK (jumlah_lantai >= 1),
    luas_bangunan_m2 NUMERIC(10, 2) NOT NULL CHECK (luas_bangunan_m2 > 0),
    tahun_dibangun INT CHECK (tahun_dibangun > 1900),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    gdrive_folder_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Permohonan Penilaian Kerusakan (10-Stage Workflow)
CREATE TABLE IF NOT EXISTS public.permohonan_penilaian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_permohonan VARCHAR(100) NOT NULL UNIQUE,
    pengelola_id UUID NOT NULL REFERENCES public.users(id),
    bangunan_id UUID NOT NULL REFERENCES public.bangunan(id),
    status status_permohonan NOT NULL DEFAULT 'DRAFT',
    alt_form VARCHAR(10) NOT NULL CHECK (alt_form IN ('ALT_A', 'ALT_B', 'ALT_C')),
    butuh_survey BOOLEAN DEFAULT FALSE,
    tanggal_survey_dijadwalkan DATE,
    surat_permohonan_gdrive_id VARCHAR(255),
    surat_hasil_gdrive_id VARCHAR(255),
    tte_subkoord_status BOOLEAN DEFAULT FALSE,
    tte_kabid_status BOOLEAN DEFAULT FALSE,
    tte_kadis_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Disposisi Log (Rekam Jejak Instruksi Berjenjang)
CREATE TABLE IF NOT EXISTS public.disposisi_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permohonan_id UUID NOT NULL REFERENCES public.permohonan_penilaian(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.users(id),
    to_user_id UUID NOT NULL REFERENCES public.users(id),
    catatan_disposisi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel History Penilaian (Engine Kalkulasi 2-Tahap PUPR & TTE Hashes)
CREATE TABLE IF NOT EXISTS public.history_penilaian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permohonan_id UUID NOT NULL UNIQUE REFERENCES public.permohonan_penilaian(id) ON DELETE CASCADE,
    bangunan_id UUID NOT NULL REFERENCES public.bangunan(id),
    penilaian_ke INT NOT NULL CHECK (penilaian_ke >= 1),
    tanggal_penilaian DATE NOT NULL DEFAULT CURRENT_DATE,
    is_keselamatan_terancam BOOLEAN DEFAULT FALSE,
    persentase_total_kerusakan NUMERIC(5, 2) NOT NULL CHECK (persentase_total_kerusakan BETWEEN 0.00 AND 100.00),
    persentase_struktur NUMERIC(5, 2) NOT NULL CHECK (persentase_struktur BETWEEN 0.00 AND 100.00),
    persentase_arsitektur NUMERIC(5, 2) NOT NULL CHECK (persentase_arsitektur BETWEEN 0.00 AND 100.00),
    persentase_utilitas NUMERIC(5, 2) NOT NULL CHECK (persentase_utilitas BETWEEN 0.00 AND 100.00),
    kesimpulan_klasifikasi klasifikasi_kerusakan NOT NULL,
    rekomendasi_teknis TEXT NOT NULL,
    tim_teknis_id UUID NOT NULL REFERENCES public.users(id),
    tte_subkoor_hash TEXT,
    tte_kabid_hash TEXT,
    tte_kadis_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Detail Penilaian Komponen (Kuantitatif Volume & Bobot PUPR)
CREATE TABLE IF NOT EXISTS public.detail_penilaian_komponen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_penilaian_id UUID NOT NULL REFERENCES public.history_penilaian(id) ON DELETE CASCADE,
    nama_komponen VARCHAR(100) NOT NULL,
    kategori_elemen VARCHAR(50) NOT NULL CHECK (kategori_elemen IN ('STRUKTUR', 'ARSITEKTUR', 'UTILITAS')),
    bobot_komponen_persen NUMERIC(5, 2) NOT NULL CHECK (bobot_komponen_persen >= 0.00 AND bobot_komponen_persen <= 100.00),
    tingkat_kerusakan_val NUMERIC(3, 2) NOT NULL CHECK (tingkat_kerusakan_val BETWEEN 0.00 AND 1.00),
    hasil_kerusakan_komponen NUMERIC(5, 2) NOT NULL CHECK (hasil_kerusakan_komponen BETWEEN 0.00 AND 100.00),
    foto_bukti_gdrive_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel SKM Respon (Survei Kepuasan Masyarakat PermenPAN-RB No. 14/2017)
CREATE TABLE IF NOT EXISTS public.skm_respon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permohonan_id UUID NOT NULL UNIQUE REFERENCES public.permohonan_penilaian(id) ON DELETE CASCADE,
    pengelola_id UUID NOT NULL REFERENCES public.users(id),
    u1_persyaratan INT NOT NULL CHECK (u1_persyaratan BETWEEN 1 AND 4),
    u2_prosedur INT NOT NULL CHECK (u2_prosedur BETWEEN 1 AND 4),
    u3_waktu_pelayanan INT NOT NULL CHECK (u3_waktu_pelayanan BETWEEN 1 AND 4),
    u4_biaya_tarif INT NOT NULL CHECK (u4_biaya_tarif BETWEEN 1 AND 4),
    u5_produk_spesifikasi INT NOT NULL CHECK (u5_produk_spesifikasi BETWEEN 1 AND 4),
    u6_kompetensi_pelaksana INT NOT NULL CHECK (u6_kompetensi_pelaksana BETWEEN 1 AND 4),
    u7_perilaku_pelaksana INT NOT NULL CHECK (u7_perilaku_pelaksana BETWEEN 1 AND 4),
    u8_maklumat_pelayanan INT NOT NULL CHECK (u8_maklumat_pelayanan BETWEEN 1 AND 4),
    u9_penanganan_pengaduan INT NOT NULL CHECK (u9_penanganan_pengaduan BETWEEN 1 AND 4),
    rerata_skor NUMERIC(3, 2) NOT NULL CHECK (rerata_skor BETWEEN 1.00 AND 4.00),
    ikm_konversi NUMERIC(5, 2) NOT NULL CHECK (ikm_konversi BETWEEN 25.00 AND 100.00),
    mutu_pelayanan VARCHAR(10) NOT NULL CHECK (mutu_pelayanan IN ('A', 'B', 'C', 'D')),
    saran_masukan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. INDEKS PERFORMA & INTEGRITAS RELASIONAL
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bangunan_instansi_id ON public.bangunan(instansi_id);
CREATE INDEX IF NOT EXISTS idx_users_instansi_id ON public.users(instansi_id);
CREATE INDEX IF NOT EXISTS idx_permohonan_bangunan_id ON public.permohonan_penilaian(bangunan_id);
CREATE INDEX IF NOT EXISTS idx_permohonan_pengelola_id ON public.permohonan_penilaian(pengelola_id);
CREATE INDEX IF NOT EXISTS idx_permohonan_status ON public.permohonan_penilaian(status);
CREATE INDEX IF NOT EXISTS idx_disposisi_permohonan_id ON public.disposisi_log(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_history_bangunan_id ON public.history_penilaian(bangunan_id);
CREATE INDEX IF NOT EXISTS idx_history_permohonan_id ON public.history_penilaian(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_detail_history_id ON public.detail_penilaian_komponen(history_penilaian_id);
CREATE INDEX IF NOT EXISTS idx_skm_permohonan_id ON public.skm_respon(permohonan_id);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.instansi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bangunan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permohonan_penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposisi_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_penilaian_komponen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skm_respon ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated & service role
DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.instansi;
CREATE POLICY "Allow select for all authenticated" ON public.instansi FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.bangunan;
CREATE POLICY "Allow select for all authenticated" ON public.bangunan FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.permohonan_penilaian;
CREATE POLICY "Allow select for all authenticated" ON public.permohonan_penilaian FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.history_penilaian;
CREATE POLICY "Allow select for all authenticated" ON public.history_penilaian FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.detail_penilaian_komponen;
CREATE POLICY "Allow select for all authenticated" ON public.detail_penilaian_komponen FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.disposisi_log;
CREATE POLICY "Allow select for all authenticated" ON public.disposisi_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.skm_respon;
CREATE POLICY "Allow select for all authenticated" ON public.skm_respon FOR SELECT USING (true);

-- Insert & Update policies for authenticated / system
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.permohonan_penilaian;
CREATE POLICY "Allow insert for authenticated" ON public.permohonan_penilaian FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.disposisi_log;
CREATE POLICY "Allow insert for authenticated" ON public.disposisi_log FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.history_penilaian;
CREATE POLICY "Allow insert for authenticated" ON public.history_penilaian FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.detail_penilaian_komponen;
CREATE POLICY "Allow insert for authenticated" ON public.detail_penilaian_komponen FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.skm_respon;
CREATE POLICY "Allow insert for authenticated" ON public.skm_respon FOR ALL USING (true);

-- ============================================================================
-- 13. SEED INITIAL DATA (PEJABAT DINAS PUPR & CONTOH INSTANSI)
-- ============================================================================
INSERT INTO public.instansi (id, npsn_kategori, nama_instansi, alamat_lengkap, kecamatan, gdrive_root_folder_id)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'NPSN-20224001', 'SD Negeri 1 Tarogong Kidul', 'Jl. Suherman No. 12, Tarogong Kidul', 'Tarogong Kidul', 'gdrive_folder_sdn1_tk'),
    ('22222222-2222-2222-2222-222222222222', 'NPSN-20224055', 'SMP Negeri 2 Garut', 'Jl. Ahmad Yani No. 45, Garut Kota', 'Garut Kota', 'gdrive_folder_smpn2_grt'),
    ('33333333-3333-3333-3333-333333333333', 'OPD-PUPR-001', 'Dinas Pekerjaan Umum dan Penataan Ruang', 'Jl. Samarang No. 115, Tarogong Kidul', 'Tarogong Kidul', 'gdrive_folder_pupr_garut')
ON CONFLICT (npsn_kategori) DO NOTHING;

INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, nip, role, instansi_id)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pengelola_sdn1', 'pengelola.sdn1@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Budi Santoso, S.Pd', '198503122010011002', 'PENGELOLA_BG', '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'kabid_bg', 'kabid.bg@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Ir. H. Deden Ramdani, M.T.', '197405101999031004', 'KABID_BG', '33333333-3333-3333-3333-333333333333'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'subkoord_bg', 'subkoord.bg@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Agus Hendra, S.T., M.Si.', '198108152006041008', 'SUBKOORDINATOR', '33333333-3333-3333-3333-333333333333'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'tim_teknis1', 'teknis.bg@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Rian Fauzi, S.T.', '199204222019031005', 'TIM_TEKNIS', '33333333-3333-3333-3333-333333333333'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'kadis_pupr', 'kadis.pupr@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Drs. H. Agus Ismail, S.T., M.T.', '196802111994021001', 'KADIS_PUPR', '33333333-3333-3333-3333-333333333333'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'admin_sipeka', 'admin.sipeka@garutkab.go.id', 'argon2_or_bcrypt_hash_placeholder', 'Super Administrator SIPEKA', NULL, 'ADMIN_SISTEM', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (email) DO NOTHING;

