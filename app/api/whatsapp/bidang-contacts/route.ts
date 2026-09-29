import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { BidangForwardingSettings } from '@/domain/whatsappIntegration';

const BAILEYS_URL = (process.env.BAILEYS_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_FILE_PATH = path.join(process.cwd(), 'server/data/bidang_forwarding_settings.json');

function readLocalSettings(): BidangForwardingSettings | null {
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[API bidang-contacts] Gagal membaca data lokal:', e);
  }
  return null;
}

function writeLocalSettings(data: BidangForwardingSettings) {
  try {
    const dir = path.dirname(LOCAL_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[API bidang-contacts] Gagal menyimpan data lokal:', e);
  }
}

export async function GET() {
  try {
    // 1. Coba hubungi Baileys Server
    try {
      const res = await fetch(`${BAILEYS_URL}/api/bidang-contacts`, {
        headers: { 'x-baileys-api-key': BAILEYS_API_KEY },
        cache: 'no-store'
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          return NextResponse.json({ success: true, data: body.data });
        }
      }
    } catch {
      // Baileys server offline atau belum berjalan, lanjutkan ke Supabase / lokal
    }

    // 2. Coba Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('wa_bidang_forwarding_settings')
        .select('settings_data')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data?.settings_data) {
        return NextResponse.json({ success: true, data: data.settings_data });
      }
    } catch {
      // Supabase error
    }

    // 3. Fallback ke file JSON lokal
    const local = readLocalSettings();
    if (local) {
      return NextResponse.json({ success: true, data: local });
    }

    return NextResponse.json({
      success: false,
      error: 'Data pengaturan nomor WA bidang tidak ditemukan.'
    }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settingsPayload: BidangForwardingSettings = {
      ...body.settings,
      updatedAt: new Date().toISOString(),
      updatedBy: body.updatedBy || 'Admin Command Center'
    };

    // 1. Simpan ke file lokal agar selalu persisten
    writeLocalSettings(settingsPayload);

    // 2. Coba simpan ke Supabase jika tabel tersedia
    try {
      await supabaseAdmin
        .from('wa_bidang_forwarding_settings')
        .upsert({
          id: 'global',
          settings_data: settingsPayload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('[API bidang-contacts] Supabase sync skip:', dbErr);
    }

    // 3. Beritahukan Baileys server jika online
    try {
      await fetch(`${BAILEYS_URL}/api/bidang-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-baileys-api-key': BAILEYS_API_KEY
        },
        body: JSON.stringify({ settings: settingsPayload, updatedBy: settingsPayload.updatedBy })
      });
    } catch {
      // Baileys optional notification
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan nomor WhatsApp bidang berhasil disimpan.',
      data: settingsPayload
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
