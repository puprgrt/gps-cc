/**
 * SIPEKA SKM (SURVEI KEPUASAN MASYARAKAT) SERVICE
 * Standard: PermenPAN-RB Nomor 14 Tahun 2017 tentang Pedoman Penyusunan SKM
 * 9 Indikator Pelayanan Publik & Formula IKM Konversi (25.00 - 100.00)
 */

export interface SkmInput {
  permohonanId: string;
  pengelolaId: string;
  u1_persyaratan: number;
  u2_prosedur: number;
  u3_waktu_pelayanan: number;
  u4_biaya_tarif: number;
  u5_produk_spesifikasi: number;
  u6_kompetensi_pelaksana: number;
  u7_perilaku_pelaksana: number;
  u8_maklumat_pelayanan: number;
  u9_penanganan_pengaduan: number;
  saran_masukan?: string;
}

export interface SkmCalculationResult {
  rerataSkor: number;
  ikmKonversi: number;
  mutuPelayanan: 'A' | 'B' | 'C' | 'D';
  kategoriLabel: string;
}

export const SKM_INDIKATOR_QUESTIONS = [
  {
    code: 'U1',
    name: 'Persyaratan Layanan',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai kejelasan dan kemudahan persyaratan pengisian daftar simak kerusakan bangunan gedung secara mandiri pada aplikasi SIPEKA?',
    options: [
      { score: 1, label: 'Sangat Tidak Jelas / Sangat Sulit' },
      { score: 2, label: 'Kurang Jelas / Sulit' },
      { score: 3, label: 'Jelas / Mudah' },
      { score: 4, label: 'Sangat Jelas / Sangat Mudah' },
    ],
  },
  {
    code: 'U2',
    name: 'Sistem & Prosedur',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu tentang kemudahan alur tahapan permohonan layanan penilaian kerusakan dari awal hingga penerbitan hasil analisis pada aplikasi SIPEKA?',
    options: [
      { score: 1, label: 'Sangat Berbelit-belit' },
      { score: 2, label: 'Kurang Mudah / Cukup Berbelit' },
      { score: 3, label: 'Mudah dan Terstruktur' },
      { score: 4, label: 'Sangat Mudah dan Transparan' },
    ],
  },
  {
    code: 'U3',
    name: 'Waktu Penyelesaian',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai ketepatan waktu proses verifikasi permohonan, survey lapangan, hingga penandatanganan elektronik dokumen hasil sesuai SLA?',
    options: [
      { score: 1, label: 'Sangat Lambat (Melebihi SLA)' },
      { score: 2, label: 'Kurang Cepat' },
      { score: 3, label: 'Cepat (Sesuai SLA)' },
      { score: 4, label: 'Sangat Cepat (Lebih Cepat dari SLA)' },
    ],
  },
  {
    code: 'U4',
    name: 'Biaya / Tarif',
    pertanyaan: 'Bagaimana kepastian biaya pelayanan penilaian kerusakan bangunan gedung oleh Dinas PUPR Garut (Rp 0 / Bebas Biaya)?',
    options: [
      { score: 1, label: 'Terdapat Biaya Tidak Resmi' },
      { score: 2, label: 'Kurang Transparan' },
      { score: 3, label: 'Gratis Sesuai Ketentuan' },
      { score: 4, label: 'Sangat Transparan & Bebas Biaya 100%' },
    ],
  },
  {
    code: 'U5',
    name: 'Produk Layanan',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai kesesuaian dan kelengkapan dokumen Surat Hasil Analisis Kerusakan beserta Lampiran Perhitungan Komponen PUPR?',
    options: [
      { score: 1, label: 'Sangat Tidak Sesuai / Tidak Lengkap' },
      { score: 2, label: 'Kurang Sesuai' },
      { score: 3, label: 'Sesuai dan Lengkap' },
      { score: 4, label: 'Sangat Sesuai, Detail, dan Legitimatif' },
    ],
  },
  {
    code: 'U6',
    name: 'Kompetensi Pelaksana',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu tentang keahlian, kejelasan, dan ketelitian Tim Teknis Dinas PUPR dalam verifikasi berkas maupun survey lapangan?',
    options: [
      { score: 1, label: 'Sangat Tidak Kompeten' },
      { score: 2, label: 'Kurang Kompeten' },
      { score: 3, label: 'Kompeten dan Profesional' },
      { score: 4, label: 'Sangat Kompeten & Menguasai BG' },
    ],
  },
  {
    code: 'U7',
    name: 'Perilaku Pelaksana',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai kesopanan, keramahan, dan sikap responsif petugas Dinas PUPR?',
    options: [
      { score: 1, label: 'Sangat Tidak Ramah / Tidak Sopan' },
      { score: 2, label: 'Kurang Ramah' },
      { score: 3, label: 'Ramah dan Sopan' },
      { score: 4, label: 'Sangat Ramah, Sopan, dan Responsif' },
    ],
  },
  {
    code: 'U8',
    name: 'Maklumat Pelayanan',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai komitmen Dinas PUPR dalam memberikan pelayanan sesuai dengan standar maklumat yang dipublikasikan?',
    options: [
      { score: 1, label: 'Sangat Buruk / Tidak Dipatuhi' },
      { score: 2, label: 'Kurang Terlaksana' },
      { score: 3, label: 'Dipatuhi dengan Baik' },
      { score: 4, label: 'Sangat Konsisten & Prima' },
    ],
  },
  {
    code: 'U9',
    name: 'Penanganan Pengaduan & Sarana',
    pertanyaan: 'Bagaimana pendapat Bapak/Ibu mengenai kemudahan penggunaan antarmuka web SIPEKA dan kecepatan penanganan kendala sistem?',
    options: [
      { score: 1, label: 'Sangat Buruk / Sulit Digunakan' },
      { score: 2, label: 'Kurang Responsif' },
      { score: 3, label: 'Baik, Stabil, dan User-Friendly' },
      { score: 4, label: 'Sangat Baik, Cepat, dan Modern' },
    ],
  },
];

