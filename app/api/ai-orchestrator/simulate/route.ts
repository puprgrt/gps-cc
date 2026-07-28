import { NextRequest, NextResponse } from 'next/server';
import aiOrchestrator from '@/server/core/AIOrchestrator';
import { validateApiRequest } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai-orchestrator/simulate
 * Simulates an incoming citizen message through PURI Multi-Modal AI Orchestrator 2026.
 * Returns the generated AI reply, model selected, latency, and 6-Tier Hierarchical Routing decision.
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, payload } = await validateApiRequest(req, {
      requireSignature: false, // Internal simulate API doesn't use webhooks
      rateLimitMaxRequests: 30, // 30 req/min for simulations
    });
    if (errorResponse) return errorResponse;

    const { text, forceCategory } = payload;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Teks pesan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const result = await aiOrchestrator.processMessage({
      conversationId: `sim-${Date.now()}`,
      senderName: 'Warga Simulasi',
      userText: text,
      forceCategory: forceCategory || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal mengeksekusi simulasi PURI AI Orchestrator';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
