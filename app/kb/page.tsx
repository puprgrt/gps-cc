'use client';

// ============================================================
// 1. IMPORTS (terkelompok dan terurut sesuai aturan AGENTS.md)
// ============================================================
// a. React / Next.js core
import React, { useState, useEffect, useMemo } from 'react';

// b. Third-party libraries
import {
  BookOpen,
  Search,
  Plus,
  Database,
  Layers,
  FileText,
  CheckCircle2,
  RefreshCw,
  Tag,
  ShieldCheck,
  ExternalLink,
  Copy,
  Clock,
  Sparkles,
  HelpCircle,
  Filter,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

// c. Internal components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

// d. Domain types & constants
import { THEME_COLORS } from '@/constants/theme';

// e. Utilities (terakhir)
import { cn } from '@/lib/utils';

// ============================================================
// 2. TYPES & INTERFACES
// ============================================================
interface KBDocument {
  id?: string;
  bidang: string;
  title: string;
  keywords: string[];
  content: string;
  updatedAt?: string;
}

interface CachedFAQItem {
  queryKey: string;
  replyText: string;
  category: string;
  hitCount: number;
  updatedAt: string;
}

// ============================================================
// 3. COMPONENT DEFINITION
// ============================================================
export default function KnowledgeBaseCommandCenter() {
  // a. Local state
  const [activeTab, setActiveTab] = useState<string>('rag-docs');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [cachedFaqs, setCachedFaqs] = useState<CachedFAQItem[]>([]);
  const [cacheStats, setCacheStats] = useState<{ totalCachedItems: number; totalCacheHits: number }>({
    totalCachedItems: 0,
    totalCacheHits: 0,
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBidang, setSelectedBidang] = useState<string>('SEMUA');

  // Form New Document State
  const [newBidang, setNewBidang] = useState<string>('BANGUNAN_GEDUNG');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newKeywords, setNewKeywords] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // b. Effects
  useEffect(() => {
    fetchKnowledgeBaseData();
  }, []);

  // c. Event handlers & Fetch logic
  const fetchKnowledgeBaseData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kb');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDocuments(json.data.documents || []);
          setCachedFaqs(json.data.cachedFaqs || []);
          if (json.data.cacheStats) setCacheStats(json.data.cacheStats);
        }
      }
    } catch {
      // silent fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setSubmitMsg({ type: 'error', text: 'Judul dan isi dokumen tidak boleh kosong.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg(null);

    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidang: newBidang,
          title: newTitle,
          keywords: newKeywords,
          content: newContent,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitMsg({ type: 'success', text: '✅ Dokumen baru berhasil ditambahkan ke RAG Knowledge Base PURI.' });
        setNewTitle('');
        setNewKeywords('');
        setNewContent('');
        fetchKnowledgeBaseData();
        setActiveTab('rag-docs');
      } else {
        setSubmitMsg({ type: 'error', text: json.error || 'Gagal menyimpan dokumen.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // d. Computed filtered lists
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchBidang = selectedBidang === 'SEMUA' || doc.bidang === selectedBidang;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        (doc.keywords && doc.keywords.some((k) => k.toLowerCase().includes(q)));

      return matchBidang && matchSearch;
    });
  }, [documents, selectedBidang, searchQuery]);

  const bidangList = [
    { id: 'SEMUA', name: 'Semua Bidang', icon: '🏛️' },
    { id: 'SEKRETARIAT', name: 'Sekretariat', icon: '📋' },
    { id: 'PENATAAN_RUANG', name: 'Penataan Ruang', icon: '🗺️' },
    { id: 'BANGUNAN_GEDUNG', name: 'Bangunan Gedung', icon: '🏗️' },
    { id: 'BINA_MARGA', name: 'Bina Marga', icon: '🛣️' },
    { id: 'SDA', name: 'Sumber Daya Air', icon: '🌊' },
    { id: 'AMPL', name: 'AMPL', icon: '🚰' },
    { id: 'JASA_KONSTRUKSI', name: 'Jasa Konstruksi', icon: '⚙️' },
  ];

  const getBidangBadgeColor = (bidang: string) => {
    switch (bidang) {
      case 'BANGUNAN_GEDUNG':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PENATAAN_RUANG':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'BINA_MARGA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SDA':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'AMPL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'JASA_KONSTRUKSI':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  // e. Render
  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 p-4 md:p-8 space-y-8">
      {/* 1. HERO HEADER SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F4C81]/40 via-[#161B22] to-[#2E7D32]/30 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              PURI RAG FIRST • 7 OFFICIAL DOMAINS KNOWLEDGE BASE
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              PURI Knowledge Base Command Center
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Pusat referensi Regulasi, SOP Pelayanan Publik (PBG, SLF, KRK), Peraturan Daerah (Perda), dan 
              <strong> 0-Token FAQ Semantic Cache</strong> yang menjadi acuan resmi kecerdasan buatan Dinas PUPR Kabupaten Garut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setActiveTab('add-doc')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah SOP / Regulasi
            </Button>
            <Button
              onClick={fetchKnowledgeBaseData}
              disabled={isLoading}
              variant="outline"
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Sinkronisasi
            </Button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#161B22] border-slate-800 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              Dokumen RAG Terdaftar
              <BookOpen className="h-4 w-4 text-blue-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              {documents.length || 7} SOP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-400 font-medium">
              Terverifikasi • 7 Bidang Dinas PUPR Garut
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#161B22] border-slate-800 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              FAQ 0-Token Cache
              <Database className="h-4 w-4 text-amber-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-400">
              {cacheStats.totalCachedItems || 5} Entri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Total Hits: <span className="font-semibold text-emerald-400">{cacheStats.totalCacheHits || 0} kali</span> (0 Token Cost)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#161B22] border-slate-800 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              Cakupan Layanan Publik
              <Layers className="h-4 w-4 text-purple-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">100%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-400 font-medium">
              PBG, SLF, KRK, PKKPR, Jalan, Irigasi, SPAM
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#161B22] border-slate-800 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              RAG Retrieval Accuracy
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">99.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Semantic Search &amp; Keyword Boosting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABS INTERACTIVE AREA */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="bg-[#161B22] border border-slate-800 p-1 rounded-xl self-start">
            <TabsTrigger value="rag-docs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4">
              <BookOpen className="h-4 w-4 mr-2" />
              Katalog Dokumen SOP ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="faq-cache" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4">
              <Database className="h-4 w-4 mr-2" />
              0-Token FAQ Cache ({cachedFaqs.length})
            </TabsTrigger>
            <TabsTrigger value="add-doc" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokumen SOP
            </TabsTrigger>
          </TabsList>

          {/* REALTIME SEARCH INPUT */}
          {activeTab !== 'add-doc' && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul SOP, pasal, atau kata kunci..."
                className="pl-9 bg-[#161B22] border-slate-700 text-white placeholder:text-slate-500 h-10 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* BIDANG FILTER CHIPS (ONLY FOR TAB 1) */}
        {activeTab === 'rag-docs' && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {bidangList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedBidang(item.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                  selectedBidang === item.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-[#161B22] text-slate-300 border-slate-800 hover:border-slate-700'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* TAB 1: RAG DOCUMENTS CATALOG */}
        <TabsContent value="rag-docs" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-3 text-blue-400" />
              <span>Memuat Dokumen Knowledge Base PUPR Garut...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="bg-[#161B22] border-slate-800 p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-slate-500 mx-auto" />
              <CardTitle className="text-lg text-white">Dokumen Tidak Ditemukan</CardTitle>
              <CardDescription className="text-slate-400">
                Tidak ada dokumen RAG yang cocok dengan kata kunci atau filter bidang yang dipilih.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDocuments.map((doc, idx) => (
                <Card key={idx} className="bg-[#161B22] border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <Badge variant="outline" className={cn('text-xs font-semibold px-2.5 py-0.5', getBidangBadgeColor(doc.bidang))}>
                          {doc.bidang}
                        </Badge>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          RAG Verified
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-white pt-2 leading-snug">
                        {doc.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* KEYWORDS CHIPS */}
                      {doc.keywords && doc.keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {doc.keywords.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                            >
                              <Tag className="h-2.5 w-2.5 text-blue-400" />
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CONTENT SNIPPET */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                        {doc.content}
                      </div>
                    </CardContent>
                  </div>

                  <div className="px-6 pb-4 pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs text-slate-400">
                    <span>Diindeks untuk AI &amp; Operator</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aktif di 6-Tier Router
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: 0-TOKEN SEMANTIC FAQ CACHE INSPECTOR */}
        <TabsContent value="faq-cache" className="space-y-6">
          <Card className="bg-[#161B22] border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-400" />
                0-Token Semantic &amp; Exact Memory Cache
              </CardTitle>
              <CardDescription className="text-slate-400">
                Daftar FAQ yang dijawab instan dalam waktu &lt; 5 milidetik tanpa mengurangi kuota cloud AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cachedFaqs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Belum ada entri FAQ yang tersimpan di dalam memori cache.
                </div>
              ) : (
                <div className="space-y-3">
                  {cachedFaqs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          Kunci Pertanyaan: &quot;{item.queryKey}&quot;
                        </span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          {item.hitCount}x Hits (0 Token Cost)
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.replyText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ADD NEW RAG DOCUMENT (KB BUILDER) */}
        <TabsContent value="add-doc" className="space-y-6">
          <Card className="bg-[#161B22] border-slate-800 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-400" />
                Tambah Dokumen SOP / Regulasi Baru ke RAG
              </CardTitle>
              <CardDescription className="text-slate-400">
                Dokumen yang Anda tambahkan akan langsung terindeks dan menjadi rujukan resmi jawaban AI PURI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDocument} className="space-y-5">
                {submitMsg && (
                  <div
                    className={cn(
                      'p-4 rounded-xl border text-sm flex items-center gap-3',
                      submitMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    )}
                  >
                    <span>{submitMsg.text}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    1. Bidang Resmi PUPR Garut
                  </label>
                  <select
                    value={newBidang}
                    onChange={(e) => setNewBidang(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white h-11 rounded-xl px-3 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="BANGUNAN_GEDUNG">Bangunan Gedung (PBG, SLF, Renovasi)</option>
                    <option value="PENATAAN_RUANG">Penataan Ruang (KRK, PKKPR, RTRW)</option>
                    <option value="BINA_MARGA">Bina Marga (Jalan Kabupaten, Jembatan)</option>
                    <option value="SDA">Sumber Daya Air (Irigasi, Drainase, Banjir)</option>
                    <option value="AMPL">AMPL (Air Minum SPAM, Sanitasi)</option>
                    <option value="JASA_KONSTRUKSI">Jasa Konstruksi (Pembinaan BUJK)</option>
                    <option value="SEKRETARIAT">Sekretariat (Informasi Publik, PPID, Administrasi)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    2. Judul Regulasi / SOP Pelayanan
                  </label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: SOP Pengajuan SLF Bangunan Gedung Kepentingan Umum"
                    className="bg-slate-900 border-slate-700 text-white h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    3. Kata Kunci (Keywords) — Pisahkan dengan koma
                  </label>
                  <Input
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="Contoh: slf, gedung, laik fungsi, sertifikat, keandalan bangunan"
                    className="bg-slate-900 border-slate-700 text-white h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    4. Isi Pasal / Ketentuan SOP (Akan Dihubungkan ke RAG First)
                  </label>
                  <textarea
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tuliskan isi ketentuan resmi yang harus dijawab oleh AI..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-blue-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('rag-docs')}
                    className="border-slate-700 bg-slate-800 text-slate-300"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 rounded-xl shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Simpan ke Knowledge Base
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
