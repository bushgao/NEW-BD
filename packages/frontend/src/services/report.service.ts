import api from './api';
import type { PipelineStage } from '@ics/shared';

// ==================== 类型定义 ====================

export interface StaffPerformanceItem {
  staffId: string;
  staffName: string;
  staffEmail: string;
  contactedCount: number;
  progressedCount: number;
  closedCount: number;
  totalGmv: number;
  totalCost: number;
  averageRoi: number;
  dispatchCount: number;
  dispatchCost: number;
}

export interface StaffPerformanceReport {
  items: StaffPerformanceItem[];
  summary: {
    totalStaff: number;
    totalContactedCount: number;
    totalProgressedCount: number;
    totalClosedCount: number;
    totalGmv: number;
    totalCost: number;
    overallRoi: number;
    totalDispatchCount: number;
    totalDispatchCost: number;
  };
}

export interface FactoryDashboard {
  metrics: {
    totalSampleCost: number;
    totalCollaborationCost: number;
    totalGmv: number;
    overallRoi: number;
    periodComparison: {
      sampleCostChange: number;
      gmvChange: number;
      roiChange: number;
    };
  };
  pipelineDistribution: Record<PipelineStage, number>;
  pendingItems: {
    overdueCollaborations: number;
    pendingReceipts: number;
    pendingResults: number;
  };
  staffRanking: {
    staffId: string;
    staffName: string;
    closedDeals: number;
    totalGmv: number;
  }[];
  staffProgress: {
    staffId: string;
    staffName: string;
    todayFollowUps: number;
    weekFollowUps: number;
    activeCollaborations: number;
    stuckCollaborations: number;
    avgDaysToClose: number;
  }[];
  teamEfficiency: {
    avgLeadToContact: number;
    avgContactToQuoted: number;
    avgQuotedToSampled: number;
    avgSampledToScheduled: number;
    avgScheduledToPublished: number;
    overallAvgDays: number;
  };
  recentTeamActivities: {
    id: string;
    type: 'new_collaboration' | 'stage_progress' | 'closed_deal' | 'dispatch';
    staffName: string;
    influencerName: string;
    content: string;
    createdAt: string;
  }[];
  riskAlerts: {
    longStuckCollaborations: number;
    unbalancedWorkload: boolean;
    highCostAlert: boolean;
  };
}

