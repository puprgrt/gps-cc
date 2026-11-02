/**
 * SIPEKA ENGINE - MATRIKS PEMBOBOTAN KOMPONEN STANDAR PUPR
 * Berdasarkan Pedoman Pemeliharaan BG Permen PUPR 24/2008 & Panduan Sekolah PUPR 2020
 */

import { KategoriElemen, TipeFormAlt, TingkatKerusakanKomponen } from '../types';

export interface KomponenTemplate {
  kode: string;
  nama: string;
  kategori: KategoriElemen;
  bobotPersen: number;
  isStrukturalKritis: boolean;
  deskripsiStandar: string;
}

export const TINGKAT_KERUSAKAN_MAP: Record<TingkatKerusakanKomponen, number> = {
  TIDAK_RUSAK: 0.00,
  RUSAK_SANGAT_RINGAN: 0.20,
  RUSAK_RINGAN: 0.35,
  RUSAK_SEDANG: 0.50,
  RUSAK_BERAT: 0.70,
  RUSAK_SANGAT_BERAT: 0.85,
  TIDAK_SESUAI_PERSYARATAN: 1.00,
};

// Form Alt.A: Bangunan 1 Lantai (Total = 100%)
// Struktur: 37%, Arsitektur: 58%, Utilitas: 3.5%
export const WEIGHT_MATRIX_ALT_A: KomponenTemplate[] = [
  // STRUKTUR (37.0%)
  {
    kode: 'STR_01',
    nama: 'Pondasi & Sloof',
    kategori: 'STRUKTUR',
    bobotPersen: 12.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Penurunan pondasi, patah sloof beton, atau amblas lokal',
  },
  {
    kode: 'STR_02',
    nama: 'Kolom Praktis & Utama',
    kategori: 'STRUKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak struktural geser/lentur, selimut beton terkelupas, tulangan terbuka/bengkok',
  },
  {
    kode: 'STR_03',
    nama: 'Balok Ringbalk / Latei',
    kategori: 'STRUKTUR',
    bobotPersen: 8.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Lendutan balok melebihi batas, retak lentur di tengah bentang',
  },
  {
    kode: 'STR_04',
    nama: 'Kuda-kuda & Rangka Atap',
    kategori: 'STRUKTUR',
    bobotPersen: 7.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Rangka atap melendut, patah batang tekan/tarik, korosi berat pada baja ringan/kayu lapuk',
  },

  // ARSITEKTUR (58.0%)
  {
    kode: 'ARS_01',
    nama: 'Dinding & Partisi',
    kategori: 'ARSITEKTUR',
    bobotPersen: 21.5,
    isStrukturalKritis: true, // Dinding bisa miring/runtuh
    deskripsiStandar: 'Retak tembus bata, dinding miring atau terlepas dari kolom pengikat',
  },
  {
    kode: 'ARS_02',
    nama: 'Rangka & Penutup Plafond',
    kategori: 'ARSITEKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Plafond jebol, bergelombang, atau rangka gantung terlepas',
  },
  {
    kode: 'ARS_03',
    nama: 'Lantai & Rabat',
    kategori: 'ARSITEKTUR',
    bobotPersen: 14.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Ubin pecah, keramik terangkat (popping), amblas lantai ruangan',
  },
  {
    kode: 'ARS_04',
    nama: 'Kusen Pintu & Jendela',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kusen keropos akibat rayap/lapuk atau mulet deformasi',
  },
  {
    kode: 'ARS_05',
    nama: 'Daun Pintu',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Daun pintu rusak fisik, engsel macet/patah, lapuk',
  },
  {
    kode: 'ARS_06',
    nama: 'Daun Jendela & Kaca',
    kategori: 'ARSITEKTUR',
    bobotPersen: 2.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kaca pecah, slot kait rusak, engsel jendela lepas',
  },
  {
    kode: 'ARS_07',
    nama: 'Finishing Plafond (Cat/Lapisan)',
    kategori: 'ARSITEKTUR',
    bobotPersen: 3.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Cat mengelupas, flek air rembesan bocor, kusam',
  },
  {
    kode: 'ARS_08',
    nama: 'Finishing Dinding (Cat/Plesteran)',
    kategori: 'ARSITEKTUR',
    bobotPersen: 4.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Plesteran terkelupas berongga, retak rambut, lumut basah',
  },
  {
    kode: 'ARS_09',
    nama: 'Finishing Kusen & Pintu (Cat/Vernis)',
    kategori: 'ARSITEKTUR',
    bobotPersen: 2.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Lapisan cat/vernis mengelupas atau pudar berat',
  },

  // UTILITAS (3.5%)
  {
    kode: 'UTL_01',
    nama: 'Instalasi Listrik & Titik Lampu',
    kategori: 'UTILITAS',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kabel terkelupas, saklar/stop kontak terbakar atau tidak berfungsi',
  },
  {
    kode: 'UTL_02',
    nama: 'Instalasi Air Bersih & Sanitasi',
    kategori: 'UTILITAS',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pipa bocor, kran air patah, suplai air terputus',
  },
  {
    kode: 'UTL_03',
    nama: 'Drainase Limbah & Saluran Air Hujan',
    kategori: 'UTILITAS',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Saluran tersumbat sedimen, talang patah/bocor, genangan air kotor',
  },
];

