/**
 * IDDS (Indonesian Digital Design System) & Theme Tokens for SIPEKA
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 */

import { StatusPermohonan, UserRoleSipeka } from '../types';

export const IDDS_COLORS = {
  // Brand Resmi Dinas PUPR
  puprGold: '#F2A900',          // Aksen utama, tombol primer, sorotan aktif
  puprNavy: '#0A2540',          // Header, sidebar, elemen kedinasan resmi
  puprBlueDark: '#071A2E',      // Background deep contrast
  puprGoldHover: '#D99800',     // State hover gold
  puprNavyHover: '#0E3256',     // State hover navy

  // Status Workflow
  statusDraft: '#6C757D',       // Abu-abu
  statusProcess: '#0D6EFD',     // Biru proses
  statusSurvey: '#FFC107',      // Kuning survey
  statusApproved: '#198754',    // Hijau sukses/TTE
  statusRejected: '#DC3545',    // Merah peringatan/bahaya

  // Background & Surfaces
  bgCanvas: '#0A111F',          // Surface utama GPS-CC
  bgCard: '#111B2E',            // Surface Card IDDS
  bgInput: '#17243B',           // Surface Input form
  borderMuted: 'rgba(242, 169, 0, 0.2)', // Border aksen gold halus
  borderNavy: 'rgba(10, 37, 64, 0.4)',

  // Teks WCAG 2.1 AA (Kontras Tinggi)
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textGold: '#F2A900',
  textNavy: '#0A2540',
} as const;

export interface WorkflowStageMeta {
  stageNumber: number;
  status: StatusPermohonan;
  label: string;
  shortDesc: string;
  actor: UserRoleSipeka;
  actorLabel: string;
  iconName: string;
}

export const WORKFLOW_10_STAGES: WorkflowStageMeta[] = [
  {
    stageNumber: 1,
    status: 'SUBMITTED',
    label: 'Permohonan Mandiri',
    shortDesc: 'Pengelola mengunggah berkas daftar simak & auto-generate surat permohonan',
    actor: 'PENGELOLA_BG',
    actorLabel: 'Pengelola Bangunan / Sekolah',
    iconName: 'FileText'
  },
  {
    stageNumber: 2,
    status: 'DISPOSISI_SUBKOORD',
    label: 'Disposisi Kabid BG',
    shortDesc: 'Kepala Bidang memeriksa dan mendisposisikan ke Subkoordinator',
    actor: 'KABID_BG',
    actorLabel: 'Kabid Bangunan',
    iconName: 'Send'
  },
  {
    stageNumber: 3,
    status: 'DISPOSISI_TIM_TEKNIS',
    label: 'Disposisi Subkoordinator',
    shortDesc: 'Subkoordinator menugaskan Tim Teknis penilai lapangan',
    actor: 'SUBKOORDINATOR',
    actorLabel: 'Subkoordinator BG',
    iconName: 'UserCheck'
  },
  {
    stageNumber: 4,
    status: 'VERIFIKASI_BERKAS',
    label: 'Verifikasi & Gate Survey',
    shortDesc: 'Tim Teknis menilai kelengkapan bukti dan menentukan jadwal survey lapangan jika diperlukan',
    actor: 'TIM_TEKNIS',
    actorLabel: 'Tim Teknis PUPR',
    iconName: 'ClipboardCheck'
  },
  {
    stageNumber: 5,
    status: 'ANALISIS_TEKNIS',
    label: 'Survey & Analisis 2-Tahap',
    shortDesc: 'Pemeriksaan visual safety gate dan kalkulasi kuantitatif Form Alt.A/B/C',
    actor: 'TIM_TEKNIS',
    actorLabel: 'Tim Teknis PUPR',
    iconName: 'Calculator'
  },
  {
    stageNumber: 6,
    status: 'VALIDASI_SUBKOORD',
    label: 'Validasi & TTE Subkoordinator',
    shortDesc: 'Pemeriksaan lembar perhitungan kuantitatif dan pembubuhan TTE',
    actor: 'SUBKOORDINATOR',
    actorLabel: 'Subkoordinator BG',
    iconName: 'PenTool'
  },
  {
    stageNumber: 7,
    status: 'APPROVAL_KABID',
    label: 'Approval & TTE Kabid BG',
    shortDesc: 'Persetujuan berjenjang dan penandatanganan elektronik oleh Kabid',
    actor: 'KABID_BG',
    actorLabel: 'Kabid Bangunan',
    iconName: 'Award'
  },
  {
    stageNumber: 8,
    status: 'APPROVAL_KADIS',
    label: 'Auto-Generate & TTE Kadis',
    shortDesc: 'Penerbitan Surat Hasil Analisis resmi ber-KOP Dinas & TTE Kepala Dinas PUPR',
    actor: 'KADIS_PUPR',
    actorLabel: 'Kepala Dinas PUPR Garut',
    iconName: 'CheckCircle2'
  },
  {
    stageNumber: 9,
    status: 'MENUNGGU_SKM',
    label: 'Mandatory SKM PermenPAN-RB',
    shortDesc: 'Pengelola BG wajib mengisi 9 indikator survei kepuasan untuk membuka file download',
    actor: 'PENGELOLA_BG',
    actorLabel: 'Pengelola Bangunan / Sekolah',
    iconName: 'Star'
  },
  {
    stageNumber: 10,
    status: 'SELESAI',
    label: 'Selesai & Pengarsipan Digital',
    shortDesc: 'Unduh Surat Hasil Analisis legal dan berkas disimpan di database riwayat gedung',
    actor: 'ADMIN_SISTEM',
    actorLabel: 'Sistem Terarsip Otomatis',
    iconName: 'DownloadCloud'
  }
];
