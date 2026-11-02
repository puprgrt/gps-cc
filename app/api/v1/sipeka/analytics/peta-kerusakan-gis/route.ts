import { NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function GET() {
  try {
    const gisData = await SipekaService.getPetaKerusakanGIS();
    return NextResponse.json({
      success: true,
      totalTitik: gisData.length,
      data: gisData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengambil data spasial GIS SIPEKA.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

