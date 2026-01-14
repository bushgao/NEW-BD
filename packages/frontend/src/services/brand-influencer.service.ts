/**
 * 品牌达人服务 (Brand Influencer Service)
 * 
 * 连接新版品牌达人API
 */

import api from './api';
import type { Platform, VerificationStatus, PlatformAccount, GlobalInfluencer } from './global-influencer.service';

export { PLATFORM_LABELS, VERIFICATION_STATUS_LABELS, SOURCE_TYPE_LABELS } from './global-influencer.service';
export type { Platform, VerificationStatus, PlatformAccount };

// 品牌达人（包含全局达人信息和品牌自定义信息�?
export interface BrandInfluencer {
    id: string;
    brandId: string;
    globalInfluencerId: string;

    // 全局达人信息
    nickname: string;
    phone: string | null;
    wechat: string | null;
    platformAccounts: PlatformAccount[];
    verificationStatus: VerificationStatus;

    // 品牌自定义信�?
    tags: string[];
    notes: string | null;
    categories: string[];
    groupId: string | null;

    // 元数�?
    addedAt: string;
    addedByName?: string;

    // 付费功能
    brandCount?: number;
    totalCollabs?: number;
    avgROI?: number;
}

// 筛选参�?
export interface BrandInfluencerFilter {
    keyword?: string;
    tags?: string[];
    categories?: string[];
    groupId?: string | null;
    verificationStatus?: VerificationStatus;
    page?: number;
    pageSize?: number;
}

// 创建参数
export interface CreateBrandInfluencerInput {
    nickname: string;
    phone?: string;
    wechat?: string;
    platform: Platform;
    platformId: string;
    followers?: string;
    tags?: string[];
    notes?: string;
    categories?: string[];
    groupId?: string;
}

// 关联已有达人参数
export interface AddExistingInfluencerInput {
    globalInfluencerId: string;
    tags?: string[];
    notes?: string;
    categories?: string[];
    groupId?: string;
}

// 更新参数
export interface UpdateBrandInfluencerInput {
    tags?: string[];
    notes?: string;
    categories?: string[];
    groupId?: string | null;
}

// 全局搜索结果（带是否已添加标记）
export interface GlobalInfluencerSearchResult extends GlobalInfluencer {
    isAdded: boolean;
}

// ============================================
// API 函数
// ============================================

/**
 * 获取品牌达人列表
 */
export async function listBrandInfluencers(
    filter: BrandInfluencerFilter = {}
): Promise<{ data: BrandInfluencer[]; total: number }> {
    const params: Record<string, any> = {
        page: filter.page || 1,
        pageSize: filter.pageSize || 20,
    };

    if (filter.keyword) params.keyword = filter.keyword;
    if (filter.tags?.length) params.tags = filter.tags.join(',');
    if (filter.categories?.length) params.categories = filter.categories.join(',');
    if (filter.groupId !== undefined) params.groupId = filter.groupId;
    if (filter.verificationStatus) params.verificationStatus = filter.verificationStatus;

    const response = await api.get('/brand-influencers', { params });
    return {
        data: response.data.data,
        total: response.data.pagination?.total || 0,
    };
}

/**
 * 搜索全局达人（用于添加）
 */
export async function searchGlobalInfluencersForFactory(
    params: {
        keyword?: string;
        phone?: string;
        platform?: Platform;
        platformId?: string;
        page?: number;
        pageSize?: number;
    } = {}
): Promise<{ data: GlobalInfluencerSearchResult[]; total: number }> {
    const response = await api.get('/brand-influencers/search-global', { params });
    return {
        data: response.data.data,
        total: response.data.pagination?.total || 0,
    };
}

/**
 * 关联已有全局达人
 */
export async function addExistingInfluencer(
    data: AddExistingInfluencerInput
): Promise<BrandInfluencer> {
    const response = await api.post('/brand-influencers/add-existing', data);
    return response.data.data;
}

/**
 * 创建并添加新达人
 */
export async function createAndAddInfluencer(
    data: CreateBrandInfluencerInput
): Promise<{ brandInfluencer: BrandInfluencer; isNew: boolean }> {
    const response = await api.post('/brand-influencers', data);
    return {
        brandInfluencer: response.data.data,
        isNew: response.data.isNew,
    };
}

/**
 * 获取达人详情
 */
export async function getBrandInfluencer(id: string): Promise<BrandInfluencer> {
    const response = await api.get(`/brand-influencers/${id}`);
    return response.data.data;
}

/**
 * 更新达人信息（品牌自定义�?
 */
export async function updateBrandInfluencer(
    id: string,
    data: UpdateBrandInfluencerInput
): Promise<BrandInfluencer> {
    const response = await api.patch(`/brand-influencers/${id}`, data);
    return response.data.data;
}

/**
 * 删除达人（取消关联）
 */
export async function removeBrandInfluencer(id: string): Promise<void> {
    await api.delete(`/brand-influencers/${id}`);
}
