import { WhatsAppConnectionStatus, WhatsAppConversation, WhatsAppBotLog, OperatorStatus } from '../domain/whatsapp';
import { supabase } from '../lib/supabase';

export class WhatsAppService {
  static async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    try {
      const res = await fetch('/api/whatsapp/baileys', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'qr_ready',
          phoneNumber: data.phoneNumber,
          userJid: data.userJid,
          pushName: data.pushName,
          qrCodeRaw: data.qrCodeRaw || data.qr,
          pairingCode: data.pairingCode,
          activeSince: data.activeSince,
          lastSync: data.lastSync ? new Date(data.lastSync) : new Date(),
          baileysVersion: data.baileysVersion || '@whiskeysockets/baileys v6.7.8',
          sessionPath: data.sessionPath || './baileys_auth_garut',
          pingMs: data.pingMs || 18,
        };
      }
    } catch (e) {
      console.warn('Failed to fetch real connection status from API:', e);
    }

    return {
      status: 'qr_ready',
      baileysVersion: '@whiskeysockets/baileys v6.7.8',
      sessionPath: './baileys_auth_garut',
      lastSync: new Date(),
      pingMs: 20,
    };
  }

  static async getActiveConversations(): Promise<WhatsAppConversation[]> {
    try {
      const { data, error } = await supabase
        .from('wa_conversations')
        .select(`
          id,
          contact_id,
          last_message,
          unread_count,
          status,
          category,
          updated_at,
          created_at,
          wa_contacts(name, phone_number),
          wa_messages(id, sender_type, text, media_url, media_type, status, timestamp)
        `)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        if (data.length === 0) return [];
        
        return data.map((c: any) => {
          const contactObj = Array.isArray(c.wa_contacts) ? c.wa_contacts[0] : c.wa_contacts;
          const fallbackPhone = c.id.replace('conv-', '').split('@')[0];
          const base: WhatsAppConversation = {
            id: c.id,
            contactName: contactObj?.name || fallbackPhone,
            contactNumber: contactObj?.phone_number || fallbackPhone,
            lastMessage: c.last_message || '',
            timestamp: new Date(c.updated_at || Date.now()),
            unreadCount: c.unread_count || 0,
            status: c.status === 'pending' ? 'pending' : (c.status === 'bot_handling' ? 'bot_handling' : 'active'),
            category: c.category || 'Umum',
            messages: (c.wa_messages || []).map((m: any) => {
              const mt = (m.media_type || '').toLowerCase();
              const mu = (m.media_url || '').toLowerCase();
              let normalizedType: 'image' | 'video' | 'audio' | 'document' | 'text' = 'text';
              if (mt.includes('image') || mu.endsWith('.jpg') || mu.endsWith('.jpeg') || mu.endsWith('.png') || mu.startsWith('data:image') || mt === 'image') {
                normalizedType = 'image';
              } else if (mt.includes('video') || mu.endsWith('.mp4') || mt === 'video') {
                normalizedType = 'video';
              } else if (mt.includes('audio') || mu.endsWith('.mp3') || mu.endsWith('.ogg') || mt === 'audio') {
                normalizedType = 'audio';
              } else if (m.media_url || mt.includes('pdf') || mt.includes('doc') || mu.startsWith('data:application') || mt === 'document' || mt.includes('document')) {
                normalizedType = 'document';
              }

              return {
                id: m.id,
                sender: m.sender_type,
                text: m.text,
                timestamp: new Date(m.timestamp),
                status: m.status,
                type: normalizedType,
                metadata: {
                  fileUrl: m.media_url,
                  fileName: m.media_url ? ((m.text && m.text.length < 35) ? m.text : `Lampiran_${normalizedType === 'image' ? 'Foto.jpg' : 'Dokumen.pdf'}`) : undefined,
                  mimetype: m.media_type
                },
                attachments: m.media_url ? [{
                  type: normalizedType === 'image' ? 'image' : 'pdf',
                  url: m.media_url,
                  name: (m.text && m.text.length < 35) ? m.text : `Lampiran_${normalizedType === 'image' ? 'Foto' : 'Dokumen'}`
                }] : undefined
              };
            }).sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()),
          };
          return WhatsAppService.enrichPuriConversation(base);
        });
      }
    } catch (e) {
      console.warn('Failed to fetch conversations from Supabase:', e);
    }
    return [];
  }

  static enrichPuriConversation(conv: WhatsAppConversation): WhatsAppConversation {
    const text = (conv.lastMessage || '').toLowerCase();
    const cat = (conv.category || '').toLowerCase();

    let bidang: string | string[] = 'SEKRETARIAT';
    let layanan = 'Layanan Umum & Informasi';
    let intent = 'INFORMASI';
    let prioritas: 'RENDAH' | 'NORMAL' | 'TINGGI' | 'KRITIS' = 'NORMAL';
    let sla = '1 Hari';
    let assignedOperator = 'CS-01 (Online)';
    let confidenceScore = 97;
    let isEmergency = false;
    const smartLabels: string[] = [];

    if (text.includes('longsor') || text.includes('putus') || text.includes('ambruk') || text.includes('darurat')) {
      bidang = 'BINA_MARGA';
      layanan = 'Jalan Kabupaten & Jembatan';
      intent = 'PENGADUAN';
      prioritas = 'KRITIS';
      sla = '< 2 Jam';
      assignedOperator = 'BM-01 (Online)';
      confidenceScore = 99;
      isEmergency = true;
      smartLabels.push('Jalan', 'Jembatan', 'Pengaduan', 'Kritis');
    } else if (text.includes('jalan') || text.includes('aspal') || text.includes('berlubang') || cat.includes('jalan')) {
      bidang = 'BINA_MARGA';
      layanan = 'Jalan Kabupaten';
      intent = 'PENGADUAN';
      prioritas = 'TINGGI';
      sla = '1 Hari';
      assignedOperator = 'BM-02 (Online)';
      confidenceScore = 96;
      smartLabels.push('Jalan', 'Pengaduan');
    } else if (text.includes('pbg') || text.includes('slf') || text.includes('imb') || text.includes('gedung') || cat.includes('pbg') || cat.includes('slf')) {
      if (text.includes('jalan') || text.includes('akses')) {
        bidang = ['BANGUNAN_GEDUNG', 'BINA_MARGA'];
        layanan = 'PBG & Jalan Kabupaten';
      } else {
        bidang = 'BANGUNAN_GEDUNG';
        layanan = text.includes('slf') ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)';
      }
      intent = text.includes('syarat') || text.includes('info') ? 'PERSYARATAN' : 'PERMOHONAN_BARU';
      prioritas = 'NORMAL';
      sla = '1 Hari';
      assignedOperator = 'BG-01 (Online)';
      confidenceScore = 98;
      smartLabels.push(text.includes('slf') ? 'SLF' : 'PBG', 'Informasi');
    } else if (text.includes('irigasi') || text.includes('sungai') || text.includes('banjir') || text.includes('drainase') || cat.includes('sda')) {
      bidang = 'SDA';
      layanan = 'Irigasi & Drainase';
      intent = 'PENGADUAN';
      prioritas = 'TINGGI';
      sla = '1 Hari';
      assignedOperator = 'SDA-01 (Online)';
      confidenceScore = 97;
      smartLabels.push('Irigasi', 'Drainase', 'Pengaduan');
    } else if (text.includes('krk') || text.includes('pkkpr') || text.includes('tata ruang') || text.includes('zonasi') || cat.includes('krk')) {
      bidang = 'PENATAAN_RUANG';
      layanan = 'PKKPR / KRK';
      intent = 'PERSYARATAN';
      prioritas = 'NORMAL';
      sla = '1 Hari';
      assignedOperator = 'PR-01 (Online)';
      confidenceScore = 98;
      smartLabels.push('PKKPR', 'KRK', 'Siteplan', 'Informasi');
    } else if (text.includes('air') || text.includes('spam') || text.includes('sanitasi') || text.includes('pipa') || cat.includes('spam')) {
      bidang = 'AMPL';
      layanan = 'SPAM & Sanitasi';
      intent = 'PENGADUAN';
      prioritas = 'TINGGI';
      sla = '3 Jam';
      assignedOperator = 'AMPL-01 (Online)';
      confidenceScore = 95;
      smartLabels.push('SPAM', 'Sanitasi', 'Pengaduan');
    } else if (text.includes('jasa konstruksi') || text.includes('sertifikasi') || text.includes('bujk') || cat.includes('konstruksi')) {
      bidang = 'JASA_KONSTRUKSI';
      layanan = 'Pembinaan & Sertifikasi';
      intent = 'INFORMASI';
      prioritas = 'RENDAH';
      sla = '1 Hari';
      assignedOperator = 'JK-01 (Online)';
      confidenceScore = 99;
      smartLabels.push('Jasa Konstruksi', 'Informasi');
    } else {
      smartLabels.push('Administrasi', 'Informasi');
    }

    return {
      ...conv,
      bidang: conv.bidang || bidang,
      layanan: conv.layanan || layanan,
      intent: conv.intent || intent,
      prioritas: conv.prioritas || prioritas,
      sla: conv.sla || sla,
      assignedOperator: conv.assignedOperator || assignedOperator,
      confidenceScore: conv.confidenceScore || confidenceScore,
      isEmergency: conv.isEmergency ?? isEmergency,
      smartLabels: conv.smartLabels || smartLabels,
    };
  }

  static getDefaultPuriConversations(): WhatsAppConversation[] {
    const now = new Date();
    return [
      {
        id: 'conv-1',
        contactName: 'Asep Solihin (Warga Cisarua)',
        contactNumber: '+6281234567890',
        location: 'Kec. Samarang',
        lastMessage: 'Jalan menuju Kampung Cisarua longsor dan putus total, mohon segera penanganan darurat!',
        timestamp: new Date(now.getTime() - 4 * 60000),
        unreadCount: 2,
        status: 'pending',
        category: 'Pengaduan',
        bidang: 'BINA_MARGA',
        layanan: 'Jalan Kabupaten & Jembatan',
        intent: 'PENGADUAN',
        prioritas: 'KRITIS',
        sla: '< 2 Jam',
        assignedOperator: 'BM-01 (Online)',
        confidenceScore: 99,
        isEmergency: true,
        smartLabels: ['Jalan', 'Jembatan', 'Pengaduan', 'Kritis'],
        aiSuggestedReply: {
          text: 'Waalaikumsalam Pak Asep. Laporan darurat jalan putus di Kampung Cisarua telah kami terima dan ditetapkan sebagai Prioritas KRITIS (SLA < 2 Jam). Tim Reaksi Cepat Bidang Bina Marga segera meluncur ke lokasi.',
          confidence: 99,
          source: 'PURI Emergency Engine',
        },
        messages: [
          {
            id: 'm1',
            sender: 'user',
            senderName: 'Asep Solihin',
            text: 'Jalan menuju Kampung Cisarua longsor dan putus total, mohon segera penanganan darurat!',
            timestamp: new Date(now.getTime() - 4 * 60000),
            status: 'read',
            type: 'image',
            metadata: {
              fileName: 'Foto_Longsor_Cisarua.jpg',
              mimetype: 'image/jpeg',
              fileUrl: 'https://images.unsplash.com/photo-1584463603478-f7b5e43a94a9?auto=format&fit=crop&w=800&q=80',
              caption: 'Jalan menuju Kampung Cisarua longsor dan putus total, mohon segera penanganan darurat!'
            },
            attachments: [{
              type: 'image',
              url: 'https://images.unsplash.com/photo-1584463603478-f7b5e43a94a9?auto=format&fit=crop&w=800&q=80',
              name: 'Foto_Longsor_Cisarua.jpg'
            }]
          }
        ]
      },
      {
        id: 'conv-2',
        contactName: 'Dedi Kurniawan',
        contactNumber: '+6281345678912',
        location: 'Kec. Garut Kota',
        lastMessage: 'Surat_Permohonan_PBG_Gudang.pdf',
        timestamp: new Date(now.getTime() - 18 * 60000),
        unreadCount: 1,
        status: 'pending',
        category: 'PBG',
        bidang: ['BANGUNAN_GEDUNG', 'BINA_MARGA'],
        layanan: 'PBG & Jalan Kabupaten',
        intent: 'PERMOHONAN_BARU',
        prioritas: 'NORMAL',
        sla: '1 Hari',
        assignedOperator: 'BG-03 (Online)',
        confidenceScore: 96,
        isEmergency: false,
        smartLabels: ['PBG', 'Jalan', 'Informasi'],
        aiSuggestedReply: {
          text: 'Halo Pak Dedi. Sistem PURI telah membaca dokumen Surat Permohonan PBG terlampir dan membuat 1 Tiket Utama ke Bidang Bangunan Gedung serta sub-tugas penanganan jalan berlubang ke Bidang Bina Marga.',
          confidence: 96,
          source: 'PURI Multi-Domain Engine',
        },
        messages: [
          {
            id: 'm2',
            sender: 'user',
            senderName: 'Dedi Kurniawan',
            text: 'Surat_Permohonan_PBG_Gudang.pdf',
            timestamp: new Date(now.getTime() - 18 * 60000),
            status: 'read',
            type: 'document',
            metadata: {
              fileName: 'Surat_Permohonan_PBG_Gudang.pdf',
              mimetype: 'application/pdf',
              size: 2450000,
              fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              caption: 'Surat permohonan PBG gudang berserta lampiran KRK'
            },
            attachments: [{
              type: 'pdf',
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              name: 'Surat_Permohonan_PBG_Gudang.pdf'
            }]
          }
        ]
      },
      {
        id: 'conv-3',
        contactName: 'Siti Rahmawati (Leuwigoong)',
        contactNumber: '+6281567890123',
        location: 'Kec. Leuwigoong',
        lastMessage: 'Saluran irigasi dekat Pasar Leuwigoong meluap dan menggenangi sawah warga.',
        timestamp: new Date(now.getTime() - 35 * 60000),
        unreadCount: 1,
        status: 'pending',
        category: 'Pengaduan',
        bidang: 'SDA',
        layanan: 'Irigasi & Drainase',
        intent: 'PENGADUAN',
        prioritas: 'TINGGI',
        sla: '1 Hari',
        assignedOperator: 'SDA-02 (Online)',
        confidenceScore: 98,
        isEmergency: false,
        smartLabels: ['Irigasi', 'Drainase', 'Pengaduan'],
        aiSuggestedReply: {
          text: 'Terima kasih Bu Siti. Laporan genangan di irigasi Leuwigoong telah dijadwalkan untuk peninjauan petugas Bidang SDA maksimal 24 jam ke depan.',
          confidence: 98,
          source: 'PURI SDA Routing',
        },
        messages: [
          {
            id: 'm3',
            sender: 'user',
            senderName: 'Siti Rahmawati',
            text: 'Saluran irigasi dekat Pasar Leuwigoong meluap dan menggenangi sawah warga.',
            timestamp: new Date(now.getTime() - 35 * 60000),
            status: 'read',
          }
        ]
      },
      {
        id: 'conv-4',
        contactName: 'PT. Garut Bangun Persada',
        contactNumber: '+6281789012345',
        location: 'Kec. Tarogong Kidul',
        lastMessage: 'Selamat pagi, mohon info persyaratan pengajuan PKKPR untuk rencana pembangunan ruko di Tarogong.',
        timestamp: new Date(now.getTime() - 62 * 60000),
        unreadCount: 0,
        status: 'bot_handling',
        category: 'PKKPR',
        bidang: 'PENATAAN_RUANG',
        layanan: 'PKKPR / KRK',
        intent: 'PERSYARATAN',
        prioritas: 'NORMAL',
        sla: '1 Hari',
        assignedOperator: 'PR-01 (Online)',
        confidenceScore: 97,
        isEmergency: false,
        smartLabels: ['PKKPR', 'KRK', 'Siteplan', 'Informasi'],
        aiSuggestedReply: {
          text: 'Selamat pagi. Untuk persyaratan pengajuan PKKPR di Kecamatan Tarogong, silakan siapkan KTP, bukti kepemilikan tanah, dan koordinat poligon lokasi.',
          confidence: 97,
          source: 'PURI Penataan Ruang KB',
        },
        messages: [
          {
            id: 'm4',
            sender: 'user',
            senderName: 'PT. Garut Bangun Persada',
            text: 'Selamat pagi, mohon info persyaratan pengajuan PKKPR untuk rencana pembangunan ruko di Tarogong.',
            timestamp: new Date(now.getTime() - 62 * 60000),
            status: 'read',
          }
        ]
      },
      {
        id: 'conv-5',
        contactName: 'Bambang S. (Tarogong Kidul)',
        contactNumber: '+6281901234567',
        location: 'Kec. Tarogong Kidul',
        lastMessage: 'Aliran pipa air minum SPAM lingkungan desa kami tersumbat sejak sore kemarin.',
        timestamp: new Date(now.getTime() - 110 * 60000),
        unreadCount: 0,
        status: 'active',
        category: 'SPAM',
        bidang: 'AMPL',
        layanan: 'SPAM & Air Minum',
        intent: 'PENGADUAN',
        prioritas: 'TINGGI',
        sla: '3 Jam',
        assignedOperator: 'AMPL-01 (Online)',
        confidenceScore: 95,
        isEmergency: false,
        smartLabels: ['SPAM', 'Sanitasi', 'Pengaduan'],
        aiSuggestedReply: {
          text: 'Mohon maaf atas ketidaknyamanannya Pak Bambang. Tiket pemeliharaan pipa SPAM Tarogong Kidul telah diteruskan ke teknisi AMPL dengan SLA penanganan 3 jam.',
          confidence: 95,
          source: 'PURI AMPL Engine',
        },
        messages: [
          {
            id: 'm5',
            sender: 'user',
            senderName: 'Bambang S.',
            text: 'Aliran pipa air minum SPAM lingkungan desa kami tersumbat sejak sore kemarin.',
            timestamp: new Date(now.getTime() - 110 * 60000),
            status: 'read',
          }
        ]
      },
      {
        id: 'conv-6',
        contactName: 'CV. Mitra Garut Mandiri',
        contactNumber: '+6282123456789',
        location: 'Kec. Karangpawitan',
        lastMessage: 'Kapan jadwal pembinaan dan sertifikasi tenaga terampil konstruksi bulan ini?',
        timestamp: new Date(now.getTime() - 240 * 60000),
        unreadCount: 0,
        status: 'active',
        category: 'Jasa Konstruksi',
        bidang: 'JASA_KONSTRUKSI',
        layanan: 'Pembinaan & Sertifikasi BUJK',
        intent: 'INFORMASI',
        prioritas: 'RENDAH',
        sla: '1 Hari',
        assignedOperator: 'JK-01 (Online)',
        confidenceScore: 99,
        isEmergency: false,
        smartLabels: ['Jasa Konstruksi', 'Informasi'],
        aiSuggestedReply: {
          text: 'Selamat siang. Jadwal pembinaan dan sertifikasi tenaga terampil konstruksi berikutnya diselenggarakan pada tanggal 15 bulan ini di Aula Dinas PUPR Garut.',
          confidence: 99,
          source: 'PURI Jasa Konstruksi KB',
        },
        messages: [
          {
            id: 'm6',
            sender: 'user',
            senderName: 'CV. Mitra Garut Mandiri',
            text: 'Kapan jadwal pembinaan dan sertifikasi tenaga terampil konstruksi bulan ini?',
            timestamp: new Date(now.getTime() - 240 * 60000),
            status: 'read',
          }
        ]
      }
    ];
  }

  static async sendMessageApi(conversationId: string, text: string, sender: 'user' | 'bot' | 'operator' = 'operator') {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId,
          text,
          sender,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data;
      }
      console.warn('[WhatsAppService] sendMessageApi error:', data.error || `HTTP ${res.status}`);
      return { error: data.error || `Gagal mengirim pesan (HTTP ${res.status})`, status: res.status };
    } catch (e: any) {
      console.error('Failed sending message via API:', e);
      return { error: e.message || 'Gagal terhubung ke server', status: 500 };
    }
  }

  static async sendMediaApi(conversationId: string, base64Data: string, type: 'image' | 'document', caption: string, fileName?: string, mimetype?: string) {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_media',
          conversationId,
          base64Data,
          type,
          caption,
          fileName,
          mimetype,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data;
      }
      console.warn('[WhatsAppService] sendMediaApi error:', data.error || `HTTP ${res.status}`);
      return { error: data.error || `Gagal mengirim media (HTTP ${res.status})`, status: res.status };
    } catch (e: any) {
      console.error('Failed sending media via API:', e);
      return { error: e.message || 'Gagal terhubung ke server', status: 500 };
    }
  }

  static async addNoteApi(conversationId: string, note: string) {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          conversationId,
          note,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed adding note via API:', e);
    }
    return null;
  }

  static async getOperators(): Promise<OperatorStatus[]> {
    return [
      { id: 'op-1', name: 'Admin PUPR (Anda)', status: 'online', activeTask: 'Super Admin Operator' }
    ];
  }

  static async getBotLogs(): Promise<WhatsAppBotLog[]> {
    try {
      const res = await fetch('/api/whatsapp/messages', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          return data.logs.map((l: any) => ({
            ...l,
            timestamp: new Date(l.timestamp),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed fetching logs from API:', e);
    }
    return [];
  }

  static async getBotSettings() {
    try {
      const res = await fetch('/api/whatsapp/bot-settings', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch bot settings via API:', e);
    }

    return {
      is_active: true,
      model: 'gemini-2.0-flash',
      system_prompt: 'Anda adalah Asisten Virtual Resmi Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut untuk Layanan WhatsApp Center. Jawablah pertanyaan warga dengan sopan, akurat, dan ringkas dalam Bahasa Indonesia berdasarkan standar pelayanan PBG dan SLF PUPR Garut.',
      min_text_length: 2
    };
  }

  static async updateBotSettings(settings: any) {
    const res = await fetch('/api/whatsapp/bot-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal menyimpan pengaturan bot.');
  }

  static async getBotMenuFlows() {
    try {
      const res = await fetch('/api/whatsapp/bot-flows', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed fetching bot flows:', e);
    }
    return [];
  }

  static async saveBotMenuFlowItem(item: any) {
    const res = await fetch('/api/whatsapp/bot-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_item', item })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal menyimpan menu item');
  }

  static async deleteBotMenuFlowItem(item: any) {
    const res = await fetch('/api/whatsapp/bot-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_item', item })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal menghapus menu item');
  }

  static async seedDefaultBotMenuFlows() {
    const res = await fetch('/api/whatsapp/bot-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_defaults' })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal memuat template menu default');
  }

  static async getBotKeywords() {
    try {
      const res = await fetch('/api/whatsapp/bot-keywords', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed fetching bot keywords:', e);
    }
    return [];
  }

  static async saveBotKeywordItem(item: any) {
    const res = await fetch('/api/whatsapp/bot-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_item', item })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal menyimpan kata kunci');
  }

  static async deleteBotKeywordItem(item: any) {
    const res = await fetch('/api/whatsapp/bot-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_item', item })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal menghapus kata kunci');
  }

  static async seedDefaultBotKeywords() {
    const res = await fetch('/api/whatsapp/bot-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_defaults' })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Gagal memuat template kata kunci default');
  }
}


