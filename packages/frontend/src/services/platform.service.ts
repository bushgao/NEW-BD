import { request } from './api';
import type { BrandStatus, PlanType, PaginatedResult } from '@ics/shared';

// ============ Types ============

export interface BrandOwner {
  id: string;
  name: string;
  email: string;
}

export interface FactoryWithOwner {
  id: string;
  name: string;
  ownerId: string;
  status: BrandStatus;
  planType: PlanType;
  staffLimit: number;
  influencerLimit: number;
  // 订阅相关字段
  planStartedAt?: string;
  planExpiresAt?: string;
  isLocked?: boolean;
  isPaid?: boolean;
  // 赠送额度记录
  bonusStaff?: number;
  bonusInfluencer?: number;
  bonusDays?: number;
  createdAt: string;
  updatedAt: string;
  owner: BrandOwner;
  _count?: {
    staff: number;
    influencers: number;
    collaborations: number;
  };
}

export interface PlanConfigData {
  id: string;
  planType: PlanType;
  name: string;
  staffLimit: number;
  influencerLimit: number;
  dataRetentionDays: number;
  price: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalFactories: number;
  pendingFactories: number;
  approvedFactories: number;
  totalUsers: number;
  totalCollaborations: number;
  totalInfluencers: number;
  independentBusinessUsers: number; // 独立商务数量
  factoriesByPlan: Record<PlanType, number>;
}

export interface FactoryFilter {
  status?: BrandStatus;
  planType?: PlanType;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateFactoryInput {
  status?: BrandStatus;
  planType?: PlanType;
  staffLimit?: number;
  influencerLimit?: number;
  // 订阅相关字段
  planExpiresAt?: string | null;
  isPaid?: boolean;
  // 赠送额度记录
  bonusStaff?: number;
  bonusInfluencer?: number;
  bonusDays?: number;
}

export interface CreatePlanConfigInput {
  planType: PlanType;
  name: string;
  staffLimit: number;
  influencerLimit: number;
  dataRetentionDays: number;
  price: number;
  features: string[];
}

export interface UpdatePlanConfigInput {
  name?: string;
  staffLimit?: number;
  influencerLimit?: number;
  dataRetentionDays?: number;
  price?: number;
  features?: string[];
}

export interface QuotaInfo {
  allowed: boolean;
  current: number;
  limit: number;
}

// ============ Factory Management ============

/**
 * 获取工厂列表
 */
export async function listFactories(
  filter: FactoryFilter = {}
): Promise<PaginatedResult<FactoryWithOwner>> {
  const response = await request<PaginatedResult<FactoryWithOwner>>(
    'get',
    '/platform/factories',
    filter
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取工厂列表失败');
  }

  return response.data;
}

/**
 * 获取工厂详情
 */
export async function getFactoryById(brandId: string): Promise<FactoryWithOwner> {
  const response = await request<FactoryWithOwner>(
    'get',
    `/platform/factories/${brandId}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取工厂详情失败');
  }

  return response.data;
}

/**
 * 审核工厂入驻申请
 */
export async function reviewFactory(
  brandId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<FactoryWithOwner> {
  const response = await request<FactoryWithOwner>(
    'post',
    `/platform/factories/${brandId}/review`,
    { status, reason }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '审核工厂失败');
  }

  return response.data;
}

/**
 * 更新工厂信息
 */
export async function updateFactory(
  brandId: string,
  data: UpdateFactoryInput
): Promise<FactoryWithOwner> {
  const response = await request<FactoryWithOwner>(
    'put',
    `/platform/factories/${brandId}`,
    data
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '更新工厂失败');
  }

  return response.data;
}

/**
 * 暂停/恢复工厂
 */
export async function toggleBrandStatus(
  brandId: string,
  suspend: boolean
): Promise<FactoryWithOwner> {
  const response = await request<FactoryWithOwner>(
    'post',
    `/platform/factories/${brandId}/toggle-status`,
    { suspend }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '操作失败');
  }

  return response.data;
}

/**
 * 删除品牌
 */
export async function deleteBrand(brandId: string): Promise<void> {
  const response = await request<{ message: string }>(
    'delete',
    `/platform/factories/${brandId}`
  );

  if (!response.success) {
    throw new Error(response.error?.message || '删除品牌失败');
  }
}

// ============ Plan Configuration ============

/**
 * 获取所有套餐配置
 */
export async function listPlanConfigs(): Promise<PlanConfigData[]> {
  const response = await request<PlanConfigData[]>('get', '/platform/plans');

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取套餐配置失败');
  }

  return response.data;
}

/**
 * 获取单个套餐配置
 */
export async function getPlanConfig(planType: PlanType): Promise<PlanConfigData> {
  const response = await request<PlanConfigData>(
    'get',
    `/platform/plans/${planType}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取套餐配置失败');
  }

  return response.data;
}

/**
 * 创建套餐配置
 */
export async function createPlanConfig(
  data: CreatePlanConfigInput
): Promise<PlanConfigData> {
  const response = await request<PlanConfigData>('post', '/platform/plans', data);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '创建套餐配置失败');
  }

  return response.data;
}

