import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/apiService';
import { DashboardMetrics, LayananKinerja, ComplaintData } from '../domain/models';
import { supabase } from '../lib/supabase';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [layanan, setLayanan] = useState<LayananKinerja[]>([]);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [metricsData, layananData, complaintsData] = await Promise.all([
        ApiService.getDashboardMetrics(),
        ApiService.getLayananKinerja(),
        ApiService.getComplaintData(),
      ]);
      setMetrics(metricsData);
      setLayanan(layananData);
      setComplaints(complaintsData);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) setError('Gagal memuat data dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Polling interval 5 detik untuk pembaruan real-time di background
    const pollingInterval = setInterval(() => {
      fetchData(true);
    }, 5000);

    // Supabase Realtime subscription untuk mendengarkan perubahan tabel secara instan
    const channel = supabase.channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchData(true);
        }
      )
      .subscribe((status) => {
        setIsLiveSyncing(status === 'SUBSCRIBED' || status === 'CLOSED');
      });

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { 
    metrics, 
    layanan, 
    complaints, 
    loading, 
    error, 
    isLiveSyncing, 
    lastUpdated,
    refetch: () => fetchData(false) 
  };
}

