import { NextRequest, NextResponse } from 'next/server';
import aiOrchestrator from '@/server/core/AIOrchestrator';

/**
 * POST /api/gemini/assistant
 * Integrated with PURI Multi-Modal AI Orchestrator 2026.
 * Serves web widget & dashboard AI Assistant with 0-Token Cache,
 * RAG First 7 Bidang PUPR, and Cloud -> Local Resilience.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, history } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Include recent history context into prompt text if available
    let combinedText = prompt;
    if (history && Array.isArray(history) && history.length > 0) {
      const recentContext = history
        .slice(-3)
        .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Warga/Admin' : 'PURI'}: ${m.text}`)
        .join('\n');
      combinedText = `[Riwayat Percakapan Sebelumnya]:\n${recentContext}\n\n[Pertanyaan Saat Ini]:\n${prompt}`;
    }

    // Process through PURI Multi-Modal AI Orchestrator 2026
    const result = await aiOrchestrator.processMessage({
      conversationId: `web-assistant-${Date.now()}`,
      senderName: 'Admin / Warga Web',
      userText: combinedText,
    });

    return NextResponse.json({
      text: result.text,
      providerUsed: result.providerUsed,
      modelName: result.modelName,
      isFromCache: result.isFromCache,
      confidenceScore: result.confidenceScore,
      routingDecision: result.routingDecision,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate AI assistant response';
    console.error('PURI Assistant API error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