/**
 * 更新套餐配置
 */
export async function updatePlanConfig(
  planType: PlanType,
  data: UpdatePlanConfigInput
): Promise<PlanConfigData> {
  const response = await request<PlanConfigData>(
    'put',
    `/platform/plans/${planType}`,
    data
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '更新套餐配置失败');
  }

  return response.data;
}

/**
 * 删除套餐配置
 */
export async function deletePlanConfig(planType: PlanType): Promise<void> {
  const response = await request<{ message: string }>(
    'delete',
    `/platform/plans/${planType}`
  );

  if (!response.success) {
    throw new Error(response.error?.message || '删除套餐配置失败');
  }
}

// ============ Quota Check ============

/**
 * 检查工厂配额
 */
export async function checkFactoryQuota(
  brandId: string,
  type: 'staff' | 'influencer'
): Promise<QuotaInfo> {
  const response = await request<QuotaInfo>(
    'get',
    `/platform/factories/${brandId}/quota`,
    { type }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '检查配额失败');
  }

  return response.data;
}

// ============ Platform Statistics ============

/**
 * 获取平台统计数据
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await request<PlatformStats>('get', '/platform/stats');

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取平台统计失败');
  }

  return response.data;
}

// ============ Factory Staff Management ============

export interface BrandStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count?: {
    influencers: number;
    collaborations: number;
  };
}

export interface StaffWorkStats {
  id: string;
  name: string;
  email: string;
  role: string;
  brandId: string;
  factoryName: string;
  createdAt: string;
  influencersAdded: number;
  collaborationsCreated: number;
  collaborationsCompleted: number;
  successRate: number;
}

/**
 * 获取工厂的商务列表
 */
export async function getBrandStaff(brandId: string): Promise<BrandStaffMember[]> {
  const response = await request<BrandStaffMember[]>(
    'get',
    `/platform/factories/${brandId}/staff`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取商务列表失败');
  }

  return response.data;
}

/**
 * 获取商务的工作统计
 */
export async function getStaffWorkStats(staffId: string): Promise<StaffWorkStats> {
  const response = await request<StaffWorkStats>(
    'get',
    `/platform/staff/${staffId}/stats`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取商务统计失败');
  }

  return response.data;
}

/**
 * 获取商务添加的达人列表
 */
export async function getStaffInfluencers(
  staffId: string,
  pagination: { page: number; pageSize: number }
): Promise<PaginatedResult<any>> {
  const response = await request<PaginatedResult<any>>(
    'get',
    `/platform/staff/${staffId}/influencers`,
    pagination
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取达人列表失败');
  }

  return response.data;
}

/**
 * 获取商务的合作列表
 */
