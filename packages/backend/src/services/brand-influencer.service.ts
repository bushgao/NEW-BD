/**
 * 品牌-达人关联服务 (Brand Influencer Service)
 * 
 * 提供品牌与达人关联的功能�?
 * - 关联已有全局达人到品�?
 * - 创建并关联新达人
 * - 列出品牌的达人列�?
 * - 管理品牌自定义标签和备注
 */

import prisma from '../lib/prisma';
import {
    createNotFoundError,
    createBadRequestError,
    createConflictError,
} from '../middleware/errorHandler';
import * as globalInfluencerService from './global-influencer.service';
import type { Platform, InfluencerSourceType, VerificationStatus, PlanType } from '@prisma/client';

// ============================================
// 类型定义
// ============================================

export interface AddInfluencerToBrandInput {
    brandId: string;
    globalInfluencerId: string;
    tags?: string[];
    notes?: string;
    categories?: string[];
    groupId?: string;
    addedBy: string;
}

export interface CreateAndAddInfluencerInput {
    brandId: string;
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
    addedBy: string;
    sourceType?: InfluencerSourceType;
}

export interface BrandInfluencerDetail {
    id: string;
    brandId: string;
    globalInfluencerId: string;

    // 全局达人信息
    nickname: string;
    phone: string | null;
    wechat: string | null;
    platformAccounts: globalInfluencerService.PlatformAccount[];
    verificationStatus: VerificationStatus;

    // 品牌自定义信�?
    tags: string[];
    notes: string | null;
    categories: string[];
    groupId: string | null;

    // 元数�?
    addedAt: Date;
    addedByName?: string;

    // 付费功能（根据套餐返回）
    brandCount?: number;
    totalCollabs?: number;
    avgROI?: number;
}

export interface BrandInfluencerFilter {
    keyword?: string;
    tags?: string[];
    categories?: string[];
    groupId?: string | null;
    verificationStatus?: VerificationStatus;
}

// ============================================
// 关联已有达人
// ============================================

/**
 * 将已有全局达人关联到品�?
 */
