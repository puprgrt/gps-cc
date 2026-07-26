-- ============================================================================
-- SPMS (Smart Public Service Performance Management System)
-- Supabase Schema & Sample Data
-- Dinas PUPR Kabupaten Garut
-- ============================================================================

-- ============================================================================
-- 1. SPMS METRICS (KPI Harian/Bulanan/Tahunan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL DEFAULT 'MONTH', -- TODAY, WEEK, MONTH, QUARTER, YEAR
  period_label TEXT NOT NULL,           -- "Juli 2026", "Q3 2026", dsb
  ikm NUMERIC(5,2) DEFAULT 0,
  ikm_label TEXT DEFAULT 'Baik',
  sla_compliance NUMERIC(5,2) DEFAULT 0,
  sla_on_time INTEGER DEFAULT 0,
  sla_almost_late INTEGER DEFAULT 0,
  sla_late INTEGER DEFAULT 0,
  sla_avg_days NUMERIC(5,2) DEFAULT 0,
  first_response_time NUMERIC(8,2) DEFAULT 0,  -- menit
  resolution_time NUMERIC(8,2) DEFAULT 0,       -- jam
  ai_response_rate NUMERIC(5,2) DEFAULT 0,
  human_intervention_rate NUMERIC(5,2) DEFAULT 0,
  knowledge_accuracy NUMERIC(5,2) DEFAULT 0,
  sentiment_positif INTEGER DEFAULT 0,
  sentiment_netral INTEGER DEFAULT 0,
  sentiment_negatif INTEGER DEFAULT 0,
  nps INTEGER DEFAULT 0,
  nps_promoters INTEGER DEFAULT 0,
  nps_passives INTEGER DEFAULT 0,
  nps_detractors INTEGER DEFAULT 0,
  complaint_resolution_rate NUMERIC(5,2) DEFAULT 0,
  total_complaints INTEGER DEFAULT 0,
  resolved_complaints INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. BIDANG PERFORMANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_bidang_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang TEXT NOT NULL,
  bidang_label TEXT NOT NULL,
  jumlah_layanan INTEGER DEFAULT 0,
  jumlah_pengaduan INTEGER DEFAULT 0,
  sla_compliance NUMERIC(5,2) DEFAULT 0,
  nilai_kepuasan NUMERIC(5,2) DEFAULT 0,
  avg_response_time NUMERIC(8,2) DEFAULT 0,
  avg_resolution_time NUMERIC(8,2) DEFAULT 0,
  total_permohonan INTEGER DEFAULT 0,
  total_selesai INTEGER DEFAULT 0,
  trend_bulanan JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. OPERATOR PERFORMANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_operator_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bidang TEXT NOT NULL,
  bidang_label TEXT NOT NULL,
  avatar_url TEXT,
  jumlah_tiket INTEGER DEFAULT 0,
  jumlah_selesai INTEGER DEFAULT 0,
  avg_response_time NUMERIC(8,2) DEFAULT 0,
  avg_resolution_time NUMERIC(8,2) DEFAULT 0,
  tingkat_kepuasan NUMERIC(5,2) DEFAULT 0,
  jumlah_koreksi_ai INTEGER DEFAULT 0,
  tingkat_pemanfaatan_ai NUMERIC(5,2) DEFAULT 0,
  kepatuhan_sop NUMERIC(5,2) DEFAULT 0,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. AI PERFORMANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_ai_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_accuracy NUMERIC(5,2) DEFAULT 0,
  answer_accuracy NUMERIC(5,2) DEFAULT 0,
  routing_success_rate NUMERIC(5,2) DEFAULT 0,
  average_confidence NUMERIC(5,2) DEFAULT 0,
  auto_answer_rate NUMERIC(5,2) DEFAULT 0,
  escalation_count INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC(10,2) DEFAULT 0,
  kb_utilization NUMERIC(5,2) DEFAULT 0,
  user_satisfaction NUMERIC(5,2) DEFAULT 0,
  asqi_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SURVEY RESPONSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_name TEXT,
  respondent_phone TEXT,
  layanan TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  dimensions JSONB DEFAULT '{}',
  nps_score INTEGER,
  comment TEXT,
  sentimen TEXT,
  ticket_id TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. EARLY WARNINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_early_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'WARNING',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT NOT NULL,
  current_value NUMERIC(10,2) DEFAULT 0,
  threshold NUMERIC(10,2) DEFAULT 0,
  affected_bidang TEXT,
  affected_layanan TEXT,
  affected_operator_id TEXT,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. AI RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  impact TEXT,
  related_bidang JSONB DEFAULT '[]',
  related_layanan JSONB DEFAULT '[]',
  is_implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. HEATMAP DATA (per Kecamatan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_heatmap_kecamatan (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  total_pengaduan INTEGER DEFAULT 0,
  total_permohonan INTEGER DEFAULT 0,
  tingkat_kepuasan NUMERIC(5,2) DEFAULT 0,
  sebaran_layanan JSONB DEFAULT '{}',
  prioritas_tindak_lanjut TEXT DEFAULT 'LOW',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TREND DATA (Bulanan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_trend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  ikm NUMERIC(5,2) DEFAULT 0,
  sla NUMERIC(5,2) DEFAULT 0,
  nps INTEGER DEFAULT 0,
  sentiment NUMERIC(5,2) DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  permohonan INTEGER DEFAULT 0,
  selesai INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. AI INSIGHTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS spms_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'TREND',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Metrics (Current Month)
INSERT INTO spms_metrics (period, period_label, ikm, ikm_label, sla_compliance, sla_on_time, sla_almost_late, sla_late, sla_avg_days, first_response_time, resolution_time, ai_response_rate, human_intervention_rate, knowledge_accuracy, sentiment_positif, sentiment_netral, sentiment_negatif, nps, nps_promoters, nps_passives, nps_detractors, complaint_resolution_rate, total_complaints, resolved_complaints) VALUES
('MONTH', 'Juli 2026', 88.50, 'Baik', 94.20, 4521, 312, 187, 4.2, 3.5, 18.4, 96.30, 3.70, 94.80, 612, 207, 81, 62, 548, 220, 132, 87.50, 342, 299);

-- Bidang Performance
INSERT INTO spms_bidang_performance (bidang, bidang_label, jumlah_layanan, jumlah_pengaduan, sla_compliance, nilai_kepuasan, avg_response_time, avg_resolution_time, total_permohonan, total_selesai, trend_bulanan) VALUES
('SEKRETARIAT', 'Sekretariat', 2, 45, 96.5, 90.2, 2.1, 12.5, 892, 845, '[680,720,750,780,810,840,855,870,880,885,890,892]'),
('BINA_MARGA', 'Bina Marga', 1, 120, 89.3, 82.4, 5.2, 28.6, 1456, 1250, '[1100,1150,1200,1220,1260,1300,1320,1350,1380,1400,1430,1456]'),
('SDA', 'Sumber Daya Air', 2, 85, 92.1, 85.6, 3.8, 22.4, 1120, 980, '[880,900,930,950,980,1000,1020,1040,1060,1080,1100,1120]'),
('BANGUNAN_GEDUNG', 'Bangunan Gedung', 2, 42, 88.7, 84.2, 6.4, 32.8, 2850, 2400, '[2100,2200,2300,2380,2450,2520,2580,2640,2700,2760,2810,2850]'),
('PENATAAN_RUANG', 'Penataan Ruang', 3, 28, 95.4, 91.8, 2.8, 16.2, 1680, 1580, '[1300,1350,1400,1430,1460,1500,1530,1560,1590,1620,1650,1680]'),
('JASA_KONSTRUKSI', 'Jasa Konstruksi', 0, 15, 93.8, 88.5, 3.2, 19.6, 450, 410, '[320,340,350,360,370,380,390,400,410,420,430,450]'),
('AMPL', 'Air Minum & Penyehatan Lingkungan', 0, 35, 91.2, 86.3, 4.1, 24.1, 780, 690, '[600,620,640,660,680,700,710,720,740,750,760,780]');

-- Operator Performance (12 operators)
INSERT INTO spms_operator_performance (name, bidang, bidang_label, jumlah_tiket, jumlah_selesai, avg_response_time, avg_resolution_time, tingkat_kepuasan, jumlah_koreksi_ai, tingkat_pemanfaatan_ai, kepatuhan_sop, rank) VALUES
('Asep Supriatna', 'PENATAAN_RUANG', 'Penataan Ruang', 245, 232, 2.1, 14.2, 94.5, 3, 92.0, 98.5, 1),
('Rina Agustina', 'BANGUNAN_GEDUNG', 'Bangunan Gedung', 312, 290, 2.8, 18.6, 92.3, 5, 88.5, 97.2, 2),
('Dedi Kurniawan', 'BINA_MARGA', 'Bina Marga', 198, 180, 3.5, 22.4, 91.8, 4, 85.0, 96.8, 3),
('Siti Nurhaliza', 'SEKRETARIAT', 'Sekretariat', 178, 170, 1.8, 10.5, 95.2, 2, 94.5, 99.1, 4),
('Ahmad Fauzi', 'SDA', 'Sumber Daya Air', 210, 195, 3.2, 20.1, 89.6, 6, 82.0, 95.4, 5),
('Evi Susilawati', 'PENATAAN_RUANG', 'Penataan Ruang', 189, 175, 2.5, 15.8, 93.1, 3, 90.0, 97.8, 6),
('Budi Santoso', 'BANGUNAN_GEDUNG', 'Bangunan Gedung', 278, 250, 3.8, 24.2, 87.4, 8, 78.5, 94.2, 7),
('Neni Rohaeni', 'AMPL', 'AMPL', 145, 132, 4.2, 26.8, 86.8, 7, 76.0, 93.5, 8),
('Usman Hidayat', 'JASA_KONSTRUKSI', 'Jasa Konstruksi', 120, 108, 3.6, 21.5, 88.2, 5, 80.0, 95.0, 9),
('Lina Marlina', 'SDA', 'Sumber Daya Air', 165, 148, 4.0, 23.6, 85.5, 9, 74.5, 92.8, 10),
('Hendra Gunawan', 'BINA_MARGA', 'Bina Marga', 230, 200, 4.5, 28.2, 83.2, 10, 72.0, 91.5, 11),
('Yanti Permatasari', 'SEKRETARIAT', 'Sekretariat', 156, 148, 2.0, 11.2, 93.8, 3, 91.0, 98.0, 12);

-- AI Performance
INSERT INTO spms_ai_performance (classification_accuracy, answer_accuracy, routing_success_rate, average_confidence, auto_answer_rate, escalation_count, total_requests, avg_response_time_ms, kb_utilization, user_satisfaction, asqi_score) VALUES
(94.20, 91.50, 96.80, 89.30, 78.50, 342, 5620, 850, 82.40, 88.60, 87.90);

-- Survey Responses (sample 20 entries)
INSERT INTO spms_survey_responses (respondent_name, respondent_phone, layanan, channel, status, dimensions, nps_score, comment, sentimen) VALUES
('Pak Haji Ujang', '628123456001', 'PBG', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":5,"kemudahan_prosedur":4,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":5}', 9, 'Pelayanan sangat baik dan cepat', 'POSITIF'),
('Bu Eneng', '628123456002', 'KRK', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":4,"kemudahan_prosedur":5,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":4,"keramahan_petugas":5,"kompetensi_petugas":4,"kejelasan_ai":5,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 10, 'Sangat puas, AI-nya pintar', 'POSITIF'),
('Kang Dadan', '628123456003', 'PKKPR', 'WEBSITE', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":3,"kecepatan_pelayanan":3,"ketepatan_penyelesaian":4,"keramahan_petugas":4,"kompetensi_petugas":4,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":4}', 7, 'Cukup baik namun prosedur bisa lebih sederhana', 'NETRAL'),
('Teh Lia', '628123456004', 'SLF', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":3,"kejelasan_persyaratan":3,"kemudahan_prosedur":2,"kecepatan_pelayanan":2,"ketepatan_penyelesaian":3,"keramahan_petugas":4,"kompetensi_petugas":3,"kejelasan_ai":3,"kemudahan_sistem":3,"kepuasan_keseluruhan":3}', 5, 'Agak lambat prosesnya', 'NEGATIF'),
('Pak Eman', '628123456005', 'PENGADUAN', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":5,"kemudahan_prosedur":5,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":4,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":5,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 10, 'Pengaduan ditangani cepat!', 'POSITIF'),
('Bu Yayah', '628123456006', 'PBG', 'QR_CODE', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":3,"ketepatan_penyelesaian":4,"keramahan_petugas":5,"kompetensi_petugas":4,"kejelasan_ai":3,"kemudahan_sistem":4,"kepuasan_keseluruhan":4}', 8, 'Petugas ramah', 'POSITIF'),
('Kang Asep', '628123456007', 'RUMIJA', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":5,"keramahan_petugas":4,"kompetensi_petugas":5,"kejelasan_ai":4,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 9, 'Prosesnya cepat dan mudah', 'POSITIF'),
('Teh Cucu', '628123456008', 'IRIGASI', 'EMAIL', 'COMPLETED', '{"kemudahan_informasi":3,"kejelasan_persyaratan":3,"kemudahan_prosedur":3,"kecepatan_pelayanan":3,"ketepatan_penyelesaian":3,"keramahan_petugas":4,"kompetensi_petugas":3,"kejelasan_ai":3,"kemudahan_sistem":3,"kepuasan_keseluruhan":3}', 6, 'Biasa saja', 'NETRAL'),
('Pak Cecep', '628123456009', 'SITEPLAN', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":5,"kemudahan_prosedur":4,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":5}', 9, 'Sangat profesional', 'POSITIF'),
('Bu Titi', '628123456010', 'INFORMASI_PUBLIK', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":5,"kemudahan_prosedur":5,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":5,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 10, 'AI sangat membantu 24 jam', 'POSITIF'),
('Kang Jajang', '628123456011', 'PBG', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":2,"kejelasan_persyaratan":2,"kemudahan_prosedur":2,"kecepatan_pelayanan":1,"ketepatan_penyelesaian":2,"keramahan_petugas":3,"kompetensi_petugas":2,"kejelasan_ai":2,"kemudahan_sistem":2,"kepuasan_keseluruhan":2}', 3, 'Sangat lambat, sudah 3 minggu belum selesai', 'NEGATIF'),
('Teh Wiwi', '628123456012', 'KRK', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":5,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":4,"keramahan_petugas":5,"kompetensi_petugas":4,"kejelasan_ai":4,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 9, 'Bagus sekali', 'POSITIF'),
('Pak Ade', '628123456013', 'PEIL_BANJIR', 'WEBSITE', 'COMPLETED', '{"kemudahan_informasi":3,"kejelasan_persyaratan":4,"kemudahan_prosedur":3,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":4,"keramahan_petugas":4,"kompetensi_petugas":4,"kejelasan_ai":3,"kemudahan_sistem":3,"kepuasan_keseluruhan":4}', 7, 'Pelayanan bagus, website kurang intuitif', 'NETRAL'),
('Bu Euis', '628123456014', 'PENGADUAN', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":5}', 9, 'Tanggap banget!', 'POSITIF'),
('Kang Omon', '628123456015', 'SLF', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":3,"kemudahan_prosedur":4,"kecepatan_pelayanan":3,"ketepatan_penyelesaian":4,"keramahan_petugas":4,"kompetensi_petugas":4,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":4}', 7, 'Lumayan tapi bisa lebih baik', 'NETRAL'),
('Teh Imas', '628123456016', 'PBG', 'QR_CODE', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":5,"kemudahan_prosedur":5,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":5,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 10, 'Sempurna!', 'POSITIF'),
('Pak Otong', '628123456017', 'RUMIJA', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":3,"kejelasan_persyaratan":3,"kemudahan_prosedur":3,"kecepatan_pelayanan":2,"ketepatan_penyelesaian":3,"keramahan_petugas":3,"kompetensi_petugas":3,"kejelasan_ai":2,"kemudahan_sistem":3,"kepuasan_keseluruhan":3}', 5, 'Kurang responsif', 'NEGATIF'),
('Bu Neng', '628123456018', 'SITEPLAN', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":4,"keramahan_petugas":5,"kompetensi_petugas":4,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":4}', 8, 'Sudah bagus', 'POSITIF'),
('Kang Ujang', '628123456019', 'IRIGASI', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":4,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":4,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":4,"kejelasan_ai":4,"kemudahan_sistem":4,"kepuasan_keseluruhan":4}', 8, 'Puas dengan pelayanan', 'POSITIF'),
('Teh Mimin', '628123456020', 'PKKPR', 'WHATSAPP', 'COMPLETED', '{"kemudahan_informasi":5,"kejelasan_persyaratan":4,"kemudahan_prosedur":4,"kecepatan_pelayanan":5,"ketepatan_penyelesaian":5,"keramahan_petugas":5,"kompetensi_petugas":5,"kejelasan_ai":5,"kemudahan_sistem":5,"kepuasan_keseluruhan":5}', 10, 'Luar biasa pelayanannya', 'POSITIF');

-- Early Warnings
INSERT INTO spms_early_warnings (type, level, title, description, metric, current_value, threshold, affected_bidang, affected_layanan) VALUES
('SLA_BREACH', 'CRITICAL', 'SLA PBG Terancam', 'Kepatuhan SLA layanan PBG turun di bawah target. 28 permohonan hampir melebihi batas waktu.', 'SLA Compliance PBG', 82.5, 90.0, 'BANGUNAN_GEDUNG', 'PBG'),
('COMPLAINT_SURGE', 'WARNING', 'Lonjakan Pengaduan Jalan', 'Pengaduan terkait kerusakan jalan meningkat 45% dalam 7 hari terakhir, terutama dari Kec. Tarogong Kidul.', 'Complaint Growth Rate', 145.0, 100.0, 'BINA_MARGA', 'PENGADUAN'),
('SENTIMENT_NEGATIVE', 'WARNING', 'Sentimen Negatif SLF', 'Sentimen negatif pada layanan SLF meningkat menjadi 22% dalam minggu ini.', 'Negative Sentiment Rate', 22.0, 15.0, 'BANGUNAN_GEDUNG', 'SLF'),
('OPERATOR_OVERLOAD', 'INFO', 'Beban Tinggi Operator BG', 'Operator Budi Santoso memiliki 28 tiket aktif, melebihi kapasitas optimal 20 tiket.', 'Active Tickets', 28.0, 20.0, 'BANGUNAN_GEDUNG', NULL),
('SATISFACTION_DROP', 'WARNING', 'Penurunan IKM Bina Marga', 'Indeks Kepuasan Masyarakat bidang Bina Marga turun 4.2% dari bulan lalu.', 'IKM Change', 4.2, 3.0, 'BINA_MARGA', NULL);

-- AI Recommendations
INSERT INTO spms_ai_recommendations (category, priority, title, description, rationale, action_items, impact, related_bidang, related_layanan) VALUES
('STAFFING', 'HIGH', 'Tambah Verifikator PBG', 'Perlu penambahan 2 verifikator PBG untuk mengatasi backlog permohonan yang meningkat 18.7%.', 'Rata-rata waktu penyelesaian PBG naik dari 10 ke 14 hari. Backlog meningkat 35% dibanding bulan lalu.', '["Rekrut atau rotasi 2 staf ke unit verifikasi PBG","Berikan pelatihan kilat sistem PBG digital","Redistribusi beban kerja operator"]', 'Mengurangi waktu penyelesaian PBG 30% dan meningkatkan SLA compliance ke >95%', '["BANGUNAN_GEDUNG"]', '["PBG"]'),
('FAQ_UPDATE', 'MEDIUM', 'Perbarui FAQ Persyaratan SLF', 'Pertanyaan tentang persyaratan SLF meningkat 62% namun 40% tidak terjawab dengan tepat oleh AI.', '156 pertanyaan serupa tentang dokumen SLF baru (PP 16/2021) belum masuk knowledge base.', '["Tambahkan 15 FAQ baru tentang persyaratan SLF","Update knowledge base dengan regulasi terbaru","Review jawaban AI untuk topik SLF"]', 'Meningkatkan AI accuracy untuk SLF dari 78% ke 95%', '["BANGUNAN_GEDUNG"]', '["SLF"]'),
('SOP_REVISION', 'MEDIUM', 'Revisi SOP Penanganan PKKPR', 'SOP PKKPR saat ini memiliki 3 langkah yang sering menimbulkan kebingungan warga.', 'Survei menunjukkan dimensi "Kemudahan Prosedur" PKKPR hanya 3.2/5, terendah di semua layanan.', '["Sederhanakan form pengajuan PKKPR","Buat infografis alur prosedur","Integrasikan checklist otomatis di WhatsApp"]', 'Meningkatkan skor Kemudahan Prosedur PKKPR dari 3.2 ke 4.0+', '["PENATAAN_RUANG"]', '["PKKPR"]'),
('TRAINING', 'LOW', 'Pelatihan Operator Penggunaan AI', 'Tingkat pemanfaatan AI oleh 3 operator masih di bawah 80%.', 'Operator dengan pemanfaatan AI rendah memiliki response time 40% lebih lambat.', '["Jadwalkan pelatihan AI tools untuk operator","Buat panduan best practice pemanfaatan AI","Monitoring mingguan tingkat adopsi AI"]', 'Meningkatkan efisiensi operator 25% dan mengurangi response time rata-rata', '["BINA_MARGA","SDA"]', '[]'),
('SOCIALIZATION', 'MEDIUM', 'Sosialisasi Layanan Digital PUPR', 'Penggunaan kanal digital baru mencapai 45% dari total interaksi. Masih ada potensi peningkatan.', '55% warga masih datang langsung ke kantor untuk informasi yang bisa dijawab via WhatsApp/Website.', '["Buat video tutorial layanan WhatsApp","Pasang QR Code di kantor kecamatan","Sosialisasi melalui media sosial"]', 'Meningkatkan adopsi kanal digital dari 45% ke 70%', '["SEKRETARIAT"]', '["INFORMASI_PUBLIK"]');

-- Heatmap Data (Top 15 Kecamatan)
INSERT INTO spms_heatmap_kecamatan (id, name, lat, lng, total_pengaduan, total_permohonan, tingkat_kepuasan, sebaran_layanan, prioritas_tindak_lanjut) VALUES
('tarogong-kidul', 'Tarogong Kidul', -7.2167, 107.9000, 85, 1254, 86.5, '{"PBG":420,"KRK":180,"PKKPR":150,"SLF":200,"SITEPLAN":120,"RUMIJA":80,"PENGADUAN":85,"INFORMASI_PUBLIK":19}', 'HIGH'),
('tarogong-kaler', 'Tarogong Kaler', -7.1833, 107.9000, 52, 892, 89.2, '{"PBG":280,"KRK":150,"PKKPR":110,"SLF":140,"SITEPLAN":85,"RUMIJA":60,"PENGADUAN":52,"INFORMASI_PUBLIK":15}', 'MEDIUM'),
('garut-kota', 'Garut Kota', -7.2275, 107.9089, 68, 743, 84.8, '{"PBG":250,"KRK":120,"PKKPR":90,"SLF":110,"SITEPLAN":75,"RUMIJA":45,"PENGADUAN":68,"INFORMASI_PUBLIK":25}', 'HIGH'),
('karangpawitan', 'Karangpawitan', -7.2333, 107.9500, 35, 612, 91.3, '{"PBG":200,"KRK":100,"PKKPR":80,"SLF":90,"SITEPLAN":60,"RUMIJA":40,"PENGADUAN":35,"INFORMASI_PUBLIK":7}', 'LOW'),
('banyuresmi', 'Banyuresmi', -7.1833, 107.9333, 28, 489, 90.5, '{"PBG":160,"KRK":80,"PKKPR":65,"SLF":72,"SITEPLAN":48,"RUMIJA":32,"PENGADUAN":28,"INFORMASI_PUBLIK":4}', 'LOW'),
('cibatu', 'Cibatu', -7.1167, 107.9333, 42, 456, 87.1, '{"PBG":150,"KRK":75,"PKKPR":60,"SLF":68,"SITEPLAN":45,"RUMIJA":30,"PENGADUAN":42,"INFORMASI_PUBLIK":6}', 'MEDIUM'),
('bayongbong', 'Bayongbong', -7.2667, 107.9333, 31, 398, 88.9, '{"PBG":130,"KRK":65,"PKKPR":52,"SLF":60,"SITEPLAN":40,"RUMIJA":26,"PENGADUAN":31,"INFORMASI_PUBLIK":4}', 'LOW'),
('leles', 'Leles', -7.1333, 107.8833, 38, 387, 85.6, '{"PBG":125,"KRK":62,"PKKPR":50,"SLF":58,"SITEPLAN":38,"RUMIJA":25,"PENGADUAN":38,"INFORMASI_PUBLIK":6}', 'MEDIUM'),
('cilawu', 'Cilawu', -7.2833, 107.8667, 25, 345, 90.8, '{"PBG":112,"KRK":56,"PKKPR":45,"SLF":52,"SITEPLAN":34,"RUMIJA":22,"PENGADUAN":25,"INFORMASI_PUBLIK":4}', 'LOW'),
('samarang', 'Samarang', -7.2000, 107.8500, 45, 320, 82.4, '{"PBG":105,"KRK":52,"PKKPR":42,"SLF":48,"SITEPLAN":32,"RUMIJA":20,"PENGADUAN":45,"INFORMASI_PUBLIK":6}', 'HIGH'),
('kadungora', 'Kadungora', -7.1333, 107.8500, 22, 298, 91.5, '{"PBG":95,"KRK":48,"PKKPR":38,"SLF":44,"SITEPLAN":30,"RUMIJA":18,"PENGADUAN":22,"INFORMASI_PUBLIK":3}', 'LOW'),
('limbangan', 'Limbangan', -7.1500, 107.9167, 18, 265, 92.1, '{"PBG":85,"KRK":42,"PKKPR":34,"SLF":40,"SITEPLAN":26,"RUMIJA":16,"PENGADUAN":18,"INFORMASI_PUBLIK":4}', 'LOW'),
('wanaraja', 'Wanaraja', -7.2500, 107.9167, 30, 254, 87.8, '{"PBG":82,"KRK":40,"PKKPR":32,"SLF":38,"SITEPLAN":25,"RUMIJA":15,"PENGADUAN":30,"INFORMASI_PUBLIK":4}', 'MEDIUM'),
('malangbong', 'Malangbong', -7.0833, 107.9833, 15, 210, 93.2, '{"PBG":68,"KRK":34,"PKKPR":27,"SLF":32,"SITEPLAN":21,"RUMIJA":12,"PENGADUAN":15,"INFORMASI_PUBLIK":1}', 'LOW'),
('cisurupan', 'Cisurupan', -7.3167, 107.8833, 20, 198, 89.4, '{"PBG":64,"KRK":32,"PKKPR":25,"SLF":30,"SITEPLAN":20,"RUMIJA":12,"PENGADUAN":20,"INFORMASI_PUBLIK":2}', 'LOW');

-- Trend Data (12 Bulan)
INSERT INTO spms_trend_data (period, ikm, sla, nps, sentiment, complaints, permohonan, selesai) VALUES
('Aug 2025', 82.5, 88.2, 45, 72.0, 48, 5200, 4500),
('Sep 2025', 83.2, 89.5, 48, 73.5, 42, 5450, 4800),
('Oct 2025', 84.1, 90.1, 50, 74.8, 45, 5680, 5100),
('Nov 2025', 84.8, 90.8, 52, 75.2, 40, 5900, 5350),
('Dec 2025', 85.5, 91.5, 55, 76.8, 38, 6100, 5600),
('Jan 2026', 86.2, 92.0, 56, 78.2, 35, 6350, 5850),
('Feb 2026', 86.8, 92.5, 58, 79.5, 32, 6580, 6100),
('Mar 2026', 87.2, 93.0, 59, 80.8, 30, 6800, 6350),
('Apr 2026', 87.5, 93.2, 60, 81.5, 28, 7050, 6600),
('May 2026', 87.9, 93.8, 61, 82.2, 25, 7300, 6850),
('Jun 2026', 88.2, 94.0, 62, 83.0, 22, 7550, 7100),
('Jul 2026', 88.5, 94.2, 62, 83.5, 20, 7800, 7350);

-- AI Insights
INSERT INTO spms_ai_insights (text, category, priority) VALUES
('Permohonan PBG dan SLF meningkat 18.7% dibanding bulan lalu — diprediksi akan terus naik hingga Q4 2026.', 'TREND', 'HIGH'),
('Kecamatan Tarogong Kidul menyumbang 25% dari total pengaduan — fokus penanganan infrastruktur jalan diperlukan.', 'ANOMALY', 'HIGH'),
('Jam pelayanan tersibuk: 09:00–11:00 WIB (42% total traffic). Pertimbangkan penambahan kapasitas di jam sibuk.', 'RECOMMENDATION', 'MEDIUM'),
('Topik FAQ paling dicari: Persyaratan PBG (32%), Biaya SLF (18%), Prosedur PKKPR (15%).', 'TREND', 'MEDIUM'),
('AI berhasil menjawab 96.3% pertanyaan tanpa eskalasi — peningkatan 3.5% dari bulan lalu.', 'TREND', 'LOW'),
('Prediksi: Beban layanan bulan Agustus 2026 akan naik 12% karena musim pembangunan aktif.', 'PREDICTION', 'HIGH'),
('Sentimen positif meningkat konsisten 5 bulan berturut-turut — indikator perbaikan kualitas layanan.', 'TREND', 'LOW'),
('SOP PKKPR menghasilkan confusion rate 28% — revisi diperlukan untuk menyederhanakan langkah 3 dan 5.', 'RECOMMENDATION', 'HIGH');
