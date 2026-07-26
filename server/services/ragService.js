/**
 * ============================================================================
 * RAG FIRST SERVICE (KNOWLEDGE BASE RETRIEVAL)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Pre-retrieves domain knowledge (SOP, Regulations, Perda, Technical Docs)
 * for the 7 official PUPR Garut domains before invoking AI generative models.
 */

const localDbService = require('./localDbService');
const supabaseService = require('./supabaseService');

class RAGService {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.loadPersistedDocuments();
  }

  loadPersistedDocuments() {
    try {
      // 1. Load from Disk Database (Zero-Cloud protection)
      const diskDocs = localDbService.readRAGDocs();
      for (const d of diskDocs) {
        if (!this.knowledgeBase.some((existing) => existing.id === d.id || existing.title === d.title)) {
          this.knowledgeBase.unshift(d);
        }
      }

      // 2. Load from Supabase Default Database asynchronously
      if (supabaseService && supabaseService.getAllRAGDocuments) {
        supabaseService.getAllRAGDocuments().then((cloudDocs) => {
          if (Array.isArray(cloudDocs)) {
            for (const cDoc of cloudDocs) {
              if (!this.knowledgeBase.some((existing) => existing.id === cDoc.id || existing.title === cDoc.title)) {
                this.knowledgeBase.unshift(cDoc);
              }
            }
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[RAGService] Could not load persisted database docs:', err.message);
    }
  }

  /**
   * Retrieves relevant Knowledge Base snippets for the user query
   * @param {string} query
   * @param {string} [bidang] - Optional filter by Bidang PUPR
   * @returns {{found: boolean, snippets: string[], primaryBidang: string}}
   */
  retrieveContext(query, bidang = null) {
    if (!query) return { found: false, snippets: [], primaryBidang: 'SEKRETARIAT' };

    const lowerQuery = query.toLowerCase();
    const matchedSnippets = [];
    let detectedBidang = 'SEKRETARIAT';
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        if (lowerQuery.includes(kw.toLowerCase())) {
          score += 1;
        }
      }

      if (bidang && item.bidang === bidang) {
        score += 2;
      }

      if (score > 0) {
        matchedSnippets.push(`[SOP / Regulasi ${item.bidang} - ${item.title}]: ${item.content}`);
        if (score > highestScore) {
          highestScore = score;
          detectedBidang = item.bidang;
        }
      }
    }

    return {
      found: matchedSnippets.length > 0,
      snippets: matchedSnippets.slice(0, 3),
      primaryBidang: detectedBidang,
    };
  }

  /**
   * Static Knowledge Base rules representing the 7 domains of PUPR Garut
   */
  initializeKnowledgeBase() {
    return [
      {
        bidang: 'PENATAAN_RUANG',
        title: 'KRK dan PKKPR (RTRW & RDTR Kabupaten Garut)',
        keywords: ['krk', 'pkkpr', 'rtrw', 'rdtr', 'zonasi', 'tata ruang', 'siteplan', 'pemanfaatan ruang'],
        content:
          'Keterangan Rencana Kabupaten (KRK) dan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) adalah syarat utama pemanfaatan lahan di Kabupaten Garut sesuai Perda RTRW No. 29 Tahun 2011 dan RDTR yang berlaku. Warga harus melampirkan koordinat poligon lahan dan sertifikat kepemilikan.',
      },
      {
        bidang: 'BANGUNAN_GEDUNG',
        title: 'PBG (Persetujuan Bangunan Gedung) dan SLF',
        keywords: ['pbg', 'slf', 'imb', 'gedung', 'bangunan', 'renovasi', 'sertifikat laik fungsi', 'kontruksi gedung'],
        content:
          'Persetujuan Bangunan Gedung (PBG) menggantikan IMB sesuai PP No. 16 Tahun 2021. Pengajuan PBG wajib melampirkan KRK/PKKPR, gambar arsitektur, perhitungan struktur bangunan, dan diajukan online via SIMBG.',
      },
      {
        bidang: 'BINA_MARGA',
        title: 'Pemeliharaan Jalan Kabupaten dan Jembatan',
        keywords: ['jalan', 'jembatan', 'trotoar', 'aspal', 'berlubang', 'rusak', 'marka', 'bahu jalan', 'longsor'],
        content:
          'Bidang Bina Marga bertanggung jawab atas pemeliharaan dan pembangunan Jalan Kabupaten dan Jembatan di wilayah Kabupaten Garut. Pengaduan jalan berlubang/rusak akan diprioritaskan ke Tim Reaksi Cepat (TRC) Bina Marga dengan SLA awal survei maksimal 2x24 jam.',
      },
      {
        bidang: 'SDA',
        title: 'Irigasi, Drainase, dan Pengendalian Banjir',
        keywords: ['irigasi', 'drainase', 'banjir', 'saluran', 'sungai', 'embung', 'bendung', 'air menggenang'],
        content:
          'Bidang Sumber Daya Air (SDA) mengelola jaringan irigasi kewenangan kabupaten, saluran drainase primer/sekunder, serta normalisasi sungai/saluran pengendalian banjir.',
      },
      {
        bidang: 'AMPL',
        title: 'Air Minum dan Penyehatan Lingkungan (SPAM & Sanitasi)',
        keywords: ['air minum', 'spam', 'air bersih', 'sanitasi', 'limbah', 'septik', 'penyehatan lingkungan', 'mandi cuci kakus'],
        content:
          'Bidang AMPL mengelola Sistem Penyediaan Air Minum (SPAM) perdesaan/perkotaan, pengelolaan limbah domestik, tangki septik komunal, serta prasarana sanitasi permukiman.',
      },
      {
        bidang: 'JASA_KONSTRUKSI',
        title: 'Pembinaan dan Pengawasan Jasa Konstruksi (BUJK)',
        keywords: ['jasa konstruksi', 'sertifikasi', 'pelatihan', 'kontraktor', 'konsultan', 'tenaga ahli', 'bujk'],
        content:
          'Bidang Jasa Konstruksi memberikan pelatihan, pembinaan, serta pengawasan terhadap Badan Usaha Jasa Konstruksi (BUJK) dan sertifikasi tenaga kerja konstruksi di Kabupaten Garut.',
      },
      {
        bidang: 'SEKRETARIAT',
        title: 'Informasi Publik, PPID, dan Administrasi Umum',
        keywords: ['alamat', 'jam pelayanan', 'kantor', 'telepon', 'email', 'surat', 'administrasi', 'ppid', 'informasi', 'bantuan'],
        content:
          'Sekretariat melayani administrasi umum, surat menyurat, layanan Pejabat Pengelola Informasi dan Dokumentasi (PPID), informasi jadwal audiensi, dan kepegawaian dinas.',
      },
    ];
  }

  /**
   * Get all RAG knowledge base documents for 7 PUPR domains
   * @param {string|null} [bidangFilter]
   * @returns {Array<{id?: string, bidang: string, title: string, keywords: string[], content: string, updatedAt?: string}>}
   */
  getAllDocuments(bidangFilter = null) {
    if (!bidangFilter || bidangFilter === 'SEMUA') {
      return this.knowledgeBase;
    }
    return this.knowledgeBase.filter((doc) => doc.bidang === bidangFilter);
  }

  /**
   * Add a new document to RAG KB
   * @param {{bidang: string, title: string, keywords: string[]|string, content: string}} doc
   */
  addDocument(doc) {
    if (!doc.bidang || !doc.title || !doc.content) {
      throw new Error('Bidang, judul, dan isi dokumen wajib diisi.');
    }
    const keywordsArray = Array.isArray(doc.keywords)
      ? doc.keywords
      : (doc.keywords || '').split(',').map((k) => k.trim()).filter(Boolean);

    const newEntry = {
      id: `doc-${Date.now()}`,
      bidang: doc.bidang,
      title: doc.title,
      keywords: keywordsArray,
      content: doc.content,
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeBase.unshift(newEntry);

    // Persist to Hybrid Database (Local Disk DB + Default Supabase DB)
    localDbService.saveRAGDoc(newEntry);
    if (supabaseService && supabaseService.saveRAGDocument) {
      supabaseService.saveRAGDocument(newEntry).catch(() => {});
    }

    return newEntry;
  }
}

module.exports = new RAGService();
