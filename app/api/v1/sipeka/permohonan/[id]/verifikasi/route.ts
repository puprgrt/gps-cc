import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { timTeknisId, butuhSurvey, tanggalSurvey } = body;

    if (!timTeknisId || typeof butuhSurvey !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter timTeknisId dan butuhSurvey (boolean) wajib diisi.',
        },
        { status: 400 }
      );
    }

    const updated = await SipekaService.verifikasiBerkas({
      permohonanId: id,
      timTeknisId,
      butuhSurvey,
      tanggalSurvey,
    });

    return NextResponse.json({
      success: true,
      message: butuhSurvey
        ? 'Verifikasi selesai, survey lapangan dijadwalkan.'
        : 'Verifikasi selesai, dilanjutkan langsung ke lembar analisis.',
      data: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses verifikasi berkas.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

