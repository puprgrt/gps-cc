export interface DashboardMetrics {
  totalPermohonan: number;
  slaKepatuhan: number;
  hariIni: number;
  bulanIni: number;
  tahunIni: number;
  persentasePenyelesaian: number;
  ikm: number;
  totalPengaduan: number;
  aiActivity: number;
}

export interface LayananKinerja {
  id: string;
  nama: string;
  total: number;
  selesai: number;
  proses: number;
  sla: number;
}

export interface ComplaintData {
  kategori: string;
  jumlah: number;
}

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  bidang?: string;               // Bidang di Dinas PUPR
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: number | Date;   // Timestamp
  createdAt?: number | Date;
  updatedAt?: number | Date;
}

