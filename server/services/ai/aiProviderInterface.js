/**
 * ============================================================================
 * AI PROVIDER INTERFACE - BASE CLASS WITH ANTI-LIMIT ENGINE
 * PURI Multi-Modal AI Orchestrator 2026 - Dinas PUPR Kabupaten Garut
 * ============================================================================
 *
 * Base adapter class for all AI model providers (OpenAI, Gemini, Claude, Kimi, Local).
 * Ensures uniform method signatures for text/vision generation and health checks.
 *
 * Anti-Limit Protection Features:
 * 1. Exponential Backoff Retry (max 3 retries: 1s → 2s → 4s)
 * 2. Request Timeout (30s via AbortController)
 * 3. Client-side Rate Limiter (minimum 200ms between requests)
 * 4. Circuit Breaker (5 consecutive failures → 60s cooldown)
 */

class AIProviderInterface {
  /**
   * @param {string} providerName - Provider code ('OPENAI', 'GEMINI', 'CLAUDE', 'KIMI', 'LOCAL')
   * @param {string} defaultModel - Default model ID
   */
  constructor(providerName, defaultModel) {
    this.providerName = providerName;
    this.name = providerName;
    this.defaultModel = defaultModel;

    // --- Anti-Limit Engine State ---

    // Retry config
    this.maxRetries = 3;
    this.baseRetryDelayMs = 1000; // 1s → 2s → 4s exponential

    // Request timeout config (30 seconds max per request)
    this.requestTimeoutMs = 30000;

    // Client-side rate limiter (minimum 200ms between requests)
    this.minRequestIntervalMs = 200;
    this._lastRequestTimestamp = 0;

    // Circuit breaker state
    this._consecutiveFailures = 0;
    this._circuitBreakerThreshold = 5; // Open circuit after 5 consecutive failures
    this._circuitBreakerCooldownMs = 60000; // 60 seconds cooldown
    this._circuitOpenedAt = 0; // Timestamp when circuit was opened
  }

  // =========================================================================
  // ANTI-LIMIT: Circuit Breaker
  // =========================================================================

  /**
   * Check if circuit breaker is currently open (provider is in cooldown)
   * @returns {boolean}
   */
  isCircuitOpen() {
    if (this._consecutiveFailures < this._circuitBreakerThreshold) {
      return false;
    }
    const elapsed = Date.now() - this._circuitOpenedAt;
    if (elapsed >= this._circuitBreakerCooldownMs) {
      // Cooldown period expired, reset to half-open state
      this._consecutiveFailures = Math.floor(this._circuitBreakerThreshold / 2);
      console.info(`[${this.providerName}] Circuit breaker cooldown expired. Transitioning to half-open state.`);
      return false;
    }
    return true;
  }

  /**
   * Record a successful request (resets circuit breaker)
   */
  recordSuccess() {
    this._consecutiveFailures = 0;
  }

  /**
   * Record a failed request (increments failure counter, may trip circuit breaker)
   */
  recordFailure() {
    this._consecutiveFailures += 1;
    if (this._consecutiveFailures >= this._circuitBreakerThreshold) {
      this._circuitOpenedAt = Date.now();
      console.warn(
        `[${this.providerName}] Circuit breaker OPENED after ${this._consecutiveFailures} consecutive failures. ` +
        `Cooldown: ${this._circuitBreakerCooldownMs / 1000}s`
      );
    }
  }

  /**
   * Get circuit breaker status info
   * @returns {{ isOpen: boolean, consecutiveFailures: number, cooldownRemainingMs: number }}
   */
  getCircuitBreakerStatus() {
    const isOpen = this.isCircuitOpen();
    let cooldownRemainingMs = 0;
    if (isOpen) {
      cooldownRemainingMs = Math.max(
        0,
        this._circuitBreakerCooldownMs - (Date.now() - this._circuitOpenedAt)
      );
    }
    return {
      isOpen,
      consecutiveFailures: this._consecutiveFailures,
      cooldownRemainingMs,
    };
  }

  // =========================================================================
  // ANTI-LIMIT: Client-side Rate Limiter
  // =========================================================================

