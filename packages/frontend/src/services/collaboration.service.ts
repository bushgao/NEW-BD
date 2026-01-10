import api from './api';
import type { PipelineStage, BlockReason, PaginatedResult } from '@ics/shared';

// Types
export interface Influencer {
  id: string;
  nickname: string;
  platform: string;
  platformId: string;
}

export interface BusinessStaff {
  id: string;
  name: string;
  email?: string;
}

export interface FollowUpRecord {
  id: string;
  collaborationId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface StageHistory {
  id: string;
  collaborationId: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  changedAt: string;
  notes: string | null;
  fromStageName?: string | null;
  toStageName?: string;
}

export interface SampleDispatch {
  id: string;
  sampleId: string;
  quantity: number;
  totalCost: number;
  trackingNumber: string | null;
  dispatchedAt: string;
  receivedStatus: string;
  sample?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Collaboration {
  id: string;
  influencerId: string;
  factoryId: string;
  businessStaffId: string;
  stage: PipelineStage;
  deadline: string | null;
  isOverdue: boolean;
  blockReason: BlockReason | null;
  createdAt: string;
  updatedAt: string;
  influencer: Influencer;
  businessStaff: BusinessStaff;
  followUps?: FollowUpRecord[];
  dispatches?: SampleDispatch[];
  stageHistory?: StageHistory[];
}


export interface CollaborationCard {
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
  };
  stage: PipelineStage;
  deadline: string | null;
  isOverdue: boolean;
  blockReason: BlockReason | null;
  followUpCount: number;
  dispatchCount: number;
  lastFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageData {
  stage: PipelineStage;
  stageName: string;
  collaborations: CollaborationCard[];
  count: number;
}

export interface PipelineView {
  stages: PipelineStageData[];
  totalCount: number;
}

export interface PipelineStats {
  byStage: Record<PipelineStage, number>;
  total: number;
  overdueCount: number;
}

export interface CollaborationFilter {
  stage?: PipelineStage;
  businessStaffId?: string;
  influencerId?: string;
  isOverdue?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCollaborationInput {
  influencerId: string;
  stage?: PipelineStage;
  deadline?: string;
  notes?: string;
}

// Stage display names
export const STAGE_LABELS: Record<PipelineStage, string> = {
  LEAD: '线索达人',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

// Stage colors for UI - 莫兰迪色系（柔和低饱和度配色）
export const STAGE_COLORS: Record<PipelineStage, string> = {
  LEAD: '#B8B8B8',        // 浅灰 - 柔和中性
  CONTACTED: '#8EACBB',   // 雾霾蓝 - 柔和蓝
  QUOTED: '#A89BB9',      // 薰衣草紫 - 柔和紫
  SAMPLED: '#D4A574',     // 驼色 - 柔和橙
  SCHEDULED: '#7FA99B',   // 鼠尾草绿 - 柔和青
  PUBLISHED: '#9CAF88',   // 橄榄绿 - 柔和绿
  REVIEWED: '#C89B9C',    // 豆沙粉 - 柔和粉
};

// Block reason display names
export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  PRICE_HIGH: '报价太贵',
  DELAYED: '达人拖延',
  UNCOOPERATIVE: '不配合',
  OTHER: '其他原因',
};

// Stage order
export const STAGE_ORDER: PipelineStage[] = [
  'LEAD',
  'CONTACTED',
  'QUOTED',
  'SAMPLED',
  'SCHEDULED',
  'PUBLISHED',
  'REVIEWED',
];


// API functions

/**
 * 获取合作记录列表
 */
export async function getCollaborations(
  filter: CollaborationFilter = {}
): Promise<PaginatedResult<Collaboration>> {
  const params: Record<string, any> = {
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
  };

  if (filter.stage) params.stage = filter.stage;
  if (filter.businessStaffId) params.businessStaffId = filter.businessStaffId;
  if (filter.influencerId) params.influencerId = filter.influencerId;
  if (filter.isOverdue !== undefined) params.isOverdue = filter.isOverdue;
  if (filter.keyword) params.keyword = filter.keyword;

  const response = await api.get('/collaborations', { params });
  return response.data.data;
}

/**
 * 获取管道视图数据
 */
export async function getPipelineView(filter?: {
  businessStaffId?: string;
  keyword?: string;
}): Promise<PipelineView> {
  const params: Record<string, any> = {};
  if (filter?.businessStaffId) params.businessStaffId = filter.businessStaffId;
  if (filter?.keyword) params.keyword = filter.keyword;

  const response = await api.get('/collaborations/pipeline', { params });
  return response.data.data;
}

/**
 * 获取管道统计数据
 */
export async function getPipelineStats(): Promise<PipelineStats> {
  const response = await api.get('/collaborations/stats');
  return response.data.data;
}

/**
 * 获取超期合作列表
 */
export async function getOverdueCollaborations(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Collaboration>> {
  const response = await api.get('/collaborations/overdue', {
    params: { page, pageSize },
  });
  return response.data.data;
}

/**
 * 获取合作记录详情
 */
export async function getCollaboration(id: string): Promise<Collaboration> {
  const response = await api.get(`/collaborations/${id}`);
  return response.data.data.collaboration;
}

/**
 * 创建合作记录
 */
export async function createCollaboration(
  data: CreateCollaborationInput
): Promise<Collaboration> {
  const response = await api.post('/collaborations', data);
  return response.data.data.collaboration;
}

/**
 * 删除合作记录
 */
export async function deleteCollaboration(id: string): Promise<void> {
  await api.delete(`/collaborations/${id}`);
}

/**
 * 更新合作阶段
 */
export async function updateStage(
  id: string,
  stage: PipelineStage,
  notes?: string
): Promise<Collaboration> {
  const response = await api.put(`/collaborations/${id}/stage`, { stage, notes });
  return response.data.data.collaboration;
}

/**
 * 获取阶段变更历史
 */
export async function getStageHistory(id: string): Promise<StageHistory[]> {
  const response = await api.get(`/collaborations/${id}/history`);
  return response.data.data.history;
}

/**
 * 设置截止时间
 */
export async function setDeadline(
  id: string,
  deadline: string | null
): Promise<Collaboration> {
  const response = await api.put(`/collaborations/${id}/deadline`, { deadline });
  return response.data.data.collaboration;
}

/**
 * 设置卡点原因
 */
export async function setBlockReason(
  id: string,
  reason: BlockReason | null,
  notes?: string
): Promise<Collaboration> {
  const response = await api.put(`/collaborations/${id}/block-reason`, { reason, notes });
  return response.data.data.collaboration;
}

/**
 * 获取跟进记录列表
 */
export async function getFollowUps(
  collaborationId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<FollowUpRecord>> {
  const response = await api.get(`/collaborations/${collaborationId}/follow-ups`, {
    params: { page, pageSize },
  });
  return response.data.data;
}

/**
 * 添加跟进记录
 */
export async function addFollowUp(
  collaborationId: string,
  content: string
): Promise<FollowUpRecord> {
  const response = await api.post(`/collaborations/${collaborationId}/follow-ups`, {
    content,
  });
  return response.data.data.followUp;
}


/**
 * 获取智能建议
 */
export async function getCollaborationSuggestions(
  influencerId: string,
  type: 'sample' | 'price' | 'schedule'
): Promise<CollaborationSuggestion> {
  const params = new URLSearchParams();
  params.append('influencerId', influencerId);
  params.append('type', type);

  const response = await api.get(`/collaborations/suggestions?${params.toString()}`);
  return response.data.data;
}

export interface CollaborationSuggestion {
  type: 'sample' | 'price' | 'schedule';
  suggestions: {
    field: string;
    value: any;
    label: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
}

/**
 * 批量更新合作记录
 */
export async function batchUpdateCollaborations(
  ids: string[],
  operation: 'dispatch' | 'updateStage' | 'setDeadline',
  data: any
): Promise<{ updated: number; failed: number; errors: any[] }> {
  const response = await api.post('/collaborations/batch-update', {
    ids,
    operation,
    data,
  });
  return response.data.data;
}
