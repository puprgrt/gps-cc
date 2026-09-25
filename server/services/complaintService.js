/**
 * ============================================================================
 * PURI COMPLAINT SERVICE (PENGADUAN OTOMATIS DARI WA BOT & COMMAND CENTER)
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 * 
 * Bertanggung jawab menangkap respon "Ringkasan Laporan Pengaduan" dari WA BOT,
 * mengekstraksi data secara otomatis, menyimpannya ke database persisten,
 * serta menyediakannya secara realtime ke Dashboard & Tabel List Pengaduan.
 */

const fs = require('fs');
const path = require('path');
const supabaseService = require('./supabaseService');

const DATA_DIR = path.join(__dirname, '../data');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'puri_complaints.json');

// Pastikan direktori data ada
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class ComplaintService {
  constructor() {
    this.ensureFileExists();
  }

  ensureFileExists() {
    if (!fs.existsSync(COMPLAINTS_FILE)) {
      fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  readComplaints() {
    try {
      this.ensureFileExists();
      const raw = fs.readFileSync(COMPLAINTS_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[ComplaintService] Error membaca data pengaduan:', err.message);
      return [];
    }
  }

  writeComplaints(data) {
    try {
      this.ensureFileExists();
      fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ComplaintService] Error menyimpan data pengaduan:', err.message);
      return false;
    }
  }

  generateTicketNumber(sequence = 1) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seqStr = String(sequence).padStart(3, '0');
    return `TKT-${yyyy}${mm}${dd}-${seqStr}`;
  }

  extractKecamatan(locationText = '') {
    const listKecamatan = [
      'Garut Kota', 'Tarogong Kidul', 'Tarogong Kaler', 'Samarang', 'Pasirwangi',
      'Bayongbong', 'Cilawu', 'Cikajang', 'Banyuresmi', 'Leles', 'Kadungora',
      'Cibatu', 'Kersamanah', 'Malangbong', 'Karangpawitan', 'Wanaraja', 'Pangatikan',
      'Sucinaraja', 'Cisurupan', 'Sukaresmi', 'Cigedug', 'Banjarwangi', 'Singajaya',
      'Peundeuy', 'Cihurip', 'Cikamat', 'Pakenjeng', 'Pamulihan', 'Bungbulang',
      'Mekarmukti', 'Carengceng', 'Talegong', 'Cisewu', 'Caringin', 'Cibalong',
      'Pameungpeuk', 'Cikelet'
    ];
    for (const kec of listKecamatan) {
      if (new RegExp(`\\b${kec}\\b`, 'i').test(locationText)) {
        return kec;
      }
    }
    return 'Garut Kota';
  }

  /**
   * Ekstraksi cerdas entitas pengaduan dari teks jawaban WA BOT
   */
  extractComplaintFromBotReply(replyText, userMessageText = '', senderInfo = {}, routingDecision = {}) {
    if (!replyText) return null;

    const hasRingkasan = 
      /Ringkasan Laporan Pengaduan/i.test(replyText) ||
      /Laporan Pengaduan Resmi/i.test(replyText) ||
      routingDecision?.intent === 'PENGADUAN' ||
      /ringkasan laporan/i.test(replyText);

    if (!hasRingkasan && routingDecision?.intent !== 'PENGADUAN') {
      return null;
    }

    const cleanVal = (val) => val ? val.replace(/^\*+|\*+$/g, '').trim() : '';

    // Regex pencocokan format terstruktur PURI AI
    const pelaporMatch = replyText.match(/[-*•]\s*\*?Pelapor:\*?\s*([^\n\r]+)/i);
    const lokasiMatch = replyText.match(/[-*•]\s*\*?Lokasi(?:\s*Detail)?:\*?\s*([^\n\r]+)/i);
    const jenisMatch = 
      replyText.match(/[-*•]\s*\*?Jenis Permasalahan:\*?\s*([^\n\r]+)/i) || 
      replyText.match(/[-*•]\s*\*?Permasalahan:\*?\s*([^\n\r]+)/i) ||
      replyText.match(/[-*•]\s*\*?Kerusakan:\*?\s*([^\n\r]+)/i);
    const bidangMatch = 
      replyText.match(/[-*•]\s*\*?Kategori Bidang:\*?\s*([^\n\r]+)/i) ||
      replyText.match(/[-*•]\s*\*?Bidang:\*?\s*([^\n\r]+)/i);
    const prioritasMatch = 
      replyText.match(/[-*•]\s*\*?Tingkat Prioritas:\*?\s*([^\n\r]+)/i) ||
      replyText.match(/[-*•]\s*\*?Prioritas:\*?\s*([^\n\r]+)/i);
    const langkahMatch = 
      replyText.match(/\*?Langkah Penanganan:\*?\s*\n?([^\n\r]+(?:\n[^\n\r]+)*?)(?=\n\n|\n[A-Z]|$)/i);

    let rawPelapor = cleanVal(pelaporMatch?.[1]) || senderInfo.name || 'Warga PUPR';
    let rawLokasi = cleanVal(lokasiMatch?.[1]) || 'Kabupaten Garut';
    let rawJudul = cleanVal(jenisMatch?.[1]) || (userMessageText ? userMessageText.slice(0, 100) : 'Laporan Pengaduan Infrastruktur PUPR');
    let rawBidang = cleanVal(bidangMatch?.[1]) || routingDecision?.primaryBidang || 'SEKRETARIAT';
    let rawPrioritas = cleanVal(prioritasMatch?.[1]) || routingDecision?.prioritas || 'NORMAL';
    let langkah = cleanVal(langkahMatch?.[1]) || 'Laporan diprioritaskan dan diteruskan kepada Tim Teknis terkait untuk peninjauan lokasi.';

    // Normalisasi Bidang PUPR
    let bidang = 'SEKRETARIAT';
    let bidangLabel = 'Sekretariat';
    if (/SDA|Sumber Daya Air|Sungai|Banjir|Irigasi|Ciwalen/i.test(rawBidang)) {
      bidang = 'SDA';
      bidangLabel = 'Sumber Daya Air (SDA)';
    } else if (/Bina Marga|Jalan|Jembatan|TRC/i.test(rawBidang)) {
      bidang = 'BINA_MARGA';
      bidangLabel = 'Bina Marga (Jalan & Jembatan)';
    } else if (/Bangunan|Gedung|PBG|SLF|BGN/i.test(rawBidang)) {
      bidang = 'BANGUNAN_GEDUNG';
      bidangLabel = 'Bangunan Gedung';
    } else if (/AMPL|Air Minum|Sanitasi|Drainase|Limbah/i.test(rawBidang)) {
      bidang = 'AMPL';
      bidangLabel = 'Air Minum & Penyehatan Lingkungan (AMPL)';
    } else if (/Penataan Ruang|KRK|PKKPR|Tata Ruang/i.test(rawBidang)) {
      bidang = 'PENATAAN_RUANG';
      bidangLabel = 'Penataan Ruang';
    } else if (/Jasa Konstruksi/i.test(rawBidang)) {
      bidang = 'JASA_KONSTRUKSI';
      bidangLabel = 'Jasa Konstruksi';
    }

    // Normalisasi Prioritas
    let prioritas = 'NORMAL';
    if (/KRITIS|EMERGENCY|DARURAT|Banjir|Jembatan Ambruk|Jalan Putus/i.test(rawPrioritas)) {
      prioritas = 'KRITIS';
    } else if (/TINGGI|HIGH/i.test(rawPrioritas)) {
      prioritas = 'TINGGI';
    } else if (/RENDAH|LOW/i.test(rawPrioritas)) {
      prioritas = 'RENDAH';
    }

    // Tentukan Kategori Singkat
    let kategori = 'Infrastruktur Publik';
    if (/sungai|limbah|sampah|banjir/i.test(rawJudul)) kategori = 'Sungai & Pengendalian Banjir';
    else if (/jalan/i.test(rawJudul)) kategori = 'Kerusakan Jalan';
    else if (/jembatan/i.test(rawJudul)) kategori = 'Kerusakan Jembatan';
    else if (/irigasi/i.test(rawJudul)) kategori = 'Saluran Irigasi';
    else if (/drainase/i.test(rawJudul)) kategori = 'Drainase Tersumbat';

    const kecamatan = this.extractKecamatan(rawLokasi);

    return {
      pelapor: rawPelapor,
      lokasi: rawLokasi,
      kecamatan,
      judul: rawJudul,
      deskripsi: userMessageText || rawJudul,
      bidang,
      bidangLabel,
      kategori,
      prioritas,
      langkahPenanganan: langkah,
      ringkasanBot: replyText
    };
  }

  /**
   * Menangani auto-ingest pengaduan dari pesan bot secara otomatis
   */
  async handleAutoIngest(replyText, userMessageText = '', senderInfo = {}, routingDecision = {}) {
    try {
      const extracted = this.extractComplaintFromBotReply(replyText, userMessageText, senderInfo, routingDecision);
      if (!extracted) return null;

      const complaints = this.readComplaints();
      const conversationId = senderInfo.conversationId || (senderInfo.senderJid ? `conv-${senderInfo.senderJid}` : undefined);
      const phone = senderInfo.phoneNumber || (senderInfo.senderJid ? senderInfo.senderJid.split('@')[0] : '628xxxxxxxx');

      // Cek apakah pengaduan dengan judul & percakapan serupa sudah ada dalam 2 jam terakhir (cegah duplikat)
      const existing = complaints.find(c => 
        (conversationId && c.conversationId === conversationId && c.judul === extracted.judul) ||
        (c.nomorKontak === phone && c.judul === extracted.judul && (Date.now() - new Date(c.createdAt).getTime() < 2 * 3600 * 1000))
      );

      if (existing) {
        // Perbarui data jika perlu
        existing.ringkasanBot = replyText;
        existing.prioritas = extracted.prioritas;
        existing.updatedAt = new Date().toISOString();
        this.writeComplaints(complaints);
        console.log(`[ComplaintService] Memperbarui pengaduan tiket existing: ${existing.nomorTiket}`);
        return existing;
      }

      // Buat nomor tiket baru
      const seq = complaints.length + 1;
      const nomorTiket = this.generateTicketNumber(seq);
      const ticketId = `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newTicket = {
        id: ticketId,
        nomorTiket,
        conversationId,
        pelapor: extracted.pelapor,
        nomorKontak: phone,
        lokasi: extracted.lokasi,
        kecamatan: extracted.kecamatan,
        judul: extracted.judul,
        deskripsi: extracted.deskripsi,
        bidang: extracted.bidang,
        bidangLabel: extracted.bidangLabel,
        kategori: extracted.kategori,
        prioritas: extracted.prioritas,
        status: 'PENDING',
        langkahPenanganan: extracted.langkahPenanganan,
        ringkasanBot: extracted.ringkasanBot,
        assignedOperator: routingDecision?.assignedOperatorId || 'OP-SDA-01 (TRC)',
        catatanPetugas: 'Diteruskan otomatis dari Ringkasan Laporan AI PURI ke TRC Bidang.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'WHATSAPP_BOT'
      };

      complaints.unshift(newTicket);
      this.writeComplaints(complaints);

      console.log(`[ComplaintService] ✅ PENGADUAN BARU TERDAFTAR SECARA OTOMATIS: ${newTicket.nomorTiket} (${newTicket.pelapor} - ${newTicket.bidang})`);

      // Update percakapan di Supabase agar kategori percakapan menjadi 'PENGADUAN'
      if (conversationId) {
        await supabaseService.updateConversationStatus(
          conversationId,
          'pending',
          {
            category: 'PENGADUAN',
            bidang: newTicket.bidang,
            prioritas: newTicket.prioritas,
            layanan: 'Pengaduan Masyarakat',
            smart_labels: ['Pengaduan', newTicket.kategori, newTicket.bidang]
          }
        );
      }

      return newTicket;
    } catch (err) {
      console.error('[ComplaintService] Error auto-ingesting complaint:', err);
      return null;
    }
  }

  getAllComplaints(filters = {}) {
    let list = this.readComplaints();

    if (filters.status && filters.status !== 'SEMUA') {
      list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.bidang && filters.bidang !== 'SEMUA') {
      list = list.filter(c => c.bidang.toUpperCase() === filters.bidang.toUpperCase());
    }
    if (filters.prioritas && filters.prioritas !== 'SEMUA') {
      list = list.filter(c => c.prioritas.toUpperCase() === filters.prioritas.toUpperCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        (c.nomorTiket && c.nomorTiket.toLowerCase().includes(q)) ||
        (c.pelapor && c.pelapor.toLowerCase().includes(q)) ||
        (c.lokasi && c.lokasi.toLowerCase().includes(q)) ||
        (c.judul && c.judul.toLowerCase().includes(q)) ||
        (c.nomorKontak && c.nomorKontak.includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getComplaintById(id) {
    const list = this.readComplaints();
    return list.find(c => c.id === id || c.nomorTiket === id) || null;
  }

  updateComplaintStatus(id, newStatus, catatanPetugas, assignedOperator) {
    const list = this.readComplaints();
    const item = list.find(c => c.id === id || c.nomorTiket === id);
    if (!item) return null;

    if (newStatus) item.status = newStatus.toUpperCase();
    if (catatanPetugas !== undefined) item.catatanPetugas = catatanPetugas;
    if (assignedOperator !== undefined) item.assignedOperator = assignedOperator;
    item.updatedAt = new Date().toISOString();

    this.writeComplaints(list);
    return item;
  }

  getStats() {
    const list = this.readComplaints();
    const stats = {
      total: list.length,
      kritis: list.filter(c => c.prioritas === 'KRITIS').length,
      tinggi: list.filter(c => c.prioritas === 'TINGGI').length,
      normal: list.filter(c => c.prioritas === 'NORMAL' || c.prioritas === 'RENDAH').length,
      pending: list.filter(c => c.status === 'PENDING').length,
      diproses: list.filter(c => c.status === 'DIPROSES').length,
      selesai: list.filter(c => c.status === 'SELESAI').length,
      byBidang: {}
    };

    list.forEach(c => {
      const b = c.bidang || 'UMUM';
      stats.byBidang[b] = (stats.byBidang[b] || 0) + 1;
    });

    return stats;
  }

  /**
   * Pindai dan masukkan data laporan historis yang sudah ada (misal Pak Beng Beng)
   */
  async initAndSeedPastComplaints() {
    const complaints = this.readComplaints();
    if (complaints.length > 0) {
      console.log(`[ComplaintService] Database pengaduan aktif (${complaints.length} tiket).`);
      return;
    }

    console.log('[ComplaintService] Menginisialisasi & memindai laporan pengaduan historis...');
    
    // Cek di FAQ cache atau data lokal
    const faqPath = path.join(DATA_DIR, 'puri_faq_db.json');
    if (fs.existsSync(faqPath)) {
      try {
        const faqs = JSON.parse(fs.readFileSync(faqPath, 'utf8'));
        for (const item of faqs) {
          if (item.replyText && item.replyText.includes('Ringkasan Laporan Pengaduan')) {
            await this.handleAutoIngest(
              item.replyText,
              item.key || 'Laporan penumpukan sampah di Sungai Ciwalen',
              {
                name: 'Pak Beng Beng (Pengurus RW 18)',
                phoneNumber: '628122299180',
                conversationId: 'conv-225911119020165@lid'
              },
              { primaryBidang: 'SDA', prioritas: 'KRITIS', intent: 'PENGADUAN' }
            );
          }
        }
      } catch (e) {
        console.warn('[ComplaintService] Gagal memindai FAQ DB:', e.message);
      }
    }

    // Tambahkan juga laporan pengaduan sample realistis Dinas PUPR Garut jika belum ada data lain
    const currentComplaints = this.readComplaints();
    if (currentComplaints.length <= 1) {
      const sampleSeed = [
        {
          id: 'tkt-seed-002',
          nomorTiket: 'TKT-20260923-002',
          conversationId: 'conv-6281312345678@s.whatsapp.net',
          pelapor: 'H. Mamat Sudrajat',
          nomorKontak: '6281312345678',
          lokasi: 'Jl. Raya Garut - Bayongbong KM 7, Kp. Pasir Kunci, Kec. Bayongbong',
          kecamatan: 'Bayongbong',
          judul: 'Jalan Ambles dan Lubang Sedalam 30cm Rawan Kecelakaan',
          deskripsi: 'Jalan raya ambles karena terkikis air hujan di dekat jembatan kecil, pengendara motor sering jatuh.',
          bidang: 'BINA_MARGA',
          bidangLabel: 'Bina Marga (Jalan & Jembatan)',
          kategori: 'Kerusakan Jalan',
          prioritas: 'KRITIS',
          status: 'DIPROSES',
          langkahPenanganan: 'Tim Reaksi Cepat (TRC) Bina Marga telah meluncur ke lokasi untuk pemasangan rambu darurat dan pengurukan aspal dingin.',
          ringkasanBot: '🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\nBerdasarkan informasi lengkap yang Bapak sampaikan, berikut adalah *Ringkasan Laporan Pengaduan Resmi* yang telah kami catat dalam sistem:\n\n- *Pelapor:* H. Mamat Sudrajat\n- *Lokasi Detail:* Jl. Raya Garut - Bayongbong KM 7, Kp. Pasir Kunci, Kec. Bayongbong\n- *Jenis Permasalahan:* Jalan Ambles dan Lubang Sedalam 30cm Rawan Kecelakaan\n- *Kategori Bidang:* Bidang Bina Marga (Jalan & Jembatan) Dinas PUPR Kabupaten Garut\n- *Tingkat Prioritas:* *KRITIS / TINGGI*\n\n*Langkah Penanganan:*\nLaporan ini telah kami prioritaskan dan segera kami teruskan kepada Tim Reaksi Cepat (TRC) Bina Marga untuk penanganan perbaikan.',
          assignedOperator: 'TRC Bina Marga (Pak Dedi)',
          catatanPetugas: 'Pemasangan rambu barikade selesai pukul 11:30. Bahan aspal siap gelar sore hari.',
          createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
          source: 'WHATSAPP_BOT'
        },
        {
          id: 'tkt-seed-003',
          nomorTiket: 'TKT-20260923-003',
          conversationId: 'conv-6285223344556@s.whatsapp.net',
          pelapor: 'Ibu Nenden Kurniasih',
          nomorKontak: '6285223344556',
          lokasi: 'Perumahan Puri Cempaka Blok C4, Desa Cempaka, Kec. Samarang',
          kecamatan: 'Samarang',
          judul: 'Drainase Lingkungan Tersumbat dan Meluap Saat Hujan',
          deskripsi: 'Gorong-gorong saluran drainase di depan perumahan tertutup endapan lumpur pekat dan sampah warga.',
          bidang: 'AMPL',
          bidangLabel: 'Air Minum & Penyehatan Lingkungan (AMPL)',
          kategori: 'Drainase Tersumbat',
          prioritas: 'TINGGI',
          status: 'PENDING',
          langkahPenanganan: 'Laporan dijadwalkan untuk peninjauan pembersihan endapan bersama UPT AMPL Wilayah Samarang.',
          ringkasanBot: '🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\nBerdasarkan informasi yang Ibu sampaikan, berikut adalah *Ringkasan Laporan Pengaduan Resmi* yang telah kami catat dalam sistem:\n\n- *Pelapor:* Ibu Nenden Kurniasih\n- *Lokasi Detail:* Perumahan Puri Cempaka Blok C4, Desa Cempaka, Kec. Samarang\n- *Jenis Permasalahan:* Drainase Lingkungan Tersumbat dan Meluap Saat Hujan\n- *Kategori Bidang:* Bidang AMPL / Sanitasi Dinas PUPR Kabupaten Garut\n- *Tingkat Prioritas:* *TINGGI*',
          assignedOperator: 'UPT AMPL Samarang',
          catatanPetugas: 'Menunggu konfirmasi jadwal alat pembersih saluran.',
          createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
          source: 'WHATSAPP_BOT'
        },
        {
          id: 'tkt-seed-004',
          nomorTiket: 'TKT-20260922-004',
          conversationId: 'conv-6287890123456@s.whatsapp.net',
          pelapor: 'Kang Asep Kusnadi',
          nomorKontak: '6287890123456',
          lokasi: 'Saluran Irigasi Blok Cikancana, Desa Sukamukti, Kec. Banyuresmi',
          kecamatan: 'Banyuresmi',
          judul: 'Tanggul Saluran Irigasi Jebol Sepanjang 5 Meter Menggenangi Sawah',
          deskripsi: 'Dinding tanggul saluran irigasi sekunder runtuh, debit air meluap dan merendam sawah siap panen.',
          bidang: 'SDA',
          bidangLabel: 'Sumber Daya Air (SDA)',
          kategori: 'Saluran Irigasi',
          prioritas: 'KRITIS',
          status: 'SELESAI',
          langkahPenanganan: 'Pemasangan bronjong kawat dan karung pasir darurat telah selesai dikerjakan bersama warga dan kelompok P3A.',
          ringkasanBot: '🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\nBerdasarkan informasi lengkap yang disampaikan, berikut adalah *Ringkasan Laporan Pengaduan Resmi* yang telah kami catat dalam sistem:\n\n- *Pelapor:* Kang Asep Kusnadi\n- *Lokasi Detail:* Saluran Irigasi Blok Cikancana, Desa Sukamukti, Kec. Banyuresmi\n- *Jenis Permasalahan:* Tanggul Saluran Irigasi Jebol Sepanjang 5 Meter Menggenangi Sawah\n- *Kategori Bidang:* Bidang Sumber Daya Air (SDA) Dinas PUPR Kabupaten Garut\n- *Tingkat Prioritas:* *KRITIS*',
          assignedOperator: 'Tim OP Irigasi SDA (Pak Yudi)',
          catatanPetugas: 'Penanganan tanggul darurat dengan 150 karung pasir dan bronjong tuntas. Aliran air kembali normal.',
          createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
          source: 'WHATSAPP_BOT'
        }
      ];

      for (const item of sampleSeed) {
        currentComplaints.push(item);
      }
      this.writeComplaints(currentComplaints);
      console.log(`[ComplaintService] Berhasil menyemai data awal (${currentComplaints.length} tiket).`);
    }
  }
}

module.exports = new ComplaintService();