// Form Alt.B: Bangunan 2 Lantai / Panggung (Total = 100%)
// Struktur: 55%, Arsitektur: 40.75%, Utilitas: 4.25%
export const WEIGHT_MATRIX_ALT_B: KomponenTemplate[] = [
  // STRUKTUR (55.0%)
  {
    kode: 'STR_01',
    nama: 'Pondasi & Sloof',
    kategori: 'STRUKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Penurunan pondasi dangkal/footplate, keretakan sloof pengikat',
  },
  {
    kode: 'STR_02',
    nama: 'Kolom Struktur (Lt 1 & 2)',
    kategori: 'STRUKTUR',
    bobotPersen: 13.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Spalling beton, retak geser diagonal, tekuk pada kolom',
  },
  {
    kode: 'STR_03',
    nama: 'Balok Induk & Anak',
    kategori: 'STRUKTUR',
    bobotPersen: 12.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Lendutan balok lantai 2, retak pada daerah tumpuan dan lapangan',
  },
  {
    kode: 'STR_04',
    nama: 'Plat Lantai Tingkat',
    kategori: 'STRUKTUR',
    bobotPersen: 7.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak lentur tembus plat beton, lendutan berlebihan plat lantai',
  },
  {
    kode: 'STR_05',
    nama: 'Tangga Struktur & Bordes',
    kategori: 'STRUKTUR',
    bobotPersen: 3.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Patah anak tangga, retak tumpuan bordes, railing terlepas membahayakan',
  },
  {
    kode: 'STR_06',
    nama: 'Kuda-kuda & Rangka Atap',
    kategori: 'STRUKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Deformasi lateral kuda-kuda atap, sambungan baut/las terlepas',
  },

  // ARSITEKTUR (40.75%)
  {
    kode: 'ARS_01',
    nama: 'Dinding & Partisi',
    kategori: 'ARSITEKTUR',
    bobotPersen: 15.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak diagonal tembus, dinding goncang',
  },
  {
    kode: 'ARS_02',
    nama: 'Rangka & Penutup Plafond',
    kategori: 'ARSITEKTUR',
    bobotPersen: 6.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Plafond ambruk sebagian, gantung plafond kendur',
  },
  {
    kode: 'ARS_03',
    nama: 'Lantai Keramik/Granit',
    kategori: 'ARSITEKTUR',
    bobotPersen: 9.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Lantai pecah, bergelombang atau kopong',
  },
  {
    kode: 'ARS_04',
    nama: 'Kusen Pintu & Jendela',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kusen rusak lapuk atau patah',
  },
  {
    kode: 'ARS_05',
    nama: 'Daun Pintu',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Daun pintu rusak fisik atau copot',
  },
  {
    kode: 'ARS_06',
    nama: 'Daun Jendela & Kaca',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.25,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kaca pecah, engsel rusak',
  },
  {
    kode: 'ARS_07',
    nama: 'Finishing Plafond',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Cat kusam mengelupas',
  },
  {
    kode: 'ARS_08',
    nama: 'Finishing Dinding',
    kategori: 'ARSITEKTUR',
    bobotPersen: 5.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Cat pudar, berjamur basah, plester terlepas',
  },
  {
    kode: 'ARS_09',
    nama: 'Finishing Kusen & Pintu',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Lapisan pelindung kayu/aluminium mengelupas',
  },

  // UTILITAS (4.25%)
  {
    kode: 'UTL_01',
    nama: 'Instalasi Listrik & Panel Distribusi',
    kategori: 'UTILITAS',
    bobotPersen: 2.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Panel MCB trip berulang, bahaya korsleting',
  },
  {
    kode: 'UTL_02',
    nama: 'Instalasi Air Bersih & Pompa',
    kategori: 'UTILITAS',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Tekanan air drop, kebocoran pipa riser ke lantai 2',
  },
  {
    kode: 'UTL_03',
    nama: 'Drainase Limbah & Talang Vertikal',
    kategori: 'UTILITAS',
    bobotPersen: 1.25,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pipa buangan air hujan bocor meluber ke dinding',
  },
];

