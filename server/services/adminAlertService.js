/**
 * ============================================================================
 * ADMIN ALERT SERVICE (PURI AI ORCHESTRATOR 2026)
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Sends real-time WhatsApp alerts to admin when critical AI infrastructure
 * events occur (all providers down, billing exhausted, auth failures, recovery).
 *
 * Features:
 * - Throttling: Max 1 alert per type per 5 minutes (prevents spam)
 * - Escalation: Re-alerts after 30 minutes of continuous degradation
 * - Recovery Notification: Alerts when services return to normal
 * - Multi-admin support: Sends to all configured admin phone numbers
 * - Structured event logging for audit trail
 */

const ALERT_THROTTLE_MS = 5 * 60 * 1000;     // 5 minutes between same alert type
const ESCALATION_INTERVAL_MS = 30 * 60 * 1000; // Re-alert every 30 minutes if still degraded

/**
 * @typedef {'CRITICAL' | 'WARNING' | 'RECOVERY' | 'INFO'} AlertSeverity
 *
 * @typedef {Object} AlertEvent
 * @property {string} type - Event type identifier
 * @property {AlertSeverity} severity
 * @property {string} message - Human-readable alert message
 * @property {Object} [details] - Additional structured data
 * @property {string} timestamp
 */

class AdminAlertService {
  constructor() {
    /** @type {Map<string, number>} Last alert timestamp per alert type */
    this._lastAlertTimestamps = new Map();

    /** @type {Map<string, number>} Track when degradation started per type */
    this._degradationStartTimes = new Map();

    /** @type {Map<string, number>} Last escalation alert timestamp per type */
    this._lastEscalationTimestamps = new Map();

    /** @type {Array<AlertEvent>} In-memory alert history (max 100) */
    this._alertHistory = [];

    /** @type {Function|null} WhatsApp send function (injected at runtime) */
    this._sendWhatsAppFn = null;

    /** @type {boolean} Whether the system is currently in degraded state */
    this._isSystemDegraded = false;
  }

  // =========================================================================
  // Dependency Injection
  // =========================================================================

  /**
   * Inject WhatsApp send function from WhatsAppClient
   * @param {(jid: string, content: object) => Promise<void>} sendFn
   */
  setWhatsAppSender(sendFn) {
    this._sendWhatsAppFn = sendFn;
  }

  // =========================================================================
  // Core Alert Methods
  // =========================================================================

  /**
   * Send alert when ALL cloud AI providers have failed
   * @param {Object} params
   * @param {string[]} params.failedProviders - List of providers that failed
   * @param {Object<string, string>} params.errorDetails - Provider → error message map
   * @param {string} params.fallbackUsed - Which fallback handled the request
   * @param {number} params.responseTimeMs - Total response time
   */
  async alertAllProvidersDown({ failedProviders, errorDetails, fallbackUsed, responseTimeMs }) {
    const alertType = 'ALL_PROVIDERS_DOWN';

    if (!this._shouldSendAlert(alertType)) return;

    this._startDegradationTracking(alertType);
    this._isSystemDegraded = true;

    const providerSummary = failedProviders
      .map((p) => {
        const err = errorDetails[p] || 'Unknown error';
        const shortErr = this._summarizeError(err);
        return `  ❌ ${p}: ${shortErr}`;
      })
      .join('\n');

    const message =
      `🚨 *ALERT KRITIS - PURI AI ORCHESTRATOR*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ *SEMUA PROVIDER AI CLOUD GAGAL*\n\n` +
      `📋 *Status Provider:*\n${providerSummary}\n\n` +
      `🔄 *Fallback Aktif:* ${fallbackUsed}\n` +
      `⏱️ *Response Time:* ${responseTimeMs}ms\n` +
      `🕐 *Waktu:* ${this._formatTime()}\n\n` +
      `📌 *Dampak:* Warga dilayani oleh sistem fallback lokal.\n` +
      `Kualitas respons mungkin terbatas.\n\n` +
      `🔧 *Tindakan yang Diperlukan:*\n` +
      `  1. Cek saldo/billing di masing-masing provider\n` +
      `  2. Verifikasi API key masih valid\n` +
      `  3. Cek status GCP project (Gemini)\n` +
      `  4. Top-up credit jika diperlukan`;

    await this._dispatchAlert({ type: alertType, severity: 'CRITICAL', message, details: { failedProviders, fallbackUsed } });
  }

