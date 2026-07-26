/**
 * ============================================================================
 * OPENAI (CHATGPT FREE / GPT-5.6 TERRA COMPATIBLE) PROVIDER
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * OpenAI adapter via standard REST API fetch.
 * Primary AI for general chat, reasoning, and public service conversations.
 */

const AIProviderInterface = require('./aiProviderInterface');

class OpenAIProvider extends AIProviderInterface {
  constructor() {
    super('OPENAI', 'gpt-4o-mini'); // Uses fast free-tier compatible OpenAI endpoint by default
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
          temperature: options.temperature || 0.4,
          max_tokens: options.maxTokens || 1024,
        }),
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
        confidence: 95, // ChatGPT Free default baseline confidence
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

module.exports = OpenAIProvider;
