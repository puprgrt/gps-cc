/**
 * SIPEKA SERVICE & DATA REPOSITORY
 * Business logic layer & data management for SIPEKA
 * Integrates with PostgreSQL/Supabase and supports resilient offline in-memory fallback
 */

import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Bangunan,
  DisposisiLog,
  HasilKalkulasiKerusakan,
  HistoryPenilaian,
  Instansi,
  PermohonanPenilaian,
  SkmRespon,
  StatusPermohonan,
  TipeFormAlt,
  UserRoleSipeka,
  UserSipeka,
} from '../types';
import { hitungKerusakanBG, HitungKerusakanOptions } from '../engine/calculator';
import { SipekaWorkflowEngine } from '../workflow/stateMachine';
import { SkmInput, SkmService } from './skmService';

// Seed Initial Data Memory Store (Resilient Fallback)
const MEMORY_INSTANSI: Instansi[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    npsn_kategori: 'NPSN-20224001',
    nama_instansi: 'SD Negeri 1 Tarogong Kidul',
    alamat_lengkap: 'Jl. Suherman No. 12, Tarogong Kidul',
    kecamatan: 'Tarogong Kidul',
    gdrive_root_folder_id: 'gdrive_folder_sdn1_tk',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    npsn_kategori: 'NPSN-20224055',
    nama_instansi: 'SMP Negeri 2 Garut',
    alamat_lengkap: 'Jl. Ahmad Yani No. 45, Garut Kota',
    kecamatan: 'Garut Kota',
    gdrive_root_folder_id: 'gdrive_folder_smpn2_grt',
    created_at: new Date().toISOString(),
  },
];

const MEMORY_USERS: UserSipeka[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    username: 'pengelola_sdn1',
    email: 'pengelola.sdn1@garutkab.go.id',
    nama_lengkap: 'Budi Santoso, S.Pd',
    nip: '198503122010011002',
    role: 'PENGELOLA_BG',
    instansi_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    username: 'kabid_bg',
    email: 'kabid.bg@garutkab.go.id',
    nama_lengkap: 'Ir. H. Deden Ramdani, M.T.',
    nip: '197405101999031004',
    role: 'KABID_BG',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    username: 'subkoord_bg',
    email: 'subkoord.bg@garutkab.go.id',
    nama_lengkap: 'Agus Hendra, S.T., M.Si.',
    nip: '198108152006041008',
    role: 'SUBKOORDINATOR',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    username: 'tim_teknis1',
    email: 'teknis.bg@garutkab.go.id',
    nama_lengkap: 'Rian Fauzi, S.T.',
    nip: '199204222019031005',
    role: 'TIM_TEKNIS',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    username: 'kadis_pupr',
    email: 'kadis.pupr@garutkab.go.id',
    nama_lengkap: 'Drs. H. Agus Ismail, S.T., M.T.',
    nip: '196802111994021001',
    role: 'KADIS_PUPR',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const MEMORY_BANGUNAN: Bangunan[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    instansi_id: '11111111-1111-1111-1111-111111111111',
    nup_bmd: 'BMD-2022-0012',
    nama_bangunan: 'Gedung Ruang Kelas 1-3 SDN 1 Tarogong Kidul',
    jumlah_lantai: 1,
    luas_bangunan_m2: 240,
    tahun_dibangun: 2012,
    latitude: -7.2144,
    longitude: 107.8988,
    gdrive_folder_id: 'gdrive_b1_sdn1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    instansi_id: '22222222-2222-2222-2222-222222222222',
    nup_bmd: 'BMD-2018-0044',
    nama_bangunan: 'Gedung Laboratorium Komputer SMPN 2 Garut',
    jumlah_lantai: 2,
    luas_bangunan_m2: 360,
    tahun_dibangun: 2018,
    latitude: -7.2212,
    longitude: 107.9045,
    gdrive_folder_id: 'gdrive_b2_smpn2',
    created_at: new Date().toISOString(),
  },
];

