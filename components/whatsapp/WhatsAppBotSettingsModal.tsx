'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Sparkles, Save, CheckCircle, ToggleLeft, ToggleRight, RefreshCw, ArrowLeft, Settings2, ListTree, Plus, Trash2, Edit3, Key, Hash, FileText } from 'lucide-react';
import { WhatsAppService } from '@/services/whatsappService';

interface WhatsAppBotSettingsViewProps {
  onBack?: () => void;
}

export function WhatsAppBotSettingsModal({ onBack }: WhatsAppBotSettingsViewProps) {
  const DEFAULT_COMPREHENSIVE_PROMPT = `[IDENTITAS & PERAN SISTEM]
Anda adalah "PURI" (Pelayanan Umum & Informasi PUPR Garut), Asisten Virtual AI Resmi Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut. Tugas Anda adalah memberikan informasi pelayanan publik yang sopan, cepat, akurat, solutif, dan mudah dipahami oleh warga masyarakat Kabupaten Garut.

[STANDAR NADA BICARA & FORMAT BALASAN]
1. Awali dengan salam hangat dan sebut nama warga (jika ada).
2. Gunakan Bahasa Indonesia yang formal namun ramah, informatif, dan terstruktur.
3. Gunakan poin-poin (bullet points) agar informasi syarat/alur mudah dibaca di layar HP.
4. Akhiri dengan penawaran bantuan lanjutan dan ucapan terima kasih.

[BASIS PENGETAHUAN UTAMA (KNOWLEDGE BASE)]

1. PERSETUJUAN BANGUNAN GEDUNG (PBG) & SLF (SERTIFIKAT LAIK FUNGSI):
- Pengertian: PBG adalah perizinan resmi pengganti IMB untuk membangun baru, mengubah, memperluas, atau memelihara bangunan sesuai standar teknis.
- Portal Pendaftaran: Seluruh permohonan PBG & SLF dilakukan secara online mandiri melalui portal resmi SIMBG Kementerian PUPR di: https://simbg.pu.go.id
- Dokumen Persyaratan Umum:
  * KTP / Identitas Pemohon & NPWP.
  * Bukti Kepemilikan Tanah (Sertifikat Hak Milik / HGB / Akta).
  * Dokumen Rencana Teknis (Gambar Arsitektur, Struktur, ME) buatan Perencana Berlisensi.
  * Dokumen KRK / PKKPR (Kesesuaian Tata Ruang).
- Masa Berlaku SLF: 20 tahun untuk Bangunan Rumah Tinggal, 5 tahun untuk Bangunan Gedung Lainnya.

2. KRK / PKKPR (KESESUAIAN TATA RUANG):
- Pengertian: Keterangan Rencana Kabupaten untuk memastikan lokasi bangunan sesuai Perda Rencana Detail Tata Ruang (RDTR) Kabupaten Garut.
- Lokasi Konsultasi: Bidang Penataan Ruang Dinas PUPR Garut / Mal Pelayanan Publik (MPP) Garut.

3. PENGADUAN INFRASTRUKTUR (JALAN, JEMBATAN, DRAINASE, & IRIGASI):
- Apabila warga melaporkan jalan rusak, jembatan terputus, atau drainase tumpat:
  * Mintalah lokasi rinci: Nama Jalan, RT/RW, Desa/Kelurahan, dan Kecamatan.
  * Mintalah patokan lokasi dan foto/video kejadian jika memungkinkan.
  * Informasikan bahwa laporan akan diteruskan ke Tim Unit Reaksi Cepat (URC) Bidang Bina Marga / SDA PUPR Garut.

4. ALAMAT & JAM OPERASIONAL:
- Alamat Kantor: Jl. Prof. KH. Cecep Syarifudin No. 117, Sukagalih, Tarogong Kidul, Kabupaten Garut.
- Jam Operasional Tatap Muka: Senin - Jumat, Pukul 08:00 - 15:30 WIB.
- Website Resmi: https://pupr.garutkab.go.id

[ATURAN PENTING & BATASAN AI (GUARDRAILS)]
1. DILARANG memberikan janji kepastian kelulusan izin. Keputusan kelayakan mutlak pada verifikasi dokumen oleh Tim Ahli Bangunan Gedung (TABG) PUPR Garut.
2. DILARANG meminta/menerima transfer ke rekening pribadi staf. Seluruh Retribusi Resmi PBG dibayar via Kode Billing Kas Daerah resmi.
3. Apabila pertanyaan memerlukan pemeriksaan berkas fisik mendalam, arahkan warga berkonsultasi langsung ke Kantor Dinas PUPR Garut pada jam kerja.`;

  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'menu' | 'keyword' | 'spreadsheet'>('ai');
  const [isAiActive, setIsAiActive] = useState(true);
  const [isMenuActive, setIsMenuActive] = useState(true);
  const [isKeywordActive, setIsKeywordActive] = useState(true);
  const [model, setModel] = useState('gemini-2.0-flash');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_COMPREHENSIVE_PROMPT);
  const [minTextLength, setMinTextLength] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Menu Flows State
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Keyword Reply State
  const [keywordItems, setKeywordItems] = useState<any[]>([]);
  const [editingKeyword, setEditingKeyword] = useState<any | null>(null);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);

  // Spreadsheet Data State
  const [spreadsheetItems, setSpreadsheetItems] = useState<any[]>([]);
  const [editingSpreadsheet, setEditingSpreadsheet] = useState<any | null>(null);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [isTestingSpreadsheet, setIsTestingSpreadsheet] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadMenuFlows();
    loadKeywords();
    loadSpreadsheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const data = await WhatsAppService.getBotSettings();
      if (data) {
        setIsAiActive(data.is_active ?? true);
        setIsMenuActive(data.is_menu_active ?? true);
        setIsKeywordActive(data.is_keyword_active ?? true);
        setModel(data.model || 'gemini-2.0-flash');
        setSystemPrompt(data.system_prompt || DEFAULT_COMPREHENSIVE_PROMPT);
        setMinTextLength(data.min_text_length || 2);
      }
    } catch (err) {
      console.warn('Failed to fetch bot settings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMenuFlows() {
    try {
      const data = await WhatsAppService.getBotMenuFlows();
      setMenuItems(data || []);
    } catch (err) {
      console.warn('Failed to fetch menu flows:', err);
    }
  }

  async function loadKeywords() {
    try {
      const data = await WhatsAppService.getBotKeywords();
      setKeywordItems(data || []);
    } catch (err) {
      console.warn('Failed to fetch keywords:', err);
    }
  }

  async function loadSpreadsheets() {
    try {
      const data = await WhatsAppService.getSpreadsheets();
      setSpreadsheetItems(data || []);
    } catch (err) {
      console.warn('Failed to fetch spreadsheets:', err);
    }
  }

  const isAnyActive = isAiActive || isMenuActive || isKeywordActive;

  const handleToggleFeatureStatus = async (feature: 'ai' | 'menu' | 'keyword') => {
    const nextAi = feature === 'ai' ? !isAiActive : isAiActive;
    const nextMenu = feature === 'menu' ? !isMenuActive : isMenuActive;
    const nextKw = feature === 'keyword' ? !isKeywordActive : isKeywordActive;

    if (feature === 'ai') setIsAiActive(nextAi);
    if (feature === 'menu') setIsMenuActive(nextMenu);
    if (feature === 'keyword') setIsKeywordActive(nextKw);

    try {
      await WhatsAppService.updateBotSettings({
        id: 'default',
        is_active: nextAi,
        is_menu_active: nextMenu,
        is_keyword_active: nextKw,
        model,
        system_prompt: systemPrompt,
        min_text_length: minTextLength,
        updated_at: new Date().toISOString()
      });
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (err: any) {
      alert('Gagal mengubah status bot: ' + err.message);
    }
  };

  const handleToggleAllFeatures = async () => {
    const nextStatus = !isAnyActive;
    setIsAiActive(nextStatus);
    setIsMenuActive(nextStatus);
    setIsKeywordActive(nextStatus);

    try {
      await WhatsAppService.updateBotSettings({
        id: 'default',
        is_active: nextStatus,
        is_menu_active: nextStatus,
        is_keyword_active: nextStatus,
        model,
        system_prompt: systemPrompt,
        min_text_length: minTextLength,
        updated_at: new Date().toISOString()
      });
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (err: any) {
      alert('Gagal mengubah status bot: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        id: 'default',
        is_active: isAiActive,
        is_menu_active: isMenuActive,
        is_keyword_active: isKeywordActive,
        model,
        system_prompt: systemPrompt,
        min_text_length: minTextLength,
        updated_at: new Date().toISOString()
      };

      await WhatsAppService.updateBotSettings(payload);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3500);
    } catch (err: any) {
      console.error('Error saving bot settings:', err);
      alert('Gagal menyimpan pengaturan bot: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSaving(false);
    }
  };

  // Menu Handlers
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.menu_key || !editingItem.reply_text) {
      alert('Kunci Menu dan Teks Balasan wajib diisi!');
      return;
    }
    try {
      setIsSaving(true);
      await WhatsAppService.saveBotMenuFlowItem(editingItem);
      setIsEditingModalOpen(false);
      setEditingItem(null);
      await loadMenuFlows();
    } catch (err: any) {
      alert('Gagal menyimpan menu item: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenuItem = async (item: any) => {
    if (!confirm(`Hapus opsi menu "${item.title || item.menu_key}"?`)) return;
    try {
      await WhatsAppService.deleteBotMenuFlowItem(item);
      await loadMenuFlows();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleSeedDefaultMenu = async () => {
    if (!confirm('Muat template menu interaktif default PUPR Garut?')) return;
    try {
      setIsLoading(true);
      await WhatsAppService.seedDefaultBotMenuFlows();
      await loadMenuFlows();
    } catch (err: any) {
      alert('Gagal memuat template: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyword Handlers
  const handleSaveKeywordItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword) return;
    try {
      setIsSaving(true);
      await WhatsAppService.saveBotKeywordItem(editingKeyword);
      await loadKeywords();
      setIsKeywordModalOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan kata kunci.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKeywordItem = async (item: any) => {
    if (!confirm('Hapus kata kunci ini?')) return;
    try {
      await WhatsAppService.deleteBotKeywordItem(item);
      await loadKeywords();
    } catch (err: any) {
      alert('Gagal menghapus kata kunci.');
    }
  };

  const handleSaveSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpreadsheet) return;
    try {
      setIsSaving(true);
      await WhatsAppService.saveSpreadsheet(editingSpreadsheet);
      await loadSpreadsheets();
      setIsSpreadsheetModalOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan spreadsheet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSpreadsheet = async (item: any) => {
    if (!confirm('Hapus konfigurasi spreadsheet ini?')) return;
    try {
      await WhatsAppService.deleteSpreadsheet(item.id);
      await loadSpreadsheets();
    } catch (err: any) {
      alert('Gagal menghapus spreadsheet.');
    }
  };

  const handleTestSpreadsheet = async () => {
    if (!editingSpreadsheet || !editingSpreadsheet.spreadsheet_id) return;
    try {
      setIsTestingSpreadsheet(true);
      setTestResult(null);
      const res = await WhatsAppService.testSpreadsheet(editingSpreadsheet.spreadsheet_id, editingSpreadsheet.sheet_name || 'Sheet1');
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingSpreadsheet(false);
    }
  };

  const handleSeedDefaultKeywords = async () => {
    if (!confirm('Muat template kata kunci balasan default PUPR Garut?')) return;
    try {
      setIsLoading(true);
      await WhatsAppService.seedDefaultBotKeywords();
      await loadKeywords();
    } catch (err: any) {
      alert('Gagal memuat template: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full glass-card border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Kembali ke Ruang Chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-1.5 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            <img src="/favicon.ico" alt="PURI" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              Pengaturan Bot PURI WhatsApp (Integrated AI Center)
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">Atur Balasan PURI AI Center (Multi-Model 6-Tier), Menu Interaktif (Sub-Menu), dan Keyword Reply dalam Bahasa Indonesia.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Quick Toggle Status Button */}
          <button
            type="button"
            onClick={handleToggleAllFeatures}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border shadow-md ${
              isAnyActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
            }`}
            title="Klik untuk mengaktifkan/mematikan seluruh modul Bot PURI sekaligus"
          >
            {isAnyActive ? (
              <ToggleRight className="w-6 h-6 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-red-400" />
            )}
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-normal leading-none">GLOBAL STATUS BOT PURI</div>
              <div className="text-xs font-extrabold tracking-wide">{isAnyActive ? 'SISTEM AKTIF (ON)' : 'SISTEM MATI (OFF)'}</div>
            </div>
          </button>

          {activeSubTab === 'ai' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan AI'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'ai'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <img src="/favicon.ico" alt="PURI" className="w-4 h-4 object-contain" />
          <span>Bot AI Center (Prompt & Model)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'menu'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <ListTree className="w-4 h-4" />
          <span>Menu Interaktif & Sub-Menu</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-mono border border-blue-400/30">
            {menuItems.length} Opsi
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('keyword')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'keyword'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keyword Reply (Kata Kunci)</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-mono border border-purple-400/30">
            {keywordItems.length} Aturan
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('spreadsheet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'spreadsheet'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Spreadsheet Data</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-mono border border-amber-400/30">
            {spreadsheetItems.length} Layanan
          </span>
        </button>
      </div>

      {showSuccessAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Pengaturan berhasil disimpan ke database Supabase dan langsung aktif!</span>
        </motion.div>
      )}

      {/* TAB 1: BOT AI GEMINI */}
      {activeSubTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="space-y-5 lg:col-span-1">
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-emerald-400" />
                  Status Auto-Reply AI
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleFeatureStatus('ai')}
                  className="cursor-pointer text-slate-300 hover:text-white transition-colors"
                >
                  {isAiActive ? (
                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-500" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isAiActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isAiActive ? 'STATUS: BOT AI GEMINI AKTIF' : 'STATUS: BOT AI GEMINI MATI'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Jika diaktifkan, pesan warga yang tidak cocok dengan menu angka/kata kunci akan otomatis dijawab oleh Gemini AI.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 block">
                  Pilih Engine Model AI (Terintegrasi PURI AI Center)
                </label>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  AI Orchestrator Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pilih mesin pemroses utama Bot AI. Opsi <strong>PURI 6-Tier AI Orchestrator</strong> secara otomatis mendistribusikan beban kerja ke model terbaik.
              </p>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="auto">🚀 PURI 6-Tier AI Orchestrator (Auto-Route Smart Consensus - Rekomendasi Utama)</option>
                <option value="gemini-2.0-flash">🔥 Google Gemini 2.0 Flash (Vision & 128k Context - Unggulan PURI)</option>
                <option value="gemini-2.0-flash-lite-preview-02-05">⚡ Google Gemini 2.0 Flash-Lite (Hemat Quota & Cepat)</option>
                <option value="gpt-4o-mini">🤖 OpenAI ChatGPT-4o Mini (CS & FAQ Publik 24/7)</option>
                <option value="claude-3-5-sonnet-20241022">🧠 Anthropic Claude 3.5 Sonnet (Analisis Regulasi & PBG)</option>
                <option value="moonshot-v1-8k">🌙 Kimi AI Global Moonshot (BIM / IFC / GIS Spasial)</option>
                <option value="qwen2.5:7b">🖥️ Local AI Ollama Qwen 2.5 (Offline On-Premise Tanpa Kuota)</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Ambang Batas Minimal Pesan
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {minTextLength} Karakter
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={minTextLength}
                onChange={(e) => setMinTextLength(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-2 p-5 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Instruksi Peran System Prompt & Basis Pengetahuan (Knowledge Base)
                </label>
                <button
                  type="button"
                  onClick={() => setSystemPrompt(DEFAULT_COMPREHENSIVE_PROMPT)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Prompt Komprehensif
                </button>
              </div>

              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={12}
                placeholder="Tuliskan instruksi sistem di sini..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-y font-mono leading-relaxed shadow-inner"
              />
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Status Simpan: Autocommit ke Supabase PostgreSQL</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU INTERAKTIF */}
      {activeSubTab === 'menu' && (
        <div className="space-y-4 animate-fade-in">
          {/* Status Auto-Reply Card */}
          <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-400" />
                Status Auto-Reply Menu Interaktif
              </label>
              <button
                type="button"
                onClick={() => handleToggleFeatureStatus('menu')}
                className="cursor-pointer text-slate-300 hover:text-white transition-colors"
              >
                {isMenuActive ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isMenuActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isMenuActive ? 'STATUS: MENU INTERAKTIF AKTIF' : 'STATUS: MENU INTERAKTIF MATI'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Jika diaktifkan, pesan warga yang mengetik angka pemicu (contoh: 1, 2, 1.1, menu) akan otomatis dibalas dengan opsi alur sub-menu PURI.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-white/10 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListTree className="w-4 h-4 text-blue-400" />
                Alur Menu Pilihan & Sub-Menu WhatsApp (Interactive Tree Flow)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Saat warga mengetik angka pemicu (contoh: 1, 2, 1.1, menu), bot PURI akan membalas dengan opsi sub-menu terkait.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSeedDefaultMenu}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Muat Template Menu Default</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingItem({
                    menu_key: '',
                    title: '',
                    description: '',
                    reply_text: '',
                    is_active: true,
                    display_order: menuItems.length + 1
                  });
                  setIsEditingModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Opsi Menu</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id || item.menu_key}
                className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3 hover:border-blue-500/40 transition-colors flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-mono font-bold">
                      Ketik: &quot;{item.menu_key}&quot;
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.is_active ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.description || 'Tanpa deskripsi'}</p>

                  <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-line max-h-28 overflow-y-auto">
                    {item.reply_text}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDeleteMenuItem(item)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Opsi Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem({ ...item });
                      setIsEditingModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-blue-400" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KEYWORD REPLY */}
      {activeSubTab === 'keyword' && (
        <div className="space-y-4 animate-fade-in">
          {/* Status Auto-Reply Card */}
          <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-400" />
                Status Auto-Reply Kata Kunci (Keyword)
              </label>
              <button
                type="button"
                onClick={() => handleToggleFeatureStatus('keyword')}
                className="cursor-pointer text-slate-300 hover:text-white transition-colors"
              >
                {isKeywordActive ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isKeywordActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isKeywordActive ? 'STATUS: KEYWORD REPLY AKTIF' : 'STATUS: KEYWORD REPLY MATI'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Jika diaktifkan, pesan warga yang mengandung kata kunci spesifik (contoh: pbg, lokasi, jalan rusak) akan otomatis dibalas dengan pesan aturan PURI.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-white/10 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Keyword Reply (Aturan Balasan Otomatis Berdasarkan Kata Kunci)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Apabila pesan warga mengandung kata kunci spesifik (misal: &quot;pbg&quot;, &quot;lokasi&quot;, &quot;jalan rusak&quot;), bot PURI akan merespons langsung.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSeedDefaultKeywords}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Muat Template Kata Kunci Default</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingKeyword({
                    keyword: '',
                    match_type: 'CONTAINS',
                    reply_text: '',
                    is_active: true
                  });
                  setIsKeywordModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kata Kunci</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keywordItems.map((item) => (
              <div
                key={item.id || item.keyword}
                className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3 hover:border-purple-500/40 transition-colors flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                      <Hash className="w-3 h-3 text-purple-400" /> &quot;{item.keyword}&quot;
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-300 border border-white/10">
                        {item.match_type || 'CONTAINS'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {item.is_active ? 'AKTIF' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-line max-h-28 overflow-y-auto">
                    {item.reply_text}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDeleteKeywordItem(item)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Kata Kunci Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingKeyword({ ...item });
                      setIsKeywordModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-purple-400" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT MENU ITEM MODAL */}
      {isEditingModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-container bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                {editingItem.id ? 'Edit Opsi Menu Interaktif' : 'Tambah Opsi Menu Interaktif Baru'}
              </h3>
              <button onClick={() => setIsEditingModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Pemicu Kunci (menu_key)</label>
                  <input
                    type="text"
                    value={editingItem.menu_key || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, menu_key: e.target.value })}
                    placeholder="Contoh: 1, 1.1, menu, 2"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Judul Opsi</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Contoh: Informasi PBG"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Contoh: Syarat dan alur pendaftaran SIMBG"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teks Pesan Balasan WhatsApp (PURI)</label>
                <textarea
                  value={editingItem.reply_text || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, reply_text: e.target.value })}
                  rows={6}
                  placeholder="Tuliskan isi pesan balasan WhatsApp saat warga memilih opsi ini..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white font-mono leading-relaxed focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="itemActive"
                  checked={editingItem.is_active ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="itemActive" className="text-slate-300 font-semibold cursor-pointer">
                  Aktifkan Opsi Menu Ini
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsEditingModalOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5"><Save className="w-4 h-4" /> Simpan Opsi Menu</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT KEYWORD ITEM MODAL */}
      {isKeywordModalOpen && editingKeyword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-container bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                {editingKeyword.id ? 'Edit Aturan Kata Kunci' : 'Tambah Aturan Kata Kunci Baru'}
              </h3>
              <button onClick={() => setIsKeywordModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveKeywordItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Kata Kunci (Keyword)</label>
                  <input
                    type="text"
                    value={editingKeyword.keyword || ''}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, keyword: e.target.value })}
                    placeholder="Contoh: pbg, jalan rusak, lokasi"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Tipe Pencocokan</label>
                  <select
                    value={editingKeyword.match_type || 'CONTAINS'}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, match_type: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-purple-500"
                  >
                    <option value="CONTAINS">CONTAINS (Mengandung Kata)</option>
                    <option value="EXACT">EXACT (Persis Sama)</option>
                    <option value="STARTS_WITH">STARTS_WITH (Diawali Kata)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teks Pesan Balasan WhatsApp (PURI)</label>
                <textarea
                  value={editingKeyword.reply_text || ''}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, reply_text: e.target.value })}
                  rows={6}
                  placeholder="Tuliskan isi balasan otomatis saat kata kunci terdeteksi..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white font-mono leading-relaxed focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="kwActive"
                  checked={editingKeyword.is_active ?? true}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, is_active: e.target.checked })}
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="kwActive" className="text-slate-300 font-semibold cursor-pointer">
                  Aktifkan Aturan Kata Kunci Ini
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsKeywordModalOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5"><Save className="w-4 h-4" /> Simpan Kata Kunci</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* TAB 4: SPREADSHEET DATA */}
      {activeSubTab === 'spreadsheet' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-white/10 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Integrasi Data Google Spreadsheet Publik (CSV)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Berikan AI akses ke data permohonan eksternal (selain SIMBG/PBG/SLF) dari link CSV Publik Google Sheets.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSpreadsheet({
                    layanan_name: '',
                    bidang: 'SEKRETARIAT',
                    spreadsheet_id: '',
                    sheet_name: 'Sheet1',
                    description: '',
                    is_active: true,
                    cache_ttl_minutes: 15
                  });
                  setTestResult(null);
                  setIsSpreadsheetModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Layanan Spreadsheet</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spreadsheetItems.map((item, idx) => (
              <div key={item.id || idx} className="bg-slate-950/50 border border-white/10 hover:border-white/20 transition-all rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md h-full">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                       {item.layanan_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.is_active ? 'AKTIF' : 'OFF'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mt-2">
                    <span className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Bidang</span>
                    <span className="font-medium text-slate-300 bg-white/5 px-2 py-1 rounded">{item.bidang}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/5 break-all font-mono bg-black/20 p-2 rounded-lg">
                    ID: {item.spreadsheet_id}
                    <br />
                    Sheet: {item.sheet_name}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDeleteSpreadsheet(item)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Spreadsheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingSpreadsheet({ ...item });
                      setTestResult(null);
                      setIsSpreadsheetModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT SPREADSHEET ITEM MODAL */}
      {isSpreadsheetModalOpen && editingSpreadsheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-container bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                {editingSpreadsheet.id ? 'Edit Data Spreadsheet' : 'Tambah Data Spreadsheet Baru'}
              </h3>
              <button onClick={() => setIsSpreadsheetModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSpreadsheet} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nama Layanan (Contoh: Rekomendasi Tata Ruang)</label>
                  <input
                    type="text"
                    value={editingSpreadsheet.layanan_name || ''}
                    onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, layanan_name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Bidang PUPR</label>
                  <select
                    value={editingSpreadsheet.bidang || 'SEKRETARIAT'}
                    onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, bidang: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  >
                    <option value="SEKRETARIAT">Sekretariat</option>
                    <option value="PENATAAN_RUANG">Tata Ruang (PR)</option>
                    <option value="BANGUNAN_GEDUNG">Bangunan Gedung (PBG/SLF)</option>
                    <option value="BINA_MARGA">Bina Marga (Jalan/Jembatan)</option>
                    <option value="SDA">Sumber Daya Air (SDA/Irigasi)</option>
                    <option value="JASA_KONSTRUKSI">Jasa Konstruksi (Jakon)</option>
                    <option value="AMPL">Air Minum & PL (AMPL)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Google Spreadsheet ID <span className="text-[10px] text-slate-400 font-normal ml-1">(Bisa didapat dari URL antara /d/ dan /edit)</span></label>
                <input
                  type="text"
                  value={editingSpreadsheet.spreadsheet_id || ''}
                  onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, spreadsheet_id: e.target.value })}
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nama Sheet (Opsional)</label>
                  <input
                    type="text"
                    value={editingSpreadsheet.sheet_name || 'Sheet1'}
                    onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, sheet_name: e.target.value })}
                    placeholder="Contoh: Sheet1"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Waktu Simpan Cache (Menit)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSpreadsheet.cache_ttl_minutes || 15}
                    onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, cache_ttl_minutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Deskripsi & Instruksi Untuk AI</label>
                <textarea
                  value={editingSpreadsheet.description || ''}
                  onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, description: e.target.value })}
                  rows={3}
                  placeholder="Beri tahu AI isi data ini, contoh: 'Gunakan data ini untuk menjawab pertanyaan warga tentang proses Persetujuan Rekomendasi Tata Ruang'"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white leading-relaxed focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ssActive"
                  checked={editingSpreadsheet.is_active ?? true}
                  onChange={(e) => setEditingSpreadsheet({ ...editingSpreadsheet, is_active: e.target.checked })}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ssActive" className="text-slate-300 font-semibold cursor-pointer">
                  Aktifkan Integrasi Spreadsheet Ini
                </label>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-blue-300 text-[11px]">
                    <strong>PENTING:</strong> Pastikan spreadsheet Anda telah di-share dengan pengaturan <span className="text-white">"Anyone with the link" (Viewer)</span>. Jika tidak, data tidak dapat diakses.
                  </p>
                  <button 
                    type="button" 
                    onClick={handleTestSpreadsheet}
                    disabled={isTestingSpreadsheet || !editingSpreadsheet.spreadsheet_id}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold whitespace-nowrap disabled:opacity-50"
                  >
                    {isTestingSpreadsheet ? 'Menguji...' : 'Uji Koneksi'}
                  </button>
                </div>
                {testResult && (
                  <div className={`p-2 rounded text-[10px] font-mono ${testResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {testResult.success ? testResult.message : testResult.error}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsSpreadsheetModalOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5"><Save className="w-4 h-4" /> Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
