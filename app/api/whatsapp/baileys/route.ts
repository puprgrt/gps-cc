import { NextRequest, NextResponse } from 'next/server';

const BAILEYS_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    let targetUrl = process.env.BAILEYS_API_URL || 'http://localhost:3001';
    
    // Allow frontend to override for testing
    const providedUrl = req.nextUrl.searchParams.get('serverUrl');
    if (providedUrl) {
      targetUrl = providedUrl;
    }
    
    // Remove trailing slash if any
    targetUrl = targetUrl.replace(/\/$/, '');

    const res = await fetch(`${targetUrl}/api/status`, { cache: 'no-store' });
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
    const { action, mode, phoneNumber, serverUrl } = body;

    let targetUrl = process.env.BAILEYS_API_URL || 'http://localhost:3001';
    if (serverUrl) targetUrl = serverUrl;
    targetUrl = targetUrl.replace(/\/$/, '');

    let targetEndpoint = '/api/connect';
    if (action === 'disconnect') targetEndpoint = '/api/disconnect';
    if (action === 'reconnect') targetEndpoint = '/api/reconnect';

    const res = await fetch(`${targetUrl}${targetEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
