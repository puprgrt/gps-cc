import React from 'react';
import { SPMSMetrics } from '@/domain/spms';
import { Users, Clock, Zap, MessageCircle, AlertTriangle, FileCheck, BrainCircuit, Activity, BarChart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: { value: number; isGood: boolean };
  colorClass: string;
}

function KPICard({ label, value, subValue, icon, trend, colorClass }: KPICardProps) {
  return (
    <div className="glass-card p-4 flex flex-col relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
      <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20", colorClass.replace('text-', 'bg-'))} />
      
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white/5", colorClass)}>
          {icon}
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5", trend.isGood ? "text-emerald-400" : "text-red-400")}>
            {trend.value > 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white font-mono leading-none">{value}</span>
        {subValue && <span className="text-[10px] text-slate-400 mt-1">{subValue}</span>}
      </div>
      
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">{label}</h3>
    </div>
  );
}

export function KPIOverviewGrid({ metrics }: { metrics: SPMSMetrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card h-32 animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  // Calculate NPS properly for display if not explicitly provided
  const calculateSentimentScore = () => {
    const total = metrics.sentimentPositif + metrics.sentimentNetral + metrics.sentimentNegatif;
    if (total === 0) return 0;
    return Math.round((metrics.sentimentPositif / total) * 100);
  };

  const kpis = [
    {
      label: 'Indeks Kepuasan (IKM)',
      value: metrics.ikm.toFixed(1),
      subValue: metrics.ikmLabel,
      icon: <Users className="w-4 h-4" />,
      colorClass: 'text-blue-400',
      trend: { value: 2.4, isGood: true }
    },
    {
      label: 'Kepatuhan SLA',
      value: `${metrics.slaCompliance}%`,
      subValue: `${metrics.slaOnTime} Tepat Waktu`,
      icon: <FileCheck className="w-4 h-4" />,
      colorClass: 'text-emerald-400',
      trend: { value: 1.2, isGood: true }
    },
    {
      label: 'First Response Time',
      value: `${metrics.firstResponseTime}m`,
      subValue: 'Rata-rata respons awal',
      icon: <Zap className="w-4 h-4" />,
      colorClass: 'text-yellow-400',
      trend: { value: -0.5, isGood: true } // Lower is better
    },
    {
      label: 'Resolution Time',
      value: `${metrics.resolutionTime}j`,
      subValue: 'Rata-rata penyelesaian',
      icon: <Clock className="w-4 h-4" />,
      colorClass: 'text-orange-400',
      trend: { value: -1.2, isGood: true }
    },
    {
      label: 'AI Response Rate',
      value: `${metrics.aiResponseRate}%`,
      subValue: 'Ditangani otomatis',
      icon: <BrainCircuit className="w-4 h-4" />,
      colorClass: 'text-purple-400',
      trend: { value: 4.5, isGood: true }
    },
    {
      label: 'Human Intervention',
      value: `${metrics.humanInterventionRate}%`,
      subValue: 'Eskalasi ke operator',
      icon: <Activity className="w-4 h-4" />,
      colorClass: 'text-rose-400',
      trend: { value: -4.5, isGood: true }
    },
    {
      label: 'Knowledge Accuracy',
      value: `${metrics.knowledgeAccuracy}%`,
      subValue: 'Akurasi jawaban AI',
      icon: <CheckCircle2 className="w-4 h-4" />,
      colorClass: 'text-teal-400',
      trend: { value: 1.8, isGood: true }
    },
    {
      label: 'Sentimen Positif',
      value: `${calculateSentimentScore()}%`,
      subValue: `${metrics.sentimentPositif} ulasan positif`,
      icon: <MessageCircle className="w-4 h-4" />,
      colorClass: 'text-sky-400',
      trend: { value: 3.2, isGood: true }
    },
    {
      label: 'Net Promoter Score',
      value: metrics.nps,
      subValue: 'Skala -100 ke 100',
      icon: <BarChart className="w-4 h-4" />,
      colorClass: 'text-indigo-400',
      trend: { value: 5, isGood: true }
    },
    {
      label: 'Penyelesaian Pengaduan',
      value: `${metrics.complaintResolutionRate}%`,
      subValue: `${metrics.resolvedComplaints}/${metrics.totalComplaints} Selesai`,
      icon: <AlertTriangle className="w-4 h-4" />,
      colorClass: 'text-pink-400',
      trend: { value: 2.1, isGood: true }
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, idx) => (
        <KPICard key={idx} {...kpi} />
      ))}
    </div>
  );
}
