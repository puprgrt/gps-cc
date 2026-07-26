'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, FileText, Check } from 'lucide-react';
import { PuriMeetTranscriptionService } from '@/services/puriMeetTranscriptionService';
import { cn } from '@/lib/utils';
import type { ParticipantRole } from '@/domain/puriMeet';

interface MeetingTranscriptionProps {
  meetingId: string;
  userName: string;
  userRole: ParticipantRole;
  className?: string;
}

export function MeetingTranscription({ meetingId, userName, userRole, className }: MeetingTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Gagal mengakses mikrofon. Pastikan Anda memberikan izin.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const result = await PuriMeetTranscriptionService.transcribeAudio(audioBlob);
      setTranscriptionText(prev => prev + (prev ? '\n\n' : '') + result.text);
    } catch (err: any) {
      setError(err.message || 'Gagal mentranskripsi audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyText = () => {
    if (!transcriptionText) return;
    navigator.clipboard.writeText(transcriptionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/10", className)}>
      
      {/* Controls */}
      <div className="p-4 border-b border-white/10 bg-slate-950 flex flex-col items-center justify-center">
        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/50 rounded-full font-medium transition-colors animate-pulse"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Hentikan Perekaman</span>
          </button>
        ) : (
          <button
            onClick={handleStartRecording}
            disabled={isTranscribing}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-white/10 rounded-full font-medium transition-colors disabled:opacity-50"
          >
            <Mic className="w-5 h-5" />
            <span>Mulai Transkripsi (Notulen)</span>
          </button>
        )}

        {isTranscribing && (
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sedang memproses audio ke teks...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm w-full">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Result Display */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {!transcriptionText && !isTranscribing && !isRecording && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <FileText className="w-12 h-12 opacity-20" />
            <p className="text-sm text-center">Belum ada hasil transkripsi.<br/>Klik tombol rekam untuk mulai membuat notulen otomatis.</p>
          </div>
        )}

        {transcriptionText && (
          <div className="prose prose-invert max-w-none text-sm text-slate-300 whitespace-pre-wrap">
            {transcriptionText}
          </div>
        )}

        {transcriptionText && (
          <button
            onClick={handleCopyText}
            className="absolute top-4 right-4 p-2 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white rounded-lg shadow-lg transition-colors flex items-center gap-2 text-xs font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <FileText className="w-4 h-4" />}
            {copied ? 'Disalin' : 'Salin Text'}
          </button>
        )}
      </div>
    </div>
  );
}
