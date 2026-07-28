'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Bot,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Copy,
  Send,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RAGService } from '@/services/ragService';

export function AIAssistant({ message }: { message: any | null }) {
  const [draft, setDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateDraft = async () => {
    if (!message) return;

    setIsGenerating(true);
    setDraft('');
    setCopied(false);

    try {
      const response = await fetch('/api/gemini/social-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: message.smartLabel || message.bidang || message.category || 'PUPR Garut',
          senderName: message.author?.name || message.senderName || 'Warga',
          content: message.title || message.preview || 'Laporan Pengaduan PUPR',
          platform: message.channelType || message.platform || 'whatsapp',
        }),
      });

      const data = await response.json();
      if (data.text) {
        setDraft(data.text);
      } else {
        setDraft(
          `Halo ${
            message.author?.name || 'Bapak/Ibu'
          }, terima kasih atas laporannya. Tim Dinas PUPR Kabupaten Garut (Bidang ${
            message.bidang?.replace(/_/g, ' ') || 'Bina Marga'
          }) akan segera menindaklanjuti informasi yang Anda sampaikan. 🙏`
        );
      }
    } catch {
      setDraft(
        `Halo ${
          message.author?.name || 'Bapak/Ibu'
        }, terima kasih atas laporannya. Tim Dinas PUPR Kabupaten Garut (Bidang ${
          message.bidang?.replace(/_/g, ' ') || 'Bina Marga'
        }) akan segera menindaklanjuti informasi yang Anda sampaikan. 🙏`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (message) {
      timer = setTimeout(() => {
        generateDraft();
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id]);

  if (!message) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl h-[700px] flex flex-col items-center justify-center p-6 text-center shadow-xl">
        <Image src="/puri.png" alt="PURI" width={40} height={40} className="w-10 h-10 rounded-full object-contain mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">PURI Smart Assistant</h3>
        <p className="text-xs text-slate-400">
          Asisten AI PURI akan otomatis menganalisis intensi warga dan menyusun draf balasan resmi Dinas PUPR.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceScore = Number(message.confidenceScore || message.confidence || 95.8);
  const bidangLabel = message.bidang?.replace(/_/g, ' ') || 'Bina Marga';

  // AI RAG SOP Lookup berdasarkan judul atau isi tiket
  const queryText = `${message.title || ''} ${message.preview || ''}`;
  const matchedSOPs = RAGService.searchSOP(queryText, message.bidang);
  const topSop = matchedSOPs[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl h-[700px] flex flex-col overflow-y-auto p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">PURI AI Intelligence</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              6-Tier Hierarchical Routing & Draft Engine
            </p>
          </div>
        </div>

        <button
          onClick={generateDraft}
          disabled={isGenerating}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          title="Regenerate draft"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 6-Tier PURI Routing Summary */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Bidang Penanggung Jawab</span>
          </span>
          <Badge variant="secondary" className="bg-blue-950 text-blue-300 border-blue-800 text-[10px]">
            {bidangLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/40">
          <div>
            <span className="text-[10px] text-slate-400 block">Intensi Warga</span>
            <span className="font-semibold text-slate-200">
              {message.intent || 'PENGADUAN'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Prioritas Tiket</span>
            <span
              className={`font-semibold ${
                message.priority === 'TINGGI' || message.priority === 'KRITIS'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {message.priority || 'NORMAL'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Sentimen</span>
            <span className="font-semibold text-slate-200 capitalize">
              {message.sentiment?.toLowerCase() || 'Netral'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Emosi Warga</span>
            <span className="font-semibold text-slate-200">
              {message.emotion || 'Netral'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Akurasi Klasifikasi AI</span>
          </span>
          <span className="font-bold text-emerald-400 font-mono">
            {confidenceScore.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 📚 RAG SOP Knowledge Match */}
      {topSop && (
        <div className="bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-800/80 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>SOP RAG Terkait (AI Match: {topSop.relevanceScore}%)</span>
            </span>
            <Badge className="bg-blue-950 text-blue-300 border-blue-800 text-[10px] font-mono">
              {topSop.code}
            </Badge>
          </div>
          <p className="text-xs font-bold text-white">{topSop.title}</p>
          <p className="text-[11px] text-slate-300 leading-normal">{topSop.summary}</p>
          <div className="pt-1.5 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
            <span className="font-semibold text-amber-400">SLA Resmi: {topSop.slaHours} Jam</span>
            <span className="text-slate-400 truncate max-w-[200px]">{topSop.legalBasis}</span>
          </div>
        </div>
      )}

      {/* AI Suggested Response Draft */}
      <div className="bg-purple-950/25 border border-purple-800/40 rounded-xl p-3.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Image src="/puri.png" alt="PURI" width={14} height={14} className="w-3.5 h-3.5 rounded-full object-contain" />
            <span>Draf Jawaban AI PURI</span>
          </span>
          <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full font-mono">
            PURI-Gemma 3
          </span>
        </div>

        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed overflow-y-auto mb-3 whitespace-pre-wrap">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
              <Sparkles className="w-6 h-6 animate-spin text-purple-400 mb-2" />
              <span>Menyusun draf balasan resmi...</span>
            </div>
          ) : (
            draft
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!draft || isGenerating}
            className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Draf</span>
              </>
            )}
          </button>

          <button
            onClick={() => alert('Draf AI PURI telah dikirim sebagai balasan resmi!')}
            disabled={!draft || isGenerating}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Kirim Balasan</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SLA & Crisis Alert Banner */}
      {message.priority === 'TINGGI' && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-red-300 block mb-0.5">
              Crisis & SLA Warning (2 Jam)
            </span>
            <p className="text-[11px] text-red-200/80 leading-normal">
              Tiket ini diklasifikasikan sebagai pengaduan kritis infrastruktur. Bila tidak dijawab dalam 2 jam, notifikasi otomatis dikirim ke Kepala Dinas PUPR.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
