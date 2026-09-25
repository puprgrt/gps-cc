import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/apiService';
import { DashboardMetrics, LayananKinerja, ComplaintData, ComplaintTicket } from '../domain/models';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [layanan, setLayanan] = useState<LayananKinerja[]>([]);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<ComplaintTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [metricsData, layananData, complaintsData, recentComplaintsData] = await Promise.all([
          ApiService.getDashboardMetrics(),
          ApiService.getLayananKinerja(),
          ApiService.getComplaintData(),
          ApiService.getRecentComplaints(5),
        ]);
        if (isMounted) {
          setMetrics(metricsData);
          setLayanan(layananData);
          setComplaints(complaintsData);
          setRecentComplaints(recentComplaintsData);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError('Gagal memuat data dashboard');
          setLoading(false);
        }
      }
    };

    void loadData();

    // Polling interval 5 detik untuk pembaruan real-time di background
    const pollingInterval = setInterval(() => {
      void loadData();
    }, 5000);

    // Supabase Realtime subscription untuk mendengarkan perubahan tabel secara instan (jika terkonfigurasi)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured) {
      channel = supabase.channel('dashboard_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          () => {
            void loadData();
          }
        )
        .subscribe((status) => {
          setIsLiveSyncing(status === 'SUBSCRIBED' || status === 'CLOSED');
        });
    }

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, layananData, complaintsData, recentComplaintsData] = await Promise.all([
        ApiService.getDashboardMetrics(),
        ApiService.getLayananKinerja(),
        ApiService.getComplaintData(),
        ApiService.getRecentComplaints(5),
      ]);
      setMetrics(metricsData);
      setLayanan(layananData);
      setComplaints(complaintsData);
      setRecentComplaints(recentComplaintsData);
      setLastUpdated(new Date());
    } catch {
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    metrics, 
    layanan, 
    complaints, 
    recentComplaints,
    loading, 
    error, 
    isLiveSyncing, 
    lastUpdated,
    refetch 
  };
}