// Form Alt.C: Bangunan 3 Lantai atau Lebih (Total = 100%)
// Struktur: 55%, Arsitektur: 39%, Utilitas: 6%
export const WEIGHT_MATRIX_ALT_C: KomponenTemplate[] = [
  // STRUKTUR (55.0%)
  {
    kode: 'STR_01',
    nama: 'Pondasi Dalam / Tiang Pancang / Bored Pile',
    kategori: 'STRUKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Penurunan diferensial pile cap, retak pedestal',
  },
  {
    kode: 'STR_02',
    nama: 'Kolom Utama Multi-Lantai',
    kategori: 'STRUKTUR',
    bobotPersen: 13.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak geser diagonal, beton hancur (crushing), tekuk tulangan',
  },
  {
    kode: 'STR_03',
    nama: 'Balok Portal Struktur',
    kategori: 'STRUKTUR',
    bobotPersen: 12.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak geser balok tumpuan, lendutan plat dan balok',
  },
  {
    kode: 'STR_04',
    nama: 'Plat Lantai Beton Bertulang',
    kategori: 'STRUKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Lendutan plat lantai, getaran berlebih, retak tembus',
  },
  {
    kode: 'STR_05',
    nama: 'Tangga Darurat & Struktur Tangga',
    kategori: 'STRUKTUR',
    bobotPersen: 3.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Patah anak tangga, tangga goyang, retak sambungan balok tangga',
  },
  {
    kode: 'STR_06',
    nama: 'Rangka Atap & Dak Beton Atas',
    kategori: 'STRUKTUR',
    bobotPersen: 7.0,
    isStrukturalKritis: true,
    deskripsiStandar: 'Rangka atap deformasi atau dak atap bocor retak struktural',
  },

  // ARSITEKTUR (39.0%)
  {
    kode: 'ARS_01',
    nama: 'Dinding & Curtain Wall / Fasad',
    kategori: 'ARSITEKTUR',
    bobotPersen: 6.25,
    isStrukturalKritis: true,
    deskripsiStandar: 'Retak dinding luar, fasad terlepas membahayakan orang di bawah',
  },
  {
    kode: 'ARS_02',
    nama: 'Rangka & Penutup Plafond',
    kategori: 'ARSITEKTUR',
    bobotPersen: 8.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Plafond jebol atau lepas sambungan akustik',
  },
  {
    kode: 'ARS_03',
    nama: 'Lantai Ruangan & Koridor',
    kategori: 'ARSITEKTUR',
    bobotPersen: 10.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Keramik pecah berantakan atau lepas plint',
  },
  {
    kode: 'ARS_04',
    nama: 'Kusen Pintu & Jendela',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kusen aluminium/kayu cacat fisik',
  },
  {
    kode: 'ARS_05',
    nama: 'Daun Pintu',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pintu rusak atau door closer macet',
  },
  {
    kode: 'ARS_06',
    nama: 'Daun Jendela & Kaca Fasad',
    kategori: 'ARSITEKTUR',
    bobotPersen: 1.25,
    isStrukturalKritis: false,
    deskripsiStandar: 'Kaca pecah, seal kaca bocor air hujan',
  },
  {
    kode: 'ARS_07',
    nama: 'Finishing Plafond',
    kategori: 'ARSITEKTUR',
    bobotPersen: 3.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pengecatan kusam, noda air kotor',
  },
  {
    kode: 'ARS_08',
    nama: 'Finishing Dinding Interior & Eksterior',
    kategori: 'ARSITEKTUR',
    bobotPersen: 5.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Plester retak rambut, cat mengelupas luas',
  },
  {
    kode: 'ARS_09',
    nama: 'Finishing Kusen & Pintu',
    kategori: 'ARSITEKTUR',
    bobotPersen: 3.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Powder coating tergores atau cat kayu rusak',
  },

  // UTILITAS (6.0%)
  {
    kode: 'UTL_01',
    nama: 'Instalasi Listrik, Penerangan & Genset',
    kategori: 'UTILITAS',
    bobotPersen: 3.0,
    isStrukturalKritis: false,
    deskripsiStandar: 'Panel utama bermasalah, kabel riser panas berlebih',
  },
  {
    kode: 'UTL_02',
    nama: 'Instalasi Air Bersih & Booster Pump',
    kategori: 'UTILITAS',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pompa booster macet, kebocoran pipa riser',
  },
  {
    kode: 'UTL_03',
    nama: 'Drainase, Sewarage & Hydrant/Pemadam',
    kategori: 'UTILITAS',
    bobotPersen: 1.5,
    isStrukturalKritis: false,
    deskripsiStandar: 'Pipa limbah bocor atau instalasi pipa air hujan tersumbat',
  },
];

export function getWeightMatrixByForm(altForm: TipeFormAlt): KomponenTemplate[] {
  switch (altForm) {
    case 'ALT_A':
      return WEIGHT_MATRIX_ALT_A;
    case 'ALT_B':
      return WEIGHT_MATRIX_ALT_B;
    case 'ALT_C':
      return WEIGHT_MATRIX_ALT_C;
    default:
      return WEIGHT_MATRIX_ALT_A;
  }
}

