'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { SPMSSurveyService } from '@/services/spmsSurveyService';
import type { SurveySettings, SurveyQuestion, PersonalDataField } from '@/domain/spms';

export default function SPMSSettingsPage() {
  const [settings, setSettings] = useState<SurveySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await SPMSSurveyService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Gagal memuat pengaturan.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setAlert(null);
    try {
      const res = await SPMSSurveyService.saveSettings(settings);
      if (res.success) {
        setAlert({ type: 'success', message: 'Pengaturan survei berhasil disimpan!' });
        setTimeout(() => setAlert(null), 3000);
      } else {
        setAlert({ type: 'error', message: res.error || 'Terjadi kesalahan.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Gagal menyimpan pengaturan' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof SurveySettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // --- Questions Handlers ---
  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
    if (!settings) return;
    const newQuestions = [...settings.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    updateField('questions', newQuestions);
  };

  const addQuestion = () => {
    if (!settings) return;
    const newQ: SurveyQuestion = {
      id: `Q${Date.now()}`,
      label: 'Pertanyaan Baru',
      isActive: true,
      order: settings.questions.length + 1
    };
    updateField('questions', [...settings.questions, newQ]);
  };

  const removeQuestion = (index: number) => {
    if (!settings) return;
    const newQuestions = [...settings.questions];
    newQuestions.splice(index, 1);
    updateField('questions', newQuestions);
  };

  // --- Layanan Handlers ---
  const updateLayanan = (index: number, field: string, value: any) => {
    if (!settings) return;
    const newLayanan = [...settings.layananOptions];
    newLayanan[index] = { ...newLayanan[index], [field]: value };
    updateField('layananOptions', newLayanan);
  };

  const addLayanan = () => {
    if (!settings) return;
    const newL = {
      value: `LAYANAN_${Date.now()}`,
      label: 'Layanan Baru',
      isActive: true
    };
    updateField('layananOptions', [...settings.layananOptions, newL]);
  };

  const removeLayanan = (index: number) => {
    if (!settings) return;
    const newLayanan = [...settings.layananOptions];
    newLayanan.splice(index, 1);
    updateField('layananOptions', newLayanan);
  };

  // --- Personal Data Fields Handlers ---
  const updatePersonalField = (index: number, field: keyof PersonalDataField, value: any) => {
    if (!settings) return;
    const newFields = [...(settings.personalDataFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    updateField('personalDataFields', newFields);
  };

  const updatePersonalFieldOptions = (index: number, optionsString: string) => {
    if (!settings) return;
    const newFields = [...(settings.personalDataFields || [])];
    newFields[index] = { ...newFields[index], options: optionsString.split('\n').map(o => o.trim()).filter(Boolean) };
    updateField('personalDataFields', newFields);
  };

  const addPersonalField = () => {
    if (!settings) return;
    const newF: PersonalDataField = {
      id: `field_${Date.now()}`,
      label: 'Field Baru',
      isActive: true,
      isRequired: false,
      fieldType: 'text',
    };
    updateField('personalDataFields', [...(settings.personalDataFields || []), newF]);
  };

  const removePersonalField = (index: number) => {
    if (!settings) return;
    const newFields = [...(settings.personalDataFields || [])];
    newFields.splice(index, 1);
    updateField('personalDataFields', newFields);
  };


  const handleCopyLink = () => {
    // Determine the base URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gps-cc.garutkab.go.id';
    const surveyUrl = `${baseUrl}/spms/survei`;
    
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-garut-blue animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Survei Warga</h1>
            <p className="text-slate-400 text-sm mt-1">Konfigurasi dinamis form Survei Kepuasan Masyarakat (SKM)</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-garut-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Pengaturan
          </button>
        </div>

        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 border ${
              alert.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{alert.message}</p>
          </motion.div>
        )}

        {/* Konten Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Informasi Umum & Tautan */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Tautan Survei Publik */}
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-garut-blue" />
                Tautan Survei Publik
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Bagikan tautan ini kepada warga yang telah menerima layanan untuk mengisi Survei Kepuasan Masyarakat (SKM).
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-300 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/spms/survei` : '/spms/survei'}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                    copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-garut-blue/20 text-garut-blue hover:bg-garut-blue/30 border border-garut-blue/30'
                  }`}
                  title="Salin Tautan"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <p className="text-[10px] text-emerald-400 mt-2">Tautan berhasil disalin!</p>}
            </div>

            {/* Section: General Info */}
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Informasi Umum</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Judul Survei</label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-garut-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi (Sub-judul)</label>
                  <textarea
                    rows={2}
                    value={settings.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-garut-blue resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Tengah & Kanan: Dimensi, Layanan & Data Diri */}
          <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Section: Pertanyaan SKM (Dimensi) */}
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Pertanyaan Survei (Dimensi SKM)</h2>
              <button onClick={addQuestion} className="text-garut-blue hover:text-blue-400 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Pertanyaan
              </button>
            </div>
            
            <div className="space-y-3">
              {settings.questions.map((q, idx) => (
                <div key={q.id} className="flex items-center gap-3 bg-slate-900/50 border border-white/5 p-3 rounded-xl">
                  <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => updateQuestion(idx, 'label', e.target.value)}
                      className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-1 focus:ring-garut-blue rounded px-2 py-1"
                      placeholder="Pertanyaan..."
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.isActive}
                        onChange={(e) => updateQuestion(idx, 'isActive', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-garut-blue focus:ring-garut-blue focus:ring-offset-slate-900"
                      />
                      <span className="text-sm text-slate-400">Aktif</span>
                    </label>
                    <button onClick={() => removeQuestion(idx)} className="text-rose-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Layanan Options */}
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Opsi Jenis Layanan</h2>
              <button onClick={addLayanan} className="text-garut-blue hover:text-blue-400 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Layanan
              </button>
            </div>

            <div className="space-y-3">
              {settings.layananOptions.map((l, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-900/50 border border-white/5 p-3 rounded-xl">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={l.value}
                      onChange={(e) => updateLayanan(idx, 'value', e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-garut-blue px-3 py-2"
                      placeholder="Kode (mis. KRK)"
                    />
                    <input
                      type="text"
                      value={l.label}
                      onChange={(e) => updateLayanan(idx, 'label', e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-garut-blue px-3 py-2"
                      placeholder="Label Layanan"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={l.isActive}
                        onChange={(e) => updateLayanan(idx, 'isActive', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-garut-blue focus:ring-garut-blue focus:ring-offset-slate-900"
                      />
                      <span className="text-sm text-slate-400 hidden sm:inline">Aktif</span>
                    </label>
                    <button onClick={() => removeLayanan(idx)} className="text-rose-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Personal Data Fields */}
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-white">Bidang Data Pribadi Responden</h2>
              <button onClick={addPersonalField} className="text-garut-blue hover:text-blue-400 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Field
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Atur field data pribadi yang muncul di form survei warga. Centang "Aktif" agar tampil, "Wajib" agar tidak bisa dilewati.</p>

            <div className="space-y-4">
              {(settings.personalDataFields || []).map((f, idx) => (
                <div key={f.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">ID (unik, jangan ubah)</label>
                          <input
                            type="text"
                            value={f.id}
                            onChange={(e) => updatePersonalField(idx, 'id', e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-xs text-slate-400 focus:outline-none focus:border-garut-blue px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Tipe Input</label>
                          <select
                            value={f.fieldType}
                            onChange={(e) => updatePersonalField(idx, 'fieldType', e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-garut-blue px-3 py-2"
                          >
                            <option value="text">Teks</option>
                            <option value="tel">Nomor Telepon</option>
                            <option value="select">Dropdown (Pilihan)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Label (tampil di form)</label>
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) => updatePersonalField(idx, 'label', e.target.value)}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-garut-blue px-3 py-2"
                        />
                      </div>
                      {f.fieldType === 'select' && (
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Opsi Pilihan (satu per baris)</label>
                          <textarea
                            rows={4}
                            value={(f.options || []).join('\n')}
                            onChange={(e) => updatePersonalFieldOptions(idx, e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-garut-blue px-3 py-2 resize-none"
                            placeholder="Opsi 1&#10;Opsi 2&#10;Opsi 3"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.isActive}
                          onChange={(e) => updatePersonalField(idx, 'isActive', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-garut-blue"
                        />
                        <span className="text-xs text-slate-400">Aktif</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.isRequired}
                          onChange={(e) => updatePersonalField(idx, 'isRequired', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500"
                        />
                        <span className="text-xs text-slate-400">Wajib</span>
                      </label>
                      <button onClick={() => removePersonalField(idx)} className="text-rose-500 hover:text-rose-400 p-1 mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
