/**
 * ============================================================================
 * MOONSHOT KIMI PROVIDER (2026 EDITION)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Moonshot Kimi adapter via standard REST API fetch.
 * Specialized for Coding, IFC/BIM structure analysis, and GIS Technical Docs.
 *
 * Model Updates (Juli 2026):
 * - moonshot-v1-8k RETIRED (legacy, replaced by Kimi K-series)
 * - Default: kimi-k2.6 (flagship, agentic tasks)
 * - Fallback: kimi-k3 (latest 2.8T params, 1M context)
 *
 * Anti-Limit: Inherits retry, timeout, rate limiter, circuit breaker from base.
 */

const AIProviderInterface = require('./aiProviderInterface');

// Map deprecated Moonshot model IDs to current Kimi equivalents
const MODEL_MIGRATION_MAP = {
  'moonshot-v1-8k': 'kimi-k2.6',
  'moonshot-v1-32k': 'kimi-k2.6',
  'moonshot-v1-128k': 'kimi-k3',
  'kimi-v1': 'kimi-k2.6',
};

class KimiProvider extends AIProviderInterface {
  constructor() {
    super('KIMI', 'kimi-k2.6');
    this.name = 'Moonshot Kimi AI';
    this.apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
  }

  /**
   * Migrate deprecated model names to current GA models
   * @param {string} modelName
   * @returns {string}
   */
  migrateModelName(modelName) {
    const migrated = MODEL_MIGRATION_MAP[modelName];
    if (migrated) {
      console.info(`[KIMI] Auto-migrated deprecated model "${modelName}" → "${migrated}"`);
      return migrated;
    }
    return modelName;
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
    if (!apiKey) {
      throw new Error('[KIMI] API Key (MOONSHOT_API_KEY or KIMI_API_KEY) is not configured.');
    }

    const modelName = this.migrateModelName(options.model || this.defaultModel);
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (payload.conversationHistory && payload.conversationHistory.length > 0) {
      for (const msg of payload.conversationHistory) {
        if (!msg.text) continue;
        messages.push({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      }
    }

    messages.push({ role: 'user', content: userText });

    // Use executeWithRetry for automatic retry + rate limit + circuit breaker
    return this.executeWithRetry(async () => {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options.temperature || 0.2,
          max_tokens: options.maxTokens || 2048,
        }),
        signal: this.createTimeoutSignal(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`[KIMI] API Request Failed (${response.status}): ${errorText}`);
        err.status = response.status;
        if (this.isRateLimitError(err)) {
          err.isRateLimit = true;
        }
        throw err;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const latencyMs = Date.now() - start;
      const tokensUsed = data.usage?.total_tokens || Math.ceil((systemPrompt.length + userText.length + text.length) / 4);

      return {
        text,
        confidence: 96,
        modelName,
        tokensUsed,
        latencyMs,
      };
    });
  }
}

module.exports = KimiProvider;
