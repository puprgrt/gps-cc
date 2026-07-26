/**
 * ============================================================================
 * MOONSHOT KIMI (KIMI CHAT / CODE) PROVIDER
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Moonshot Kimi adapter via standard REST API fetch.
 * Specialized for Coding, IFC/BIM structure analysis, and GIS Technical Docs.
 */

const AIProviderInterface = require('./aiProviderInterface');

class KimiProvider extends AIProviderInterface {
  constructor() {
    super('KIMI', 'moonshot-v1-8k');
    this.apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
    if (!apiKey) {
      throw new Error('[KIMI] API Key (MOONSHOT_API_KEY or KIMI_API_KEY) is not configured.');
    }

    const modelName = options.model || this.defaultModel;
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ];

    try {
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
          max_tokens: options.maxTokens || 1500,
        }),
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
    } catch (error) {
      if (this.isRateLimitError(error)) {
        error.isRateLimit = true;
      }
      throw error;
    }
  }
}

module.exports = KimiProvider;
