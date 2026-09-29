/**
 * ============================================================================
 * DOMAIN MODEL: COMPLAINT & TICKET MANAGEMENT (PURI AI COMMAND CENTER)
 * Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut
 * ============================================================================
 */

import { BidangPUPR } from './aiRouting';

export type ComplaintPriority = 'KRITIS' | 'TINGGI' | 'NORMAL' | 'RENDAH';
export type ComplaintStatus = 'PENDING' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';

export interface ComplaintAttachment {
  type: 'image' | 'document' | 'video';
  url: string;
  fileName?: string;
  mimetype?: string;
  size?: number;
  uploadedAt?: string;
  base64?: string;
}

export interface ComplaintResolution {
  jawabanPetugas: string;
  namaPetugas: string;
  nomorKontakPetugas?: string;
  waktuSelesai: string;
  buktiLampiran?: ComplaintAttachment[];
  channel?: 'WHATSAPP_BOT' | 'COMMAND_CENTER';
}

export interface ComplaintTicket {
  id: string; // contoh: "TKT-20260923-001"
  nomorTiket: string;
  conversationId?: string;
  pelapor: string;
  nomorKontak: string;
  lokasi: string;
  kecamatan?: string;
  judul: string;
  deskripsi?: string;
  bidang: BidangPUPR;
  bidangLabel: string;
  kategori: string;
  prioritas: ComplaintPriority;
  status: ComplaintStatus;
  langkahPenanganan?: string;
  ringkasanBot?: string; // Teks lengkap hasil ringkasan otomatis WA BOT
  assignedOperator?: string;
  catatanPetugas?: string;
  tindakLanjut?: ComplaintResolution;
  buktiLampiran?: ComplaintAttachment[];
  createdAt: string;
  updatedAt: string;
  source: 'WHATSAPP_BOT' | 'PORTAL' | 'MANUAL';
}

export interface ComplaintStats {
  total: number;
  kritis: number;
  tinggi: number;
  normal: number;
  pending: number;
  diproses: number;
  selesai: number;
  byBidang: Record<string, number>;
}
