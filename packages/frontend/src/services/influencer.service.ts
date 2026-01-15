import api from './api';
import type { Platform, PipelineStage, PaginatedResult } from '@ics/shared';

// Types
export interface Influencer {
  id: string;
  brandId: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  uid: string | null;
  homeUrl: string | null;
  phone: string | null;
  wechat: string | null;
  shippingAddress: string | null;
  followers: string | null;
  categories: string[];
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInfluencerInput {
  nickname: string;
  platform: Platform;
  platformId: string;
  uid?: string;
  homeUrl?: string;
  phone?: string;
  wechat?: string;
  shippingAddress?: string;
  followers?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
}

export interface UpdateInfluencerInput {
  nickname?: string;
  platform?: Platform;
  platformId?: string;
  uid?: string;
  homeUrl?: string;
  phone?: string;
  wechat?: string;
  shippingAddress?: string;
  followers?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
}

export interface InfluencerFilter {
  keyword?: string;
  platform?: Platform;
  category?: string;
  tags?: string[];
  pipelineStage?: PipelineStage;
  businessStaffId?: string;
  groupId?: string | null;
  page?: number;
  pageSize?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: 'phone' | 'platformId' | 'both';
  existingInfluencer?: {
    id: string;
    nickname: string;
    platform: Platform;
    platformId: string;
    phone: string | null;
  };
}

export interface FieldMapping {
  nickname: string;
  platform: string;
  platformId: string;
  phone?: string;
  categories?: string;
  tags?: string;
  notes?: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: {
    nickname: string;
    platform: Platform;
    platformId: string;
    phone?: string;
    categories?: string[];
    tags?: string[];
    notes?: string;
  };
  errors: string[];
  isDuplicate: boolean;
  duplicateInfo?: {
    type: 'phone' | 'platformId' | 'both';
    existingId: string;
    existingNickname: string;
  };
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  preview: ImportPreviewRow[];
  headers: string[];
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  skippedCount: number;
  errors: { rowNumber: number; error: string }[];
}

// Platform display names
export const PLATFORM_LABELS: Record<Platform, string> = {
  DOUYIN: '抖音',
  KUAISHOU: '快手',
  XIAOHONGSHU: '小红书',
  WEIBO: '微博',
  OTHER: '其他',
};

// API functions
export async function getInfluencers(filter: InfluencerFilter = {}): Promise<PaginatedResult<Influencer>> {
  const params: Record<string, any> = {
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
  };

  if (filter.keyword) params.keyword = filter.keyword;
  if (filter.platform) params.platform = filter.platform;
  if (filter.category) params.category = filter.category;
  if (filter.tags?.length) params.tags = filter.tags;
  if (filter.pipelineStage) params.pipelineStage = filter.pipelineStage;
  if (filter.businessStaffId) params.businessStaffId = filter.businessStaffId;

  const response = await api.get('/influencers', { params });
  return response.data.data;
}

export async function getInfluencer(id: string): Promise<Influencer> {
  const response = await api.get(`/influencers/${id}`);
  return response.data.data.influencer;
}

export async function createInfluencer(data: CreateInfluencerInput): Promise<Influencer> {
  const response = await api.post('/influencers', data);
  return response.data.data.influencer;
}

export async function updateInfluencer(id: string, data: UpdateInfluencerInput): Promise<Influencer> {
  const response = await api.put(`/influencers/${id}`, data);
  return response.data.data.influencer;
}

export async function deleteInfluencer(id: string): Promise<void> {
  await api.delete(`/influencers/${id}`);
}

export async function checkDuplicate(
  phone?: string,
  platform?: Platform,
  platformId?: string
): Promise<DuplicateCheckResult> {
  const params: Record<string, string> = {};
  if (phone) params.phone = phone;
  if (platform) params.platform = platform;
  if (platformId) params.platformId = platformId;

  const response = await api.get('/influencers/check-duplicate', { params });
  return response.data.data;
}

export async function addTags(id: string, tags: string[]): Promise<Influencer> {
  const response = await api.post(`/influencers/${id}/tags`, { tags });
  return response.data.data.influencer;
}

export async function removeTags(id: string, tags: string[]): Promise<Influencer> {
  const response = await api.delete(`/influencers/${id}/tags`, { data: { tags } });
  return response.data.data.influencer;
}

export async function getAllTags(): Promise<string[]> {
  const response = await api.get('/influencers/tags');
  return response.data.data.tags;
}

export async function getAllCategories(): Promise<string[]> {
  const response = await api.get('/influencers/categories');
  return response.data.data.categories;
}

// Import functions
export async function parseImportFile(file: File): Promise<{ headers: string[]; suggestedMapping: Partial<FieldMapping> }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/influencers/import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function previewImport(file: File, mapping: FieldMapping): Promise<ImportPreviewResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));

  const response = await api.post('/influencers/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function executeImport(
  file: File,
  mapping: FieldMapping,
  skipDuplicates: boolean = true
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  formData.append('skipDuplicates', String(skipDuplicates));

  const response = await api.post('/influencers/import/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Get smart influencer recommendations
 */
export async function getSmartRecommendations(): Promise<any[]> {
  const response = await api.get('/influencers/recommendations');
  return response.data.data.recommendations;
}

/**
 * Batch add tags to influencers
 */
export async function batchAddTags(influencerIds: string[], tags: string[]): Promise<void> {
  await api.post('/influencers/batch/tags', { influencerIds, tags });
}

/**
 * Export selected influencers
 */
export async function exportInfluencers(influencerIds: string[]): Promise<Blob> {
  const response = await api.post('/influencers/export',
    { influencerIds },
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Get influencer collaboration history
 */
export async function getInfluencerCollaborationHistory(influencerId: string): Promise<any[]> {
  const response = await api.get(`/influencers/${influencerId}/collaboration-history`);
  return response.data.data;
}

/**
 * Get influencer ROI statistics
 */
export async function getInfluencerROIStats(influencerId: string): Promise<any> {
  const response = await api.get(`/influencers/${influencerId}/roi-stats`);
  return response.data.data;
}
