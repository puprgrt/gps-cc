/**
 * ============================================================================
 * BIDANG FORWARDING SERVICE (DISPOSISI OTOMATIS KE NOMOR WA BIDANG PUPR)
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 * 
 * Bertanggung jawab mengelola nomor WhatsApp resmi dari 7 Bidang Dinas PUPR Garut:
 * - BINA_MARGA, SDA, BANGUNAN_GEDUNG, PENATAAN_RUANG, AMPL, JASA_KONSTRUKSI, SEKRETARIAT
 * 
 * Melakukan forwarding/disposisi otomatis atau manual:
 * 1. Pengaduan warga (Infrastruktur, jalan, jembatan, banjir, irigasi, dsb.)
 * 2. Permohonan layanan & konsultasi teknis (PBG, SLF, KRK, PKKPR, SPAM, dsb.)
 * 3. Notifikasi darurat / KRITIS ke tim reaksi cepat (TRC) bidang
 * 4. Pengiriman konfirmasi status ke nomor WhatsApp pelapor (jika aktif)
 */

const fs = require('fs');
const path = require('path');
const supabaseService = require('./supabaseService');

const LOCAL_FILE_PATH = path.join(__dirname, '../data/bidang_forwarding_settings.json');

class BidangForwardingService {
  constructor() {
    this.memoryCache = null;
    this.ensureFileExists();
  }

