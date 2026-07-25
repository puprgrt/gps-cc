import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wa_bot_keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && (error.code === '42P01' || error.code === 'PGRST205' || error.message.includes('Could not find'))) {
      return NextResponse.json(getDefaultKeywords());
    }

    if (error) {
      console.error('[BotKeywords API] Error GET:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(getDefaultKeywords());
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, item } = body;

    if (action === 'seed_defaults') {
      const defaults = getDefaultKeywords();
      const { data, error } = await supabaseAdmin
        .from('wa_bot_keywords')
        .upsert(defaults, { onConflict: 'keyword' })
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, keywords: data });
    }

    if (action === 'save_item') {
      const payload = {
        id: item.id || undefined,
        keyword: item.keyword.trim().toLowerCase(),
        match_type: item.match_type || 'CONTAINS',
        reply_text: item.reply_text,
        is_active: item.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('wa_bot_keywords')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, item: data });
    }

    if (action === 'delete_item') {
      const { error } = await supabaseAdmin
        .from('wa_bot_keywords')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalid' }, { status: 400 });
  } catch (err: any) {
    console.error('[BotKeywords API] Error POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getDefaultKeywords() {
  return [
    {
      keyword: 'halo',
      match_type: 'CONTAINS',
      reply_text: `Halo! Selamat datang di Layanan WhatsApp Center PURI (PUPR Garut). Ketik *menu* untuk melihat daftar layanan utama kami.`,
      is_active: true
    },
    {
      keyword: 'pbg',
      match_type: 'CONTAINS',
      reply_text: `🏢 *Informasi Persetujuan Bangunan Gedung (PBG):*
Pendaftaran PBG & SLF dilakukan secara online mandiri di portal SIMBG Kementerian PUPR: https://simbg.pu.go.id

Ketik *1.1* untuk melihat rincian syarat berkas teknis PBG.`,
      is_active: true
    },
    {
      keyword: 'lokasi',
      match_type: 'CONTAINS',
      reply_text: `📍 *Lokasi Kantor Dinas PUPR Kabupaten Garut:*
Jl. Raya Samarang No. 115, Tarogong Kaler, Kabupaten Garut, Jawa Barat 44151.
Jam Kerja: Senin - Jumat (08:00 - 15:30 WIB).`,
      is_active: true
    },
    {
      keyword: 'retribusi',
      match_type: 'CONTAINS',
      reply_text: `💳 *Informasi Pembayaran Retribusi PBG:*
Pembayaran retribusi PBG HANYA dilakukan melalui Kode Billing Kas Daerah resmi Kabupaten Garut. Petugas kami TIDAK PERNAH meminta transfer ke rekening pribadi.`,
      is_active: true
    },
    {
      keyword: 'jalan rusak',
      match_type: 'CONTAINS',
      reply_text: `🚨 *Laporan Pengaduan Jalan Rusak:*
Mohon kirimkan Lokasi Rinci (Jalan, RT/RW, Desa, Kecamatan) beserta Foto & Share Location. Laporan Anda akan diteruskan ke Tim URC Bina Marga PUPR Garut.`,
      is_active: true
    }
  ];
}
