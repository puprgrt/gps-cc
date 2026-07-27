/**
 * ============================================================================
 * SMART PUBLIC SERVICE PERFORMANCE MANAGEMENT SYSTEM (SPMS)
 * Domain Models & Type Definitions
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Sistem penilaian pelayanan publik yang objektif, transparan, real-time,
 * berbasis data, dan berorientasi peningkatan kualitas layanan.
 */

import type { BidangPUPR } from './aiRouting';

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

/**
 * 10 Jenis Layanan yang dinilai dalam SPMS
 */
export type LayananType =
  | 'KRK'
  | 'PKKPR'
  | 'PEIL_BANJIR'
  | 'IRIGASI'
  | 'RUMIJA'
  | 'SITEPLAN'
  | 'PBG'
  | 'SLF'
  | 'PENGADUAN'
  | 'INFORMASI_PUBLIK';

/**
 * Grade Smart Service Score
 */
export type SSSGrade = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Kategori Sentimen
 */
export type SentimentCategory = 'POSITIF' | 'NETRAL' | 'NEGATIF';

/**
 * Tingkat Peringatan Early Warning
 */
export type WarningLevel = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Tipe Peringatan Early Warning
 */
export type WarningType =
  | 'SLA_BREACH'
  | 'SENTIMENT_NEGATIVE'
  | 'COMPLAINT_SURGE'
  | 'OPERATOR_OVERLOAD'
  | 'SATISFACTION_DROP';

/**
 * Kategori Rekomendasi AI
 */
export type RecommendationCategory =
  | 'STAFFING'
  | 'FAQ_UPDATE'
  | 'SOP_REVISION'
  | 'SOCIALIZATION'
  | 'TRAINING'
  | 'PROCESS_IMPROVEMENT';

/**
 * Prioritas Rekomendasi AI
 */
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Kanal Survei
 */
export type SurveyChannel = 'WHATSAPP' | 'EMAIL' | 'WEBSITE' | 'QR_CODE' | 'SMS';

/**
 * Status Survei
 */
export type SurveyStatus = 'SENT' | 'OPENED' | 'COMPLETED' | 'EXPIRED';

/**
 * Periode Filter
 */
export type SPMSPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

// ============================================================================
// CORE KPI METRICS
// ============================================================================

/**
 * 10 KPI Utama SPMS
 */
export interface SPMSMetrics {
  /** KPI 1: Indeks Kepuasan Masyarakat (0-100) */
  ikm: number;
  ikmLabel: string; // "Sangat Baik", "Baik", "Cukup", "Kurang"

  /** KPI 2: SLA Compliance Rate (%) */
  slaCompliance: number;
  slaOnTime: number;
  slaAlmostLate: number;
  slaLate: number;
  slaAvgDays: number;

  /** KPI 3: First Response Time (menit) */
  firstResponseTime: number;

  /** KPI 4: Resolution Time (jam) */
  resolutionTime: number;

  /** KPI 5: AI Response Rate (%) */
  aiResponseRate: number;

  /** KPI 6: Human Intervention Rate (%) */
  humanInterventionRate: number;

  /** KPI 7: Knowledge Accuracy (%) */
  knowledgeAccuracy: number;

  /** KPI 8: Sentiment Index */
  sentimentPositif: number;
  sentimentNetral: number;
  sentimentNegatif: number;

  /** KPI 9: Net Promoter Score (-100 to 100) */
  nps: number;
  npsPromoters: number;
  npsPassives: number;
  npsDetractors: number;

  /** KPI 10: Complaint Resolution Rate (%) */
  complaintResolutionRate: number;
  totalComplaints: number;
  resolvedComplaints: number;

  /** Metadata */
  period: SPMSPeriod;
  lastUpdatedAt: string;
}

// ============================================================================
// SMART SERVICE SCORE (SSS)
// ============================================================================

/**
 * Komponen SSS dengan bobot
 */
export interface SSSComponent {
  name: string;
  label: string;
  weight: number;    // bobot persentase (0-100)
  score: number;     // skor mentah (0-100)
  weighted: number;  // skor terbobot
}

