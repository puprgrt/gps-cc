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
      return NextResponse.json(
        { success: false, error: 'Permohonan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const isDownloadLocked = SipekaWorkflowEngine.isDownloadLocked(permohonan.status);

    return NextResponse.json({
      success: true,
      data: {
        ...permohonan,
        isDownloadLocked,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

