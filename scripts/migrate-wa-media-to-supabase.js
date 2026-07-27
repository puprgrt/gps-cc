/*
 * Migrates legacy files from public/wa-media into the private whatsapp-media bucket.
 *
 * Usage:
 *   node scripts/migrate-wa-media-to-supabase.js
 *   node scripts/migrate-wa-media-to-supabase.js --delete-local
 *
 * The optional delete flag removes only files that were uploaded and whose matching
 * wa_messages rows were updated successfully.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const bucket = 'whatsapp-media';
const legacyDir = path.resolve(process.cwd(), 'public', 'wa-media');
const deleteLocal = process.argv.includes('--delete-local');
const allowedMimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

function getFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? getFiles(absolutePath) : [absolutePath];
  });
}

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.');
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const files = getFiles(legacyDir);
  let migrated = 0;
  let skipped = 0;

  for (const filePath of files) {
    const relativePath = path.relative(legacyDir, filePath).replace(/\\/g, '/');
    const extension = path.extname(filePath).toLowerCase();
    const contentType = allowedMimeTypes[extension];
    if (!contentType) {
      console.warn(`[skip] ${relativePath}: tipe file tidak didukung.`);
      skipped += 1;
      continue;
    }

    const storagePath = `legacy/${relativePath}`;
    const fileBuffer = fs.readFileSync(filePath);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType,
      cacheControl: '0',
      upsert: false,
    });
    if (uploadError && !/already exists/i.test(uploadError.message)) {
      throw new Error(`Upload ${relativePath} gagal: ${uploadError.message}`);
    }

    const legacyUrl = `/wa-media/${relativePath}`;
    const { error: updateError } = await supabase
      .from('wa_messages')
      .update({ media_url: storagePath })
      .eq('media_url', legacyUrl);
    if (updateError) {
      throw new Error(`Update referensi ${relativePath} gagal: ${updateError.message}`);
    }

    if (deleteLocal) fs.unlinkSync(filePath);
    migrated += 1;
    console.log(`[migrated] ${relativePath} -> ${storagePath}`);
  }

  console.log(`Selesai: ${migrated} dimigrasikan, ${skipped} dilewati.`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
