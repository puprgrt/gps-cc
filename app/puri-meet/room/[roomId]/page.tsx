'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePuriMeetStore } from '@/hooks/usePuriMeet';
import { MeetingRoom } from '@/components/puri-meet/MeetingRoom';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, MessageSquare, FileText, Mic, Info } from 'lucide-react';
import { MeetingParticipants } from '@/components/puri-meet/MeetingParticipants';
import { MeetingChat } from '@/components/puri-meet/MeetingChat';
import { MeetingFileShare } from '@/components/puri-meet/MeetingFileShare';
import { MeetingTranscription } from '@/components/puri-meet/MeetingTranscription';
import { PuriMeetService } from '@/services/puriMeetService';
import type { MeetingParticipant } from '@/domain/puriMeet';
import { cn } from '@/lib/utils';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const { activeMeeting, loadMeetingByRoomId, endMeeting } = usePuriMeetStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'files' | 'transcript'>('info');
  const [isEnding, setIsEnding] = useState(false);

  // TODO: Use real auth session
  const currentUser = {
    name: 'Operator PUPR (Host)',
    email: 'operator@pupr.garutkab.go.id'
  };

  useEffect(() => {
    async function initRoom() {
      setIsLoading(true);
      const meeting = await loadMeetingByRoomId(roomId);
      
      if (!meeting) {
        setError('Meeting room tidak ditemukan atau sudah kadaluarsa.');
      } else {
        // Fetch participants for sidebar
        const parts = await PuriMeetService.fetchParticipants(meeting.id);
        setParticipants(parts);
        
        // Auto add self as HOST if not exists
        if (!parts.some(p => p.userName === currentUser.name)) {
          await PuriMeetService.addParticipant(meeting.id, currentUser.name, currentUser.email, 'HOST');
        }
      }
      setIsLoading(false);
    }

    if (roomId) {
      initRoom();
    }
  }, [roomId, loadMeetingByRoomId, currentUser.name, currentUser.email]);

  const handleLeave = () => {
    router.push('/puri-meet');
  };

  const handleEndMeeting = async () => {
    if (!activeMeeting) return;
    const confirmed = window.confirm('Apakah Anda yakin ingin mengakhiri meeting ini untuk semua peserta?');
    if (!confirmed) return;

    try {
      setIsEnding(true);
      await endMeeting(activeMeeting.id);
      router.push('/puri-meet');
    } catch (err) {
      console.error('Failed to end meeting:', err);
      alert('Gagal mengakhiri meeting.');
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Menyiapkan ruang meeting...</p>
      </div>
    );
  }

  if (error || !activeMeeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500 opacity-80" />
        <h2 className="text-xl font-bold text-white">Akses Ditolak</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => router.push('/puri-meet')}
          className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Admin/Operator entering via this dashboard page is ALWAYS the HOST
  const isHost = true;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative">
      {/* Header */}
      <header className="h-14 bg-black/60 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Keluar Ruangan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">{activeMeeting.title}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                HOST / MODERATOR
              </span>
            </div>
            <span className="text-[10px] text-blue-400">{activeMeeting.bidang}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://meet.jit.si/${activeMeeting.roomId}#userInfo.displayName="${encodeURIComponent('Operator PUPR (Host)')}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 transition-colors"
            title="Buka Ruangan Jitsi di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Jitsi
          </a>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              isSidebarOpen ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 hover:text-white"
            )}
          >
            Info & Peserta
          </button>
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            title="Akhiri Meeting untuk Semua Peserta"
          >
            {isEnding ? 'Mengakhiri...' : 'Akhiri Meeting'}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Jitsi IFrame Area */}
        <div className="flex-1 bg-black relative">
          <MeetingRoom
            meeting={activeMeeting}
            userName={currentUser.name}
            userEmail={currentUser.email}
            isHost={isHost}
            onLeave={handleLeave}
          />
        </div>

        {/* Sidebar Info & Participants */}
        {isSidebarOpen && isHost && (
          <div className="w-[340px] bg-black/80 border-l border-white/10 flex flex-col shrink-0">
            {/* Tabs Header */}
            <div className="flex items-center p-2 gap-1 border-b border-white/10 bg-slate-900/50">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors",
                  activeTab === 'info' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Info className="w-4 h-4 mb-1" />
                Info
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors",
                  activeTab === 'chat' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <MessageSquare className="w-4 h-4 mb-1" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors",
                  activeTab === 'files' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <FileText className="w-4 h-4 mb-1" />
                File
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors",
                  activeTab === 'transcript' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Mic className="w-4 h-4 mb-1" />
                Notulen
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'info' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  {/* Agenda section */}
                  {activeMeeting.agenda.length > 0 && (
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agenda</h3>
                      <ul className="space-y-2">
                        {activeMeeting.agenda.map((item, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Notes section */}
                  {activeMeeting.description && (
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan</h3>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{activeMeeting.description}</p>
                    </div>
                  )}

                  {/* Participants Component */}
                  <div className="p-4 flex-1">
                    <MeetingParticipants participants={participants} />
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex-1 p-2">
                  <MeetingChat
                    meetingId={activeMeeting.id}
                    userName={currentUser.name}
                    userRole="HOST"
                    className="h-full border-none rounded-none"
                  />
                </div>
              )}

              {activeTab === 'files' && (
                <div className="flex-1 p-2">
                  <MeetingFileShare
                    meetingId={activeMeeting.id}
                    userName={currentUser.name}
                    userRole="HOST"
                    className="h-full border-none rounded-none"
                  />
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="flex-1 p-2">
                  <MeetingTranscription
                    meetingId={activeMeeting.id}
                    userName={currentUser.name}
                    userRole="HOST"
                    className="h-full border-none rounded-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
