-- Private storage for WhatsApp attachments.
-- The Baileys backend uses SUPABASE_SERVICE_ROLE_KEY; browser clients receive only short-lived signed URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Deliberately do not add policies for anon/authenticated roles. With Storage RLS,
-- only the trusted server (service role) can write/read objects and issue signed URLs.
