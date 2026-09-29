'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Phone, Save, RefreshCw, Send, CheckCircle2, 
  AlertTriangle, ShieldAlert, Sparkles, MessageSquare, 
  ToggleLeft, ToggleRight, Clock, User, Check, Copy, 
  ChevronDown, ChevronUp, Play, Layers, ExternalLink, HelpCircle
} from 'lucide-react';
import { WhatsAppService } from '@/services/whatsappService';
import type { BidangPUPR } from '@/domain/aiRouting';
import type { 
  BidangWhatsAppContact, 
  BidangForwardingSettings, 
  ForwardHistoryItem,
  ForwardDispatchResult
} from '@/domain/whatsappIntegration';

const SECTORS_META: {
  id: BidangPUPR;
  title: string;
  badge: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  desc: string;
}[] = [
  {
    id: 'BINA_MARGA',
    title: 'Bidang Bina Marga',
    badge: '🛣️ Jalan & Jembatan',
    colorBorder: 'border-amber-500/40',
    colorBg: 'bg-amber-950/20',
    colorText: 'text-amber-300',
    desc: 'Pemeliharaan jalan kabupaten, jembatan, dan Tim Reaksi Cepat (TRC) penanganan darurat.'
  },
  {
    id: 'SDA',
    title: 'Bidang Sumber Daya Air (SDA)',
    badge: '💧 Irigasi & Banjir',
    colorBorder: 'border-blue-500/40',
    colorBg: 'bg-blue-950/20',
    colorText: 'text-blue-300',
    desc: 'Pengelolaan jaringan irigasi, drainase primer/sekunder, dan satgas penanggulangan banjir.'
  },
  {
    id: 'BANGUNAN_GEDUNG',
    title: 'Bidang Bangunan Gedung',
    badge: '🏢 PBG, SLF & BGN',
    colorBorder: 'border-emerald-500/40',
    colorBg: 'bg-emerald-950/20',
    colorText: 'text-emerald-300',
    desc: 'Pelayanan persetujuan bangunan gedung (PBG), SLF, SIMBG, serta verifikasi kerusakan sekolah/BGN.'
  },
  {
    id: 'PENATAAN_RUANG',
    title: 'Bidang Penataan Ruang',
    badge: '🗺️ KRK & PKKPR',
    colorBorder: 'border-purple-500/40',
    colorBg: 'bg-purple-950/20',
    colorText: 'text-purple-300',
    desc: 'Pelayanan Informasi Tata Ruang (Pelipur), kesesuaian ruang KRK, PKKPR, dan siteplan.'
  },
  {
    id: 'AMPL',
    title: 'Bidang Air Minum & Penyehatan Lingkungan (AMPL)',
    badge: '🚰 SPAM & Sanitasi',
    colorBorder: 'border-cyan-500/40',
    colorBg: 'bg-cyan-950/20',
    colorText: 'text-cyan-300',
    desc: 'Pengelolaan SPAM perdesaan/perkotaan, tangki septik komunal, dan sarana sanitasi warga.'
  },
  {
    id: 'JASA_KONSTRUKSI',
    title: 'Bidang Jasa Konstruksi (Jakon)',
    badge: '🏗️ Pembinaan BUJK',
    colorBorder: 'border-indigo-500/40',
    colorBg: 'bg-indigo-950/20',
    colorText: 'text-indigo-300',
    desc: 'Pelatihan sertifikasi tenaga kerja konstruksi dan pembinaan badan usaha jasa konstruksi (BUJK).'
  },
  {
    id: 'SEKRETARIAT',
    title: 'Sekretariat / Subbagian Umum & Kepegawaian',
    badge: '📋 Persuratan & PPID',
    colorBorder: 'border-slate-500/40',
    colorBg: 'bg-slate-900/40',
    colorText: 'text-slate-300',
    desc: 'Pengelolaan surat masuk, koordinasi pimpinan, loket informasi umum, dan pelayanan PPID.'
  }
];

