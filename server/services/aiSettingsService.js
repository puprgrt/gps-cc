/**
 * ============================================================================
 * AI SETTINGS SERVICE (PURI MULTI-MODEL ORCHESTRATOR 2026)
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Manages configuration and default models for all 5 PURI AI Engines:
 * - GEMINI (Google Gemini 2.0 Flash / 1.5 Flash)
 * - OPENAI (OpenAI GPT-4o-mini / GPT-4o)
 * - DEEPSEEK (DeepSeek Chat / Reasoner)
 * - CLAUDE (Anthropic Claude 3.5 Sonnet / Haiku)
 * - LOCAL_AI (Ollama Qwen 2.5 / Gemma 2 / Llama 3)
 *
 * Employs Hybrid Persistence: Supabase Default DB + Local JSON File Fallback.
 */

const fs = require('fs');
const path = require('path');
const supabaseService = require('./supabaseService');

const LOCAL_FILE_PATH = path.join(__dirname, '../data/puri_ai_settings.json');

const DEFAULT_AI_SETTINGS = {
  GEMINI: {
    provider: 'GEMINI',
    name: 'Google Gemini AI',
    model: 'gemini-2.0-flash',
    isActive: true,
    temperature: 0.7,
    maxTokens: 2048,
    description: 'Membaca PDF Besar, Vision RAG, dan Analisis Konteks Panjang',
  },
  OPENAI: {
    provider: 'OPENAI',
    name: 'OpenAI ChatGPT',
    model: 'gpt-4o-mini',
    isActive: true,
    temperature: 0.7,
    maxTokens: 2048,
    description: 'AI Utama Pelayanan, Percakapan Warga, dan Klasifikasi Domain',
  },
  CLAUDE: {
    provider: 'CLAUDE',
    name: 'Anthropic Claude',
    model: 'claude-3-5-sonnet-20241022',
    isActive: true,
    temperature: 0.5,
    maxTokens: 2048,
    description: 'Penalaran Hukum Perda, Kepatuhan PBG, dan Telaah Dokumen',
  },
  KIMI: {
    provider: 'KIMI',
    name: 'Moonshot Kimi',
    model: 'moonshot-v1-8k',
    isActive: true,
    temperature: 0.6,
    maxTokens: 2048,
    description: 'Coding, IFC/BIM Parser, GIS Spatial, dan Analisis Teknis',
  },
  LOCAL: {
    provider: 'LOCAL',
    name: 'Local AI (Ollama / On-Premise)',
    model: 'qwen2.5:7b',
    isActive: true,
    temperature: 0.5,
    maxTokens: 1024,
    description: 'Ultimate Zero-Cloud Fallback Engine (100% Offline Resilience)',
  },
};

class AISettingsService {
  constructor() {
    this.ensureDataDirectory();
    this.settingsCache = this.loadInitialSettings();
  }

  ensureDataDirectory() {
    const dir = path.dirname(LOCAL_FILE_PATH);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn('[AISettingsService] Failed to create data dir:', err.message);
      }
    }
  }

  loadInitialSettings() {
    let settings = { ...DEFAULT_AI_SETTINGS };
    try {
      if (fs.existsSync(LOCAL_FILE_PATH)) {
        const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          settings = { ...settings, ...parsed };
        }
      }
    } catch (err) {
      console.warn('[AISettingsService] Error reading local settings JSON:', err.message);
    }
    return settings;
  }

  saveToLocalFile(settings) {
    try {
      fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[AISettingsService] Error writing local settings JSON:', err.message);
    }
  }

  /**
   * Get all AI Provider Settings
   */
  async getAllSettings() {
    // Attempt to read from Supabase Default Database first
    try {
      if (supabaseService && supabaseService.supabase) {
        const { data, error } = await supabaseService.supabase
          .from('puri_ai_provider_settings')
          .select('*');

        if (!error && Array.isArray(data) && data.length > 0) {
          const cloudSettings = { ...DEFAULT_AI_SETTINGS };
          for (const row of data) {
            if (row.provider && DEFAULT_AI_SETTINGS[row.provider]) {
              cloudSettings[row.provider] = {
                provider: row.provider,
                name: row.name || DEFAULT_AI_SETTINGS[row.provider].name,
                model: row.model || DEFAULT_AI_SETTINGS[row.provider].model,
                isActive: row.is_active !== false,
                temperature: row.temperature ?? 0.7,
                maxTokens: row.max_tokens ?? 2048,
                description: row.description || DEFAULT_AI_SETTINGS[row.provider].description,
              };
            }
          }
          this.settingsCache = cloudSettings;
          this.saveToLocalFile(cloudSettings);
          return cloudSettings;
        }
      }
    } catch (err) {
      // Graceful fallback if table does not exist or network offline
    }

    return this.settingsCache;
  }

  /**
   * Get setting for a specific provider
   * @param {string} providerName - GEMINI | OPENAI | DEEPSEEK | CLAUDE | LOCAL_AI
   */
  async getProviderSetting(providerName) {
    const all = await this.getAllSettings();
    return all[providerName] || DEFAULT_AI_SETTINGS[providerName] || null;
  }

  /**
   * Save or update all AI settings
   * @param {Object} updatedSettings - map of provider -> config
   */
  async saveSettings(updatedSettings) {
    const merged = { ...this.settingsCache };
    for (const [provider, conf] of Object.entries(updatedSettings)) {
      if (merged[provider]) {
        merged[provider] = {
          ...merged[provider],
          ...conf,
          provider
        };
      }
    }

    this.settingsCache = merged;
    this.saveToLocalFile(merged);

    // Save to Supabase Default Database
    try {
      if (supabaseService && supabaseService.supabase) {
        const rows = Object.values(merged).map((s) => ({
          provider: s.provider,
          name: s.name,
          model: s.model,
          is_active: s.isActive,
          temperature: s.temperature,
          max_tokens: s.maxTokens,
          description: s.description,
          updated_at: new Date().toISOString()
        }));

        await supabaseService.supabase
          .from('puri_ai_provider_settings')
          .upsert(rows, { onConflict: 'provider' });
      }
    } catch (err) {
      console.warn('[AISettingsService] Could not persist to Supabase:', err.message);
    }

    return merged;
  }
}

module.exports = new AISettingsService();
