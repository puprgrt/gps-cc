import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';
import { TipeFormAlt, KomponenPenilaianInput } from '@/sipeka/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { timTeknisId, altForm, luasBangunanM2, inputKomponen } = body;

    if (!timTeknisId || !altForm || !Array.isArray(inputKomponen)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter timTeknisId, altForm, dan inputKomponen (array) wajib disertakan.',
        },
        { status: 400 }
      );
    }

    const hasilKalkulasi = await SipekaService.executeKalkulasiKerusakan(id, timTeknisId, {
      altForm: altForm as TipeFormAlt,
      luasBangunanM2: Number(luasBangunanM2) || 100,
      inputKomponen: inputKomponen as KomponenPenilaianInput[],
    });

    return NextResponse.json({
      success: true,
      message: 'Kalkulasi kerusakan 2-tahap selesai dan berkas diteruskan ke Subkoordinator.',
      data: hasilKalkulasi,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses analisis kerusakan.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

