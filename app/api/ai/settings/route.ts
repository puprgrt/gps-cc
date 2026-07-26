import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Lazy require of server service
const getAISettingsService = () => {
  try {
    return require('@/server/services/aiSettingsService');
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const aiSettingsService = getAISettingsService();
    if (!aiSettingsService) {
      return NextResponse.json(
        { success: false, error: 'AISettingsService is not available' },
        { status: 500 }
      );
    }

    const settings = await aiSettingsService.getAllSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const aiSettingsService = getAISettingsService();
    if (!aiSettingsService) {
      return NextResponse.json(
        { success: false, error: 'AISettingsService is not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data payload' },
        { status: 400 }
      );
    }

    const updated = await aiSettingsService.saveSettings(body);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Pengaturan Model semua AI berhasil disimpan',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}
