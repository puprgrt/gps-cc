import { NextResponse } from 'next/server';
import aiOrchestrator from '@/server/core/AIOrchestrator';

/**
 * GET /api/ai-orchestrator/cost
 * Returns cost analytics, token estimations, cache hit ratios,
 * and fallback frequency across all Free Tier & Open Weight models.
 */
export async function GET() {
  try {
    const costMetrics = aiOrchestrator.getCostMetrics();
    return NextResponse.json({
      success: true,
      data: costMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching AI cost metrics';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
