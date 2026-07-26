'use client';

import React from 'react';
import { Users, Shield, User } from 'lucide-react';
import type { MeetingParticipant } from '@/domain/puriMeet';

interface MeetingParticipantsProps {
  participants: MeetingParticipant[];
}

export function MeetingParticipants({ participants }: MeetingParticipantsProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Daftar Peserta ({participants.length})</h3>
      </div>

      <div className="space-y-2">
        {participants.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Belum ada peserta yang mendaftar</p>
        ) : (
          participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-400">
                  {p.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{p.userName}</p>
                {p.userEmail && <p className="text-[10px] text-slate-400 truncate">{p.userEmail}</p>}
              </div>

              {p.role === 'HOST' ? (
                <span title="Host"><Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" /></span>
              ) : p.role === 'MODERATOR' ? (
                <span title="Moderator"><Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" /></span>
              ) : (
                <span title="Participant"><User className="w-3.5 h-3.5 text-slate-500 shrink-0" /></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
