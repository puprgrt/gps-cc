/**
 * ============================================================================
 * CACHE ENGINE SERVICE (0-TOKEN FAST ANSWER)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Provides exact & semantic-lite caching for frequently asked questions (FAQ),
 * reducing API token usage to 0 for repetitive citizen queries.
 */

const localDbService = require('./localDbService');
const supabaseService = require('./supabaseService');

class CacheService {
  constructor() {
    this.cacheMap = new Map();
    this.hitCountTotal = 0;
    this.maxCacheSize = 500;
    this.seedDefaultFaqCache();
    this.loadPersistedFaqEntries();
  }

  loadPersistedFaqEntries() {
    try {
      // 1. Load from Disk Database
      const diskFaqs = localDbService.readFAQEntries();
      for (const faq of diskFaqs) {
        if (faq && faq.queryKey) {
          this.cacheMap.set(faq.queryKey, {
            key: faq.queryKey,
            replyText: faq.replyText,
            category: faq.category || 'CHAT_GENERAL',
            hitCount: faq.hitCount || 1,
            createdAt: faq.createdAt || new Date().toISOString(),
            updatedAt: faq.updatedAt || new Date().toISOString(),
          });
        }
      }

      // 2. Load from Supabase Default Database asynchronously
      if (supabaseService && supabaseService.getAllFAQEntries) {
        supabaseService.getAllFAQEntries().then((cloudFaqs) => {
          if (Array.isArray(cloudFaqs)) {
            for (const cFaq of cloudFaqs) {
              if (cFaq && (cFaq.queryKey || cFaq.key)) {
                const k = cFaq.queryKey || cFaq.key;
                this.cacheMap.set(k, {
                  key: k,
                  replyText: cFaq.replyText,
                  category: cFaq.category || 'CHAT_GENERAL',
                  hitCount: cFaq.hitCount || 1,
                  createdAt: cFaq.createdAt || new Date().toISOString(),
                  updatedAt: cFaq.updatedAt || new Date().toISOString(),
                });
              }
            }
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[CacheService] Could not load persisted FAQ DB:', err.message);
    }
  }

  /**
   * Normalize text for exact matching
   * @param {string} text
   * @returns {string}
   */
  normalizeKey(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if query hits the cache
   * @param {string} userText
   * @returns {{hit: boolean, entry?: {replyText: string, category: string, hitCount: number}}}
   */
  get(userText) {
    const key = this.normalizeKey(userText);
    if (!key) return { hit: false };

    // 1. Exact normalized match
    if (this.cacheMap.has(key)) {
      const entry = this.cacheMap.get(key);
      entry.hitCount += 1;
      entry.updatedAt = new Date().toISOString();
      this.hitCountTotal += 1;
      return { hit: true, entry };
    }

    // 2. Keyword check for canonical common questions
    for (const [cachedKey, entry] of this.cacheMap.entries()) {
      if (key.length > 5 && (key === cachedKey || (key.includes(cachedKey) && cachedKey.length > 10))) {
        entry.hitCount += 1;
        entry.updatedAt = new Date().toISOString();
        this.hitCountTotal += 1;
        return { hit: true, entry };
      }
    }

    return { hit: false };
  }

  /**
   * Put a new answer into cache
   * @param {string} userText
   * @param {string} replyText
   * @param {string} category
   */
  set(userText, replyText, category = 'CHAT_GENERAL') {
    const key = this.normalizeKey(userText);
    if (!key || key.length < 4) return;

    if (this.cacheMap.size >= this.maxCacheSize) {
      // Evict oldest entry
      const firstKey = this.cacheMap.keys().next().value;
      if (firstKey) this.cacheMap.delete(firstKey);
    }

    const entry = {
      key,
      queryKey: key,
      replyText,
      category,
      hitCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cacheMap.set(key, entry);

    // Persist to Hybrid Database (Local Disk DB + Default Supabase DB)
    localDbService.saveFAQEntry(entry);
    if (supabaseService && supabaseService.saveFAQEntry) {
      supabaseService.saveFAQEntry(entry).catch(() => {});
    }
  }

  /**
   * Preload official PUPR Garut FAQ answers for 0-token instant replies
   */
  seedDefaultFaqCache() {
    const defaultFaqs = [
      {
        q: 'apa syarat pbg persetujuan bangunan gedung',
        a: '📋 *Persyaratan PBG (Persetujuan Bangunan Gedung) - Dinas PUPR Garut*:\n\n1. Dokumen Administrasi:\n   • KTP Pemohon & NPWP\n   • Bukti Kepemilikan Tanah (Sertifikat/SHM/AJB)\n   • KRK / PKKPR dari Bidang Penataan Ruang\n2. Dokumen Teknis:\n   • Gambar Arsitektur (Denah, Tampak, Potongan)\n   • Gambar Struktur & Perhitungan Struktur\n   • Gambar Utilitas (MEP)\n\n📌 Pengajuan dilakukan secara daring melalui portal resmi SIMBG (simbg.pu.go.id).',
        cat: 'CHAT_GENERAL',
      },
      {
        q: 'dimana alamat kantor pupr garut alamat dinas pupr garut',
        a: '🏛️ *Alamat Kantor Dinas PUPR Kabupaten Garut*:\n\nJl. Raya Samarang No. 115, Tarogong Kaler, Kabupaten Garut, Jawa Barat.\n🕒 *Jam Pelayanan*: Senin - Jumat (08.00 - 15.30 WIB).',
        cat: 'CHAT_GENERAL',
      },
      {
        q: 'bagaimana cara lapor jalan rusak pengaduan jalan rusak',
        a: '🛣️ *Layanan Pengaduan Jalan Kabupaten (Bidang Bina Marga)*:\n\nSilakan kirimkan laporan Anda dengan format:\n1. *Lokasi Lengkap* (Nama Kampung/Jalan, Desa, Kecamatan)\n2. *Foto Kondisi Jalan/Kerusakan*\n3. *Deskripsi Singkat*\n\nTim Tim Reaksi Cepat (TRC) Bina Marga Dinas PUPR Kabupaten Garut akan segera menindaklanjuti laporan Anda.',
        cat: 'CHAT_GENERAL',
      },
    ];

    for (const faq of defaultFaqs) {
      this.cacheMap.set(faq.q, {
        key: faq.q,
        replyText: faq.a,
        category: faq.cat,
        hitCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  getStats() {
    return {
      totalCachedItems: this.cacheMap.size,
      totalCacheHits: this.hitCountTotal,
    };
  }

  /**
   * Get all cached FAQ items for KB dashboard inspector
   * @returns {Array<{queryKey: string, replyText: string, category: string, hitCount: number, updatedAt: string}>}
   */
  getAllEntries() {
    const list = [];
    for (const [key, val] of this.cacheMap.entries()) {
      list.push({
        queryKey: key,
        replyText: val.replyText,
        category: val.category,
        hitCount: val.hitCount,
        updatedAt: val.updatedAt || val.createdAt,
      });
    }
    return list;
  }
}

module.exports = new CacheService();