  /**
   * Send alert for billing/credit exhaustion on a specific provider
   * @param {Object} params
   * @param {string} params.provider - Provider name (OPENAI, CLAUDE, etc.)
   * @param {string} params.errorMessage - Original error message
   */
  async alertBillingExhausted({ provider, errorMessage }) {
    const alertType = `BILLING_EXHAUSTED_${provider}`;

    if (!this._shouldSendAlert(alertType)) return;

    const billingUrls = {
      OPENAI: 'https://platform.openai.com/settings/organization/billing/',
      CLAUDE: 'https://console.anthropic.com/settings/plans',
      GEMINI: 'https://console.cloud.google.com/billing',
      KIMI: 'https://platform.moonshot.cn/console/account',
    };

    const message =
      `💳 *ALERT BILLING - PURI AI*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Provider *${provider}* kehabisan credit/saldo.\n\n` +
      `📝 Error: ${this._summarizeError(errorMessage)}\n` +
      `🔗 Top-up: ${billingUrls[provider] || 'Cek dashboard provider'}\n` +
      `🕐 Waktu: ${this._formatTime()}`;

    await this._dispatchAlert({ type: alertType, severity: 'WARNING', message, details: { provider } });
  }

  /**
   * Send alert for authentication/permission errors
   * @param {Object} params
   * @param {string} params.provider
   * @param {string} params.errorMessage
   */
  async alertAuthenticationError({ provider, errorMessage }) {
    const alertType = `AUTH_ERROR_${provider}`;

    if (!this._shouldSendAlert(alertType)) return;

    const message =
      `🔑 *ALERT AUTH - PURI AI*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Provider *${provider}* gagal autentikasi.\n\n` +
      `📝 Error: ${this._summarizeError(errorMessage)}\n` +
      `🔧 Aksi: Periksa/perbarui API key di file .env\n` +
      `🕐 Waktu: ${this._formatTime()}`;

    await this._dispatchAlert({ type: alertType, severity: 'WARNING', message, details: { provider } });
  }

  /**
   * Send recovery notification when services are back online
   * @param {Object} params
   * @param {string} params.provider - Provider that recovered
   * @param {number} params.downtimeMs - How long the provider was down
   */
  async alertRecovery({ provider, downtimeMs }) {
    const alertType = 'RECOVERY';

    // Recovery alerts bypass normal throttling but have their own 2-min cooldown
    const lastRecovery = this._lastAlertTimestamps.get(alertType) || 0;
    if (Date.now() - lastRecovery < 2 * 60 * 1000) return;

    this._isSystemDegraded = false;
    this._degradationStartTimes.clear();
    this._lastEscalationTimestamps.clear();

    const downtimeStr = this._formatDuration(downtimeMs);

    const message =
      `✅ *RECOVERY - PURI AI*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Provider *${provider}* kembali online!\n\n` +
      `⏱️ Total downtime: ${downtimeStr}\n` +
      `🕐 Waktu recovery: ${this._formatTime()}\n\n` +
      `Sistem AI PURI kembali beroperasi normal. 🎉`;

    await this._dispatchAlert({ type: alertType, severity: 'RECOVERY', message, details: { provider, downtimeMs } });
  }

  // =========================================================================
  // Escalation Check (called periodically by worker or orchestrator)
  // =========================================================================

  /**
   * Check if any degradation needs escalation re-alert
   * Called by the orchestrator periodically
   */
  async checkAndEscalate() {
    for (const [alertType, startTime] of this._degradationStartTimes.entries()) {
      const elapsed = Date.now() - startTime;
      if (elapsed < ESCALATION_INTERVAL_MS) continue;

      const lastEscalation = this._lastEscalationTimestamps.get(alertType) || 0;
      if (Date.now() - lastEscalation < ESCALATION_INTERVAL_MS) continue;

      this._lastEscalationTimestamps.set(alertType, Date.now());

      const durationStr = this._formatDuration(elapsed);
      const message =
        `🔴 *ESCALATION - PURI AI*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ Sistem masih dalam status *DEGRADED*\n` +
        `sudah *${durationStr}*.\n\n` +
        `Alert type: ${alertType}\n` +
        `🕐 Waktu: ${this._formatTime()}\n\n` +
        `Segera periksa dan top-up credit provider AI.`;

      await this._dispatchAlert({ type: `ESCALATION_${alertType}`, severity: 'CRITICAL', message, details: { alertType, elapsed } });
    }
  }

  // =========================================================================
  // Public Getters
  // =========================================================================

  /**
   * Get current system degradation state
   * @returns {boolean}
   */
  getIsDegraded() {
    return this._isSystemDegraded;
  }

