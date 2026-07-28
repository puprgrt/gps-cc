import { NextRequest, NextResponse } from 'next/server';
import { ChatwootService, type ChatwootWebhookPayload } from '@/services/chatwootService';
import { validateApiRequest } from '@/lib/apiSecurity';

/**
 * ============================================================================
 * CHATWOOT OMNICHANNEL WEBHOOK ENDPOINT
 * POST /api/psic/chatwoot
 * ============================================================================
 *
 * Endpoint ini didaftarkan di halaman Admin Chatwoot:
 * Settings -> Integrations -> Webhooks -> Add New Webhook URL:
 * https://your-domain.com/api/psic/chatwoot
 *
 * Event yang didukung:
 * - message_created
 * - conversation_created
 * - conversation_status_changed
 */

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, payload } = await validateApiRequest(req);
    if (errorResponse) return errorResponse;

    if (!payload || !payload.event) {
      return NextResponse.json(
        { success: false, error: 'Payload tidak valid atau event tidak ditemukan' },
        { status: 400 }
      );
    }

    // Proses event melalui ChatwootService (6-Tier PURI Routing & Auto Reply)
    const result = await ChatwootService.processWebhookEvent(payload);

    return NextResponse.json({
      success: result.success,
      event: payload.event,
      conversationId: result.conversationId,
      classification: result.classification,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in POST /api/psic/chatwoot:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'PSIC Chatwoot Omnichannel Integration v2.0',
    description:
      'Endpoint aktif untuk menerima Webhooks Chatwoot (WhatsApp, IG, FB, Telegram, Email, Website) dan melakukan 6-Tier PURI AI Routing otomatis.',
    supported_channels: [
      'whatsapp',
      'instagram',
      'facebook',
      'twitter',
      'telegram',
      'website',
      'email',
    ],
  });
}
