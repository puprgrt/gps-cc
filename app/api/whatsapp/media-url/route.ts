import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

const MEDIA_BUCKET = 'whatsapp-media';
const SIGNED_URL_TTL_SECONDS = 60;

function isSafeStoragePath(value: string): boolean {
  const segments = value.split('/');
  return (
    segments.length >= 2 &&
    segments.length <= 8 &&
    segments.every((segment) => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== '.' && segment !== '..')
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autentikasi diperlukan.' }, { status: 401 });
  }

  const storagePath = request.nextUrl.searchParams.get('path') || '';
  if (!isSafeStoragePath(storagePath)) {
    return NextResponse.json({ error: 'Path media tidak valid.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Storage belum dikonfigurasi.' }, { status: 503 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Jangan sign path arbitrer; objek harus direferensikan oleh pesan WhatsApp.
  const { data: message, error: messageError } = await supabaseAdmin
    .from('wa_messages')
    .select('id')
    .eq('media_url', storagePath)
    .limit(1)
    .maybeSingle();

  if (messageError) {
    console.error('[WhatsApp media URL] Failed to verify message:', messageError.message);
    return NextResponse.json({ error: 'Gagal memverifikasi media.' }, { status: 500 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Media tidak ditemukan.' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error('[WhatsApp media URL] Failed to create signed URL:', error?.message);
    return NextResponse.json({ error: 'Gagal membuat akses media.' }, { status: 500 });
  }

  return NextResponse.json(
    { signedUrl: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
