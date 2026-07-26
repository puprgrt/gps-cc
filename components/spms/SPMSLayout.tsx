import React from 'react';
import { useSPMS } from '@/hooks/useSPMS';
import { DashboardFilters } from './DashboardFilters';
import { AITicker } from './AITicker';
import { KPIOverviewGrid } from './KPIOverviewGrid';
import { SmartServiceScoreCard } from './SmartServiceScoreCard';
import { BidangPerformanceTable } from './BidangPerformanceTable';
import { OperatorLeaderboard } from './OperatorLeaderboard';
import { SLAComplianceChart } from './SLAComplianceChart';
import { SentimentGauge } from './SentimentGauge';
import { NPSScoreCard } from './NPSScoreCard';
import { SurveyOverview } from './SurveyOverview';
import { AIPerformanceCard } from './AIPerformanceCard';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { TrendLineChart } from './TrendLineChart';
import { EarlyWarningTicker } from './EarlyWarningTicker';
import { AIRecommendationsPanel } from './AIRecommendationsPanel';

export function SPMSLayout() {
  const store = useSPMS();

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-bg-dark w-full max-w-[1600px] mx-auto">
      
      {/* 1. Header & Filters */}
      <div className="flex flex-col gap-3">
        <AITicker insights={store.insights} />
        <DashboardFilters 
          period={store.filters.period}
          bidang={store.filters.bidang}
          layanan={store.filters.layanan}
          onPeriodChange={store.setFilterPeriod}
          onBidangChange={store.setFilterBidang}
          onLayananChange={store.setFilterLayanan}
        />
      </div>

      {/* 2. Top Level: KPI Overview */}
      <KPIOverviewGrid metrics={store.metrics} />

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column (Wide) - Core Performance */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[300px]">
            <div className="lg:col-span-1">
              <SmartServiceScoreCard sss={store.sss} />
            </div>
            <div className="lg:col-span-2">
              <TrendLineChart data={store.trendData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[320px]">
            <BidangPerformanceTable data={store.bidangPerformance} />
            <SLAComplianceChart data={store.bidangPerformance} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[250px]">
            <SentimentGauge metrics={store.metrics} />
            <NPSScoreCard metrics={store.metrics} />
            <SurveyOverview survey={store.surveyResults} />
          </div>

          <div className="h-[400px]">
            <PerformanceHeatmap data={store.heatmapData} />
          </div>

        </div>

        {/* Right Column (Narrow) - AI & People Ops */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          <div className="h-auto max-h-[300px] overflow-y-auto custom-scrollbar">
            <EarlyWarningTicker warnings={store.earlyWarnings} />
          </div>

          <div className="h-[280px]">
            <AIPerformanceCard ai={store.aiPerformance} />
          </div>

          <div className="flex-1 min-h-[300px]">
            <AIRecommendationsPanel recommendations={store.recommendations} />
          </div>

          <div className="h-[350px]">
            <OperatorLeaderboard operators={store.operatorPerformance} />
          </div>

        </div>
      </div>
    </div>
  );
}
