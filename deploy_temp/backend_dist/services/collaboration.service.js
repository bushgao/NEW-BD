"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCK_REASON_NAMES = exports.STAGE_ORDER = exports.STAGE_NAMES = void 0;
exports.checkInfluencerConflict = checkInfluencerConflict;
exports.createCollaboration = createCollaboration;
exports.getCollaborationById = getCollaborationById;
exports.updateCollaboration = updateCollaboration;
exports.deleteCollaboration = deleteCollaboration;
exports.listCollaborations = listCollaborations;
exports.updateStage = updateStage;
exports.getStageHistory = getStageHistory;
exports.setDeadline = setDeadline;
exports.checkAndUpdateOverdueStatus = checkAndUpdateOverdueStatus;
exports.getOverdueCollaborations = getOverdueCollaborations;
exports.getFollowUpTemplates = getFollowUpTemplates;
exports.addFollowUp = addFollowUp;
exports.getFollowUps = getFollowUps;
exports.setBlockReason = setBlockReason;
exports.getPipelineView = getPipelineView;
exports.getPipelineStats = getPipelineStats;
exports.getFollowUpReminders = getFollowUpReminders;
exports.getFollowUpAnalytics = getFollowUpAnalytics;
exports.getCollaborationSuggestions = getCollaborationSuggestions;
exports.batchUpdateCollaborations = batchUpdateCollaborations;
exports.validateData = validateData;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// 阶段名称映射
exports.STAGE_NAMES = {
    LEAD: '线索达人',
    CONTACTED: '已联系',
    QUOTED: '已报价',
    SAMPLED: '已寄样',
    SCHEDULED: '已排期',
    PUBLISHED: '已发布',
    REVIEWED: '已复盘',
};
// 阶段顺序
exports.STAGE_ORDER = [
    'LEAD',
    'CONTACTED',
    'QUOTED',
    'SAMPLED',
    'SCHEDULED',
    'PUBLISHED',
    'REVIEWED',
];
/**
 * 检查达人是否已被其他商务跟进
 * 返回所有冲突的商务列表
 */
async function checkInfluencerConflict(influencerId, brandId, currentStaffId) {
    // 查找该达人在该品牌下所有其他商务的合作记录
    // 按创建时间升序排列（最早开始跟进的在前）
    const existingCollabs = await prisma_1.default.collaboration.findMany({
        where: {
            influencerId,
            brandId,
            businessStaffId: { not: currentStaffId },
            // 排除已完成的合作记录，只检查进行中的
            stage: { not: 'REVIEWED' },
        },
        include: {
            businessStaff: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: 'asc' }, // 最早开始跟进的优先
    });
    if (existingCollabs.length > 0) {
        return {
            hasConflict: true,
            conflicts: existingCollabs.map(collab => ({
                id: collab.id,
                staffId: collab.businessStaff.id,
                staffName: collab.businessStaff.name,
                stage: collab.stage,
                stageName: exports.STAGE_NAMES[collab.stage],
                createdAt: collab.createdAt,
            })),
        };
    }
    return { hasConflict: false, conflicts: [] };
}
/**
 * 创建合作记录
 * @param data 合作记录数据
 * @param forceCreate 是否强制创建（忽略冲突警告）
 */
async function createCollaboration(data, forceCreate = false) {
    const { influencerId, brandId, businessStaffId, stage, sampleId, quotedPrice, deadline, notes } = data;
    // 验证达人是否存在于品牌的达人库中
    const influencer = await prisma_1.default.influencer.findFirst({
        where: { id: influencerId, brandId },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在于该品牌的达人库中');
    }
    // 验证商务人员存在且属于该品牌
    const staff = await prisma_1.default.user.findFirst({
        where: {
            id: businessStaffId,
            OR: [
                { brandId },
                { ownedBrand: { id: brandId } }
            ]
        },
    });
    if (!staff) {
        throw (0, errorHandler_1.createNotFoundError)('商务人员不存在或不属于该品牌');
    }
    // 检查是否有其他商务已在跟进该达人
    if (!forceCreate) {
        const conflictCheck = await checkInfluencerConflict(influencerId, brandId, businessStaffId);
        if (conflictCheck.hasConflict && conflictCheck.conflicts.length > 0) {
            // 生成所有冲突商务的描述
            const conflictDescriptions = conflictCheck.conflicts
                .map(c => `「${c.staffName}」(${c.stageName})`)
                .join('、');
            throw Object.assign(new Error(`该达人已被 ${conflictDescriptions} 跟进`), {
                name: 'CollaborationConflict',
                statusCode: 409,
                conflicts: conflictCheck.conflicts,
            });
        }
    }
    const initialStage = stage || 'LEAD';
    // 创建合作记录和初始阶段历史
    const collaboration = await prisma_1.default.collaboration.create({
        data: {
            influencerId,
            brandId,
            businessStaffId,
            stage: initialStage,
            sampleId,
            quotedPrice,
            deadline,
            isOverdue: false,
            stageHistory: {
                create: {
                    fromStage: null,
                    toStage: initialStage,
                    notes: notes || '创建合作记录',
                },
            },
        },
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
            followUps: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            dispatches: true,
            stageHistory: {
                orderBy: { changedAt: 'desc' },
            },
        },
    });
    return collaboration;
}
/**
 * 根据 ID 获取合作记录详情
 */
async function getCollaborationById(id, brandId) {
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
            sample: {
                select: { id: true, name: true, sku: true },
            },
            followUps: {
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true },
                    },
                },
            },
            dispatches: {
                include: {
                    sample: true,
                },
                orderBy: { dispatchedAt: 'desc' },
            },
            stageHistory: {
                orderBy: { changedAt: 'desc' },
            },
            result: true,
        },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    return collaboration;
}
/**
 * 更新合作记录基本信息
 */
async function updateCollaboration(id, brandId, data) {
    const existing = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    const updateData = {};
    if (data.deadline !== undefined) {
        updateData.deadline = data.deadline;
        // 更新超期状态
        if (data.deadline) {
            updateData.isOverdue = new Date() > data.deadline;
        }
        else {
            updateData.isOverdue = false;
        }
    }
    if (data.blockReason !== undefined) {
        updateData.blockReason = data.blockReason;
    }
    const collaboration = await prisma_1.default.collaboration.update({
        where: { id },
        data: updateData,
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
        },
    });
    return collaboration;
}
/**
 * 删除合作记录
 */
async function deleteCollaboration(id, brandId) {
    const existing = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
        include: {
            result: true,
        },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 如果已有合作结果，不允许删除
    if (existing.result) {
        throw (0, errorHandler_1.createBadRequestError)('该合作已有结果记录，无法删除');
    }
    // 删除关联数据（级联删除）
    await prisma_1.default.$transaction([
        prisma_1.default.followUpRecord.deleteMany({ where: { collaborationId: id } }),
        prisma_1.default.stageHistory.deleteMany({ where: { collaborationId: id } }),
        prisma_1.default.sampleDispatch.deleteMany({ where: { collaborationId: id } }),
        prisma_1.default.collaboration.delete({ where: { id } }),
    ]);
}
/**
 * 获取合作记录列表
 */
