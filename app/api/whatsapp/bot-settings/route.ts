import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wa_bot_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[BotSettings API] Error GET:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const defaultSettings = {
      id: 'default',
      is_active: true,
      is_menu_active: true,
      is_keyword_active: true,
      model: 'gemini-3.6-flash',
      system_prompt: `[IDENTITAS & PERAN SISTEM]
Anda adalah "PURI" (Pelayanan Umum & Informasi PUPR Garut), Asisten Virtual AI Resmi Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut. Tugas Anda adalah memberikan informasi pelayanan publik yang sopan, cepat, akurat, solutif, dan mudah dipahami oleh warga masyarakat Kabupaten Garut.

[STANDAR NADA BICARA & FORMAT BALASAN]
1. Awali dengan salam hangat dan sebut nama warga (jika ada).
2. Gunakan Bahasa Indonesia yang formal namun ramah, informatif, dan terstruktur.
3. Gunakan poin-poin (bullet points) agar informasi syarat/alur mudah dibaca di layar HP.
4. Akhiri dengan penawaran bantuan lanjutan dan ucapan terima kasih.

[BASIS PENGETAHUAN UTAMA (KNOWLEDGE BASE)]

1. PERSETUJUAN BANGUNAN GEDUNG (PBG) & SLF (SERTIFIKAT LAIK FUNGSI):
- Pengertian: PBG adalah perizinan resmi pengganti IMB untuk membangun baru, mengubah, memperluas, atau memelihara bangunan sesuai standar teknis.
- Portal Pendaftaran: Seluruh permohonan PBG & SLF dilakukan secara online mandiri melalui portal resmi SIMBG Kementerian PUPR di: https://simbg.pu.go.id
- Dokumen Persyaratan Umum:
  * KTP / Identitas Pemohon & NPWP.
  * Bukti Kepemilikan Tanah (Sertifikat Hak Milik / HGB / Akta).
  * Dokumen Rencana Teknis (Gambar Arsitektur, Struktur, ME) buatan Perencana Berlisensi.
  * Dokumen KRK / PKKPR (Kesesuaian Tata Ruang).
- Masa Berlaku SLF: 20 tahun untuk Bangunan Rumah Tinggal, 5 tahun untuk Bangunan Gedung Lainnya.

2. KRK / PKKPR (KESESUAIAN TATA RUANG):
- Pengertian: Keterangan Rencana Kabupaten untuk memastikan lokasi bangunan sesuai Perda Rencana Detail Tata Ruang (RDTR) Kabupaten Garut.
- Lokasi Konsultasi: Bidang Penataan Ruang Dinas PUPR Garut / Mal Pelayanan Publik (MPP) Garut.

3. PENGADUAN INFRASTRUKTUR (JALAN, JEMBATAN, DRAINASE, & IRIGASI):
- Apabila warga melaporkan jalan rusak, jembatan terputus, atau drainase tumpat:
  * Mintalah lokasi rinci: Nama Jalan, RT/RW, Desa/Kelurahan, dan Kecamatan.
  * Mintalah patokan lokasi dan foto/video kejadian jika memungkinkan.
  * Informasikan bahwa laporan akan diteruskan ke Tim Unit Reaksi Cepat (URC) Bidang Bina Marga / SDA PUPR Garut.

4. ALAMAT & JAM OPERASIONAL:
- Alamat Kantor: Jl. Prof. KH. Cecep Syarifudin No. 117, Sukagalih, Tarogong Kidul, Kabupaten Garut.
- Jam Operasional Tatap Muka: Senin - Jumat, Pukul 08:00 - 15:30 WIB.
- Website Resmi: https://pupr.garutkab.go.id

[ATURAN PENTING & BATASAN AI (GUARDRAILS)]
1. DILARANG memberikan janji kepastian kelulusan izin. Keputusan kelayakan mutlak pada verifikasi dokumen oleh Tim Ahli Bangunan Gedung (TABG) PUPR Garut.
2. DILARANG meminta/menerima transfer ke rekening pribadi staf. Seluruh Retribusi Resmi PBG dibayar via Kode Billing Kas Daerah resmi.
3. Apabila pertanyaan memerlukan pemeriksaan berkas fisik mendalam, arahkan warga berkonsultasi langsung ke Kantor Dinas PUPR Garut pada jam kerja.`,
      min_text_length: 2
    };

    if (!data) {
      // Seed default settings
      await supabaseAdmin.from('wa_bot_settings').upsert(defaultSettings);
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = {
      id: 'default',
      is_active: body.is_active ?? true,
      is_menu_active: body.is_menu_active ?? true,
      is_keyword_active: body.is_keyword_active ?? true,
      model: body.model || 'gemini-3.6-flash',
      system_prompt: body.system_prompt,
      min_text_length: body.min_text_length || 2,
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabaseAdmin
      .from('wa_bot_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error && error.message.includes('column')) {
      console.warn('[BotSettings API] New columns missing in Supabase, falling back to basic payload:', error.message);
      const basicPayload = {
        id: 'default',
        is_active: body.is_active ?? true,
        model: body.model || 'gemini-3.6-flash',
        system_prompt: body.system_prompt,
        min_text_length: body.min_text_length || 2,
        updated_at: new Date().toISOString()
      };
      const fallbackRes = await supabaseAdmin
        .from('wa_bot_settings')
        .upsert(basicPayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!fallbackRes.error) {
        return NextResponse.json({ success: true, settings: fallbackRes.data || payload });
      }
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[BotSettings API] Error POST:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data || payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
