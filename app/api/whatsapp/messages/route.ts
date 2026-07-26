import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BAILEYS_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // 1. Try fetching from Baileys Standalone Server
    try {
      const res = await fetch(`${BAILEYS_URL}/api/conversations`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e: any) {
      console.warn('[API /messages] Standalone Baileys server unreachable, trying Supabase fallback:', e.message);
    }

    // 2. Fallback: Fetch directly from Supabase DB using Service Role Key
    const { data: conversations, error } = await supabaseAdmin
      .from('wa_conversations')
      .select('*, wa_contacts(name, phone_number)')
      .order('updated_at', { ascending: false });

    if (!error && conversations) {
      return NextResponse.json({
        conversations: conversations.map(c => {
          const contactObj = Array.isArray(c.wa_contacts) ? c.wa_contacts[0] : c.wa_contacts;
          const fallbackPhone = c.id.replace('conv-', '').split('@')[0];
          return {
            id: c.id,
            contactName: contactObj?.name || c.contact_name || fallbackPhone,
            contactNumber: contactObj?.phone_number || fallbackPhone,
          lastMessage: c.last_message || '',
          timestamp: c.updated_at,
          unreadCount: c.unread_count || 0,
          status: c.status || 'pending',
          tags: c.tags || [],
          category: c.category || 'Umum',
          messages: c.messages || []
        };
      }),
        logs: []
      });
    }

    // 3. Graceful Empty Response (200 OK) to prevent 500 console errors
    return NextResponse.json({ conversations: [], logs: [] });
  } catch (error: any) {
    console.error('Error fetching whatsapp messages:', error);
    return NextResponse.json({ conversations: [], logs: [], warning: error.message });
  }
}

async function postToBaileysWithRetry(endpoint: string, payload: any, maxRetries = 2): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const res = await fetch(`${BAILEYS_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, status: res.status, data: resData };
      }

      const errMsg = resData.error || 'WhatsApp belum terhubung atau koneksi terputus.';
      const isConnectionErr = res.status >= 500 || errMsg.toLowerCase().includes('connection closed') || errMsg.toLowerCase().includes('closed') || errMsg.toLowerCase().includes('timeout');

      if (i < maxRetries && isConnectionErr) {
        console.warn(`[API ${endpoint}] Attempt #${i} failed (${errMsg}). Retrying in 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      return { ok: false, status: isConnectionErr ? 503 : res.status, data: resData, error: errMsg };
    } catch (err: any) {
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      return { ok: false, status: 503, data: {}, error: 'Server Baileys tidak dapat dihubungi. Pastikan server Baileys aktif.' };
    }
  }
  return { ok: false, status: 500, data: {}, error: 'Unknown error' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, conversationId, text, sender, note, tag } = body;

    if (action === 'send_message') {
      const jid = conversationId.replace('conv-', '');
      const result = await postToBaileysWithRetry('/api/send-message', { to: jid, text, sender });
      if (!result.ok) {
        console.warn('[API send_message] Baileys returned error:', result.error);
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (action === 'send_media') {
      const { base64Data, caption, mimetype, fileName, type } = body;
      const jid = conversationId.replace('conv-', '');
      const result = await postToBaileysWithRetry('/api/send-media', { to: jid, base64Data, caption, mimetype, fileName, type });
      if (!result.ok) {
        console.warn('[API send_media] Baileys returned error:', result.error);
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (action === 'add_note') {
      if (conversationId && note) {
        await fetch(`${BAILEYS_URL}/api/add-note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, note }),
        }).catch(() => null);
        return NextResponse.json({ success: true });
      }
    }

    if (action === 'add_tag') {
      if (conversationId && tag) {
        await fetch(`${BAILEYS_URL}/api/add-tag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, tag }),
        }).catch(() => null);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Action tidak didukung' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
