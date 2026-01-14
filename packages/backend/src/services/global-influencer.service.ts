/**
 * 全局达人服务 (Global Influencer Service)
 * 
 * 提供全局达人的核心功能：
 * - 搜索全局达人
 * - 创建全局达人
 * - 达人认证（仅平台可操作）
 * - 达人认领
 */

import prisma from '../lib/prisma';
import {
    createNotFoundError,
    createBadRequestError,
    createConflictError,
    createForbiddenError,
} from '../middleware/errorHandler';
import type { Platform, InfluencerSourceType, VerificationStatus } from '@prisma/client';

// ============================================
// 类型定义
// ============================================

export interface PlatformAccount {
    platform: Platform;
    platformId: string;
    followers?: string;
    profileUrl?: string;
}

export interface CreateGlobalInfluencerInput {
    nickname: string;
    phone?: string;
    wechat?: string;
    platformAccounts: PlatformAccount[];
    sourceType: InfluencerSourceType;
    createdBy?: string;
}

export interface SearchGlobalInfluencerInput {
    keyword?: string;          // 昵称模糊搜索
    phone?: string;            // 手机号精确搜�?
    platform?: Platform;       // 平台筛�?
    platformId?: string;       // 平台账号ID精确搜索
    verificationStatus?: VerificationStatus;
}

export interface GlobalInfluencerDetail {
    id: string;
    nickname: string;
    phone: string | null;
    wechat: string | null;
    platformAccounts: PlatformAccount[];
    sourceType: InfluencerSourceType;
    verificationStatus: VerificationStatus;
    verifiedAt: Date | null;
    createdAt: Date;
    brandCount?: number;       // 合作品牌数（付费功能�?
    totalCollabs?: number;     // 总合作次数（付费功能�?
}

// ============================================
// 全局达人搜索
// ============================================

/**
 * 搜索全局达人
 * 用于品牌/商务添加达人时搜索已存在的达�?
 */
export async function searchGlobalInfluencers(
    input: SearchGlobalInfluencerInput,
    pagination: { page: number; pageSize: number }
): Promise<{ data: GlobalInfluencerDetail[]; total: number }> {
    const { keyword, phone, platform, platformId, verificationStatus } = input;
    const { page, pageSize } = pagination;

    // 构建查询条件
    const where: any = {};

    // 昵称模糊搜索
    if (keyword) {
        where.nickname = { contains: keyword, mode: 'insensitive' };
    }

    // 手机号精确搜�?
    if (phone) {
        where.phone = phone;
    }

    // 认证状态筛�?
    if (verificationStatus) {
        where.verificationStatus = verificationStatus;
    }

    // 平台和平台账号ID搜索（在JSON中搜索）
    if (platform || platformId) {
        // 使用原生SQL进行JSON数组搜索
        // 暂时使用简化版本，后续可优化为原生SQL
    }

    const total = await prisma.globalInfluencer.count({ where });

    const data = await prisma.globalInfluencer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    return {
        data: data.map(item => ({
            id: item.id,
            nickname: item.nickname,
            phone: item.phone,
            wechat: item.wechat,
            platformAccounts: item.platformAccounts as PlatformAccount[],
            sourceType: item.sourceType,
            verificationStatus: item.verificationStatus,
            verifiedAt: item.verifiedAt,
            createdAt: item.createdAt,
            brandCount: item._count.brandInfluencers,
        })),
        total,
    };
}

/**
 * 根据平台账号精确查找达人
 */
export async function findByPlatformAccount(
    platform: Platform,
    platformId: string
): Promise<GlobalInfluencerDetail | null> {
    // 在JSON数组中搜�?
    const influencers = await prisma.globalInfluencer.findMany({
        where: {
            platformAccounts: {
                array_contains: [{ platform, platformId }]
            }
        }
    });

    // 由于Prisma对JSON数组的支持有限，使用应用层过�?
    const allInfluencers = await prisma.globalInfluencer.findMany();

    for (const inf of allInfluencers) {
        const accounts = inf.platformAccounts as PlatformAccount[];
        const found = accounts.find(
            acc => acc.platform === platform && acc.platformId === platformId
        );
        if (found) {
            return {
                id: inf.id,
                nickname: inf.nickname,
                phone: inf.phone,
                wechat: inf.wechat,
                platformAccounts: accounts,
                sourceType: inf.sourceType,
                verificationStatus: inf.verificationStatus,
                verifiedAt: inf.verifiedAt,
                createdAt: inf.createdAt,
            };
        }
    }

    return null;
}

/**
 * 根据手机号查找达�?
 */
