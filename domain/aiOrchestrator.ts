/**
 * ============================================================================
 * PURI MULTI-MODAL AI ORCHESTRATOR 2026 - DOMAIN MODELS
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Domain types for Multi-Model AI Orchestration, Fallback Circuit Breaker,
 * AI Health Monitoring, Cost Tracking, and 6-Tier Hierarchical Routing.
 */

import type { HierarchicalRoutingDecision } from './aiRouting';

/**
 * Supported AI Providers in PURI AI Orchestrator
 */
export type AIModelProvider = 'OPENAI' | 'GEMINI' | 'CLAUDE' | 'KIMI' | 'LOCAL';

/**
 * Task Categories for Smart Task Distribution
 */
export type AITaskCategory =
  | 'CHAT_GENERAL'
  | 'DOCUMENT_PDF'
  | 'VISION_IMAGE'
  | 'CODING_TECHNICAL'
  | 'REGULATION_LAW'
  | 'SUMMARY'
  | 'CRITICAL_EMERGENCY';

/**
 * Model capabilities and profile metadata
 */
export interface AIModelProfile {
  provider: AIModelProvider;
  modelId: string;
  displayName: string;
  isMultimodal: boolean;
  supportsVision: boolean;
  supportsPdf: boolean;
  maxContextTokens: number;
  isFreeTier: boolean;
  priorityOrder: number;
}

/**
 * Real-time Health Status of an AI Provider
 */
export interface AIProviderHealthStatus {
  provider: AIModelProvider;
  status: 'healthy' | 'degraded' | 'offline' | 'rate_limited';
  latencyMs: number;
  successRate: number;
  lastCheckedAt: string;
  consecutiveErrors: number;
}

/**
 * Cost & Performance Dashboard Metric Record
 */
export interface AICostMetricRecord {
  provider: AIModelProvider;
  totalRequests: number;
  successCount: number;
  fallbackCount: number;
  cacheHitCount: number;
  estimatedTokens: number;
  avgLatencyMs: number;
  updatedAt: string;
}

/**
 * Input request payload for PURI AI Orchestrator
 */
export interface AIOrchestratorRequest {
  ticketId?: string;
  conversationId: string;
  senderName?: string;
  userText: string;
  mediaPayload?: {
    base64?: string;
    mimetype?: string;
    fileName?: string;
    size?: number;
  };
  forceCategory?: AITaskCategory;
  requireConsensus?: boolean;
}

/**
 * Standardized execution result returned by PURI AI Orchestrator
 */
export interface AIOrchestratorResponse {
  text: string;
  providerUsed: AIModelProvider;
  modelName: string;
  isFromCache: boolean;
  confidenceScore: number;
  fallbackHistory: AIModelProvider[];
  routingDecision: HierarchicalRoutingDecision;
  executionTimeMs: number;
  timestamp: string;
}

/**
 * Cache entry structure for 0-token answers
 */
export interface AICacheEntry {
  key: string;
  questionNormalized: string;
  replyText: string;
  bidang?: string;
  category: AITaskCategory;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}
