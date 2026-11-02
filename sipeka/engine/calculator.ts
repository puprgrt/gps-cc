/**
 * SIPEKA DAMAGE CALCULATION ENGINE (STANDAR KEMENPUPR)
 * 2-Stage Calculation Engine:
 * - Tahap 1: Visual Safety Gate (Struktur Kritis & Bahaya Keselamatan)
 * - Tahap 2: Kuantitatif Volume & Bobot (Matriks Alt A, B, C)
 */

import {
  HasilKalkulasiKerusakan,
  KomponenPenilaianInput,
  TipeFormAlt,
  DetailPenilaianKomponen,
  KlasifikasiKerusakan,
} from '../types';
import {
  getWeightMatrixByForm,
  TINGKAT_KERUSAKAN_MAP,
} from './weightMatrices';

// Standar Harga Satuan Bangunan Gedung Negara (HSBGN) Kabupaten Garut (Rp / m2)
export const HSBGN_GARUT_PER_M2 = 3850000;

export interface HitungKerusakanOptions {
  altForm: TipeFormAlt;
  luasBangunanM2?: number;
  inputKomponen: KomponenPenilaianInput[];
}

export function hitungKerusakanBG(options: HitungKerusakanOptions): HasilKalkulasiKerusakan {
  const { altForm, luasBangunanM2 = 100, inputKomponen } = options;
  const templateMatrix = getWeightMatrixByForm(altForm);

  // ---------------------------------------------------------------------------
  // TAHAP 1: VISUAL SAFETY GATE (PENGAMATAN VISUAL & KESELAMATAN STRUKTUR)
  // Komponen Kritis: Pondasi, Kolom, Balok, Pelat, Tangga, Atap, Dinding
  // ---------------------------------------------------------------------------
  const hazardList: string[] = [];
  const hazardNotes: string[] = [];

  for (const item of inputKomponen) {
    if (item.isHazard) {
      hazardList.push(item.nama);
      if (item.catatanHazard) {
        hazardNotes.push(`${item.nama}: ${item.catatanHazard}`);
      }
    }
  }

  const isKeselamatanTerancam = hazardList.length > 0;

  // ---------------------------------------------------------------------------
  // TAHAP 2: KALKULASI KUANTITATIF (VOLUME KERUSAKAN & BOBOT)
  // ---------------------------------------------------------------------------
  let totalStruktur = 0;
  let totalArsitektur = 0;
  let totalUtilitas = 0;

  const detailKomponen: DetailPenilaianKomponen[] = [];

  for (const tpl of templateMatrix) {
    // Cari data input dari user atau gunakan nilai default 0 (tidak rusak)
    const matchedInput = inputKomponen.find(
      (inp) => inp.kode === tpl.kode || inp.nama.toLowerCase() === tpl.nama.toLowerCase()
    );

    const volumeRusakPersen = Math.min(
      Math.max(matchedInput ? matchedInput.volumeRusakPersen : 0, 0),
      100
    );

    const tingkatKerusakanKey = matchedInput ? matchedInput.tingkatKerusakan : 'TIDAK_RUSAK';
    const tingkatKerusakanVal = TINGKAT_KERUSAKAN_MAP[tingkatKerusakanKey] ?? 0;

    // Rumus: (Volume Rusak / 100) * Nilai Klasifikasi * Bobot Komponen (%)
    const hasilKerusakan = Number(
      ((volumeRusakPersen / 100) * tingkatKerusakanVal * tpl.bobotPersen).toFixed(4)
    );

    if (tpl.kategori === 'STRUKTUR') {
      totalStruktur += hasilKerusakan;
    } else if (tpl.kategori === 'ARSITEKTUR') {
      totalArsitektur += hasilKerusakan;
    } else if (tpl.kategori === 'UTILITAS') {
      totalUtilitas += hasilKerusakan;
    }

    detailKomponen.push({
      id: `det-${tpl.kode.toLowerCase()}`,
      history_penilaian_id: '',
      nama_komponen: tpl.nama,
      kategori_elemen: tpl.kategori,
      bobot_komponen_persen: tpl.bobotPersen,
      tingkat_kerusakan_val: tingkatKerusakanVal,
      volume_rusak_persen: volumeRusakPersen,
      hasil_kerusakan_komponen: Number(hasilKerusakan.toFixed(2)),
      foto_bukti_gdrive_id: matchedInput?.fotoBuktiId,
      foto_view_link: matchedInput?.fotoViewLink,
      catatan: matchedInput?.catatanHazard,
      created_at: new Date().toISOString(),
    });
  }

  const persentaseTotalAritmatika = Number(
    (totalStruktur + totalArsitektur + totalUtilitas).toFixed(2)
  );
  const persentaseStrukturFixed = Number(totalStruktur.toFixed(2));
  const persentaseArsitekturFixed = Number(totalArsitektur.toFixed(2));
  const persentaseUtilitasFixed = Number(totalUtilitas.toFixed(2));

  // ---------------------------------------------------------------------------
  // PENETAPAN KESIMPULAN KLASIFIKASI KERUSAKAN
  // Ambang batas Permen PUPR:
  // <= 30% : RUSAK RINGAN
  // > 30% - 45% : RUSAK SEDANG
  // > 45% atau Visual Safety Gate Terpicu : RUSAK BERAT
  // ---------------------------------------------------------------------------
  let klasifikasi: KlasifikasiKerusakan = 'TIDAK_RUSAK';

  if (isKeselamatanTerancam) {
    // Sesuai aturan keselamatan Tahap 1: Langsung RUSAK BERAT
    klasifikasi = 'RUSAK_BERAT';
  } else if (persentaseTotalAritmatika === 0) {
    klasifikasi = 'TIDAK_RUSAK';
  } else if (persentaseTotalAritmatika <= 30.0) {
    klasifikasi = 'RUSAK_RINGAN';
  } else if (persentaseTotalAritmatika <= 45.0) {
    klasifikasi = 'RUSAK_SEDANG';
  } else {
    klasifikasi = 'RUSAK_BERAT';
  }

  // ---------------------------------------------------------------------------
  // REKOMENDASI TEKNIS BERDASARKAN HASIL EVALUASI
  // ---------------------------------------------------------------------------
  let rekomendasiTeknis = '';

  if (isKeselamatanTerancam) {
    rekomendasiTeknis =
      `PERINGATAN KESELAMATAN (SAFETY HAZARD): Ditemukan indikasi kerusakan struktural kritis yang mengancam keselamatan pada komponen: ${hazardList.join(', ')}. ` +
      `Sesuai Pedoman Teknis KemenPUPR, bangunan ditetapkan dalam kategori RUSAK BERAT. Direkomendasikan pengosongan segera ruangan/area terdampak, pemasangan perancah/shoring penyangga sementara, dan dilakukan rehabilitasi struktur/rekonstruksi menyeluruh sebelum dipergunakan kembali.`;
  } else if (klasifikasi === 'RUSAK_RINGAN') {
    rekomendasiTeknis =
      `Tingkat kerusakan bangunan sebesar ${persentaseTotalAritmatika}%, tergolong RUSAK RINGAN. Direkomendasikan tindakan pemeliharaan dan perawatan berkala pada elemen arsitektur/finishing tanpa memerlukan intervensi struktur utama. Bangunan laik fungsi dan aman digunakan untuk operasional harian.`;
  } else if (klasifikasi === 'RUSAK_SEDANG') {
    rekomendasiTeknis =
      `Tingkat kerusakan bangunan sebesar ${persentaseTotalAritmatika}%, tergolong RUSAK SEDANG. Direkomendasikan pekerjaan rehabilitasi/perbaikan pada komponen dinding, plafond, dan sanitasi. Penggunaan ruangan perlu diatur secara berhati-hati selama proses perbaikan berjalan.`;
  } else if (klasifikasi === 'RUSAK_BERAT') {
    rekomendasiTeknis =
      `Tingkat kerusakan kumulatif sebesar ${persentaseTotalAritmatika}%, tergolong RUSAK BERAT (> 45%). Direkomendasikan renovasi berat atau perkuatan struktur komprehensif (retrofitting) dan pengusulan alokasi anggaran rehabilitasi sarana dan prasarana melalui DAK / APBD Kabupaten Garut.`;
  } else {
    rekomendasiTeknis =
      `Bangunan dalam kondisi prima tanpa kerusakan berarti. Lakukan pemeliharaan rutin sesuai SOP pemeliharaan gedung dinas.`;
  }

  // Estimasi Biaya Perbaikan (Estimasi Awal PUPR)
  // Biaya = Luas (m2) * HSBGN Garut * (Persentase Kerusakan / 100)
  const effectivePercentage = isKeselamatanTerancam
    ? Math.max(persentaseTotalAritmatika, 50.0) // Minimal 50% jika hazard keselamatan
    : persentaseTotalAritmatika;

  const estimasiBiayaPerbaikan = Math.round(
    luasBangunanM2 * HSBGN_GARUT_PER_M2 * (effectivePercentage / 100)
  );

  return {
    isKeselamatanTerancam,
    hazardKomponen: hazardList,
    hazardCatatan: hazardNotes.join('; '),
    persentaseTotal: persentaseTotalAritmatika,
    persentaseStruktur: persentaseStrukturFixed,
    persentaseArsitektur: persentaseArsitekturFixed,
    persentaseUtilitas: persentaseUtilitasFixed,
    klasifikasi,
    rekomendasiTeknis,
    estimasiBiayaPerbaikan,
    detailKomponen,
  };
}