async function listCollaborations(brandId, filter, pagination, userId, userRole) {
    const { stage, businessStaffId, influencerId, isOverdue, keyword } = filter;
    const { page, pageSize } = pagination;
    const where = { brandId };
    // 权限过滤：基础商务只能看到自己的合作
    if (userId && userRole === 'BUSINESS') {
        // 从数据库获取用户权限
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });
        const permissions = user?.permissions;
        // 如果没有查看其他商务合作的权限，只显示自己的
        if (!permissions?.dataVisibility?.viewOthersCollaborations) {
            where.businessStaffId = userId;
        }
    }
    if (stage)
        where.stage = stage;
    if (businessStaffId)
        where.businessStaffId = businessStaffId;
    if (influencerId)
        where.influencerId = influencerId;
    if (isOverdue !== undefined)
        where.isOverdue = isOverdue;
    if (keyword) {
        where.influencer = {
            OR: [
                { nickname: { contains: keyword, mode: 'insensitive' } },
                { platformId: { contains: keyword, mode: 'insensitive' } },
            ],
        };
    }
    const total = await prisma_1.default.collaboration.count({ where });
    const data = await prisma_1.default.collaboration.findMany({
        where,
        orderBy: [{ isOverdue: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
            followUps: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            dispatches: true,
        },
    });
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
// ==================== 阶段状态管理 ====================
/**
 * 更新合作阶段
 */
async function updateStage(id, brandId, newStage, notes) {
    const existing = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 验证阶段值合法
    if (!exports.STAGE_ORDER.includes(newStage)) {
        throw (0, errorHandler_1.createBadRequestError)('无效的阶段状态');
    }
    const oldStage = existing.stage;
    // 如果阶段没有变化，直接返回
    if (oldStage === newStage) {
        return prisma_1.default.collaboration.findFirst({
            where: { id },
            include: {
                influencer: true,
                businessStaff: {
                    select: { id: true, name: true, email: true },
                },
                stageHistory: {
                    orderBy: { changedAt: 'desc' },
                },
            },
        });
    }
    // 更新合作记录和创建阶段历史
    const collaboration = await prisma_1.default.$transaction(async (tx) => {
        // 创建阶段变更历史
        await tx.stageHistory.create({
            data: {
                collaborationId: id,
                fromStage: oldStage,
                toStage: newStage,
                notes,
            },
        });
        // 更新合作记录
        return tx.collaboration.update({
            where: { id },
            data: {
                stage: newStage,
                // 阶段推进后，重置超期状态（如果有截止时间会重新计算）
                isOverdue: existing.deadline ? new Date() > existing.deadline : false,
            },
            include: {
                influencer: true,
                businessStaff: {
                    select: { id: true, name: true, email: true },
                },
                stageHistory: {
                    orderBy: { changedAt: 'desc' },
                },
            },
        });
    });
    return collaboration;
}
/**
 * 获取阶段变更历史
 */
async function getStageHistory(id, brandId) {
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    const history = await prisma_1.default.stageHistory.findMany({
        where: { collaborationId: id },
        orderBy: { changedAt: 'desc' },
    });
    return history.map((h) => ({
        ...h,
        fromStageName: h.fromStage ? exports.STAGE_NAMES[h.fromStage] : null,
        toStageName: exports.STAGE_NAMES[h.toStage],
    }));
}
// ==================== 截止时间和超期判断 ====================
/**
 * 设置截止时间
 */
async function setDeadline(id, brandId, deadline) {
    const existing = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 计算是否超期
    const isOverdue = deadline ? new Date() > deadline : false;
    const collaboration = await prisma_1.default.collaboration.update({
        where: { id },
        data: {
            deadline,
            isOverdue,
        },
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
        },
    });
    return collaboration;
}
/**
 * 检查并更新所有超期状态
 * 用于定时任务
 */
async function checkAndUpdateOverdueStatus(brandId) {
    const now = new Date();
    const where = {
        deadline: { not: null, lt: now },
        isOverdue: false,
        // 排除已完成的阶段
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    };
    if (brandId) {
        where.brandId = brandId;
    }
    const result = await prisma_1.default.collaboration.updateMany({
        where,
        data: { isOverdue: true },
    });
    return result.count;
}
/**
 * 获取超期合作列表
 */
async function getOverdueCollaborations(brandId, pagination) {
    const { page, pageSize } = pagination;
    const where = {
        brandId,
        isOverdue: true,
    };
    const total = await prisma_1.default.collaboration.count({ where });
    const data = await prisma_1.default.collaboration.findMany({
        where,
        orderBy: { deadline: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
        },
    });
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
// ==================== 跟进记录 ====================
/**
 * 获取跟进模板列表
 */
async function getFollowUpTemplates() {
    // 返回预定义的跟进模板
    // 在实际应用中，这些模板可以存储在数据库中，允许用户自定义
    return [
        {
            id: '1',
            name: '初次联系',
            content: '您好，我是{公司名称}的商务，看到您的账号内容很不错，想和您聊聊合作的事情。',
            category: '初次接触',
        },
        {
            id: '2',
            name: '报价跟进',
            content: '您好，关于上次的合作报价，不知道您考虑得怎么样了？如果有任何问题，欢迎随时沟通。',
            category: '报价阶段',
        },
        {
            id: '3',
            name: '样品确认',
            content: '您好，样品已经寄出，预计{天数}天内送达。收到后请及时确认，有任何问题随时联系我。',
            category: '寄样阶段',
        },
        {
            id: '4',
            name: '排期提醒',
            content: '您好，想确认一下视频的发布时间，我们这边需要提前做好准备工作。',
            category: '排期阶段',
        },
        {
            id: '5',
            name: '发布确认',
            content: '您好，看到视频已经发布了，效果很不错！麻烦您把视频链接和数据发给我，方便我们这边统计。',
            category: '发布阶段',
        },
        {
            id: '6',
            name: '礼貌催促',
            content: '您好，不好意思打扰一下，想跟进一下之前聊的合作事宜，期待您的回复。',
            category: '通用',
        },
        {
            id: '7',
            name: '感谢回复',
            content: '好的，收到！感谢您的及时回复，我们会尽快安排。',
            category: '通用',
        },
        {
            id: '8',
            name: '节日问候',
            content: '您好，{节日}快乐！祝您工作顺利，期待我们的合作。',
            category: '通用',
        },
    ];
}
/**
 * 添加跟进记录
 */
async function addFollowUp(collaborationId, brandId, userId, content) {
    // 验证合作记录存在
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id: collaborationId, brandId },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    if (!content || !content.trim()) {
        throw (0, errorHandler_1.createBadRequestError)('跟进内容不能为空');
    }
    const followUp = await prisma_1.default.followUpRecord.create({
        data: {
            collaborationId,
            userId,
            content: content.trim(),
        },
        include: {
            user: {
                select: { id: true, name: true },
            },
        },
    });
    // 更新合作记录的更新时间
    await prisma_1.default.collaboration.update({
        where: { id: collaborationId },
        data: { updatedAt: new Date() },
    });
    return followUp;
}
/**
 * 获取跟进记录列表
 */
async function getFollowUps(collaborationId, brandId, pagination) {
    // 验证合作记录存在
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id: collaborationId, brandId },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    const { page, pageSize } = pagination;
    const total = await prisma_1.default.followUpRecord.count({
        where: { collaborationId },
    });
    const data = await prisma_1.default.followUpRecord.findMany({
        where: { collaborationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            user: {
                select: { id: true, name: true },
            },
        },
    });
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
// ==================== 卡点原因 ====================
/**
 * 设置卡点原因
 */
