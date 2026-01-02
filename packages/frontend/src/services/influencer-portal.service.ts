/**
 * 达人端口 API 服务
 * 
 * 提供达人端口的所有 API 调用
 */

// 类型定义（与后端枚举对应）
export type ContactType = 'SELF' | 'ASSISTANT' | 'AGENT' | 'OTHER';
export type ReceivedStatus = 'PENDING' | 'RECEIVED' | 'LOST';
export type PipelineStage = 'CONTACTED' | 'SAMPLE_SENT' | 'FOLLOW_UP' | 'PUBLISHED' | 'REVIEWED' | 'BLOCKED';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================
// 类型定义
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  message?: string;
}

export interface InfluencerContact {
  id: string;
  accountId: string;
  phone: string;
  name: string | null;
  contactType: ContactType;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface InfluencerAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accountId: string;
  contactId: string;
}

export interface InfluencerDashboard {
  sampleStats: {
    total: number;
    pending: number;
    received: number;
  };
  collabStats: {
    total: number;
    inProgress: number;
    completed: number;
  };
  recentSamples: InfluencerSampleItem[];
}

export interface InfluencerSampleItem {
  id: string;
  sampleName: string;
  sampleSku: string;
  factoryId: string;
  factoryName: string;
  dispatchedAt: string;
  trackingNumber: string | null;
  receivedStatus: ReceivedStatus;
  receivedAt: string | null;
  quantity: number;
}

export interface InfluencerSampleList {
  items: InfluencerSampleItem[];
  total: number;
  groupedByFactory: {
    factoryId: string;
    factoryName: string;
    samples: InfluencerSampleItem[];
  }[];
}

export interface SampleFilter {
  factoryId?: string;
  receivedStatus?: ReceivedStatus;
  startDate?: string;
  endDate?: string;
}

export interface InfluencerCollabItem {
  id: string;
  factoryId: string;
  factoryName: string;
  stage: PipelineStage;
  deadline: string | null;
  isOverdue: boolean;
  sampleCount: number;
  createdAt: string;
}

export interface InfluencerCollabList {
  items: InfluencerCollabItem[];
  total: number;
}

export interface CollabFilter {
  factoryId?: string;
  stage?: PipelineStage;
  isOverdue?: boolean;
}

export interface InfluencerCollabDetail {
  id: string;
  factoryId: string;
  factoryName: string;
  stage: PipelineStage;
  deadline: string | null;
  isOverdue: boolean;
  createdAt: string;
  samples: InfluencerSampleItem[];
  stageHistory: {
    stage: PipelineStage;
    changedAt: string;
  }[];
}

export interface InfluencerAccountInfo {
  id: string;
  primaryPhone: string;
  createdAt: string;
  updatedAt: string;
  contacts: InfluencerContact[];
}

export interface AddContactInput {
  phone: string;
  name?: string;
  contactType: ContactType;
}

export interface FactoryOption {
  id: string;
  name: string;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取达人 Token
 */
function getInfluencerToken(): string | null {
  return localStorage.getItem('influencer_token');
}

/**
 * 构建请求头
 */
function buildHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getInfluencerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * 处理响应
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      error: {
        message: data.error?.message || data.message || '请求失败',
        code: data.error?.code,
      },
    };
  }
  
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
}

// ============================================
// 认证 API
// ============================================

/**
 * 发送验证码
 */
export async function sendVerificationCode(phone: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/influencer-portal/auth/send-code`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({ phone }),
  });
  
  return handleResponse(response);
}

/**
 * 验证码登录
 */
export async function login(
  phone: string,
  code: string
): Promise<ApiResponse<{ contact: InfluencerContact; tokens: InfluencerAuthToken }>> {
  const response = await fetch(`${API_BASE}/influencer-portal/auth/login`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({ phone, code }),
  });
  
  return handleResponse(response);
}

/**
 * 刷新 Token
 */
export async function refreshToken(
  refreshToken: string
): Promise<ApiResponse<{ tokens: InfluencerAuthToken }>> {
  const response = await fetch(`${API_BASE}/influencer-portal/auth/refresh`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({ refreshToken }),
  });
  
  return handleResponse(response);
}

/**
 * 获取当前用户信息
 */
export async function getCurrentContact(): Promise<ApiResponse<{ contact: InfluencerContact }>> {
  const response = await fetch(`${API_BASE}/influencer-portal/auth/me`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

// ============================================
// 首页 API
// ============================================

/**
 * 获取首页数据
 */
export async function getDashboard(): Promise<ApiResponse<InfluencerDashboard>> {
  const response = await fetch(`${API_BASE}/influencer-portal/dashboard`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

// ============================================
// 样品 API
// ============================================

/**
 * 获取样品列表
 */
export async function getSamples(filter?: SampleFilter): Promise<ApiResponse<InfluencerSampleList>> {
  const params = new URLSearchParams();
  
  if (filter?.factoryId) params.append('factoryId', filter.factoryId);
  if (filter?.receivedStatus) params.append('receivedStatus', filter.receivedStatus);
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  
  const queryString = params.toString();
  const url = `${API_BASE}/influencer-portal/samples${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * 确认签收样品
 */
export async function confirmSampleReceived(
  dispatchId: string
): Promise<ApiResponse<InfluencerSampleItem>> {
  const response = await fetch(`${API_BASE}/influencer-portal/samples/${dispatchId}/confirm-received`, {
    method: 'POST',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

// ============================================
// 合作 API
// ============================================

/**
 * 获取合作列表
 */
export async function getCollaborations(
  filter?: CollabFilter
): Promise<ApiResponse<InfluencerCollabList>> {
  const params = new URLSearchParams();
  
  if (filter?.factoryId) params.append('factoryId', filter.factoryId);
  if (filter?.stage) params.append('stage', filter.stage);
  if (filter?.isOverdue !== undefined) params.append('isOverdue', String(filter.isOverdue));
  
  const queryString = params.toString();
  const url = `${API_BASE}/influencer-portal/collaborations${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * 获取合作详情
 */
export async function getCollaborationDetail(
  collabId: string
): Promise<ApiResponse<InfluencerCollabDetail>> {
  const response = await fetch(`${API_BASE}/influencer-portal/collaborations/${collabId}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

// ============================================
// 账号 API
// ============================================

/**
 * 获取账号信息
 */
export async function getAccount(): Promise<ApiResponse<InfluencerAccountInfo>> {
  const response = await fetch(`${API_BASE}/influencer-portal/account`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * 获取联系人列表
 */
export async function getContacts(): Promise<ApiResponse<InfluencerContact[]>> {
  const response = await fetch(`${API_BASE}/influencer-portal/account/contacts`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * 添加联系人
 */
export async function addContact(
  data: AddContactInput
): Promise<ApiResponse<InfluencerContact>> {
  const response = await fetch(`${API_BASE}/influencer-portal/account/contacts`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
}

/**
 * 移除联系人
 */
export async function removeContact(contactId: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/influencer-portal/account/contacts/${contactId}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * 更新联系人
 */
export async function updateContact(
  contactId: string,
  data: { name?: string; contactType?: ContactType }
): Promise<ApiResponse<InfluencerContact>> {
  const response = await fetch(`${API_BASE}/influencer-portal/account/contacts/${contactId}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
}

// ============================================
// 工厂 API
// ============================================

/**
 * 获取关联的工厂列表
 */
export async function getRelatedFactories(): Promise<ApiResponse<FactoryOption[]>> {
  const response = await fetch(`${API_BASE}/influencer-portal/factories`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  
  return handleResponse(response);
}
