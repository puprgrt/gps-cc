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
        { success: false, error: 'NIP Subkoordinator penandatangan wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await SipekaService.executeTTE({
      permohonanId: id,
      signerRole: 'SUBKOORDINATOR',
      signerNip,
    });

    return NextResponse.json({
      success: true,
      message: 'Validasi & TTE Subkoordinator berhasil dibubuhkan.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengeksekusi TTE Subkoordinator.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

