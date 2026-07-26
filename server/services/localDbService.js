/**
 * ============================================================================
 * LOCAL PERSISTENT DATABASE SERVICE (HYBRID DISK + CLOUD FIRESTORE)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Ensures 100% data persistence for Knowledge Base documents and FAQ Cache
 * even when Cloud Firestore is offline or operating in Local 0-Token mode.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const RAG_DB_FILE = path.join(DATA_DIR, 'puri_rag_db.json');
const FAQ_DB_FILE = path.join(DATA_DIR, 'puri_faq_db.json');
const LOG_DB_FILE = path.join(DATA_DIR, 'puri_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalDBService {
  constructor() {
    this.ensureDbFiles();
  }

  /**
   * Initialize the local database (ensures data dir and files exist)
   */
  async init() {
    this.ensureDbFiles();
    console.log('[LocalDB] Database lokal diinisialisasi.');
  }

  ensureDbFiles() {
    if (!fs.existsSync(RAG_DB_FILE)) {
      fs.writeFileSync(RAG_DB_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(FAQ_DB_FILE)) {
      fs.writeFileSync(FAQ_DB_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(LOG_DB_FILE)) {
      fs.writeFileSync(LOG_DB_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  // RAG DOCUMENTS LOCAL DB
  readRAGDocs() {
    try {
      if (!fs.existsSync(RAG_DB_FILE)) return [];
      const raw = fs.readFileSync(RAG_DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[LocalDB] Error reading RAG DB file:', err.message);
      return [];
    }
  }

  saveRAGDoc(docItem) {
    try {
      const docs = this.readRAGDocs();
      const index = docs.findIndex((d) => d.id === docItem.id);
      if (index !== -1) {
        docs[index] = docItem;
      } else {
        docs.unshift(docItem);
      }
      fs.writeFileSync(RAG_DB_FILE, JSON.stringify(docs, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[LocalDB] Error saving RAG Doc to file:', err.message);
      return false;
    }
  }

  // FAQ CACHE LOCAL DB
  readFAQEntries() {
    try {
      if (!fs.existsSync(FAQ_DB_FILE)) return [];
      const raw = fs.readFileSync(FAQ_DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[LocalDB] Error reading FAQ DB file:', err.message);
      return [];
    }
  }

  saveFAQEntry(entryItem) {
    try {
      const faqs = this.readFAQEntries();
      const index = faqs.findIndex((f) => f.queryKey === entryItem.queryKey);
      if (index !== -1) {
        faqs[index] = entryItem;
      } else {
        faqs.unshift(entryItem);
      }
      fs.writeFileSync(FAQ_DB_FILE, JSON.stringify(faqs, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[LocalDB] Error saving FAQ entry to file:', err.message);
      return false;
    }
  }

  // LOG PERSISTENCE
  /**
   * Save a log entry to local disk
   * @param {string} event - Log event name
   * @param {string} details - Log details
   * @param {string} [level] - Log level (info/warn/error)
   */
  async saveLog(event, details, level = 'info') {
    try {
      let logs = [];
      if (fs.existsSync(LOG_DB_FILE)) {
        const raw = fs.readFileSync(LOG_DB_FILE, 'utf8');
        logs = JSON.parse(raw);
      }
      logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event,
        details,
        level,
      });
      // Keep max 500 logs
      if (logs.length > 500) {
        logs = logs.slice(0, 500);
      }
      fs.writeFileSync(LOG_DB_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (err) {
      // Silent fail — logging should not crash the server
    }
  }

  getLogs() {
    try {
      if (!fs.existsSync(LOG_DB_FILE)) return [];
      const raw = fs.readFileSync(LOG_DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[LocalDB] Error reading Logs DB file:', err.message);
      return [];
    }
  }
}

module.exports = new LocalDBService();