export async function findByPhone(phone: string): Promise<GlobalInfluencerDetail | null> {
    const influencer = await prisma.globalInfluencer.findFirst({
        where: { phone }
    });

    if (!influencer) return null;

    return {
        id: influencer.id,
        nickname: influencer.nickname,
        phone: influencer.phone,
        wechat: influencer.wechat,
        platformAccounts: influencer.platformAccounts as PlatformAccount[],
        sourceType: influencer.sourceType,
        verificationStatus: influencer.verificationStatus,
        verifiedAt: influencer.verifiedAt,
        createdAt: influencer.createdAt,
    };
}

// ============================================
// 全局达人创建
// ============================================

/**
 * 创建全局达人
 * 检查是否已存在（通过手机号或平台账号�?
 */
export async function createGlobalInfluencer(
    input: CreateGlobalInfluencerInput
): Promise<GlobalInfluencerDetail> {
    const { nickname, phone, wechat, platformAccounts, sourceType, createdBy } = input;

    // 检查手机号是否已存�?
    if (phone) {
        const existing = await findByPhone(phone);
        if (existing) {
            throw createConflictError('该手机号已有达人记录', { existingId: existing.id });
        }
    }

    // 检查平台账号是否已存在
    for (const account of platformAccounts) {
        const existing = await findByPlatformAccount(account.platform, account.platformId);
        if (existing) {
            throw createConflictError(
                `${account.platform} 平台账号 ${account.platformId} 已存在`,
                { existingId: existing.id }
            );
        }
    }

    const influencer = await prisma.globalInfluencer.create({
        data: {
            nickname: nickname.trim(),
            phone: phone?.trim() || null,
            wechat: wechat?.trim() || null,
            platformAccounts: platformAccounts,
            sourceType,
            createdBy,
        }
    });

    return {
        id: influencer.id,
        nickname: influencer.nickname,
        phone: influencer.phone,
        wechat: influencer.wechat,
        platformAccounts: influencer.platformAccounts as PlatformAccount[],
        sourceType: influencer.sourceType,
        verificationStatus: influencer.verificationStatus,
        verifiedAt: influencer.verifiedAt,
        createdAt: influencer.createdAt,
    };
}

/**
 * 获取全局达人详情
 */
