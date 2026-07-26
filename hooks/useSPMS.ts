import { create } from 'zustand';
import { SPMSService } from '@/services/spmsService';
import type { SPMSDashboardState, SPMSPeriod, LayananType } from '@/domain/spms';
import type { BidangPUPR } from '@/domain/aiRouting';

interface SPMSStore extends SPMSDashboardState {
  fetchDashboardData: () => Promise<void>;
  setFilterPeriod: (period: SPMSPeriod) => void;
  setFilterBidang: (bidang: BidangPUPR | 'ALL') => void;
  setFilterLayanan: (layanan: LayananType | 'ALL') => void;
}

const initialState: Omit<SPMSDashboardState, 'fetchDashboardData' | 'setFilterPeriod' | 'setFilterBidang' | 'setFilterLayanan'> = {
  metrics: null,
  sss: null,
  bidangPerformance: [],
  operatorPerformance: [],
  aiPerformance: null,
  surveyResults: null,
  earlyWarnings: [],
  recommendations: [],
  heatmapData: [],
  trendData: [],
  insights: [],
  topOperators: [],
  topBidang: [],
  filters: {
    period: 'MONTH',
    bidang: 'ALL',
    layanan: 'ALL',
  },
  isLoading: true,
  error: null,
};

export const useSPMS = create<SPMSStore>((set, get) => ({
  ...initialState,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      
      const [
        metrics,
        bidangPerformance,
        operatorPerformance,
        aiPerformance,
        surveyResults,
        earlyWarnings,
        recommendations,
        heatmapData,
        trendData,
        insights
      ] = await Promise.all([
        SPMSService.getMetrics(filters.period),
        SPMSService.getBidangPerformance(),
        SPMSService.getOperatorPerformance(),
        SPMSService.getAIPerformance(),
        SPMSService.getSurveyResultsSummary(),
        SPMSService.getEarlyWarnings(),
        SPMSService.getAIRecommendations(),
        SPMSService.getHeatmapData(),
        SPMSService.getTrendData(),
        SPMSService.getInsights(),
      ]);

      let sss = null;
      if (metrics) {
        sss = {
          ...SPMSService.calculateSmartServiceScore(metrics),
          previousScore: 82.5, // Mock previous score
          trend: 5.4,          // Mock trend
          calculatedAt: new Date().toISOString()
        };
      }
      
      // Calculate top performers
      const topOperators = operatorPerformance
        .slice(0, 3)
        .map(op => ({
          id: op.id,
          name: op.name,
          bidang: op.bidang,
          bidangLabel: op.bidangLabel,
          avatarUrl: op.avatarUrl,
          metric: 'Tiket Selesai',
          value: op.jumlahSelesai.toString(),
          rank: op.rank,
          achievement: `Menyelesaikan ${op.jumlahSelesai} tiket dengan rating ${op.tingkatKepuasan}%`
        }));
        
      const topBidang = bidangPerformance
        .sort((a, b) => b.nilaiKepuasan - a.nilaiKepuasan)
        .slice(0, 3)
        .map((b, i) => ({
          id: b.id,
          name: b.bidangLabel,
          bidang: b.bidang,
          bidangLabel: b.bidangLabel,
          metric: 'Nilai Kepuasan',
          value: b.nilaiKepuasan.toString() + '%',
          rank: i + 1,
          achievement: `SLA Compliance ${b.slaCompliance}%`
        }));

      set({
        metrics,
        sss,
        bidangPerformance,
        operatorPerformance,
        aiPerformance,
        surveyResults,
        earlyWarnings,
        recommendations,
        heatmapData,
        trendData,
        insights,
        topOperators,
        topBidang,
        isLoading: false
      });
    } catch (error: any) {
      console.error("Error fetching SPMS dashboard data:", error);
      set({ error: error.message || 'Gagal memuat data SPMS', isLoading: false });
    }
  },

  setFilterPeriod: (period) => {
    set((state) => ({ filters: { ...state.filters, period } }));
    get().fetchDashboardData();
  },

  setFilterBidang: (bidang) => {
    set((state) => ({ filters: { ...state.filters, bidang } }));
    // In a real app with backend filtering, we'd refetch here.
    // For now, client-side filtering can be done on the components if needed, 
    // or we fetch everything and filter on the server.
  },

  setFilterLayanan: (layanan) => {
    set((state) => ({ filters: { ...state.filters, layanan } }));
  },
}));
