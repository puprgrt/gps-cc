import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BAILEYS_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEV_KEY = 'simbg-garut-dev-api-key-2026-x9f8';

async function updateApiKeyLastUsed(token: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('wa_integrations_settings')
      .select('settings_data')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data?.settings_data) {
      const settings = data.settings_data;
      const apiKeys = settings.apiKeys || [];
      const updatedKeys = apiKeys.map((k: any) => {
        if (k.fullKey === token) {
          return { ...k, lastUsedAt: new Date().toISOString() };
        }
        return k;
      });

      await supabaseAdmin
        .from('wa_integrations_settings')
        .update({
          settings_data: { ...settings, apiKeys: updatedKeys },
          updated_at: new Date().toISOString()
        })
        .eq('id', 'global');
    }
  } catch (err) {
    console.warn('[API Send] Failed to update API key last used timestamp:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Otorisasi gagal. Token Bearer diperlukan.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Otorisasi gagal. Token Bearer kosong.' },
        { status: 401 }
      );
    }

    let isValid = token === DEV_KEY;
    let tokenMeta = isValid
      ? { name: 'SIMBG Garut Development API Sandbox Key', role: 'full_access' }
      : null;

    // Search dynamic key in database if not dev key
    if (!isValid) {
      try {
        const { data, error } = await supabaseAdmin
          .from('wa_integrations_settings')
          .select('settings_data')
          .eq('id', 'global')
          .maybeSingle();

        if (!error && data?.settings_data) {
          const settings = data.settings_data;
          const apiKeys = settings.apiKeys || [];
          const matchedKey = apiKeys.find((k: any) => k.fullKey === token && k.isActive);
          if (matchedKey) {
            isValid = true;
            tokenMeta = { name: matchedKey.name, role: matchedKey.role };
          }
        }
      } catch (dbErr) {
        console.error('[API Send] Gagal memvalidasi token dari database:', dbErr);
      }
    }

    if (!isValid || !tokenMeta) {
      return NextResponse.json(
        { success: false, error: 'Kunci API tidak valid atau telah dinonaktifkan.' },
        { status: 401 }
      );
    }

    // 2. Validate Request Body
    const body = await req.json();
    const { phone, message, gatewayType } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Parameter 'phone' dan 'message' wajib diisi." },
        { status: 400 }
      );
    }

    // Format phone number (digits only, Indonesian formatting)
    let formattedPhone = String(phone).replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    if (formattedPhone.length < 9) {
      return NextResponse.json(
        { success: false, error: 'Format nomor telepon tidak valid.' },
        { status: 400 }
      );
    }

    // 3. Forward Message to Baileys Server
    try {
      const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026';
      const response = await fetch(`${BAILEYS_URL}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-baileys-api-key': BAILEYS_API_KEY,
        },
        body: JSON.stringify({
          to: formattedPhone,
          text: message,
          sender: 'api_integration'
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        // Update lastUsedAt timestamp in background
        if (token !== DEV_KEY) {
          updateApiKeyLastUsed(token).catch(e =>
            console.error('[API Send] Error updating API Key last used timestamp:', e)
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Pesan berhasil dikirim via Baileys Gateway.',
          data: {
            phone: formattedPhone,
            messageId: resData.saved?.id || resData.data?.key?.id || `msg-${Date.now()}`,
            gateway: gatewayType || 'BAILEYS',
            authenticatedBy: tokenMeta.name,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: resData.error || 'Server Baileys merespons dengan kesalahan.'
          },
          { status: response.status || 400 }
        );
      }
    } catch (err: any) {
      console.error('[API Send] Error calling Baileys server:', err);
      return NextResponse.json(
        {
          success: false,
          error: 'Tidak dapat menghubungi Baileys gateway server. Pastikan gateway aktif.'
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