/**
 * Smart Service Score — Skor Komposit Utama
 */
export interface SmartServiceScore {
  totalScore: number;
  grade: SSSGrade;
  gradeLabel: string;
  components: SSSComponent[];
  previousScore: number;
  trend: number; // persentase perubahan
  calculatedAt: string;
}

// ============================================================================
// BIDANG PERFORMANCE
// ============================================================================

/**
 * Kinerja per Bidang PUPR
 */
export interface BidangPerformance {
  id: string;
  bidang: BidangPUPR;
  bidangLabel: string;
  jumlahLayanan: number;
  jumlahPengaduan: number;
  slaCompliance: number;
  nilaiKepuasan: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  totalPermohonan: number;
  totalSelesai: number;
  trendBulanan: number[];  // 12 bulan terakhir
}

// ============================================================================
// OPERATOR PERFORMANCE
// ============================================================================

/**
 * Kinerja per Operator
 */
export interface OperatorPerformance {
  id: string;
  name: string;
  bidang: BidangPUPR;
  bidangLabel: string;
  avatarUrl?: string;
  jumlahTiket: number;
  jumlahSelesai: number;
  avgResponseTime: number;   // menit
  avgResolutionTime: number; // jam
  tingkatKepuasan: number;   // 0-100
  jumlahKoreksiAI: number;
  tingkatPemanfaatanAI: number; // %
  kepatuhanSOP: number;      // %
  rank: number;
}

// ============================================================================
// AI PERFORMANCE (PURI)
// ============================================================================

/**
 * AI Service Quality Index (ASQI)
 */
export interface AIPerformance {
  /** Akurasi klasifikasi intent (%) */
  classificationAccuracy: number;
  /** Akurasi jawaban AI (%) */
  answerAccuracy: number;
  /** Tingkat keberhasilan routing (%) */
  routingSuccessRate: number;
  /** Confidence rata-rata (0-100) */
  averageConfidence: number;
  /** Persentase jawaban otomatis (%) */
  autoAnswerRate: number;
  /** Jumlah eskalasi ke operator */
  escalationCount: number;
  /** Total requests */
  totalRequests: number;
  /** Avg response time (ms) */
  avgResponseTimeMs: number;
  /** Knowledge base utilization (%) */
  kbUtilization: number;
  /** User satisfaction with AI (0-100) */
  userSatisfaction: number;
  /** ASQI composite score (0-100) */
  asqiScore: number;
}

// ============================================================================
// SURVEY / SURVEI KEPUASAN
// ============================================================================

/**
 * 10 Dimensi Penilaian Survei
 */
export interface SurveyDimension {
  id: string;
  dimensi: string;
  label: string;
  avgScore: number;  // 1-5
  totalResponses: number;
}

/**
 * Respons Survei Individual
 */
export interface SurveyResponse {
  id: string;
  respondentName?: string;
  respondentPhone?: string;
  layanan: LayananType;
  channel: SurveyChannel;
  status: SurveyStatus;
  dimensions: Record<string, number>; // dimensi → skor (1-5)
  npsScore?: number; // 0-10
  comment?: string;
  sentimen?: SentimentCategory;
  submittedAt: string;
  ticketId?: string;
}

/**
 * Ringkasan Hasil Survei
 */
export interface SurveyResultsSummary {
  totalSent: number;
  totalCompleted: number;
  responseRate: number;
  dimensions: SurveyDimension[];
  avgOverall: number;
  byChannel: Record<SurveyChannel, number>;
  byLayanan: Record<LayananType, number>;
}

/**
 * Data Form Survei Publik (Payload yang dikirim warga)
 */
export interface SurveyFormData {
  respondentName?: string;
  respondentPhone?: string;
  gender?: string; // Jenis Kelamin
  education?: string; // Pendidikan Terakhir
  occupation?: string; // Pekerjaan
  layanan: LayananType | string;
  dimensions: Record<string, number>; // skor per dimensi (1-5)
  npsScore?: number; // 0-10
  comment?: string;
}

