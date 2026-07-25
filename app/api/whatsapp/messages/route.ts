import { NextRequest, NextResponse } from 'next/server';

const BAILEYS_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const res = await fetch(`${BAILEYS_URL}/api/conversations`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  } catch (error: any) {
    console.error('Error fetching whatsapp messages from Baileys Server:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
          body: JSON.stringify({ to: jid, text }),
        });
        
        if (!baileysRes.ok) {
           console.error('Failed to send to Baileys:', await baileysRes.text());
           return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }
      } catch (e: any) {
         console.error('Baileys Standalone not reachable:', e);
         return NextResponse.json({ error: e.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'add_note') {
      if (conversationId && note) {
        await fetch(`${BAILEYS_URL}/api/add-note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, note }),
        });
        return NextResponse.json({ success: true });
      }
    }

    if (action === 'add_tag') {
      if (conversationId && tag) {
        await fetch(`${BAILEYS_URL}/api/add-tag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, tag }),
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Action tidak didukung' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
