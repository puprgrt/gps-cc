'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Users, Video, ExternalLink, X as XIcon, AlertTriangle, Copy, Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Meeting } from '@/domain/puriMeet';
import { MEETING_TYPE_LABELS, MEETING_STATUS_LABELS, MEETING_PRIORITY_LABELS } from '@/domain/puriMeet';
import { PuriMeetService } from '@/services/puriMeetService';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin?: (meeting: Meeting) => void;
  onCancel?: (meeting: Meeting) => void;
  className?: string;
}

const STATUS_STYLES: Record<Meeting['status'], string> = {
  SCHEDULED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  LIVE: 'bg-red-500/15 text-red-400 border-red-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const PRIORITY_STYLES: Record<Meeting['priority'], string> = {
  NORMAL: '',
  PENTING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  MENDESAK: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function MeetingCard({ meeting, onJoin, onCancel, className }: MeetingCardProps) {
  const scheduledDate = new Date(meeting.scheduledAt);
  const timeStr = scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = scheduledDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const isLive = meeting.status === 'LIVE';
  const isScheduled = meeting.status === 'SCHEDULED';
  const isCancelled = meeting.status === 'CANCELLED';

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-4 hover:border-white/20 transition-all duration-300 group',
        isLive && 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
        isCancelled && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          {/* Status + Priority badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider',
              STATUS_STYLES[meeting.status]
            )}>
              {isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
              )}
              {MEETING_STATUS_LABELS[meeting.status]}
            </span>

            {meeting.priority !== 'NORMAL' && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                PRIORITY_STYLES[meeting.priority]
              )}>
                <AlertTriangle className="w-3 h-3" />
                {MEETING_PRIORITY_LABELS[meeting.priority]}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={cn(
            'text-sm font-semibold text-white mb-1 truncate',
            isCancelled && 'line-through text-slate-400'
          )}>
            {meeting.title}
          </h3>

          {/* Type */}
          <p className="text-xs text-slate-400 mb-3">
            {MEETING_TYPE_LABELS[meeting.type]}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {dateStr} • {timeStr}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {meeting.participantCount} peserta
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
              ID: <strong className="text-blue-400">{meeting.meetingIdDisplay || '849 203 1192'}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
              Passcode: <strong className="text-emerald-400">{meeting.passcode || '789123'}</strong>
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {(isLive || isScheduled) && onJoin && (
            <button
              onClick={() => onJoin(meeting)}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                isLive
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isLive ? 'Gabung' : 'Mulai'}
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Link'}
            </button>
            <button
              onClick={handleShareWA}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
              title="Bagikan via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              WA
            </button>
          </div>

          {isScheduled && onCancel && (
            <button
              onClick={() => onCancel(meeting)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
              Batal
            </button>
          )}
        </div>
      </div>

      {/* Agenda preview */}
      {meeting.agenda.length > 0 && !isCancelled && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Agenda</p>
          <ul className="space-y-1">
            {meeting.agenda.slice(0, 3).map((item, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
            {meeting.agenda.length > 3 && (
              <li className="text-[10px] text-slate-500">
                +{meeting.agenda.length - 3} agenda lainnya
              </li>
            )}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
