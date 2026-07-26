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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, conversationId, text, sender, note, tag } = body;

    if (action === 'send_message') {
      try {
        const jid = conversationId.replace('conv-', '');
        const baileysRes = await fetch(`${BAILEYS_URL}/api/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: jid, text, sender }),
        });

        const resData = await baileysRes.json().catch(() => ({}));
        
        if (!baileysRes.ok) {
           const errMsg = resData.error || 'WhatsApp belum terhubung. Silakan Scan QR Code terlebih dahulu.';
           console.warn('[API send_message] Baileys returned non-200:', errMsg);
           return NextResponse.json({ error: errMsg }, { status: 400 });
        }
      } catch (e: any) {
         console.error('Baileys Standalone not reachable:', e.message);
         return NextResponse.json({ error: 'Server Baileys tidak dapat dihubungi. Pastikan server Baileys aktif.' }, { status: 503 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'send_media') {
      const { base64Data, caption, mimetype, fileName, type } = body;
      try {
        const jid = conversationId.replace('conv-', '');
        const baileysRes = await fetch(`${BAILEYS_URL}/api/send-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: jid, base64Data, caption, mimetype, fileName, type }),
        });
        
        const resData = await baileysRes.json().catch(() => ({}));

        if (!baileysRes.ok) {
           const errMsg = resData.error || 'Gagal mengirim media. Pastikan WhatsApp sudah terhubung.';
           return NextResponse.json({ error: errMsg }, { status: 400 });
        }
      } catch (e: any) {
         return NextResponse.json({ error: e.message }, { status: 503 });
      }
      return NextResponse.json({ success: true });
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
