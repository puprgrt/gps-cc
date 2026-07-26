import { NextResponse } from 'next/server';
import aiOrchestrator from '@/server/core/AIOrchestrator';

/**
 * GET /api/ai-orchestrator/status
 * Returns real-time health checks, latency, and uptime status
 * for all PURI AI Orchestrator models (OpenAI, Gemini, Claude, Kimi, Local AI).
 */
export async function GET() {
  try {
    const healthDashboard = await aiOrchestrator.getHealthDashboard();
    return NextResponse.json({
      success: true,
      data: healthDashboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during AI health check';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
