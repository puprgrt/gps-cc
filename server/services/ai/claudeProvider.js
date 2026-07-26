/**
 * ============================================================================
 * ANTHROPIC CLAUDE PROVIDER (2026 EDITION)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Anthropic Claude adapter via standard REST API fetch.
 * Preferred model for Regulatory Analysis, Policy Compliance, and Summaries.
 *
 * Model Updates (Juli 2026):
 * - claude-3-5-sonnet-20241022 RETIRED (28 Oktober 2025)
 * - Default: claude-sonnet-5 (current GA)
 * - Fallback: claude-haiku-3.5 (fast, lightweight)
 *
 * Anti-Limit: Inherits retry, timeout, rate limiter, circuit breaker from base.
 */

const AIProviderInterface = require('./aiProviderInterface');

// Map deprecated Claude model IDs to current equivalents
const MODEL_MIGRATION_MAP = {
  'claude-3-5-sonnet-20241022': 'claude-sonnet-5',
  'claude-3.5-sonnet': 'claude-sonnet-5',
  'claude-3-sonnet-20240229': 'claude-sonnet-5',
  'claude-3-haiku-20240307': 'claude-haiku-3.5',
  'claude-3-opus-20240229': 'claude-opus-5',
  'claude-3.5-haiku': 'claude-haiku-3.5',
};

class ClaudeProvider extends AIProviderInterface {
  constructor() {
    super('CLAUDE', 'claude-sonnet-5');
    this.name = 'Anthropic Claude AI';
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Migrate deprecated model names to current GA models
   * @param {string} modelName
   * @returns {string}
   */
  migrateModelName(modelName) {
    const migrated = MODEL_MIGRATION_MAP[modelName];
    if (migrated) {
      console.info(`[CLAUDE] Auto-migrated deprecated model "${modelName}" → "${migrated}"`);
      return migrated;
    }
    return modelName;
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('[CLAUDE] API Key (ANTHROPIC_API_KEY) is not configured.');
    }

    const modelName = this.migrateModelName(options.model || this.defaultModel);
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';
    const media = payload.media;

    const messages = [];
    if (media && media.base64 && (media.mimetype || '').startsWith('image/')) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: media.mimetype || 'image/jpeg',
              data: media.base64,
            },
          },
          { type: 'text', text: userText },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    // Use executeWithRetry for automatic retry + rate limit + circuit breaker
    return this.executeWithRetry(async () => {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2025-01-01',
        },
        body: JSON.stringify({
          model: modelName,
          system: systemPrompt,
          messages,
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.3,
        }),
        signal: this.createTimeoutSignal(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`[CLAUDE] API Request Failed (${response.status}): ${errorText}`);
        err.status = response.status;
        if (this.isRateLimitError(err)) {
          err.isRateLimit = true;
        }
        throw err;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const latencyMs = Date.now() - start;
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      return {
        text,
        confidence: 97, // High accuracy on regulatory compliance & formal analysis
        modelName,
        tokensUsed: tokensUsed || Math.ceil((systemPrompt.length + userText.length + text.length) / 4),
        latencyMs,
      };
    });
  }
}

module.exports = ClaudeProvider;
