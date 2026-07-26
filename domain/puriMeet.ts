/**
 * PURI Meet Domain Types
 * Smart Video Conference & Collaboration for GPS-CC
 *
 * Pure TypeScript interfaces — NO external imports allowed
 */

// ============================================================
// ENUMS & LITERAL TYPES
// ============================================================

export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type MeetingType =
  | 'KONSULTASI_PBG'
  | 'KONSULTASI_SLF'
  | 'KONSULTASI_KRK'
  | 'PEMBAHASAN_SITEPLAN'
  | 'RAPAT_INTERNAL'
  | 'RAPAT_KOORDINASI'
  | 'PEMBINAAN_JASA_KONSTRUKSI'
  | 'PENDAMPINGAN_TEKNIS'
  | 'PRESENTASI_BIM'
  | 'REVIEW_DOKUMEN'
  | 'PENDAMPINGAN_MASYARAKAT'
  | 'LAINNYA';

export type MeetingPriority = 'NORMAL' | 'PENTING' | 'MENDESAK';

export type ParticipantRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type BidangPURIMeet =
  | 'SEKRETARIAT'
  | 'PENATAAN_RUANG'
  | 'BANGUNAN_GEDUNG'
  | 'BINA_MARGA'
  | 'SDA'
  | 'JASA_KONSTRUKSI'
  | 'AMPL'
  | 'LINTAS_BIDANG';

// ============================================================
// MEETING LABELS (Bahasa Indonesia)
// ============================================================

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  KONSULTASI_PBG: 'Konsultasi PBG',
  KONSULTASI_SLF: 'Konsultasi SLF',
  KONSULTASI_KRK: 'Konsultasi KRK',
  PEMBAHASAN_SITEPLAN: 'Pembahasan Siteplan',
  RAPAT_INTERNAL: 'Rapat Internal',
  RAPAT_KOORDINASI: 'Rapat Koordinasi',
  PEMBINAAN_JASA_KONSTRUKSI: 'Pembinaan Jasa Konstruksi',
  PENDAMPINGAN_TEKNIS: 'Pendampingan Teknis',
  PRESENTASI_BIM: 'Presentasi BIM',
  REVIEW_DOKUMEN: 'Review Dokumen',
  PENDAMPINGAN_MASYARAKAT: 'Pendampingan Masyarakat',
  LAINNYA: 'Lainnya',
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  SCHEDULED: 'Terjadwal',
  LIVE: 'Berlangsung',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const MEETING_PRIORITY_LABELS: Record<MeetingPriority, string> = {
  NORMAL: 'Normal',
  PENTING: 'Penting',
  MENDESAK: 'Mendesak',
};

export const BIDANG_LABELS: Record<BidangPURIMeet, string> = {
  SEKRETARIAT: 'Sekretariat',
  PENATAAN_RUANG: 'Penataan Ruang',
  BANGUNAN_GEDUNG: 'Bangunan Gedung',
  BINA_MARGA: 'Bina Marga',
  SDA: 'Sumber Daya Air',
  JASA_KONSTRUKSI: 'Jasa Konstruksi',
  AMPL: 'Air Minum & Penyehatan Lingkungan',
  LINTAS_BIDANG: 'Lintas Bidang',
};

// ============================================================
// CORE INTERFACES
// ============================================================

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  priority: MeetingPriority;
  roomId: string;
  description: string;
  scheduledAt: string;       // ISO 8601
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number;   // Estimated duration
  bidang: BidangPURIMeet;
  createdBy: string;
  createdByName: string;
  maxParticipants: number;
  participantCount: number;
  passcode?: string;
  meetingIdDisplay?: string;
  agenda: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  role: ParticipantRole;
  joinedAt: string | null;
  leftAt: string | null;
}

// ============================================================
// STATISTICS & DASHBOARD
// ============================================================

export interface MeetingStats {
  meetingHariIni: number;
  meetingMingguIni: number;
  durasiRataRata: number;    // minutes
  totalPesertaBulanIni: number;
  meetingAktif: number;
  totalMeetingBulanIni: number;
}

// ============================================================
// CREATE / UPDATE PAYLOADS
// ============================================================

export interface CreateMeetingInput {
  title: string;
  type: MeetingType;
  priority: MeetingPriority;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  bidang: BidangPURIMeet;
  maxParticipants: number;
  agenda: string[];
  participants: CreateParticipantInput[];
}

export interface CreateParticipantInput {
  userName: string;
  userEmail: string;
  userPhone: string | null;
  role: ParticipantRole;
}

export interface UpdateMeetingInput {
  title?: string;
  type?: MeetingType;
  priority?: MeetingPriority;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  maxParticipants?: number;
  agenda?: string[];
}

// ============================================================
// FILTERS
// ============================================================

export interface MeetingFilter {
  status: MeetingStatus | 'ALL';
  type: MeetingType | 'ALL';
  bidang: BidangPURIMeet | 'ALL';
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

// ============================================================
// JITSI CONFIGURATION
// ============================================================

export interface JitsiConfig {
  domain: string;
  roomName: string;
  displayName: string;
  email: string;
  subject: string;
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
}

// ============================================================
// WHATSAPP REMINDER
// ============================================================

export interface MeetingReminder {
  meetingId: string;
  meetingTitle: string;
  scheduledAt: string;
  roomId: string;
  participants: Array<{
    name: string;
    phone: string;
  }>;
  reminderSentAt: string | null;
  isReminderSent: boolean;
}
