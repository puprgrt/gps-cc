'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Minus, Send, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Halo, Admin PUPR 👋 Saya Gemini AI Assistant. Ada yang bisa saya bantu terkait permohonan & pengaduan PUPR Garut hari ini?' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Ringkasan Permohonan Hari Ini',
    'Permohonan Terbanyak',
    'Prediksi Permohonan Bulan Depan',
    'Pengaduan Terbanyak',
    'Buat Laporan Mingguan',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { sender: 'user' as const, text: query };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: newMessages.slice(-6), // Send last few messages for context
        }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Maaf, terjadi masalah saat memproses permintaan dengan Gemini AI.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Gagal terhubung ke layanan Gemini AI. Silakan periksa koneksi Anda.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all border border-blue-400/30 group"
          title="Buka AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Image src="/puri.png" alt="PURI" width={20} height={20} className="w-5 h-5 rounded-full object-contain animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
          </div>
          <span className="text-xs font-bold tracking-wide">AI ASSISTANT</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 opacity-80 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-88 bg-[#161B22] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-blue-500/20 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/puri.png" alt="PURI" width={20} height={20} className="w-5 h-5 rounded-full object-contain" />
          <span className="text-xs font-bold text-white tracking-wider">AI ASSISTANT</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
            READY
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Minimize Assistant"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Tutup Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="p-4 flex flex-col gap-3 max-h-[320px] min-h-[180px] overflow-y-auto scrollbar-thin">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col text-xs ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini AI sedang berpikir...</span>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Quick Suggestion Pills */}
        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-slate-400 font-medium">Saran Pertanyaan:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              disabled={loading}
              onClick={() => handleSend(prompt)}
              className="text-left text-[11px] text-blue-200 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 hover:border-blue-500/40 disabled:opacity-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? 'Memproses dengan Gemini...' : 'Tanyakan apa saja...'}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </form>
      </div>
    </div>
  );
}
