/**
 * ============================================================================
 * SPMS Constants & Configuration
 * Smart Public Service Performance Management System
 * Dinas PUPR Kabupaten Garut
 * ============================================================================
 */

import type {
  LayananType,
  SSSGrade,
  SurveyChannel,
  WarningType,
} from '@/domain/spms';
import type { BidangPUPR } from '@/domain/aiRouting';

// ============================================================================
// LAYANAN LIST
// ============================================================================

export interface LayananConfig {
  id: LayananType;
  label: string;
  shortLabel: string;
  bidang: BidangPUPR;
  slaTargetDays: number;
  icon: string; // lucide icon name
}

export const LAYANAN_LIST: LayananConfig[] = [
  { id: 'KRK', label: 'Keterangan Rencana Kota', shortLabel: 'KRK', bidang: 'PENATAAN_RUANG', slaTargetDays: 5, icon: 'MapIcon' },
  { id: 'PKKPR', label: 'Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang', shortLabel: 'PKKPR', bidang: 'PENATAAN_RUANG', slaTargetDays: 7, icon: 'FileCheck' },
  { id: 'PEIL_BANJIR', label: 'Rekomendasi Teknis Peil Banjir', shortLabel: 'Peil Banjir', bidang: 'SDA', slaTargetDays: 5, icon: 'Droplet' },
  { id: 'IRIGASI', label: 'Rekomendasi Irigasi Teknis', shortLabel: 'Irigasi', bidang: 'SDA', slaTargetDays: 5, icon: 'Waves' },
  { id: 'RUMIJA', label: 'Rekomendasi Teknis Pemanfaatan Ruang Milik Jalan', shortLabel: 'RUMIJA', bidang: 'BINA_MARGA', slaTargetDays: 5, icon: 'MapPin' },
  { id: 'SITEPLAN', label: 'Pengesahan Siteplan', shortLabel: 'Siteplan', bidang: 'PENATAAN_RUANG', slaTargetDays: 10, icon: 'FileSignature' },
  { id: 'PBG', label: 'Persetujuan Bangunan Gedung', shortLabel: 'PBG', bidang: 'BANGUNAN_GEDUNG', slaTargetDays: 14, icon: 'Building' },
  { id: 'SLF', label: 'Sertifikat Laik Fungsi', shortLabel: 'SLF', bidang: 'BANGUNAN_GEDUNG', slaTargetDays: 14, icon: 'FileBadge' },
  { id: 'PENGADUAN', label: 'Pengaduan Infrastruktur', shortLabel: 'Pengaduan', bidang: 'SEKRETARIAT', slaTargetDays: 3, icon: 'AlertTriangle' },
  { id: 'INFORMASI_PUBLIK', label: 'Layanan Informasi Publik', shortLabel: 'Info Publik', bidang: 'SEKRETARIAT', slaTargetDays: 1, icon: 'Info' },
];

// ============================================================================
// BIDANG LIST
// ============================================================================

export interface BidangConfig {
  id: BidangPUPR;
  label: string;
  shortLabel: string;
  color: string;
}

