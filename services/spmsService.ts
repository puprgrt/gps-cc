import { supabase } from '@/lib/supabase';
import type {
  SPMSMetrics,
  BidangPerformance,
  OperatorPerformance,
  AIPerformance,
  SurveyResultsSummary,
  EarlyWarning,
  AIRecommendation,
  HeatmapKecamatan,
  SPMSTrendPoint,
  AIInsight,
  TopPerformer,
  SPMSPeriod
} from '@/domain/spms';

/**
 * Service untuk mengambil data SPMS dari Supabase
 */
export class SPMSService {
  
  /**
   * Mengambil 10 KPI Utama
   */
  static async getMetrics(period: SPMSPeriod = 'MONTH'): Promise<SPMSMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('spms_metrics')
        .select('*')
        .eq('period', period)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching SPMS metrics:', error);
        return null;
      }

      if (!data) return null;

      // Transform snake_case from DB to camelCase for Domain Model
      return {
        ikm: data.ikm,
        ikmLabel: data.ikm_label,
        slaCompliance: data.sla_compliance,
        slaOnTime: data.sla_on_time,
        slaAlmostLate: data.sla_almost_late,
        slaLate: data.sla_late,
        slaAvgDays: data.sla_avg_days,
        firstResponseTime: data.first_response_time,
        resolutionTime: data.resolution_time,
        aiResponseRate: data.ai_response_rate,
        humanInterventionRate: data.human_intervention_rate,
        knowledgeAccuracy: data.knowledge_accuracy,
        sentimentPositif: data.sentiment_positif,
        sentimentNetral: data.sentiment_netral,
        sentimentNegatif: data.sentiment_negatif,
        nps: data.nps,
        npsPromoters: data.nps_promoters,
        npsPassives: data.nps_passives,
        npsDetractors: data.nps_detractors,
        complaintResolutionRate: data.complaint_resolution_rate,
        totalComplaints: data.total_complaints,
        resolvedComplaints: data.resolved_complaints,
        period: data.period as SPMSPeriod,
        lastUpdatedAt: data.updated_at
      };
    } catch (err) {
      console.error('Exception in getMetrics:', err);
      return null;
    }
  }

  /**
   * Mengambil Kinerja per Bidang
   */
  static async getBidangPerformance(): Promise<BidangPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('spms_bidang_performance')
        .select('*')
        .order('nilai_kepuasan', { ascending: false });

      if (error) {
        console.error('Error fetching Bidang performance:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        bidang: item.bidang,
        bidangLabel: item.bidang_label,
        jumlahLayanan: item.jumlah_layanan,
        jumlahPengaduan: item.jumlah_pengaduan,
        slaCompliance: item.sla_compliance,
        nilaiKepuasan: item.nilai_kepuasan,
        avgResponseTime: item.avg_response_time,
        avgResolutionTime: item.avg_resolution_time,
        totalPermohonan: item.total_permohonan,
        totalSelesai: item.total_selesai,
        trendBulanan: typeof item.trend_bulanan === 'string' ? JSON.parse(item.trend_bulanan) : item.trend_bulanan
      }));
    } catch (err) {
      console.error('Exception in getBidangPerformance:', err);
      return [];
    }
  }

  /**
   * Mengambil Kinerja per Operator
   */
  static async getOperatorPerformance(): Promise<OperatorPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('spms_operator_performance')
        .select('*')
        .order('rank', { ascending: true });

      if (error) {
        console.error('Error fetching Operator performance:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        bidang: item.bidang,
        bidangLabel: item.bidang_label,
        avatarUrl: item.avatar_url,
        jumlahTiket: item.jumlah_tiket,
        jumlahSelesai: item.jumlah_selesai,
        avgResponseTime: item.avg_response_time,
        avgResolutionTime: item.avg_resolution_time,
        tingkatKepuasan: item.tingkat_kepuasan,
        jumlahKoreksiAI: item.jumlah_koreksi_ai,
        tingkatPemanfaatanAI: item.tingkat_pemanfaatan_ai,
        kepatuhanSOP: item.kepatuhan_sop,
        rank: item.rank
      }));
    } catch (err) {
      console.error('Exception in getOperatorPerformance:', err);
      return [];
    }
  }

  /**
   * Mengambil Performa AI
   */
  static async getAIPerformance(): Promise<AIPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('spms_ai_performance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching AI performance:', error);
        return null;
      }

      if (!data) return null;

      return {
        classificationAccuracy: data.classification_accuracy,
        answerAccuracy: data.answer_accuracy,
        routingSuccessRate: data.routing_success_rate,
        averageConfidence: data.average_confidence,
        autoAnswerRate: data.auto_answer_rate,
        escalationCount: data.escalation_count,
        totalRequests: data.total_requests,
        avgResponseTimeMs: data.avg_response_time_ms,
        kbUtilization: data.kb_utilization,
        userSatisfaction: data.user_satisfaction,
        asqiScore: data.asqi_score
      };
    } catch (err) {
      console.error('Exception in getAIPerformance:', err);
      return null;
    }
  }

  /**
   * Mengambil Rekapitulasi Survei (Dihitung dari raw responses)
   */
  static async getSurveyResultsSummary(): Promise<SurveyResultsSummary | null> {
    try {
      const { data, error } = await supabase
        .from('spms_survey_responses')
        .select('channel, layanan, dimensions, status');

      if (error) {
        console.error('Error fetching Survey responses:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const totalSent = data.length; // Asumsi semua di tabel adalah sent, beberapa completed
      const completed = data.filter(r => r.status === 'COMPLETED');
      const totalCompleted = completed.length;
      
      // Calculate dimensions average
      const dimTotals: Record<string, number> = {};
      const dimCounts: Record<string, number> = {};
      
      completed.forEach(resp => {
        const dims = typeof resp.dimensions === 'string' ? JSON.parse(resp.dimensions) : resp.dimensions;
        if (dims) {
          Object.entries(dims).forEach(([key, val]) => {
            const numVal = Number(val);
            if (!isNaN(numVal)) {
              dimTotals[key] = (dimTotals[key] || 0) + numVal;
              dimCounts[key] = (dimCounts[key] || 0) + 1;
            }
          });
        }
      });

      const dimensions = Object.keys(dimTotals).map(key => ({
        id: key,
        dimensi: key,
        label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        avgScore: dimTotals[key] / dimCounts[key],
        totalResponses: dimCounts[key]
      }));

      // Calculate channel distribution
      const byChannel: any = {};
      const byLayanan: any = {};
      
      data.forEach(r => {
        byChannel[r.channel] = (byChannel[r.channel] || 0) + 1;
        byLayanan[r.layanan] = (byLayanan[r.layanan] || 0) + 1;
      });

      const avgOverall = dimensions.length > 0 
        ? dimensions.reduce((acc, curr) => acc + curr.avgScore, 0) / dimensions.length 
        : 0;

      return {
        totalSent,
        totalCompleted,
        responseRate: totalSent > 0 ? (totalCompleted / totalSent) * 100 : 0,
        dimensions,
        avgOverall,
        byChannel,
        byLayanan
      };
    } catch (err) {
      console.error('Exception in getSurveyResultsSummary:', err);
      return null;
    }
  }

  /**
   * Mengambil Early Warnings aktif
   */
  static async getEarlyWarnings(): Promise<EarlyWarning[]> {
    try {
      const { data, error } = await supabase
        .from('spms_early_warnings')
        .select('*')
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Early Warnings:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        type: item.type as any,
        level: item.level as any,
        title: item.title,
        description: item.description,
        metric: item.metric,
        currentValue: item.current_value,
        threshold: item.threshold,
        affectedBidang: item.affected_bidang as any,
        affectedLayanan: item.affected_layanan as any,
        affectedOperatorId: item.affected_operator_id,
        isAcknowledged: item.is_acknowledged,
        createdAt: item.created_at
      }));
    } catch (err) {
      console.error('Exception in getEarlyWarnings:', err);
      return [];
    }
  }

  /**
   * Mengambil Rekomendasi AI aktif
   */
  static async getAIRecommendations(): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('spms_ai_recommendations')
        .select('*')
        .eq('is_implemented', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI Recommendations:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        category: item.category as any,
        priority: item.priority as any,
        title: item.title,
        description: item.description,
        rationale: item.rationale,
        actionItems: typeof item.action_items === 'string' ? JSON.parse(item.action_items) : item.action_items,
        impact: item.impact,
        relatedBidang: typeof item.related_bidang === 'string' ? JSON.parse(item.related_bidang) : item.related_bidang,
        relatedLayanan: typeof item.related_layanan === 'string' ? JSON.parse(item.related_layanan) : item.related_layanan,
        isImplemented: item.is_implemented,
        createdAt: item.created_at
      }));
    } catch (err) {
      console.error('Exception in getAIRecommendations:', err);
      return [];
    }
  }

  /**
   * Mengambil Data Heatmap Kecamatan
   */
  static async getHeatmapData(): Promise<HeatmapKecamatan[]> {
    try {
      const { data, error } = await supabase
        .from('spms_heatmap_kecamatan')
        .select('*');

      if (error) {
        console.error('Error fetching Heatmap Data:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        lat: Number(item.lat),
        lng: Number(item.lng),
        totalPengaduan: item.total_pengaduan,
        totalPermohonan: item.total_permohonan,
        tingkatKepuasan: item.tingkat_kepuasan,
        sebaranLayanan: typeof item.sebaran_layanan === 'string' ? JSON.parse(item.sebaran_layanan) : item.sebaran_layanan,
        prioritasTindakLanjut: item.prioritas_tindak_lanjut as any
      }));
    } catch (err) {
      console.error('Exception in getHeatmapData:', err);
      return [];
    }
  }

  /**
   * Mengambil Data Trend (Chart)
   */
  static async getTrendData(): Promise<SPMSTrendPoint[]> {
    try {
      const { data, error } = await supabase
        .from('spms_trend_data')
        .select('*')
        .order('created_at', { ascending: true }); // Assume created_at matches chronological order for seeded data

      if (error) {
        console.error('Error fetching Trend Data:', error);
        return [];
      }

      return data.map(item => ({
        period: item.period,
        ikm: item.ikm,
        sla: item.sla,
        nps: item.nps,
        sentiment: item.sentiment,
        complaints: item.complaints,
        permohonan: item.permohonan,
        selesai: item.selesai
      }));
    } catch (err) {
      console.error('Exception in getTrendData:', err);
      return [];
    }
  }

  /**
   * Mengambil AI Insights (Ticker)
   */
  static async getInsights(): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('spms_ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI Insights:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        text: item.text,
        category: item.category as any,
        priority: item.priority as any,
        createdAt: item.created_at
      }));
    } catch (err) {
      console.error('Exception in getInsights:', err);
      return [];
    }
  }

  /**
   * Helper: Menghitung Smart Service Score dari Metrics
   */
  static calculateSmartServiceScore(metrics: SPMSMetrics): {
    totalScore: number;
    grade: import('@/domain/spms').SSSGrade;
    gradeLabel: string;
    components: import('@/domain/spms').SSSComponent[];
  } {
    // Definisi bobot (sesuai constants)
    const weights = {
      kepuasan: 30,
      sla: 20,
      responseSpeed: 15,
      completion: 15,
      aiQuality: 10,
      complaintHandling: 5,
      sentiment: 5
    };

    // Helper normalisasi
    const normalizeMinutes = (val: number) => Math.max(0, 100 - (val / 60) * 10); // Asumsi 1 jam response = 90, 6 jam = 0
    const normalizeRate = (val: number) => Math.min(100, Math.max(0, val));
    
    const scores = {
      kepuasan: normalizeRate(metrics.ikm),
      sla: normalizeRate(metrics.slaCompliance),
      responseSpeed: normalizeMinutes(metrics.firstResponseTime),
      completion: normalizeRate((metrics.slaOnTime / (metrics.slaOnTime + metrics.slaLate)) * 100 || 0),
      aiQuality: normalizeRate(metrics.knowledgeAccuracy),
      complaintHandling: normalizeRate(metrics.complaintResolutionRate),
      sentiment: normalizeRate((metrics.sentimentPositif / (metrics.sentimentPositif + metrics.sentimentNegatif + metrics.sentimentNetral)) * 100 || 0)
    };

    const components = [
      { name: 'kepuasan', label: 'Kepuasan Masyarakat (IKM)', weight: weights.kepuasan, score: scores.kepuasan, weighted: (scores.kepuasan * weights.kepuasan) / 100 },
      { name: 'sla', label: 'Kepatuhan SLA', weight: weights.sla, score: scores.sla, weighted: (scores.sla * weights.sla) / 100 },
      { name: 'responseSpeed', label: 'Kecepatan Respons', weight: weights.responseSpeed, score: scores.responseSpeed, weighted: (scores.responseSpeed * weights.responseSpeed) / 100 },
      { name: 'completion', label: 'Penyelesaian Layanan', weight: weights.completion, score: scores.completion, weighted: (scores.completion * weights.completion) / 100 },
      { name: 'aiQuality', label: 'Kualitas Jawaban AI', weight: weights.aiQuality, score: scores.aiQuality, weighted: (scores.aiQuality * weights.aiQuality) / 100 },
      { name: 'complaintHandling', label: 'Penanganan Pengaduan', weight: weights.complaintHandling, score: scores.complaintHandling, weighted: (scores.complaintHandling * weights.complaintHandling) / 100 },
      { name: 'sentiment', label: 'Sentimen Masyarakat', weight: weights.sentiment, score: scores.sentiment, weighted: (scores.sentiment * weights.sentiment) / 100 }
    ];

    const totalScore = components.reduce((acc, curr) => acc + curr.weighted, 0);
    
    let grade: import('@/domain/spms').SSSGrade = 'E';
    let gradeLabel = 'Sangat Kurang';
    
    if (totalScore >= 90) { grade = 'A'; gradeLabel = 'Sangat Baik'; }
    else if (totalScore >= 80) { grade = 'B'; gradeLabel = 'Baik'; }
    else if (totalScore >= 70) { grade = 'C'; gradeLabel = 'Cukup'; }
    else if (totalScore >= 60) { grade = 'D'; gradeLabel = 'Kurang'; }

    return {
      totalScore,
      grade,
      gradeLabel,
      components
    };
  }
}
