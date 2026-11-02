import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function GET() {
  try {
    const list = await SipekaService.getPermohonanList();
    return NextResponse.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengambil data permohonan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pengelolaId, bangunanId, altForm, suratPermohonanGdriveId } = body;

    if (!pengelolaId || !bangunanId || !altForm) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter pengelolaId, bangunanId, dan altForm wajib diisi.',
        },
        { status: 400 }
      );
    }

    const created = await SipekaService.createPermohonan({
      pengelolaId,
      bangunanId,
      altForm,
      suratPermohonanGdriveId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Permohonan penilaian berhasil didaftarkan.',
        data: created,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mendaftarkan permohonan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

