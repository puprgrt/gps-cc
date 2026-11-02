import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { fromUserId, fromUserRole, toUserId, targetStatus, catatan } = body;

    if (!fromUserId || !fromUserRole || !toUserId || !targetStatus || !catatan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter fromUserId, fromUserRole, toUserId, targetStatus, dan catatan disposisi wajib diisi.',
        },
        { status: 400 }
      );
    }

    const result = await SipekaService.disposisiPermohonan({
      permohonanId: id,
      fromUserId,
      fromUserRole,
      toUserId,
      targetStatus,
      catatan,
    });

    return NextResponse.json({
      success: true,
      message: 'Disposisi berhasil diteruskan.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses disposisi.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

