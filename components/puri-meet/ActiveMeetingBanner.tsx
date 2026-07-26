'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Video, Users, Clock, Copy, Check, Share2 } from 'lucide-react';
import type { Meeting } from '@/domain/puriMeet';
import { PuriMeetService } from '@/services/puriMeetService';

interface ActiveMeetingBannerProps {
  meeting: Meeting;
  onJoin: (meeting: Meeting) => void;
}

export function ActiveMeetingBanner({ meeting, onJoin }: ActiveMeetingBannerProps) {
  const startedTime = meeting.startedAt 
    ? new Date(meeting.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : new Date(meeting.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const [copied, setCopied] = useState(false);
  const guestUrl = `https://meet.jit.si/${meeting.roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareWA = () => {
    const text = PuriMeetService.generateOfficialInvitationMessage(meeting, guestUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden relative"
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center relative shrink-0">
          <span className="animate-ping absolute w-full h-full rounded-full bg-red-400 opacity-40" />
          <Video className="w-6 h-6 text-red-500" />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white tracking-widest uppercase">
              LIVE SEKARANG
            </span>
            <span className="text-xs text-red-300 font-medium">{meeting.bidang}</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">{meeting.title}</h2>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              Dimulai {startedTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-400" />
              {meeting.participantCount} / {meeting.maxParticipants} Peserta
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleCopyLink}
          className="px-4 py-3 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin'}</span>
        </button>
        <button
          onClick={handleShareWA}
          className="px-4 py-3 rounded-lg text-sm font-semibold bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all flex items-center justify-center gap-2"
          title="Bagikan via WhatsApp"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
        <button
          onClick={() => onJoin(meeting)}
          className="px-6 py-3 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Gabung Meeting
        </button>
      </div>
    </motion.div>
  );
}
