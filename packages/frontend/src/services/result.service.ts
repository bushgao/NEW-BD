import api from './api';
import type { PaginatedResult, ContentType, ProfitStatus } from '@ics/shared';

// 类型定义
export interface CollaborationResult {
  id: string;
  collaborationId: string;
  contentType: ContentType;
  publishedAt: string;
  salesQuantity: number;
  salesGmv: number;
  commissionRate: number | null;
  pitFee: number;
  actualCommission: number;
  totalSampleCost: number;
  totalCollaborationCost: number;
  roi: number;
  profitStatus: ProfitStatus;
  willRepeat: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  collaboration?: {
    id: string;
    influencer: {
      id: string;
      nickname: string;
      platform: string;
      platformId: string;
    };
    businessStaff: {
      id: string;
      name: string;
      email?: string;
    };
    dispatches?: Array<{
      id: string;
      quantity: number;
      totalCost: number;
      sample: {
        id: string;
        name: string;
        sku: string;
      };
    }>;
  };
}

export interface CreateResultInput {
  collaborationId: string;
  contentType: ContentType;
  publishedAt: string;
  salesQuantity: number;
  salesGmv: number;
  commissionRate?: number;
  pitFee?: number;
  actualCommission: number;
  willRepeat: boolean;
  notes?: string;
}

export interface UpdateResultInput {
  contentType?: ContentType;
  publishedAt?: string;
  salesQuantity?: number;
  salesGmv?: number;
  commissionRate?: number;
  pitFee?: number;
  actualCommission?: number;
  willRepeat?: boolean;
  notes?: string;
}

export interface ResultFilter {
  profitStatus?: ProfitStatus;
  contentType?: ContentType;
  businessStaffId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}


export interface RoiReportItem {
  groupKey: string;
  groupName: string;
  collaborationCount: number;
  totalSampleCost: number;
  totalPitFee: number;
  totalCommission: number;
  totalCost: number;
  totalGmv: number;
  roi: number;
  profitCount: number;
  lossCount: number;
}

export interface RoiReport {
  items: RoiReportItem[];
  summary: {
    totalCollaborations: number;
    totalSampleCost: number;
    totalPitFee: number;
    totalCommission: number;
    totalCost: number;
    totalGmv: number;
    overallRoi: number;
    profitRate: number;
  };
}

export interface ResultStats {
  totalCount: number;
  totalGmv: number;
  totalCost: number;
  totalQuantity: number;
  overallRoi: number;
  byStatus: {
    LOSS: number;
    BREAK_EVEN: number;
    PROFIT: number;
    HIGH_PROFIT: number;
  };
}

// 显示名称映射
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  SHORT_VIDEO: '短视频',
  LIVE_STREAM: '直播',
};

export const PROFIT_STATUS_LABELS: Record<ProfitStatus, string> = {
  LOSS: '未回本',
  BREAK_EVEN: '刚回本',
  PROFIT: '已回本',
  HIGH_PROFIT: '爆赚',
};

export const PROFIT_STATUS_COLORS: Record<ProfitStatus, string> = {
  LOSS: '#ff4d4f',
  BREAK_EVEN: '#faad14',
  PROFIT: '#52c41a',
  HIGH_PROFIT: '#13c2c2',
};

// 格式化函数 - 从统一工具导入并重新导出
export { formatMoney, formatROI as formatRoi } from '../utils/money';


// API 函数

/**
 * 获取合作结果列表
 */
export async function getResults(
  filter: ResultFilter = {}
): Promise<PaginatedResult<CollaborationResult>> {
  const params: Record<string, any> = {
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
  };

  if (filter.profitStatus) params.profitStatus = filter.profitStatus;
  if (filter.contentType) params.contentType = filter.contentType;
  if (filter.businessStaffId) params.businessStaffId = filter.businessStaffId;
  if (filter.startDate) params.startDate = filter.startDate;
  if (filter.endDate) params.endDate = filter.endDate;

  const response = await api.get('/results', { params });
  return response.data.data;
}

/**
 * 获取合作结果详情
 */
export async function getResult(id: string): Promise<CollaborationResult> {
  const response = await api.get(`/results/${id}`);
  return response.data.data.result;
}

/**
 * 根据合作ID获取结果
 */
export async function getResultByCollaborationId(
  collaborationId: string
): Promise<CollaborationResult | null> {
  const response = await api.get(`/results/collaboration/${collaborationId}`);
  return response.data.data.result;
}

/**
 * 录入合作结果
 */
export async function createResult(data: CreateResultInput): Promise<CollaborationResult> {
  const response = await api.post('/results', data);
  return response.data.data.result;
}

/**
 * 更新合作结果
 */
export async function updateResult(
  id: string,
  data: UpdateResultInput
): Promise<CollaborationResult> {
  const response = await api.put(`/results/${id}`, data);
  return response.data.data.result;
}

/**
 * 获取合作结果统计概览
 */
export async function getResultStats(dateRange?: {
  startDate: string;
  endDate: string;
}): Promise<ResultStats> {
  const params: Record<string, any> = {};
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/results/stats', { params });
  return response.data.data;
}

/**
 * 获取 ROI 报表
 */
export async function getRoiReport(
  groupBy: 'influencer' | 'sample' | 'staff' | 'month',
  dateRange?: { startDate: string; endDate: string }
): Promise<RoiReport> {
  const params: Record<string, any> = { groupBy };
  if (dateRange) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }

  const response = await api.get('/results/report', { params });
  return response.data.data;
}