async function setBlockReason(id, brandId, reason, notes) {
    const existing = await prisma_1.default.collaboration.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 如果设置了卡点原因，同时添加跟进记录
    const collaboration = await prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.collaboration.update({
            where: { id },
            data: { blockReason: reason },
            include: {
                influencer: true,
                businessStaff: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        // 如果有备注，添加跟进记录
        if (notes && notes.trim()) {
            const reasonText = reason ? exports.BLOCK_REASON_NAMES[reason] : '清除卡点';
            await tx.followUpRecord.create({
                data: {
                    collaborationId: id,
                    userId: existing.businessStaffId,
                    content: `[${reasonText}] ${notes.trim()}`,
                },
            });
        }
        return updated;
    });
    return collaboration;
}
// 卡点原因名称映射
exports.BLOCK_REASON_NAMES = {
    PRICE_HIGH: '报价太贵',
    DELAYED: '达人拖延',
    UNCOOPERATIVE: '不配合',
    OTHER: '其他原因',
};
// ==================== 管道视图 ====================
/**
 * 获取管道视图数据
 */
async function getPipelineView(brandId, filter, userId, userRole) {
    const where = { brandId };
    // 权限过滤：基础商务只能看到自己的合作
    if (userId && userRole === 'BUSINESS') {
        // 从数据库获取用户权限
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });
        const permissions = user?.permissions;
        // 如果没有查看其他商务合作的权限，只显示自己的
        if (!permissions?.dataVisibility?.viewOthersCollaborations) {
            where.businessStaffId = userId;
        }
    }
    if (filter?.businessStaffId) {
        where.businessStaffId = filter.businessStaffId;
    }
    if (filter?.keyword) {
        where.influencer = {
            OR: [
                { nickname: { contains: filter.keyword, mode: 'insensitive' } },
                { platformId: { contains: filter.keyword, mode: 'insensitive' } },
            ],
        };
    }
    // 获取所有合作记录
    const collaborations = await prisma_1.default.collaboration.findMany({
        where,
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true },
            },
            followUps: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            dispatches: true,
        },
        orderBy: [{ isOverdue: 'desc' }, { updatedAt: 'desc' }],
    });
    // 按阶段分组
    const stageMap = new Map();
    // 初始化所有阶段
    for (const stage of exports.STAGE_ORDER) {
        stageMap.set(stage, []);
    }
    // 分组合作记录
    for (const collab of collaborations) {
        const card = {
            id: collab.id,
            influencer: {
                id: collab.influencer.id,
                nickname: collab.influencer.nickname,
                platform: collab.influencer.platform,
                platformId: collab.influencer.platformId,
            },
            businessStaff: {
                id: collab.businessStaff.id,
                name: collab.businessStaff.name,
            },
            stage: collab.stage,
            deadline: collab.deadline,
            isOverdue: collab.isOverdue,
            blockReason: collab.blockReason,
            followUpCount: collab.followUps.length,
            dispatchCount: collab.dispatches.length,
            lastFollowUp: collab.followUps[0]?.createdAt || null,
            createdAt: collab.createdAt,
            updatedAt: collab.updatedAt,
        };
        stageMap.get(collab.stage)?.push(card);
    }
    // 构建返回结果
    const stages = exports.STAGE_ORDER.map((stage) => ({
        stage,
        stageName: exports.STAGE_NAMES[stage],
        collaborations: stageMap.get(stage) || [],
        count: stageMap.get(stage)?.length || 0,
    }));
    return {
        stages,
        totalCount: collaborations.length,
    };
}
/**
 * 获取管道统计数据
 */
async function getPipelineStats(brandId) {
    const stats = await prisma_1.default.collaboration.groupBy({
        by: ['stage'],
        where: { brandId },
        _count: { id: true },
    });
    const result = {
        LEAD: 0,
        CONTACTED: 0,
        QUOTED: 0,
        SAMPLED: 0,
        SCHEDULED: 0,
        PUBLISHED: 0,
        REVIEWED: 0,
    };
    for (const stat of stats) {
        result[stat.stage] = stat._count.id;
    }
    const overdueCount = await prisma_1.default.collaboration.count({
        where: { brandId, isOverdue: true },
    });
    return {
        byStage: result,
        total: Object.values(result).reduce((a, b) => a + b, 0),
        overdueCount,
    };
}
// ==================== 跟进提醒算法 ====================
/**
 * 根据合作阶段建议跟进频率
 */
function getSuggestedFrequencyByStage(stage) {
    switch (stage) {
        case 'LEAD':
        case 'CONTACTED':
            return 'daily'; // 初期阶段需要频繁跟进
        case 'QUOTED':
        case 'SAMPLED':
            return 'weekly'; // 中期阶段每周跟进
        case 'SCHEDULED':
        case 'PUBLISHED':
            return 'biweekly'; // 后期阶段两周跟进
        case 'REVIEWED':
            return 'biweekly'; // 复盘阶段不需要频繁跟进
        default:
            return 'weekly';
    }
}
/**
 * 根据历史转化率调整跟进频率
 */
async function adjustFrequencyByConversionRate(businessStaffId, baseFrequency) {
    // 获取商务人员的历史转化率
    const totalCollaborations = await prisma_1.default.collaboration.count({
        where: { businessStaffId },
    });
    const successfulCollaborations = await prisma_1.default.collaboration.count({
        where: {
            businessStaffId,
            stage: { in: ['PUBLISHED', 'REVIEWED'] },
        },
    });
    if (totalCollaborations === 0) {
        return baseFrequency;
    }
    const conversionRate = successfulCollaborations / totalCollaborations;
    // 如果转化率低于30%，建议增加跟进频率
    if (conversionRate < 0.3) {
        if (baseFrequency === 'biweekly')
            return 'weekly';
        if (baseFrequency === 'weekly')
            return 'daily';
    }
    // 如果转化率高于70%，可以适当降低跟进频率
    if (conversionRate > 0.7) {
        if (baseFrequency === 'daily')
            return 'weekly';
        if (baseFrequency === 'weekly')
            return 'biweekly';
    }
    return baseFrequency;
}
/**
 * 根据达人响应速度调整跟进频率
 */
