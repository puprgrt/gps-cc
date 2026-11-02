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
        { success: false, error: 'NIP Kabid Bangunan Gedung penandatangan wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await SipekaService.executeTTE({
      permohonanId: id,
      signerRole: 'KABID_BG',
      signerNip,
    });

    return NextResponse.json({
      success: true,
      message: 'Persetujuan & TTE Kabid Bangunan Gedung berhasil dibubuhkan.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengeksekusi TTE Kabid BG.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

