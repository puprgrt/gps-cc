import React from 'react';

export default function MonitoringPage() {
  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Monitoring</h1>
        <p className="text-slate-400">Pusat Monitoring Pelayanan Publik</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Modul Sedang Dikembangkan</h2>
          <p className="text-slate-400 max-w-md mx-auto">Halaman monitoring kinerja pelayanan publik dan pantauan realtime akan segera tersedia pada pembaruan berikutnya.</p>
        </div>
      </div>
    </div>
  );
}
