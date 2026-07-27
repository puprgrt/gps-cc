import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('puri_spreadsheets')
      .select('*')
      .order('layanan_name', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a connection test
    if (body.action === 'test') {
      const { spreadsheet_id, sheet_name } = body;
      
      const encodedSheet = encodeURIComponent(sheet_name || 'Sheet1');
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`;
      
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        
        // Simple validation: should have at least 2 lines (header + data) or at least 1 line (header)
        if (!text || text.length < 5) {
          throw new Error("Spreadsheet kosong atau format tidak dikenali.");
        }
        
        return NextResponse.json({ success: true, message: "Koneksi berhasil! Spreadsheet dapat diakses." });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: "Gagal mengakses spreadsheet. Pastikan link sudah di-share 'Anyone with the link' (Publik)." });
      }
    }
    
    // Check if this is a DELETE action
    if (body.action === 'delete') {
      const { id } = body;
      const { error } = await supabaseAdmin
        .from('puri_spreadsheets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Default POST is UPSERT
    const payload = {
      layanan_name: body.layanan_name,
      bidang: body.bidang || 'SEKRETARIAT',
      spreadsheet_id: body.spreadsheet_id,
      sheet_name: body.sheet_name || 'Sheet1',
      description: body.description || '',
      column_mapping: body.column_mapping || {},
      is_active: body.is_active !== undefined ? body.is_active : true,
      cache_ttl_minutes: body.cache_ttl_minutes || 15,
      updated_at: new Date().toISOString()
    };

    if (body.id) {
      (payload as any).id = body.id;
    }

    const { data, error } = await supabaseAdmin
      .from('puri_spreadsheets')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
