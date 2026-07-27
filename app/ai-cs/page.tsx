'use client';

// ============================================================
// 1. IMPORTS (terkelompok dan terurut sesuai aturan AGENTS.md)
// ============================================================
// a. React / Next.js core
import React, { useState, useRef, useEffect } from 'react';

// b. Third-party libraries
import {
  Send,
  Sparkles,
  User as UserIcon,
  Bot,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Cpu,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';

// c. Internal components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// d. Domain types & constants
import type { AIOrchestratorResponse } from '@/domain/models';

// e. Utilities (terakhir)
import { cn } from '@/lib/utils';

// ============================================================
// 2. TYPES & INTERFACES
// ============================================================
interface ChatMessageItem {
  id: string;
  sender: 'user' | 'ai';
  senderName: string;
  text: string;
  timestamp: string;
  metadata?: {
    providerUsed?: string;
    modelName?: string;
    isFromCache?: boolean;
    confidenceScore?: number;
    latencyMs?: number;
    routingBidang?: string;
    layanan?: string;
    sla?: string;
    kbSource?: string;
  };
}

// ============================================================
// 3. COMPONENT DEFINITION
// ============================================================
export default function AICustomerServicePage() {
  // a. Local state
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      senderName: 'PURI (AI Front Office)',
      text: '🤖 *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\nSelamat datang di Layanan Customer Service Digital 24/7 Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut.\n\nSilakan ajukan pertanyaan seputar pelayanan (PBG, SLF, KRK, PKKPR), laporkan infrastruktur jalan/jembatan rusak, atau konsultasikan informasi teknik sipil Anda.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      metadata: {
        providerUsed: 'LOCAL',
        modelName: 'PURI-System-Greeting',
        isFromCache: true,
        confidenceScore: 100,
        latencyMs: 1,
      },
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeBidangFilter, setActiveBidangFilter] = useState<string>('SEMUA');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // b. Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // c. Event handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newUserMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: 'Warga / Pemohon',
      text: userText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-orchestrator/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as AIOrchestratorResponse;
        const newAiMsg: ChatMessageItem = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          senderName: 'PURI AI Orchestrator',
          text: data.text,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          metadata: {
            providerUsed: data.providerUsed,
            modelName: data.modelName,
            isFromCache: data.isFromCache,
            confidenceScore: data.confidenceScore,
            latencyMs: data.executionTimeMs,
            routingBidang: data.routingDecision?.primaryBidang,
            layanan: data.routingDecision?.layanan,
            sla: data.routingDecision?.slaDuration,
            kbSource: data.routingDecision?.draftResponse?.knowledgeBaseSource,
          },
        };
        setMessages((prev) => [...prev, newAiMsg]);
      } else {
        throw new Error(json.error || 'Gagal memproses pesan');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      const errorAiMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        senderName: 'PURI (System Notice)',
        text: `🙏 Mohon maaf, terjadi kendala saat menghubungi AI Gateway: ${errorMsg}. Silakan coba beberapa saat lagi.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (questionText: string) => {
    setInput(questionText);
  };

  // d. Render
  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 p-4 md:p-8 space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Front Office Digital 24/7 • PURI AI Orchestrator
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            AI Customer Service & Konsultasi Publik
          </h1>
          <p className="text-sm text-slate-400">
            Diteruskan secara otomatis melalui 6-Tier Hierarchical Routing dan didukung RAG First Knowledge Base 7 Bidang PUPR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            100% Free-Tier & Local Fallback
          </Badge>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR FAQ / DOMAIN INFO */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#161B22] border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                Pertanyaan Cepat (0-Token Cache)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Klik untuk menguji kecepatan respons &lt; 5ms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Apa syarat PBG persetujuan bangunan gedung?',
                'Dimana alamat kantor PUPR Garut?',
                'Bagaimana cara lapor jalan rusak?',
                'Apa perbedaan KRK dengan PKKPR?',
                'Siapa yang mengelola irigasi persawahan?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 text-xs text-slate-300 transition-all"
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                7 Bidang Resmi PUPR Garut
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Otomatis diklasifikasikan oleh AI Router
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              {[
                { name: 'Sekretariat', tag: 'Administrasi & PPID' },
                { name: 'Penataan Ruang', tag: 'KRK, PKKPR, RTRW' },
                { name: 'Bangunan Gedung', tag: 'PBG, SLF, Renovasi' },
                { name: 'Bina Marga', tag: 'Jalan & Jembatan' },
                { name: 'SDA', tag: 'Irigasi & Drainase' },
                { name: 'AMPL', tag: 'Air Minum & Sanitasi' },
                { name: 'Jasa Konstruksi', tag: 'Pembinaan BUJK' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{item.tag}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CHAT INTERFACE AREA */}
        <div className="lg:col-span-3 flex flex-col h-[700px] rounded-2xl bg-[#161B22] border border-slate-800 shadow-xl overflow-hidden">
          {/* CHAT MESSAGES SCROLL CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[85%] md:max-w-[75%]',
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* AVATAR */}
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center shrink-0 border shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                  )}
                >
                  {msg.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <img src="/favicon.ico" alt="PURI" className="h-5 w-5 object-contain" />}
                </div>

                {/* BUBBLE CONTENT */}
                <div className="space-y-2">
                  <div className={cn('flex items-center gap-2 text-xs text-slate-400', msg.sender === 'user' && 'justify-end')}>
                    <span className="font-semibold text-slate-200">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-md',
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                    )}
                  >
                    {msg.text}
                  </div>

                  {/* AI ORCHESTRATOR METADATA BADGES (ONLY FOR AI MESSAGES) */}
                  {msg.sender === 'ai' && msg.metadata && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="bg-slate-800/80 text-blue-400 border-slate-700 text-[10px] px-2 py-0.5">
                        Provider: <strong>{msg.metadata.providerUsed || 'LOCAL'}</strong>
                      </Badge>

                      {msg.metadata.isFromCache ? (
                        <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5">
                          0-Token Cache Hit (&lt; {msg.metadata.latencyMs || 5}ms)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-800/80 text-purple-300 border-slate-700 text-[10px] px-2 py-0.5">
                          Model: <strong>{msg.metadata.modelName}</strong> ({msg.metadata.latencyMs}ms)
                        </Badge>
                      )}

                      {msg.metadata.routingBidang && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5">
                          Bidang: <strong>{msg.metadata.routingBidang}</strong>
                        </Badge>
                      )}

                      {msg.metadata.sla && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-2 py-0.5">
                          SLA: <strong>{msg.metadata.sla}</strong>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 mr-auto max-w-[75%]">
                <div className="h-9 w-9 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center p-1.5 overflow-hidden">
                  <img src="/favicon.ico" alt="PURI" className="h-full w-full object-contain animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                  <span>PURI sedang menganalisis dokumen &amp; rute 6-Tier...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan atau laporan Anda di sini..."
                disabled={isLoading}
                className="flex-1 bg-[#161B22] border-slate-700 text-white placeholder:text-slate-500 h-12 rounded-xl focus:border-blue-500"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold h-12 px-6 rounded-xl shadow-md transition-all"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Kirim</span>
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