  /**
   * Enforce minimum interval between requests to avoid flooding the API
   * @returns {Promise<void>}
   */
  async enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - this._lastRequestTimestamp;
    if (elapsed < this.minRequestIntervalMs) {
      const waitMs = this.minRequestIntervalMs - elapsed;
      await this._sleep(waitMs);
    }
    this._lastRequestTimestamp = Date.now();
  }

  // =========================================================================
  // ANTI-LIMIT: Request Timeout via AbortController
  // =========================================================================

  /**
   * Create an AbortSignal with timeout for fetch requests
   * @param {number} [timeoutMs] - Custom timeout override
   * @returns {AbortSignal}
   */
  createTimeoutSignal(timeoutMs) {
    const timeout = timeoutMs || this.requestTimeoutMs;
    return AbortSignal.timeout(timeout);
  }

  // =========================================================================
  // ANTI-LIMIT: Exponential Backoff Retry Wrapper
  // =========================================================================

  /**
   * Execute a function with automatic retry on rate limit / transient errors.
   * @param {() => Promise<T>} fn - The async function to execute
   * @param {Object} [options]
   * @param {number} [options.maxRetries] - Override max retries
   * @param {number} [options.baseDelayMs] - Override base delay
   * @returns {Promise<T>}
   * @template T
   */
  async executeWithRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const baseDelayMs = options.baseDelayMs ?? this.baseRetryDelayMs;

    // 1. Check circuit breaker first
    if (this.isCircuitOpen()) {
      const status = this.getCircuitBreakerStatus();
      const err = new Error(
        `[${this.providerName}] Circuit breaker is OPEN. ` +
        `${status.consecutiveFailures} consecutive failures. ` +
        `Cooldown remaining: ${Math.ceil(status.cooldownRemainingMs / 1000)}s`
      );
      err.isCircuitOpen = true;
      throw err;
    }

    // 2. Enforce client-side rate limit
    await this.enforceRateLimit();

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        // Success! Reset circuit breaker
        this.recordSuccess();
        return result;
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt >= maxRetries;

        if (!isRetryable || isLastAttempt) {
          // Not retryable or exhausted retries
          this.recordFailure();

          if (isLastAttempt && isRetryable) {
            console.warn(
              `[${this.providerName}] Exhausted all ${maxRetries} retries. Last error: ${error.message}`
            );
          }
          throw error;
        }

        // Calculate exponential backoff delay with jitter
        const delayMs = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        console.info(
          `[${this.providerName}] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delayMs)}ms ` +
          `(${this.isRateLimitError(error) ? 'Rate Limited' : 'Transient Error'})`
        );
        await this._sleep(delayMs);
      }
    }

    // Should not reach here, but safety net
    this.recordFailure();
    throw lastError;
  }

  // =========================================================================
  // Abstract Method: generateResponse (must be implemented by subclass)
  // =========================================================================

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

  // =========================================================================
  // Health Check (uses the retry mechanism)
  // =========================================================================

  /**
   * Checks the health and latency of this AI provider.
   * @returns {Promise<{provider: string, status: 'healthy' | 'degraded' | 'offline' | 'rate_limited' | 'circuit_open', latencyMs: number}>}
   */
  async checkHealth() {
    // If circuit is open, report immediately without making a request
    if (this.isCircuitOpen()) {
      const status = this.getCircuitBreakerStatus();
      return {
        provider: this.providerName,
        status: 'circuit_open',
        latencyMs: 0,
        error: `Circuit breaker open. ${status.consecutiveFailures} failures. Cooldown: ${Math.ceil(status.cooldownRemainingMs / 1000)}s`,
      };
    }

    const start = Date.now();
    try {
      await this.generateResponse(
        {
          systemPrompt: 'You are PURI AI.',
          userText: 'ping',
        },
        { maxTokens: 5 }
      );
      const latency = Date.now() - start;
      return {
        provider: this.providerName,
        status: latency < 5000 ? 'healthy' : 'degraded',
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

  // =========================================================================
  // Error Classification Helpers
  // =========================================================================

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
      msg.includes('exhausted') ||
      msg.includes('resource_exhausted')
    );
  }

  /**
   * Determine if an error is retryable (rate limit, server error, timeout, network)
   * @param {Error} error
   * @returns {boolean}
   */
  isRetryableError(error) {
    // Rate limit errors are always retryable
    if (this.isRateLimitError(error)) return true;

    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;

    // Server errors (500, 502, 503, 504) are retryable
    if (status >= 500 && status < 600) return true;

    // Timeout / abort errors
    if (
      error.name === 'AbortError' ||
      error.name === 'TimeoutError' ||
      msg.includes('timeout') ||
      msg.includes('aborted') ||
      msg.includes('abort')
    ) {
      return true;
    }

    // Network errors
    if (
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('network') ||
      msg.includes('fetch failed') ||
      msg.includes('socket hang up')
    ) {
      return true;
    }

    // Overloaded
    if (msg.includes('overloaded') || status === 529) {
      return true;
    }

    return false;
  }

  // =========================================================================
  // Utility
  // =========================================================================

  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = AIProviderInterface;