export async function getGlobalInfluencerById(id: string): Promise<GlobalInfluencerDetail> {
    const influencer = await prisma.globalInfluencer.findUnique({
        where: { id },
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    if (!influencer) {
        throw createNotFoundError('达人不存�?);
    }

    return {
        id: influencer.id,
        nickname: influencer.nickname,
        phone: influencer.phone,
        wechat: influencer.wechat,
        platformAccounts: influencer.platformAccounts as PlatformAccount[],
        sourceType: influencer.sourceType,
        verificationStatus: influencer.verificationStatus,
        verifiedAt: influencer.verifiedAt,
        createdAt: influencer.createdAt,
        brandCount: influencer._count.brandInfluencers,
    };
}

// ============================================
// 平台认证（仅平台管理员可操作�?
// ============================================

/**
 * 认证达人（仅平台管理员）
 */
export async function verifyInfluencer(
    influencerId: string,
    verifiedBy: string,
    status: 'VERIFIED' | 'REJECTED',
    note?: string
): Promise<GlobalInfluencerDetail> {
    const influencer = await prisma.globalInfluencer.findUnique({
        where: { id: influencerId }
    });

    if (!influencer) {
        throw createNotFoundError('达人不存�?);
    }

    const updated = await prisma.globalInfluencer.update({
        where: { id: influencerId },
        data: {
            verificationStatus: status,
            verifiedAt: new Date(),
            verifiedBy,
            verificationNote: note,
        }
    });

    return {
        id: updated.id,
        nickname: updated.nickname,
        phone: updated.phone,
        wechat: updated.wechat,
        platformAccounts: updated.platformAccounts as PlatformAccount[],
        sourceType: updated.sourceType,
        verificationStatus: updated.verificationStatus,
        verifiedAt: updated.verifiedAt,
        createdAt: updated.createdAt,
    };
}

/**
 * 获取待认证达人列表（平台管理员用�?
 */
export async function getPendingVerificationList(
    pagination: { page: number; pageSize: number }
): Promise<{ data: GlobalInfluencerDetail[]; total: number }> {
    const { page, pageSize } = pagination;

    const where = { verificationStatus: 'UNVERIFIED' as VerificationStatus };

    const total = await prisma.globalInfluencer.count({ where });

    const data = await prisma.globalInfluencer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });

    return {
        data: data.map(item => ({
            id: item.id,
            nickname: item.nickname,
            phone: item.phone,
            wechat: item.wechat,
            platformAccounts: item.platformAccounts as PlatformAccount[],
            sourceType: item.sourceType,
            verificationStatus: item.verificationStatus,
            verifiedAt: item.verifiedAt,
            createdAt: item.createdAt,
        })),
        total,
    };
}

// ============================================
// 达人认领（达人自己注册后关联�?
// ============================================

/**
 * 达人认领已有记录
 * 通过手机号匹配，将全局达人关联到达人账�?
 */
export async function claimInfluencer(
    accountId: string,
    phone: string
): Promise<GlobalInfluencerDetail[]> {
    // 查找手机号匹配的全局达人
    const influencers = await prisma.globalInfluencer.findMany({
        where: { phone }
    });

    if (influencers.length === 0) {
        return [];
    }

    // 更新所有匹配的达人，关联到账号
    await prisma.globalInfluencer.updateMany({
        where: { phone },
        data: { accountId }
    });

    // 返回更新后的达人列表
    const updated = await prisma.globalInfluencer.findMany({
        where: { accountId },
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    return updated.map(item => ({
        id: item.id,
        nickname: item.nickname,
        phone: item.phone,
        wechat: item.wechat,
        platformAccounts: item.platformAccounts as PlatformAccount[],
        sourceType: item.sourceType,
        verificationStatus: item.verificationStatus,
        verifiedAt: item.verifiedAt,
        createdAt: item.createdAt,
        brandCount: item._count.brandInfluencers,
    }));
}

/**
 * 获取达人账号关联的所有全局达人
 */
export async function getClaimedInfluencers(
    accountId: string
): Promise<GlobalInfluencerDetail[]> {
    const influencers = await prisma.globalInfluencer.findMany({
        where: { accountId },
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    return influencers.map(item => ({
        id: item.id,
        nickname: item.nickname,
        phone: item.phone,
        wechat: item.wechat,
        platformAccounts: item.platformAccounts as PlatformAccount[],
        sourceType: item.sourceType,
        verificationStatus: item.verificationStatus,
        verifiedAt: item.verifiedAt,
        createdAt: item.createdAt,
        brandCount: item._count.brandInfluencers,
    }));
}

// ============================================
// 账号绑定（平台管理员手动绑定�?
// ============================================

/**
 * 绑定达人账号（平台管理员操作�?
 * �?GlobalInfluencer 关联到一�?InfluencerAccount
 */
export async function bindInfluencerAccount(
    influencerId: string,
    accountId: string
): Promise<GlobalInfluencerDetail> {
    // 检查达人是否存�?
    const influencer = await prisma.globalInfluencer.findUnique({
        where: { id: influencerId }
    });

    if (!influencer) {
        throw createNotFoundError('达人不存�?);
    }

    // 检查账号是否存�?
    const account = await prisma.influencerAccount.findUnique({
        where: { id: accountId }
    });

    if (!account) {
        throw createNotFoundError('达人账号不存�?);
    }

    // 检查是否已绑定其他账号
    if (influencer.accountId && influencer.accountId !== accountId) {
        throw createConflictError('该达人已绑定其他账号，请先解�?);
    }

    // 执行绑定
    const updated = await prisma.globalInfluencer.update({
        where: { id: influencerId },
        data: { accountId },
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    return {
        id: updated.id,
        nickname: updated.nickname,
        phone: updated.phone,
        wechat: updated.wechat,
        platformAccounts: updated.platformAccounts as PlatformAccount[],
        sourceType: updated.sourceType,
        verificationStatus: updated.verificationStatus,
        verifiedAt: updated.verifiedAt,
        createdAt: updated.createdAt,
        brandCount: updated._count.brandInfluencers,
    };
}

/**
 * 解绑达人账号（平台管理员操作�?
 */
export async function unbindInfluencerAccount(
    influencerId: string
): Promise<GlobalInfluencerDetail> {
    const influencer = await prisma.globalInfluencer.findUnique({
        where: { id: influencerId }
    });

    if (!influencer) {
        throw createNotFoundError('达人不存�?);
    }

    if (!influencer.accountId) {
        throw createBadRequestError('该达人未绑定账号');
    }

    const updated = await prisma.globalInfluencer.update({
        where: { id: influencerId },
        data: { accountId: null },
        include: {
            _count: {
                select: { brandInfluencers: true }
            }
        }
    });

    return {
        id: updated.id,
        nickname: updated.nickname,
        phone: updated.phone,
        wechat: updated.wechat,
        platformAccounts: updated.platformAccounts as PlatformAccount[],
        sourceType: updated.sourceType,
        verificationStatus: updated.verificationStatus,
        verifiedAt: updated.verifiedAt,
        createdAt: updated.createdAt,
        brandCount: updated._count.brandInfluencers,
    };
}

/**
 * 通过手机号搜索达人账号（用于绑定时查找）
 */
export async function searchInfluencerAccount(phone: string) {
    const account = await prisma.influencerAccount.findFirst({
        where: { primaryPhone: phone },
        include: {
            contacts: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!account) {
        return null;
    }

    return {
        id: account.id,
        primaryPhone: account.primaryPhone,
        createdAt: account.createdAt,
        contactCount: account.contacts.length,
    };
}
