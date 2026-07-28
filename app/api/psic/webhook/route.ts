import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ChatwootService } from '@/services/chatwootService';
import { validateApiRequest } from '@/lib/apiSecurity';

/**
 * ============================================================================
 * PSIC OMNICHANNEL WEBHOOK INGESTION ENDPOINT
 * ============================================================================
 * 
 * Menerima payload dari Social Connector Gateway (n8n, Chatwoot, atau Webhook Meta)
 * secara real-time dan menyimpannya ke dalam database Supabase PSIC.
 */

export async function POST(request: NextRequest) {
  try {
    const { errorResponse, payload } = await validateApiRequest(request);
    if (errorResponse) return errorResponse;

    // Deteksi otomatis jika payload berasal dari Chatwoot
    if (payload && (payload.event || payload.conversation?.id || payload.inbox?.id)) {
      const chatwootResult = await ChatwootService.processWebhookEvent(payload);
      return NextResponse.json({
        success: chatwootResult.success,
        source: 'CHATWOOT_OMNICHANNEL',
        conversationId: chatwootResult.conversationId,
        classification: chatwootResult.classification,
        message: chatwootResult.message,
      });
    }

    const {
      channelType = 'instagram',
      externalId,
      author = {},
      content = '',
      bidang = 'BINA_MARGA',
      intent = 'PENGADUAN',
      smartLabel = 'Jalan',
      priority = 'NORMAL',
      sentiment = 'NETRAL',
      emotion = 'NETRAL',
      kecamatan,
      desa,
      addressDetail,
    } = payload;

    if (!externalId || !author.id || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload tidak lengkap: externalId, author.id, dan content wajib ada.',
        },
        { status: 400 }
      );
    }

    // 1. Simpan/Upsert Percakapan ke psic_conversations
    const { data: convData, error: convError } = await supabase
      .from('psic_conversations')
      .upsert(
        {
          channel_type: channelType,
          external_id: externalId,
          title: payload.title || content.slice(0, 60),
          author_id: author.id,
          author_name: author.name || 'Warga Garut',
          author_username: author.username,
          author_avatar_url: author.avatarUrl,
          is_verified: Boolean(author.isVerified),
          is_influencer: Boolean(author.isInfluencer),
          followers_count: author.followersCount || 0,
          bidang,
          intent,
          smart_label: smartLabel,
          priority,
          sentiment,
          emotion,
          status: 'UNREAD',
          kecamatan,
          desa,
          address_detail: addressDetail,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: 'external_id' }
      )
      .select('id')
      .single();

    if (convError) {
      console.warn('Gagal upsert psic_conversations (menggunakan mode fallback offline):', convError);
    }

    const conversationId = convData?.id || 'conv-offline-fallback';

    // 2. Simpan Pesan ke psic_messages
    const { error: msgError } = await supabase.from('psic_messages').insert({
      conversation_id: conversationId,
      sender_type: 'USER',
      sender_name: author.name || 'Warga Garut',
      content,
      attachment_type: payload.attachmentType || 'text',
      attachment_url: payload.attachmentUrl,
      sentiment,
      emotion,
    });

    if (msgError) {
      console.warn('Gagal insert psic_messages:', msgError);
    }

    return NextResponse.json({
      success: true,
      message: 'PSIC Webhook berhasil diproses dan diklasifikasikan.',
      data: {
        conversationId,
        channelType,
        bidang,
        priority,
      },
    });
  } catch (error: any) {
    console.error('PSIC Webhook Ingestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan internal pada pemrosesan webhook.',
      },
      { status: 500 }
    );
  }
}
