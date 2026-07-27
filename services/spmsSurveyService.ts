import { supabase } from '@/lib/supabase';
import type { SurveyFormData } from '@/domain/spms';
import { v4 as uuidv4 } from 'uuid';

export class SPMSSurveyService {
  /**
   * Mengirim data survei publik ke Supabase
   * @param data Data dari form survei publik
   */
  static async submitSurvey(data: SurveyFormData): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Calculate Sentimen secara sederhana dari skor NPS/Dimensi jika tidak ada NLP text analysis
      // Kita asumsikan berdasarkan NPS atau rata-rata dimensi
      let sentimen = 'NETRAL';
      if (data.npsScore !== undefined) {
        if (data.npsScore >= 9) sentimen = 'POSITIF';
        else if (data.npsScore <= 6) sentimen = 'NEGATIF';
      }

      // 2. Format payload untuk Supabase
      const payload = {
        id: uuidv4(),
        respondent_name: data.respondentName || 'Anonim',
        respondent_phone: data.respondentPhone || null,
        gender: data.gender || null,
        education: data.education || null,
        occupation: data.occupation || null,
        layanan: data.layanan,
        channel: 'WEBSITE',
        status: 'COMPLETED',
        dimensions: data.dimensions,
        nps_score: data.npsScore,
        comment: data.comment || null,
        sentimen: sentimen,
        submitted_at: new Date().toISOString()
      };

      // 3. Simpan ke database
      const { error } = await supabase
        .from('spms_survey_responses')
        .insert([payload]);

      if (error) {
        console.error('Error submitting survey:', error);
        if (error.code === '42P01') {
          console.warn('Tabel spms_survey_responses tidak ditemukan, menggunakan mock mode');
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to submit survey:', error);
      return { success: false, error: error.message || 'Terjadi kesalahan sistem' };
    }
  }

  /**
   * Mengambil konfigurasi survei (dinamis)
   */
  static async getSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('spms_survey_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error) {
        // Fallback jika tabel belum ada atau kosong
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return this.getDefaultSettings();
        }
        console.error('Error fetching survey settings:', error);
        return this.getDefaultSettings();
      }

      // Parse JSON fields
      return {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions,
        layananOptions: typeof data.layanan_options === 'string' ? JSON.parse(data.layanan_options) : data.layanan_options,
        personalDataFields: typeof data.personal_data_fields === 'string' ? JSON.parse(data.personal_data_fields) : (data.personal_data_fields || []),
      };
    } catch (err) {
      console.error('Failed to fetch settings, using default', err);
      return this.getDefaultSettings();
    }
  }

  /**
   * Menyimpan konfigurasi survei
   */
  static async saveSettings(settings: any): Promise<{success: boolean; error?: string}> {
    try {
      const payload = {
        id: 'default',
        title: settings.title,
        description: settings.description,
        questions: JSON.stringify(settings.questions),
        layanan_options: JSON.stringify(settings.layananOptions),
        personal_data_fields: JSON.stringify(settings.personalDataFields),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('spms_survey_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, simulate success for development
          if (typeof window !== 'undefined') {
            localStorage.setItem('spms_survey_settings_mock', JSON.stringify(settings));
          }
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private static getDefaultSettings() {
    // Cek local storage mock jika ada (untuk development tanpa DB table)
    if (typeof window !== 'undefined') {
      const mock = localStorage.getItem('spms_survey_settings_mock');
      if (mock) {
        try { return JSON.parse(mock); } catch(e) {}
      }
    }

    return {
      id: 'default',
      title: 'Survei Kepuasan Masyarakat',
      description: 'Partisipasi Anda sangat berarti untuk meningkatkan kualitas pelayanan publik kami. Data Anda dijamin kerahasiaannya.',
      questions: [
        { id: 'U1', label: 'Kesesuaian Persyaratan Pelayanan', isActive: true, order: 1 },
        { id: 'U2', label: 'Kemudahan Sistem & Prosedur', isActive: true, order: 2 },
        { id: 'U3', label: 'Kecepatan Waktu Pelayanan', isActive: true, order: 3 },
        { id: 'U4', label: 'Kesesuaian Biaya/Tarif', isActive: true, order: 4 },
        { id: 'U5', label: 'Kualitas Produk Layanan', isActive: true, order: 5 },
        { id: 'U6', label: 'Kompetensi/Kemampuan Petugas', isActive: true, order: 6 },
        { id: 'U7', label: 'Sikap & Perilaku Petugas', isActive: true, order: 7 },
        { id: 'U8', label: 'Kualitas Sarana & Prasarana', isActive: true, order: 8 },
        { id: 'U9', label: 'Penanganan Pengaduan & Saran', isActive: true, order: 9 }
      ],
      layananOptions: [
        { value: 'KRK', label: 'Keterangan Rencana Kabupaten (KRK)', isActive: true },
        { value: 'PKKPR', label: 'Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)', isActive: true },
        { value: 'PEIL_BANJIR', label: 'Rekomendasi Peil Banjir', isActive: true },
        { value: 'IRIGASI', label: 'Rekomendasi Teknis Pemanfaatan Air Irigasi', isActive: true },
        { value: 'RUMIJA', label: 'Rekomendasi Pemanfaatan Ruang Milik Jalan (RUMIJA)', isActive: true },
        { value: 'SITEPLAN', label: 'Pengesahan Siteplan', isActive: true },
        { value: 'PBG', label: 'Persetujuan Bangunan Gedung (PBG)', isActive: true },
        { value: 'SLF', label: 'Sertifikat Laik Fungsi (SLF)', isActive: true },
        { value: 'PENGADUAN', label: 'Layanan Pengaduan Masyarakat', isActive: true },
        { value: 'INFORMASI_PUBLIK', label: 'Layanan Informasi Publik', isActive: true }
      ],
      personalDataFields: [
        { id: 'respondentName', label: 'Nama Lengkap', isActive: true, isRequired: false, fieldType: 'text' },
        { id: 'respondentPhone', label: 'Nomor WhatsApp', isActive: true, isRequired: false, fieldType: 'tel' },
        {
          id: 'gender', label: 'Jenis Kelamin', isActive: true, isRequired: false, fieldType: 'select',
          options: ['Laki-laki', 'Perempuan']
        },
        {
          id: 'education', label: 'Pendidikan Terakhir', isActive: true, isRequired: false, fieldType: 'select',
          options: ['SD/Sederajat', 'SMP/Sederajat', 'SMA/SMK/Sederajat', 'D1/D2/D3', 'S1/D4', 'S2', 'S3']
        },
        {
          id: 'occupation', label: 'Pekerjaan', isActive: true, isRequired: false, fieldType: 'select',
          options: ['PNS/TNI/Polri', 'Pegawai Swasta', 'Wiraswasta/Pengusaha', 'Pelajar/Mahasiswa', 'Petani/Nelayan', 'Ibu Rumah Tangga', 'Pensiunan', 'Lainnya']
        }
      ]
    };
  }
}
