/**
 * 全局达人服务 (Global Influencer Service)
 * 
 * 连接新版全局达人API
 */

import api from './api';

// 平台枚举
export type Platform = 'DOUYIN' | 'KUAISHOU' | 'SHIPINHAO' | 'XIAOHONGSHU';

export const PLATFORM_LABELS: Record<Platform, string> = {
    DOUYIN: '抖音',
    KUAISHOU: '快手',
    SHIPINHAO: '视频号',
    XIAOHONGSHU: '小红书',
};

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
    UNVERIFIED: '未认证',
    VERIFIED: '已认证',
    REJECTED: '认证拒绝',
};

export type InfluencerSourceType = 'PLATFORM' | 'FACTORY' | 'STAFF' | 'SELF_REGISTER';

export const SOURCE_TYPE_LABELS: Record<InfluencerSourceType, string> = {
    PLATFORM: '平台添加',
    FACTORY: '品牌添加',
    STAFF: '商务添加',
    SELF_REGISTER: '达人自注册',
};

// 平台账号信息
export interface PlatformAccount {
    platform: Platform;
    platformId: string;
    followers?: string;
    profileUrl?: string;
}

// 全局达人
export interface GlobalInfluencer {
    id: string;
    nickname: string;
    phone: string | null;
    wechat: string | null;
    platformAccounts: PlatformAccount[];
    sourceType: InfluencerSourceType;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    createdAt: string;
    brandCount?: number;
    totalCollabs?: number;
}

// 搜索参数
export interface SearchGlobalInfluencerParams {
    keyword?: string;
    phone?: string;
    platform?: Platform;
    platformId?: string;
    verificationStatus?: VerificationStatus;
    page?: number;
    pageSize?: number;
}

// 创建参数
export interface CreateGlobalInfluencerInput {
    nickname: string;
    phone?: string;
    wechat?: string;
    platformAccounts: PlatformAccount[];
}

// ============================================
// API 函数
// ============================================

/**
 * 搜索全局达人
 */
export async function searchGlobalInfluencers(
    params: SearchGlobalInfluencerParams = {}
): Promise<{ data: GlobalInfluencer[]; total: number }> {
    const response = await api.get('/global-influencers/search', { params });
    return {
        data: response.data.data,
        total: response.data.pagination?.total || 0,
    };
}

/**
 * 获取全局达人详情
 */
export async function getGlobalInfluencer(id: string): Promise<GlobalInfluencer> {
    const response = await api.get(`/global-influencers/${id}`);
    return response.data.data;
}

/**
 * 创建全局达人（平台管理员）
 */
export async function createGlobalInfluencer(
    data: CreateGlobalInfluencerInput
): Promise<GlobalInfluencer> {
    const response = await api.post('/global-influencers', data);
    return response.data.data;
}

/**
 * 获取待认证达人列表（平台管理员）
 */
export async function getPendingVerificationList(
    params: { page?: number; pageSize?: number } = {}
): Promise<{ data: GlobalInfluencer[]; total: number }> {
    const response = await api.get('/global-influencers/pending-verification', { params });
    return {
        data: response.data.data,
        total: response.data.pagination?.total || 0,
    };
}

/**
 * 认证达人（平台管理员）
 */
export async function verifyInfluencer(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    note?: string
): Promise<GlobalInfluencer> {
    const response = await api.post(`/global-influencers/${id}/verify`, { status, note });
    return response.data.data;
}

/**
 * 获取全局达人列表（平台管理员）
 */
export async function getGlobalInfluencerList(
    params: { keyword?: string; page?: number; pageSize?: number; createdAfter?: string } = {}
): Promise<{ data: GlobalInfluencer[]; total: number }> {
    const response = await api.get('/global-influencers', { params });
    return {
        data: response.data.data,
        total: response.data.pagination?.total || 0,
    };
}
