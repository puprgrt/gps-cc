/**
 * ============================================================================
 * AI SMART ROUTING ENGINE (PURI) - DOMAIN MODELS
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 * 
 * Implementasi struktur Hierarchical AI Routing Engine:
 * Bidang → Layanan → Jenis Permohonan → Prioritas → Operator → SLA
 */

/**
 * 7 Bidang Utama di Dinas PUPR Kabupaten Garut
 */
export type BidangPUPR =
  | 'SEKRETARIAT'
  | 'PENATAAN_RUANG'
  | 'BANGUNAN_GEDUNG'
  | 'BINA_MARGA'
  | 'SDA'
  | 'JASA_KONSTRUKSI'
  | 'AMPL';

/**
 * Klasifikasi Intent / Jenis Permohonan Warga
 */
export type AIPuriIntent =
  | 'INFORMASI'
  | 'PERSYARATAN'
  | 'STATUS_PERMOHONAN'
  | 'PENGADUAN'
  | 'KONSULTASI'
  | 'PERMOHONAN_BARU'
  | 'PERMOHONAN_DOKUMEN'
  | 'SARAN'
  | 'KRITIK'
  | 'APRESIASI';

/**
 * Tingkat Prioritas Penanganan Tiket
 */
export type TicketPriority = 'RENDAH' | 'NORMAL' | 'TINGGI' | 'KRITIS';

/**
 * Label Pintar (Smart Labels) Layanan PUPR Kabupaten Garut
 */
export type SmartLabelPUPR =
  | 'PBG'
  | 'SLF'
  | 'KRK'
  | 'PKKPR'
  | 'Siteplan'
  | 'Jalan'
  | 'Jembatan'
  | 'Drainase'
  | 'Irigasi'
  | 'SPAM'
  | 'Sanitasi'
  | 'Jasa Konstruksi'
  | 'Administrasi'
  | 'Pengaduan'
  | 'Informasi';

/**
 * Struktur Hasil Klasifikasi Pengaduan (Complaint Classification Schema)
 */
export interface ComplaintClassification {
  jenis: AIPuriIntent;
  bidang: BidangPUPR[];
  kategori: string;
  lokasi?: string;
  prioritas: TicketPriority;
  operatorId?: string;
  sla: string; // contoh: "1 Hari", "3 Jam"
  confidence: number; // 0 - 100
  label: SmartLabelPUPR[];
  isEmergency?: boolean;
  requiresSupervisorValidation?: boolean;
}

/**
 * Profil Operator untuk AI Assignment Engine & Load Balancer
 */
export interface OperatorAssignmentProfile {
  operatorId: string;
  name: string;
  bidang: BidangPUPR;
  status: 'online' | 'busy' | 'offline';
  activeTicketCount: number;
  avgResponseTimeMinutes: number;
  competencyTags: SmartLabelPUPR[];
  resolutionHistoryCount: number;
}

/**
 * Keputusan Routing Hierarkis 6-Tingkat
 * (Bidang → Layanan → Jenis Permohonan → Prioritas → Operator → SLA)
 */
export interface HierarchicalRoutingDecision {
  ticketId: string;
  conversationId: string;
  detectedLanguage: string;
  intent: AIPuriIntent;
  primaryBidang: BidangPUPR;
  secondaryBidang?: BidangPUPR[];
  layanan: string;
  prioritas: TicketPriority;
  assignedOperatorId?: string;
  assignedSupervisorId?: string;
  slaDuration: string;
  confidenceScore: number;
  smartLabels: SmartLabelPUPR[];
  requiresCollab: boolean; // True jika multi-bidang
  isEmergency: boolean;    // True jika pengaduan darurat (Jalan putus, jembatan ambruk, banjir kritis)
  status: 'AUTO_ASSIGNED' | 'SUPERVISOR_VALIDATION' | 'ESCALATED';
  draftResponse?: {
    text: string;
    knowledgeBaseSource?: string;
  };
}

/**
 * Struktur Umpan Balik Koreksi untuk AI Learning Engine
 * Digunakan agar sistem belajar dari koreksi manual oleh operator
 */
export interface AILearningFeedback {
  id: string;
  ticketId: string;
  originalAiDecision: HierarchicalRoutingDecision;
  operatorCorrection: {
    correctedBidang?: BidangPUPR[];
    correctedIntent?: AIPuriIntent;
    correctedPriority?: TicketPriority;
    correctedSla?: string;
    correctedLabel?: SmartLabelPUPR[];
  };
  correctedByOperatorId: string;
  timestamp: Date | number;
  notes?: string;
}