export function BidangForwardingTab() {
  const [settings, setSettings] = useState<BidangForwardingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template Editing View
  const [activeSubView, setActiveSubView] = useState<'contacts' | 'templates' | 'simulator' | 'history'>('contacts');

  // Test Simulator State
  const [simBidang, setSimBidang] = useState<BidangPUPR>('BINA_MARGA');
  const [simType, setSimType] = useState<'PENGADUAN' | 'PERMOHONAN'>('PENGADUAN');
  const [simTicket, setSimTicket] = useState('TKT-2026-TEST-01');
  const [simPelapor, setSimPelapor] = useState('Budi Santoso');
  const [simPhone, setSimPhone] = useState('081234567890');
  const [simLokasi, setSimLokasi] = useState('Jl. Cimanuk, Tarogong Kidul');
  const [simDeskripsi, setSimDeskripsi] = useState('Jalan berlubang cukup dalam di dekat jembatan, membahayakan pengendara roda dua.');
  const [simPrioritas, setSimPrioritas] = useState('TINGGI');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<ForwardDispatchResult | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await WhatsAppService.getBidangContacts();
      if (res && res.data) {
        setSettings(res.data);
      } else {
        setErrorMessage(res.error || 'Gagal memuat pengaturan nomor bidang');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan jaringan';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const res = await WhatsAppService.saveBidangContacts(settings, 'Admin Command Center');
      if (res && res.data) {
        setSettings(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan saat menyimpan';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Update a field for a specific bidang
  const updateContactField = (bidang: BidangPUPR, field: keyof BidangWhatsAppContact, value: unknown) => {
    if (!settings) return;
    setSettings({
      ...settings,
      contacts: {
        ...settings.contacts,
        [bidang]: {
          ...settings.contacts[bidang],
          [field]: value
        }
      }
    });
  };

  // Execute quick test ping to a bidang
  const handleQuickTestPing = async (bidangKey: BidangPUPR) => {
    const contact = settings?.contacts[bidangKey];
    if (!contact?.nomorWa) {
      alert('Nomor WhatsApp belum diisi.');
      return;
    }
    const confirmSend = window.confirm(`Kirim pesan uji coba ke nomor WA ${contact.namaBidang} (+${contact.nomorWa})?`);
    if (!confirmSend) return;

    try {
      const res = await WhatsAppService.forwardToBidang({
        type: 'PENGADUAN',
        bidang: bidangKey,
        targetNomorWa: contact.nomorWa,
        ticketNumber: `TEST-PING-${Date.now().toString().slice(-4)}`,
        pelaporName: 'Command Center Testing Engine',
        pelaporPhone: '08123456789',
        lokasi: 'Garut Kota',
        kecamatan: 'Garut Kota',
        judul: 'Uji Coba Integrasi Forwarding WhatsApp Bidang',
        deskripsi: 'Ini adalah pesan uji coba verifikasi sambungan dari WhatsApp Command Center Dinas PUPR Garut.',
        prioritas: 'NORMAL',
        langkahPenanganan: 'Pesan uji coba otomatis. Tidak memerlukan tindakan fisik di lapangan.',
        catatanDisposisi: 'Testing konektivitas nomor WA bidang.'
      });

      if (res.success) {
        alert(`✅ Pesan uji coba berhasil dikirim ke ${contact.namaBidang} (+${res.targetWa})!`);
        loadSettings();
      } else {
        alert(`❌ Gagal mengirim: ${res.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Koneksi error';
      alert(`❌ Terjadi error: ${msg}`);
    }
  };

  // Run full simulator test
  const handleRunSimulator = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await WhatsAppService.forwardToBidang({
        type: simType,
        bidang: simBidang,
        ticketNumber: simTicket,
        pelaporName: simPelapor,
        pelaporPhone: simPhone,
        lokasi: simLokasi,
        kecamatan: 'Garut Kota',
        layanan: simType === 'PERMOHONAN' ? 'Konsultasi Teknis' : 'Infrastruktur',
        judul: `Laporan Simulasi: ${simDeskripsi.slice(0, 50)}`,
        deskripsi: simDeskripsi,
        prioritas: simPrioritas,
        langkahPenanganan: 'Pemeriksaan lapangan dan koordinasi tim teknis bidang.',
        catatanDisposisi: 'Disposisi melalui Simulator Command Center.',
        sendCitizenConfirmation: settings?.notifyCitizenOnForward ?? true
      });
      setSimResult(res);
      if (res.success) {
        loadSettings();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error simulasi';
      setSimResult({
        success: false,
        bidang: simBidang,
        targetWa: '',
        targetName: '',
        formattedMessage: '',
        dispatchedAt: new Date().toISOString(),
        error: msg
      });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <span className="text-xs">Memuat konfigurasi nomor WhatsApp bidang...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
        Gagal memuat pengaturan. Pastikan server backend aktif.
      </div>
    );
  }

  const totalForwardedAll = Object.values(settings.contacts).reduce(
    (acc, cur) => acc + (cur.totalForwardedCount || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Global Settings */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-emerald-950/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Pengaturan Nomor WhatsApp & Disposisi 7 Bidang PUPR Garut
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Atur nomor WhatsApp resmi masing-masing bidang untuk menerima disposisi otomatis pengaduan warga, permohonan layanan publik (PBG, KRK, SPAM), serta notifikasi darurat URC/TRC secara terintegrasi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </div>

        {/* Global Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10">
          {/* Toggle 1: Global Enable */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Forward Otomatis</span>
              <span className="text-[10px] text-slate-400">Aktifkan integrasi forward ke WA bidang</span>
            </div>
            <button
              onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
              className="text-2xl transition-colors cursor-pointer"
            >
              {settings.isEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500" />
              )}
            </button>
          </div>

          {/* Toggle 2: Citizen Confirmation */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Konfirmasi ke Warga</span>
              <span className="text-[10px] text-slate-400">Kirim WA ke pelapor saat tiket diteruskan</span>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifyCitizenOnForward: !settings.notifyCitizenOnForward })}
              className="text-2xl transition-colors cursor-pointer"
            >
              {settings.notifyCitizenOnForward ? (
                <ToggleRight className="w-8 h-8 text-blue-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500" />
              )}
            </button>
          </div>

          {/* Stat 3: Total Dispatches */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Total Disposisi Berjalan</span>
              <span className="text-[10px] text-slate-400">Total forward terkirim ke 7 bidang</span>
            </div>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {totalForwardedAll}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Seluruh nomor kontak dan preferensi forwarding bidang berhasil disimpan secara persisten!</span>
          </motion.div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveSubView('contacts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'contacts'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Nomor Kontak 7 Bidang</span>
        </button>

        <button
          onClick={() => setActiveSubView('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'templates'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Format Template Pesan</span>
        </button>

        <button
          onClick={() => setActiveSubView('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'simulator'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Simulator Uji Coba Forward</span>
        </button>

        <button
          onClick={() => setActiveSubView('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Disposisi ({settings.history?.length || 0})</span>
        </button>
      </div>

      {/* VIEW 1: CONTACTS CARDS */}
      {activeSubView === 'contacts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SECTORS_META.map((sec) => {
            const contact: BidangWhatsAppContact = settings.contacts[sec.id] || {
              bidang: sec.id,
              namaBidang: sec.title,
              nomorWa: '',
              namaPejabat: '',
              jabatan: '',
              isActive: true,
              autoForwardPengaduan: true,
              autoForwardPermohonan: true,
              forwardEmergencyOnly: false,
              totalForwardedCount: 0
            };

            return (
              <div
                key={sec.id}
                className={`glass-card p-5 rounded-2xl border ${sec.colorBorder} ${sec.colorBg} flex flex-col justify-between space-y-4 shadow-card`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${sec.colorText}`}>
                        {sec.badge}
                      </span>
                      {contact.isActive ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded-full font-bold">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{sec.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sec.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateContactField(sec.id, 'isActive', !contact.isActive)}
                    className="cursor-pointer shrink-0"
                    title={contact.isActive ? 'Nonaktifkan Bidang Ini' : 'Aktifkan Bidang Ini'}
                  >
                    {contact.isActive ? (
                      <ToggleRight className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-500" />
                    )}
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nomor WhatsApp Resmi Bidang <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                        +
                      </div>
                      <input
                        type="text"
                        value={contact.nomorWa}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          updateContactField(sec.id, 'nomorWa', clean);
                        }}
                        placeholder="Contoh: 6281223456701"
                        className="w-full pl-7 pr-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      Gunakan format internasional tanpa spasi/tanda hubung (diawali 628...).
                    </span>
                  </div>

                  {/* PIC / Nama Pejabat & Jabatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Nama PIC / Pejabat
                      </label>
                      <input
                        type="text"
                        value={contact.namaPejabat}
                        onChange={(e) => updateContactField(sec.id, 'namaPejabat', e.target.value)}
                        placeholder="Nama Koordinator/Petugas"
                        className="w-full px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Jabatan / Peran
                      </label>
                      <input
                        type="text"
                        value={contact.jabatan}
                        onChange={(e) => updateContactField(sec.id, 'jabatan', e.target.value)}
                        placeholder="Jabatan di Bidang"
                        className="w-full px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email Opsional */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Dinas Bidang (Opsional)
                    </label>
                    <input
                      type="email"
                      value={contact.email || ''}
                      onChange={(e) => updateContactField(sec.id, 'email', e.target.value)}
                      placeholder="contoh@garutkab.go.id"
                      className="w-full px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Forwarding Rule Switches */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Aturan Disposisi Otomatis
                    </span>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Auto-Forward Pengaduan Warga</span>
                      <input
                        type="checkbox"
                        checked={contact.autoForwardPengaduan}
                        onChange={(e) => updateContactField(sec.id, 'autoForwardPengaduan', e.target.checked)}
                        className="rounded bg-slate-800 border-white/20 text-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Auto-Forward Permohonan Layanan</span>
                      <input
                        type="checkbox"
                        checked={contact.autoForwardPermohonan}
                        onChange={(e) => updateContactField(sec.id, 'autoForwardPermohonan', e.target.checked)}
                        className="rounded bg-slate-800 border-white/20 text-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                      <span className="text-[11px] text-rose-300">Hanya Forward Tiket KRITIS / Darurat</span>
                      <input
                        type="checkbox"
                        checked={contact.forwardEmergencyOnly}
                        onChange={(e) => updateContactField(sec.id, 'forwardEmergencyOnly', e.target.checked)}
                        className="rounded bg-slate-800 border-white/20 text-rose-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px]">
                  <div className="text-slate-400">
                    <span>Total Disposisi: </span>
                    <strong className="text-white font-mono">{contact.totalForwardedCount || 0}</strong>
                    {contact.lastForwardedAt && (
                      <span className="text-[10px] text-slate-500 block">
                        Terakhir: {new Date(contact.lastForwardedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickTestPing(sec.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Ping WA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TEMPLATE SETTINGS */}
      {activeSubView === 'templates' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Template Pesan Disposisi Pengaduan Warga
            </h3>
            <p className="text-xs text-slate-400">
              Format ini digunakan saat meneruskan laporan keluhan / kerusakan infrastruktur ke nomor WhatsApp tim bidang.
            </p>
            <textarea
              rows={8}
              value={settings.defaultTemplatePengaduan}
              onChange={(e) => setSettings({ ...settings, defaultTemplatePengaduan: e.target.value })}
              className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Placeholder Variabel:</span>
              {['{{namaBidang}}', '{{nomorTiket}}', '{{prioritas}}', '{{pelapor}}', '{{kontak}}', '{{lokasi}}', '{{kecamatan}}', '{{kategori}}', '{{deskripsi}}', '{{langkahPenanganan}}', '{{catatanDisposisi}}'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Template Pesan Disposisi Permohonan Layanan & Konsultasi
            </h3>
            <p className="text-xs text-slate-400">
              Format ini digunakan saat meneruskan pertanyaan syarat perizinan, status permohonan SIMBG/PBG, KRK, atau konsultasi teknis.
            </p>
            <textarea
              rows={8}
              value={settings.defaultTemplatePermohonan}
              onChange={(e) => setSettings({ ...settings, defaultTemplatePermohonan: e.target.value })}
              className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Placeholder Variabel:</span>
              {['{{namaBidang}}', '{{nomorTiket}}', '{{layanan}}', '{{pelapor}}', '{{kontak}}', '{{lokasi}}', '{{deskripsi}}', '{{catatanDisposisi}}'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SIMULATOR */}
      {activeSubView === 'simulator' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Simulator Forwarding ke WhatsApp Bidang
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Uji coba pengiriman format disposisi secara nyata ke nomor WA bidang tanpa mengubah tiket asli di database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Bidang PUPR
              </label>
              <select
                value={simBidang}
                onChange={(e) => setSimBidang(e.target.value as BidangPUPR)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                {SECTORS_META.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({settings.contacts[s.id]?.nomorWa ? `+${settings.contacts[s.id]?.nomorWa}` : 'Belum diatur'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tipe Disposisi
              </label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as 'PENGADUAN' | 'PERMOHONAN')}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PENGADUAN">Pengaduan Masyarakat (Kerusakan/Banjir)</option>
                <option value="PERMOHONAN">Permohonan Layanan / Konsultasi</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Nama Pelapor
              </label>
              <input
                type="text"
                value={simPelapor}
                onChange={(e) => setSimPelapor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Nomor Kontak Pelapor
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Deskripsi Masalah / Permohonan
              </label>
              <textarea
                rows={3}
                value={simDeskripsi}
                onChange={(e) => setSimDeskripsi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Target Nomor: <strong className="text-emerald-400 font-mono">+{settings.contacts[simBidang]?.nomorWa || '-'}</strong> ({settings.contacts[simBidang]?.namaPejabat})
            </span>

            <button
              onClick={handleRunSimulator}
              disabled={isSimulating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isSimulating ? 'Mengirim Simulasi...' : 'Jalankan Pengiriman Uji Coba'}</span>
            </button>
          </div>

          {/* Result Box */}
          {simResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                simResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              } text-xs space-y-2`}
            >
              <div className="flex items-center gap-2 font-bold">
                {simResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Uji Coba Berhasil Terkirim ke WhatsApp Bidang!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Uji Coba Gagal Dikirim</span>
                  </>
                )}
              </div>
              <p className="text-[11px]">
                {simResult.success
                  ? `Pesan telah diterima oleh gateway Baileys untuk nomor +${simResult.targetWa}.`
                  : simResult.error}
              </p>
              {simResult.formattedMessage && (
                <div className="p-3 bg-black/60 rounded-lg font-mono text-[10px] whitespace-pre-wrap text-slate-300 max-h-40 overflow-y-auto">
                  {simResult.formattedMessage}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* VIEW 4: HISTORY TABLE */}
      {activeSubView === 'history' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Riwayat Disposisi Terakhir ke Nomor Bidang
            </h3>
            <span className="text-xs text-slate-400">
              Total {settings.history?.length || 0} catatan disposisi
            </span>
          </div>

          {(!settings.history || settings.history.length === 0) ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Belum ada riwayat disposisi yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-bold border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tipe / Tiket</th>
                    <th className="py-3 px-4">Bidang Tujuan</th>
                    <th className="py-3 px-4">Nomor WA & Penerima</th>
                    <th className="py-3 px-4">Pelapor</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {settings.history.map((hist: ForwardHistoryItem) => (
                    <tr key={hist.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap font-mono">
                        {new Date(hist.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-blue-400 font-bold">{hist.ticketNumber || '-'}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{hist.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10">
                          {hist.bidang}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>+{hist.targetNomorWa}</div>
                        <div className="text-[10px] text-slate-400">{hist.targetName}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {hist.pelaporName}
                      </td>
                      <td className="py-3 px-4">
                        {hist.status === 'SUCCESS' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Terkirim
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Gagal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
