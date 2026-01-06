import api from './api';
import type { PaginatedResult } from '@ics/shared';

// ============ Types ============

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface StaffDetail extends StaffMember {
  stats: {
    influencerCount: number;
    collaborationCount: number;
    dispatchCount: number;
    closedDeals: number;
    totalGmv: number;
  };
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
}

export interface QuotaUsage {
  staff: {
    current: number;
    limit: number;
    available: number;
    isReached: boolean;
  };
  influencer: {
    current: number;
    limit: number;
    available: number;
    isReached: boolean;
  };
}

// ============ API Functions ============

/**
 * 获取工厂商务账号列表
 */
export async function listStaff(page: number = 1, pageSize: number = 10): Promise<PaginatedResult<StaffMember>> {
  const response = await api.get<PaginatedResult<StaffMember>>('/staff', {
    params: { page, pageSize },
  });
  return response.data;
}

/**
 * 获取配额使用情况
 */
export async function getQuotaUsage(): Promise<QuotaUsage> {
  const response = await api.get<QuotaUsage>('/staff/quota');
  return response.data;
}

/**
 * 获取商务账号详情（含工作统计）
 */
export async function getStaffDetail(staffId: string): Promise<StaffDetail> {
  const response = await api.get<StaffDetail>(`/staff/${staffId}`);
  return response.data;
}

/**
 * 创建商务账号（检查配额）
 */
export async function createStaff(data: CreateStaffInput): Promise<StaffMember> {
  const response = await api.post<StaffMember>('/staff', data);
  return response.data;
}

/**
 * 更新商务账号状态（启用/禁用）
 */
export async function updateStaffStatus(staffId: string, status: 'ACTIVE' | 'DISABLED'): Promise<StaffMember> {
  const response = await api.put<StaffMember>(`/staff/${staffId}/status`, { status });
  return response.data;
}

/**
 * 删除商务账号（保留业务数据）
 */
export async function deleteStaff(staffId: string): Promise<void> {
  await api.delete(`/staff/${staffId}`);
}
