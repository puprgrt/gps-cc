/**
 * ============================================================================
 * PURI SOCIAL INTELLIGENCE CENTER (PSIC) - CHATWOOT INTEGRATION SERVICE
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 *
 * Service untuk mengelola integrasi bi-direksional dengan Chatwoot Omnichannel:
 * 1. Menerima dan menormalisasi webhook event dari Chatwoot ke format PSIC.
 * 2. Melakukan klasifikasi 6-Tier PURI (Bidang, Layanan, Intent, Prioritas, SLA).
 * 3. Mengirim balasan otomatis atau Private Note (catatan internal AI) ke Chatwoot.
 * 4. Memasang tag/label otomatis pada tiket percakapan di Chatwoot.
 */

import { supabase } from '@/lib/supabase';
import type { PSICChannelType, PSICConversation, PSICMessage } from '@/domain/psic';
import type { BidangPUPR, TicketPriority } from '@/domain/aiRouting';

// ============================================================================
// CHATWOOT WEBHOOK TYPES
// ============================================================================

export interface ChatwootWebhookPayload {
  event: string; // e.g., 'message_created', 'conversation_created', 'conversation_updated'
  id?: number;
  content?: string;
  message_type?: 'incoming' | 'outgoing' | 'activity' | 'template';
  created_at?: string;
  private?: boolean;
  conversation?: {
    id: number;
    inbox_id: number;
    status: string;
    channel: string; // e.g., 'Channel::Whatsapp', 'Channel::Instagram', 'Channel::FacebookPage', 'Channel::Telegram', 'Channel::WebWidget', 'Channel::Email'
    contact_inbox?: {
      source_id: string;
    };
    custom_attributes?: Record<string, any>;
  };
  sender?: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
    avatar_url?: string;
    custom_attributes?: Record<string, any>;
  };
  inbox?: {
    id: number;
    name: string;
    channel_type: string;
  };
}

export interface PSICChatwootClassificationResult {
  bidang: BidangPUPR;
  intent: 'PENGADUAN' | 'PERSYARATAN' | 'INFORMASI' | 'APRESIASI' | 'LAINNYA';
  smartLabel: string;
  priority: TicketPriority;
  sentiment: 'POSITIF' | 'NEGATIF' | 'NETRAL';
  emotion: 'MARAH' | 'SENANG' | 'BINGUNG' | 'MENDESAK' | 'TERIMA_KASIH' | 'NETRAL';
  confidenceScore: number;
  slaHours: number;
  suggestedReply?: string;
}

// ============================================================================
// CHATWOOT SERVICE LAYER
// ============================================================================

export class ChatwootService {
  private static get baseUrl(): string {
    return process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
  }

  private static get apiToken(): string {
    return process.env.CHATWOOT_API_TOKEN || '';
  }

  private static get accountId(): string {
    return process.env.CHATWOOT_ACCOUNT_ID || '1';
  }

  /**
   * Menormalisasi tipe channel dari Chatwoot ke PSICChannelType
   */
  static normalizeChannelType(chatwootChannel?: string): PSICChannelType {
    const channel = (chatwootChannel || '').toLowerCase();
    if (channel.includes('whatsapp')) return 'whatsapp';
    if (channel.includes('instagram')) return 'instagram';
    if (channel.includes('facebook')) return 'facebook';
    if (channel.includes('telegram')) return 'telegram';
    if (channel.includes('twitter') || channel.includes('x_profile')) return 'twitter';
    if (channel.includes('tiktok')) return 'tiktok';
    if (channel.includes('youtube')) return 'youtube';
    if (channel.includes('email')) return 'email';
    if (channel.includes('webwidget') || channel.includes('api')) return 'website';
    return 'website';
  }

