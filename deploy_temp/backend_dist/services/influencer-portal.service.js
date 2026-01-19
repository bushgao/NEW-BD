"use strict";
/**
 * 达人端口服务 (Influencer Portal Service)
 *
 * 提供达人端口的核心功能：
 * - 首页数据聚合
 * - 样品列表（跨工厂聚合）
 * - 合作列表和详情
 * - 确认签收
 *
 * 注意：所有返回数据都需要过滤敏感信息（成本、ROI等）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getSamples = getSamples;
exports.getCollaborations = getCollaborations;
exports.getCollaborationDetail = getCollaborationDetail;
exports.confirmSampleReceived = confirmSampleReceived;
exports.getRelatedFactories = getRelatedFactories;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_service_1 = require("./notification.service");
// ============================================
// 辅助函数
// ============================================
/**
 * 获取达人账号关联的所有手机号
 */
async function getAccountPhones(accountId) {
    const account = await prisma_1.default.influencerAccount.findUnique({
        where: { id: accountId },
        include: { contacts: true },
    });
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    // 返回主手机号和所有联系人手机号
    const phones = new Set();
    phones.add(account.primaryPhone);
    account.contacts.forEach((c) => phones.add(c.phone));
    return Array.from(phones);
}
/**
 * 通过手机号获取所有关联的达人记录ID
 */
async function getInfluencerIdsByPhones(phones) {
    const influencers = await prisma_1.default.influencer.findMany({
        where: {
            phone: { in: phones },
        },
        select: { id: true },
    });
    return influencers.map((i) => i.id);
}
/**
 * 将寄样记录转换为达人样品项（过滤敏感信息）
 */
function toInfluencerSampleItem(dispatch) {
    return {
        id: dispatch.id,
        sampleName: dispatch.sample.name,
        sampleSku: dispatch.sample.sku,
        brandId: dispatch.collaboration.brand.id,
        factoryName: dispatch.collaboration.brand.name,
        dispatchedAt: dispatch.dispatchedAt,
        trackingNumber: dispatch.trackingNumber,
        receivedStatus: dispatch.receivedStatus,
        receivedAt: dispatch.receivedAt,
        quantity: dispatch.quantity,
        // 注意：不包含 unitCostSnapshot, totalSampleCost, shippingCost, totalCost 等敏感信息
    };
}
// ============================================
// 服务函数
// ============================================
/**
 * 获取达人首页数据
 */
async function getDashboard(accountId) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    if (influencerIds.length === 0) {
        // 没有关联的达人记录，返回空数据
        return {
            sampleStats: { total: 0, pending: 0, received: 0 },
            collabStats: { total: 0, inProgress: 0, completed: 0 },
            recentSamples: [],
        };
    }
    // 获取所有合作记录
    const collaborations = await prisma_1.default.collaboration.findMany({
        where: { influencerId: { in: influencerIds } },
        include: {
            dispatches: {
                include: {
                    sample: { select: { name: true, sku: true } },
                },
            },
            brand: { select: { id: true, name: true } },
        },
    });
    // 统计样品数据
    const allDispatches = collaborations.flatMap((c) => c.dispatches.map((d) => ({ ...d, collaboration: c })));
    const sampleStats = {
        total: allDispatches.length,
        pending: allDispatches.filter((d) => d.receivedStatus === 'PENDING').length,
        received: allDispatches.filter((d) => d.receivedStatus === 'RECEIVED').length,
    };
    // 统计合作数据
    const completedStages = ['PUBLISHED', 'REVIEWED'];
    const collabStats = {
        total: collaborations.length,
        inProgress: collaborations.filter((c) => !completedStages.includes(c.stage)).length,
        completed: collaborations.filter((c) => completedStages.includes(c.stage)).length,
    };
    // 最近5条样品
    const recentDispatches = allDispatches
        .sort((a, b) => b.dispatchedAt.getTime() - a.dispatchedAt.getTime())
        .slice(0, 5);
    const recentSamples = recentDispatches.map((d) => toInfluencerSampleItem(d));
    return {
        sampleStats,
        collabStats,
        recentSamples,
    };
}
/**
 * 获取样品列表（跨工厂聚合）
 */
