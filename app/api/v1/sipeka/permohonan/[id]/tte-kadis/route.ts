import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { signerNip } = body;

    if (!signerNip) {
      return NextResponse.json(
        { success: false, error: 'NIP Kepala Dinas PUPR penandatangan wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await SipekaService.executeTTE({
      permohonanId: id,
      signerRole: 'KADIS_PUPR',
      signerNip,
    });

    return NextResponse.json({
      success: true,
      message: 'Surat Hasil Analisis berhasil di-generate dan di-TTE oleh Kepala Dinas PUPR Garut. Akses unduh terkunci menunggu pengisian SKM.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengeksekusi TTE Kadis PUPR.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

