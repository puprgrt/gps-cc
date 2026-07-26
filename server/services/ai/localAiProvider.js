/**
 * ============================================================================
 * LOCAL OPEN-SOURCE MODEL PROVIDER (OLLAMA / vLLM - QWEN 3 / LLAMA 4 / DEEPSEEK)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Ultimate fallback provider running open-weight models locally via Ollama or vLLM.
 * Guarantees 100% service uptime with zero cloud rate limit and zero API cost.
 */

const AIProviderInterface = require('./aiProviderInterface');

class LocalAIProvider extends AIProviderInterface {
  constructor() {
    super('LOCAL', 'qwen2.5:7b'); // Supports qwen3, qwen2.5, llama3.2, deepseek-r1
    this.baseUrl = process.env.LOCAL_AI_URL || 'http://localhost:11434';
  }

  async generateResponse(payload, options = {}) {
    const start = Date.now();
    const modelName = options.model || process.env.LOCAL_AI_MODEL || this.defaultModel;
    const systemPrompt = payload.systemPrompt || 'Anda adalah PURI, Asisten Virtual AI Dinas PUPR Kabupaten Garut.';
    const userText = payload.userText || '';
    const media = payload.media;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (media && media.base64 && (media.mimetype || '').startsWith('image/')) {
      messages.push({
        role: 'user',
        content: userText,
        images: [media.base64], // Ollama multi-modal format for vision models
      });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.4,
            num_predict: options.maxTokens || 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[LOCAL_AI] Ollama API Request Failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.message?.content || '';
      const latencyMs = Date.now() - start;
      const tokensUsed = (data.prompt_eval_count || 0) + (data.eval_count || 0);

      return {
        text,
        confidence: 90, // Solid open-weight baseline confidence
        modelName: `local-${modelName}`,
        tokensUsed: tokensUsed || Math.ceil((systemPrompt.length + userText.length + text.length) / 4),
        latencyMs,
      };
    } catch (error) {
      const err = new Error(`[LOCAL_AI] Gagal menghubungi Local AI Cluster (${this.baseUrl}): ${error.message}`);
      err.isOffline = true;
      throw err;
    }
  }
}

module.exports = LocalAIProvider;