const MEMORY_PERMOHONAN: PermohonanPenilaian[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    nomor_permohonan: 'SIPEKA/GRT/20261102/0001',
    pengelola_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    bangunan_id: 'b1111111-1111-1111-1111-111111111111',
    status: 'SUBMITTED',
    alt_form: 'ALT_A',
    butuh_survey: false,
    surat_permohonan_gdrive_id: 'gdrive_surat_permohonan_0001',
    surat_hasil_gdrive_id: undefined,
    tte_subkoord_status: false,
    tte_kabid_status: false,
    tte_kadis_status: false,
    created_at: new Date().toISOString(),
  },
];

const MEMORY_DISPOSISI: DisposisiLog[] = [];
const MEMORY_HISTORY: HistoryPenilaian[] = [];
const MEMORY_SKM: SkmRespon[] = [];

export class SipekaService {
  /**
   * Menghasilkan Nomor Registrasi Tiket Permohonan Resmi
   * Format: SIPEKA/GRT/YYYYMMDD/XXXX
   */
  public static generateNomorPermohonan(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `SIPEKA/GRT/${yyyy}${mm}${dd}/${randomHex}`;
  }

  /**
   * Menghasilkan Hash Tanda Tangan Elektronik (TTE BSrE Standard)
   */
  public static generateTTEHash(permohonanId: string, signerNip: string, role: string): string {
    const secret = process.env.BSRE_TTE_SECRET || 'BSRE_GARUT_PUPR_SIGN_KEY_2026';
    const payload = `${permohonanId}:${signerNip}:${role}:${new Date().toISOString()}:${secret}`;
    return `BSrE-${crypto.createHash('sha256').update(payload).digest('hex').toUpperCase()}`;
  }

