/**
 * ============================================================================
 * SPREADSHEET SERVICE — PURI AI Google Sheets Integration
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Reads data from public Google Spreadsheets (CSV export, no API key needed).
 * Features:
 * - In-memory cache with configurable TTL per spreadsheet
 * - Multi-spreadsheet support (one per layanan)
 * - Search by registration number, keyword, or full scan
 * - Auto-refresh cache on TTL expiry
 */

const supabaseService = require('./supabaseService');

// In-memory cache: Map<spreadsheetId_sheetName, { data: [], fetchedAt: Date, ttl: number }>
const dataCache = new Map();

/**
 * Parse CSV text into array of objects using the header row as keys.
 * Handles quoted fields with commas and newlines.
 * @param {string} csvText
 * @returns {Array<Object>}
 */
function parseCSV(csvText) {
  if (!csvText || !csvText.trim()) return [];

  const lines = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine.trim());
      currentLine = '';
    } else if (char === '\r' && !insideQuotes) {
      // skip CR
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  if (lines.length < 2) return []; // Need at least header + 1 data row

  const headers = parseCsvLine(lines[0]);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    results.push(row);
  }

  return results;
}

/**
 * Parse a single CSV line into fields.
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Build the public CSV export URL for a Google Spreadsheet.
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @returns {string}
 */