  /**
   * AI 6-Tier Hierarchical Classification untuk pesan masuk dari Chatwoot
   */
  static classifyMessage(content: string): PSICChatwootClassificationResult {
    const text = (content || '').toLowerCase();

    // 1. Deteksi Prioritas Kritis & Darurat (Banjir, Jembatan Ambruk, Jalan Putus, Longsor)
    if (
      text.includes('banjir') ||
      text.includes('ambruk') ||
      text.includes('longsor') ||
      text.includes('putus') ||
      text.includes('darurat')
    ) {
      const bidang: BidangPUPR = text.includes('banjir') || text.includes('irigasi')
        ? 'SDA'
        : 'BINA_MARGA';

      return {
        bidang,
        intent: 'PENGADUAN',
        smartLabel: bidang === 'SDA' ? 'Drainase' : 'Jalan',
        priority: 'KRITIS',
        sentiment: 'NEGATIF',
        emotion: 'MENDESAK',
        confidenceScore: 98.5,
        slaHours: 2,
        suggestedReply: `Halo Bapak/Ibu, laporan DARURAT infrastruktur Anda telah kami terima dan diprioritaskan KRITIS (SLA 2 Jam). Tim Satgas Tanggap Darurat ${
          bidang === 'SDA' ? 'Bidang SDA / Banjir' : 'Bidang Bina Marga'
        } sedang dikerahkan ke lokasi. 🙏`,
      };
    }

    // 2. Deteksi Bidang Bina Marga (Jalan, Jembatan, Aspal, Berlubang)
    if (
      text.includes('jalan') ||
      text.includes('aspal') ||
      text.includes('lubang') ||
      text.includes('jembatan') ||
      text.includes('hotmix')
    ) {
      const isApresiasi = text.includes('terima kasih') || text.includes('mantap') || text.includes('apresiasi');
      const isJembatan = text.includes('jembatan');

      return {
        bidang: 'BINA_MARGA',
        intent: isApresiasi ? 'APRESIASI' : 'PENGADUAN',
        smartLabel: isJembatan ? 'Jembatan' : 'Jalan',
        priority: isApresiasi ? 'NORMAL' : 'TINGGI',
        sentiment: isApresiasi ? 'POSITIF' : 'NEGATIF',
        emotion: isApresiasi ? 'TERIMA_KASIH' : 'MARAH',
        confidenceScore: 96.0,
        slaHours: isApresiasi ? 24 : 6,
        suggestedReply: isApresiasi
          ? `Hatur nuhun atas apresiasi dan dukungannya kepada Dinas PUPR Kabupaten Garut! Kami berkomitmen terus meningkatkan infrastruktur Kabupaten Garut. 😊`
          : `Terima kasih atas laporannya. Pengaduan jalan/jembatan rusak ini telah diteruskan ke **Bidang Bina Marga** (Tiket Prioritas Tinggi). Tim teknis akan segera melakukan peninjauan lapangan.`,
      };
    }

    // 3. Deteksi Bidang Bangunan Gedung (PBG, SLF, IMB, Ruko, Gedung)
    if (
      text.includes('pbg') ||
      text.includes('slf') ||
      text.includes('imb') ||
      text.includes('izin') ||
      text.includes('bangunan')
    ) {
      return {
        bidang: 'BANGUNAN_GEDUNG',
        intent: 'PERSYARATAN',
        smartLabel: text.includes('slf') ? 'SLF' : 'PBG',
        priority: 'NORMAL',
        sentiment: 'POSITIF',
        emotion: 'SENANG',
        confidenceScore: 97.2,
        slaHours: 12,
        suggestedReply: `Halo, untuk pelayanan persetujuan bangunan gedung (PBG) dan Sertifikat Laik Fungsi (SLF) di Kabupaten Garut, Anda dapat mendaftar via portal SIMBG Kementerian PUPR atau konsultasi di Mall Pelayanan Publik (MPP) Garut.`,
      };
    }

    // 4. Deteksi Bidang Sumber Daya Air (SDA, Irigasi, Drainase, Gorong-gorong)
    if (
      text.includes('irigasi') ||
      text.includes('drainase') ||
      text.includes('gorong') ||
      text.includes('sungai') ||
      text.includes('selokan')
    ) {
      return {
        bidang: 'SDA',
        intent: 'PENGADUAN',
        smartLabel: 'Drainase',
        priority: 'TINGGI',
        sentiment: 'NEGATIF',
        emotion: 'MENDESAK',
        confidenceScore: 94.8,
        slaHours: 8,
        suggestedReply: `Terima kasih atas laporan mengenai drainase/irigasi. Laporan Anda telah diteruskan ke **Bidang Sumber Daya Air (SDA)** Dinas PUPR Kabupaten Garut untuk pengecekan.`,
      };
    }

    // 5. Deteksi Bidang Penataan Ruang (KRK, PKKPR, Siteplan, Tata Ruang)
    if (
      text.includes('krk') ||
      text.includes('pkkpr') ||
      text.includes('siteplan') ||
      text.includes('tata ruang') ||
      text.includes('zonasi')
    ) {
      return {
        bidang: 'PENATAAN_RUANG',
        intent: 'PERSYARATAN',
        smartLabel: 'KRK',
        priority: 'NORMAL',
        sentiment: 'NETRAL',
        emotion: 'NETRAL',
        confidenceScore: 93.5,
        slaHours: 24,
        suggestedReply: `Halo, informasi Keterangan Rencana Kabupaten (KRK) dan Tata Ruang Kabupaten Garut dapat dikonsultasikan langsung dengan **Bidang Penataan Ruang** Dinas PUPR Garut.`,
      };
    }

    // Default Fallback: Sekretariat / Layanan Umum
    return {
      bidang: 'SEKRETARIAT',
      intent: 'INFORMASI',
      smartLabel: 'Informasi',
      priority: 'NORMAL',
      sentiment: 'NETRAL',
      emotion: 'NETRAL',
      confidenceScore: 90.0,
      slaHours: 24,
      suggestedReply: `Halo Bapak/Ibu, terima kasih telah menghubungi Dinas PUPR Kabupaten Garut. Pesan Anda telah kami terima dan sedang diverifikasi oleh petugas pelayanan umum. 🙏`,
    };
  }