async function getSamples(accountId, filter = {}) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    if (influencerIds.length === 0) {
        return { items: [], total: 0, groupedByFactory: [] };
    }
    // 构建查询条件
    const whereClause = {
        collaboration: {
            influencerId: { in: influencerIds },
        },
    };
    if (filter.brandId) {
        whereClause.collaboration.brandId = filter.brandId;
    }
    if (filter.receivedStatus) {
        whereClause.receivedStatus = filter.receivedStatus;
    }
    if (filter.startDate || filter.endDate) {
        whereClause.dispatchedAt = {};
        if (filter.startDate) {
            whereClause.dispatchedAt.gte = filter.startDate;
        }
        if (filter.endDate) {
            whereClause.dispatchedAt.lte = filter.endDate;
        }
    }
    // 查询寄样记录
    const dispatches = await prisma_1.default.sampleDispatch.findMany({
        where: whereClause,
        include: {
            sample: { select: { name: true, sku: true } },
            collaboration: {
                include: {
                    brand: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { dispatchedAt: 'desc' },
    });
    // 转换为达人样品项
    const items = dispatches.map((d) => toInfluencerSampleItem(d));
    // 按工厂分组
    const factoryMap = new Map();
    items.forEach((item) => {
        if (!factoryMap.has(item.brandId)) {
            factoryMap.set(item.brandId, {
                brandId: item.brandId,
                factoryName: item.factoryName,
                samples: [],
            });
        }
        factoryMap.get(item.brandId).samples.push(item);
    });
    const groupedByFactory = Array.from(factoryMap.values());
    return {
        items,
        total: items.length,
        groupedByFactory,
    };
}
/**
 * 获取合作列表
 */
async function getCollaborations(accountId, filter = {}) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    if (influencerIds.length === 0) {
        return { items: [], total: 0 };
    }
    // 构建查询条件
    const whereClause = {
        influencerId: { in: influencerIds },
    };
    if (filter.brandId) {
        whereClause.brandId = filter.brandId;
    }
    if (filter.stage) {
        whereClause.stage = filter.stage;
    }
    if (filter.isOverdue !== undefined) {
        whereClause.isOverdue = filter.isOverdue;
    }
    // 查询合作记录
    const collaborations = await prisma_1.default.collaboration.findMany({
        where: whereClause,
        include: {
            brand: { select: { id: true, name: true } },
            dispatches: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    // 转换为达人合作项（过滤敏感信息）
    const items = collaborations.map((c) => ({
        id: c.id,
        brandId: c.brand.id,
        factoryName: c.brand.name,
        stage: c.stage,
        deadline: c.deadline,
        isOverdue: c.isOverdue,
        sampleCount: c.dispatches.length,
        createdAt: c.createdAt,
        // 注意：不包含 blockReason, businessStaffId 等敏感信息
    }));
    return {
        items,
        total: items.length,
    };
}
/**
 * 获取合作详情
 */
async function getCollaborationDetail(accountId, collabId) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    // 查询合作记录
    const collaboration = await prisma_1.default.collaboration.findUnique({
        where: { id: collabId },
        include: {
            brand: { select: { id: true, name: true } },
            dispatches: {
                include: {
                    sample: { select: { name: true, sku: true } },
                },
            },
            stageHistory: {
                select: { toStage: true, changedAt: true },
                orderBy: { changedAt: 'asc' },
            },
        },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 验证达人是否有权限查看此合作
    if (!influencerIds.includes(collaboration.influencerId)) {
        throw (0, errorHandler_1.createForbiddenError)('您没有权限查看此合作记录');
    }
    // 转换样品数据
    const samples = collaboration.dispatches.map((d) => ({
        id: d.id,
        sampleName: d.sample.name,
        sampleSku: d.sample.sku,
        brandId: collaboration.brand.id,
        factoryName: collaboration.brand.name,
        dispatchedAt: d.dispatchedAt,
        trackingNumber: d.trackingNumber,
        receivedStatus: d.receivedStatus,
        receivedAt: d.receivedAt,
        quantity: d.quantity,
    }));
    // 转换阶段历史（过滤敏感信息）
    const stageHistory = collaboration.stageHistory.map((h) => ({
        stage: h.toStage,
        changedAt: h.changedAt,
        // 注意：不包含 notes 等敏感信息
    }));
    return {
        id: collaboration.id,
        brandId: collaboration.brand.id,
        factoryName: collaboration.brand.name,
        stage: collaboration.stage,
        deadline: collaboration.deadline,
        isOverdue: collaboration.isOverdue,
        createdAt: collaboration.createdAt,
        samples,
        stageHistory,
        // 注意：不包含 blockReason, followUps, result 等敏感信息
    };
}
/**
 * 确认签收样品
 */
async function confirmSampleReceived(accountId, dispatchId) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    // 查询寄样记录
    const dispatch = await prisma_1.default.sampleDispatch.findUnique({
        where: { id: dispatchId },
        include: {
            sample: { select: { name: true, sku: true } },
            collaboration: {
                include: {
                    brand: { select: { id: true, name: true } },
                },
            },
        },
    });
    if (!dispatch) {
        throw (0, errorHandler_1.createNotFoundError)('寄样记录不存在');
    }
    // 验证达人是否有权限操作此寄样
    if (!influencerIds.includes(dispatch.collaboration.influencerId)) {
        throw (0, errorHandler_1.createForbiddenError)('您没有权限操作此寄样记录');
    }
    // 检查是否已签收
    if (dispatch.receivedStatus === 'RECEIVED') {
        throw (0, errorHandler_1.createBadRequestError)('该样品已签收，无需重复确认');
    }
    // 更新签收状态
    const updatedDispatch = await prisma_1.default.sampleDispatch.update({
        where: { id: dispatchId },
        data: {
            receivedStatus: 'RECEIVED',
            receivedAt: new Date(),
        },
        include: {
            sample: { select: { name: true, sku: true } },
            collaboration: {
                include: {
                    brand: { select: { id: true, name: true } },
                    influencer: { select: { nickname: true } },
                },
            },
        },
    });
    // 向负责商务发送签收通知
    try {
        await (0, notification_service_1.createNotification)({
            userId: dispatch.businessStaffId,
            type: 'SAMPLE_RECEIVED',
            title: '样品已签收',
            content: `达人「${updatedDispatch.collaboration.influencer.nickname}」已确认签收样品「${updatedDispatch.sample.name}」`,
            relatedId: dispatchId,
        });
    }
    catch (error) {
        // 通知发送失败不影响主流程
        console.error('发送签收通知失败:', error);
    }
    return toInfluencerSampleItem(updatedDispatch);
}
/**
 * 获取达人关联的所有工厂列表（用于筛选）
 */
async function getRelatedFactories(accountId) {
    const phones = await getAccountPhones(accountId);
    const influencerIds = await getInfluencerIdsByPhones(phones);
    if (influencerIds.length === 0) {
        return [];
    }
    // 获取所有关联的工厂
    const collaborations = await prisma_1.default.collaboration.findMany({
        where: { influencerId: { in: influencerIds } },
        select: {
            brand: { select: { id: true, name: true } },
        },
        distinct: ['brandId'],
    });
    return collaborations.map((c) => ({
        id: c.brand.id,
        name: c.brand.name,
    }));
}
//# sourceMappingURL=influencer-portal.service.js.map