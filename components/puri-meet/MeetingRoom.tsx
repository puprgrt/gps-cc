'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PuriMeetService } from '@/services/puriMeetService';
import type { Meeting } from '@/domain/puriMeet';
import { Video, VideoOff, ExternalLink, RefreshCw, Users, Clock, Shield } from 'lucide-react';

interface MeetingRoomProps {
  meeting: Meeting;
  userName: string;
  userEmail: string;
  isHost?: boolean;
  onLeave: () => void;
}

/**
 * MeetingRoom component - Uses direct Jitsi URL via IFrame (not External API)
 * to ensure all participants (admin & guest) join the exact same room.
 * 
 * The previous External API embed created isolated demo sessions on meet.jit.si,
 * causing admin and guest to end up in different rooms despite identical roomNames.
 * Using the direct URL approach bypasses this limitation entirely.
 */
export function MeetingRoom({ meeting, userName, userEmail, isHost = false, onLeave }: MeetingRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Build the direct Jitsi meeting URL with config parameters
  const buildJitsiUrl = useCallback((): string => {
    const config = PuriMeetService.getJitsiConfig(
      meeting.roomId,
      userName,
      userEmail,
      meeting.title
    );

    const domain = config.domain;
    const roomName = encodeURIComponent(config.roomName);

    // Build config params as URL hash fragments (Jitsi convention)
    const configParams: string[] = [];

    // User info
    if (userName) {
      configParams.push(`userInfo.displayName="${encodeURIComponent(userName)}"`);
    }
    if (userEmail) {
      configParams.push(`userInfo.email="${encodeURIComponent(userEmail)}"`);
    }

    // Core config overrides
    configParams.push('config.prejoinPageEnabled=false');
    configParams.push('config.startWithAudioMuted=false');
    configParams.push('config.startWithVideoMuted=false');
    configParams.push('config.disableDeepLinking=true');
    configParams.push('config.enableWelcomePage=false');
    configParams.push('config.enableClosePage=false');
    configParams.push('config.disableInviteFunctions=true');

    // Interface config
    configParams.push(`config.subject="${encodeURIComponent(meeting.title)}"`);
    configParams.push('interfaceConfig.APP_NAME=PURI%20Meet');
    configParams.push('interfaceConfig.PROVIDER_NAME=Dinas%20PUPR%20Kab.%20Garut');
    configParams.push('interfaceConfig.MOBILE_APP_PROMO=false');
    configParams.push('interfaceConfig.SHOW_JITSI_WATERMARK=false');
    configParams.push('interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false');
    configParams.push('interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false');
    configParams.push('interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true');

    // Remove admin-only toolbar buttons for non-host
    if (!isHost) {
      configParams.push('config.toolbarButtons=["camera","chat","desktop","fullscreen","hangup","profile","raisehand","videoquality","filmstrip","participants-pane","tileview","select-background","settings"]');
    }

    const hashFragment = configParams.join('&');
    return `https://${domain}/${roomName}#${hashFragment}`;
  }, [meeting.roomId, meeting.title, userName, userEmail, isHost]);

  // Elapsed time tracker
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const jitsiUrl = buildJitsiUrl();

  const handleOpenNewTab = () => {
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setIsLoaded(false);
    setHasError(false);
    if (iframeRef.current) {
      iframeRef.current.src = jitsiUrl;
    }
  };

  // Auto-start meeting status when host joins
  useEffect(() => {
    if (isHost && meeting.status === 'SCHEDULED') {
      PuriMeetService.startMeeting(meeting.id);
    }
  }, [isHost, meeting.id, meeting.status]);

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden relative">
      {/* Compact status bar */}
      <div className="h-9 bg-black/80 border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400">LIVE</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          {isHost && (
            <div className="flex items-center gap-1 text-amber-400">
              <Shield className="w-3 h-3" />
              <span className="text-[10px] font-semibold">HOST</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            title="Muat Ulang Video"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-300 transition-colors text-[10px] font-semibold"
            title="Buka di Tab Baru (Tanpa Batas Waktu)"
          >
            <ExternalLink className="w-3 h-3" />
            Tab Baru
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 top-9 flex flex-col items-center justify-center bg-black/95 z-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg font-medium">Memuat PURI Meet...</p>
          <p className="text-slate-500 text-xs mt-2">Menghubungkan ke ruangan {meeting.roomId.slice(-8)}</p>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 top-9 flex flex-col items-center justify-center bg-black/95 z-20 gap-4">
          <VideoOff className="w-16 h-16 text-red-500/60" />
          <p className="text-white text-lg font-medium">Gagal Memuat Video Conference</p>
          <p className="text-slate-400 text-sm text-center max-w-md">
            Koneksi ke server meeting terputus. Coba muat ulang atau buka di tab baru.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleReload}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Muat Ulang
            </button>
            <button
              onClick={handleOpenNewTab}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Buka di Tab Baru
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Direct URL IFrame */}
      <iframe
        ref={iframeRef}
        src={jitsiUrl}
        className="w-full flex-1 border-0"
        style={{ minHeight: '100%' }}
        allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
