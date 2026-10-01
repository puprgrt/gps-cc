/**
 * ============================================================================
 * AI PROVIDER INTERFACE - BASE CLASS WITH ANTI-LIMIT ENGINE (v2)
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
 *
 * v2 Enhancements:
 * 5. Smart Error Classification (billing vs rate-limit vs auth vs transient)
 * 6. Non-retryable error early-exit (billing exhaustion, auth failure, project blocked)
 * 7. Improved half-open circuit breaker with single-probe verification
 * 8. Error type tagging for structured downstream logging
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
    this._isInHalfOpenProbe = false; // Half-open probe guard

    // Error tracking for downstream reporting
    this._lastErrorType = null;
    this._lastErrorMessage = '';
    this._lastErrorTimestamp = 0;
  }

  /**
   * Check if this provider has necessary API keys or configuration
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }

  // =========================================================================
  // ANTI-LIMIT: Circuit Breaker (Enhanced v2)
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
      // Cooldown period expired → transition to half-open state
      // In half-open: allow exactly ONE probe request to verify recovery
      if (!this._isInHalfOpenProbe) {
        this._isInHalfOpenProbe = true;
        console.info(
          `[${this.providerName}] Circuit breaker cooldown expired. ` +
          `Transitioning to HALF-OPEN state (single probe allowed).`
        );
        return false; // Allow the probe request through
      }
      // If another request comes while probe is in-flight, block it
      return true;
    }
    return true;
  }

  /**
   * Record a successful request (resets circuit breaker fully)
   */
  recordSuccess() {
    const wasDegraded = this._consecutiveFailures >= this._circuitBreakerThreshold;
    this._consecutiveFailures = 0;
    this._isInHalfOpenProbe = false;

    if (wasDegraded) {
      console.info(`[${this.providerName}] Circuit breaker CLOSED — provider recovered successfully.`);
    }

    this._lastErrorType = null;
    this._lastErrorMessage = '';
  }

  /**
   * Record a failed request (increments failure counter, may trip circuit breaker)
   * @param {Error} [error] - The error that caused the failure
   */
  recordFailure(error) {
    this._consecutiveFailures += 1;
    this._lastErrorTimestamp = Date.now();

    if (error) {
      this._lastErrorType = this._classifyErrorType(error);
      this._lastErrorMessage = error.message || '';
    }

    // If we were in half-open probe and it failed, re-open circuit with extended cooldown
    if (this._isInHalfOpenProbe) {
      this._isInHalfOpenProbe = false;
      this._circuitOpenedAt = Date.now();
      // Double the cooldown after failed half-open probe (max 5 minutes)
      const extendedCooldown = Math.min(this._circuitBreakerCooldownMs * 2, 300000);
      console.warn(
        `[${this.providerName}] Half-open probe FAILED. ` +
        `Re-opening circuit breaker with extended cooldown: ${Math.ceil(extendedCooldown / 1000)}s`
      );
      this._circuitBreakerCooldownMs = extendedCooldown;
      return;
    }

    if (this._consecutiveFailures >= this._circuitBreakerThreshold) {
      this._circuitOpenedAt = Date.now();
      console.warn(
        `[${this.providerName}] Circuit breaker OPENED after ${this._consecutiveFailures} consecutive failures. ` +
        `Cooldown: ${this._circuitBreakerCooldownMs / 1000}s ` +
        `(Error type: ${this._lastErrorType || 'unknown'})`
      );
    }
  }

  /**
   * Get circuit breaker status info
   * @returns {{ isOpen: boolean, consecutiveFailures: number, cooldownRemainingMs: number, lastErrorType: string|null, isHalfOpen: boolean }}
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
      lastErrorType: this._lastErrorType,
      lastErrorMessage: this._lastErrorMessage,
      isHalfOpen: this._isInHalfOpenProbe,
    };
  }

  /**
   * Manually reset circuit breaker (e.g., after admin fixes API key)
   */
  resetCircuitBreaker() {
    this._consecutiveFailures = 0;
    this._circuitOpenedAt = 0;
    this._isInHalfOpenProbe = false;
    this._circuitBreakerCooldownMs = 60000; // Reset to default cooldown
    this._lastErrorType = null;
    this._lastErrorMessage = '';
    console.info(`[${this.providerName}] Circuit breaker manually RESET by admin.`);
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
  // ANTI-LIMIT: Exponential Backoff Retry Wrapper (Enhanced v2)
  // =========================================================================

  /**
   * Execute a function with automatic retry on rate limit / transient errors.
   * v2: Early-exits on billing, authentication, and project-blocked errors.
   *
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
      err.errorType = 'CIRCUIT_OPEN';
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

        // ★ v2: Classify error and tag it for downstream use
        const errorType = this._classifyErrorType(error);
        error.errorType = errorType;

        // ★ v2: NON-RETRYABLE errors — exit immediately without burning retries
        if (this.isBillingError(error)) {
          error.isBillingExhausted = true;
          console.warn(
            `[${this.providerName}] BILLING/CREDIT EXHAUSTED — skipping retries (non-retryable). ` +
            `Error: ${error.message.substring(0, 150)}`
          );
          this.recordFailure(error);
          throw error;
        }

        if (this.isAuthenticationError(error)) {
          error.isAuthError = true;
          console.warn(
            `[${this.providerName}] AUTHENTICATION FAILED — skipping retries (non-retryable). ` +
            `Error: ${error.message.substring(0, 150)}`
          );
          this.recordFailure(error);
          throw error;
        }

        if (this.isProjectBlockedError(error)) {
          error.isProjectBlocked = true;
          console.warn(
            `[${this.providerName}] PROJECT BLOCKED/DENIED — skipping retries (non-retryable). ` +
            `Error: ${error.message.substring(0, 150)}`
          );
          this.recordFailure(error);
          throw error;
        }

        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt >= maxRetries;

        if (!isRetryable || isLastAttempt) {
          // Not retryable or exhausted retries
          this.recordFailure(error);

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
    this.recordFailure(lastError);
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
   * @returns {Promise<{provider: string, status: 'healthy' | 'degraded' | 'offline' | 'rate_limited' | 'circuit_open' | 'billing_exhausted' | 'auth_error', latencyMs: number}>}
   */
  async checkHealth() {
    // If circuit is open, report immediately without making a request
    if (this.isCircuitOpen()) {
      const status = this.getCircuitBreakerStatus();
      return {
        provider: this.providerName,
        status: status.lastErrorType === 'BILLING_EXHAUSTED' ? 'billing_exhausted'
          : status.lastErrorType === 'AUTH_ERROR' ? 'auth_error'
          : 'circuit_open',
        latencyMs: 0,
        error: `Circuit breaker open. ${status.consecutiveFailures} failures. Cooldown: ${Math.ceil(status.cooldownRemainingMs / 1000)}s`,
        lastErrorType: status.lastErrorType,
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
      let status = 'offline';
      if (this.isBillingError(error)) status = 'billing_exhausted';
      else if (this.isAuthenticationError(error)) status = 'auth_error';
      else if (this.isRateLimitError(error)) status = 'rate_limited';

      return {
        provider: this.providerName,
        status,
        latencyMs: latency,
        error: error.message,
        lastErrorType: error.errorType || this._classifyErrorType(error),
      };
    }
  }

  // =========================================================================
  // Error Classification Helpers (Enhanced v2)
  // =========================================================================

  /**
   * Classify error into a structured type for logging and decision-making
   * @param {Error} error
   * @returns {string} Error type identifier
   */
  _classifyErrorType(error) {
    if (this.isBillingError(error)) return 'BILLING_EXHAUSTED';
    if (this.isAuthenticationError(error)) return 'AUTH_ERROR';
    if (this.isProjectBlockedError(error)) return 'PROJECT_BLOCKED';
    if (this.isRateLimitError(error)) return 'RATE_LIMITED';

    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;

    if (status >= 500) return 'SERVER_ERROR';
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || msg.includes('timeout')) return 'TIMEOUT';
    if (msg.includes('econnrefused') || msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('fetch failed')) return 'NETWORK_ERROR';
    if (msg.includes('overloaded') || status === 529) return 'OVERLOADED';

    return 'UNKNOWN';
  }

  /**
   * ★ NEW v2: Detect billing/credit exhaustion errors (NON-retryable)
   * These errors mean the account has no money — retrying won't help.
   * @param {Error} error
   * @returns {boolean}
   */
  isBillingError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;

    return (
      msg.includes('credit_balance_exhausted') ||
      msg.includes('credit balance is too low') ||
      msg.includes('insufficient_quota') ||
      msg.includes('exceeded your current quota') ||
      msg.includes('check your plan and billing') ||
      msg.includes('no credits remaining') ||
      msg.includes('billing_not_active') ||
      msg.includes('billing account') ||
      msg.includes('payment required') ||
      (status === 402) || // 402 Payment Required
      // OpenAI returns 429 for credit exhaustion, but with specific messages
      (status === 429 && (msg.includes('credit') || msg.includes('quota') || msg.includes('insufficient')))
    );
  }

  /**
   * ★ NEW v2: Detect authentication/authorization errors (NON-retryable)
   * These errors mean the API key is invalid/expired — retrying won't help.
   * @param {Error} error
   * @returns {boolean}
   */
  isAuthenticationError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;

    return (
      status === 401 ||
      msg.includes('invalid_authentication') ||
      msg.includes('invalid api key') ||
      msg.includes('invalid_api_key') ||
      msg.includes('api key not valid') ||
      msg.includes('unauthorized') ||
      msg.includes('authentication_error')
    );
  }

  /**
   * ★ NEW v2: Detect project-level blocked errors (NON-retryable)
   * These errors mean the entire GCP project or account is blocked.
   * All models under the same project will fail — no point trying alternatives.
   * @param {Error} error
   * @returns {boolean}
   */
  isProjectBlockedError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;

    return (
      msg.includes('project has been denied access') ||
      msg.includes('denied access') ||
      (status === 403 && (
        msg.includes('permission_denied') ||
        msg.includes('denied') ||
        msg.includes('project.*disabled') ||
        msg.includes('forbidden')
      )) ||
      (msg.includes('403') && (msg.includes('denied') || msg.includes('permission_denied') || msg.includes('forbidden')))
    );
  }

  /**
   * Helper method to classify if an error is a Rate Limit / Quota error (429)
   * v2: Now excludes billing errors (which are also 429 but non-retryable)
   * @param {Error} error
   * @returns {boolean}
   */
  isRateLimitError(error) {
    // ★ v2: Billing errors should NOT be classified as rate-limit
    if (this.isBillingError(error)) return false;

    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.response?.status;
    return (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted')
    );
  }

  /**
   * Determine if an error is retryable (rate limit, server error, timeout, network)
   * v2: Billing, auth, and project-blocked errors are NOT retryable
   * @param {Error} error
   * @returns {boolean}
   */
  isRetryableError(error) {
    // ★ v2: Non-retryable error classes — exit immediately
    if (this.isBillingError(error)) return false;
    if (this.isAuthenticationError(error)) return false;
    if (this.isProjectBlockedError(error)) return false;

    // Rate limit errors (true 429, not billing) are retryable
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
