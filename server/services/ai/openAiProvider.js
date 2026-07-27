/**
 * ============================================================================
 * OPENAI (CHATGPT) PROVIDER (2026 EDITION)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * OpenAI adapter via standard REST API fetch.
 * Primary AI for general chat, reasoning, and public service conversations.
 *
 * Model Status (Juli 2026):
 * - gpt-4o-mini: ✅ Still active (core model not deprecated)
 * - Some snapshot previews deprecated on July 23, 2026
 *
 * Anti-Limit: Inherits retry, timeout, rate limiter, circuit breaker from base.
 */

const AIProviderInterface = require('./aiProviderInterface');

class OpenAIProvider extends AIProviderInterface {
  constructor() {
    super('OPENAI', 'gpt-4o-mini');
    this.name = 'OpenAI ChatGPT';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('[OPENAI] API Key (OPENAI_API_KEY) is not configured.');
    }

    const modelName = options.model || this.defaultModel;
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';
    const media = payload.media;

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

    if (media && media.base64 && (media.mimetype || '').startsWith('image/')) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userText },
          {
            type: 'image_url',
            image_url: {
              url: `data:${media.mimetype || 'image/jpeg'};base64,${media.base64}`,
            },
          },
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
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options.temperature || 0.4,
          max_tokens: options.maxTokens || 2048,
        }),
        signal: this.createTimeoutSignal(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`[OPENAI] API Request Failed (${response.status}): ${errorText}`);
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
        confidence: 95,
        modelName,
        tokensUsed,
        latencyMs,
      };
    });
  }
}

module.exports = OpenAIProvider;
