import { NextRequest, NextResponse } from 'next/server';

function getTargetUrl(): string {
  let targetUrl = process.env.BAILEYS_API_URL || 'https://gps-cc-whatsapp-bot-production.up.railway.app';
  
  // Jika Vercel tidak sengaja diarahkan ke dirinya sendiri (circular), paksa ke Railway
  if (targetUrl.includes('vercel.app')) {
    targetUrl = 'https://gps-cc-whatsapp-bot-production.up.railway.app';
  }

  if (process.env.NODE_ENV === 'development' && !process.env.FORCE_REMOTE_BAILEYS) {
    targetUrl = 'http://localhost:3001';
  }
  return targetUrl.replace(/\/$/, '');
}

export async function GET(req: NextRequest) {
  try {
    const targetUrl = getTargetUrl();

    const res = await fetch(`${targetUrl}/api/status`, { 
      cache: 'no-store',
      headers: {
        'x-baileys-api-key': process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ source: 'standalone_server', ...data });
    } else {
      return NextResponse.json({ source: 'standalone_error', error: await res.text() }, { status: res.status });
    }
  } catch (e: any) {
    return NextResponse.json(
      { 
        source: 'standalone_error', 
        error: `Server Standalone Baileys sedang restart/tidak terhubung: ${e?.message}`,
        status: 'disconnected'
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, mode, phoneNumber } = body;

    const targetUrl = getTargetUrl();

    let targetEndpoint = '/api/connect';
    if (action === 'disconnect') targetEndpoint = '/api/disconnect';
    if (action === 'reconnect') targetEndpoint = '/api/reconnect';

    const res = await fetch(`${targetUrl}${targetEndpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-baileys-api-key': process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026'
      },
      body: JSON.stringify({ mode, phoneNumber }),
    });
    
    if (res.ok) {
      const remoteRes = await res.json();
      return NextResponse.json({ source: 'standalone_server', ...remoteRes });
    } else {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
