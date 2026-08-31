/**
 * ============================================================================
 * WHATSAPP CENTER INTEGRATIONS & EXTERNAL GATEWAY - DOMAIN MODELS
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 * 
 * Pure TypeScript interfaces & types (Clean Architecture - No external imports)
 * Kontrak data untuk menyambungkan WhatsApp Command Center ke aplikasi eksternal.
 */

export type WhatsAppIntegrationType =
  | 'CHATWOOT'
  | 'OUTBOUND_WEBHOOK'
  | 'REST_API_KEY'
  | 'TELEGRAM_BRIDGE'
  | 'CUSTOM_AI_GATEWAY'
  | 'SIMBG_CRM'
  | 'GOOGLE_SHEETS';

export type IntegrationConnectionStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'CONFIGURED'
  | 'ERROR'
  | 'TESTING';

export type WebhookEventTrigger =
  | 'message_received'
  | 'message_sent'
  | 'message_status_updated'
  | 'critical_emergency_complaint'
  | 'ai_routing_decision'
  | 'operator_handoff'
  | 'puri_meet_scheduled';

export interface ChatwootIntegrationConfig {
  isActive: boolean;
  baseUrl: string;
  apiAccessToken: string;
  accountId: string;
  inboxId: string;
  syncLabels: boolean;
  syncPrivateNotes: boolean;
  autoAssignOperator: boolean;
  status: IntegrationConnectionStatus;
  lastSyncAt?: string;
  lastErrorMessage?: string;
}

export interface OutboundWebhookConfig {
  id: string;
  name: string;
  targetUrl: string;
  secretToken?: string;
  events: WebhookEventTrigger[];
  customHeaders?: Record<string, string>;
  maxRetries: number;
  timeoutSeconds: number;
  isActive: boolean;
  status: IntegrationConnectionStatus;
  lastTriggeredAt?: string;
  lastStatusCode?: number;
  totalDeliveries: number;
  failedDeliveries: number;
}

export interface RestApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  fullKey?: string; // Hanya terlihat sesaat saat dibuat
  role: 'full_access' | 'send_only' | 'read_only';
  allowedBidang: string[]; // e.g. ['ALL'] or ['BINA_MARGA', 'BANGUNAN_GEDUNG']
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  ipWhitelist?: string[];
}

export interface TelegramBridgeConfig {
  isActive: boolean;
  botToken: string;
  chatId: string;
  channelName: string;
  notifyOnlyCriticalEmergency: boolean;
  includeMediaPreview: boolean;
  status: IntegrationConnectionStatus;
  lastNotificationSentAt?: string;
}

export interface CustomAIGatewayConfig {
  isActive: boolean;
  providerName: string; // e.g. 'Dify.ai', 'Flowise', 'Custom FastAPI', 'LangChain'
  endpointUrl: string;
  apiKey?: string;
  modelName?: string;
  timeoutMs: number;
  fallbackToPuriBuiltin: boolean;
  status: IntegrationConnectionStatus;
}

export interface SimbgCrmBridgeConfig {
  isActive: boolean;
  endpointUrl: string;
  apiKey?: string;
  syncPermohonanPbgSlf: boolean;
  autoSendWaNotificationOnStatusChange: boolean;
  status: IntegrationConnectionStatus;
  lastSyncAt?: string;
}

export interface WhatsAppIntegrationSettings {
  chatwoot: ChatwootIntegrationConfig;
  webhooks: OutboundWebhookConfig[];
  apiKeys: RestApiKeyItem[];
  telegramBridge: TelegramBridgeConfig;
  customAiGateway: CustomAIGatewayConfig;
  simbgBridge: SimbgCrmBridgeConfig;
  updatedAt: string;
  updatedBy?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: WebhookEventTrigger;
  endpointUrl: string;
  httpStatus: number;
  requestPayload: string;
  responseBody: string;
  latencyMs: number;
  isSuccess: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface TestWebhookPayloadInput {
  targetUrl: string;
  event: WebhookEventTrigger;
  secretToken?: string;
  sampleMessageText?: string;
}

export interface TestWebhookResult {
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  errorMessage?: string;
  testedAt: string;
}

export interface IntegrationSummaryOverview {
  totalActiveConnectors: number;
  totalWebhooksSent24h: number;
  webhookSuccessRatePercent: number;
  avgDeliveryLatencyMs: number;
  activeApiKeysCount: number;
  isChatwootConnected: boolean;
  isTelegramBridgeActive: boolean;
}