function buildCsvUrl(spreadsheetId, sheetName) {
  const encodedSheet = encodeURIComponent(sheetName || 'Sheet1');
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`;
}

/**
 * Fetch spreadsheet data from Google Sheets (public CSV export).
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @returns {Promise<Array<Object>>}
 */
async function fetchSpreadsheetData(spreadsheetId, sheetName) {
  const url = buildCsvUrl(spreadsheetId, sheetName);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PURI-AI-Bot/1.0 GPS-CC',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`[SpreadsheetService] Failed to fetch spreadsheet ${spreadsheetId}/${sheetName}:`, error.message);
    return [];
  }
}

/**
 * Get cached data or fetch fresh from Google Sheets.
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {number} ttlMinutes - Cache TTL in minutes
 * @returns {Promise<Array<Object>>}
 */
async function getCachedData(spreadsheetId, sheetName, ttlMinutes = 15) {
  const cacheKey = `${spreadsheetId}_${sheetName}`;
  const cached = dataCache.get(cacheKey);

  if (cached) {
    const ageMs = Date.now() - cached.fetchedAt;
    if (ageMs < ttlMinutes * 60 * 1000) {
      return cached.data;
    }
  }

  // Fetch fresh data
  const data = await fetchSpreadsheetData(spreadsheetId, sheetName);

  if (data.length > 0) {
    dataCache.set(cacheKey, {
      data,
      fetchedAt: Date.now(),
      ttl: ttlMinutes,
    });
  }

  return data;
}

/**
 * Force refresh cache for a specific spreadsheet or all.
 * @param {string} [spreadsheetId]
 */
async function refreshCache(spreadsheetId) {
  if (spreadsheetId) {
    for (const [key] of dataCache) {
      if (key.startsWith(spreadsheetId)) {
        dataCache.delete(key);
      }
    }
  } else {
    dataCache.clear();
  }
}

/**
 * Normalize a column header to match common patterns.
 * Maps known Indonesian/English header names to canonical keys.
 * @param {string} header
 * @returns {string} canonical key
 */
function normalizeHeader(header) {
  const h = (header || '').toLowerCase().trim();

  if (h.includes('nomor') || h.includes('registrasi') || h.includes('no ') || h.includes('no.') || h === 'no' || h.includes('permohonan')) {
    return 'nomor_registrasi';
  }
  if (h.includes('nama') || h.includes('pemohon') || h.includes('name')) {
    return 'nama_pemohon';
  }
  if (h === 'status' || h.includes('status')) {
    return 'status';
  }
  if (h.includes('tanggal') || h.includes('tgl') || h.includes('date') || h.includes('masuk')) {
    return 'tanggal';
  }
  if (h.includes('keterangan') || h.includes('catatan') || h.includes('note') || h.includes('ket')) {
    return 'keterangan';
  }
  if (h.includes('alamat') || h.includes('lokasi') || h.includes('address')) {
    return 'alamat';
  }
  if (h.includes('bidang') || h.includes('jenis')) {
    return 'bidang';
  }

  return h; // return as-is if no match
}

/**
 * Normalize row data by mapping original column headers to canonical keys.
 * @param {Object} row - Raw row from CSV
 * @param {Object} columnMapping - Optional custom column mapping from config
 * @returns {Object} Normalized row
 */
function normalizeRow(row, columnMapping = {}) {
  const normalized = {};

  for (const [originalKey, value] of Object.entries(row)) {
    // Check custom mapping first
    let canonicalKey = null;
    for (const [canonical, mappedCol] of Object.entries(columnMapping)) {
      if (mappedCol && originalKey.toLowerCase().trim() === mappedCol.toLowerCase().trim()) {
        canonicalKey = canonical;
        break;
      }
    }

    if (!canonicalKey) {
      canonicalKey = normalizeHeader(originalKey);
    }

    normalized[canonicalKey] = value;
    // Also keep original key for transparency
    normalized[`_raw_${originalKey}`] = value;
  }

  return normalized;
}

/**
 * Search ALL active spreadsheets for a registration number.
 * @param {string} nomorRegistrasi - Registration number to search
 * @returns {Promise<{found: boolean, results: Array<{layanan: string, bidang: string, data: Object}>}>}
 */
async function searchByNomor(nomorRegistrasi) {
  if (!nomorRegistrasi || nomorRegistrasi.trim().length < 3) {
    return { found: false, results: [] };
  }

  const configs = await supabaseService.getSpreadsheetConfigs();
  if (!configs || configs.length === 0) {
    return { found: false, results: [] };
  }

  const searchTerm = nomorRegistrasi.trim().toUpperCase();
  const results = [];

  for (const config of configs) {
    if (!config.is_active) continue;

    try {
      const data = await getCachedData(config.spreadsheet_id, config.sheet_name, config.cache_ttl_minutes || 15);

      for (const row of data) {
        const normalizedRow = normalizeRow(row, config.column_mapping || {});

        // Check all fields that might contain a registration number
        const nomorField = normalizedRow.nomor_registrasi || '';

        if (nomorField.toUpperCase().includes(searchTerm) || searchTerm.includes(nomorField.toUpperCase())) {
          results.push({
            layanan: config.layanan_name,
            bidang: config.bidang,
            data: normalizedRow,
          });
        }
      }
    } catch (err) {
      console.warn(`[SpreadsheetService] Error searching spreadsheet "${config.layanan_name}":`, err.message);
    }
  }

  return { found: results.length > 0, results };
}

/**
 * Search by keyword across all active spreadsheets.
 * Useful for finding matching records when user describes their case.
 * @param {string} keyword
 * @param {string} [layananFilter] - Optional filter by layanan name
 * @returns {Promise<{found: boolean, results: Array<{layanan: string, bidang: string, data: Object}>, totalRows: number}>}
 */
async function searchByKeyword(keyword, layananFilter = null) {
  if (!keyword || keyword.trim().length < 2) {
    return { found: false, results: [], totalRows: 0 };
  }

  const configs = await supabaseService.getSpreadsheetConfigs();
  if (!configs || configs.length === 0) {
    return { found: false, results: [], totalRows: 0 };
  }

  const searchTerm = keyword.trim().toLowerCase();
  const results = [];
  let totalRows = 0;

  for (const config of configs) {
    if (!config.is_active) continue;
    if (layananFilter && !config.layanan_name.toLowerCase().includes(layananFilter.toLowerCase())) continue;

    try {
      const data = await getCachedData(config.spreadsheet_id, config.sheet_name, config.cache_ttl_minutes || 15);
      totalRows += data.length;

      for (const row of data) {
        const normalizedRow = normalizeRow(row, config.column_mapping || {});

        // Search across all text fields
        const allText = Object.values(normalizedRow)
          .filter(v => typeof v === 'string' && !v.startsWith('_raw_'))
          .join(' ')
          .toLowerCase();

        if (allText.includes(searchTerm)) {
          results.push({
            layanan: config.layanan_name,
            bidang: config.bidang,
            data: normalizedRow,
          });

          // Limit results per spreadsheet to prevent context overload
          if (results.length >= 5) break;
        }
      }
    } catch (err) {
      console.warn(`[SpreadsheetService] Error keyword-searching spreadsheet "${config.layanan_name}":`, err.message);
    }
  }

  return { found: results.length > 0, results, totalRows };
}

/**
 * Get summary of all active spreadsheets: layanan names and row counts.
 * Used to inform AI about available data sources.
 * @returns {Promise<Array<{layanan: string, bidang: string, rowCount: number}>>}
 */
async function getAvailableLayananSummary() {
  const configs = await supabaseService.getSpreadsheetConfigs();
  if (!configs || configs.length === 0) return [];

  const summaries = [];

  for (const config of configs) {
    if (!config.is_active) continue;

    try {
      const data = await getCachedData(config.spreadsheet_id, config.sheet_name, config.cache_ttl_minutes || 15);
      summaries.push({
        layanan: config.layanan_name,
        bidang: config.bidang,
        rowCount: data.length,
        description: config.description || '',
      });
    } catch (err) {
      summaries.push({
        layanan: config.layanan_name,
        bidang: config.bidang,
        rowCount: 0,
        description: config.description || '',
      });
    }
  }

  return summaries;
}

/**
 * Test connection to a spreadsheet by fetching first few rows.
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @returns {Promise<{success: boolean, headers: string[], sampleRows: Object[], rowCount: number, error?: string}>}
 */
async function testConnection(spreadsheetId, sheetName) {
  try {
    const data = await fetchSpreadsheetData(spreadsheetId, sheetName);

    if (data.length === 0) {
      return { success: false, headers: [], sampleRows: [], rowCount: 0, error: 'Spreadsheet kosong atau tidak dapat diakses. Pastikan spreadsheet sudah dipublikasikan (Share > Anyone with the link).' };
    }

    const headers = Object.keys(data[0]);
    const sampleRows = data.slice(0, 3);

    return {
      success: true,
      headers,
      sampleRows,
      rowCount: data.length,
    };
  } catch (error) {
    return {
      success: false,
      headers: [],
      sampleRows: [],
      rowCount: 0,
      error: `Gagal mengakses spreadsheet: ${error.message}`,
    };
  }
}

/**
 * Format spreadsheet search results into a context block for AI prompt injection.
 * @param {Array<{layanan: string, bidang: string, data: Object}>} results
 * @returns {string}
 */
function formatResultsForAI(results) {
  if (!results || results.length === 0) return '';

  let context = '## DATA STATUS PERMOHONAN DARI SPREADSHEET RESMI\n';
  context += 'Berikut adalah data aktual dari database layanan. Gunakan data ini untuk menjawab pertanyaan warga tentang status permohonan:\n\n';

  for (const result of results) {
    context += `*Layanan:* ${result.layanan} (Bidang: ${result.bidang})\n`;

    const data = result.data;
    if (data.nomor_registrasi) context += `- Nomor Registrasi: ${data.nomor_registrasi}\n`;
    if (data.nama_pemohon) context += `- Nama Pemohon: ${data.nama_pemohon}\n`;
    if (data.status) context += `- Status: ${data.status}\n`;
    if (data.tanggal) context += `- Tanggal: ${data.tanggal}\n`;
    if (data.keterangan) context += `- Keterangan: ${data.keterangan}\n`;
    if (data.alamat) context += `- Alamat/Lokasi: ${data.alamat}\n`;
    if (data.bidang) context += `- Bidang: ${data.bidang}\n`;

    // Include any extra columns not yet mapped
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('_raw_')) continue;
      if (['nomor_registrasi', 'nama_pemohon', 'status', 'tanggal', 'keterangan', 'alamat', 'bidang'].includes(key)) continue;
      if (value && typeof value === 'string' && value.trim()) {
        context += `- ${key}: ${value}\n`;
      }
    }
    context += '\n';
  }

  return context.trim();
}

module.exports = {
  fetchSpreadsheetData,
  getCachedData,
  refreshCache,
  searchByNomor,
  searchByKeyword,
  getAvailableLayananSummary,
  testConnection,
  formatResultsForAI,
  parseCSV,
  // Expose for testing
  normalizeHeader,
  normalizeRow,
  buildCsvUrl,
};
