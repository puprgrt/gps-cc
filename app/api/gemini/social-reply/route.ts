import { NextRequest, NextResponse } from 'next/server';
import aiOrchestrator from '@/server/core/AIOrchestrator';

/**
 * POST /api/gemini/social-reply
 * Integrated with PURI Multi-Modal AI Orchestrator 2026.
 * Generates concise official social media replies for citizen comments/mentions.
 */
export async function POST(req: NextRequest) {
  try {
    const { category, senderName, content, platform } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const customPrompt = `Sebagai Asisten Virtual AI Resmi "PURI" Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut, buatkan draf balasan singkat (1-2 kalimat) untuk komentar masyarakat di kanal ${platform || 'Media Sosial'}.
    
    Kategori Aduan/Pertanyaan: ${category || 'Umum'}
    Nama Pengirim: ${senderName || 'Warga'}
    Pesan Warga: "${content}"
    
    Gunakan bahasa Indonesia yang santun, empati, profesional, serta sesuai regulasi Dinas PUPR Kabupaten Garut.`;

    // Execute via PURI AI Orchestrator
    const result = await aiOrchestrator.processMessage({
      conversationId: `social-${platform || 'web'}-${Date.now()}`,
      senderName: senderName || 'Warga Sosmed',
      userText: customPrompt,
    });

    return NextResponse.json({
      text: result.text,
      providerUsed: result.providerUsed,
      modelName: result.modelName,
      isFromCache: result.isFromCache,
      confidenceScore: result.confidenceScore,
      routingDecision: result.routingDecision,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate social reply';
    console.error('PURI Social Reply API error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
