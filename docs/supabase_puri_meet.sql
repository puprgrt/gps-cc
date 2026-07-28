-- ============================================================
-- PURI Meet — Database Schema (Supabase/PostgreSQL)
-- GPS-CC: Garut Public Service AI Command Center
-- ============================================================

-- Table: meetings
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'LAINNYA',
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  room_id TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  bidang TEXT NOT NULL DEFAULT 'LINTAS_BIDANG',
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL DEFAULT '',
  max_participants INTEGER NOT NULL DEFAULT 20,
  participant_count INTEGER NOT NULL DEFAULT 0,
  agenda JSONB DEFAULT '[]'::jsonb,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_meeting_status CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT chk_meeting_priority CHECK (priority IN ('NORMAL', 'PENTING', 'MENDESAK')),
  CONSTRAINT chk_meeting_type CHECK (type IN (
    'KONSULTASI_PBG', 'KONSULTASI_SLF', 'KONSULTASI_KRK',
    'PEMBAHASAN_SITEPLAN', 'RAPAT_INTERNAL', 'RAPAT_KOORDINASI',
    'PEMBINAAN_JASA_KONSTRUKSI', 'PENDAMPINGAN_TEKNIS',
    'PRESENTASI_BIM', 'REVIEW_DOKUMEN', 'PENDAMPINGAN_MASYARAKAT', 'LAINNYA'
  )),
  CONSTRAINT chk_meeting_bidang CHECK (bidang IN (
    'SEKRETARIAT', 'PENATAAN_RUANG', 'BANGUNAN_GEDUNG',
    'BINA_MARGA', 'SDA', 'JASA_KONSTRUKSI', 'AMPL', 'LINTAS_BIDANG'
  ))
);

-- Table: meeting_participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  user_phone TEXT,
  role TEXT NOT NULL DEFAULT 'PARTICIPANT',
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_participant_role CHECK (role IN ('HOST', 'MODERATOR', 'PARTICIPANT'))
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_bidang ON meetings(bidang);
CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON meetings(room_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON meetings;
CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all meetings
DROP POLICY IF EXISTS "meetings_select_all" ON meetings;
CREATE POLICY "meetings_select_all" ON meetings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert meetings
DROP POLICY IF EXISTS "meetings_insert_auth" ON meetings;
CREATE POLICY "meetings_insert_auth" ON meetings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update only by creator or admin
DROP POLICY IF EXISTS "meetings_update_auth" ON meetings;
CREATE POLICY "meetings_update_auth" ON meetings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow delete only by creator or admin
DROP POLICY IF EXISTS "meetings_delete_auth" ON meetings;
CREATE POLICY "meetings_delete_auth" ON meetings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Participants policies
DROP POLICY IF EXISTS "participants_select_all" ON meeting_participants;
CREATE POLICY "participants_select_all" ON meeting_participants
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants_insert_auth" ON meeting_participants;
CREATE POLICY "participants_insert_auth" ON meeting_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants_update_auth" ON meeting_participants;
CREATE POLICY "participants_update_auth" ON meeting_participants
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants_delete_auth" ON meeting_participants;
CREATE POLICY "participants_delete_auth" ON meeting_participants
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Realtime subscription
-- ============================================================
-- Enable realtime for meetings table (idempotent block)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meeting_participants;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;