  /**
   * Mengambil daftar permohonan penilaian
   */
  public static async getPermohonanList(): Promise<PermohonanPenilaian[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('permohonan_penilaian')
          .select(`
            *,
            bangunan:bangunan_id (*),
            pengelola:pengelola_id (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as PermohonanPenilaian[];
        }
      } catch (err) {
        console.warn('Menggunakan fallback data memory untuk permohonan:', err);
      }
    }

    // Fallback data memory
    return MEMORY_PERMOHONAN.map((p) => ({
      ...p,
      bangunan: MEMORY_BANGUNAN.find((b) => b.id === p.bangunan_id),
      pengelola: MEMORY_USERS.find((u) => u.id === p.pengelola_id),
      history: MEMORY_HISTORY.find((h) => h.permohonan_id === p.id),
      skm: MEMORY_SKM.find((s) => s.permohonan_id === p.id),
    }));
  }

  /**
   * Mengambil detail satu permohonan berdasarkan ID
   */
  public static async getPermohonanById(id: string): Promise<PermohonanPenilaian | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('permohonan_penilaian')
          .select(`
            *,
            bangunan:bangunan_id (*),
            pengelola:pengelola_id (*)
          `)
          .eq('id', id)
          .single();

        if (!error && data) {
          const item = data as PermohonanPenilaian;
          // Ambil history jika ada
          const { data: histData } = await supabase
            .from('history_penilaian')
            .select(`
              *,
              details:detail_penilaian_komponen (*)
            `)
            .eq('permohonan_id', id)
            .single();

          if (histData) {
            item.history = histData as HistoryPenilaian;
          }

          // Ambil SKM jika ada
          const { data: skmData } = await supabase
            .from('skm_respon')
            .select('*')
            .eq('permohonan_id', id)
            .single();

          if (skmData) {
            item.skm = skmData as SkmRespon;
          }

          return item;
        }
      } catch (err) {
        console.warn('Fallback memory untuk detail permohonan:', err);
      }
    }

    const p = MEMORY_PERMOHONAN.find((item) => item.id === id);
    if (!p) return null;

    return {
      ...p,
      bangunan: MEMORY_BANGUNAN.find((b) => b.id === p.bangunan_id),
      pengelola: MEMORY_USERS.find((u) => u.id === p.pengelola_id),
      history: MEMORY_HISTORY.find((h) => h.permohonan_id === p.id),
      skm: MEMORY_SKM.find((s) => s.permohonan_id === p.id),
    };
  }

  /**
   * Mengajukan Permohonan Penilaian Kerusakan Baru (Tahap 1)
   */
  public static async createPermohonan(payload: {
    pengelolaId: string;
    bangunanId: string;
    altForm: TipeFormAlt;
    suratPermohonanGdriveId?: string;
  }): Promise<PermohonanPenilaian> {
    const nomorTiket = this.generateNomorPermohonan();
    const newId = crypto.randomUUID();

    const record: PermohonanPenilaian = {
      id: newId,
      nomor_permohonan: nomorTiket,
      pengelola_id: payload.pengelolaId,
      bangunan_id: payload.bangunanId,
      status: 'SUBMITTED',
      alt_form: payload.altForm,
      butuh_survey: false,
      surat_permohonan_gdrive_id: payload.suratPermohonanGdriveId || `gdrive_file_${newId}`,
      tte_subkoord_status: false,
      tte_kabid_status: false,
      tte_kadis_status: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('permohonan_penilaian')
          .insert([record])
          .select()
          .single();

        if (!error && data) {
          return data as PermohonanPenilaian;
        }
      } catch (err) {
        console.warn('Gagal insert ke Supabase, simpan ke memory fallback:', err);
      }
    }

    MEMORY_PERMOHONAN.unshift(record);
    return record;
  }

  /**
   * Melakukan Disposisi Berjenjang (Tahap 2 & Tahap 3)
   */
  public static async disposisiPermohonan(params: {
    permohonanId: string;
    fromUserId: string;
    fromUserRole: UserRoleSipeka;
    toUserId: string;
    targetStatus: StatusPermohonan;
    catatan: string;
  }): Promise<{ success: boolean; log: DisposisiLog }> {
    const { permohonanId, fromUserId, fromUserRole, toUserId, targetStatus, catatan } = params;

    const permohonan = await this.getPermohonanById(permohonanId);
    if (!permohonan) {
      throw new Error(`Permohonan dengan ID [${permohonanId}] tidak ditemukan.`);
    }

    const check = SipekaWorkflowEngine.canTransition(permohonan.status, targetStatus, fromUserRole);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const logId = crypto.randomUUID();
    const log: DisposisiLog = {
      id: logId,
      permohonan_id: permohonanId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      catatan_disposisi: catatan,
      created_at: new Date().toISOString(),
    };

    // Update status permohonan
    permohonan.status = targetStatus;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('permohonan_penilaian')
          .update({ status: targetStatus })
          .eq('id', permohonanId);

        await supabase.from('disposisi_log').insert([log]);
      } catch (err) {
        console.warn('Gagal update disposisi ke DB:', err);
      }
    }

    const memIndex = MEMORY_PERMOHONAN.findIndex((p) => p.id === permohonanId);
    if (memIndex !== -1) {
      MEMORY_PERMOHONAN[memIndex].status = targetStatus;
    }
    MEMORY_DISPOSISI.unshift(log);

    return { success: true, log };
  }

  /**
   * Verifikasi Dokumen & Penentuan Survey Lapangan oleh Tim Teknis (Tahap 4)
   */
  public static async verifikasiBerkas(params: {
    permohonanId: string;
    timTeknisId: string;
    butuhSurvey: boolean;
    tanggalSurvey?: string;
  }): Promise<PermohonanPenilaian> {
    const { permohonanId, butuhSurvey, tanggalSurvey } = params;
    const permohonan = await this.getPermohonanById(permohonanId);
    if (!permohonan) throw new Error('Permohonan tidak ditemukan.');

    const targetStatus: StatusPermohonan = butuhSurvey ? 'MENUNGGU_SURVEY' : 'ANALISIS_TEKNIS';
    permohonan.status = targetStatus;
    permohonan.butuh_survey = butuhSurvey;
    permohonan.tanggal_survey_dijadwalkan = tanggalSurvey;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('permohonan_penilaian')
          .update({
            status: targetStatus,
            butuh_survey: butuhSurvey,
            tanggal_survey_dijadwalkan: tanggalSurvey,
          })
          .eq('id', permohonanId);
      } catch (err) {
        console.warn('Gagal update verifikasi ke DB:', err);
      }
    }

    const memIndex = MEMORY_PERMOHONAN.findIndex((p) => p.id === permohonanId);
    if (memIndex !== -1) {
      MEMORY_PERMOHONAN[memIndex].status = targetStatus;
      MEMORY_PERMOHONAN[memIndex].butuh_survey = butuhSurvey;
      MEMORY_PERMOHONAN[memIndex].tanggal_survey_dijadwalkan = tanggalSurvey;
    }

    return permohonan;
  }

  /**
   * Menjalankan Engine Kalkulasi 2-Tahap dan Menyimpan Hasil Penilaian (Tahap 5)
   */
  public static async executeKalkulasiKerusakan(
    permohonanId: string,
    timTeknisId: string,
    calcOptions: HitungKerusakanOptions
  ): Promise<HasilKalkulasiKerusakan> {
    const permohonan = await this.getPermohonanById(permohonanId);
    if (!permohonan) throw new Error('Permohonan tidak ditemukan.');

    const hasilKalkulasi = hitungKerusakanBG(calcOptions);

    const historyId = crypto.randomUUID();
    const historyRecord: HistoryPenilaian = {
      id: historyId,
      permohonan_id: permohonanId,
      bangunan_id: permohonan.bangunan_id,
      penilaian_ke: 1,
      tanggal_penilaian: new Date().toISOString().split('T')[0],
      is_keselamatan_terancam: hasilKalkulasi.isKeselamatanTerancam,
      hazard_komponen: hasilKalkulasi.hazardKomponen,
      hazard_catatan: hasilKalkulasi.hazardCatatan,
      persentase_total_kerusakan: hasilKalkulasi.persentaseTotal,
      persentase_struktur: hasilKalkulasi.persentaseStruktur,
      persentase_arsitektur: hasilKalkulasi.persentaseArsitektur,
      persentase_utilitas: hasilKalkulasi.persentaseUtilitas,
      kesimpulan_klasifikasi: hasilKalkulasi.klasifikasi,
      rekomendasi_teknis: hasilKalkulasi.rekomendasiTeknis,
      tim_teknis_id: timTeknisId,
      created_at: new Date().toISOString(),
      details: hasilKalkulasi.detailKomponen,
    };

    // Update status ke VALIDASI_SUBKOORD (Tahap 6)
    permohonan.status = 'VALIDASI_SUBKOORD';

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('permohonan_penilaian')
          .update({ status: 'VALIDASI_SUBKOORD' })
          .eq('id', permohonanId);

        await supabase.from('history_penilaian').upsert([historyRecord]);

        // Simpan detail komponen
        const detailsToInsert = hasilKalkulasi.detailKomponen.map((det) => ({
          ...det,
          history_penilaian_id: historyId,
        }));
        await supabase.from('detail_penilaian_komponen').insert(detailsToInsert);
      } catch (err) {
        console.warn('Gagal simpan history penilaian ke DB:', err);
      }
    }

    const memIndex = MEMORY_PERMOHONAN.findIndex((p) => p.id === permohonanId);
    if (memIndex !== -1) {
      MEMORY_PERMOHONAN[memIndex].status = 'VALIDASI_SUBKOORD';
    }

    const histIndex = MEMORY_HISTORY.findIndex((h) => h.permohonan_id === permohonanId);
    if (histIndex !== -1) {
      MEMORY_HISTORY[histIndex] = historyRecord;
    } else {
      MEMORY_HISTORY.unshift(historyRecord);
    }

    return hasilKalkulasi;
  }

  /**
   * Pembubuhan TTE Berjenjang (Tahap 6: Subkoord, Tahap 7: Kabid, Tahap 8: Kadis)
   */
  public static async executeTTE(params: {
    permohonanId: string;
    signerRole: 'SUBKOORDINATOR' | 'KABID_BG' | 'KADIS_PUPR';
    signerNip: string;
  }): Promise<{ status: StatusPermohonan; hashTTE: string }> {
    const { permohonanId, signerRole, signerNip } = params;
    const permohonan = await this.getPermohonanById(permohonanId);
    if (!permohonan) throw new Error('Permohonan tidak ditemukan.');

    const hashTTE = this.generateTTEHash(permohonanId, signerNip, signerRole);
    let nextStatus: StatusPermohonan = permohonan.status;

    if (signerRole === 'SUBKOORDINATOR') {
      nextStatus = 'APPROVAL_KABID';
      permohonan.tte_subkoord_status = true;
    } else if (signerRole === 'KABID_BG') {
      nextStatus = 'APPROVAL_KADIS';
      permohonan.tte_kabid_status = true;
    } else if (signerRole === 'KADIS_PUPR') {
      nextStatus = 'MENUNGGU_SKM'; // Kunci dokumen & tunggu pengisian SKM
      permohonan.tte_kadis_status = true;
      permohonan.surat_hasil_gdrive_id = `gdrive_hasil_tte_${permohonanId}`;
    }

    permohonan.status = nextStatus;

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, unknown> = { status: nextStatus };
        if (signerRole === 'SUBKOORDINATOR') updatePayload.tte_subkoord_status = true;
        if (signerRole === 'KABID_BG') updatePayload.tte_kabid_status = true;
        if (signerRole === 'KADIS_PUPR') {
          updatePayload.tte_kadis_status = true;
          updatePayload.surat_hasil_gdrive_id = permohonan.surat_hasil_gdrive_id;
        }

        await supabase.from('permohonan_penilaian').update(updatePayload).eq('id', permohonanId);

        // Update hash di history
        const hashField =
          signerRole === 'SUBKOORDINATOR'
            ? 'tte_subkoor_hash'
            : signerRole === 'KABID_BG'
            ? 'tte_kabid_hash'
            : 'tte_kadis_hash';

        await supabase
          .from('history_penilaian')
          .update({ [hashField]: hashTTE })
          .eq('permohonan_id', permohonanId);
      } catch (err) {
        console.warn('Gagal simpan TTE ke DB:', err);
      }
    }

    const memIndex = MEMORY_PERMOHONAN.findIndex((p) => p.id === permohonanId);
    if (memIndex !== -1) {
      MEMORY_PERMOHONAN[memIndex].status = nextStatus;
      if (signerRole === 'SUBKOORDINATOR') MEMORY_PERMOHONAN[memIndex].tte_subkoord_status = true;
      if (signerRole === 'KABID_BG') MEMORY_PERMOHONAN[memIndex].tte_kabid_status = true;
      if (signerRole === 'KADIS_PUPR') {
        MEMORY_PERMOHONAN[memIndex].tte_kadis_status = true;
        MEMORY_PERMOHONAN[memIndex].surat_hasil_gdrive_id = permohonan.surat_hasil_gdrive_id;
      }
    }

    const hist = MEMORY_HISTORY.find((h) => h.permohonan_id === permohonanId);
    if (hist) {
      if (signerRole === 'SUBKOORDINATOR') hist.tte_subkoor_hash = hashTTE;
      if (signerRole === 'KABID_BG') hist.tte_kabid_hash = hashTTE;
      if (signerRole === 'KADIS_PUPR') hist.tte_kadis_hash = hashTTE;
    }

    return { status: nextStatus, hashTTE };
  }

  /**
   * Pengisian Wajib SKM & Membuka Kunci Download Berkas (Tahap 9 -> Tahap 10)
   */
  public static async submitSKM(input: SkmInput): Promise<{
    skm: SkmRespon;
    downloadUnlocked: boolean;
    downloadUrl: string;
  }> {
    const { permohonanId, pengelolaId } = input;
    const permohonan = await this.getPermohonanById(permohonanId);
    if (!permohonan) throw new Error('Permohonan tidak ditemukan.');

    if (permohonan.status !== 'MENUNGGU_SKM' && permohonan.status !== 'SELESAI') {
      throw new Error(
        `Surat hasil belum diterbitkan atau ditandatangani oleh Kadis PUPR (Status: ${permohonan.status}).`
      );
    }

    const ikmResult = SkmService.calculateIKM(input);
    const skmRecord: SkmRespon = {
      id: crypto.randomUUID(),
      permohonan_id: permohonanId,
      pengelola_id: pengelolaId,
      u1_persyaratan: input.u1_persyaratan,
      u2_prosedur: input.u2_prosedur,
      u3_waktu_pelayanan: input.u3_waktu_pelayanan,
      u4_biaya_tarif: input.u4_biaya_tarif,
      u5_produk_spesifikasi: input.u5_produk_spesifikasi,
      u6_kompetensi_pelaksana: input.u6_kompetensi_pelaksana,
      u7_perilaku_pelaksana: input.u7_perilaku_pelaksana,
      u8_maklumat_pelayanan: input.u8_maklumat_pelayanan,
      u9_penanganan_pengaduan: input.u9_penanganan_pengaduan,
      rerata_skor: ikmResult.rerataSkor,
      ikm_konversi: ikmResult.ikmKonversi,
      mutu_pelayanan: ikmResult.mutuPelayanan,
      saran_masukan: input.saran_masukan,
      created_at: new Date().toISOString(),
    };

    // Buka Kunci: Ubah status ke SELESAI
    permohonan.status = 'SELESAI';

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('permohonan_penilaian')
          .update({ status: 'SELESAI' })
          .eq('id', permohonanId);

        await supabase.from('skm_respon').upsert([skmRecord]);
      } catch (err) {
        console.warn('Gagal simpan SKM ke DB:', err);
      }
    }

    const memIndex = MEMORY_PERMOHONAN.findIndex((p) => p.id === permohonanId);
    if (memIndex !== -1) {
      MEMORY_PERMOHONAN[memIndex].status = 'SELESAI';
    }

    const skmIndex = MEMORY_SKM.findIndex((s) => s.permohonan_id === permohonanId);
    if (skmIndex !== -1) {
      MEMORY_SKM[skmIndex] = skmRecord;
    } else {
      MEMORY_SKM.unshift(skmRecord);
    }

    const downloadUrl = `/api/v1/sipeka/permohonan/${permohonanId}/download-surat-hasil`;

    return {
      skm: skmRecord,
      downloadUnlocked: true,
      downloadUrl,
    };
  }

  /**
   * Mengambil riwayat penilaian berkala suatu gedung (Master Card History)
   */
  public static async getBangunanHistory(bangunanId: string): Promise<HistoryPenilaian[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('history_penilaian')
          .select(`
            *,
            details:detail_penilaian_komponen (*)
          `)
          .eq('bangunan_id', bangunanId)
          .order('tanggal_penilaian', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as HistoryPenilaian[];
        }
      } catch (err) {
        console.warn('Fallback memory untuk history bangunan:', err);
      }
    }

    return MEMORY_HISTORY.filter((h) => h.bangunan_id === bangunanId);
  }

  /**
   * Mengambil data geospasial kondisi sebaran gedung di Kabupaten Garut
   */
  public static async getPetaKerusakanGIS(): Promise<
    Array<{
      id: string;
      namaBangunan: string;
      instansi: string;
      kecamatan: string;
      latitude: number;
      longitude: number;
      kategoriKerusakan: string;
      persentaseKerusakan: number;
      lastSurveyDate: string;
    }>
  > {
    const list = await this.getPermohonanList();

    return list
      .filter((p) => p.bangunan && p.bangunan.latitude && p.bangunan.longitude)
      .map((p) => {
        const bg = p.bangunan!;
        const hist = p.history;
        return {
          id: p.id,
          namaBangunan: bg.nama_bangunan,
          instansi: MEMORY_INSTANSI.find((i) => i.id === bg.instansi_id)?.nama_instansi || 'Instansi Pemohon',
          kecamatan: MEMORY_INSTANSI.find((i) => i.id === bg.instansi_id)?.kecamatan || 'Garut',
          latitude: bg.latitude || -7.2144,
          longitude: bg.longitude || 107.8988,
          kategoriKerusakan: hist?.kesimpulan_klasifikasi || 'RUSAK_SEDANG',
          persentaseKerusakan: hist?.persentase_total_kerusakan || 35.5,
          lastSurveyDate: hist?.tanggal_penilaian || p.created_at.split('T')[0],
        };
      });
  }

  /**
   * Master data instansi dan gedung
   */
  public static getMasterInstansi(): Instansi[] {
    return MEMORY_INSTANSI;
  }

  public static getMasterBangunan(): Bangunan[] {
    return MEMORY_BANGUNAN;
  }

  public static getMasterUsers(): UserSipeka[] {
    return MEMORY_USERS;
  }
}

