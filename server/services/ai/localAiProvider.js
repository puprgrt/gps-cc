/**
 * ============================================================================
 * LOCAL OPEN-SOURCE MODEL PROVIDER (OLLAMA / vLLM) (2026 EDITION)
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Ultimate fallback provider running open-weight models locally via Ollama or vLLM.
 * Guarantees 100% service uptime with zero cloud rate limit and zero API cost.
 *
 * Model Status (Juli 2026):
 * - qwen2.5:7b: ✅ Open-weight, no limits, always available
 * - Also supports qwen3, llama3.2, deepseek-r1
 *
 * Anti-Limit: Inherits timeout protection from base. No rate limit concern
 * since it runs locally, but timeout protection prevents hanging requests.
 */

const AIProviderInterface = require('./aiProviderInterface');

class LocalAIProvider extends AIProviderInterface {
  constructor() {
    super('LOCAL', 'qwen2.5:7b');
    this.name = 'Local AI Cluster (Ollama)';
    this.baseUrl = process.env.LOCAL_AI_URL || 'http://localhost:11434';
    // Local AI timeout: default 12s, configurable via LOCAL_AI_TIMEOUT_MS
    this.requestTimeoutMs = parseInt(process.env.LOCAL_AI_TIMEOUT_MS, 10) || 12000;
    // Disable circuit breaker for local (it should always be attempted as last resort)
    this._circuitBreakerThreshold = 999;
  }

  isConfigured() {
    // If explicitly disabled via env, do not use
    if (process.env.LOCAL_AI_ENABLED === 'false' || process.env.ENABLE_LOCAL_AI === 'false') {
      return false;
    }
    // Enabled by default as safety fallback, or when LOCAL_AI_URL / LOCAL_AI_ENABLED is defined
    return true;
  }

  /**
   * Fast health check to determine if Ollama service is reachable
   * @returns {Promise<{isOnline: boolean, models?: string[], error?: string}>}
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m) => m.name);
        return { isOnline: true, models };
      }
      return { isOnline: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return { isOnline: false, error: err.message };
    }
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
        content: userText,
        images: [media.base64], // Ollama multi-modal format for vision models
      });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    // Use executeWithRetry with a single retry (local server might just be starting up)
    return this.executeWithRetry(async () => {
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
        signal: this.createTimeoutSignal(),
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
    }, { maxRetries: 1 }); // Only 1 retry for local to avoid long waits
  }
}

module.exports = LocalAIProvider;