export async function getStaffCollaborations(
  staffId: string,
  pagination: { page: number; pageSize: number }
): Promise<PaginatedResult<any>> {
  const response = await request<PaginatedResult<any>>(
    'get',
    `/platform/staff/${staffId}/collaborations`,
    pagination
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取合作列表失败');
  }

  return response.data;
}

// ============ User Management ============

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  brandId?: string;
  factoryName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserListFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取所有用户列表
 */
export async function listAllUsers(filter: UserListFilter = {}): Promise<UserListResponse> {
  const response = await request<PaginatedResult<UserListItem>>(
    'get',
    '/platform/users',
    filter
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取用户列表失败');
  }

  // 转换 PaginatedResult 到 UserListResponse
  return {
    users: response.data.data,
    total: response.data.total,
    page: response.data.page,
    pageSize: response.data.pageSize,
  };
}

/**
 * 获取用户详情
 */
export async function getUserDetail(userId: string): Promise<UserListItem> {
  const response = await request<UserListItem>(
    'get',
    `/platform/users/${userId}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '获取用户详情失败');
  }

  return response.data;
}

/**
 * 切换用户状态（启用/禁用）
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  const response = await request<{ message: string }>(
    'post',
    `/platform/users/${userId}/toggle-status`,
    { isActive }
  );

  if (!response.success) {
    throw new Error(response.error?.message || '切换用户状态失败');
  }
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await request<{ message: string }>(
    'delete',
    `/platform/users/${userId}`
  );

  if (!response.success) {
    throw new Error(response.error?.message || '删除用户失败');
  }
}

// ============ Helper Functions ============

// 格式化函数 - 从统一工具导入并重新导出
export { formatMoney } from '../utils/money';

/**
 * 获取状态标签颜色
 */
export function getStatusColor(status: BrandStatus): string {
  const colors: Record<BrandStatus, string> = {
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
    SUSPENDED: 'default',
  };
  return colors[status] || 'default';
}

/**
 * 获取状态标签文本
 */
export function getStatusText(status: BrandStatus): string {
  const texts: Record<BrandStatus, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    SUSPENDED: '已暂停',
  };
  return texts[status] || status;
}

/**
 * 获取套餐类型文本
 */
export function getPlanTypeText(planType: PlanType): string {
  const texts: Record<PlanType, string> = {
    FREE: '免费版',
    PERSONAL: '个人版',
    PROFESSIONAL: '专业版',
    ENTERPRISE: '企业版',
  };
  return texts[planType] || planType;
}

/**
 * 获取套餐类型颜色
 */
export function getPlanTypeColor(planType: PlanType): string {
  const colors: Record<PlanType, string> = {
    FREE: 'default',
    PERSONAL: 'cyan',
    PROFESSIONAL: 'blue',
    ENTERPRISE: 'gold',
  };
  return colors[planType] || 'default';
}

// ============ 独立商务管理 ============

/**
 * 获取独立商务列表
 */
export async function getIndependentBusinessUsers(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<PaginatedResult<any>> {
  const response = await request<PaginatedResult<any>>('get', '/platform/users/independent', params);
  if (!response.success) {
    throw new Error(response.error?.message || '获取独立商务列表失败');
  }
  return response.data!;
}

/**
 * 获取品牌成员列表
 */
export async function getBrandMembers(brandId: string): Promise<{
  brandId: string;
  brandName: string;
  members: any[];
}> {
  const response = await request<any>('get', `/platform/brands/${brandId}/members`);
  if (!response.success) {
    throw new Error(response.error?.message || '获取品牌成员列表失败');
  }
  return response.data!;
}

/**
 * 将独立商务划归到品牌
 */
export async function assignUserToBrand(userId: string, brandId: string): Promise<void> {
  const response = await request('post', `/platform/users/${userId}/assign-brand`, { brandId });
  if (!response.success) {
    throw new Error(response.error?.message || '划归失败');
  }
}