export const BIDANG_LIST: BidangConfig[] = [
  { id: 'SEKRETARIAT', label: 'Sekretariat', shortLabel: 'Sek', color: '#6366f1' },
  { id: 'BINA_MARGA', label: 'Bina Marga', shortLabel: 'BM', color: '#f59e0b' },
  { id: 'SDA', label: 'Sumber Daya Air', shortLabel: 'SDA', color: '#06b6d4' },
  { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung', shortLabel: 'BG', color: '#ef4444' },
  { id: 'PENATAAN_RUANG', label: 'Penataan Ruang', shortLabel: 'PR', color: '#22c55e' },
  { id: 'JASA_KONSTRUKSI', label: 'Jasa Konstruksi', shortLabel: 'JK', color: '#a855f7' },
  { id: 'AMPL', label: 'Air Minum & Penyehatan Lingkungan', shortLabel: 'AMPL', color: '#0ea5e9' },
];

// ============================================================================
// SMART SERVICE SCORE (SSS) CONFIGURATION
// ============================================================================

export interface SSSWeightConfig {
  key: string;
  label: string;
  weight: number;
}

export const SSS_WEIGHTS: SSSWeightConfig[] = [
  { key: 'kepuasan', label: 'Kepuasan Masyarakat (SKM/IKM)', weight: 30 },
  { key: 'sla', label: 'Kepatuhan SLA', weight: 20 },
  { key: 'responseSpeed', label: 'Kecepatan Respons', weight: 15 },
  { key: 'completion', label: 'Penyelesaian Layanan', weight: 15 },
  { key: 'aiQuality', label: 'Kualitas Jawaban AI', weight: 10 },
  { key: 'complaintHandling', label: 'Penanganan Pengaduan', weight: 5 },
  { key: 'sentiment', label: 'Sentimen Masyarakat', weight: 5 },
];

export interface SSSGradeConfig {
  grade: SSSGrade;
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
}

export const SSS_GRADES: SSSGradeConfig[] = [
  { grade: 'A', label: 'Sangat Baik', min: 90, max: 100, color: '#22c55e', bgColor: 'bg-emerald-500/10' },
  { grade: 'B', label: 'Baik', min: 80, max: 89, color: '#3b82f6', bgColor: 'bg-blue-500/10' },
  { grade: 'C', label: 'Cukup', min: 70, max: 79, color: '#f59e0b', bgColor: 'bg-amber-500/10' },
  { grade: 'D', label: 'Kurang', min: 60, max: 69, color: '#f97316', bgColor: 'bg-orange-500/10' },
  { grade: 'E', label: 'Sangat Kurang', min: 0, max: 59, color: '#ef4444', bgColor: 'bg-red-500/10' },
];

// ============================================================================
// SURVEY DIMENSIONS — 10 Dimensi Penilaian
// ============================================================================

export interface SurveyDimensionConfig {
  id: string;
  label: string;
  question: string;
}

export const SURVEY_DIMENSIONS: SurveyDimensionConfig[] = [
  { id: 'kemudahan_informasi', label: 'Kemudahan Informasi', question: 'Kemudahan memperoleh informasi layanan' },
  { id: 'kejelasan_persyaratan', label: 'Kejelasan Persyaratan', question: 'Kejelasan persyaratan pelayanan' },
  { id: 'kemudahan_prosedur', label: 'Kemudahan Prosedur', question: 'Kemudahan prosedur pelayanan' },
  { id: 'kecepatan_pelayanan', label: 'Kecepatan Pelayanan', question: 'Kecepatan pelayanan' },
  { id: 'ketepatan_penyelesaian', label: 'Ketepatan Penyelesaian', question: 'Ketepatan penyelesaian layanan' },
  { id: 'keramahan_petugas', label: 'Keramahan Petugas', question: 'Keramahan petugas pelayanan' },
  { id: 'kompetensi_petugas', label: 'Kompetensi Petugas', question: 'Kompetensi petugas pelayanan' },
  { id: 'kejelasan_ai', label: 'Kejelasan Informasi AI', question: 'Kejelasan informasi yang diberikan AI' },
  { id: 'kemudahan_sistem', label: 'Kemudahan Sistem', question: 'Kemudahan penggunaan sistem' },
  { id: 'kepuasan_keseluruhan', label: 'Kepuasan Keseluruhan', question: 'Kepuasan keseluruhan terhadap layanan' },
];

// ============================================================================
// SURVEY CHANNELS
// ============================================================================

export const SURVEY_CHANNELS: { id: SurveyChannel; label: string; icon: string }[] = [
  { id: 'WHATSAPP', label: 'WhatsApp', icon: 'MessageCircle' },
  { id: 'EMAIL', label: 'Email', icon: 'Mail' },
  { id: 'WEBSITE', label: 'Website', icon: 'Globe' },
  { id: 'QR_CODE', label: 'QR Code', icon: 'QrCode' },
  { id: 'SMS', label: 'SMS', icon: 'Smartphone' },
];

// ============================================================================
// KECAMATAN KABUPATEN GARUT (42 Kecamatan)
// ============================================================================

export interface KecamatanConfig {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const KECAMATAN_GARUT: KecamatanConfig[] = [
  { id: 'tarogong-kidul', name: 'Tarogong Kidul', lat: -7.2167, lng: 107.9000 },
  { id: 'tarogong-kaler', name: 'Tarogong Kaler', lat: -7.1833, lng: 107.9000 },
  { id: 'garut-kota', name: 'Garut Kota', lat: -7.2275, lng: 107.9089 },
  { id: 'karangpawitan', name: 'Karangpawitan', lat: -7.2333, lng: 107.9500 },
  { id: 'wanaraja', name: 'Wanaraja', lat: -7.2500, lng: 107.9167 },
  { id: 'samarang', name: 'Samarang', lat: -7.2000, lng: 107.8500 },
  { id: 'pasirwangi', name: 'Pasirwangi', lat: -7.1833, lng: 107.8167 },
  { id: 'leles', name: 'Leles', lat: -7.1333, lng: 107.8833 },
  { id: 'kadungora', name: 'Kadungora', lat: -7.1333, lng: 107.8500 },
  { id: 'banyuresmi', name: 'Banyuresmi', lat: -7.1833, lng: 107.9333 },
  { id: 'bayongbong', name: 'Bayongbong', lat: -7.2667, lng: 107.9333 },
  { id: 'cigedug', name: 'Cigedug', lat: -7.2000, lng: 107.7833 },
  { id: 'cilawu', name: 'Cilawu', lat: -7.2833, lng: 107.8667 },
  { id: 'cisurupan', name: 'Cisurupan', lat: -7.3167, lng: 107.8833 },
  { id: 'cikajang', name: 'Cikajang', lat: -7.3667, lng: 107.8333 },
  { id: 'banjarwangi', name: 'Banjarwangi', lat: -7.3500, lng: 107.9000 },
  { id: 'singajaya', name: 'Singajaya', lat: -7.4000, lng: 107.9167 },
  { id: 'cihurip', name: 'Cihurip', lat: -7.4167, lng: 107.9500 },
  { id: 'peundeuy', name: 'Peundeuy', lat: -7.3667, lng: 107.9500 },
  { id: 'pameungpeuk', name: 'Pameungpeuk', lat: -7.6500, lng: 107.7500 },
  { id: 'cibalong', name: 'Cibalong', lat: -7.5833, lng: 107.7333 },
  { id: 'cisewu', name: 'Cisewu', lat: -7.5500, lng: 107.5833 },
  { id: 'caringin', name: 'Caringin', lat: -7.5000, lng: 107.5500 },
  { id: 'bungbulang', name: 'Bungbulang', lat: -7.5167, lng: 107.6500 },
  { id: 'mekarmukti', name: 'Mekarmukti', lat: -7.5333, lng: 107.6333 },
  { id: 'pakenjeng', name: 'Pakenjeng', lat: -7.4833, lng: 107.6833 },
  { id: 'pamulihan', name: 'Pamulihan', lat: -7.4500, lng: 107.7167 },
  { id: 'cikelet', name: 'Cikelet', lat: -7.5833, lng: 107.8333 },
  { id: 'cisompet', name: 'Cisompet', lat: -7.5500, lng: 107.8833 },
  { id: 'limbangan', name: 'Limbangan', lat: -7.1500, lng: 107.9167 },
  { id: 'kersamanah', name: 'Kersamanah', lat: -7.1667, lng: 107.9500 },
  { id: 'cibatu', name: 'Cibatu', lat: -7.1167, lng: 107.9333 },
  { id: 'malangbong', name: 'Malangbong', lat: -7.0833, lng: 107.9833 },
  { id: 'sukawening', name: 'Sukawening', lat: -7.1500, lng: 107.8333 },
  { id: 'karangtengah', name: 'Karangtengah', lat: -7.1167, lng: 107.8167 },
  { id: 'selaawi', name: 'Selaawi', lat: -7.0833, lng: 107.9333 },
  { id: 'blubur-limbangan', name: 'Blubur Limbangan', lat: -7.1333, lng: 107.9000 },
  { id: 'sukaresmi', name: 'Sukaresmi', lat: -7.2667, lng: 107.8333 },
  { id: 'leuwisari', name: 'Leuwisari', lat: -7.5333, lng: 107.9167 },
  { id: 'sucinaraja', name: 'Sucinaraja', lat: -7.3000, lng: 107.9500 },
  { id: 'pangatikan', name: 'Pangatikan', lat: -7.1000, lng: 107.8667 },
  { id: 'cibuluh', name: 'Cibiuk', lat: -7.1000, lng: 107.9000 },
];

// ============================================================================
// WARNING THRESHOLDS
// ============================================================================

export interface WarningThreshold {
  type: WarningType;
  label: string;
  threshold: number;
  unit: string;
  direction: 'above' | 'below';
}

export const WARNING_THRESHOLDS: WarningThreshold[] = [
  { type: 'SLA_BREACH', label: 'SLA Terancam Terlampaui', threshold: 85, unit: '%', direction: 'below' },
  { type: 'SENTIMENT_NEGATIVE', label: 'Sentimen Negatif Meningkat', threshold: 25, unit: '%', direction: 'above' },
  { type: 'COMPLAINT_SURGE', label: 'Lonjakan Pengaduan', threshold: 150, unit: '%', direction: 'above' },
  { type: 'OPERATOR_OVERLOAD', label: 'Operator Kelebihan Beban', threshold: 20, unit: 'tiket', direction: 'above' },
  { type: 'SATISFACTION_DROP', label: 'Penurunan Kepuasan', threshold: 5, unit: '%', direction: 'above' },
];

// ============================================================================
// SLA TARGETS PER LAYANAN
// ============================================================================

export const SLA_TARGETS: Record<LayananType, number> = {
  KRK: 5,
  PKKPR: 7,
  PEIL_BANJIR: 5,
  IRIGASI: 5,
  RUMIJA: 5,
  SITEPLAN: 10,
  PBG: 14,
  SLF: 14,
  PENGADUAN: 3,
  INFORMASI_PUBLIK: 1,
};
