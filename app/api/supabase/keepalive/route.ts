import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export async function GET(req: NextRequest) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
    return NextResponse.json({
      status: 'skipped',
      message: 'Supabase URL belum dikonfigurasi di environment.',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const startTime = Date.now();

    // Query HEAD request yang ultra-ringan (<100 bytes egress)
    const { error, count } = await supabase
      .from('wa_conversations')
      .select('id', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      return NextResponse.json({
        status: 'warning',
        message: error.message,
        latencyMs,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'ok',
      success: true,
      strategy: 'anti-pause-ultra-low-egress',
      egressEstimatedBytes: '< 100 B',
      latencyMs,
      timestamp: new Date().toISOString(),
      wibTimestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