  ensureFileExists() {
    try {
      const dir = path.dirname(LOCAL_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(LOCAL_FILE_PATH)) {
        const defaultData = this.getDefaultSettings();
        fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[BidangForwardingService] Gagal memeriksa file lokal:', e.message);
    }
  }

  getDefaultSettings() {
    return {
      isEnabled: true,
      notifyCitizenOnForward: true,
      defaultTemplatePengaduan: "🏛️ *DISPOSISI PENGADUAN WARGA - DINAS PUPR KAB. GARUT*\n────────────────────────\nYth. Rekan Tim *{{namaBidang}}*,\nBerikut diteruskan laporan pengaduan masyarakat dari Sistem Komando GPS-CC / AI PURI:\n\n📋 *No. Tiket:* {{nomorTiket}}\n🚨 *Prioritas:* {{prioritas}}\n👤 *Pelapor:* {{pelapor}} ({{kontak}})\n📍 *Lokasi:* {{lokasi}}, Kec. {{kecamatan}}\n🏷️ *Kategori:* {{kategori}}\n\n📝 *Ringkasan Masalah:*\n\"{{deskripsi}}\"\n\n💡 *Rekomendasi Tindak Lanjut:*\n{{langkahPenanganan}}\n\n💬 *Catatan Disposisi Command Center:*\n{{catatanDisposisi}}\n────────────────────────\n_Mohon unit teknis lapangan segera meninjau dan menindaklanjuti sesuai SOP Pelayanan PUPR Garut._",
      defaultTemplatePermohonan: "🏛️ *DISPOSISI PERMOHONAN LAYANAN - DINAS PUPR KAB. GARUT*\n────────────────────────\nYth. Tim Pelayanan *{{namaBidang}}*,\nTerdapat permohonan layanan / konsultasi teknis warga yang ditujukan ke bidang Anda:\n\n📋 *No. Registrasi / Tiket:* {{nomorTiket}}\n📌 *Layanan:* {{layanan}}\n👤 *Pemohon:* {{pelapor}} ({{kontak}})\n📍 *Lokasi / Objek:* {{lokasi}}\n\n📝 *Rincian Permohonan:*\n\"{{deskripsi}}\"\n\n💬 *Catatan Disposisi Command Center:*\n{{catatanDisposisi}}\n────────────────────────\n_Mohon petugas loket / tim teknis bidang segera memverifikasi kelengkapan berkas pemohon._",
      contacts: {
        BINA_MARGA: {
          bidang: 'BINA_MARGA',
          namaBidang: 'Bidang Bina Marga (Jalan & Jembatan)',
          nomorWa: '6281223456701',
          namaPejabat: 'Ir. Asep Rustandi, S.T. / Koordinator TRC',
          jabatan: 'Koordinator Tim Reaksi Cepat (TRC) Jalan & Jembatan',
          email: 'binamarga.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        SDA: {
          bidang: 'SDA',
          namaBidang: 'Bidang Sumber Daya Air (SDA)',
          nomorWa: '6281223456702',
          namaPejabat: 'Dadan Ramdani, S.T. / Satgas Irigasi & Banjir',
          jabatan: 'Koordinator Pengendalian Banjir & Irigasi',
          email: 'sda.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        BANGUNAN_GEDUNG: {
          bidang: 'BANGUNAN_GEDUNG',
          namaBidang: 'Bidang Bangunan Gedung (PBG, SLF & BGN)',
          nomorWa: '6281223456703',
          namaPejabat: 'H. Hendra Lesmana, S.T. / Tim Teknis PBG',
          jabatan: 'Penata Bangunan Gedung & Tim Ahli Bangunan Gedung (TABG)',
          email: 'bangunangedung.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        PENATAAN_RUANG: {
          bidang: 'PENATAAN_RUANG',
          namaBidang: 'Bidang Penataan Ruang (KRK & PKKPR)',
          nomorWa: '6281223456704',
          namaPejabat: 'Rina Marlina, S.T., M.Sc. / Tim Pelipur',
          jabatan: 'Koordinator Pelayanan Informasi Tata Ruang (Pelipur)',
          email: 'tataruang.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        AMPL: {
          bidang: 'AMPL',
          namaBidang: 'Bidang Air Minum & Penyehatan Lingkungan (AMPL)',
          nomorWa: '6281223456705',
          namaPejabat: 'Egi Nugraha, S.T. / Satgas SPAM',
          jabatan: 'Penata Kelola Air Bersih & Sanitasi Permukiman',
          email: 'ampl.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        JASA_KONSTRUKSI: {
          bidang: 'JASA_KONSTRUKSI',
          namaBidang: 'Bidang Jasa Konstruksi (Jakon)',
          nomorWa: '6281223456706',
          namaPejabat: 'Drs. Yudi Setiadi / Seksi Pembinaan BUJK',
          jabatan: 'Pengawas Tata Kelola Usaha Jasa Konstruksi',
          email: 'jakon.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        },
        SEKRETARIAT: {
          bidang: 'SEKRETARIAT',
          namaBidang: 'Sekretariat / Subbagian Umum & Kepegawaian',
          nomorWa: '6281223456707',
          namaPejabat: 'Agus Sugandi, S.IP / Petugas Loket Umum',
          jabatan: 'Pengelola Persuratan, Disposisi & Pelayanan PPID',
          email: 'sekretariat.pupr@garutkab.go.id',
          isActive: true,
          autoForwardPengaduan: true,
          autoForwardPermohonan: true,
          forwardEmergencyOnly: false,
          lastForwardedAt: null,
          totalForwardedCount: 0
        }
      },
      history: [],
      updatedAt: new Date().toISOString(),
      updatedBy: 'Sistem Inisialisasi PUPR Garut'
    };
  }

  readLocalSettings() {
    try {
      this.ensureFileExists();
      const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[BidangForwardingService] Gagal membaca file lokal:', e.message);
      return this.getDefaultSettings();
    }
  }

  writeLocalSettings(data) {
    try {
      this.ensureFileExists();
      fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
      this.memoryCache = data;
      return true;
    } catch (e) {
      console.error('[BidangForwardingService] Gagal menulis file lokal:', e.message);
      return false;
    }
  }

  async getSettings() {
    if (this.memoryCache) return this.memoryCache;

    // 1. Coba baca dari Supabase
    try {
      if (supabaseService && supabaseService.supabase) {
        const { data, error } = await supabaseService.supabase
          .from('wa_bidang_forwarding_settings')
          .select('settings_data')
          .eq('id', 'global')
          .maybeSingle();

        if (!error && data?.settings_data) {
          this.memoryCache = data.settings_data;
          this.writeLocalSettings(data.settings_data);
          return data.settings_data;
        }
      }
    } catch (err) {
      // Supabase table belum ada atau koneksi offline, fallback ke lokal
    }

    // 2. Fallback ke file JSON lokal
    const local = this.readLocalSettings();
    this.memoryCache = local;
    return local;
  }

  async saveSettings(newSettings, updatedBy = 'Admin CC') {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...newSettings,
      contacts: {
        ...current.contacts,
        ...(newSettings.contacts || {})
      },
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    // Simpan ke lokal
    this.writeLocalSettings(updated);

    // Coba simpan ke Supabase secara asinkron
    try {
      if (supabaseService && supabaseService.supabase) {
        await supabaseService.supabase
          .from('wa_bidang_forwarding_settings')
          .upsert({
            id: 'global',
            settings_data: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }
    } catch (err) {
      // Silently ignore if table doesn't exist
    }

    return updated;
  }

  async getContactForBidang(bidangKey) {
    const settings = await this.getSettings();
    const key = (bidangKey || 'SEKRETARIAT').toUpperCase();
    return settings.contacts[key] || settings.contacts['SEKRETARIAT'];
  }

  formatForwardMessage(input, contact, settings) {
    const isPengaduan = input.type === 'PENGADUAN' || input.type === 'DARURAT';
    let template = contact.customTemplate || 
      (isPengaduan ? settings.defaultTemplatePengaduan : settings.defaultTemplatePermohonan);

    const replacements = {
      '{{namaBidang}}': contact.namaBidang || input.bidang,
      '{{nomorTiket}}': input.ticketNumber || `TKT-${Date.now().toString().slice(-6)}`,
      '{{prioritas}}': input.prioritas || 'NORMAL',
      '{{pelapor}}': input.pelaporName || 'Warga Garut',
      '{{kontak}}': input.pelaporPhone || '-',
      '{{lokasi}}': input.lokasi || 'Kabupaten Garut',
      '{{kecamatan}}': input.kecamatan || 'Garut Kota',
      '{{kategori}}': input.kategori || input.layanan || 'Infrastruktur Publik',
      '{{layanan}}': input.layanan || 'Layanan PUPR',
      '{{deskripsi}}': input.deskripsi || input.judul || '-',
      '{{langkahPenanganan}}': input.langkahPenanganan || 'Segera lakukan koordinasi lapangan dan verifikasi teknis.',
      '{{catatanDisposisi}}': input.catatanDisposisi || 'Diteruskan langsung dari Command Center Dinas PUPR Garut.'
    };

    let result = template;
    for (const [key, val] of Object.entries(replacements)) {
      result = result.split(key).join(String(val));
    }

    return result;
  }

  formatCitizenConfirmationMessage(input, contact) {
    return (
      `🏛️ *DINAS PEKERJAAN UMUM & PENATAAN RUANG KAB. GARUT*\n` +
      `────────────────────────\n` +
      `Halo Bapak/Ibu *${input.pelaporName || 'Warga Garut'}*,\n\n` +
      `Laporan/Permohonan Anda [${input.ticketNumber || 'Tiket Terdaftar'}] telah resmi *diteruskan (didisposisikan)* langsung ke tim teknis:\n\n` +
      `🏢 *Bidang Tujuan:* ${contact.namaBidang}\n` +
      `👤 *PIC / Koordinator:* ${contact.namaPejabat}\n` +
      `🚨 *Status:* Diteruskan ke WhatsApp Unit Reaksi Cepat / Pelayanan Bidang\n\n` +
      `Tim kami akan menindaklanjuti laporan Anda sesuai Standar Operasional Prosedur (SOP). Terima kasih atas partisipasi aktif Anda dalam pembangunan Kabupaten Garut. 🙏`
    );
  }

  /**
   * Dispatch Forwarding WhatsApp Message
   */
  async dispatchForward(input, whatsappClient = null) {
    const settings = await this.getSettings();
    if (!settings.isEnabled) {
      return {
        success: false,
        bidang: input.bidang,
        targetWa: '',
        targetName: '',
        formattedMessage: '',
        dispatchedAt: new Date().toISOString(),
        error: 'Sistem forward WhatsApp bidang sedang dinonaktifkan secara global di Pengaturan.'
      };
    }

    const contact = await this.getContactForBidang(input.bidang);
    const targetWa = (input.targetNomorWa || contact.nomorWa || '').replace(/\D/g, '');

    if (!targetWa || targetWa.length < 9) {
      return {
        success: false,
        bidang: input.bidang,
        targetWa,
        targetName: contact.namaPejabat,
        formattedMessage: '',
        dispatchedAt: new Date().toISOString(),
        error: `Nomor WhatsApp resmi untuk ${contact.namaBidang} belum dikonfigurasi dengan benar.`
      };
    }

    const formattedMessage = this.formatForwardMessage(input, contact, settings);
    let messageId = `fwd-${Date.now()}`;
    let isSuccess = false;
    let errorMessage = null;

    // Format nomor WhatsApp tujuan
    let cleanWa = targetWa;
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.substring(1);
    }
    const targetJid = cleanWa + '@s.whatsapp.net';

    // 1. Eksekusi pengiriman melalui Baileys Client
    try {
      if (whatsappClient && typeof whatsappClient.sendMessageReliable === 'function') {
        const sent = await whatsappClient.sendMessageReliable(targetJid, { text: formattedMessage });
        messageId = sent?.key?.id || messageId;
        isSuccess = true;
        whatsappClient.addLog(
          'FORWARD_DISPATCH',
          `Disposisi ${input.type} [${input.ticketNumber || 'TKT'}] sukses terkirim ke ${contact.namaBidang} (${cleanWa})`
        );
      } else {
        // Coba panggil internal HTTP API jika whatsappClient tidak di-pass langsung
        const BAILEYS_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
        const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026';
        
        const res = await fetch(`${BAILEYS_URL}/api/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-baileys-api-key': BAILEYS_API_KEY
          },
          body: JSON.stringify({
            to: cleanWa,
            text: formattedMessage,
            sender: 'command_center_forwarder'
          })
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          messageId = resData?.saved?.id || resData?.data?.key?.id || messageId;
          isSuccess = true;
        } else {
          const errRes = await res.json().catch(() => ({}));
          errorMessage = errRes.error || `Server WhatsApp merespons status ${res.status}`;
        }
      }
    } catch (sendErr) {
      console.error('[BidangForwardingService] Error saat mengirim pesan forward:', sendErr.message);
      errorMessage = sendErr.message;
    }

    // 2. Opsional: Notifikasi konfirmasi ke warga
    let citizenNotified = false;
    if (isSuccess && (input.sendCitizenConfirmation || settings.notifyCitizenOnForward) && input.pelaporPhone) {
      let citizenWa = input.pelaporPhone.replace(/\D/g, '');
      if (citizenWa.startsWith('0')) citizenWa = '62' + citizenWa.substring(1);
      if (citizenWa.length >= 9) {
        try {
          const citizenMsg = this.formatCitizenConfirmationMessage(input, contact);
          const citizenJid = citizenWa + '@s.whatsapp.net';
          if (whatsappClient && typeof whatsappClient.sendMessageReliable === 'function') {
            await whatsappClient.sendMessageReliable(citizenJid, { text: citizenMsg });
            citizenNotified = true;
          }
        } catch (e) {
          console.warn('[BidangForwardingService] Gagal mengirim konfirmasi ke warga:', e.message);
        }
      }
    }

    // 3. Catat Riwayat & Update Statistik Bidang
    const historyItem = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber: input.ticketNumber || '-',
      type: input.type,
      bidang: input.bidang,
      targetNomorWa: cleanWa,
      targetName: contact.namaPejabat || contact.namaBidang,
      pelaporName: input.pelaporName,
      judul: input.judul,
      prioritas: input.prioritas || 'NORMAL',
      dispatchedBy: input.dispatchedBy || 'PURI AI Automated Router',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      errorMessage: errorMessage || undefined,
      createdAt: new Date().toISOString()
    };

    // Update counter bidang
    if (settings.contacts[input.bidang]) {
      settings.contacts[input.bidang].totalForwardedCount = (settings.contacts[input.bidang].totalForwardedCount || 0) + (isSuccess ? 1 : 0);
      settings.contacts[input.bidang].lastForwardedAt = new Date().toISOString();
    }

    // Simpan riwayat maksimal 100 log terakhir
    if (!Array.isArray(settings.history)) settings.history = [];
    settings.history.unshift(historyItem);
    if (settings.history.length > 100) settings.history = settings.history.slice(0, 100);

    this.writeLocalSettings(settings);

    return {
      success: isSuccess,
      messageId,
      bidang: input.bidang,
      targetWa: cleanWa,
      targetName: contact.namaPejabat,
      formattedMessage,
      dispatchedAt: new Date().toISOString(),
      citizenNotified,
      error: errorMessage || undefined
    };
  }
}

// Export Singleton Instance
module.exports = new BidangForwardingService();
