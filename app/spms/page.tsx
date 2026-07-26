'use client';

import React, { useEffect } from 'react';
import { SPMSLayout } from '@/components/spms/SPMSLayout';
import { useSPMS } from '@/hooks/useSPMS';

export default function SPMSDashboardPage() {
  const { fetchDashboardData, isLoading, error } = useSPMS();

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();
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

  // Pass loading state to a wrapper if needed, but the layout components handle loading skeleton individually
  return <SPMSLayout />;
}
