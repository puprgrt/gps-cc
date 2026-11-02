'use client';

import React from 'react';
import { 
  FileText, 
  Send, 
  UserCheck, 
  ClipboardCheck, 
  Calculator, 
  PenTool, 
  Award, 
  CheckCircle2, 
  Star, 
  DownloadCloud,
  Check,
  Clock,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { StatusPermohonan } from '@/sipeka/types';
import { WORKFLOW_10_STAGES, WorkflowStageMeta } from '@/sipeka/constants/idds';
import { cn } from '@/lib/utils';

interface WorkflowStepperProps {
  currentStatus: StatusPermohonan;
  onSelectStage?: (stage: WorkflowStageMeta) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Send,
  UserCheck,
  ClipboardCheck,
  Calculator,
  PenTool,
  Award,
  CheckCircle2,
  Star,
  DownloadCloud,
};

export function WorkflowStepper({ currentStatus, onSelectStage, className }: WorkflowStepperProps) {
  // Tentukan nomor tahapan saat ini (1 s/d 10)
  const currentStageMeta = WORKFLOW_10_STAGES.find((s) => s.status === currentStatus);
  const currentStageNum = currentStageMeta?.stageNumber ?? 1;

  return (
    <div className={cn("w-full bg-[#0A111F]/90 border border-[#F2A900]/20 rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-md", className)}>
      {/* Header Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#F2A900]/20 text-[#F2A900] border border-[#F2A900]/30">
              Standar SPBE & IDDS
            </span>
            <span className="text-xs text-slate-400">Bidang Bangunan Gedung</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Alur Kerja 10 Tahap Penilaian Kerusakan BG</h3>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs text-slate-400">Posisi Berkas Saat Ini</div>
          <div className="text-sm font-semibold text-[#F2A900]">
            Tahap {currentStageNum} dari 10: {currentStageMeta?.label || 'Dalam Proses'}
          </div>
        </div>
      </div>

      {/* Stepper Grid / Horizontal List */}
      <div className="relative">
        {/* Progress Bar Line (Desktop) */}
        <div className="hidden lg:block absolute top-7 left-8 right-8 h-1 bg-slate-800 -z-0">
          <div 
            className="h-full bg-gradient-to-r from-[#F2A900] via-emerald-500 to-[#F2A900] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(((currentStageNum - 1) / 9) * 100, 100)}%` }}
          />
        </div>

        {/* 10 Step Items */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-2 relative z-10">
          {WORKFLOW_10_STAGES.map((stage) => {
            const isCompleted = stage.stageNumber < currentStageNum || currentStatus === 'SELESAI';
            const isCurrent = stage.stageNumber === currentStageNum && currentStatus !== 'SELESAI';
            const isLocked = stage.stageNumber > currentStageNum;
            const IconComponent = ICON_MAP[stage.iconName] || FileText;

            return (
              <button
                key={stage.stageNumber}
                type="button"
                onClick={() => onSelectStage?.(stage)}
                className={cn(
                  "group flex flex-col items-center text-center p-2.5 rounded-xl transition-all duration-200 border",
                  isCurrent && "bg-[#0A2540] border-[#F2A900] shadow-lg shadow-[#F2A900]/10 scale-105",
                  isCompleted && "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60",
                  isLocked && "bg-slate-900/40 border-white/5 opacity-60 hover:opacity-80"
                )}
              >
                {/* Circle Icon Indicator */}
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs transition-all relative mb-2 shadow-md",
                  isCompleted && "bg-emerald-600 text-white shadow-emerald-500/20",
                  isCurrent && "bg-[#F2A900] text-[#0A2540] ring-4 ring-[#F2A900]/30 shadow-[#F2A900]/40 animate-pulse",
                  isLocked && "bg-slate-800 text-slate-400 border border-white/10"
                )}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <IconComponent className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <span>{stage.stageNumber}</span>
                  )}

                  {/* Lock Indicator for Step 9/10 if locked */}
                  {isLocked && stage.stageNumber >= 9 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                    </span>
                  )}
                </div>

                {/* Stage Info */}
                <div className="w-full">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider block",
                    isCurrent && "text-[#F2A900]",
                    isCompleted && "text-emerald-400",
                    isLocked && "text-slate-500"
                  )}>
                    T-{stage.stageNumber}
                  </span>
                  <p className={cn(
                    "text-xs font-semibold leading-tight line-clamp-2 mt-0.5",
                    isCurrent && "text-white font-bold",
                    isCompleted && "text-slate-200",
                    isLocked && "text-slate-400"
                  )}>
                    {stage.label}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1 truncate">
                    {stage.actorLabel.split('/')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

