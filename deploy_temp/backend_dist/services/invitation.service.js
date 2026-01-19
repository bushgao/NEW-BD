"use strict";
/**
 * 邀请服务
 *
 * 处理品牌邀请商务相关逻辑
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitation = createInvitation;
exports.getInvitationByCode = getInvitationByCode;
exports.useInvitation = useInvitation;
exports.listInvitations = listInvitations;
exports.revokeInvitation = revokeInvitation;
exports.findIndependentBusinessByPhone = findIndependentBusinessByPhone;
exports.createTargetedInvitation = createTargetedInvitation;
exports.getReceivedInvitations = getReceivedInvitations;
exports.acceptTargetedInvitation = acceptTargetedInvitation;
exports.rejectTargetedInvitation = rejectTargetedInvitation;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
// ============ Helper Functions ============
/**
 * 生成8位随机邀请码
 */
function generateInviteCode() {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
}
// ============ Service Functions ============
/**
 * 创建邀请
 */
async function createInvitation(input) {
    const { brandId, inviterId } = input;
    // 验证品牌存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: { owner: true },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('品牌不存在');
    }
    // 验证邀请人是品牌所有者或商务
    const inviter = await prisma_1.default.user.findUnique({
        where: { id: inviterId },
    });
    if (!inviter) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    // 检查是否有权限邀请（品牌所有者或属于该品牌的商务）
    const isOwner = brand.ownerId === inviterId;
    const isBrandStaff = inviter.brandId === brandId;
    if (!isOwner && !isBrandStaff) {
        throw (0, errorHandler_1.createForbiddenError)('无权为该品牌创建邀请');
    }
    // 生成邀请码（确保唯一）
    let code;
    let existingCode;
    do {
        code = generateInviteCode();
        existingCode = await prisma_1.default.invitation.findUnique({ where: { code } });
    } while (existingCode);
    // 创建邀请（7天有效期）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invitation = await prisma_1.default.invitation.create({
        data: {
            code,
            brandId,
            inviterId,
            expiresAt,
            status: 'PENDING',
        },
        include: {
            brand: true,
            inviter: true,
            usedBy: true,
        },
    });
    return {
        id: invitation.id,
        code: invitation.code,
        brandId: invitation.brandId,
        brandName: invitation.brand.name,
        inviterName: invitation.inviter.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        usedAt: invitation.usedAt,
        usedByName: invitation.usedBy?.name || null,
    };
}
/**
 * 获取邀请详情（根据邀请码，公开接口）
 */
async function getInvitationByCode(code) {
    const invitation = await prisma_1.default.invitation.findUnique({
        where: { code },
        include: {
            brand: true,
            inviter: true,
            usedBy: true,
        },
    });
    if (!invitation) {
        throw (0, errorHandler_1.createNotFoundError)('邀请码无效');
    }
    // 检查是否已过期
    if (invitation.status === 'PENDING' && new Date() > invitation.expiresAt) {
        throw (0, errorHandler_1.createBadRequestError)('邀请已过期');
    }
    return {
        id: invitation.id,
        code: invitation.code,
        brandId: invitation.brandId,
        brandName: invitation.brand.name,
        inviterName: invitation.inviter.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        usedAt: invitation.usedAt,
        usedByName: invitation.usedBy?.name || null,
    };
}
/**
 * 使用邀请（注册时调用）
 */
async function useInvitation(code, userId) {
    const invitation = await prisma_1.default.invitation.findUnique({
        where: { code },
    });
    if (!invitation) {
        throw (0, errorHandler_1.createNotFoundError)('邀请码无效');
    }
    if (invitation.status !== 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)(invitation.status === 'USED' ? '邀请已被使用' : '邀请已被撤销');
    }
    if (new Date() > invitation.expiresAt) {
        throw (0, errorHandler_1.createBadRequestError)('邀请已过期');
    }
    // 在事务中更新邀请状态和用户品牌关联
    await prisma_1.default.$transaction([
        // 更新邀请状态
        prisma_1.default.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'USED',
                usedAt: new Date(),
                usedById: userId,
            },
        }),
        // 更新用户的品牌关联
        prisma_1.default.user.update({
            where: { id: userId },
            data: {
                brandId: invitation.brandId,
                isIndependent: false,
                joinedAt: new Date(),
            },
        }),
    ]);
}
/**
 * 获取品牌的邀请列表
 */
