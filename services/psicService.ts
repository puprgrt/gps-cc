/**
 * ============================================================================
 * PURI SOCIAL INTELLIGENCE CENTER (PSIC) - SERVICE LAYER
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Service layer untuk mengelola data AI Omnichannel Social Media Command
 * Center (PSIC) yang terhubung ke database Supabase dengan graceful fallback.
 */

import { supabase } from '@/lib/supabase';
import type {
  PSICConversation,
  PSICMessage,
  PSICIssue,
  PSICReputationIndex,
  PSICKPIMetric,
  PSICChannelType,
} from '@/domain/psic';
import type { BidangPUPR } from '@/domain/aiRouting';

// ============================================================================
// SAMPLE FALLBACK DATA (Jika Supabase belum diseed / koneksi offline)
// ============================================================================

const DEFAULT_CONVERSATIONS: PSICConversation[] = [
  {
    id: 'conv-ig-101',
    channelType: 'instagram',
    externalId: 'ig_post_001',
    title: 'Laporan Jalan Berlubang Depan Bundaran Simpang Lima Tarogong',
    author: {
      id: 'ig_user_1',
      name: 'Kang Asep Garut',
      username: 'asep_garut99',
      isVerified: false,
      isInfluencer: true,
      followersCount: 15400,
    },
    bidang: 'BINA_MARGA',
    intent: 'PENGADUAN',
    smartLabel: 'Jalan',
    priority: 'TINGGI',
    sentiment: 'NEGATIF',
    emotion: 'MARAH',
    feedCategory: 'PENGADUAN',
    confidenceScore: 97.5,
    status: 'IN_PROGRESS',
    isSlaBreached: false,
    location: {
      kecamatan: 'Tarogong Kidul',
      desa: 'Sukagalih',
      addressDetail: 'Jl. Raya Tarogong Simpang Lima dekat Lampu Merah',
    },
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'conv-wa-102',
    channelType: 'whatsapp',
    externalId: 'wa_chat_002',
    title: 'Pertanyaan Syarat Izin PBG & SLF Rumah Tinggal',
    author: {
      id: 'wa_user_2',
      name: 'Hj. Siti Rahma',
      username: '6281234567890',
      isVerified: true,
      isInfluencer: false,
    },
    bidang: 'BANGUNAN_GEDUNG',
    intent: 'PERSYARATAN',
    smartLabel: 'PBG',
    priority: 'NORMAL',
    sentiment: 'POSITIF',
    emotion: 'SENANG',
    feedCategory: 'PERTANYAAN',
    confidenceScore: 99.1,
    status: 'AI_AUTO_RESOLVED',
    isSlaBreached: false,
    location: {
      kecamatan: 'Garut Kota',
      desa: 'Regol',
    },
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'conv-fb-103',
    channelType: 'facebook',
    externalId: 'fb_comment_003',
    title: 'Gorong-gorong Mampet di Samarang Menyebabkan Genangan',
    author: {
      id: 'fb_user_3',
      name: 'Budi Santoso',
      username: 'budi.santoso.garut',
      isVerified: false,
    },
    bidang: 'SDA',
    intent: 'PENGADUAN',
    smartLabel: 'Drainase',
    priority: 'TINGGI',
    sentiment: 'NEGATIF',
    emotion: 'MENDESAK',
    feedCategory: 'PENGADUAN',
    confidenceScore: 94.2,
    status: 'WAITING_OPERATOR',
    isSlaBreached: false,
    location: {
      kecamatan: 'Samarang',
      desa: 'Samarang',
      addressDetail: 'Dusun Karangmulya dekat SD Negeri Samarang 1',
    },
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 'conv-tiktok-104',
    channelType: 'tiktok',
    externalId: 'tt_video_004',
    title: 'Apresiasi Perbaikan Jembatan Gantung Cimanuk yang Cepat',
    author: {
      id: 'tt_user_4',
      name: 'Garut Pride Official',
      username: 'garut.pride',
      isVerified: true,
      isInfluencer: true,
      followersCount: 89000,
    },
    bidang: 'BINA_MARGA',
    intent: 'APRESIASI',
    smartLabel: 'Jembatan',
    priority: 'NORMAL',
    sentiment: 'POSITIF',
    emotion: 'TERIMA_KASIH',
    feedCategory: 'APRESIASI',
    confidenceScore: 98.8,
    status: 'RESOLVED',
    isSlaBreached: false,
    location: {
      kecamatan: 'Bayongbong',
      desa: 'Banyuresmi',
    },
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'conv-tw-105',
    channelType: 'twitter',
    externalId: 'tw_tweet_005',
    title: 'Tanya Jadwal Pemeliharaan Jalan Raya Wanaja-Cikajang',
    author: {
      id: 'tw_user_5',
      name: 'Warga Garut Selatan',
      username: 'warga_garsel',
      isVerified: false,
    },
    bidang: 'BINA_MARGA',
    intent: 'INFORMASI',
    smartLabel: 'Jalan',
    priority: 'NORMAL',
    sentiment: 'NETRAL',
    emotion: 'BINGUNG',
    feedCategory: 'PERTANYAAN',
    confidenceScore: 92.0,
    status: 'WAITING_SUPERVISOR_APPROVAL',
    isSlaBreached: false,
    location: {
      kecamatan: 'Cikajang',
      desa: 'Cikajang',
    },
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
];

const DEFAULT_MESSAGES: Record<string, PSICMessage[]> = {
  'conv-ig-101': [
    {
      id: 'msg-101-1',
      conversationId: 'conv-ig-101',
      senderType: 'USER',
      senderName: 'Kang Asep Garut',
      content: 'Min @puprgarut, jalan di Raya Tarogong dekat Simpang Lima bolong parah. Udah 2 motor jatuh tadi malam. Tolong dong dinas PU segera tindak lanjuti!',
      attachmentType: 'text',
      sentiment: 'NEGATIF',
      emotion: 'MARAH',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'msg-101-2',
      conversationId: 'conv-ig-101',
      senderType: 'AI_BOT',
      senderName: 'PURI (AI Bot)',
      content: 'Hatur nuhun Kang Asep atas laporannya. 🙏\n\nAI PURI telah mencatat pengaduan jalan berlubang di Jl. Raya Tarogong (Simpang Lima) dan meneruskannya ke **Bidang Bina Marga** dengan prioritas **TINGGI** (Tiket: #BM-99812).\n\nTim UPTD Bina Marga wilayah Tarogong akan melakukan pengecekan lapangan hari ini.',
      attachmentType: 'text',
      sentiment: 'POSITIF',
      emotion: 'SENANG',
      createdAt: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
    },
    {
      id: 'msg-101-3',
      conversationId: 'conv-ig-101',
      senderType: 'OPERATOR',
      senderName: 'Ir. Ahmad (Operator Bina Marga)',
      content: 'Halo Kang Asep, tim satgas tanggap darurat Bina Marga sedang menuju lokasi Simpang Lima dengan bahan tambal dingin (cold mix). Terima kasih atas kewaspadaannya.',
      attachmentType: 'text',
      sentiment: 'POSITIF',
      emotion: 'SENANG',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ],
  'conv-wa-102': [
    {
      id: 'msg-102-1',
      conversationId: 'conv-wa-102',
      senderType: 'USER',
      senderName: 'Hj. Siti Rahma',
      content: 'Assalamu alaikum min, mau tanya kalau dokumen SLF (Sertifikat Laik Fungsi) ruko 2 lantai apa saja syarat yang harus diupload ke SIMBG?',
      attachmentType: 'text',
      sentiment: 'POSITIF',
      emotion: 'SENANG',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'msg-102-2',
      conversationId: 'conv-wa-102',
      senderType: 'AI_BOT',
      senderName: 'PURI (AI Bot)',
      content: 'Wa alaikum salam Hj. Siti Rahma. 😊\n\nUntuk pengurusan **SLF Ruko 2 Lantai** via SIMBG, berikut syarat dokumen yang diperlukan (Sesuai Perda PUPR Garut):\n1. Bukti kepemilikan tanah & IMB/PBG asal.\n2. Gambar as-built drawing arsitektur & struktur.\n3. Laporan kajian teknis keandalan bangunan dari pengkaji teknis/konsultan bersertifikat.\n4. Sertifikat SLO instalasi listrik & damkar.\n\nJika butuh pendampingan langsung, Ibu dapat menjadwalkan **PURI Meet** dengan tim Bidang Bangunan Gedung.',
      attachmentType: 'text',
      sentiment: 'POSITIF',
      emotion: 'SENANG',
      createdAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    },
  ],
};

const DEFAULT_ISSUES: PSICIssue[] = [
  {
    id: 'issue-001',
    title: 'Lubang Jalan Raya Tarogong - Simpang Lima',
    keyword: 'Jalan Rusak',
    bidang: 'BINA_MARGA',
    totalMentions: 68,
    timeWindowHours: 24,
    sentimentTrend: 'NEGATIF',
    isCrisisAlert: false,
    affectedKecamatan: ['Tarogong Kidul', 'Tarogong Kaler'],
    status: 'INVESTIGATING',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-002',
    title: 'Genangan Air Drainase Simpang Samarang Pasca Hujan',
    keyword: 'Banjir / Drainase',
    bidang: 'SDA',
    totalMentions: 42,
    timeWindowHours: 12,
    sentimentTrend: 'NEGATIF',
    isCrisisAlert: false,
    affectedKecamatan: ['Samarang', 'Bayongbong'],
    status: 'MONITORING',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_REPUTATION: PSICReputationIndex = {
  id: 'rep-today',
  score: 88.5,
  positivePercentage: 78.0,
  neutralPercentage: 14.0,
  negativePercentage: 8.0,
  slaComplianceRate: 96.2,
  totalConversations: 142,
  totalResolvedByAI: 115,
  totalResolvedByOperator: 27,
  periodDate: new Date().toISOString().split('T')[0],
  createdAt: new Date().toISOString(),
};

// ============================================================================
// SERVICE METHODS
// ============================================================================

export class PSICService {
  /**
   * Mengambil daftar seluruh percakapan dari 11 kanal Omnichannel
   */
  static async fetchConversations(filters?: {
    channelType?: PSICChannelType | 'ALL';
    bidang?: BidangPUPR | 'ALL';
    status?: string;
    sentiment?: string;
  }): Promise<PSICConversation[]> {
    try {
      let query = supabase
        .from('psic_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (filters?.channelType && filters.channelType !== 'ALL') {
        query = query.eq('channel_type', filters.channelType);
      }
      if (filters?.bidang && filters.bidang !== 'ALL') {
        query = query.eq('bidang', filters.bidang);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        // Fallback ke sampel rich data
        return this.filterDefaultConversations(filters);
      }

      return data.map((item: any) => ({
        id: item.id,
        channelType: item.channel_type as PSICChannelType,
        externalId: item.external_id,
        title: item.title || 'Percakapan Publik',
        author: {
          id: item.author_id,
          name: item.author_name,
          username: item.author_username,
          avatarUrl: item.author_avatar_url,
          isVerified: item.is_verified,
          isInfluencer: item.is_influencer,
          followersCount: item.followers_count,
        },
        bidang: item.bidang as BidangPUPR,
        intent: item.intent,
        smartLabel: item.smart_label,
        priority: item.priority,
        sentiment: item.sentiment,
        emotion: item.emotion,
        feedCategory: item.feed_category,
        confidenceScore: Number(item.confidence_score || 95),
        status: item.status,
        slaDeadline: item.sla_deadline,
        isSlaBreached: Boolean(item.is_sla_breached),
        location: {
          kecamatan: item.kecamatan,
          desa: item.desa,
          addressDetail: item.address_detail,
        },
        lastMessageAt: item.last_message_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchConversations error, using default fallback:', e);
      return this.filterDefaultConversations(filters);
    }
  }

  private static filterDefaultConversations(filters?: {
    channelType?: string;
    bidang?: string;
  }): PSICConversation[] {
    let result = [...DEFAULT_CONVERSATIONS];
    if (filters?.channelType && filters.channelType !== 'ALL') {
      result = result.filter((c) => c.channelType === filters.channelType);
    }
    if (filters?.bidang && filters.bidang !== 'ALL') {
      result = result.filter((c) => c.bidang === filters.bidang);
    }
    return result;
  }

  /**
   * Mengambil riwayat pesan dalam satu percakapan
   */
  static async fetchMessages(conversationId: string): Promise<PSICMessage[]> {
    try {
      const { data, error } = await supabase
        .from('psic_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return DEFAULT_MESSAGES[conversationId] || [];
      }

      return data.map((item: any) => ({
        id: item.id,
        conversationId: item.conversation_id,
        senderType: item.sender_type,
        senderName: item.sender_name,
        content: item.content,
        attachmentType: item.attachment_type || 'text',
        attachmentUrl: item.attachment_url,
        voiceTranscription: item.voice_transcription,
        visionAnalysisSummary: item.vision_analysis_summary,
        sentiment: item.sentiment,
        emotion: item.emotion,
        isDraft: item.is_draft,
        createdAt: item.created_at,
      }));
    } catch {
      return DEFAULT_MESSAGES[conversationId] || [];
    }
  }

  /**
   * Mengambil daftar isu terkini & notifikasi darurat (Crisis Alerts)
   */
  static async fetchIssues(): Promise<PSICIssue[]> {
    try {
      const { data, error } = await supabase
        .from('psic_issues')
        .select('*')
        .order('total_mentions', { ascending: false });

      if (error || !data || data.length === 0) {
        return DEFAULT_ISSUES;
      }

      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        keyword: item.keyword,
        bidang: item.bidang as BidangPUPR,
        totalMentions: item.total_mentions,
        timeWindowHours: item.time_window_hours,
        sentimentTrend: item.sentiment_trend,
        isCrisisAlert: Boolean(item.is_crisis_alert),
        affectedKecamatan: item.affected_kecamatan || [],
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return DEFAULT_ISSUES;
    }
  }

  /**
   * Mengambil skor Indeks Reputasi Digital terbaru
   */
  static async fetchReputationIndex(): Promise<PSICReputationIndex> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('psic_reputation_index')
        .select('*')
        .eq('period_date', today)
        .single();

      if (error || !data) {
        return DEFAULT_REPUTATION;
      }

      return {
        id: data.id,
        score: Number(data.score),
        positivePercentage: Number(data.positive_percentage),
        neutralPercentage: Number(data.neutral_percentage),
        negativePercentage: Number(data.negative_percentage),
        slaComplianceRate: Number(data.sla_compliance_rate),
        totalConversations: Number(data.total_conversations),
        totalResolvedByAI: Number(data.total_resolved_by_ai),
        totalResolvedByOperator: Number(data.total_resolved_by_operator),
        periodDate: data.period_date,
        createdAt: data.created_at,
      };
    } catch {
      return DEFAULT_REPUTATION;
    }
  }
}
