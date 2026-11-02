import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      permohonanId,
      pengelolaId,
      u1_persyaratan,
      u2_prosedur,
      u3_waktu_pelayanan,
      u4_biaya_tarif,
      u5_produk_spesifikasi,
      u6_kompetensi_pelaksana,
      u7_perilaku_pelaksana,
      u8_maklumat_pelayanan,
      u9_penanganan_pengaduan,
      saran_masukan,
    } = body;

    if (!permohonanId || !pengelolaId) {
      return NextResponse.json(
        { success: false, error: 'permohonanId dan pengelolaId wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await SipekaService.submitSKM({
      permohonanId,
      pengelolaId,
      u1_persyaratan: Number(u1_persyaratan),
      u2_prosedur: Number(u2_prosedur),
      u3_waktu_pelayanan: Number(u3_waktu_pelayanan),
      u4_biaya_tarif: Number(u4_biaya_tarif),
      u5_produk_spesifikasi: Number(u5_produk_spesifikasi),
      u6_kompetensi_pelaksana: Number(u6_kompetensi_pelaksana),
      u7_perilaku_pelaksana: Number(u7_perilaku_pelaksana),
      u8_maklumat_pelayanan: Number(u8_maklumat_pelayanan),
      u9_penanganan_pengaduan: Number(u9_penanganan_pengaduan),
      saran_masukan,
    });

    return NextResponse.json({
      success: true,
      message: 'Survei Kepuasan Masyarakat berhasil disimpan. Kunci unduh berkas Surat Hasil Analisis resmi telah dibuka.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses survei SKM.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

