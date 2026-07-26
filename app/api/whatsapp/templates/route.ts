import { NextRequest, NextResponse } from 'next/server';

let quickTemplates = [
  {
    id: 'tpl-1',
    title: 'Persyaratan PBG Rumah Tinggal',
    category: 'PBG',
    shortcut: '/pbg-rumah',
    text: `Waalaikumsalam Warahmatullahi Wabarakatuh. Terima kasih telah menghubungi Dinas PUPR Kabupaten Garut.

Berikut Persyaratan Dokumen Persetujuan Bangunan Gedung (PBG) Rumah Tinggal:
1. Fotokopi KTP Pemohon
2. Bukti Kepemilikan Tanah (Sertifikat / Letter C)
3. Keterangan Rencana Kota (KRK) dari Dinas PUPR
4. Gambar Teknis Arsitektur & Struktur
5. Form Surat Pernyataan Pemilik

Pendaftaran dilakukan melalui portal resmi SIMBG: https://simbg.pu.go.id`,
  },
  {
    id: 'tpl-2',
    title: 'Syarat Sertifikat Laik Fungsi (SLF)',
    category: 'SLF',
    shortcut: '/slf-info',
    text: `Selamat datang di WhatsApp Center Dinas PUPR Kabupaten Garut.

Untuk pengajuan SLF (Sertifikat Laik Fungsi) Bangunan Gedung, dokumen yang diperlukan mencakup:
1. Dokumen PBG / IMB Terbit
2. Laporan Hasil Pemeriksaan Laik Fungsi oleh Penilik Teknis / Pengawas Bangunan
3. As-Built Drawing (Gambar Terbangun)
4. Dokumen Sistem Pemadam Kebakaran & Kelistrikan

Informasi lebih lanjut dapat dikonsultasikan di Loket Pelayanan PUPR Garut.`,
  },
  {
    id: 'tpl-3',
    title: 'Jam & Lokasi Loket Pelayanan',
    category: 'Umum',
    shortcut: '/jam-pelayanan',
    text: `Jam Pelayanan Kantor Dinas PUPR Kabupaten Garut:
📍 Alamat: Jl. Prof. KH. Cecep Syarifudin No. 117, Sukagalih, Tarogong Kidul, Kabupaten Garut
🕒 Senin - Kamis: 08.00 - 15.30 WIB
🕒 Jumat: 08.00 - 16.00 WIB (Istirahat 11.30 - 13.00 WIB)
Situs Web Resmi: https://pupr.garutkab.go.id`,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    templates: quickTemplates,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, shortcut, text } = body;

    if (!title || !text) {
      return NextResponse.json({ error: 'Judul dan teks template wajib diisi' }, { status: 400 });
    }

    const newTemplate = {
      id: `tpl-${Date.now()}`,
      title,
      category: category || 'Umum',
      shortcut: shortcut || `/${title.toLowerCase().replace(/\s+/g, '-')}`,
      text,
    };

    quickTemplates.push(newTemplate);

    return NextResponse.json({
      success: true,
      message: 'Template respon cepat berhasil ditambahkan',
      template: newTemplate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