async function adjustFrequencyByResponseSpeed(collaborationId, baseFrequency) {
    // 获取最近的跟进记录
    const recentFollowUps = await prisma_1.default.followUpRecord.findMany({
        where: { collaborationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    if (recentFollowUps.length < 2) {
        return baseFrequency;
    }
    // 计算平均响应时间（简化版：假设每次跟进间隔就是响应时间）
    let totalGap = 0;
    for (let i = 0; i < recentFollowUps.length - 1; i++) {
        const gap = recentFollowUps[i].createdAt.getTime() - recentFollowUps[i + 1].createdAt.getTime();
        totalGap += gap;
    }
    const avgGapDays = totalGap / (recentFollowUps.length - 1) / (1000 * 60 * 60 * 24);
    // 如果平均间隔小于3天，说明达人响应快，可以保持或增加频率
    if (avgGapDays < 3) {
        if (baseFrequency === 'biweekly')
            return 'weekly';
        if (baseFrequency === 'weekly')
            return 'daily';
    }
    // 如果平均间隔大于10天，说明达人响应慢，可以降低频率
    if (avgGapDays > 10) {
        if (baseFrequency === 'daily')
            return 'weekly';
        if (baseFrequency === 'weekly')
            return 'biweekly';
    }
    return baseFrequency;
}
/**
 * 计算优先级
 */
function calculatePriority(daysSinceLastFollowUp, frequency, isOverdue) {
    // 如果合作已超期，优先级为高
    if (isOverdue) {
        return 'high';
    }
    // 根据频率和天数计算优先级
    const thresholds = {
        daily: { high: 2, medium: 1 },
        weekly: { high: 10, medium: 5 },
        biweekly: { high: 20, medium: 10 },
    };
    const threshold = thresholds[frequency];
    if (daysSinceLastFollowUp >= threshold.high) {
        return 'high';
    }
    if (daysSinceLastFollowUp >= threshold.medium) {
        return 'medium';
    }
    return 'low';
}
/**
 * 获取跟进提醒列表
 */
async function getFollowUpReminders(brandId, userId, userRole) {
    const where = {
        brandId,
        // 排除已完成的阶段
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    };
    // 权限过滤：基础商务只能看到自己的合作
    if (userId && userRole === 'BUSINESS') {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });
        const permissions = user?.permissions;
        if (!permissions?.dataVisibility?.viewOthersCollaborations) {
            where.businessStaffId = userId;
        }
    }
    // 获取所有需要跟进的合作
    const collaborations = await prisma_1.default.collaboration.findMany({
        where,
        include: {
            influencer: true,
            businessStaff: {
                select: { id: true, name: true },
            },
            followUps: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
    const reminders = [];
    for (const collab of collaborations) {
        const lastFollowUp = collab.followUps[0];
        const lastFollowUpDate = lastFollowUp?.createdAt || null;
        const daysSinceLastFollowUp = lastFollowUpDate
            ? Math.floor((Date.now() - lastFollowUpDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999; // 如果从未跟进，设置为很大的值
        // 获取基础频率（根据阶段）
        let frequency = getSuggestedFrequencyByStage(collab.stage);
        // 根据转化率调整频率
        frequency = await adjustFrequencyByConversionRate(collab.businessStaffId, frequency);
        // 根据响应速度调整频率
        frequency = await adjustFrequencyByResponseSpeed(collab.id, frequency);
        // 计算建议的下次跟进时间
        const frequencyDays = {
            daily: 1,
            weekly: 7,
            biweekly: 14,
        };
        const suggestedNextDate = new Date();
        if (lastFollowUpDate) {
            suggestedNextDate.setTime(lastFollowUpDate.getTime() + frequencyDays[frequency] * 24 * 60 * 60 * 1000);
        }
        // 计算优先级
        const priority = calculatePriority(daysSinceLastFollowUp, frequency, collab.isOverdue);
        // 只返回需要跟进的合作（已经超过建议时间或即将到期）
        const shouldRemind = daysSinceLastFollowUp >= frequencyDays[frequency] ||
            daysSinceLastFollowUp >= frequencyDays[frequency] - 1; // 提前1天提醒
        if (shouldRemind) {
            reminders.push({
                collaborationId: collab.id,
                influencerName: collab.influencer.nickname,
                influencerPlatform: collab.influencer.platform,
                lastFollowUpDate,
                suggestedNextDate,
                daysSinceLastFollowUp,
                frequency,
                priority,
                stage: exports.STAGE_NAMES[collab.stage],
            });
        }
    }
    // 按优先级和天数排序
    reminders.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0)
            return priorityDiff;
        return b.daysSinceLastFollowUp - a.daysSinceLastFollowUp;
    });
    return reminders;
}
/**
 * 获取跟进分析数据
 */
async function getFollowUpAnalytics(brandId, staffId, period = 'month') {
    // 计算时间范围
    const now = new Date();
    const startDate = new Date();
    switch (period) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setDate(now.getDate() - 30);
            break;
        case 'quarter':
            startDate.setDate(now.getDate() - 90);
            break;
    }
    // 构建查询条件
    const where = {
        brandId,
        createdAt: { gte: startDate },
    };
    if (staffId) {
        where.businessStaffId = staffId;
    }
    // 获取所有合作记录
    const collaborations = await prisma_1.default.collaboration.findMany({
        where,
        include: {
            followUps: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    // 获取所有跟进记录
    const allFollowUps = await prisma_1.default.followUpRecord.findMany({
        where: {
            collaboration: where,
            createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
    });
    // 计算总跟进次数
    const totalFollowUps = allFollowUps.length;
    // 计算成功转化数（已发布或已复盘的合作）
    const successfulConversions = collaborations.filter((c) => c.stage === 'PUBLISHED' || c.stage === 'REVIEWED').length;
    // 计算转化率
    const conversionRate = totalFollowUps > 0
        ? (successfulConversions / collaborations.length) * 100
        : 0;
    // 按时间段分析
    const conversionByTime = analyzeByTimeRange(collaborations, allFollowUps);
    // 按频率分析
    const conversionByFrequency = analyzeByFrequency(collaborations);
    // 按日期分析趋势
    const conversionByDay = analyzeByDay(collaborations, allFollowUps, startDate, now);
    // 找出最佳跟进时间
    const bestTime = findBestTime(conversionByTime);
    // 找出最佳跟进频率
    const bestFrequency = findBestFrequency(conversionByFrequency);
    // 计算平均响应时间（简化版）
    const avgResponseTime = calculateAvgResponseTime(collaborations);
    // 计算效果评分
    const effectivenessScore = calculateEffectivenessScore(conversionRate, avgResponseTime, totalFollowUps, collaborations.length);
    // 生成优化建议
    const suggestions = generateSuggestions(conversionRate, bestTime, bestFrequency, avgResponseTime, conversionByTime, conversionByFrequency);
    return {
        effectivenessScore,
        bestTime,
        bestFrequency,
        totalFollowUps,
        successfulConversions,
        conversionRate,
        avgResponseTime,
        conversionByTime,
        conversionByFrequency,
        conversionByDay,
        suggestions,
    };
}
/**
 * 按时间段分析转化率
 */
function analyzeByTimeRange(collaborations, followUps) {
    const timeRanges = [
        { range: '早上 (6-12点)', start: 6, end: 12 },
        { range: '下午 (12-18点)', start: 12, end: 18 },
        { range: '晚上 (18-24点)', start: 18, end: 24 },
        { range: '深夜 (0-6点)', start: 0, end: 6 },
    ];
    return timeRanges.map(({ range, start, end }) => {
        // 统计该时间段的跟进次数
        const timeFollowUps = followUps.filter((f) => {
            const hour = f.createdAt.getHours();
            return hour >= start && hour < end;
        });
        // 找出在该时间段有跟进的合作
        const collabIds = new Set(timeFollowUps.map((f) => f.collaborationId));
        const timeCollabs = collaborations.filter((c) => collabIds.has(c.id));
        // 统计转化数
        const conversions = timeCollabs.filter((c) => c.stage === 'PUBLISHED' || c.stage === 'REVIEWED').length;
        const conversionRate = timeCollabs.length > 0
            ? (conversions / timeCollabs.length) * 100
            : 0;
        return {
            timeRange: range,
            followUps: timeFollowUps.length,
            conversions,
            conversionRate,
        };
    });
}
/**
 * 按跟进频率分析转化率
 */
function analyzeByFrequency(collaborations) {
    const frequencies = [
        { name: '每天跟进', min: 0, max: 2 },
        { name: '2-3天跟进一次', min: 2, max: 4 },
        { name: '每周跟进', min: 4, max: 10 },
        { name: '两周跟进一次', min: 10, max: 20 },
        { name: '很少跟进', min: 20, max: Infinity },
    ];
    return frequencies.map(({ name, min, max }) => {
        // 计算每个合作的平均跟进间隔
        const freqCollabs = collaborations.filter((c) => {
            if (c.followUps.length < 2)
                return false;
            let totalGap = 0;
            for (let i = 0; i < c.followUps.length - 1; i++) {
                const gap = c.followUps[i + 1].createdAt.getTime() - c.followUps[i].createdAt.getTime();
                totalGap += gap;
            }
            const avgGapDays = totalGap / (c.followUps.length - 1) / (1000 * 60 * 60 * 24);
            return avgGapDays >= min && avgGapDays < max;
        });
        const conversions = freqCollabs.filter((c) => c.stage === 'PUBLISHED' || c.stage === 'REVIEWED').length;
        const conversionRate = freqCollabs.length > 0
            ? (conversions / freqCollabs.length) * 100
            : 0;
        return {
            frequency: name,
            followUps: freqCollabs.reduce((sum, c) => sum + c.followUps.length, 0),
            conversions,
            conversionRate,
        };
    });
}
/**
 * 按日期分析趋势
 */
function analyzeByDay(collaborations, followUps, startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        // 统计当天的跟进次数
        const dayFollowUps = followUps.filter((f) => f.createdAt >= dayStart && f.createdAt <= dayEnd);
        // 统计当天转化的合作数
        const dayConversions = collaborations.filter((c) => {
            const lastFollowUp = c.followUps[c.followUps.length - 1];
            if (!lastFollowUp)
                return false;
            return (lastFollowUp.createdAt >= dayStart &&
                lastFollowUp.createdAt <= dayEnd &&
                (c.stage === 'PUBLISHED' || c.stage === 'REVIEWED'));
        });
        days.push({
            day: `${current.getMonth() + 1}/${current.getDate()}`,
            followUps: dayFollowUps.length,
            conversions: dayConversions.length,
        });
        current.setDate(current.getDate() + 1);
    }
    return days;
}
/**
 * 找出最佳跟进时间
 */
function findBestTime(conversionByTime) {
    let bestTime = conversionByTime[0];
    for (const time of conversionByTime) {
        if (time.conversionRate > bestTime.conversionRate) {
            bestTime = time;
        }
    }
    return bestTime.timeRange;
}
/**
 * 找出最佳跟进频率
 */
function findBestFrequency(conversionByFrequency) {
    let bestFreq = conversionByFrequency[0];
    for (const freq of conversionByFrequency) {
        if (freq.conversionRate > bestFreq.conversionRate) {
            bestFreq = freq;
        }
    }
    return bestFreq.frequency;
}
/**
 * 计算平均响应时间（天）
 */
function calculateAvgResponseTime(collaborations) {
    let totalResponseTime = 0;
    let count = 0;
    for (const collab of collaborations) {
        if (collab.followUps.length < 2)
            continue;
        for (let i = 0; i < collab.followUps.length - 1; i++) {
            const gap = collab.followUps[i + 1].createdAt.getTime() - collab.followUps[i].createdAt.getTime();
            totalResponseTime += gap;
            count++;
        }
    }
    if (count === 0)
        return 0;
    return totalResponseTime / count / (1000 * 60 * 60 * 24); // 转换为天
}
/**
 * 计算效果评分（0-100）
 */
function calculateEffectivenessScore(conversionRate, avgResponseTime, totalFollowUps, totalCollabs) {
    // 转化率权重 50%
    const conversionScore = Math.min(conversionRate * 1.5, 50);
    // 响应速度权重 30%（响应越快越好）
    let responseScore = 0;
    if (avgResponseTime <= 1)
        responseScore = 30;
    else if (avgResponseTime <= 3)
        responseScore = 25;
    else if (avgResponseTime <= 7)
        responseScore = 20;
    else if (avgResponseTime <= 14)
        responseScore = 15;
    else
        responseScore = 10;
    // 跟进活跃度权重 20%
    const avgFollowUpsPerCollab = totalCollabs > 0 ? totalFollowUps / totalCollabs : 0;
    let activityScore = 0;
    if (avgFollowUpsPerCollab >= 5)
        activityScore = 20;
    else if (avgFollowUpsPerCollab >= 3)
        activityScore = 15;
    else if (avgFollowUpsPerCollab >= 2)
        activityScore = 10;
    else
        activityScore = 5;
    return Math.round(conversionScore + responseScore + activityScore);
}
/**
 * 生成优化建议
 */
function generateSuggestions(conversionRate, bestTime, bestFrequency, avgResponseTime, conversionByTime, _conversionByFrequency // 预留为未来扩展
) {
    const suggestions = [];
    // 转化率建议
    if (conversionRate < 20) {
        suggestions.push('转化率较低，建议增加跟进频率，提高沟通质量');
    }
    else if (conversionRate < 30) {
        suggestions.push('转化率中等，可以尝试优化跟进话术和时机');
    }
    else {
        suggestions.push('转化率良好，继续保持当前的跟进策略');
    }
    // 时间建议
    suggestions.push(`建议在${bestTime}进行跟进，此时段转化率最高`);
    // 频率建议
    suggestions.push(`建议保持"${bestFrequency}"的跟进节奏，效果最佳`);
    // 响应时间建议
    if (avgResponseTime > 7) {
        suggestions.push('平均响应时间较长，建议缩短跟进间隔，保持热度');
    }
    else if (avgResponseTime < 2) {
        suggestions.push('跟进频率很高，注意避免过度打扰，保持适度');
    }
    // 根据数据给出具体建议
    const worstTime = conversionByTime.reduce((worst, time) => time.conversionRate < worst.conversionRate ? time : worst);
    if (worstTime.conversionRate < 15 && worstTime.followUps > 10) {
        suggestions.push(`避免在${worstTime.timeRange}跟进，此时段效果较差`);
    }
    return suggestions;
}
/**
 * 获取智能建议
 * 基于历史数据推荐样品、报价、排期等
 */
async function getCollaborationSuggestions(brandId, influencerId, type) {
    // 获取达人信息
    const influencer = await prisma_1.default.influencer.findFirst({
        where: { id: influencerId, brandId },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在');
    }
    // 获取该达人的历史合作记录
    const historicalCollabs = await prisma_1.default.collaboration.findMany({
        where: {
            influencerId,
            brandId,
            stage: { in: ['PUBLISHED', 'REVIEWED'] }, // 只看成功的合作
        },
        include: {
            dispatches: {
                include: {
                    sample: true,
                },
            },
            result: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    const suggestions = {
        type,
        suggestions: [],
    };
    switch (type) {
        case 'sample':
            suggestions.suggestions = await getSampleSuggestions(brandId, influencer, historicalCollabs);
            break;
        case 'price':
            suggestions.suggestions = await getPriceSuggestions(brandId, influencer, historicalCollabs);
            break;
        case 'schedule':
            suggestions.suggestions = await getScheduleSuggestions(brandId, influencer, historicalCollabs);
            break;
    }
    return suggestions;
}
/**
 * 推荐样品
 */
async function getSampleSuggestions(brandId, influencer, historicalCollabs) {
    const suggestions = [];
    // 1. 推荐该达人历史上效果最好的样品
    if (historicalCollabs.length > 0) {
        const samplePerformance = new Map();
        for (const collab of historicalCollabs) {
            if (collab.result && collab.dispatches.length > 0) {
                for (const dispatch of collab.dispatches) {
                    const sampleId = dispatch.sample.id;
                    const existing = samplePerformance.get(sampleId);
                    if (existing) {
                        existing.totalGMV += collab.result.salesGmv || 0;
                        existing.count += 1;
                    }
                    else {
                        samplePerformance.set(sampleId, {
                            sample: dispatch.sample,
                            totalGMV: collab.result.salesGmv || 0,
                            count: 1,
                        });
                    }
                }
            }
        }
        // 找出平均GMV最高的样品
        const sortedSamples = Array.from(samplePerformance.values())
            .sort((a, b) => (b.totalGMV / b.count) - (a.totalGMV / a.count));
        if (sortedSamples.length > 0) {
            const bestSample = sortedSamples[0];
            suggestions.push({
                field: 'sampleId',
                value: bestSample.sample.id,
                label: `${bestSample.sample.name}（历史最佳）`,
                reason: `该达人使用此样品平均GMV为 ¥${Math.round(bestSample.totalGMV / bestSample.count)}，效果最好`,
                confidence: 'high',
            });
        }
    }
    // 2. 推荐同平台其他达人效果好的样品
    const platformInfluencers = await prisma_1.default.influencer.findMany({
        where: {
            brandId,
            platform: influencer.platform,
            id: { not: influencer.id },
        },
        take: 50,
    });
    const platformCollabs = await prisma_1.default.collaboration.findMany({
        where: {
            brandId,
            influencerId: { in: platformInfluencers.map(i => i.id) },
            stage: { in: ['PUBLISHED', 'REVIEWED'] },
        },
        include: {
            dispatches: {
                include: {
                    sample: true,
                },
            },
            result: true,
        },
        take: 100,
    });
    const platformSamplePerformance = new Map();
    for (const collab of platformCollabs) {
        if (collab.result && collab.dispatches.length > 0) {
            for (const dispatch of collab.dispatches) {
                const sampleId = dispatch.sample.id;
                const existing = platformSamplePerformance.get(sampleId);
                if (existing) {
                    existing.totalGMV += collab.result.salesGmv || 0;
                    existing.count += 1;
                }
                else {
                    platformSamplePerformance.set(sampleId, {
                        sample: dispatch.sample,
                        totalGMV: collab.result.salesGmv || 0,
                        count: 1,
                    });
                }
            }
        }
    }
    const sortedPlatformSamples = Array.from(platformSamplePerformance.values())
        .filter(s => s.count >= 3) // 至少有3次使用记录
        .sort((a, b) => (b.totalGMV / b.count) - (a.totalGMV / a.count));
    if (sortedPlatformSamples.length > 0) {
        const topSample = sortedPlatformSamples[0];
        suggestions.push({
            field: 'sampleId',
            value: topSample.sample.id,
            label: `${topSample.sample.name}（平台热门）`,
            reason: `在${influencer.platform}平台上，此样品平均GMV为 ¥${Math.round(topSample.totalGMV / topSample.count)}`,
            confidence: 'medium',
        });
    }
    // 3. 推荐最新的样品
    const latestSamples = await prisma_1.default.sample.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
        take: 3,
    });
    if (latestSamples.length > 0) {
        suggestions.push({
            field: 'sampleId',
            value: latestSamples[0].id,
            label: `${latestSamples[0].name}（最新样品）`,
            reason: '这是最新上架的样品，可以尝试推广',
            confidence: 'low',
        });
    }
    return suggestions;
}
/**
 * 推荐报价
 */
async function getPriceSuggestions(brandId, influencer, historicalCollabs) {
    const suggestions = [];
    // 1. 基于该达人的历史报价
    if (historicalCollabs.length > 0) {
        const prices = historicalCollabs
            .map(c => c.result?.totalCollaborationCost || 0)
            .filter(p => p > 0);
        if (prices.length > 0) {
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            suggestions.push({
                field: 'quotedPrice',
                value: Math.round(avgPrice),
                label: `¥${Math.round(avgPrice)}（历史平均）`,
                reason: `该达人历史平均报价为 ¥${Math.round(avgPrice)}`,
                confidence: 'high',
            });
        }
    }
    // 2. 基于同平台达人的平均报价
    const platformInfluencers = await prisma_1.default.influencer.findMany({
        where: {
            brandId,
            platform: influencer.platform,
        },
        take: 100,
    });
    const platformResults = await prisma_1.default.collaborationResult.findMany({
        where: {
            collaboration: {
                brandId,
                influencerId: { in: platformInfluencers.map(i => i.id) },
            },
            totalCollaborationCost: { gt: 0 },
        },
        select: { totalCollaborationCost: true },
        take: 200,
    });
    if (platformResults.length > 0) {
        const avgPlatformPrice = platformResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0) / platformResults.length;
        suggestions.push({
            field: 'quotedPrice',
            value: Math.round(avgPlatformPrice),
            label: `¥${Math.round(avgPlatformPrice)}（平台平均）`,
            reason: `${influencer.platform}平台达人平均报价为 ¥${Math.round(avgPlatformPrice)}`,
            confidence: 'medium',
        });
    }
    // 3. 基于粉丝数推荐报价（简化算法）
    if (influencer.followers) {
        let estimatedPrice = 0;
        if (influencer.followers < 10000) {
            estimatedPrice = 500;
        }
        else if (influencer.followers < 50000) {
            estimatedPrice = 1000;
        }
        else if (influencer.followers < 100000) {
            estimatedPrice = 2000;
        }
        else if (influencer.followers < 500000) {
            estimatedPrice = 5000;
        }
        else {
            estimatedPrice = 10000;
        }
        suggestions.push({
            field: 'quotedPrice',
            value: estimatedPrice,
            label: `¥${estimatedPrice}（粉丝数估算）`,
            reason: `根据${influencer.followers}粉丝数估算的报价`,
            confidence: 'low',
        });
    }
    return suggestions;
}
/**
 * 推荐排期
 */
async function getScheduleSuggestions(_brandId, // 预留为未来扩展
_influencer, // 预留为未来扩展
historicalCollabs) {
    const suggestions = [];
    // 1. 推荐发布时间（基于历史数据）
    if (historicalCollabs.length > 0) {
        const publishDates = historicalCollabs
            .map(c => c.result?.publishedAt)
            .filter(d => d != null);
        if (publishDates.length > 0) {
            // 分析最常见的发布时间（小时）
            const hourCounts = new Map();
            for (const date of publishDates) {
                const hour = new Date(date).getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            }
            const mostCommonHour = Array.from(hourCounts.entries())
                .sort((a, b) => b[1] - a[1])[0][0];
            const suggestedDate = new Date();
            suggestedDate.setDate(suggestedDate.getDate() + 7); // 一周后
            suggestedDate.setHours(mostCommonHour, 0, 0, 0);
            suggestions.push({
                field: 'scheduledDate',
                value: suggestedDate.toISOString(),
                label: `${suggestedDate.toLocaleDateString()} ${mostCommonHour}:00（历史最佳时间）`,
                reason: `该达人通常在${mostCommonHour}:00发布效果最好`,
                confidence: 'high',
            });
        }
    }
    // 2. 推荐常见的发布时间段
    const commonTimes = [
        { hour: 12, label: '中午12:00', reason: '午休时间，用户活跃度高' },
        { hour: 18, label: '晚上18:00', reason: '下班时间，用户活跃度高' },
        { hour: 20, label: '晚上20:00', reason: '黄金时段，用户活跃度最高' },
    ];
    for (const time of commonTimes) {
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + 7);
        suggestedDate.setHours(time.hour, 0, 0, 0);
        suggestions.push({
            field: 'scheduledDate',
            value: suggestedDate.toISOString(),
            label: `${suggestedDate.toLocaleDateString()} ${time.label}`,
            reason: time.reason,
            confidence: 'medium',
        });
    }
    return suggestions;
}
/**
 * 批量更新合作记录
 */
async function batchUpdateCollaborations(brandId, input) {
    const { ids, operation, data } = input;
    const result = {
        updated: 0,
        failed: 0,
        errors: [],
    };
    // 验证所有合作记录都属于该工厂
    const collaborations = await prisma_1.default.collaboration.findMany({
        where: {
            id: { in: ids },
            brandId,
        },
    });
    if (collaborations.length !== ids.length) {
        throw (0, errorHandler_1.createBadRequestError)('部分合作记录不存在或不属于该工厂');
    }
    // 根据操作类型执行批量更新
    for (const id of ids) {
        try {
            switch (operation) {
                case 'dispatch':
                    await batchDispatchSample(id, brandId, data);
                    break;
                case 'updateStage':
                    await updateStage(id, brandId, data.stage, '批量更新');
                    break;
                case 'setDeadline':
                    await setDeadline(id, brandId, data.deadline ? new Date(data.deadline) : null);
                    break;
                default:
                    throw (0, errorHandler_1.createBadRequestError)('不支持的操作类型');
            }
            result.updated++;
        }
        catch (error) {
            result.failed++;
            result.errors.push({
                id,
                message: error.message || '操作失败',
            });
        }
    }
    return result;
}
/**
 * 批量寄样（辅助函数）
 */
async function batchDispatchSample(collaborationId, brandId, data) {
    // 验证样品存在
    const sample = await prisma_1.default.sample.findFirst({
        where: { id: data.sampleId, brandId },
    });
    if (!sample) {
        throw (0, errorHandler_1.createNotFoundError)('样品不存在');
    }
    // 验证合作记录存在
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id: collaborationId, brandId },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 创建寄样记录
    await prisma_1.default.sampleDispatch.create({
        data: {
            collaborationId,
            sampleId: data.sampleId,
            businessStaffId: collaboration.businessStaffId,
            quantity: 1, // 批量寄样默认1件
            unitCostSnapshot: sample.unitCost,
            totalSampleCost: sample.unitCost,
            shippingCost: 0, // 批量寄样默认不计快递费
            totalCost: sample.unitCost,
            dispatchedAt: new Date(),
            receivedStatus: 'PENDING',
        },
    });
    // 如果合作还在早期阶段，自动推进到已寄样
    if (['LEAD', 'CONTACTED', 'QUOTED'].includes(collaboration.stage)) {
        await updateStage(collaborationId, brandId, 'SAMPLED', '批量寄样');
    }
}
/**
 * 验证合作数据
 * 包括数据完整性验证、重复数据检测、异常数据检测
 */
async function validateData(brandId, type, data) {
    const errors = [];
    const warnings = [];
    const infos = [];
    const duplicates = [];
    const anomalies = [];
    if (type === 'collaboration') {
        // 验证合作记录
        await validateCollaborationData(brandId, data, errors, warnings, infos, duplicates, anomalies);
    }
    else if (type === 'dispatch') {
        // 验证寄样记录
        await validateDispatchData(brandId, data, errors, warnings, infos, duplicates, anomalies);
    }
    else if (type === 'result') {
        // 验证结果记录
        await validateResultData(brandId, data, errors, warnings, infos, duplicates, anomalies);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        infos,
        duplicates,
        anomalies,
    };
}
/**
 * 验证合作记录数据
 */
async function validateCollaborationData(brandId, data, errors, warnings, _infos, // 预留为未来扩展
duplicates, anomalies // 用于检查异常报价等
) {
    // 1. 验证必填字段
    if (!data.influencerId) {
        errors.push({
            field: 'influencerId',
            message: '请选择达人',
            type: 'error',
        });
    }
    else {
        // 验证达人是否存在
        const influencer = await prisma_1.default.influencer.findFirst({
            where: { id: data.influencerId, brandId },
        });
        if (!influencer) {
            errors.push({
                field: 'influencerId',
                message: '达人不存在或不属于该工厂',
                type: 'error',
            });
        }
        else {
            // 检查重复合作
            const existingCollaboration = await prisma_1.default.collaboration.findFirst({
                where: {
                    brandId,
                    influencerId: data.influencerId,
                    stage: {
                        notIn: ['REVIEWED'], // 排除已完成的合作
                    },
                },
                include: {
                    influencer: {
                        select: { nickname: true, platform: true },
                    },
                },
            });
            if (existingCollaboration) {
                duplicates.push({
                    field: 'influencerId',
                    value: data.influencerId,
                    existingRecordId: existingCollaboration.id,
                    existingRecordInfo: `${existingCollaboration.influencer.nickname} (${existingCollaboration.influencer.platform}) - ${exports.STAGE_NAMES[existingCollaboration.stage]}`,
                    message: `该达人已有进行中的合作记录`,
                });
            }
        }
    }
    if (!data.stage) {
        errors.push({
            field: 'stage',
            message: '请选择合作阶段',
            type: 'error',
        });
    }
    else if (!exports.STAGE_ORDER.includes(data.stage)) {
        errors.push({
            field: 'stage',
            message: '无效的合作阶段',
            type: 'error',
        });
    }
    // 2. 验证截止日期
    if (data.deadline) {
        const deadline = new Date(data.deadline);
        const now = new Date();
        if (isNaN(deadline.getTime())) {
            errors.push({
                field: 'deadline',
                message: '无效的截止日期格式',
                type: 'error',
            });
        }
        else if (deadline < now) {
            warnings.push({
                field: 'deadline',
                message: '截止日期已过期',
                type: 'warning',
            });
        }
        else {
            // 检查截止日期是否过于紧迫（少于3天）
            const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline < 3) {
                warnings.push({
                    field: 'deadline',
                    message: `截止日期较紧迫（还有${daysUntilDeadline}天）`,
                    type: 'warning',
                });
            }
        }
    }
    // 3. 验证报价
    if (data.quotedPrice !== undefined && data.quotedPrice !== null) {
        if (typeof data.quotedPrice !== 'number') {
            errors.push({
                field: 'quotedPrice',
                message: '报价必须是数字',
                type: 'error',
            });
        }
        else if (data.quotedPrice < 0) {
            errors.push({
                field: 'quotedPrice',
                message: '报价不能为负数',
                type: 'error',
            });
        }
        else if (data.quotedPrice === 0) {
            warnings.push({
                field: 'quotedPrice',
                message: '报价为0，请确认是否正确',
                type: 'warning',
            });
        }
        else {
            // 检查异常报价
            if (data.quotedPrice > 100000) {
                anomalies.push({
                    field: 'quotedPrice',
                    value: data.quotedPrice,
                    message: '报价异常高（>10万），请确认是否正确',
                    severity: 'high',
                });
            }
            else if (data.quotedPrice > 50000) {
                anomalies.push({
                    field: 'quotedPrice',
                    value: data.quotedPrice,
                    message: '报价较高（>5万），请确认是否正确',
                    severity: 'medium',
                });
            }
            // 如果有达人信息，检查报价是否在合理范围内
            if (data.influencerId) {
                const historicalCollaborations = await prisma_1.default.collaboration.findMany({
                    where: {
                        brandId,
                        influencerId: data.influencerId,
                        quotedPrice: { not: null },
                    },
                    select: { quotedPrice: true },
                });
                if (historicalCollaborations.length > 0) {
                    const avgPrice = historicalCollaborations.reduce((sum, c) => sum + (c.quotedPrice || 0), 0) / historicalCollaborations.length;
                    const deviation = Math.abs(data.quotedPrice - avgPrice) / avgPrice;
                    if (deviation > 0.5) {
                        warnings.push({
                            field: 'quotedPrice',
                            message: `报价与该达人历史平均报价（¥${avgPrice.toFixed(2)}）差异较大`,
                            type: 'warning',
                        });
                    }
                }
            }
        }
    }
    // 4. 验证排期日期
    if (data.scheduledDate) {
        const scheduledDate = new Date(data.scheduledDate);
        const now = new Date();
        if (isNaN(scheduledDate.getTime())) {
            errors.push({
                field: 'scheduledDate',
                message: '无效的排期日期格式',
                type: 'error',
            });
        }
        else if (scheduledDate < now) {
            warnings.push({
                field: 'scheduledDate',
                message: '排期日期已过期',
                type: 'warning',
            });
        }
    }
}
/**
 * 验证寄样记录数据
 */
async function validateDispatchData(brandId, data, errors, warnings, _infos, // 预留为未来扩展
duplicates, _anomalies // 预留为未来扩展
) {
    // 1. 验证必填字段
    if (!data.sampleId) {
        errors.push({
            field: 'sampleId',
            message: '请选择样品',
            type: 'error',
        });
    }
    else {
        // 验证样品是否存在
        const sample = await prisma_1.default.sample.findFirst({
            where: { id: data.sampleId, brandId },
        });
        if (!sample) {
            errors.push({
                field: 'sampleId',
                message: '样品不存在或不属于该工厂',
                type: 'error',
            });
        }
    }
    if (!data.influencerId && !data.collaborationId) {
        errors.push({
            field: 'influencerId',
            message: '请选择达人或合作记录',
            type: 'error',
        });
    }
    if (!data.quantity || data.quantity <= 0) {
        errors.push({
            field: 'quantity',
            message: '数量必须大于0',
            type: 'error',
        });
    }
    else if (data.quantity > 100) {
        warnings.push({
            field: 'quantity',
            message: '寄样数量较多（>100），请确认是否正确',
            type: 'warning',
        });
    }
    // 2. 检查重复寄样
    if (data.collaborationId && data.sampleId) {
        const existingDispatch = await prisma_1.default.sampleDispatch.findFirst({
            where: {
                collaborationId: data.collaborationId,
                sampleId: data.sampleId,
                receivedStatus: { in: ['PENDING', 'RECEIVED'] }, // 使用正确的字段名
            },
            include: {
                sample: { select: { name: true } },
            },
        });
        if (existingDispatch) {
            duplicates.push({
                field: 'sampleId',
                value: data.sampleId,
                existingRecordId: existingDispatch.id,
                existingRecordInfo: `${existingDispatch.sample.name} - ${existingDispatch.receivedStatus === 'PENDING' ? '已寄出' : '已签收'}`,
                message: '该样品已寄给该达人',
            });
        }
    }
    // 3. 验证地址信息
    if (!data.address || !data.address.trim()) {
        warnings.push({
            field: 'address',
            message: '建议填写收货地址',
            type: 'warning',
        });
    }
    if (!data.phone || !data.phone.trim()) {
        warnings.push({
            field: 'phone',
            message: '建议填写联系电话',
            type: 'warning',
        });
    }
}
/**
 * 验证结果记录数据
 */
async function validateResultData(brandId, data, errors, warnings, _infos, // 预留为未来扩展
duplicates, anomalies // 用于检查异常数据
) {
    // 1. 验证必填字段
    if (!data.collaborationId) {
        errors.push({
            field: 'collaborationId',
            message: '请选择合作记录',
            type: 'error',
        });
    }
    else {
        // 验证合作记录是否存在
        const collaboration = await prisma_1.default.collaboration.findFirst({
            where: { id: data.collaborationId, brandId },
            include: { result: true },
        });
        if (!collaboration) {
            errors.push({
                field: 'collaborationId',
                message: '合作记录不存在或不属于该工厂',
                type: 'error',
            });
        }
        else if (collaboration.result) {
            duplicates.push({
                field: 'collaborationId',
                value: data.collaborationId,
                existingRecordId: collaboration.result.id,
                existingRecordInfo: `GMV: ¥${(collaboration.result.salesGmv / 100).toFixed(2)}, 销量: ${collaboration.result.salesQuantity}`,
                message: '该合作已有结果记录',
            });
        }
    }
    // 2. 验证数值字段
    if (data.views === undefined || data.views === null) {
        errors.push({
            field: 'views',
            message: '请填写播放量',
            type: 'error',
        });
    }
    else if (typeof data.views !== 'number' || data.views < 0) {
        errors.push({
            field: 'views',
            message: '播放量必须是非负数',
            type: 'error',
        });
    }
    if (data.likes !== undefined && data.likes !== null) {
        if (typeof data.likes !== 'number' || data.likes < 0) {
            errors.push({
                field: 'likes',
                message: '点赞数必须是非负数',
                type: 'error',
            });
        }
    }
    if (data.comments !== undefined && data.comments !== null) {
        if (typeof data.comments !== 'number' || data.comments < 0) {
            errors.push({
                field: 'comments',
                message: '评论数必须是非负数',
                type: 'error',
            });
        }
    }
    if (data.shares !== undefined && data.shares !== null) {
        if (typeof data.shares !== 'number' || data.shares < 0) {
            errors.push({
                field: 'shares',
                message: '分享数必须是非负数',
                type: 'error',
            });
        }
    }
    // 3. 检查异常数据
    if (data.views && data.likes) {
        const likeRate = data.likes / data.views;
        if (likeRate > 0.5) {
            anomalies.push({
                field: 'likes',
                value: data.likes,
                expectedRange: { min: 0, max: data.views * 0.5 },
                message: `点赞率异常高（${(likeRate * 100).toFixed(1)}%），通常点赞率在5%-20%之间`,
                severity: 'high',
            });
        }
        else if (likeRate > 0.3) {
            anomalies.push({
                field: 'likes',
                value: data.likes,
                expectedRange: { min: 0, max: data.views * 0.3 },
                message: `点赞率较高（${(likeRate * 100).toFixed(1)}%），请确认数据是否正确`,
                severity: 'medium',
            });
        }
        else if (likeRate < 0.01 && data.views > 1000) {
            anomalies.push({
                field: 'likes',
                value: data.likes,
                message: `点赞率较低（${(likeRate * 100).toFixed(1)}%），可能效果不佳`,
                severity: 'low',
            });
        }
    }
    if (data.views && data.comments) {
        const commentRate = data.comments / data.views;
        if (commentRate > 0.1) {
            anomalies.push({
                field: 'comments',
                value: data.comments,
                message: `评论率异常高（${(commentRate * 100).toFixed(1)}%），通常评论率在0.5%-3%之间`,
                severity: 'medium',
            });
        }
    }
    // 4. 验证GMV
    if (data.gmv !== undefined && data.gmv !== null) {
        if (typeof data.gmv !== 'number' || data.gmv < 0) {
            errors.push({
                field: 'gmv',
                message: 'GMV必须是非负数',
                type: 'error',
            });
        }
        else if (data.gmv === 0 && data.views > 1000) {
            warnings.push({
                field: 'gmv',
                message: '播放量较高但GMV为0，请确认是否正确',
                type: 'warning',
            });
        }
    }
    // 5. 验证发布日期
    if (data.publishedAt) {
        const publishedAt = new Date(data.publishedAt);
        const now = new Date();
        if (isNaN(publishedAt.getTime())) {
            errors.push({
                field: 'publishedAt',
                message: '无效的发布日期格式',
                type: 'error',
            });
        }
        else if (publishedAt > now) {
            warnings.push({
                field: 'publishedAt',
                message: '发布日期在未来，请确认是否正确',
                type: 'warning',
            });
        }
    }
}
//# sourceMappingURL=collaboration.service.js.map