export class SkmService {
  /**
   * Menghitung nilai IKM berdasarkan 9 Indikator PermenPAN-RB No. 14/2017
   */
  public static calculateIKM(input: SkmInput): SkmCalculationResult {
    // Validasi input skala 1-4
    const scores = [
      input.u1_persyaratan,
      input.u2_prosedur,
      input.u3_waktu_pelayanan,
      input.u4_biaya_tarif,
      input.u5_produk_spesifikasi,
      input.u6_kompetensi_pelaksana,
      input.u7_perilaku_pelaksana,
      input.u8_maklumat_pelayanan,
      input.u9_penanganan_pengaduan,
    ];

    for (const score of scores) {
      if (typeof score !== 'number' || score < 1 || score > 4) {
        throw new Error('Setiap indikator SKM wajib diisi dengan skala 1 sampai 4.');
      }
    }

    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const rerataSkor = Number((sum / 9).toFixed(2));

    // Rumus PermenPAN-RB: Rerata Nilai Unsur * 25
    const ikmKonversi = Number((rerataSkor * 25).toFixed(2));

    let mutuPelayanan: 'A' | 'B' | 'C' | 'D' = 'B';
    let kategoriLabel = 'Baik';

    if (ikmKonversi >= 88.31) {
      mutuPelayanan = 'A';
      kategoriLabel = 'Sangat Baik (Pelayanan Prima)';
    } else if (ikmKonversi >= 76.61) {
      mutuPelayanan = 'B';
      kategoriLabel = 'Baik';
    } else if (ikmKonversi >= 65.0) {
      mutuPelayanan = 'C';
      kategoriLabel = 'Kurang Baik';
    } else {
      mutuPelayanan = 'D';
      kategoriLabel = 'Sangat Kurang Baik';
    }

    return {
      rerataSkor,
      ikmKonversi,
      mutuPelayanan,
      kategoriLabel,
    };
  }
}

