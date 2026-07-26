'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PuriMeetService } from '@/services/puriMeetService';
import { MeetingRoom } from '@/components/puri-meet/MeetingRoom';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Meeting } from '@/domain/puriMeet';

export default function GuestMeetingRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guest details with localStorage persistence
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`puri_meet_name_${roomId}`) || '';
    }
    return '';
  });
  const [hasJoined, setHasJoined] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem(`puri_meet_name_${roomId}`);
      const savedJoined = localStorage.getItem(`puri_meet_joined_${roomId}`);
      return Boolean(savedName && savedJoined === 'true');
    }
    return false;
  });

  const handleConfirmJoin = () => {
    const trimmed = guestName.trim();
    if (!trimmed) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`puri_meet_name_${roomId}`, trimmed);
      localStorage.setItem(`puri_meet_joined_${roomId}`, 'true');
    }
    setHasJoined(true);
  };

  useEffect(() => {
    async function initRoom() {
      setIsLoading(true);
      try {
        // Try fetching from DB by room ID directly
        let match = await PuriMeetService.fetchMeetingByRoomId(roomId);

        // If not found in DB (e.g. dynamic link or un-synced meeting), fallback gracefully to room ID
        if (!match) {
          match = {
            id: roomId,
            title: 'Diskusi & Konsultasi Online PUPR Garut',
            type: 'PENDAMPINGAN_MASYARAKAT',
            status: 'LIVE',
            priority: 'NORMAL',
            roomId: roomId,
            description: 'Ruang Pertemuan Online Pelayanan Publik Dinas PUPR Garut',
            scheduledAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            endedAt: null,
            durationMinutes: 60,
            bidang: 'LINTAS_BIDANG',
            createdBy: 'system',
            createdByName: 'Dinas PUPR Garut',
            maxParticipants: 50,
            participantCount: 1,
            agenda: ['Konsultasi & Pendampingan Pelayanan Publik'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        setMeeting(match);
      } catch (err) {
        console.error('Error loading guest room:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (roomId) {
      initRoom();
    }
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black gap-4 text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Menyiapkan ruang meeting...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black gap-4 text-white">
        <AlertCircle className="w-12 h-12 text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black text-white p-4">
        <div className="glass-card modal-container-sm p-8 border border-white/10 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
            <p className="text-sm text-slate-400">{meeting.bidang}</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Masukkan Nama Anda</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleConfirmJoin}
            disabled={!guestName.trim()}
            className="w-full py-3 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            Masuk ke Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      <MeetingRoom
        meeting={meeting}
        userName={guestName.trim()}
        userEmail=""
        isHost={false}
        onLeave={() => window.location.reload()}
      />
    </div>
  );
}
