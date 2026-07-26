import { NextRequest, NextResponse } from 'next/server';
import { ChatwootService } from '@/services/chatwootService';
import { supabase } from '@/lib/supabase';

/**
 * ============================================================================
 * CHATWOOT OUTBOUND MESSAGE ENDPOINT
 * POST /api/psic/chatwoot/reply
 * ============================================================================
 *
 * Endpoint untuk mengirim pesan balasan dari Operator Dinas PUPR Garut
 * di dasbor PSIC ke kanal Omnichannel (WhatsApp, Instagram, FB, dll.)
 * melalui REST API Chatwoot.
 */

export async function POST(req: NextRequest) {
  try {
    const { conversationId, chatwootConversationId, content, isPrivateNote = false, senderName } =
      await req.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Konten pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // 1. Kirim pesan ke Chatwoot melalui ChatwootService REST API
    const targetCwId = Number(chatwootConversationId) || Number(conversationId) || 1;
    const chatwootResult = await ChatwootService.sendMessageToChatwoot(
      targetCwId,
      content,
      isPrivateNote
    );

    // 2. Simpan juga riwayat pesan balasan ke tabel psic_messages di Supabase
    if (conversationId) {
      await supabase.from('psic_messages').insert({
        conversation_id: String(conversationId),
        sender_type: isPrivateNote ? 'OPERATOR_NOTE' : 'OPERATOR',
        sender_name: senderName || 'Operator PUPR Garut',
        content,
        sentiment: 'POSITIF',
        emotion: 'SENANG',
      });
    }

    return NextResponse.json({
      success: true,
      chatwoot: chatwootResult,
      message: isPrivateNote
        ? 'Catatan internal (Private Note) berhasil dikirim ke Chatwoot.'
        : 'Balasan resmi berhasil dikirim ke kanal Omnichannel warga via Chatwoot.',
    });
  } catch (error: any) {
    console.error('Error POST /api/psic/chatwoot/reply:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
