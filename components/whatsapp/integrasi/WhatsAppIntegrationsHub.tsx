/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Save, Plus, 
  Trash2, Copy, Check, ExternalLink, Globe, Key, ShieldCheck, 
  Send, Terminal, Zap, MessageSquare, Bot, Building2, 
  Share2, ArrowUpRight, Clock, Activity, Code2, Play, Eye, EyeOff,
  Cpu, Webhook, Radio, Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppService } from '@/services/whatsappService';
import type {
  WhatsAppIntegrationSettings,
  OutboundWebhookConfig,
  RestApiKeyItem,
  WebhookDeliveryLog,
  TestWebhookResult,
  WebhookEventTrigger
} from '@/domain/whatsappIntegration';

const EVENT_OPTIONS: { id: WebhookEventTrigger; label: string; desc: string; icon: string }[] = [
  { id: 'message_received', label: 'Pesan Masuk (Inbound)', desc: 'Setiap kali warga mengirim pesan WhatsApp', icon: '📥' },
  { id: 'message_sent', label: 'Pesan Keluar (Outbound)', desc: 'Setiap kali bot atau operator membalas pesan', icon: '📤' },
  { id: 'critical_emergency_complaint', label: 'Pengaduan KRITIS (Darurat TRC)', desc: 'Laporan longsor, jembatan putus, atau banjir darurat', icon: '🚨' },
  { id: 'ai_routing_decision', label: 'Keputusan 6-Tier AI PURI', desc: 'Klasifikasi bidang, prioritas, dan draft jawaban AI', icon: '🤖' },
  { id: 'operator_handoff', label: 'Eskalasi ke Operator', desc: 'Saat percakapan dialihkan dari AI ke petugas manusia', icon: '👤' },
  { id: 'message_status_updated', label: 'Status Pengiriman (Delivered/Read)', desc: 'Update centang dua biru status WhatsApp', icon: '✅' },
  { id: 'puri_meet_scheduled', label: 'Jadwal PURI Meet Baru', desc: 'Saat undangan rapat konsultasi teknis online dibuat', icon: '📹' }
];