/**
 * Konfigurasi field data pribadi yang bisa diaktifkan/nonaktifkan
 */
export interface PersonalDataField {
  id: string;             // e.g. 'respondentName', 'gender', 'education'
  label: string;          // Label yang tampil di form
  isActive: boolean;      // Apakah ditampilkan ke publik
  isRequired: boolean;    // Apakah wajib diisi
  fieldType: 'text' | 'tel' | 'select'; // Jenis input
  options?: string[];     // Opsi untuk tipe 'select'
}

/**
 * Pertanyaan Survei Dinamis
 */
export interface SurveyQuestion {
  id: string;
  label: string;
  isActive: boolean;
  order: number;
}

/**
 * Konfigurasi Survei (Dinamis)
 */
export interface SurveySettings {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  layananOptions: { value: string; label: string; isActive: boolean }[];
  personalDataFields: PersonalDataField[];
  updatedAt: string;
}


// ============================================================================
// EARLY WARNING SYSTEM
// ============================================================================

/**
 * Peringatan Dini
 */
export interface EarlyWarning {
  id: string;
  type: WarningType;
  level: WarningLevel;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  affectedBidang?: BidangPUPR;
  affectedLayanan?: LayananType;
  affectedOperatorId?: string;
  isAcknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// ============================================================================
// AI RECOMMENDATION ENGINE
// ============================================================================

/**
 * Rekomendasi AI
 */
export interface AIRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  actionItems: string[];
  impact: string;
  relatedBidang?: BidangPUPR[];
  relatedLayanan?: LayananType[];
  isImplemented: boolean;
  createdAt: string;
  implementedAt?: string;
}

// ============================================================================
// HEATMAP DATA
// ============================================================================

/**
 * Data Heatmap per Kecamatan
 */
export interface HeatmapKecamatan {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalPengaduan: number;
  totalPermohonan: number;
  tingkatKepuasan: number;
  sebaranLayanan: Partial<Record<LayananType, number>>;
  prioritasTindakLanjut: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// TREND DATA
// ============================================================================

/**
 * Data Tren untuk Chart
 */
export interface SPMSTrendPoint {
  period: string;      // "Jan 2026", "Feb 2026", dll
  ikm: number;
  sla: number;
  nps: number;
  sentiment: number;
  complaints: number;
  permohonan: number;
  selesai: number;
}

// ============================================================================
// AI INSIGHT
// ============================================================================

/**
 * AI-generated Insight
 */
export interface AIInsight {
  id: string;
  text: string;
  category: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'RECOMMENDATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

// ============================================================================
// REWARD & EVALUATION
// ============================================================================

/**
 * Top Performer
 */
export interface TopPerformer {
  id: string;
  name: string;
  bidang: BidangPUPR;
  bidangLabel: string;
  avatarUrl?: string;
  metric: string;
  value: string;
  rank: number;
  achievement: string;
}

// ============================================================================
// SPMS FILTER STATE
// ============================================================================

/**
 * Filter state untuk dashboard
 */
export interface SPMSFilterState {
  period: SPMSPeriod;
  bidang: BidangPUPR | 'ALL';
  layanan: LayananType | 'ALL';
}

// ============================================================================
// SPMS DASHBOARD STATE (untuk Zustand store)
// ============================================================================

/**
 * Complete SPMS Dashboard State
 */
export interface SPMSDashboardState {
  metrics: SPMSMetrics | null;
  sss: SmartServiceScore | null;
  bidangPerformance: BidangPerformance[];
  operatorPerformance: OperatorPerformance[];
  aiPerformance: AIPerformance | null;
  surveyResults: SurveyResultsSummary | null;
  earlyWarnings: EarlyWarning[];
  recommendations: AIRecommendation[];
  heatmapData: HeatmapKecamatan[];
  trendData: SPMSTrendPoint[];
  insights: AIInsight[];
  topOperators: TopPerformer[];
  topBidang: TopPerformer[];
  filters: SPMSFilterState;
  isLoading: boolean;
  error: string | null;
}
