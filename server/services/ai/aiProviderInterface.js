/**
 * ============================================================================
 * AI PROVIDER INTERFACE - BASE CLASS
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Base adapter class for all AI model providers (OpenAI, Gemini, Claude, Kimi, Local).
 * Ensures uniform method signatures for text/vision generation and health checks.
 */

class AIProviderInterface {
  /**
   * @param {string} providerName - Provider code ('OPENAI', 'GEMINI', 'CLAUDE', 'KIMI', 'LOCAL')
   * @param {string} defaultModel - Default model ID
   */
  constructor(providerName, defaultModel) {
    this.providerName = providerName;
    this.defaultModel = defaultModel;
  }

  /**
   * Generates a response from the AI provider.
   * @param {Object} payload
   * @param {string} payload.systemPrompt - System instructions (PURI persona)
   * @param {string} payload.userText - User query text
   * @param {Object} [payload.media] - { base64, mimetype, fileName }
   * @param {Object} [options] - Additional runtime options
   * @returns {Promise<{text: string, confidence: number, modelName: string, tokensUsed: number, latencyMs: number}>}
   */
  async generateResponse(payload, options = {}) {
    throw new Error(`[${this.providerName}] generateResponse() must be implemented by subclass.`);
  }

  /**
   * Checks the health and latency of this AI provider.
   * @returns {Promise<{provider: string, status: 'healthy' | 'degraded' | 'offline', latencyMs: number}>}
   */
  async checkHealth() {
    const start = Date.now();
    try {
      // Small test prompt
      const result = await this.generateResponse({
        systemPrompt: 'You are PURI AI.',
        userText: 'ping',
      }, { timeoutMs: 3000, maxTokens: 5 });
      const latency = Date.now() - start;
      return {
        provider: this.providerName,
        status: latency < 3000 ? 'healthy' : 'degraded',
        latencyMs: latency,
      };
    } catch (error) {
      const latency = Date.now() - start;
      const isLimit = this.isRateLimitError(error);
      return {
        provider: this.providerName,
        status: isLimit ? 'rate_limited' : 'offline',
        latencyMs: latency,
        error: error.message,
      };
    }
  }

  /**
   * Helper method to classify if an error is a Rate Limit / Quota error (429)
   * @param {Error} error
   * @returns {boolean}
   */
  isRateLimitError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;
    return (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('too many requests') ||
      msg.includes('exhausted')
    );
  }
}

module.exports = AIProviderInterface;
