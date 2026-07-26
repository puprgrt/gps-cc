import { NextRequest, NextResponse } from 'next/server';
import ragService from '@/server/services/ragService';
import cacheService from '@/server/services/cacheService';

/**
 * GET /api/kb
 * Returns all RAG Knowledge Base documents across the 7 PUPR Garut domains
 * and 0-Token semantic FAQ cache entries.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bidang = searchParams.get('bidang') || null;

    const documents = ragService.getAllDocuments(bidang);
    const cachedFaqs = cacheService.getAllEntries ? cacheService.getAllEntries() : [];
    const cacheStats = cacheService.getStats ? cacheService.getStats() : { totalCachedItems: 0, totalCacheHits: 0 };

    return NextResponse.json({
      success: true,
      data: {
        documents,
        cachedFaqs,
        cacheStats,
        domains: [
          'SEKRETARIAT',
          'PENATAAN_RUANG',
          'BANGUNAN_GEDUNG',
          'BINA_MARGA',
          'SDA',
          'AMPL',
          'JASA_KONSTRUKSI',
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve Knowledge Base';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/kb
 * Adds a new SOP / Regulation document to the RAG Knowledge Base.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bidang, title, keywords, content } = body;

    if (!bidang || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Bidang, Judul, dan Konten SOP wajib diisi.' },
        { status: 400 }
      );
    }

    const newDoc = ragService.addDocument({ bidang, title, keywords, content });

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: 'Dokumen berhasil ditambahkan ke RAG Knowledge Base PURI 2026',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save KB document';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
