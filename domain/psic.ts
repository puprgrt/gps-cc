/**
 * ============================================================================
 * PURI SOCIAL INTELLIGENCE CENTER (PSIC) - DOMAIN MODELS
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 * 
 * Implementasi domain models murni untuk AI Omnichannel Social Media
 * Command Center (PSIC), mengikuti standar Clean Architecture (Tanpa import third-party).
 * Terintegrasi dengan 6-Tier Hierarchical AI Routing Engine dan 7 Bidang PUPR.
 */

import type { BidangPUPR, TicketPriority, SmartLabelPUPR, AIPuriIntent } from './aiRouting';

/**
 * Kanal Omnichannel PSIC
 */
export type PSICChannelType =
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'telegram'
  | 'google_business'
  | 'website'
  | 'portal_pengaduan'
  | 'email';

/**
 * Skala Sentimen Publik AI
 */
export type PSICSentiment =
  | 'POSITIF'
  | 'NETRAL'
  | 'NEGATIF'
  | 'SANGAT_NEGATIF'
  | 'URGENT';

/**
 * Emosi Publik yang Dikenali oleh Emotion AI
 */
export type PSICEmotion =
  | 'MARAH'
  | 'SENANG'
  | 'KECEWA'
  | 'BINGUNG'
  | 'MENDESAK'
  | 'TERIMA_KASIH';

/**
 * Kategori Smart Feed AI
 */
export type PSICFeedCategory =
  | 'PERTANYAAN'
  | 'PENGADUAN'
  | 'SARAN'
  | 'KRITIK'
  | 'APRESIASI'
  | 'HOAKS'
  | 'SPAM'
  | 'URGENT'
  | 'MEDIA'
  | 'INFLUENCER'
  | 'INTERNAL';

/**
 * Tipe Lampiran Multimodal AI
 */
export type PSICAttachmentType = 'text' | 'image' | 'voice' | 'video' | 'document' | 'link';

/**
 * Status Penyelesaian Percakapan / Tiket PSIC
 */
export type PSICResolutionStatus =
  | 'UNREAD'
  | 'AI_AUTO_RESOLVED'
  | 'WAITING_OPERATOR'
  | 'WAITING_SUPERVISOR_APPROVAL'
  | 'IN_PROGRESS'
  | 'COLLABORATION_MEETING'
  | 'RESOLVED'
  | 'ARCHIVED';

/**
 * Profil Penulis Pesan di Media Sosial
 */
export interface PSICAuthorProfile {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isInfluencer?: boolean;
  isMedia?: boolean;
  followersCount?: number;
}

/**
 * Lokasi Geospasial / Regional Mapping di Kabupaten Garut
 */
export interface PSICLocationMetadata {
  kecamatan?: string;
  desa?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  addressDetail?: string;
}

/**
 * Representasi Percakapan Omnichannel (PSIC Conversation)
 */
export interface PSICConversation {
  id: string;
  channelType: PSICChannelType;
  externalId: string;
  title?: string;
  author: PSICAuthorProfile;
  
  // Klasifikasi AI & 6-Tier Routing
  bidang?: BidangPUPR;
  intent?: AIPuriIntent;
  smartLabel?: SmartLabelPUPR;
  priority: TicketPriority;
  sentiment: PSICSentiment;
  emotion?: PSICEmotion;
  feedCategory: PSICFeedCategory;
  confidenceScore?: number;
  
  // SLA & Lokasi
  status: PSICResolutionStatus;
  slaDeadline?: string; // ISO-8601 UTC
  isSlaBreached: boolean;
  location?: PSICLocationMetadata;
  
  // Analisis Fakta & Duplikasi
  isPotentialFakeNews?: boolean;
  fakeNewsReason?: string;
  isDuplicate?: boolean;
  duplicateReferenceId?: string;
  
  // Integrasi PURI Meet (Jika Ada)
  puriMeetRoomId?: string;
  
  // Timestamps
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Representasi Pesan Individual (PSIC Message)
 */
export interface PSICMessage {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'AI_BOT' | 'OPERATOR' | 'SYSTEM';
  senderName?: string;
  content: string;
  attachmentType: PSICAttachmentType;
  attachmentUrl?: string;
  
  // AI Multimodal Extraction
  voiceTranscription?: string; // Hasil Speech to Text Whisper
  visionAnalysisSummary?: string; // Hasil analisis foto/video Florence-2 / Qwen2.5-VL
  
  // Sentiment & Emotion Score per Pesan
  sentiment?: PSICSentiment;
  emotion?: PSICEmotion;
  
  // AI Draft Reply Info
  isDraft?: boolean;
  draftApprovedBy?: string;
  
  createdAt: string;
}

/**
 * Representasi Isu Publik / Issue Detector (PSIC Issue)
 */
export interface PSICIssue {
  id: string;
  title: string;
  keyword: string;
  bidang: BidangPUPR;
  totalMentions: number;
  timeWindowHours: number;
  sentimentTrend: PSICSentiment;
  isCrisisAlert: boolean; // True jika memenuhi syarat darurat (≥ 200 posting dalam 30 menit)
  affectedKecamatan?: string[];
  status: 'MONITORING' | 'INVESTIGATING' | 'ESCALATED_KADIS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Tiket Kolaboratif Lintas Bidang (AI Collaboration Hub)
 */
export interface PSICSubTask {
  id: string;
  bidang: BidangPUPR;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  assignedOperator?: string;
  completedAt?: string;
}

export interface PSICCollaborationTicket {
  id: string;
  parentConversationId: string;
  title: string;
  summary: string;
  priority: TicketPriority;
  subTasks: PSICSubTask[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Indeks Reputasi Digital Dinas PUPR (AI Reputation Index)
 */
export interface PSICReputationIndex {
  id: string;
  score: number; // 0 - 100
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  slaComplianceRate: number; // Persentase ketepatan SLA (0 - 100)
  totalConversations: number;
  totalResolvedByAI: number;
  totalResolvedByOperator: number;
  periodDate: string; // YYYY-MM-DD
  createdAt: string;
}

/**
 * Matriks KPI per Kanal Omnichannel
 */
export interface PSICKPIMetric {
  channelType: PSICChannelType;
  totalMentions: number;
  totalComments: number;
  responseRate: number; // 0 - 100%
  avgResponseTimeSeconds: number;
  aiResolutionCount: number;
  manualResolutionCount: number;
  satisfactionScore: number; // 0 - 5
  periodDate: string; // YYYY-MM-DD
}
