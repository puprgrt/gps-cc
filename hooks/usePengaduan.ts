'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComplaintTicket, ComplaintStats } from '@/domain/models';
import { ApiService } from '@/services/apiService';

export interface UsePengaduanFilters {
  status?: string;
  bidang?: string;
  prioritas?: string;
  search?: string;
}

export function usePengaduan(initialFilters: UsePengaduanFilters = {}) {
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    kritis: 0,
    tinggi: 0,
    normal: 0,
    pending: 0,
    diproses: 0,
    selesai: 0,
    byBidang: {},
  });
  const [filters, setFilters] = useState<UsePengaduanFilters>(initialFilters);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await ApiService.getAllComplaints(filters);
        if (isMounted) {
          setComplaints(res.complaints);
          setStats(res.stats);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError('Gagal memuat data pengaduan.');
          setLoading(false);
        }
      }
    };

    void loadData();

    // Polling setiap 5 detik agar pengaduan baru dari bot otomatis masuk
    const interval = setInterval(() => {
      void loadData();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [filters]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getAllComplaints(filters);
      setComplaints(res.complaints);
      setStats(res.stats);
      setLastUpdated(new Date());
    } catch {
      setError('Gagal memuat data pengaduan.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateStatus = async (
    id: string,
    status: string,
    catatanPetugas?: string,
    notifyCitizen = false
  ) => {
    setIsUpdating(true);
    try {
      const ok = await ApiService.updateComplaintStatus(id, status, catatanPetugas, notifyCitizen);
      if (ok) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const createComplaint = async (payload: Partial<ComplaintTicket>) => {
    setIsUpdating(true);
    try {
      const res = await ApiService.createComplaint(payload);
      if (res.success && res.data) {
        await refetch();
        return res;
      }
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat pengaduan.';
      return { success: false, error: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    complaints,
    stats,
    loading,
    error,
    isUpdating,
    lastUpdated,
    filters,
    setFilters,
    refetch,
    updateStatus,
    createComplaint,
  };
}
