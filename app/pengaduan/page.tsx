'use client';

import React, { useState } from 'react';
import {
  AlertTriangle, RefreshCw, Plus
} from 'lucide-react';

import { usePengaduan } from '@/hooks/usePengaduan';
import type { ComplaintTicket, ComplaintStatus } from '@/domain/models';

import { ComplaintStatsCards } from '@/components/pengaduan/ComplaintStatsCards';
import { ComplaintFilters } from '@/components/pengaduan/ComplaintFilters';
import { ComplaintTableList } from '@/components/pengaduan/ComplaintTableList';
import { ComplaintDetailPanel } from '@/components/pengaduan/ComplaintDetailPanel';
import { CreateComplaintModal } from '@/components/pengaduan/CreateComplaintModal';
import { UpdateStatusModal } from '@/components/pengaduan/UpdateStatusModal';

export default function PengaduanPage() {
  const {
    complaints,
    stats,
    loading,
    isUpdating,
    lastUpdated,
    filters,
    setFilters,
    refetch,
    updateStatus,
    createComplaint,
  } = usePengaduan();

  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState<{
    isOpen: boolean;
    targetStatus: ComplaintStatus;
  }>({
    isOpen: false,
    targetStatus: 'DIPROSES',
  });

  const handleSearchSubmit = () => {
    setFilters({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({});
  };

  const handleExportCsv = () => {
    if (complaints.length === 0) return;
    const headers = [
      'Nomor Tiket', 'Pelapor', 'Nomor Kontak', 'Lokasi', 'Kecamatan',
      'Bidang', 'Kategori', 'Prioritas', 'Status', 'Judul', 'Waktu Masuk', 'Petugas'
    ];
    const rows = complaints.map((c) => [
      `"${c.nomorTiket}"`,
      `"${c.pelapor.replace(/"/g, '""')}"`,
      `"${c.nomorKontak || ''}"`,
      `"${c.lokasi.replace(/"/g, '""')}"`,
      `"${c.kecamatan || ''}"`,
      `"${c.bidangLabel || c.bidang}"`,
      `"${c.kategori}"`,
      `"${c.prioritas}"`,
      `"${c.status}"`,
      `"${c.judul.replace(/"/g, '""')}"`,
      `"${c.createdAt}"`,
      `"${c.assignedOperator || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `pengaduan-pupr-garut-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestStatusChange = (status: ComplaintStatus) => {
    setStatusModalConfig({
      isOpen: true,
      targetStatus: status,
    });
  };

  const handleConfirmStatusChange = async (catatan: string, notifyCitizen: boolean) => {
    if (!selectedTicket) return;
    const ok = await updateStatus(
      selectedTicket.id,
      statusModalConfig.targetStatus,
      catatan || undefined,
      notifyCitizen
    );

    if (ok) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: statusModalConfig.targetStatus,
              catatanPetugas: catatan || prev.catatanPetugas,
            }
          : null
      );
      setStatusModalConfig({ isOpen: false, targetStatus: 'DIPROSES' });
    }
  };

  const handleCreateComplaintSubmit = async (data: Partial<ComplaintTicket>): Promise<boolean> => {
    const res = await createComplaint(data);
    if (res.success && res.data) {
      setSelectedTicket(res.data);
      return true;
    }
    return false;
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.prioritas || filters.bidang || filters.search || searchInput
  );

  return (
    <div className="flex flex-col gap-5 pb-12 w-full max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Pusat Pengaduan & Laporan Warga
            </h1>
            <p className="text-xs text-slate-400">
              Daftar tiket pengaduan otomatis dari WA BOT PURI & input manual operator Dinas PUPR Garut
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Update: {lastUpdated.toLocaleTimeString('id-ID')}
          </span>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs text-slate-300 font-medium transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Catat Pengaduan Baru
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <ComplaintStatsCards stats={stats} />

      {/* Filters, Search & Export */}
      <ComplaintFilters
        filters={filters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onStatusChange={(status) => setFilters({ ...filters, status })}
        onPrioritasChange={(prioritas) => setFilters({ ...filters, prioritas })}
        onBidangChange={(bidang) => setFilters({ ...filters, bidang })}
        onExportCsv={handleExportCsv}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Split Grid: Table List (2 Cols) & Detail Panel (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ComplaintTableList
            complaints={complaints}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-1">
          <ComplaintDetailPanel
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onRequestStatusChange={handleRequestStatusChange}
          />
        </div>
      </div>

      {/* Modal Catat Pengaduan Baru */}
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        isSubmitting={isUpdating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateComplaintSubmit}
      />

      {/* Modal Perbarui Status & Kirim Notifikasi WA */}
      <UpdateStatusModal
        isOpen={statusModalConfig.isOpen}
        ticket={selectedTicket}
        targetStatus={statusModalConfig.targetStatus}
        isUpdating={isUpdating}
        onClose={() => setStatusModalConfig({ isOpen: false, targetStatus: 'DIPROSES' })}
        onSubmit={handleConfirmStatusChange}
      />
    </div>
  );
}