export async function addInfluencerToBrand(
    input: AddInfluencerToBrandInput
): Promise<BrandInfluencerDetail> {
    const { brandId, globalInfluencerId, tags, notes, categories, groupId, addedBy } = input;

    // 检查全局达人是否存在
    const globalInfluencer = await globalInfluencerService.getGlobalInfluencerById(globalInfluencerId);

    // 检查是否已经关�?
    const existing = await prisma.brandInfluencer.findUnique({
        where: {
            brandId_globalInfluencerId: { brandId, globalInfluencerId }
        }
    });

    if (existing) {
        throw createConflictError('该达人已添加到品�?);
    }

    // 创建关联
    const brandInfluencer = await prisma.brandInfluencer.create({
        data: {
            brandId,
            globalInfluencerId,
            tags: tags || [],
            notes: notes || null,
            categories: categories || [],
            groupId,
            addedBy,
        },
        include: {
            adder: { select: { name: true } }
        }
    });

    return {
        id: brandInfluencer.id,
        brandId: brandInfluencer.brandId,
        globalInfluencerId: brandInfluencer.globalInfluencerId,
        nickname: globalInfluencer.nickname,
        phone: globalInfluencer.phone,
        wechat: globalInfluencer.wechat,
        platformAccounts: globalInfluencer.platformAccounts,
        verificationStatus: globalInfluencer.verificationStatus,
        tags: brandInfluencer.tags,
        notes: brandInfluencer.notes,
        categories: brandInfluencer.categories,
        groupId: brandInfluencer.groupId,
        addedAt: brandInfluencer.addedAt,
        addedByName: brandInfluencer.adder?.name,
    };
}

/**
 * 创建新达人并关联到品�?
 * 如果达人已存在，则直接关�?
 */
export async function createAndAddInfluencer(
    input: CreateAndAddInfluencerInput
): Promise<{ brandInfluencer: BrandInfluencerDetail; isNew: boolean }> {
    const {
        brandId, nickname, phone, wechat, platform, platformId, followers,
        tags, notes, categories, groupId, addedBy, sourceType
    } = input;

    // 先检查是否已存在
    let globalInfluencer = await globalInfluencerService.findByPlatformAccount(platform, platformId);
    let isNew = false;

    if (!globalInfluencer && phone) {
        globalInfluencer = await globalInfluencerService.findByPhone(phone);
    }

    // 如果不存在，创建新达�?
    if (!globalInfluencer) {
        globalInfluencer = await globalInfluencerService.createGlobalInfluencer({
            nickname,
            phone,
            wechat,
            platformAccounts: [{
                platform,
                platformId,
                followers,
            }],
            sourceType: sourceType || 'STAFF',
            createdBy: addedBy,
        });
        isNew = true;
    }

    // 关联到品�?
    const brandInfluencer = await addInfluencerToBrand({
        brandId,
        globalInfluencerId: globalInfluencer.id,
        tags,
        notes,
        categories,
        groupId,
        addedBy,
    });

    return { brandInfluencer, isNew };
}

// ============================================
// 列出品牌达人
// ============================================

/**
 * 获取品牌的达人列�?
 */
export async function listBrandInfluencers(
    brandId: string,
    filter: BrandInfluencerFilter,
    pagination: { page: number; pageSize: number },
    planType?: PlanType
): Promise<{ data: BrandInfluencerDetail[]; total: number }> {
    const { keyword, tags, categories, groupId, verificationStatus } = filter;
    const { page, pageSize } = pagination;

    const where: any = { brandId };

    // 分组筛�?
    if (groupId !== undefined) {
        where.groupId = groupId;
    }

    // 标签筛�?
    if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
    }

    // 分类筛�?
    if (categories && categories.length > 0) {
        where.categories = { hasSome: categories };
    }

    // 认证状态筛�?
    if (verificationStatus) {
        where.globalInfluencer = { verificationStatus };
    }

    // 关键词搜索（需要搜索全局达人的昵称）
    if (keyword) {
        where.globalInfluencer = {
            ...where.globalInfluencer,
            nickname: { contains: keyword, mode: 'insensitive' },
        };
    }

    const total = await prisma.brandInfluencer.count({ where });

    const data = await prisma.brandInfluencer.findMany({
        where,
        orderBy: { addedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            globalInfluencer: {
                include: {
                    _count: {
                        select: { brandInfluencers: true }
                    }
                }
            },
            adder: { select: { name: true } },
            _count: {
                select: { collaborations: true }
            }
        }
    });

    // 根据套餐决定是否返回付费字段
    const includePaidFeatures = planType && planType !== 'FREE';

    return {
        data: data.map(item => {
            const result: BrandInfluencerDetail = {
                id: item.id,
                brandId: item.brandId,
                globalInfluencerId: item.globalInfluencerId,
                nickname: item.globalInfluencer.nickname,
                phone: item.globalInfluencer.phone,
                wechat: item.globalInfluencer.wechat,
                platformAccounts: item.globalInfluencer.platformAccounts as globalInfluencerService.PlatformAccount[],
                verificationStatus: item.globalInfluencer.verificationStatus,
                tags: item.tags,
                notes: item.notes,
                categories: item.categories,
                groupId: item.groupId,
                addedAt: item.addedAt,
                addedByName: item.adder?.name,
            };

            // 付费功能
            if (includePaidFeatures) {
                result.brandCount = item.globalInfluencer._count.brandInfluencers;
                result.totalCollabs = item._count.collaborations;
            }

            return result;
        }),
        total,
    };
}

/**
 * 获取品牌-达人关联详情
 */