async function listInvitations(brandId, status) {
    const invitations = await prisma_1.default.invitation.findMany({
        where: {
            brandId,
            ...(status && { status }),
        },
        include: {
            brand: true,
            inviter: true,
            usedBy: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return invitations.map((invitation) => ({
        id: invitation.id,
        code: invitation.code,
        brandId: invitation.brandId,
        brandName: invitation.brand.name,
        inviterName: invitation.inviter.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        usedAt: invitation.usedAt,
        usedByName: invitation.usedBy?.name || null,
    }));
}
/**
 * 撤销邀请
 */
async function revokeInvitation(id, userId) {
    const invitation = await prisma_1.default.invitation.findUnique({
        where: { id },
        include: { brand: true },
    });
    if (!invitation) {
        throw (0, errorHandler_1.createNotFoundError)('邀请不存在');
    }
    // 验证权限（品牌所有者或邀请创建者）
    const isOwner = invitation.brand.ownerId === userId;
    const isInviter = invitation.inviterId === userId;
    if (!isOwner && !isInviter) {
        throw (0, errorHandler_1.createForbiddenError)('无权撤销该邀请');
    }
    if (invitation.status !== 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)(invitation.status === 'USED' ? '已使用的邀请无法撤销' : '邀请已被撤销');
    }
    await prisma_1.default.invitation.update({
        where: { id },
        data: {
            status: 'REVOKED',
            revokedAt: new Date(),
        },
    });
}
/**
 * 根据手机号查找独立商务用户
 * 更新：现在只按 phone 字段搜索，不再使用假邮箱格式
 */
async function findIndependentBusinessByPhone(phone) {
    // 直接按 phone 字段搜索
    const anyUser = await prisma_1.default.user.findFirst({
        where: {
            phone: phone,
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            isIndependent: true,
            brandId: true,
        },
    });
    if (!anyUser) {
        throw (0, errorHandler_1.createNotFoundError)('未找到该手机号对应的用户');
    }
    if (anyUser.role !== 'BUSINESS') {
        throw (0, errorHandler_1.createBadRequestError)(`该用户角色为 ${anyUser.role}，不是商务人员`);
    }
    if (!anyUser.isIndependent) {
        throw (0, errorHandler_1.createBadRequestError)('该用户已属于某个品牌，不是独立商务');
    }
    return {
        id: anyUser.id,
        name: anyUser.name,
        phone: anyUser.phone || phone, // 如果 phone 为空，返回搜索时使用的手机号
        email: anyUser.email,
    };
}
/**
 * 创建定向邀请（通过手机号邀请已存在的独立商务）
 */
async function createTargetedInvitation(input) {
    const { brandId, inviterId, targetPhone } = input;
    // 验证品牌存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: { owner: true },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('品牌不存在');
    }
    // 验证邀请人权限
    const inviter = await prisma_1.default.user.findUnique({
        where: { id: inviterId },
    });
    if (!inviter) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    const isOwner = brand.ownerId === inviterId;
    const isBrandStaff = inviter.brandId === brandId;
    if (!isOwner && !isBrandStaff) {
        throw (0, errorHandler_1.createForbiddenError)('无权为该品牌创建邀请');
    }
    // 根据手机号查找独立商务
    const targetUser = await findIndependentBusinessByPhone(targetPhone);
    if (!targetUser) {
        throw (0, errorHandler_1.createNotFoundError)('未找到该手机号对应的独立商务用户');
    }
    // 检查是否已有待处理的邀请
    const existingInvite = await prisma_1.default.invitation.findFirst({
        where: {
            brandId,
            targetUserId: targetUser.id,
            status: 'PENDING',
        },
    });
    if (existingInvite) {
        throw (0, errorHandler_1.createBadRequestError)('已向该用户发送过邀请，请等待对方确认');
    }
    // 生成邀请码
    let code;
    let existingCode;
    do {
        code = generateInviteCode();
        existingCode = await prisma_1.default.invitation.findUnique({ where: { code } });
    } while (existingCode);
    // 创建定向邀请（7天有效期）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invitation = await prisma_1.default.invitation.create({
        data: {
            code,
            brandId,
            inviterId,
            expiresAt,
            status: 'PENDING',
            inviteType: 'TARGETED',
            targetPhone,
            targetUserId: targetUser.id,
        },
        include: {
            brand: true,
            inviter: true,
            usedBy: true,
            targetUser: true,
        },
    });
    // 发送系统通知给目标用户
    await prisma_1.default.notification.create({
        data: {
            userId: targetUser.id,
            type: 'BRAND_INVITE',
            title: '您收到一个品牌邀请',
            content: `品牌「${brand.name}」邀请您加入，邀请人：${inviter.name}。请前往确认。`,
            relatedId: invitation.id,
        },
    });
    return {
        id: invitation.id,
        code: invitation.code,
        brandId: invitation.brandId,
        brandName: invitation.brand.name,
        inviterName: invitation.inviter.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        usedAt: invitation.usedAt,
        usedByName: invitation.usedBy?.name || null,
        inviteType: invitation.inviteType,
        targetPhone: invitation.targetPhone,
        targetUserId: invitation.targetUserId,
        targetUserName: invitation.targetUser?.name || null,
    };
}
/**
 * 获取我收到的定向邀请（独立商务端）
 */
