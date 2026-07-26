'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  User,
  BarChart2,
  Award,
  Users,
} from 'lucide-react';
import type { PSICReputationIndex } from '@/domain/psic';

export function SocialKPI() {
  const [reputation, setReputation] = useState<PSICReputationIndex | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadReputation() {
      try {
        const res = await fetch('/api/psic/omnichannel');
        const json = await res.json();
        if (mounted && json?.data?.reputation) {
          setReputation(json.data.reputation);
        }
      } catch {
        // Abaikan error jaringan jika offline
      }
    }
    loadReputation();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    {
      title: 'Reputasi Digital AI',
      value: `${reputation?.score?.toFixed(1) || '88.5'} / 100`,
      icon: Award,
      color: 'text-amber-400',
      border: 'border-amber-500/30 bg-amber-500/10',
    },
    {
      title: 'Mention Hari Ini',
      value: `${reputation?.totalConversations || '142'}`,
      icon: MessageSquare,
      color: 'text-blue-400',
    },
    {
      title: 'AI Auto Resolved',
      value: `${reputation?.totalResolvedByAI || '115'}`,
      icon: Bot,
      color: 'text-purple-400',
    },
    {
      title: 'Manual Operator',
      value: `${reputation?.totalResolvedByOperator || '27'}`,
      icon: User,
      color: 'text-orange-400',
    },
    {
      title: 'Kepatuhan SLA',
      value: `${reputation?.slaComplianceRate?.toFixed(1) || '96.2'}%`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      title: 'Sentimen Positif',
      value: `${reputation?.positivePercentage?.toFixed(1) || '78.0'}%`,
      icon: BarChart2,
      color: 'text-green-400',
    },
    {
      title: 'Sentimen Negatif',
      value: `${reputation?.negativePercentage?.toFixed(1) || '8.0'}%`,
      icon: AlertCircle,
      color: 'text-red-400',
    },
    {
      title: 'Response Time AI',
      value: '1s 45ms',
      icon: Clock,
      color: 'text-teal-400',
    },
    {
      title: 'Operator Bidang',
      value: '7 Bidang',
      icon: Users,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 mb-6">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`border rounded-xl p-3 flex flex-col justify-center items-center text-center transition-all ${
            kpi.border || 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/90'
          }`}
        >
          <kpi.icon className={`w-5 h-5 mb-1.5 ${kpi.color}`} />
          <span className="text-lg font-bold text-white tracking-tight">{kpi.value}</span>
          <span className="text-[11px] text-slate-300 mt-1 leading-tight font-medium">
            {kpi.title}
          </span>
        </div>
      ))}
    </div>
  );
}