export async function getBrandInfluencerById(
    id: string,
    brandId: string
): Promise<BrandInfluencerDetail> {
    const brandInfluencer = await prisma.brandInfluencer.findFirst({
        where: { id, brandId },
        include: {
            globalInfluencer: {
                include: {
                    _count: {
                        select: { brandInfluencers: true }
                    }
                }
            },
            adder: { select: { name: true } },
            _count: {
                select: { collaborations: true }
            }
        }
    });

    if (!brandInfluencer) {
        throw createNotFoundError('达人不存�?);
    }

    return {
        id: brandInfluencer.id,
        brandId: brandInfluencer.brandId,
        globalInfluencerId: brandInfluencer.globalInfluencerId,
        nickname: brandInfluencer.globalInfluencer.nickname,
        phone: brandInfluencer.globalInfluencer.phone,
        wechat: brandInfluencer.globalInfluencer.wechat,
        platformAccounts: brandInfluencer.globalInfluencer.platformAccounts as globalInfluencerService.PlatformAccount[],
        verificationStatus: brandInfluencer.globalInfluencer.verificationStatus,
        tags: brandInfluencer.tags,
        notes: brandInfluencer.notes,
        categories: brandInfluencer.categories,
        groupId: brandInfluencer.groupId,
        addedAt: brandInfluencer.addedAt,
        addedByName: brandInfluencer.adder?.name,
        brandCount: brandInfluencer.globalInfluencer._count.brandInfluencers,
        totalCollabs: brandInfluencer._count.collaborations,
    };
}

// ============================================
// 更新品牌自定义信�?
// ============================================

/**
 * 更新品牌对达人的自定义信息（标签、备注、分类、分组）
 */
export async function updateBrandInfluencer(
    id: string,
    brandId: string,
    data: {
        tags?: string[];
        notes?: string;
        categories?: string[];
        groupId?: string | null;
    }
): Promise<BrandInfluencerDetail> {
    const existing = await prisma.brandInfluencer.findFirst({
        where: { id, brandId }
    });

    if (!existing) {
        throw createNotFoundError('达人不存�?);
    }

    const updated = await prisma.brandInfluencer.update({
        where: { id },
        data: {
            tags: data.tags !== undefined ? data.tags : undefined,
            notes: data.notes !== undefined ? data.notes : undefined,
            categories: data.categories !== undefined ? data.categories : undefined,
            groupId: data.groupId !== undefined ? data.groupId : undefined,
        },
        include: {
            globalInfluencer: true,
            adder: { select: { name: true } }
        }
    });

    return {
        id: updated.id,
        brandId: updated.brandId,
        globalInfluencerId: updated.globalInfluencerId,
        nickname: updated.globalInfluencer.nickname,
        phone: updated.globalInfluencer.phone,
        wechat: updated.globalInfluencer.wechat,
        platformAccounts: updated.globalInfluencer.platformAccounts as globalInfluencerService.PlatformAccount[],
        verificationStatus: updated.globalInfluencer.verificationStatus,
        tags: updated.tags,
        notes: updated.notes,
        categories: updated.categories,
        groupId: updated.groupId,
        addedAt: updated.addedAt,
        addedByName: updated.adder?.name,
    };
}

/**
 * 删除品牌-达人关联（不删除全局达人�?
 */
export async function removeBrandInfluencer(
    id: string,
    brandId: string
): Promise<void> {
    const existing = await prisma.brandInfluencer.findFirst({
        where: { id, brandId },
        include: {
            _count: { select: { collaborations: true } }
        }
    });

    if (!existing) {
        throw createNotFoundError('达人不存�?);
    }

    if (existing._count.collaborations > 0) {
        throw createBadRequestError('该达人存在合作记录，无法删除');
    }

    await prisma.brandInfluencer.delete({ where: { id } });
}

// ============================================
// 搜索全局达人（供品牌使用�?
// ============================================

/**
 * 品牌搜索全局达人（用于添加达人时�?
 * 返回是否已关联到本品�?
 */
export async function searchGlobalInfluencersForBrand(
    brandId: string,
    input: globalInfluencerService.SearchGlobalInfluencerInput,
    pagination: { page: number; pageSize: number }
): Promise<{ data: (globalInfluencerService.GlobalInfluencerDetail & { isAdded: boolean })[]; total: number }> {
    const result = await globalInfluencerService.searchGlobalInfluencers(input, pagination);

    // 查询哪些已关联到本品�?
    const addedIds = await prisma.brandInfluencer.findMany({
        where: {
            brandId,
            globalInfluencerId: { in: result.data.map(d => d.id) }
        },
        select: { globalInfluencerId: true }
    });

    const addedIdSet = new Set(addedIds.map(a => a.globalInfluencerId));

    return {
        data: result.data.map(item => ({
            ...item,
            isAdded: addedIdSet.has(item.id),
        })),
        total: result.total,
    };
}
