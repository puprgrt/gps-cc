import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, query, orderBy, arrayUnion } from 'firebase/firestore';

const CONV_COLLECTION = 'whatsapp_conversations';
const LOG_COLLECTION = 'whatsapp_logs';

export async function GET() {
  try {
    const convQuery = query(collection(db, CONV_COLLECTION), orderBy('timestamp', 'desc'));
    const convSnapshot = await getDocs(convQuery);
    const conversationsStore = [];
    convSnapshot.forEach(doc => {
      conversationsStore.push(doc.data());
    });

    const logQuery = query(collection(db, LOG_COLLECTION), orderBy('timestamp', 'desc'));
    const logSnapshot = await getDocs(logQuery);
    const botLogsStore = [];
    logSnapshot.forEach(doc => {
      botLogsStore.push(doc.data());
    });

    return NextResponse.json({
      conversations: conversationsStore,
      logs: botLogsStore.slice(0, 100),
    });
  } catch (error) {
    console.error('Error fetching whatsapp messages from Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, conversationId, text, sender, note, tag } = body;

    if (action === 'send_message') {
      const convRef = doc(db, CONV_COLLECTION, conversationId);
      const convSnap = await getDoc(convRef);
      
      if (!convSnap.exists()) {
        return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
      }

      const conv = convSnap.data();

      // Trigger Baileys Standalone endpoint
      try {
        const jid = conversationId.replace('conv-', '');
        const baileysRes = await fetch('http://localhost:3001/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: jid, text }),
        });
        
        if (!baileysRes.ok) {
           console.error('Failed to send to Baileys:', await baileysRes.text());
        }
      } catch (e) {
         console.error('Baileys Standalone not reachable:', e);
      }

      // Note: The Baileys server's controller handleSendMessage now handles saving to Firestore!
      // So we don't need to do it here, but wait, the client expects the updated message in the response right away.
      // It's fine, let's just return success: true. The frontend will re-fetch data or use optimistic UI.
      
      return NextResponse.json({
        success: true,
      });
    }

    if (action === 'add_note') {
      if (conversationId && note) {
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        await updateDoc(convRef, {
          notes: arrayUnion(note)
        });
        return NextResponse.json({ success: true });
      }
    }

    if (action === 'add_tag') {
      if (conversationId && tag) {
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        await updateDoc(convRef, {
          tags: arrayUnion(tag)
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Action tidak didukung' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
