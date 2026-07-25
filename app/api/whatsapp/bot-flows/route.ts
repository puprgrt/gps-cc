import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wa_bot_menu_flows')
      .select('*')
      .order('display_order', { ascending: true });

    if (error && (error.code === '42P01' || error.code === 'PGRST205' || error.message.includes('Could not find'))) {
      // Table doesn't exist yet in Supabase, return default template options
      return NextResponse.json(getDefaultMenuFlows());
    }

    if (error) {
      console.error('[BotFlows API] Error GET:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(getDefaultMenuFlows());
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, item, items } = body;

    if (action === 'seed_defaults') {
      const defaults = getDefaultMenuFlows();
      const { data, error } = await supabaseAdmin
        .from('wa_bot_menu_flows')
        .upsert(defaults, { onConflict: 'menu_key' })
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, flows: data });
    }

    if (action === 'save_item') {
      const payload = {
        id: item.id || undefined,
        parent_id: item.parent_id || null,
        menu_key: item.menu_key,
        title: item.title,
        description: item.description || '',
        reply_text: item.reply_text,
        is_active: item.is_active ?? true,
        display_order: item.display_order || 0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('wa_bot_menu_flows')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, item: data });
    }

    if (action === 'delete_item') {
      const { error } = await supabaseAdmin
        .from('wa_bot_menu_flows')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalid' }, { status: 400 });
  } catch (err: any) {
    console.error('[BotFlows API] Error POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getDefaultMenuFlows() {
  return [
    {
      menu_key: 'menu',
      title: 'Menu Utama Layanan PUPR Garut',
      description: 'Daftar Opsi Utama',
      reply_text: `🏛️ *SELAMAT DATANG DI WHATSAPP CENTER PUPR GARUT*

Silakan ketik nomor angka pilihan layanan yang Anda butuhkan:

1️⃣ *Informasi PBG & SLF (Persetujuan Bangunan)*
2️⃣ *Informasi Kesesuaian Tata Ruang (KRK/PKKPR)*
3️⃣ *Laporan & Pengaduan Infrastruktur (Jalan/Drainase)*
4️⃣ *Lokasi & Jam Operasional Kantor*
5️⃣ *Bantuan Operator Manusia*

_Ketik angka (1-5) atau ketik pertanyaan langsung untuk dijawab oleh AI._`,
      is_active: true,
      display_order: 1
    },
    {
      menu_key: '1',
      title: 'Informasi PBG & SLF',
      description: 'Sub-menu Perizinan Bangunan',
      reply_text: `🏢 *LAYANAN PERSETUJUAN BANGUNAN GEDUNG (PBG) & SLF*

Silakan pilih opsi informasi teknis di bawah ini (Ketik nomor):

1.1 *Persyaratan Administrasi & Teknis PBG*
1.2 *Alur Pendaftaran Online SIMBG*
1.3 *Ketentuan Sertifikat Laik Fungsi (SLF)*
0 *Kembali ke Menu Utama*`,
      is_active: true,
      display_order: 2
    },
    {
      menu_key: '1.1',
      title: 'Syarat PBG',
      description: 'Rincian Berkas PBG',
      reply_text: `📄 *PERSYARATAN PERMOHONAN PBG:*

1. KTP Pemohon & NPWP
2. Bukti Kepemilikan Tanah (Sertifikat SHM/HGB/Akta)
3. Dokumen Kesesuaian Tata Ruang (KRK/PKKPR)
4. Gambar Rencana Teknis Arsitektur & Struktur (buatan Perencana Berlisensi)

_Daftar mandiri gratis melalui portal SIMBG: https://simbg.pu.go.id_
Ketik *0* untuk kembali ke Menu Utama.`,
      is_active: true,
      display_order: 3
    },
    {
      menu_key: '1.2',
      title: 'Alur SIMBG',
      description: 'Cara daftar SIMBG',
      reply_text: `💻 *ALUR PENDAFTARAN ONLINE SIMBG:*

1. Buka website *https://simbg.pu.go.id*
2. Buat akun pemohon menggunakan Email & KTP.
3. Klik *Tambah Permohonan PBG*.
4. Upload seluruh dokumen administratif dan teknis.
5. Tunggu proses Verifikasi & Sidang TABG Dinas PUPR Garut.
6. Penerbitan SKRD Retribusi & Penerbitan Sertifikat PBG.

Ketik *0* untuk kembali ke Menu Utama.`,
      is_active: true,
      display_order: 4
    },
    {
      menu_key: '2',
      title: 'Informasi Tata Ruang (KRK)',
      description: 'Kesesuaian Zonasi Tata Ruang',
      reply_text: `🗺️ *INFORMASI KESESUAIAN TATA RUANG (KRK/PKKPR)*

Keterangan Rencana Kabupaten (KRK) digunakan untuk memastikan rencana pembangunan sesuai Perda Detail Tata Ruang (RDTR) Kabupaten Garut.

*Persyaratan KRK:*
• KTP Pemohon
• Sertifikat Tanah / Bukti Kepemilikan
• Koordinat Lokasi Lahan (Shareloc / Titik Koordinat GPS)

*Lokasi Konsultasi:* Bidang Penataan Ruang Dinas PUPR Garut / Mal Pelayanan Publik (MPP) Kabupaten Garut.
Ketik *0* untuk kembali ke Menu Utama.`,
      is_active: true,
      display_order: 5
    },
    {
      menu_key: '3',
      title: 'Pengaduan Infrastruktur',
      description: 'Laporan Jalan/Drainase Rusak',
      reply_text: `🚨 *LAYANAN PENGADUAN INFRASTRUKTUR (BINA MARGA & SDA)*

Untuk melaporkan jalan rusak, jembatan terputus, atau saluran air/drainase tumpat, mohon kirimkan data berikut:

1. *Nama Pelapor:*
2. *Lokasi Rinci:* (Nama Jalan, RT/RW, Desa, Kecamatan)
3. *Foto/Video Kejadian:*
4. *Titik Koordinat / Share Location:*

Laporan Anda akan langsung diproses oleh Tim Unit Reaksi Cepat (URC) Dinas PUPR Kabupaten Garut.
Ketik *0* untuk kembali ke Menu Utama.`,
      is_active: true,
      display_order: 6
    },
    {
      menu_key: '4',
      title: 'Lokasi & Jam Kerja',
      description: 'Info Alamat & Kontak',
      reply_text: `📍 *KANTOR DINAS PUPR KABUPATEN GARUT*

• *Alamat:* Jl. Raya Samarang No. 115, Tarogong Kaler, Kabupaten Garut, Jawa Barat 44151
• *Jam Operasional:* Senin - Jumat (08:00 - 15:30 WIB)
• *Website Resmi:* https://pupr.garutkab.go.id

Ketik *0* untuk kembali ke Menu Utama.`,
      is_active: true,
      display_order: 7
    },
    {
      menu_key: '5',
      title: 'Hubungi Operator',
      description: 'Transfer ke Manusia',
      reply_text: `👨‍💼 *MENGHUBUNGKAN KE OPERATOR MANUSIA...*

Pesan Anda telah kami teruskan ke Petugas Operator Dinas PUPR Garut. Silakan tuliskan pertanyaan atau kendala Anda secara lengkap. Petugas kami akan segera membalas pada jam kerja. Terima kasih!`,
      is_active: true,
      display_order: 8
    }
  ];
}