  /**
   * Get alert history for dashboard display
   * @param {number} [limit=20]
   * @returns {AlertEvent[]}
   */
  getAlertHistory(limit = 20) {
    return this._alertHistory.slice(0, limit);
  }

  /**
   * Get degradation duration in ms (0 if not degraded)
   * @returns {number}
   */
  getDegradationDurationMs() {
    const startTime = this._degradationStartTimes.get('ALL_PROVIDERS_DOWN');
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  /**
   * Check throttle: should we send this alert type now?
   * @param {string} alertType
   * @returns {boolean}
   */
  _shouldSendAlert(alertType) {
    const lastSent = this._lastAlertTimestamps.get(alertType) || 0;
    return Date.now() - lastSent >= ALERT_THROTTLE_MS;
  }

  /**
   * Mark degradation start time (idempotent)
   * @param {string} alertType
   */
  _startDegradationTracking(alertType) {
    if (!this._degradationStartTimes.has(alertType)) {
      this._degradationStartTimes.set(alertType, Date.now());
    }
  }

  /**
   * Dispatch alert to all admin phones via WhatsApp + log
   * @param {AlertEvent} alertEvent
   */
  async _dispatchAlert(alertEvent) {
    const fullEvent = {
      ...alertEvent,
      timestamp: new Date().toISOString(),
    };

    // Record in history
    this._alertHistory.unshift(fullEvent);
    if (this._alertHistory.length > 100) this._alertHistory.pop();

    // Update throttle timestamp
    this._lastAlertTimestamps.set(alertEvent.type, Date.now());

    // Log to console with severity-appropriate level
    const logPrefix = `[AdminAlert][${alertEvent.severity}]`;
    if (alertEvent.severity === 'CRITICAL') {
      console.error(`${logPrefix} ${alertEvent.type}`);
    } else if (alertEvent.severity === 'WARNING') {
      console.warn(`${logPrefix} ${alertEvent.type}`);
    } else {
      console.info(`${logPrefix} ${alertEvent.type}`);
    }

    // Send via WhatsApp to all admin phones
    const adminPhones = this._getAdminPhones();
    if (adminPhones.length === 0) {
      console.warn('[AdminAlert] Tidak ada ADMIN_ALERT_PHONE di .env. Alert hanya dicatat di log.');
      return;
    }

    if (!this._sendWhatsAppFn) {
      console.warn('[AdminAlert] WhatsApp sender belum di-inject. Alert hanya dicatat di log.');
      return;
    }

    for (const phone of adminPhones) {
      try {
        const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
        await this._sendWhatsAppFn(jid, { text: alertEvent.message });
      } catch (err) {
        console.warn(`[AdminAlert] Gagal kirim alert ke ${phone}: ${err.message}`);
      }
    }
  }

  /**
   * Get admin phone numbers from environment
   * @returns {string[]}
   */
  _getAdminPhones() {
    const raw = process.env.ADMIN_ALERT_PHONE || '';
    return raw
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length >= 10);
  }

  /**
   * Shorten error message for WhatsApp readability
   * @param {string} errorMessage
   * @returns {string}
   */
  _summarizeError(errorMessage) {
    if (!errorMessage) return 'Unknown';
    const msg = errorMessage.substring(0, 200);
    // Extract the core message from JSON error responses
    const creditMatch = msg.match(/credit[_ ]balance[_ ]exhausted|insufficient[_ ]quota|no credits remaining/i);
    if (creditMatch) return 'Credit/saldo habis';
    const permMatch = msg.match(/permission[_ ]denied|access[_ ]denied|project.*denied/i);
    if (permMatch) return 'Akses project ditolak (PERMISSION_DENIED)';
    const authMatch = msg.match(/invalid[_ ]auth|unauthorized|invalid api key/i);
    if (authMatch) return 'API key tidak valid';
    const balanceMatch = msg.match(/credit balance.*too low/i);
    if (balanceMatch) return 'Saldo credit terlalu rendah';
    return msg.length >= 200 ? msg + '...' : msg;
  }

  /**
   * Format current time for alert display (WIB timezone)
   * @returns {string}
   */
  _formatTime() {
    return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' });
  }

  /**
   * Format duration in ms to human-readable string
   * @param {number} ms
   * @returns {string}
   */
  _formatDuration(ms) {
    if (ms < 60000) return `${Math.round(ms / 1000)} detik`;
    if (ms < 3600000) return `${Math.round(ms / 60000)} menit`;
    return `${(ms / 3600000).toFixed(1)} jam`;
  }
}

module.exports = new AdminAlertService();