export function WhatsAppIntegrationsHub() {
  const [activeTab, setActiveTab] = useState<'overview' | 'chatwoot' | 'webhooks' | 'apikeys' | 'telegram' | 'simbg' | 'custom_ai' | 'simulator' | 'logs' | 'docs'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<WhatsAppIntegrationSettings | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);

  // Modal / Form States
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'full_access' | 'send_only' | 'read_only'>('full_access');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('60');
  const [createdKeyResult, setCreatedKeyResult] = useState<RestApiKeyItem | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Webhook Test Simulator State
  const [simulatorUrl, setSimulatorUrl] = useState('https://n8n.garutkab.go.id/webhook/whatsapp-inbound-pupr');
  const [simulatorEvent, setSimulatorEvent] = useState<WebhookEventTrigger>('critical_emergency_complaint');
  const [simulatorSecret, setSimulatorSecret] = useState('whsec_pupr_garut_smart_2026');
  const [simulatorMessage, setSimulatorMessage] = useState('Laporan jalan amblas di Samarang Garut membutuhkan alat berat segera!');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<TestWebhookResult | null>(null);

  // Chatwoot Test State
  const [isTestingChatwoot, setIsTestingChatwoot] = useState(false);
  const [chatwootTestMessage, setChatwootTestMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Code generator language
  const [codeLang, setCodeLang] = useState<'curl' | 'nodejs' | 'python' | 'php'>('curl');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await WhatsAppService.getIntegrationsData();
      if (res && res.success) {
        setSettings(res.settings);
        setDeliveryLogs(res.logs || []);
        setSummaryStats(res.summary);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal memuat data integrasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings Handler
  const handleSaveAll = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      await WhatsAppService.saveIntegrationsSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Key Handler
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await WhatsAppService.generateApiKey({
        name: newKeyName.trim(),
        role: newKeyRole,
        allowedBidang: ['ALL'],
        rateLimitPerMinute: Number(newKeyRateLimit) || 60
      });
      if (res && res.success && res.apiKey) {
        setCreatedKeyResult(res.apiKey);
        if (settings) {
          setSettings({
            ...settings,
            apiKeys: [res.apiKey, ...settings.apiKeys]
          });
        }
      }
    } catch (e: any) {
      alert(e.message || 'Gagal membuat Kunci API');
    }
  };

  // Run Webhook Test
  const handleRunWebhookTest = async () => {
    if (!simulatorUrl) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await WhatsAppService.testWebhook({
        targetUrl: simulatorUrl,
        event: simulatorEvent,
        secretToken: simulatorSecret,
        sampleMessageText: simulatorMessage
      });
      if (res && res.result) {
        setWebhookTestResult(res.result);
      }
    } catch (e: any) {
      setWebhookTestResult({
        success: false,
        httpStatus: 0,
        latencyMs: 0,
        responseHeaders: {},
        responseBody: '',
        errorMessage: e.message || 'Gagal mengirim uji coba webhook',
        testedAt: new Date().toISOString()
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Test Chatwoot Connection
  const handleTestChatwoot = async () => {
    if (!settings?.chatwoot) return;
    setIsTestingChatwoot(true);
    setChatwootTestMessage(null);
    try {
      const res = await WhatsAppService.testChatwoot({
        baseUrl: settings.chatwoot.baseUrl,
        apiAccessToken: settings.chatwoot.apiAccessToken,
        accountId: settings.chatwoot.accountId
      });
      if (res.success) {
        setChatwootTestMessage({ success: true, text: res.message || 'Koneksi ke Chatwoot Berhasil!' });
        setSettings({
          ...settings,
          chatwoot: { ...settings.chatwoot, status: 'CONNECTED', lastSyncAt: new Date().toISOString() }
        });
      } else {
        setChatwootTestMessage({ success: false, text: res.error || 'Koneksi gagal.' });
      }
    } catch (e: any) {
      setChatwootTestMessage({ success: false, text: e.message || 'Koneksi ke Chatwoot gagal.' });
    } finally {
      setIsTestingChatwoot(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Memuat Pengaturan Integrasi WhatsApp Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & BREADCRUMB                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-card rounded-2xl border border-white/10 p-6 shadow-2xl bg-gradient-to-r from-[#0F4C81]/40 via-[#161B22] to-[#0D1117] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/whatsapp" className="hover:text-blue-400 transition-colors">WhatsApp Center</Link>
            <span>/</span>
            <span className="text-white font-medium">Integrasi Aplikasi Eksternal</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
                Pengaturan Integrasi & Gateway WhatsApp
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px]">
                  ⚡ Baileys Gateway Online
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[11px]">
                  🔒 HMAC SHA-256
                </Badge>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Sambungkan obrolan WhatsApp Center PUPR Garut ke Chatwoot Omnichannel, n8n/Zapier Webhooks, Sistem SIMBG, Telegram TRC, dan Custom AI Pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
          <Link href="/whatsapp">
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-slate-200 text-xs h-9 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke WhatsApp
            </Button>
          </Link>

          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs h-9 px-4 gap-2 shadow-lg shadow-blue-900/30 border border-blue-400/30 transition-all cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Semua Pengaturan</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center justify-between text-xs shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Pengaturan integrasi WhatsApp Center berhasil disimpan dan diterapkan ke gateway!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-300 hover:text-white">✕</button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-center justify-between text-xs shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP KPI CARDS                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-md">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Konektor Aktif</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {summaryStats?.totalActiveConnectors || 4} <span className="text-xs font-normal text-slate-400">/ 6 Layanan</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Gateway Berjalan Normal
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-inner">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-md">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Webhook Forward (24h)</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {summaryStats?.totalWebhooksSent24h || 1808} <span className="text-xs font-normal text-slate-400">Events</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Sukses 99.7%
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
            <Webhook className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-md">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Latensi</div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">
              {summaryStats?.avgDeliveryLatencyMs || 185} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-purple-400 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Fast Ingest Processing
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between shadow-md">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kunci REST API Aktif</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {settings.apiKeys.filter((k: RestApiKeyItem) => k.isActive).length} <span className="text-xs font-normal text-slate-400">Aplikasi</span>
            </div>
            <div className="text-[10px] text-amber-400 font-medium mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Token Auth Protected
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner">
            <Key className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. NAVIGATION TABS                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 custom-scrollbar text-xs font-semibold">
        {[
          { id: 'overview', label: '📊 Ikhtisar Konektor', badge: '' },
          { id: 'chatwoot', label: '💬 Chatwoot Inbox', badge: settings.chatwoot.isActive ? 'Aktif' : '' },
          { id: 'webhooks', label: '🪝 Outbound Webhooks', badge: `${settings.webhooks.length}` },
          { id: 'apikeys', label: '🔑 REST API Keys', badge: `${settings.apiKeys.length}` },
          { id: 'telegram', label: '✈️ Telegram TRC Bridge', badge: settings.telegramBridge.isActive ? 'Aktif' : '' },
          { id: 'simbg', label: '🏛️ SIMBG & Perizinan', badge: settings.simbgBridge.isActive ? 'Aktif' : '' },
          { id: 'custom_ai', label: '🤖 Custom AI Gateway', badge: settings.customAiGateway.isActive ? 'Aktif' : '' },
          { id: 'simulator', label: '🧪 Simulator & Uji Live', badge: 'Test' },
          { id: 'logs', label: '📜 Log Pengiriman', badge: `${deliveryLogs.length}` },
          { id: 'docs', label: '📖 Panduan & Contoh Kode', badge: '' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TAB CONTENTS                                               */}
      {/* ------------------------------------------------------------- */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Chatwoot Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  💬
                </div>
                <Badge className={settings.chatwoot.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/20 text-slate-400'}>
                  {settings.chatwoot.isActive ? '🟢 Tersambung' : '⚪ Nonaktif'}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">Chatwoot Omnichannel Inbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menyinkronkan percakapan WhatsApp ke dashboard helpdesk multi-agen Chatwoot dengan auto-tagging 6-Tier AI PURI.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID Akun: {settings.chatwoot.accountId}</span>
              <Button onClick={() => setActiveTab('chatwoot')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Atur Koneksi <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Webhook Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  🪝
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  {settings.webhooks.filter((w: OutboundWebhookConfig) => w.isActive).length} Webhook Aktif
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">Outbound Webhooks (n8n / API)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Forward otomatis pesan masuk, status aduan darurat, dan notifikasi ke server eksternal secara real-time via HTTP POST.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">HMAC SHA-256 Protected</span>
              <Button onClick={() => setActiveTab('webhooks')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Kelola Webhook <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* REST API Keys Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  🔑
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                  {settings.apiKeys.length} Kunci Terdaftar
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">REST API Gateway & Tokens</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Akses programatik untuk aplikasi internal/eksternal agar dapat mengirim pesan WhatsApp via endpoint REST aman.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Rate-Limit Guard</span>
              <Button onClick={() => setActiveTab('apikeys')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Kelola Kunci <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Telegram TRC Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                  ✈️
                </div>
                <Badge className={settings.telegramBridge.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/20 text-slate-400'}>
                  {settings.telegramBridge.isActive ? '🟢 TRC Bridge Aktif' : '⚪ Nonaktif'}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">Telegram TRC Emergency Bridge</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Meneruskan laporan aduan berkategori KRITIS (longsor, jembatan putus, banjir) langsung ke grup Telegram Tim Reaksi Cepat PUPR.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Filter: Hanya Aduan Kritis</span>
              <Button onClick={() => setActiveTab('telegram')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Atur Telegram <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* SIMBG / Perizinan Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  🏛️
                </div>
                <Badge className={settings.simbgBridge.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/20 text-slate-400'}>
                  {settings.simbgBridge.isActive ? '🟢 Sync Aktif' : '⚪ Nonaktif'}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">SIMBG & Portal Perizinan</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sinkronisasi otomatis status persetujuan PBG dan SLF ke pemohon via pesan notifikasi WhatsApp resmi.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">PBG & SLF Notifier</span>
              <Button onClick={() => setActiveTab('simbg')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Atur SIMBG <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Custom AI Gateway Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                  🤖
                </div>
                <Badge className={settings.customAiGateway.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/20 text-slate-400'}>
                  {settings.customAiGateway.isActive ? '🟢 Custom LLM' : '⚪ PURI Internal'}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-white">Custom AI & LLM Gateway</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hubungkan WhatsApp dengan agen AI eksternal seperti Dify, Flowise, atau microservice Python FastAPI kustom.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Provider: {settings.customAiGateway.providerName}</span>
              <Button onClick={() => setActiveTab('custom_ai')} variant="outline" size="sm" className="text-xs h-7 gap-1 border-white/10 hover:bg-white/10">
                Atur AI <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHATWOOT */}
      {activeTab === 'chatwoot' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>💬</span> Konfigurasi Chatwoot Omnichannel Inbox
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hubungkan nomor WhatsApp Baileys PUPR Garut ke Chatwoot agar operator dapat membalas pesan warga melalui antarmuka web helpdesk Chatwoot.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-semibold">Aktifkan Integrasi Chatwoot:</span>
              <input
                type="checkbox"
                checked={settings.chatwoot.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  chatwoot: { ...settings.chatwoot, isActive: e.target.checked }
                })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Base URL Server Chatwoot</label>
              <Input
                value={settings.chatwoot.baseUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  chatwoot: { ...settings.chatwoot, baseUrl: e.target.value }
                })}
                placeholder="https://app.chatwoot.com atau https://chatwoot.garutkab.go.id"
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">Domain instans Chatwoot Anda (Cloud atau Self-Hosted).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Account ID Chatwoot</label>
              <Input
                value={settings.chatwoot.accountId}
                onChange={(e) => setSettings({
                  ...settings,
                  chatwoot: { ...settings.chatwoot, accountId: e.target.value }
                })}
                placeholder="Contoh: 1"
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">Nomor ID Akun Chatwoot (default: 1).</p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">API Access Token Chatwoot (User / Bot Token)</label>
              <div className="relative">
                <Input
                  type="password"
                  value={settings.chatwoot.apiAccessToken}
                  onChange={(e) => setSettings({
                    ...settings,
                    chatwoot: { ...settings.chatwoot, apiAccessToken: e.target.value }
                  })}
                  placeholder="Dapatkan di Profile Settings -> Access Token pada Chatwoot"
                  className="bg-slate-950/80 border-white/10 text-xs font-mono pr-10"
                />
              </div>
              <p className="text-[11px] text-slate-500">Token otentikasi REST API untuk mengizinkan sinkronisasi label dan pesan.</p>
            </div>
          </div>

          {/* Fitur Otomatis */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Otomasi AI PURI di Chatwoot</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chatwoot.syncLabels}
                  onChange={(e) => setSettings({
                    ...settings,
                    chatwoot: { ...settings.chatwoot, syncLabels: e.target.checked }
                  })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Auto-Pasang Label (Bina Marga, PBG, dll)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chatwoot.syncPrivateNotes}
                  onChange={(e) => setSettings({
                    ...settings,
                    chatwoot: { ...settings.chatwoot, syncPrivateNotes: e.target.checked }
                  })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Kirim Catatan Internal (Memo AI)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chatwoot.autoAssignOperator}
                  onChange={(e) => setSettings({
                    ...settings,
                    chatwoot: { ...settings.chatwoot, autoAssignOperator: e.target.checked }
                  })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Auto-Assign Operator Bidang</span>
              </label>
            </div>
          </div>

          {/* Uji Koneksi Chatwoot */}
          <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
            <div className="text-xs">
              {chatwootTestMessage && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  chatwootTestMessage.success
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-500/30 text-rose-200'
                }`}>
                  {chatwootTestMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{chatwootTestMessage.text}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleTestChatwoot}
              disabled={isTestingChatwoot}
              variant="outline"
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30 text-xs h-9 gap-2"
            >
              {isTestingChatwoot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Uji Koneksi Chatwoot API</span>
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: OUTBOUND WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🪝</span> Daftar Webhook Keluar (Outbound Forwarders)
              </h2>
              <p className="text-xs text-slate-400">
                Pesan dan peristiwa WhatsApp akan diteruskan ke URL target di bawah secara otomatis dengan tanda tangan HMAC SHA-256.
              </p>
            </div>

            <Button
              onClick={() => {
                const newWh: OutboundWebhookConfig = {
                  id: `wh-${Date.now()}`,
                  name: 'Webhook Baru',
                  targetUrl: 'https://',
                  secretToken: `whsec_${Math.random().toString(36).substring(2, 12)}`,
                  events: ['message_received', 'critical_emergency_complaint'],
                  maxRetries: 3,
                  timeoutSeconds: 10,
                  isActive: true,
                  status: 'CONFIGURED',
                  totalDeliveries: 0,
                  failedDeliveries: 0
                };
                setSettings({
                  ...settings,
                  webhooks: [...settings.webhooks, newWh]
                });
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Endpoint Webhook
            </Button>
          </div>

          <div className="space-y-4">
            {settings.webhooks.map((wh: OutboundWebhookConfig, idx: number) => (
              <div key={wh.id} className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <Input
                        value={wh.name}
                        onChange={(e) => {
                          const updated = [...settings.webhooks];
                          updated[idx].name = e.target.value;
                          setSettings({ ...settings, webhooks: updated });
                        }}
                        className="bg-slate-950/80 border-white/10 text-sm font-bold text-white h-8 max-w-sm"
                        placeholder="Nama Webhook (contoh: n8n Workflow TRC)"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer">
                      <span>Aktif:</span>
                      <input
                        type="checkbox"
                        checked={wh.isActive}
                        onChange={(e) => {
                          const updated = [...settings.webhooks];
                          updated[idx].isActive = e.target.checked;
                          setSettings({ ...settings, webhooks: updated });
                        }}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                    </label>
                    <Button
                      onClick={() => {
                        const updated = settings.webhooks.filter((_: any, i: number) => i !== idx);
                        setSettings({ ...settings, webhooks: updated });
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Target Webhook URL (POST)</label>
                    <Input
                      value={wh.targetUrl}
                      onChange={(e) => {
                        const updated = [...settings.webhooks];
                        updated[idx].targetUrl = e.target.value;
                        setSettings({ ...settings, webhooks: updated });
                      }}
                      placeholder="https://n8n.example.com/webhook/..."
                      className="bg-slate-950/80 border-white/10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Secret Token (Header X-PUPR-Signature HMAC)</label>
                    <Input
                      value={wh.secretToken || ''}
                      onChange={(e) => {
                        const updated = [...settings.webhooks];
                        updated[idx].secretToken = e.target.value;
                        setSettings({ ...settings, webhooks: updated });
                      }}
                      placeholder="whsec_..."
                      className="bg-slate-950/80 border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Event Trigger Selection */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Peristiwa yang Memicu Webhook (Events)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {EVENT_OPTIONS.map((ev) => {
                      const isChecked = wh.events.includes(ev.id);
                      return (
                        <label
                          key={ev.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-600/20 border-blue-500/40 text-white font-medium'
                              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = [...settings.webhooks];
                              if (e.target.checked) {
                                updated[idx].events = [...updated[idx].events, ev.id];
                              } else {
                                updated[idx].events = updated[idx].events.filter((x: WebhookEventTrigger) => x !== ev.id);
                              }
                              setSettings({ ...settings, webhooks: updated });
                            }}
                            className="w-4 h-4 accent-blue-600 rounded mt-0.5"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <span>{ev.icon}</span>
                              <span>{ev.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">{ev.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REST API KEYS */}
      {activeTab === 'apikeys' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔑</span> Kunci REST API untuk Aplikasi Eksternal
              </h2>
              <p className="text-xs text-slate-400">
                Gunakan Kunci API ini pada aplikasi luar (misal SIMBG, Portal Perizinan, Sistem Kepegawaian) untuk mengirim pesan WhatsApp secara terautentikasi.
              </p>
            </div>

            <Button
              onClick={() => {
                setCreatedKeyResult(null);
                setNewKeyName('');
                setShowNewKeyModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-9 gap-2"
            >
              <Plus className="w-4 h-4" /> Buat Kunci API Baru
            </Button>
          </div>

          {/* Modal Buat Key Baru */}
          <AnimatePresence>
            {showNewKeyModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 rounded-2xl border border-amber-500/40 bg-slate-900/95 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Buat Kunci REST API Baru
                  </h3>
                  <button onClick={() => setShowNewKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {!createdKeyResult ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Nama Aplikasi / Klien</label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Contoh: Portal SIMBG Garut Notifier"
                        className="bg-slate-950/80 border-white/10 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Hak Akses (Role Permissions)</label>
                        <select
                          value={newKeyRole}
                          onChange={(e) => setNewKeyRole(e.target.value as any)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="full_access">Kirim & Baca Percakapan (Full Access)</option>
                          <option value="send_only">Hanya Kirim Pesan (Send Only / Notifier)</option>
                          <option value="read_only">Hanya Baca Inbox (Read Only)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Batas Request (Rate Limit per Menit)</label>
                        <Input
                          type="number"
                          value={newKeyRateLimit}
                          onChange={(e) => setNewKeyRateLimit(e.target.value)}
                          placeholder="60"
                          className="bg-slate-950/80 border-white/10 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button onClick={() => setShowNewKeyModal(false)} variant="outline" size="sm" className="text-xs border-white/10">Batal</Button>
                      <Button onClick={handleGenerateKey} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">
                        Generate Token Sekarang
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Kunci API Berhasil Dibuat!
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Salin Kunci API ini sekarang. Demi alasan keamanan, token lengkap ini <strong>tidak akan ditampilkan lagi</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-black/60 p-3 rounded-lg border border-amber-500/40">
                      <code className="text-xs font-mono text-amber-200 flex-1 break-all">
                        {createdKeyResult.fullKey}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(createdKeyResult.fullKey || '', 'new-key')}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs shrink-0 gap-1.5"
                      >
                        {copiedKeyId === 'new-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKeyId === 'new-key' ? 'Tersalin!' : 'Salin Token'}
                      </Button>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setShowNewKeyModal(false)} size="sm" className="bg-white/10 text-white text-xs">Tutup Dialog</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* List API Keys */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nama Aplikasi</th>
                    <th className="p-4">Kunci Token (Masked)</th>
                    <th className="p-4">Hak Akses</th>
                    <th className="p-4">Rate Limit</th>
                    <th className="p-4">Terakhir Digunakan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                  {settings.apiKeys.map((k: RestApiKeyItem, idx: number) => (
                    <tr key={k.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-sans font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{k.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-amber-300 font-mono text-[11px]">
                        {k.maskedKey}
                      </td>
                      <td className="p-4 font-sans">
                        <Badge className={
                          k.role === 'full_access' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]' :
                          k.role === 'send_only' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]' :
                          'bg-slate-500/20 text-slate-300 border-slate-500/30 text-[10px]'
                        }>
                          {k.role === 'full_access' ? 'Full Access' : k.role === 'send_only' ? 'Send Message Only' : 'Read Only'}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {k.rateLimitPerMinute} req/min
                      </td>
                      <td className="p-4 font-sans text-slate-400 text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('id-ID') : 'Belum digunakan'}
                      </td>
                      <td className="p-4 text-right font-sans">
                        <Button
                          onClick={() => {
                            const updated = settings.apiKeys.filter((_: any, i: number) => i !== idx);
                            setSettings({ ...settings, apiKeys: updated });
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 h-7 px-2 text-xs"
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TELEGRAM TRC BRIDGE */}
      {activeTab === 'telegram' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>✈️</span> Telegram TRC Emergency Alert Bridge
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kirim notifikasi otomatis ke Grup Telegram Tim Reaksi Cepat (TRC) PUPR Garut saat warga melaporkan keadaan darurat kritis di WhatsApp.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-semibold">Aktifkan Telegram Bridge:</span>
              <input
                type="checkbox"
                checked={settings.telegramBridge.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  telegramBridge: { ...settings.telegramBridge, isActive: e.target.checked }
                })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Telegram Bot Token (dari @BotFather)</label>
              <Input
                type="password"
                value={settings.telegramBridge.botToken}
                onChange={(e) => setSettings({
                  ...settings,
                  telegramBridge: { ...settings.telegramBridge, botToken: e.target.value }
                })}
                placeholder="6829104821:AAHkL78w9..."
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Telegram Group / Channel Chat ID</label>
              <Input
                value={settings.telegramBridge.chatId}
                onChange={(e) => setSettings({
                  ...settings,
                  telegramBridge: { ...settings.telegramBridge, chatId: e.target.value }
                })}
                placeholder="-1002938475821"
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Nama Saluran TRC</label>
              <Input
                value={settings.telegramBridge.channelName}
                onChange={(e) => setSettings({
                  ...settings,
                  telegramBridge: { ...settings.telegramBridge, channelName: e.target.value }
                })}
                placeholder="Grup TRC Tim Tanggap Bencana PUPR Garut"
                className="bg-slate-950/80 border-white/10 text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramBridge.notifyOnlyCriticalEmergency}
                onChange={(e) => setSettings({
                  ...settings,
                  telegramBridge: { ...settings.telegramBridge, notifyOnlyCriticalEmergency: e.target.checked }
                })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <span className="font-semibold">Hanya kirim laporan berprioritas KRITIS (Jalan putus, Jembatan ambruk, Banjir parah)</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 6: SIMBG */}
      {activeTab === 'simbg' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏛️</span> Integrasi SIMBG & Portal Perizinan PUPR Garut
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kirim pemberitahuan otomatis ke WhatsApp pemohon setiap kali terdapat pembaruan status pendaftaran PBG atau SLF pada SIMBG.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-semibold">Aktifkan Notifikasi SIMBG:</span>
              <input
                type="checkbox"
                checked={settings.simbgBridge.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  simbgBridge: { ...settings.simbgBridge, isActive: e.target.checked }
                })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Endpoint Webhook SIMBG Garut Ingestion</label>
              <Input
                value={settings.simbgBridge.endpointUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  simbgBridge: { ...settings.simbgBridge, endpointUrl: e.target.value }
                })}
                placeholder="https://simbg.pu.go.id/api/..."
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">API Secret Key SIMBG Bridge</label>
              <Input
                type="password"
                value={settings.simbgBridge.apiKey || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  simbgBridge: { ...settings.simbgBridge, apiKey: e.target.value }
                })}
                placeholder="simbg_sec_..."
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CUSTOM AI */}
      {activeTab === 'custom_ai' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🤖</span> Custom AI & External LLM Pipeline Gateway
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Arahkan pemrosesan pertanyaan warga ke endpoint model kustom (Dify.ai, Flowise, microservice Python) alih-alih Gemini internal.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-semibold">Aktifkan Custom AI Gateway:</span>
              <input
                type="checkbox"
                checked={settings.customAiGateway.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  customAiGateway: { ...settings.customAiGateway, isActive: e.target.checked }
                })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama Provider / Platform</label>
              <Input
                value={settings.customAiGateway.providerName}
                onChange={(e) => setSettings({
                  ...settings,
                  customAiGateway: { ...settings.customAiGateway, providerName: e.target.value }
                })}
                placeholder="Dify.ai / FastAPI LangChain"
                className="bg-slate-950/80 border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Model Name ID</label>
              <Input
                value={settings.customAiGateway.modelName || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  customAiGateway: { ...settings.customAiGateway, modelName: e.target.value }
                })}
                placeholder="qwen2.5-72b-garut-instruct"
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">API Endpoint URL</label>
              <Input
                value={settings.customAiGateway.endpointUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  customAiGateway: { ...settings.customAiGateway, endpointUrl: e.target.value }
                })}
                placeholder="https://ai.garutkab.go.id/v1/chat/completions"
                className="bg-slate-950/80 border-white/10 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SIMULATOR & LIVE TESTING */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Play className="w-4 h-4 text-emerald-400" />
              Live Webhook Dispatcher Simulator
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Webhook URL</label>
                <Input
                  value={simulatorUrl}
                  onChange={(e) => setSimulatorUrl(e.target.value)}
                  className="bg-slate-950/80 border-white/10 text-xs font-mono"
                  placeholder="https://your-webhook-endpoint.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tipe Peristiwa (Event Trigger)</label>
                <select
                  value={simulatorEvent}
                  onChange={(e) => setSimulatorEvent(e.target.value as any)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg p-2 text-xs text-white"
                >
                  {EVENT_OPTIONS.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.icon} {ev.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Secret Token (HMAC Signature)</label>
                <Input
                  value={simulatorSecret}
                  onChange={(e) => setSimulatorSecret(e.target.value)}
                  className="bg-slate-950/80 border-white/10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Isi Pesan Contoh (Payload Text)</label>
                <textarea
                  value={simulatorMessage}
                  onChange={(e) => setSimulatorMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <Button
                onClick={handleRunWebhookTest}
                disabled={isTestingWebhook}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-10 gap-2 shadow-lg cursor-pointer"
              >
                {isTestingWebhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Kirim Uji Coba Webhook Sekarang</span>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Terminal className="w-4 h-4 text-purple-400" />
              Hasil Respons Server Target
            </h3>

            {webhookTestResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">HTTP Status:</span>
                    <Badge className={
                      webhookTestResult.success
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs'
                    }>
                      {webhookTestResult.httpStatus || 'ERROR'} {webhookTestResult.success ? 'OK' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    Latensi: <strong className="text-purple-300">{webhookTestResult.latencyMs} ms</strong>
                  </div>
                </div>

                {webhookTestResult.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {webhookTestResult.errorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Response Body Content:</label>
                  <pre className="p-3 rounded-xl bg-slate-950/90 border border-white/10 text-emerald-300 text-[11px] overflow-x-auto max-h-[220px]">
                    {webhookTestResult.responseBody || '(Body respons kosong)'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center text-slate-500 space-y-2">
                <Radio className="w-8 h-8 opacity-40 animate-pulse" />
                <p className="text-xs">Klik tombol &ldquo;Kirim Uji Coba Webhook&rdquo; di samping untuk menjalankan tes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 9: DELIVERY LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Riwayat Pengiriman Webhook Terkini
            </h3>
            <span className="text-xs text-slate-400 font-mono">{deliveryLogs.length} Events Tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Nama Webhook</th>
                  <th className="p-3.5">Peristiwa (Event)</th>
                  <th className="p-3.5">Status HTTP</th>
                  <th className="p-3.5">Latensi</th>
                  <th className="p-3.5">Endpoint URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {deliveryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-sans text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-white">
                      {log.webhookName}
                    </td>
                    <td className="p-3.5">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                        {log.event}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge className={
                        log.isSuccess
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]'
                      }>
                        {log.httpStatus} {log.isSuccess ? 'OK' : 'ERR'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-purple-300 text-[11px]">
                      {log.latencyMs} ms
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] truncate max-w-xs">
                      {log.endpointUrl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: DOCS & CODE GENERATOR */}
      {activeTab === 'docs' && (
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="space-y-2 border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              Panduan Integrasi REST API & Contoh Kode Pengiriman WhatsApp
            </h2>
            <p className="text-xs text-slate-400">
              Kirim pesan WhatsApp langsung dari aplikasi Anda (SIAP Garut, SIMBG, Presensi, dll) menggunakan endpoint resmi di bawah.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-black font-mono font-bold text-xs">POST</Badge>
              <code className="text-xs font-mono text-white bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10">
                https://domain-pupr-garut.com/api/whatsapp/messages
              </code>
            </div>

            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'curl', label: 'cURL Terminal' },
                { id: 'nodejs', label: 'Node.js (Fetch)' },
                { id: 'python', label: 'Python (Requests)' },
                { id: 'php', label: 'PHP (cURL)' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setCodeLang(l.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    codeLang === l.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950/90 border border-white/10 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                {codeLang === 'curl' && `curl -X POST https://domain-pupr-garut.com/api/whatsapp/messages \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer pupr_live_simbg_YOUR_API_KEY" \\
  -d '{
    "phone": "6281234567890",
    "message": "Halo Bpk/Ibu, Permohonan PBG Anda nomor REG-2026-001 telah DIVERIFIKASI oleh Dinas PUPR Garut."
  }'`}

                {codeLang === 'nodejs' && `const response = await fetch('https://domain-pupr-garut.com/api/whatsapp/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer pupr_live_simbg_YOUR_API_KEY'
  },
  body: JSON.stringify({
    phone: '6281234567890',
    message: 'Halo Bpk/Ibu, Permohonan PBG Anda nomor REG-2026-001 telah DIVERIFIKASI oleh Dinas PUPR Garut.'
  })
});
const data = await response.json();
console.log('WhatsApp Sent:', data);`}

                {codeLang === 'python' && `import requests

url = "https://domain-pupr-garut.com/api/whatsapp/messages"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer pupr_live_simbg_YOUR_API_KEY"
}
payload = {
    "phone": "6281234567890",
    "message": "Halo Bpk/Ibu, Permohonan PBG Anda nomor REG-2026-001 telah DIVERIFIKASI oleh Dinas PUPR Garut."
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`}

                {codeLang === 'php' && `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://domain-pupr-garut.com/api/whatsapp/messages",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "Authorization: Bearer pupr_live_simbg_YOUR_API_KEY"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "phone" => "6281234567890",
    "message" => "Halo Bpk/Ibu, Permohonan PBG Anda nomor REG-2026-001 telah DIVERIFIKASI oleh Dinas PUPR Garut."
  ])
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;`}
              </pre>

              <Button
                onClick={() => {
                  let text = '';
                  if (codeLang === 'curl') text = `curl -X POST https://domain-pupr-garut.com/api/whatsapp/messages -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_API_KEY" -d '{"phone":"6281234567890","message":"Halo!"}'`;
                  if (codeLang === 'nodejs') text = `fetch('https://domain-pupr-garut.com/api/whatsapp/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_KEY' }, body: JSON.stringify({ phone: '6281234567890', message: 'Halo!' }) });`;
                  if (codeLang === 'python') text = `import requests\nrequests.post('https://domain-pupr-garut.com/api/whatsapp/messages', json={'phone': '6281234567890', 'message': 'Halo!'}, headers={'Authorization': 'Bearer YOUR_KEY'})`;
                  if (codeLang === 'php') text = `// PHP snippet`;
                  copyToClipboard(text, 'snippet');
                }}
                size="sm"
                className="absolute right-3 top-3 bg-white/10 hover:bg-white/20 text-white text-xs h-7 gap-1"
              >
                {copiedKeyId === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKeyId === 'snippet' ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
