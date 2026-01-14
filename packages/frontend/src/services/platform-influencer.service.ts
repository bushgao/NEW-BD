import api from './api';
import type {
  ApiResponse,
  PaginatedResult,
  InfluencerWithDetails,
  InfluencerSourceType,
  VerificationStatus,
  Platform,
  InfluencerStats,
} from '@ics/shared';

export interface InfluencerListFilter {
  keyword?: string;
  platform?: Platform;
  brandId?: string;
  sourceType?: InfluencerSourceType;
  verificationStatus?: VerificationStatus;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 获取所有达人列表（平台级别）
 */
export async function listAllInfluencers(
  params: InfluencerListFilter
): Promise<PaginatedResult<InfluencerWithDetails>> {
  const response = await api.get<ApiResponse<PaginatedResult<InfluencerWithDetails>>>(
    '/platform/influencers',
    { params }
  );
  return response.data.data!;
}

/**
 * 获取达人详情（平台级别）
 */
export async function getInfluencerDetail(influencerId: string) {
  const response = await api.get<ApiResponse>(
    `/platform/influencers/${influencerId}`
  );
  return response.data.data;
}

/**
 * 认证达人
 */
export async function verifyInfluencer(
  influencerId: string,
  status: 'VERIFIED' | 'REJECTED',
  note?: string
) {
  const response = await api.post<ApiResponse>(
    `/platform/influencers/${influencerId}/verify`,
    { status, note }
  );
  return response.data.data;
}

/**
 * 获取达人统计数据
 */
export async function getInfluencerStats(
  startDate?: Date,
  endDate?: Date
): Promise<InfluencerStats> {
  const params: any = {};
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();

  const response = await api.get<ApiResponse<InfluencerStats>>(
    '/platform/influencers-stats',
    { params }
  );
  return response.data.data!;
}

/**
 * 导出达人列表
 */
export async function exportInfluencers(params: InfluencerListFilter): Promise<Blob> {
  const response = await api.get(
    '/platform/influencers/export',
    {
      params,
      responseType: 'blob',
    }
  );
  return response.data;
}

/**
 * 删除达人
 */
export async function deleteInfluencer(influencerId: string): Promise<void> {
  await api.delete<ApiResponse>(`/platform/influencers/${influencerId}`);
}

