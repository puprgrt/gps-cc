'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Copy,
  Check,
  Filter,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { RAGService, type RAGDocument } from '@/services/ragService';

interface RAGSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function RAGSearchModal({ isOpen, onClose, initialQuery = '' }: RAGSearchModalProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedBidang, setSelectedBidang] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const results: RAGDocument[] =
    query.trim().length > 0
      ? RAGService.searchSOP(query, selectedBidang === 'ALL' ? undefined : selectedBidang)
      : RAGService.getAllDocuments().filter((doc) =>
          selectedBidang === 'ALL' ? true : doc.bidang === selectedBidang
        );

  const handleCopySOP = (doc: RAGDocument) => {
    const text = `*📚 KNOWLEDGE BASE SOP - DINAS PUPR KABUPATEN GARUT*
*Kode SOP:* ${doc.code}
*Judul:* ${doc.title}
*Bidang Penanggung Jawab:* ${doc.bidang}
*SLA Maksimal:* ${doc.slaHours} Jam
*Dasar Hukum:* ${doc.legalBasis}

*📋 PROSEDUR & CHECKLIST OPERATOR:*
${doc.checklist.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

_Disinkronisasi oleh RAG Knowledge Base PURI Social Intelligence Center (PSIC)_`;

    navigator.clipboard.writeText(text);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const BIDANG_LIST = [
    { id: 'ALL', label: 'Semua Bidang' },
    { id: 'BINA_MARGA', label: 'Bina Marga' },
    { id: 'SDA', label: 'SDA (Irigasi)' },
    { id: 'BANGUNAN_GEDUNG', label: 'Bangunan Gedung (SIMBG)' },
    { id: 'PENATAAN_RUANG', label: 'Penataan Ruang (RDTR)' },
    { id: 'AMPL', label: 'AMPL (Sanitasi)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/60 via-slate-900 to-purple-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  SOP RAG Knowledge Base — Dinas PUPR Garut
                </h3>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                  Semantic Search Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Pencarian instan SOP Teknis, SPM, dan Dasar Hukum untuk menjawab pengaduan masyarakat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci SOP (misal: 'jembatan putus', 'jalan berlubang', 'syarat pbg', 'banjir')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Hapus
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Bidang:</span>
            </span>
            {BIDANG_LIST.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBidang(b.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  selectedBidang === b.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Menampilkan <strong>{results.length}</strong> dokumen SOP resmi PUPR Garut
            </span>
            {query && (
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pencarian Semantic Diaktifkan</span>
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                SOP tidak ditemukan untuk kueri &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Coba gunakan kata kunci umum seperti &quot;jalan&quot;, &quot;banjir&quot;, atau &quot;izin&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-blue-500/50 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-mono">
                          {doc.code}
                        </Badge>
                        <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-[10px]">
                          {doc.bidang}
                        </Badge>
                        {doc.relevanceScore && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            {doc.relevanceScore}% Cocok
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-white">{doc.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>SLA: {doc.slaHours} Jam</span>
                      </span>

                      <button
                        onClick={() => handleCopySOP(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                      >
                        {copiedId === doc.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin SOP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{doc.summary}</p>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Checklist Langkah Penanganan (SOP Resmi):</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {doc.checklist.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
                    <span>
                      <strong>Dasar Hukum:</strong> {doc.legalBasis}
                    </span>
                    <span className="text-slate-500">Kategori: {doc.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-500">
            PURI Knowledge RAG v2.0 • Data SOP bersumber dari Peraturan Resmi Dinas PUPR Kab. Garut
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}
