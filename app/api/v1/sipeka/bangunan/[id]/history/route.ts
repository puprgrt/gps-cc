import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const historyList = await SipekaService.getBangunanHistory(id);

    return NextResponse.json({
      success: true,
      bangunanId: id,
      totalPenilaian: historyList.length,
      data: historyList,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengambil riwayat penilaian gedung.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