export interface BusinessStaffDashboard {
  metrics: {
    currentPeriod: {
      contactedCount: number;
      progressedCount: number;
      closedCount: number;
      totalGmv: number;
      totalCost: number;
      averageRoi: number;
      dispatchCount: number;
      dispatchCost: number;
    };
    periodComparison: {
      contactedChange: number;
      closedChange: number;
      gmvChange: number;
      roiChange: number;
    };
  };
  myPipelineDistribution: Record<PipelineStage, number>;
  pendingItems: {
    overdueCollaborations: number;
    needFollowUp: number;
    pendingReceipts: number;
    pendingResults: number;
  };
  sampleUsage: {
    sampleId: string;
    sampleName: string;
    sku: string;
    dispatchCount: number;
    totalQuantity: number;
    totalCost: number;
    receivedCount: number;
    onboardCount: number;
    onboardRate: number;
  }[];
  recentActivities: {
    id: string;
    type: 'stage_change' | 'follow_up' | 'dispatch' | 'result';
    collaborationId: string;
    influencerName: string;
    content: string;
    createdAt: string;
  }[];
  ranking: {
    myRank: number;
    totalStaff: number;
    myClosedCount: number;
    myGmv: number;
    topPerformer: {
      name: string;
      closedCount: number;
      gmv: number;
    } | null;
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface TrendData {
  current: TrendDataPoint[];
  previous: TrendDataPoint[];
  comparison: {
    change: number;
    percentage: number;
  };
}

// ==================== 辅助函数 ====================

/**
 * 格式化金额（分转元）
 */
export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * 格式化 ROI
 */
export function formatRoi(roi: number): string {
  return roi.toFixed(2);
}

/**
 * 格式化百分比变化
 */
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

// 阶段名称映射
export const STAGE_LABELS: Record<PipelineStage, string> = {
  LEAD: '线索达人',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

// ==================== API 函数 ====================

/**
 * 获取商务绩效报表
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function getStaffPerformance(
  dateRange?: DateRange
): Promise<StaffPerformanceReport> {
  const params: Record<string, any> = {};
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/reports/staff-performance', { params });
  return response.data.data;
}

/**
 * 获取趋势数据
 */
export async function getTrendData(
  period: 'week' | 'month' | 'quarter',
  dataType: 'gmv' | 'cost' | 'roi'
): Promise<TrendData> {
  const response = await api.get('/reports/dashboard/trends', {
    params: { period, dataType },
  });
  return response.data.data;
}

/**
 * 获取工厂看板数据
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function getFactoryDashboard(
  period: 'week' | 'month' = 'month'
): Promise<FactoryDashboard> {
  const response = await api.get('/reports/dashboard', { params: { period } });
  return response.data.data;
}

/**
 * 获取商务人员个人看板数据
 */
export async function getBusinessStaffDashboard(
  period: 'week' | 'month' = 'month'
): Promise<BusinessStaffDashboard> {
  const response = await api.get('/reports/my-dashboard', { params: { period } });
  return response.data.data;
}

/**
 * 导出商务绩效报表
 * Requirements: 6.5
 */
export async function exportStaffPerformance(dateRange?: DateRange): Promise<void> {
  const params: Record<string, any> = {};
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/reports/export/staff-performance', {
    params,
    responseType: 'blob',
  });

  // 下载文件
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `商务绩效报表_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * 导出ROI报表
 */
export async function exportRoiReport(
  groupBy: 'influencer' | 'sample' | 'staff' | 'month',
  dateRange?: DateRange
): Promise<void> {
  const params: Record<string, any> = { groupBy };
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/reports/export/roi', {
    params,
    responseType: 'blob',
  });

  const groupByNames: Record<string, string> = {
    influencer: '按达人',
    sample: '按样品',
    staff: '按商务',
    month: '按月份',
  };

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ROI报表_${groupByNames[groupBy]}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * 导出合作记录
 */
export async function exportCollaborations(dateRange?: DateRange): Promise<void> {
  const params: Record<string, any> = {};
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/reports/export/collaborations', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `合作记录_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}


// ==================== ROI 分析数据 ====================

export interface StaffROIData {
  staffId: string;
  staffName: string;
  totalGmv: number;
  totalCost: number;
  roi: number;
  collaborationCount: number;
}

export interface CostBreakdown {
  sampleCost: number;
  collaborationCost: number;
  otherCost: number;
}

export interface ScatterDataPoint {
  cost: number;
  revenue: number;
  roi: number;
  name: string;
}

export interface ROIAnalysisData {
  byStaff: StaffROIData[];
  costBreakdown: CostBreakdown;
  costVsRevenue: ScatterDataPoint[];
}

/**
 * 获取 ROI 分析数据
 */
export async function getRoiAnalysis(): Promise<ROIAnalysisData> {
  const response = await api.get('/reports/dashboard/roi-analysis');
  return response.data.data;
}


// ==================== 管道漏斗数据 ====================

export interface PipelineStageData {
  stage: string;
  stageName: string;
  count: number;
  conversionRate: number;
  dropRate: number;
}

export interface PipelineFunnelData {
  stages: PipelineStageData[];
  totalCount: number;
  overallConversionRate: number;
}

/**
 * 获取管道漏斗数据
 */
export async function getPipelineFunnel(): Promise<PipelineFunnelData> {
  const response = await api.get('/reports/dashboard/pipeline-funnel');
  return response.data.data;
}


// ==================== 商务对比分析 ====================

export interface StaffComparisonMetrics {
  leads: number;
  deals: number;
  gmv: number;
  roi: number;
  efficiency: number;
}

export interface StaffComparisonData {
  staffId: string;
  staffName: string;
  metrics: StaffComparisonMetrics;
  normalizedMetrics: StaffComparisonMetrics;
}

export interface StaffComparisonAnalysis {
  staffData: StaffComparisonData[];
  insights: {
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
}

/**
 * 获取商务对比分析数据
 */
export async function getStaffComparison(staffIds: string[]): Promise<StaffComparisonAnalysis> {
  const response = await api.get('/reports/staff/comparison', {
    params: { staffIds: staffIds.join(',') },
  });
  return response.data.data;
}


// ==================== 商务工作质量评分 ====================

export interface QualityScoreDimension {
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
}

export interface ScoreTrend {
  date: string;
  overall: number;
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
}

export interface QualityScoreData {
  overall: number;
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
  trend: ScoreTrend[];
  suggestions: string[];
}

/**
 * 获取商务工作质量评分
 */
export async function getStaffQualityScore(staffId: string): Promise<QualityScoreData> {
  const response = await api.get(`/reports/staff/${staffId}/quality-score`);
  return response.data.data;
}


// ==================== 商务工作日历 ====================

export interface CalendarEvent {
  date: string;
  type: 'deadline' | 'scheduled' | 'followup';
  title: string;
  collaborationId: string;
  influencerName: string;
  stage: string;
}

export interface WorkloadData {
  date: string;
  count: number;
  level: 'low' | 'medium' | 'high';
}

export interface CalendarData {
  events: CalendarEvent[];
  workload: WorkloadData[];
  stats: {
    totalEvents: number;
    deadlines: number;
    scheduled: number;
    followups: number;
    avgDailyWorkload: number;
  };
}

/**
 * 获取商务工作日历数据
 */
export async function getStaffCalendar(staffId: string, month: string): Promise<CalendarData> {
  const response = await api.get(`/reports/staff/${staffId}/calendar`, {
    params: { month },
  });
  return response.data.data;
}


// ==================== 导出对象 ====================

export interface Alert {
  id: string;
  type: 'overdue' | 'pending_sample' | 'pending_result' | 'low_conversion' | 'high_cost';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface DailySummaryData {
  overdueCollaborations: number;
  pendingSamples: number;
  pendingResults: number;
  alerts: Alert[];
  highlights: string[];
}

/**
 * 获取每日摘要数据
 * 用于快捷操作面板
 */
export async function getDailySummary(): Promise<DailySummaryData> {
  const response = await api.get('/reports/dashboard/daily-summary');
  return response.data.data;
}


// ==================== 跟进分析数据 ====================

export interface ConversionByTime {
  timeRange: string;
  followUps: number;
  conversions: number;
  conversionRate: number;
}

export interface ConversionByFrequency {
  frequency: string;
  followUps: number;
  conversions: number;
  conversionRate: number;
}

export interface ConversionByDay {
  day: string;
  followUps: number;
  conversions: number;
}

export interface FollowUpAnalyticsData {
  effectivenessScore: number;
  bestTime: string;
  bestFrequency: string;
  totalFollowUps: number;
  successfulConversions: number;
  conversionRate: number;
  avgResponseTime: number;
  conversionByTime: ConversionByTime[];
  conversionByFrequency: ConversionByFrequency[];
  conversionByDay: ConversionByDay[];
  suggestions: string[];
}

/**
 * 获取跟进分析数据
 */
export async function getFollowUpAnalytics(
  period: 'week' | 'month' | 'quarter' = 'month',
  staffId?: string
): Promise<FollowUpAnalyticsData> {
  const params: Record<string, any> = { period };
  if (staffId) {
    params.staffId = staffId;
  }

  const response = await api.get('/collaborations/follow-up-analytics', { params });
  return response.data.data;
}

// ==================== 导出对象 ====================

export const reportService = {
  getStaffPerformance,
  getTrendData,
  getFactoryDashboard,
  getBusinessStaffDashboard,
  exportStaffPerformance,
  exportRoiReport,
  exportCollaborations,
  getRoiAnalysis,
  getPipelineFunnel,
  getStaffComparison,
  getStaffQualityScore,
  getStaffCalendar,
  getDailySummary,
  getFollowUpAnalytics,
};


// ==================== 今日工作清单 ====================

export interface TodoItem {
  id: string;
  type: 'followup' | 'deadline' | 'dispatch' | 'result';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueTime?: string;
  relatedId: string;
  completed?: boolean;
  snoozedUntil?: string;
}

export interface TodayGoal {
  type: 'followup' | 'dispatch' | 'deal';
  target: number;
  current: number;
  label: string;
}

export interface TodayTodosResponse {
  todos: TodoItem[];
  goals: TodayGoal[];
  summary: {
    total: number;
    completed: number;
    overdue: number;
  };
}

/**
 * 获取今日待办事项
 */
export async function getTodayTodos(): Promise<TodayTodosResponse> {
  const response = await api.get('/reports/my-dashboard/today-todos');
  return response.data.data;
}

// ==================== 工作统计 ====================

export interface WorkStats {
  leadsAdded: number;
  collaborationsCreated: number;
  samplesDispatched: number;
  followUpsCompleted: number;
  dealsCompleted: number;
  gmv: number;
  goalProgress: number;
  rankChange: number;
}

export interface WorkStatsTrend {
  date: string;
  leadsAdded: number;
  collaborationsCreated: number;
  dealsCompleted: number;
  gmv: number;
}

export interface WorkStatsResponse {
  stats: WorkStats;
  trend: WorkStatsTrend[];
}

/**
 * 获取工作统计
 */
export async function getWorkStats(period: 'today' | 'week' | 'month' = 'week'): Promise<WorkStatsResponse> {
  const response = await api.get('/reports/my-dashboard/work-stats', {
    params: { period },
  });
  return response.data.data;
}
