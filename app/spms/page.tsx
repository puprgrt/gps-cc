'use client';

import React, { useEffect } from 'react';
import { SPMSLayout } from '@/components/spms/SPMSLayout';
import { useSPMS } from '@/hooks/useSPMS';
import { supabase } from '@/lib/supabase';

// Tabel-tabel Supabase yang di-subscribe untuk real-time updates
const REALTIME_TABLES = [
  'spms_survey_responses',
  'spms_metrics',
  'spms_bidang_performance',
  'spms_operator_performance',
  'spms_ai_performance',
  'spms_early_warnings',
  'spms_ai_recommendations',
  'spms_heatmap_kecamatan',
  'spms_trend_data',
  'spms_ai_insights',
] as const;

export default function SPMSDashboardPage() {
  const { fetchDashboardData, isLoading, error } = useSPMS();

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Auto-refresh setiap 60 detik sebagai fallback
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60_000);

    // Setup Supabase Realtime subscriptions
    const channel = supabase
      .channel('spms-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_survey_responses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_metrics' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_bidang_performance' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_operator_performance' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_ai_performance' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_early_warnings' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_ai_recommendations' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_heatmap_kecamatan' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_trend_data' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spms_ai_insights' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark text-white">
        <div className="glass-card p-6 flex flex-col items-center">
          <div className="text-rose-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Gagal Memuat SPMS</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return <SPMSLayout />;
}
