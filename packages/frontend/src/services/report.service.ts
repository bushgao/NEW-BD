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
}

export interface DateRange {
  startDate: string;
  endDate: string;
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