async function getReceivedInvitations(userId) {
    const invitations = await prisma_1.default.invitation.findMany({
        where: {
            targetUserId: userId,
            inviteType: 'TARGETED',
            status: 'PENDING',
        },
        include: {
            brand: true,
            inviter: true,
            usedBy: true,
            targetUser: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    // 过滤掉已过期的
    const validInvitations = invitations.filter(inv => new Date() <= inv.expiresAt);
    return validInvitations.map((invitation) => ({
        id: invitation.id,
        code: invitation.code,
        brandId: invitation.brandId,
        brandName: invitation.brand.name,
        inviterName: invitation.inviter.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        usedAt: invitation.usedAt,
        usedByName: invitation.usedBy?.name || null,
        inviteType: invitation.inviteType,
        targetPhone: invitation.targetPhone,
        targetUserId: invitation.targetUserId,
        targetUserName: invitation.targetUser?.name || null,
    }));
}
/**
 * 接受定向邀请（独立商务确认加入品牌）
 */
async function acceptTargetedInvitation(code, userId, migrateInfluencers = false) {
    const invitation = await prisma_1.default.invitation.findUnique({
        where: { code },
        include: { brand: true },
    });
    if (!invitation) {
        throw (0, errorHandler_1.createNotFoundError)('邀请码无效');
    }
    // 验证是定向邀请
    if (invitation.inviteType !== 'TARGETED') {
        throw (0, errorHandler_1.createBadRequestError)('该邀请码不是定向邀请');
    }
    // 验证当前用户是目标用户
    if (invitation.targetUserId !== userId) {
        throw (0, errorHandler_1.createForbiddenError)('该邀请不是发给您的');
    }
    if (invitation.status !== 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)(invitation.status === 'USED' ? '邀请已被使用' : '邀请已被撤销');
    }
    if (new Date() > invitation.expiresAt) {
        throw (0, errorHandler_1.createBadRequestError)('邀请已过期');
    }
    // 获取用户当前的品牌（个人工作区）
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { brandId: true },
    });
    const oldBrandId = user?.brandId;
    // 在事务中完成转移
    await prisma_1.default.$transaction(async (tx) => {
        // 1. 更新邀请状态
        await tx.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'USED',
                usedAt: new Date(),
                usedById: userId,
            },
        });
        // 2. 如果选择迁移达人数据，迁移所有业务数据
        if (migrateInfluencers && oldBrandId) {
            // 迁移达人
            await tx.influencer.updateMany({
                where: { brandId: oldBrandId },
                data: { brandId: invitation.brandId },
            });
            // 迁移合作记录（SampleDispatch、FollowUpRecord、CollaborationResult 通过外键关联自动跟随）
            await tx.collaboration.updateMany({
                where: { brandId: oldBrandId },
                data: { brandId: invitation.brandId },
            });
            // 迁移样品（独立商务自己创建的样品）
            await tx.sample.updateMany({
                where: { brandId: oldBrandId },
                data: { brandId: invitation.brandId },
            });
            // 迁移达人分组
            await tx.influencerGroup.updateMany({
                where: { brandId: oldBrandId },
                data: { brandId: invitation.brandId },
            });
        }
        // 3. 更新用户的品牌关联
        await tx.user.update({
            where: { id: userId },
            data: {
                brandId: invitation.brandId,
                isIndependent: false,
                joinedAt: new Date(),
            },
        });
        // 4. 如果不迁移数据，删除空的个人品牌工作区
        if (!migrateInfluencers && oldBrandId) {
            // 检查个人品牌是否还有数据
            const influencerCount = await tx.influencer.count({ where: { brandId: oldBrandId } });
            if (influencerCount === 0) {
                // 只有在没有数据时才删除
                await tx.brand.delete({ where: { id: oldBrandId } }).catch(() => {
                    // 忽略删除失败（可能有外键约束）
                });
            }
        }
    });
    // 发送通知
    await prisma_1.default.notification.create({
        data: {
            userId,
            type: 'SYSTEM',
            title: '您已加入品牌',
            content: `您已成功加入品牌「${invitation.brand.name}」。`,
        },
    });
}
/**
 * 拒绝定向邀请
 */
async function rejectTargetedInvitation(invitationId, userId) {
    const invitation = await prisma_1.default.invitation.findUnique({
        where: { id: invitationId },
    });
    if (!invitation) {
        throw (0, errorHandler_1.createNotFoundError)('邀请不存在');
    }
    if (invitation.targetUserId !== userId) {
        throw (0, errorHandler_1.createForbiddenError)('无权拒绝该邀请');
    }
    if (invitation.status !== 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)('邀请已被处理');
    }
    await prisma_1.default.invitation.update({
        where: { id: invitationId },
        data: {
            status: 'REVOKED',
            revokedAt: new Date(),
        },
    });
}
//# sourceMappingURL=invitation.service.js.map