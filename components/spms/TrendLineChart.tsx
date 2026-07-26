import React from 'react';
import { SPMSTrendPoint } from '@/domain/spms';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function TrendLineChart({ data }: { data: SPMSTrendPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="glass-card p-6 h-full animate-pulse bg-white/5" />;
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Tren Performa (12 Bulan Terakhir)
        </h2>
      </div>

      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="period" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              yAxisId="left"
              domain={[60, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(val) => `${val}%`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              hide
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" iconSize={6} />
            
            <Line yAxisId="left" type="monotone" dataKey="sla" name="SLA Compliance" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line yAxisId="left" type="monotone" dataKey="ikm" name="Indeks Kepuasan" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line yAxisId="left" type="monotone" dataKey="sentiment" name="Sentimen Positif" stroke="#eab308" strokeWidth={2} dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
