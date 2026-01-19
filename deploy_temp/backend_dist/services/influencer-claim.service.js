"use strict";
/**
 * 达人认领服务 (Influencer Claim Service)
 *
 * 提供达人与品牌录入记录的匹配和认领功能：
 * - 自动匹配：根据手机号、微信号等字段匹配
 * - 待认领列表：获取匹配但未关联的记录
 * - 确认认领：建立达人账号与品牌记录的关联
 * - 手动关联：后台管理员手动关联
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingAccount = findMatchingAccount;
exports.autoLinkOnCreate = autoLinkOnCreate;
exports.getPendingClaims = getPendingClaims;
exports.getPendingClaimCount = getPendingClaimCount;
exports.confirmClaim = confirmClaim;
exports.cancelClaim = cancelClaim;
exports.manualLink = manualLink;
exports.manualUnlink = manualUnlink;
exports.getClaimedInfluencers = getClaimedInfluencers;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ============================================
// 自动匹配逻辑
// ============================================
/**
 * 根据达人信息查找匹配的已注册账号
 *
 * 匹配优先级：
 * 1. 手机号（高置信度）
 * 2. 微信号（高置信度）
 * 3. 后续可扩展：平台UID等
 */
async function findMatchingAccount(data) {
    // 1. 按手机号匹配
    if (data.phone) {
        const account = await prisma_1.default.influencerAccount.findFirst({
            where: { primaryPhone: data.phone },
        });
        if (account) {
            return { accountId: account.id, matchedBy: 'PHONE' };
        }
    }
    // 2. 按微信号匹配
    if (data.wechat) {
        const account = await prisma_1.default.influencerAccount.findFirst({
            where: { wechatId: data.wechat },
        });
        if (account) {
            return { accountId: account.id, matchedBy: 'WECHAT' };
        }
    }
    return null;
}
/**
 * 录入达人时自动关联已注册账号
 *
 * 场景 B：达人先注册，商务后录入时自动匹配
 */
async function autoLinkOnCreate(influencerId) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        select: { id: true, phone: true, wechat: true, accountId: true },
    });
    if (!influencer)
        return null;
    if (influencer.accountId)
        return null; // 已关联
    const match = await findMatchingAccount({
        phone: influencer.phone,
        wechat: influencer.wechat,
    });
    if (match) {
        await prisma_1.default.influencer.update({
            where: { id: influencerId },
            data: {
                accountId: match.accountId,
                claimedAt: new Date(),
            },
        });
        return {
            influencerId,
            accountId: match.accountId,
            matchedBy: match.matchedBy,
            confidence: 'HIGH',
        };
    }
    return null;
}
// ============================================
// 认领服务
// ============================================
/**
 * 获取达人的待认领记录
 *
 * 场景 A：商务先录入，达人后注册登录后查看待认领
 */
async function getPendingClaims(accountId) {
    const account = await prisma_1.default.influencerAccount.findUnique({
        where: { id: accountId },
        select: { primaryPhone: true, wechatId: true },
    });
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    // 构建匹配条件
    const orConditions = [];
    if (account.primaryPhone) {
        orConditions.push({ phone: account.primaryPhone });
    }
    if (account.wechatId) {
        orConditions.push({ wechat: account.wechatId });
    }
    if (orConditions.length === 0) {
        return [];
    }
    // 查找匹配但未关联的记录
    const influencers = await prisma_1.default.influencer.findMany({
        where: {
            accountId: null, // 未关联
            OR: orConditions,
        },
        include: {
            brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return influencers.map((inf) => ({
        id: inf.id,
        brandId: inf.brand.id,
        brandName: inf.brand.name,
        nickname: inf.nickname,
        platform: inf.platform,
        platformId: inf.platformId,
        phone: inf.phone,
        wechat: inf.wechat,
        matchedBy: inf.phone === account.primaryPhone ? 'PHONE' : 'WECHAT',
        createdAt: inf.createdAt,
    }));
}
/**
 * 获取待认领数量（用于徽标显示）
 */
async function getPendingClaimCount(accountId) {
    const claims = await getPendingClaims(accountId);
    return claims.length;
}
/**
 * 确认认领
 */
async function confirmClaim(accountId, influencerId) {
    // 验证记录存在且未被认领
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        select: { id: true, accountId: true, phone: true, wechat: true },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人记录不存在');
    }
    if (influencer.accountId) {
        throw (0, errorHandler_1.createBadRequestError)('该记录已被认领');
    }
    // 验证账号信息匹配
    const account = await prisma_1.default.influencerAccount.findUnique({
        where: { id: accountId },
        select: { primaryPhone: true, wechatId: true },
    });
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    const isPhoneMatch = account.primaryPhone && influencer.phone === account.primaryPhone;
    const isWechatMatch = account.wechatId && influencer.wechat === account.wechatId;
    if (!isPhoneMatch && !isWechatMatch) {
        throw (0, errorHandler_1.createBadRequestError)('账号信息不匹配，无法认领');
    }
    // 执行认领
    await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: {
            accountId,
            claimedAt: new Date(),
        },
    });
}
/**
 * 取消认领
 */
async function cancelClaim(accountId, influencerId) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        select: { accountId: true },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人记录不存在');
    }
    if (influencer.accountId !== accountId) {
        throw (0, errorHandler_1.createBadRequestError)('只能取消自己认领的记录');
    }
    await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: {
            accountId: null,
            claimedAt: null,
        },
    });
}
// ============================================
// 后台管理功能
// ============================================
/**
 * 手动关联（管理员操作）
 */
async function manualLink(influencerId, accountId, operatorId) {
    // 验证记录存在
    const [influencer, account] = await Promise.all([
        prisma_1.default.influencer.findUnique({ where: { id: influencerId } }),
        prisma_1.default.influencerAccount.findUnique({ where: { id: accountId } }),
    ]);
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人记录不存在');
    }
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: {
            accountId,
            claimedAt: new Date(),
            // 可以添加操作日志
        },
    });
    console.log(`[Claim] 手动关联: Influencer ${influencerId} -> Account ${accountId}, 操作者: ${operatorId}`);
}
/**
 * 解除关联（管理员操作）
 */
async function manualUnlink(influencerId, operatorId) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        select: { accountId: true },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人记录不存在');
    }
    if (!influencer.accountId) {
        throw (0, errorHandler_1.createBadRequestError)('该记录未关联达人账号');
    }
    await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: {
            accountId: null,
            claimedAt: null,
        },
    });
    console.log(`[Claim] 解除关联: Influencer ${influencerId}, 操作者: ${operatorId}`);
}
/**
 * 获取所有已认领记录（管理后台）
 */
async function getClaimedInfluencers(accountId) {
    return prisma_1.default.influencer.findMany({
        where: { accountId },
        include: {
            brand: { select: { id: true, name: true } },
        },
        orderBy: { claimedAt: 'desc' },
    });
}
//# sourceMappingURL=influencer-claim.service.js.map