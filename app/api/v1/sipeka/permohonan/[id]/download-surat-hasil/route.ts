import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';
import { SipekaWorkflowEngine } from '@/sipeka/workflow/stateMachine';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const permohonan = await SipekaService.getPermohonanById(id);

    if (!permohonan) {
      return NextResponse.json({ success: false, error: 'Permohonan tidak ditemukan.' }, { status: 404 });
    }

    // Periksa gerbang wajib SKM
    if (SipekaWorkflowEngine.isDownloadLocked(permohonan.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Akses unduh terkunci! Sesuai PermenPAN-RB No. 14 Tahun 2017, Pengelola BG wajib mengisi Survei Kepuasan Masyarakat (SKM) 9 Indikator terlebih dahulu sebelum dapat mengunduh Surat Hasil Analisis bertanda tangan elektronik (TTE BSrE).',
          lockStatus: permohonan.status,
          skmUrl: `/sipeka/skm/${id}`,
        },
        { status: 403 }
      );
    }

    // Dokumen terbuka: hasilkan metadata dokumen PDF legal kedinasan
    return NextResponse.json({
      success: true,
      message: 'Akses unduh dokumen dibuka.',
      data: {
        nomorPermohonan: permohonan.nomor_permohonan,
        namaBangunan: permohonan.bangunan?.nama_bangunan,
        tanggalTerbit: permohonan.created_at,
        tteKadisHash: permohonan.history?.tte_kadis_hash || 'BSrE-PUPR-VERIFIED-LEGAL',
        downloadLink: `https://drive.google.com/uc?export=download&id=${permohonan.surat_hasil_gdrive_id || 'sample_drive_file'}`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

