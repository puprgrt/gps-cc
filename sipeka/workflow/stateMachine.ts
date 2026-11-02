/**
 * SIPEKA 10-STAGE WORKFLOW STATE MACHINE
 * Alur Bisnis 10 Tahapan Penilaian Kerusakan Bangunan Gedung
 * Bidang Bangunan Gedung - Dinas PUPR Kabupaten Garut
 */

import { StatusPermohonan, UserRoleSipeka } from '../types';

export interface WorkflowTransitionRule {
  from: StatusPermohonan;
  to: StatusPermohonan;
  allowedRoles: UserRoleSipeka[];
  actionName: string;
  actionLabel: string;
  requiresNotes?: boolean;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransitionRule[] = [
  // Tahap 1: Pengajuan Mandiri oleh Pengelola BG
  {
    from: 'DRAFT',
    to: 'SUBMITTED',
    allowedRoles: ['PENGELOLA_BG', 'ADMIN_SISTEM'],
    actionName: 'SUBMIT_PERMOHONAN',
    actionLabel: 'Kirim Permohonan Mandiri',
  },
  // Tahap 2: Disposisi Kabid BG ke Subkoordinator
  {
    from: 'SUBMITTED',
    to: 'DISPOSISI_SUBKOORD',
    allowedRoles: ['KABID_BG', 'ADMIN_SISTEM'],
    actionName: 'DISPOSISI_KABID',
    actionLabel: 'Disposisi ke Subkoordinator',
    requiresNotes: true,
  },
  // Tahap 3: Disposisi Subkoordinator ke Tim Teknis
  {
    from: 'DISPOSISI_SUBKOORD',
    to: 'DISPOSISI_TIM_TEKNIS',
    allowedRoles: ['SUBKOORDINATOR', 'ADMIN_SISTEM'],
    actionName: 'DISPOSISI_SUBKOORD',
    actionLabel: 'Disposisi ke Tim Teknis',
    requiresNotes: true,
  },
  // Tahap 4: Verifikasi Dokumen & Penjadwalan Survey Lapangan
  {
    from: 'DISPOSISI_TIM_TEKNIS',
    to: 'VERIFIKASI_BERKAS',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'MULAI_VERIFIKASI',
    actionLabel: 'Mulai Verifikasi Berkas',
  },
  {
    from: 'VERIFIKASI_BERKAS',
    to: 'MENUNGGU_SURVEY',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'JADWALKAN_SURVEY',
    actionLabel: 'Jadwalkan Survey Lapangan',
  },
  {
    from: 'VERIFIKASI_BERKAS',
    to: 'ANALISIS_TEKNIS',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'LANGSUNG_ANALISIS',
    actionLabel: 'Lanjut Analisis (Tanpa Survey)',
  },
  {
    from: 'MENUNGGU_SURVEY',
    to: 'SURVEY_LAPANGAN',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'MULAI_SURVEY_LAPANGAN',
    actionLabel: 'Mulai Survey Lapangan',
  },
  {
    from: 'SURVEY_LAPANGAN',
    to: 'ANALISIS_TEKNIS',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'SELESAI_SURVEY',
    actionLabel: 'Simpan Data Survey Lapangan',
  },
  // Tahap 5: Pengisian Formulir & Kalkulasi Kerusakan 2-Tahap
  {
    from: 'ANALISIS_TEKNIS',
    to: 'VALIDASI_SUBKOORD',
    allowedRoles: ['TIM_TEKNIS', 'ADMIN_SISTEM'],
    actionName: 'SUBMIT_HASIL_KALKULASI',
    actionLabel: 'Kirim Draf Hasil Analisis ke Subkoordinator',
  },
  // Tahap 6: Validasi & TTE Subkoordinator
  {
    from: 'VALIDASI_SUBKOORD',
    to: 'APPROVAL_KABID',
    allowedRoles: ['SUBKOORDINATOR', 'ADMIN_SISTEM'],
    actionName: 'TTE_SUBKOORD',
    actionLabel: 'Validasi & TTE Subkoordinator',
  },
  // Tahap 7: Approval & TTE Kabid Bangunan Gedung
  {
    from: 'APPROVAL_KABID',
    to: 'GENERATED_SURAT_HASIL',
    allowedRoles: ['KABID_BG', 'ADMIN_SISTEM'],
    actionName: 'TTE_KABID',
    actionLabel: 'Setujui & TTE Kabid BG',
  },
  // Tahap 8: Approval & TTE Kepala Dinas PUPR
  {
    from: 'GENERATED_SURAT_HASIL',
    to: 'APPROVAL_KADIS',
    allowedRoles: ['KADIS_PUPR', 'ADMIN_SISTEM'],
    actionName: 'REVIEW_KADIS',
    actionLabel: 'Tinjau Lembar Hasil Kadis',
  },
  {
    from: 'APPROVAL_KADIS',
    to: 'MENUNGGU_SKM',
    allowedRoles: ['KADIS_PUPR', 'ADMIN_SISTEM'],
    actionName: 'TTE_KADIS',
    actionLabel: 'Tandatangani Elektronik (TTE Kadis PUPR)',
  },
  // Tahap 9: Mandatory SKM Pengelola BG (Unlocking Gate)
  {
    from: 'MENUNGGU_SKM',
    to: 'SELESAI',
    allowedRoles: ['PENGELOLA_BG', 'ADMIN_SISTEM'],
    actionName: 'SUBMIT_SKM_UNLOCK',
    actionLabel: 'Kirim SKM & Buka Kunci Unduh Dokumen',
  },
];

export class SipekaWorkflowEngine {
  /**
   * Memeriksa apakah suatu transisi status diizinkan berdasarkan role user
   */
  public static canTransition(
    currentStatus: StatusPermohonan,
    targetStatus: StatusPermohonan,
    userRole: UserRoleSipeka
  ): { allowed: boolean; reason?: string } {
    const rule = WORKFLOW_TRANSITIONS.find(
      (r) => r.from === currentStatus && r.to === targetStatus
    );

    if (!rule) {
      return {
        allowed: false,
        reason: `Transisi tidak valid dari status [${currentStatus}] menuju [${targetStatus}].`,
      };
    }

    if (!rule.allowedRoles.includes(userRole)) {
      return {
        allowed: false,
        reason: `Pengguna dengan peran [${userRole}] tidak berwenang melakukan aksi [${rule.actionName}].`,
      };
    }

    return { allowed: true };
  }

  /**
   * Mengambil daftar transisi selanjutnya yang tersedia untuk status saat ini
   */
  public static getNextAllowedTransitions(
    currentStatus: StatusPermohonan,
    userRole: UserRoleSipeka
  ): WorkflowTransitionRule[] {
    return WORKFLOW_TRANSITIONS.filter(
      (r) => r.from === currentStatus && r.allowedRoles.includes(userRole)
    );
  }

  /**
   * Menentukan apakah dokumen hasil terkunci (Mandatory SKM Gate)
   */
  public static isDownloadLocked(currentStatus: StatusPermohonan): boolean {
    // Dokumen terkunci rapat di semua tahap hingga status mencapai SELESAI (pasca isi SKM)
    return currentStatus !== 'SELESAI';
  }
}

