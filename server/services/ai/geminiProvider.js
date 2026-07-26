/**
 * ============================================================================
 * GEMINI AI PROVIDER
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Google Gemini adapter using official @google/genai SDK.
 * Primary choice for reading large PDF documents, RAG synthesis, and Vision.
 * Features automatic fallback between valid Gemini models (gemini-2.0-flash -> gemini-1.5-flash).
 */

const { GoogleGenAI } = require('@google/genai');
const AIProviderInterface = require('./aiProviderInterface');

class GeminiProvider extends AIProviderInterface {
  constructor() {
    super('GEMINI', 'gemini-2.0-flash');
    this.client = null;
  }

  getClient() {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.client;
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const aiClient = this.getClient();
    if (!aiClient) {
      throw new Error('[GEMINI] API Key (GEMINI_API_KEY) is not configured in .env.');
    }

    let primaryModel = options.model || this.defaultModel;
    // Map any legacy/deprecated model names to the latest supported GA model
    if (primaryModel === 'gemini-2.5-flash' || primaryModel === 'gemini-pro') {
      primaryModel = 'gemini-2.0-flash';
    }

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

    // Attempt generation with auto-retry fallback for model compatibility
    const modelsToTry = [...new Set([primaryModel, 'gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05'])];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: contentsPayload,
        });

        const text = response.text || '';
        const latencyMs = Date.now() - start;

        // Estimate tokens (roughly 4 chars per token)
        const estimatedTokens = Math.ceil((enrichedSystemPrompt.length + userText.length + text.length) / 4);

        return {
          text,
          confidence: 96,
          modelName,
          tokensUsed: estimatedTokens,
          latencyMs,
        };
      } catch (err) {
        lastError = err;
        console.warn(`[GEMINI] Model ${modelName} failed: ${err.message}. Trying next fallback model...`);
      }
    }

    if (lastError && this.isRateLimitError(lastError)) {
      lastError.isRateLimit = true;
    }
    throw lastError;
  }
}

module.exports = GeminiProvider;
