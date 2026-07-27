/**
 * ============================================================================
 * GEMINI AI PROVIDER (2026 EDITION)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Google Gemini adapter using official @google/genai SDK.
 * Primary choice for reading large PDF documents, RAG synthesis, and Vision.
 *
 * Model Updates (Juli 2026):
 * - gemini-2.0-flash DISCONTINUED (1 Juni 2026)
 * - Default: gemini-1.5-flash (GA, stable)
 * - Fallback: gemini-1.5-flash-8b (cost-efficient)
 *
 * Anti-Limit: Inherits retry, timeout, rate limiter, circuit breaker from base.
 */

const { GoogleGenAI } = require('@google/genai');
const AIProviderInterface = require('./aiProviderInterface');

// Map of deprecated/discontinued models to their current replacements
const MODEL_MIGRATION_MAP = {
  'gemini-2.0-flash': 'gemini-1.5-flash',
  'gemini-2.0-flash-lite-preview-02-05': 'gemini-1.5-flash-8b',
  'gemini-2.5-flash': 'gemini-1.5-flash',
  'gemini-2.5-flash-lite': 'gemini-1.5-flash-8b',
  'gemini-pro': 'gemini-1.5-flash',
  'gemini-1.5-flash': 'gemini-1.5-flash',
  'gemini-1.5-pro': 'gemini-1.5-pro',
  'gemini-2.5-flash-preview': 'gemini-1.5-flash',
};

class GeminiProvider extends AIProviderInterface {
  constructor() {
    super('GEMINI', 'gemini-1.5-flash');
    this.name = 'Google Gemini (1.5 Flash)';
    this.client = null;
    this.fallbackModels = ['gemini-1.5-flash-8b', 'gemini-1.5-pro'];
  }

  getClient() {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.client;
  }

  /**
   * Migrate deprecated model names to current GA models
   * @param {string} modelName
   * @returns {string}
   */
  migrateModelName(modelName) {
    const migrated = MODEL_MIGRATION_MAP[modelName];
    if (migrated) {
      console.info(`[GEMINI] Auto-migrated deprecated model "${modelName}" → "${migrated}"`);
      return migrated;
    }
    return modelName;
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const aiClient = this.getClient();
    if (!aiClient) {
      throw new Error('[GEMINI] API Key (GEMINI_API_KEY) is not configured in .env.');
    }

    let primaryModel = this.migrateModelName(options.model || this.defaultModel);
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';
    const media = payload.media;

    // Inject current model identity into System Prompt so AI knows what model it runs on
    const enrichedSystemPrompt =
      systemPrompt +
      `\n\n[PURI SYSTEM METADATA]: Anda saat ini sedang dieksekusi menggunakan Provider [GEMINI] dengan model [${primaryModel}]. Jika pengguna/warga/admin menanyakan "cek model yang digunakan", "pakai model apa", atau "status model", Anda WAJIB menjawab dengan jelas menyebutkan nama model tersebut.`;

    let contentsPayload;
    if (media && media.base64) {
      contentsPayload = [
        {
          role: 'user',
          parts: [
            { text: `${enrichedSystemPrompt}\n\n${userText}` },
            {
              inlineData: {
                data: media.base64,
                mimeType: media.mimetype || 'application/octet-stream',
              },
            },
          ],
        },
      ];
    } else {
      contentsPayload = `${enrichedSystemPrompt}\n\n${userText}`;
    }

    // Fallback chain: primary model → gemini-2.5-flash → gemini-2.5-flash-lite
    const modelsToTry = [...new Set([primaryModel, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        // Use executeWithRetry for automatic retry + rate limit + circuit breaker
        const result = await this.executeWithRetry(async () => {
          const response = await aiClient.models.generateContent({
            model: modelName,
            contents: contentsPayload,
          });

          const text = response.text || '';
          const latencyMs = Date.now() - start;
          const estimatedTokens = Math.ceil((enrichedSystemPrompt.length + userText.length + text.length) / 4);

          return {
            text,
            confidence: 96,
            modelName,
            tokensUsed: estimatedTokens,
            latencyMs,
          };
        });

        return result;
      } catch (err) {
        lastError = err;
        // If circuit breaker is open, don't try other models in this provider
        if (err.isCircuitOpen) {
          throw err;
        }
        console.warn(`[GEMINI] Model ${modelName} failed after retries: ${err.message}. Trying next fallback model...`);
      }
    }

    if (lastError && this.isRateLimitError(lastError)) {
      lastError.isRateLimit = true;
    }
    throw lastError;
  }
}

module.exports = GeminiProvider;