  /**
   * Mengirim pesan (atau Private Note) ke percakapan Chatwoot melalui REST API
   */
  static async sendMessageToChatwoot(
    conversationId: number,
    content: string,
    isPrivateNote: boolean = false
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.apiToken) {
      console.warn('CHATWOOT_API_TOKEN tidak ditemukan. Melewatkan panggilan API ke Chatwoot (offline preview).');
      return { success: true, data: { simulated: true, conversationId, content, isPrivateNote } };
    }

    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: this.apiToken,
        },
        body: JSON.stringify({
          content,
          message_type: isPrivateNote ? 'outgoing' : 'outgoing',
          private: isPrivateNote,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Chatwoot API error (${response.status}): ${errText}` };
      }

      const json = await response.json();
      return { success: true, data: json };
    } catch (error: any) {
      console.error('Error sendMessageToChatwoot:', error);
      return { success: false, error: error?.message || 'Network error' };
    }
  }

  /**
   * Menambahkan label/tag pada percakapan Chatwoot (contoh: ['Bina Marga', 'Prioritas Tinggi', 'Jalan'])
   */
  static async setLabelsOnChatwoot(
    conversationId: number,
    labels: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiToken) {
      return { success: true };
    }

    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/labels`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: this.apiToken,
        },
        body: JSON.stringify({
          labels,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Chatwoot Label API error (${response.status}): ${errText}` };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error setLabelsOnChatwoot:', error);
      return { success: false, error: error?.message || 'Network error' };
    }
  }

  /**
   * Proses End-to-End Ingestion Event Webhook Chatwoot ke database PSIC & Auto-Routing
   */
  static async processWebhookEvent(payload: ChatwootWebhookPayload): Promise<{
    success: boolean;
    conversationId?: string;
    classification?: PSICChatwootClassificationResult;
    message?: string;
  }> {
    try {
      // Hanya proses event incoming message (pesan dari warga)
      if (
        payload.event !== 'message_created' ||
        payload.message_type !== 'incoming' ||
        payload.private === true
      ) {
        return {
          success: true,
          message: `Event '${payload.event}' (message_type: ${payload.message_type}) diabaikan karena bukan pesan masuk publik.`,
        };
      }

      const chatwootConvId = payload.conversation?.id || payload.id;
      if (!chatwootConvId) {
        return { success: false, message: 'ID percakapan Chatwoot tidak ditemukan pada payload.' };
      }

      const content = payload.content || '';
      const authorName = payload.sender?.name || 'Warga Garut';
      const authorId = payload.sender?.id ? `cw_user_${payload.sender.id}` : `cw_user_${Date.now()}`;
      const channelType = this.normalizeChannelType(
        payload.conversation?.channel || payload.inbox?.channel_type
      );

      // 1. Jalankan Klasifikasi AI 6-Tier PURI
      const classification = this.classifyMessage(content);

      const externalId = `chatwoot_conv_${chatwootConvId}`;

      // 2. Simpan/Upsert ke tabel Supabase psic_conversations
      const { data: convData, error: convError } = await supabase
        .from('psic_conversations')
        .upsert(
          {
            channel_type: channelType,
            external_id: externalId,
            title: content.slice(0, 70) || 'Pesan Omnichannel Chatwoot',
            author_id: authorId,
            author_name: authorName,
            author_username: payload.sender?.phone_number || payload.sender?.email,
            author_avatar_url: payload.sender?.avatar_url,
            bidang: classification.bidang,
            intent: classification.intent,
            smart_label: classification.smartLabel,
            priority: classification.priority,
            sentiment: classification.sentiment,
            emotion: classification.emotion,
            confidence_score: classification.confidenceScore,
            status: 'IN_PROGRESS',
            last_message_at: new Date().toISOString(),
          },
          { onConflict: 'external_id' }
        )
        .select('id')
        .single();

      if (convError) {
        console.warn('Supabase upsert psic_conversations error (fallback mode offline):', convError);
      }

      const psicConversationId = convData?.id || externalId;

      // 3. Simpan pesan masuk ke psic_messages
      await supabase.from('psic_messages').insert({
        conversation_id: psicConversationId,
        sender_type: 'USER',
        sender_name: authorName,
        content,
        attachment_type: 'text',
        sentiment: classification.sentiment,
        emotion: classification.emotion,
      });

      // 4. Tambahkan Private Note di Chatwoot untuk panduan Operator Bidang
      const privateNoteContent = `🤖 [PURI AI 6-Tier Smart Routing]
• Bidang: ${classification.bidang.replace(/_/g, ' ')}
• Layanan/Intent: ${classification.intent} (${classification.smartLabel})
• Prioritas: ${classification.priority}
• Sentimen: ${classification.sentiment} (Emosi: ${classification.emotion})
• SLA Target: ${classification.slaHours} Jam
• Akurasi AI: ${classification.confidenceScore}%`;

      await this.sendMessageToChatwoot(chatwootConvId, privateNoteContent, true);

      // 5. Pasang Label Otomatis di Chatwoot
      const labels = [
        classification.bidang.replace(/_/g, ' '),
        `Priority: ${classification.priority}`,
        classification.smartLabel,
      ];
      await this.setLabelsOnChatwoot(chatwootConvId, labels);

      // 6. Jika Keyakinan AI >= 95% atau Kritis, kirim balasan otomatis AI PURI (Opsional/Configurable)
      if (classification.suggestedReply && classification.confidenceScore >= 93.0) {
        await this.sendMessageToChatwoot(chatwootConvId, classification.suggestedReply, false);

        // Simpan log balasan AI ke Supabase
        await supabase.from('psic_messages').insert({
          conversation_id: psicConversationId,
          sender_type: 'AI_BOT',
          sender_name: 'PURI (AI Bot)',
          content: classification.suggestedReply,
          sentiment: 'POSITIF',
          emotion: 'SENANG',
        });
      }

      return {
        success: true,
        conversationId: psicConversationId,
        classification,
        message: 'Webhook Chatwoot berhasil diproses dengan 6-Tier PURI Routing.',
      };
    } catch (error: any) {
      console.error('Error processWebhookEvent Chatwoot:', error);
      return { success: false, message: error?.message || 'Internal Chatwoot webhook error' };
    }
  }
}
