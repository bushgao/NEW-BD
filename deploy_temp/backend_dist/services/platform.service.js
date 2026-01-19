"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFactories = listFactories;
exports.getFactoryById = getFactoryById;
exports.reviewFactory = reviewFactory;
exports.updateFactory = updateFactory;
exports.toggleBrandStatus = toggleBrandStatus;
exports.deleteBrand = deleteBrand;
exports.listPlanConfigs = listPlanConfigs;
exports.getPlanConfig = getPlanConfig;
exports.createPlanConfig = createPlanConfig;
exports.updatePlanConfig = updatePlanConfig;
exports.deletePlanConfig = deletePlanConfig;
exports.checkFactoryQuota = checkFactoryQuota;
exports.validateQuota = validateQuota;
exports.getPlatformStats = getPlatformStats;
exports.getPlatformDetailedStats = getPlatformDetailedStats;
exports.getBrandStaff = getBrandStaff;
exports.getStaffWorkStats = getStaffWorkStats;
exports.getStaffInfluencers = getStaffInfluencers;
exports.getStaffCollaborations = getStaffCollaborations;
exports.listAllInfluencers = listAllInfluencers;
exports.getInfluencerDetail = getInfluencerDetail;
exports.verifyInfluencer = verifyInfluencer;
exports.createInfluencerForBrand = createInfluencerForBrand;
exports.getInfluencerStats = getInfluencerStats;
exports.listAllUsers = listAllUsers;
exports.getUserDetail = getUserDetail;
exports.toggleUserStatus = toggleUserStatus;
exports.deleteUser = deleteUser;
exports.deleteInfluencer = deleteInfluencer;
exports.getIndependentBusinessUsers = getIndependentBusinessUsers;
exports.getBrandMembers = getBrandMembers;
exports.assignUserToBrand = assignUserToBrand;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ============ Factory Management ============
/**
 * 获取工厂列表（支持筛选和分页）
 */
async function listFactories(filter, pagination) {
    const { status, planType, keyword } = filter;
    const { page, pageSize } = pagination;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (planType) {
        where.planType = planType;
    }
    if (keyword) {
        where.OR = [
            { name: { contains: keyword, mode: 'insensitive' } },
            { owner: { name: { contains: keyword, mode: 'insensitive' } } },
            { owner: { email: { contains: keyword, mode: 'insensitive' } } },
        ];
    }
    const [factories, total] = await Promise.all([
        prisma_1.default.brand.findMany({
            where,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        staff: true,
                        influencers: true,
                        collaborations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.brand.count({ where }),
    ]);
    return {
        data: factories,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取工厂详情
 */
async function getFactoryById(brandId) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                    collaborations: true,
                },
            },
        },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    return factory;
}
/**
 * 审核工厂入驻申请
 */
async function reviewFactory(brandId, status, _reason) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    if (factory.status !== 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)('只能审核待审核状态的工厂');
    }
    const updatedFactory = await prisma_1.default.brand.update({
        where: { id: brandId },
        data: {
            status,
            // 可以在这里添加审核原因字段
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                    collaborations: true,
                },
            },
        },
    });
    return updatedFactory;
}
/**
 * 更新工厂信息（套餐、配额等）
 */
async function updateFactory(brandId, data) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    const updatedFactory = await prisma_1.default.brand.update({
        where: { id: brandId },
        data,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                    collaborations: true,
                },
            },
        },
    });
    return updatedFactory;
}
/**
 * 暂停/恢复工厂
 */
async function toggleBrandStatus(brandId, suspend) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    if (factory.status === 'PENDING') {
        throw (0, errorHandler_1.createBadRequestError)('待审核的工厂不能执行此操作');
    }
    const newStatus = suspend ? 'SUSPENDED' : 'APPROVED';
    const updatedFactory = await prisma_1.default.brand.update({
        where: { id: brandId },
        data: { status: newStatus },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                    collaborations: true,
                },
            },
        },
    });
    return updatedFactory;
}
/**
 * 删除品牌（包括关联数据）
 */
async function deleteBrand(brandId) {
    // 先检查品牌是否存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('品牌不存在');
    }
    // 使用事务删除品牌及关联数据
    await prisma_1.default.$transaction(async (tx) => {
        // 删除合作记录相关数据
        await tx.stageHistory.deleteMany({
            where: { collaboration: { brandId } },
        });
        await tx.followUpRecord.deleteMany({
            where: { collaboration: { brandId } },
        });
        await tx.collaborationResult.deleteMany({
            where: { collaboration: { brandId } },
        });
        await tx.sampleDispatch.deleteMany({
            where: { collaboration: { brandId } },
        });
        await tx.collaboration.deleteMany({
            where: { brandId },
        });
        // 删除达人记录
        await tx.influencer.deleteMany({
            where: { brandId },
        });
        // 删除达人分组
        await tx.influencerGroup.deleteMany({
            where: { brandId },
        });
        // 删除样品
        await tx.sample.deleteMany({
            where: { brandId },
        });
        // 删除通知
        await tx.notification.deleteMany({
            where: { user: { brandId } },
        });
        // 删除用户（商务人员）
        await tx.user.deleteMany({
            where: { brandId, role: 'BUSINESS' },
        });
        // 清除品牌负责人的 brandId（不删除用户）
        await tx.user.updateMany({
            where: { id: brand.ownerId },
            data: { brandId: null },
        });
        // 删除品牌
        await tx.brand.delete({
            where: { id: brandId },
        });
    });
}
// ============ Plan Configuration ============
/**
 * 获取所有套餐配置
 */
async function listPlanConfigs() {
    const configs = await prisma_1.default.planConfig.findMany({
        orderBy: { price: 'asc' },
    });
    return configs;
}
/**
 * 获取单个套餐配置
 */
async function getPlanConfig(planType) {
    const config = await prisma_1.default.planConfig.findUnique({
        where: { planType },
    });
    if (!config) {
        throw (0, errorHandler_1.createNotFoundError)('套餐配置不存在');
    }
    return config;
}
/**
 * 创建套餐配置
 */
async function createPlanConfig(data) {
    const existing = await prisma_1.default.planConfig.findUnique({
        where: { planType: data.planType },
    });
    if (existing) {
        throw (0, errorHandler_1.createBadRequestError)('该套餐类型已存在');
    }
    const config = await prisma_1.default.planConfig.create({
        data,
    });
    return config;
}
/**
 * 更新套餐配置
 */
async function updatePlanConfig(planType, data) {
    const existing = await prisma_1.default.planConfig.findUnique({
        where: { planType },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('套餐配置不存在');
    }
    const config = await prisma_1.default.planConfig.update({
        where: { planType },
        data,
    });
    return config;
}
/**
 * 删除套餐配置
 */
async function deletePlanConfig(planType) {
    const existing = await prisma_1.default.planConfig.findUnique({
        where: { planType },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('套餐配置不存在');
    }
    // 检查是否有工厂正在使用此套餐
    const factoriesUsingPlan = await prisma_1.default.brand.count({
        where: { planType },
    });
    if (factoriesUsingPlan > 0) {
        throw (0, errorHandler_1.createBadRequestError)(`有 ${factoriesUsingPlan} 个工厂正在使用此套餐，无法删除`);
    }
    await prisma_1.default.planConfig.delete({
        where: { planType },
    });
}
// ============ Quota Check ============
/**
 * 检查工厂配额
 */
async function checkFactoryQuota(brandId, type) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: {
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                },
            },
        },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    if (type === 'staff') {
        return {
            allowed: factory._count.staff < factory.staffLimit,
            current: factory._count.staff,
            limit: factory.staffLimit,
        };
    }
    else {
        return {
            allowed: factory._count.influencers < factory.influencerLimit,
            current: factory._count.influencers,
            limit: factory.influencerLimit,
        };
    }
}
/**
 * 验证并抛出配额错误
 */
async function validateQuota(brandId, type) {
    const quota = await checkFactoryQuota(brandId, type);
    if (!quota.allowed) {
        const typeLabel = type === 'staff' ? '商务账号' : '达人';
        throw (0, errorHandler_1.createQuotaExceededError)(`已达到${typeLabel}数量上限（${quota.current}/${quota.limit}），请升级套餐`);
    }
}
// ============ Platform Statistics ============
/**
 * 获取平台统计数据
 */
async function getPlatformStats() {
    const [totalFactories, pendingFactories, approvedFactories, totalUsers, totalCollaborations, totalInfluencers, independentBusinessUsers, freeFactories, personalFactories, professionalFactories, enterpriseFactories,] = await Promise.all([
        prisma_1.default.brand.count(),
        prisma_1.default.brand.count({ where: { status: 'PENDING' } }),
        prisma_1.default.brand.count({ where: { status: 'APPROVED' } }),
        prisma_1.default.user.count(),
        prisma_1.default.collaboration.count(),
        prisma_1.default.influencer.count(),
        prisma_1.default.user.count({ where: { role: 'BUSINESS', isIndependent: true, brandId: null } }),
        prisma_1.default.brand.count({ where: { planType: 'FREE' } }),
        prisma_1.default.brand.count({ where: { planType: 'PERSONAL' } }),
        prisma_1.default.brand.count({ where: { planType: 'PROFESSIONAL' } }),
        prisma_1.default.brand.count({ where: { planType: 'ENTERPRISE' } }),
    ]);
    return {
        totalFactories,
        pendingFactories,
        approvedFactories,
        totalUsers,
        totalCollaborations,
        totalInfluencers,
        independentBusinessUsers,
        factoriesByPlan: {
            FREE: freeFactories,
            PERSONAL: personalFactories,
            PROFESSIONAL: professionalFactories,
            ENTERPRISE: enterpriseFactories,
        },
    };
}
/**
 * 获取平台详细统计（按时间段）
 */
async function getPlatformDetailedStats(startDate, endDate) {
    const dateFilter = startDate && endDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
    } : {};
    const [newFactories, newUsers, newCollaborations, newInfluencers,] = await Promise.all([
        prisma_1.default.brand.count({ where: dateFilter }),
        prisma_1.default.user.count({ where: dateFilter }),
        prisma_1.default.collaboration.count({ where: dateFilter }),
        prisma_1.default.influencer.count({ where: dateFilter }),
    ]);
    // 获取各状态工厂数量
    const factoriesByStatus = await prisma_1.default.brand.groupBy({
        by: ['status'],
        _count: true,
    });
    // 获取各套餐工厂数量
    const factoriesByPlan = await prisma_1.default.brand.groupBy({
        by: ['planType'],
        _count: true,
    });
    // 获取各角色用户数量
    const usersByRole = await prisma_1.default.user.groupBy({
        by: ['role'],
        _count: true,
    });
    return {
        period: {
            startDate,
            endDate,
        },
        newFactories,
        newUsers,
        newCollaborations,
        newInfluencers,
        factoriesByStatus: factoriesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {}),
        factoriesByPlan: factoriesByPlan.reduce((acc, item) => {
            acc[item.planType] = item._count;
            return acc;
        }, {}),
        usersByRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
        }, {}),
    };
}
/**
 * 获取工厂的商务列表
 */
async function getBrandStaff(brandId) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    const staff = await prisma_1.default.user.findMany({
        where: {
            brandId,
            role: 'BUSINESS',
        },
        include: {
            _count: {
                select: {
                    createdInfluencers: true,
                    collaborations: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    // 重新映射字段名以匹配前端期望
    return staff.map(s => ({
        ...s,
        _count: {
            influencers: s._count.createdInfluencers,
            collaborations: s._count.collaborations,
        },
    }));
}
/**
 * 获取商务的工作统计
 */
async function getStaffWorkStats(staffId) {
    const staff = await prisma_1.default.user.findUnique({
        where: { id: staffId },
        include: {
            brand: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    if (!staff) {
        throw (0, errorHandler_1.createNotFoundError)('商务人员不存在');
    }
    if (staff.role !== 'BUSINESS') {
        throw (0, errorHandler_1.createBadRequestError)('该用户不是商务人员');
    }
    // 统计添加的达人数
    const influencersAdded = await prisma_1.default.influencer.count({
        where: { createdBy: staffId },
    });
    // 统计创建的合作数
    const collaborationsCreated = await prisma_1.default.collaboration.count({
        where: { businessStaffId: staffId },
    });
    // 统计完成的合作数（有结果的）
    const collaborationsCompleted = await prisma_1.default.collaboration.count({
        where: {
            businessStaffId: staffId,
            result: {
                isNot: null,
            },
        },
    });
    // 计算成功率
    const successRate = collaborationsCreated > 0
        ? (collaborationsCompleted / collaborationsCreated) * 100
        : 0;
    return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        brandId: staff.brandId,
        factoryName: staff.brand.name,
        createdAt: staff.createdAt,
        influencersAdded,
        collaborationsCreated,
        collaborationsCompleted,
        successRate: Math.round(successRate * 10) / 10, // 保留1位小数
    };
}
/**
 * 获取商务添加的达人列表
 */
async function getStaffInfluencers(staffId, pagination) {
    const { page, pageSize } = pagination;
    const [influencers, total] = await Promise.all([
        prisma_1.default.influencer.findMany({
            where: { createdBy: staffId },
            include: {
                _count: {
                    select: {
                        collaborations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.influencer.count({ where: { createdBy: staffId } }),
    ]);
    return {
        data: influencers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取商务的合作列表
 */
async function getStaffCollaborations(staffId, pagination) {
    const { page, pageSize } = pagination;
    const [collaborations, total] = await Promise.all([
        prisma_1.default.collaboration.findMany({
            where: { businessStaffId: staffId },
            include: {
                influencer: {
                    select: {
                        id: true,
                        nickname: true,
                        platform: true,
                    },
                },
                result: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.collaboration.count({ where: { businessStaffId: staffId } }),
    ]);
    return {
        data: collaborations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取所有达人列表（平台级别）
 */
async function listAllInfluencers(filter, pagination) {
    const { keyword, platform, brandId, sourceType, verificationStatus, createdBy } = filter;
    const { page, pageSize } = pagination;
    const where = {};
    // 关键词搜索
    if (keyword) {
        where.OR = [
            { nickname: { contains: keyword, mode: 'insensitive' } },
            { platformId: { contains: keyword, mode: 'insensitive' } },
            { phone: { contains: keyword, mode: 'insensitive' } },
        ];
    }
    // 平台筛选
    if (platform) {
        where.platform = platform;
    }
    // 工厂筛选
    if (brandId) {
        where.brandId = brandId;
    }
    // 来源类型筛选
    if (sourceType) {
        where.sourceType = sourceType;
    }
    // 认证状态筛选
    if (verificationStatus) {
        where.verificationStatus = verificationStatus;
    }
    // 添加人筛选
    if (createdBy) {
        where.createdBy = createdBy;
    }
    const [influencers, total] = await Promise.all([
        prisma_1.default.influencer.findMany({
            where,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        collaborations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.influencer.count({ where }),
    ]);
    return {
        data: influencers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取达人详情（平台级别）
 */
async function getInfluencerDetail(influencerId) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        include: {
            brand: {
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            verifier: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            collaborations: {
                select: {
                    id: true,
                    stage: true,
                    createdAt: true,
                    businessStaff: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    result: {
                        select: {
                            id: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在');
    }
    // 格式化合作记录
    const collaborations = influencer.collaborations.map((collab) => ({
        id: collab.id,
        stage: collab.stage,
        businessStaff: collab.businessStaff,
        createdAt: collab.createdAt,
        hasResult: !!collab.result,
    }));
    return {
        ...influencer,
        collaborations,
    };
}
/**
 * 认证达人
 */
async function verifyInfluencer(influencerId, adminId, status, note) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
        include: {
            brand: {
                include: {
                    owner: true,
                },
            },
            creator: true,
        },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在');
    }
    // 如果是拒绝认证，备注必填
    if (status === 'REJECTED' && !note) {
        throw (0, errorHandler_1.createBadRequestError)('拒绝认证时必须填写原因');
    }
    // 获取管理员信息
    const admin = await prisma_1.default.user.findUnique({
        where: { id: adminId },
        select: { name: true, role: true },
    });
    if (!admin || admin.role !== 'PLATFORM_ADMIN') {
        throw (0, errorHandler_1.createBadRequestError)('只有平台管理员可以进行认证操作');
    }
    // 构建认证历史记录
    const historyEntry = {
        action: status,
        verifiedBy: adminId,
        verifiedByName: admin.name,
        verifiedAt: new Date(),
        note: note || undefined,
    };
    // 获取现有历史记录
    const existingHistory = influencer.verificationHistory;
    const entries = existingHistory?.entries || [];
    entries.push(historyEntry);
    // 更新达人认证状态
    const updated = await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: {
            verificationStatus: status,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            verificationNote: note || null,
            verificationHistory: {
                entries,
            },
        },
    });
    // 发送通知给工厂老板
    await prisma_1.default.notification.create({
        data: {
            userId: influencer.brand.ownerId,
            type: 'INFLUENCER_VERIFICATION',
            title: status === 'VERIFIED' ? '达人认证通过' : '达人认证失败',
            content: `达人 ${influencer.nickname} 的认证${status === 'VERIFIED' ? '已通过' : '未通过'}${note ? `，原因：${note}` : ''}`,
            relatedId: influencerId,
        },
    });
    // 如果有添加人，也发送通知
    if (influencer.createdBy && influencer.createdBy !== influencer.brand.ownerId) {
        await prisma_1.default.notification.create({
            data: {
                userId: influencer.createdBy,
                type: 'INFLUENCER_VERIFICATION',
                title: status === 'VERIFIED' ? '达人认证通过' : '达人认证失败',
                content: `您添加的达人 ${influencer.nickname} 的认证${status === 'VERIFIED' ? '已通过' : '未通过'}${note ? `，原因：${note}` : ''}`,
                relatedId: influencerId,
            },
        });
    }
    return updated;
}
async function createInfluencerForBrand(input) {
    const { brandId, nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, tags, notes, createdBy, sourceType, } = input;
    // 验证品牌存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: { _count: { select: { influencers: true } } },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('目标品牌不存在');
    }
    // 检查配额
    if (brand._count.influencers >= brand.influencerLimit) {
        throw (0, errorHandler_1.createQuotaExceededError)(`该品牌已达到达人上限（${brand._count.influencers}/${brand.influencerLimit}）`);
    }
    // 检查重复（同品牌、同平台、同账号ID）
    const existing = await prisma_1.default.influencer.findFirst({
        where: {
            brandId,
            platform: platform,
            platformId,
        },
    });
    if (existing) {
        throw (0, errorHandler_1.createBadRequestError)(`该达人已存在于此品牌中（账号ID: ${platformId}）`);
    }
    // 创建达人
    const influencer = await prisma_1.default.influencer.create({
        data: {
            brandId,
            nickname,
            platform: platform,
            platformId,
            uid,
            homeUrl,
            phone,
            wechat,
            followers,
            tags,
            notes,
            createdBy,
            sourceType: sourceType,
            verificationStatus: 'UNVERIFIED',
        },
        include: {
            brand: {
                select: {
                    id: true,
                    name: true,
                },
            },
            creator: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    return influencer;
}
/**
 * 获取达人统计数据
 */
async function getInfluencerStats(startDate, endDate) {
    const dateFilter = startDate && endDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
    } : {};
    // 总数
    const total = await prisma_1.default.influencer.count({ where: dateFilter });
    // 按来源统计
    const bySource = await prisma_1.default.influencer.groupBy({
        by: ['sourceType'],
        where: dateFilter,
        _count: true,
    });
    // 按认证状态统计
    const byVerificationStatus = await prisma_1.default.influencer.groupBy({
        by: ['verificationStatus'],
        where: dateFilter,
        _count: true,
    });
    // 按平台统计
    const byPlatform = await prisma_1.default.influencer.groupBy({
        by: ['platform'],
        where: dateFilter,
        _count: true,
    });
    // 按工厂统计（前10）
    const byFactory = await prisma_1.default.influencer.groupBy({
        by: ['brandId'],
        where: dateFilter,
        _count: true,
        orderBy: {
            _count: {
                brandId: 'desc',
            },
        },
        take: 10,
    });
    // 获取工厂名称
    const brandIds = byFactory.map((f) => f.brandId);
    const factories = await prisma_1.default.brand.findMany({
        where: { id: { in: brandIds } },
        select: { id: true, name: true },
    });
    const factoryMap = new Map(factories.map((f) => [f.id, f.name]));
    // 来源质量分析
    const sourceQuality = await Promise.all(['PLATFORM', 'FACTORY', 'STAFF'].map(async (sourceType) => {
        const totalCount = await prisma_1.default.influencer.count({
            where: { ...dateFilter, sourceType: sourceType },
        });
        const verifiedCount = await prisma_1.default.influencer.count({
            where: {
                ...dateFilter,
                sourceType: sourceType,
                verificationStatus: 'VERIFIED',
            },
        });
        const collaborationsCount = await prisma_1.default.collaboration.count({
            where: {
                influencer: {
                    sourceType: sourceType,
                },
            },
        });
        const successfulCollaborations = await prisma_1.default.collaboration.count({
            where: {
                influencer: {
                    sourceType: sourceType,
                },
                result: {
                    isNot: null,
                },
            },
        });
        return {
            sourceType: sourceType,
            total: totalCount,
            verified: verifiedCount,
            verificationRate: totalCount > 0 ? verifiedCount / totalCount : 0,
            collaborations: collaborationsCount,
            successRate: collaborationsCount > 0 ? successfulCollaborations / collaborationsCount : 0,
        };
    }));
    return {
        total,
        bySourceType: {
            PLATFORM: bySource.find((s) => s.sourceType === 'PLATFORM')?._count || 0,
            FACTORY: bySource.find((s) => s.sourceType === 'FACTORY')?._count || 0,
            STAFF: bySource.find((s) => s.sourceType === 'STAFF')?._count || 0,
        },
        byVerificationStatus: {
            UNVERIFIED: byVerificationStatus.find((s) => s.verificationStatus === 'UNVERIFIED')?._count || 0,
            VERIFIED: byVerificationStatus.find((s) => s.verificationStatus === 'VERIFIED')?._count || 0,
            REJECTED: byVerificationStatus.find((s) => s.verificationStatus === 'REJECTED')?._count || 0,
        },
        byPlatform: {
            DOUYIN: byPlatform.find((p) => p.platform === 'DOUYIN')?._count || 0,
            KUAISHOU: byPlatform.find((p) => p.platform === 'KUAISHOU')?._count || 0,
            XIAOHONGSHU: byPlatform.find((p) => p.platform === 'XIAOHONGSHU')?._count || 0,
            WEIBO: byPlatform.find((p) => p.platform === 'WEIBO')?._count || 0,
            OTHER: byPlatform.find((p) => p.platform === 'OTHER')?._count || 0,
        },
        topFactories: byFactory.map((f) => ({
            factoryId: f.brandId,
            factoryName: factoryMap.get(f.brandId) || '未知工厂',
            count: f._count,
        })),
        sourceQuality,
    };
}
/**
 * 获取所有用户列表（平台管理员）
 */
async function listAllUsers(filter, pagination) {
    const { search, role, isActive } = filter;
    const { page, pageSize } = pagination;
    const where = {};
    // 搜索姓名或邮箱
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }
    // 角色筛选
    if (role) {
        where.role = role;
    }
    // 状态筛选
    if (isActive !== undefined) {
        where.isActive = isActive;
    }
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.user.count({ where }),
    ]);
    // 格式化返回数据
    const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        brandId: user.brandId || undefined,
        factoryName: user.brand?.name || undefined,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || undefined,
    }));
    return {
        data: formattedUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取用户详情
 */
async function getUserDetail(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            brand: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        brandId: user.brandId || undefined,
        factoryName: user.brand?.name || undefined,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || undefined,
    };
}
/**
 * 切换用户状态（启用/禁用）
 */
async function toggleUserStatus(userId, isActive, adminId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    // 不能禁用平台管理员
    if (user.role === 'PLATFORM_ADMIN' && !isActive) {
        throw (0, errorHandler_1.createBadRequestError)('不能禁用平台管理员账号');
    }
    // 不能禁用自己
    if (userId === adminId) {
        throw (0, errorHandler_1.createBadRequestError)('不能禁用自己的账号');
    }
    await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            isActive,
            disabledAt: isActive ? null : new Date(),
            disabledBy: isActive ? null : adminId,
        },
    });
    // 发送通知给用户
    if (user.role !== 'PLATFORM_ADMIN') {
        await prisma_1.default.notification.create({
            data: {
                userId,
                type: 'SYSTEM',
                title: isActive ? '账号已启用' : '账号已禁用',
                content: isActive
                    ? '您的账号已被管理员启用，现在可以正常使用系统功能。'
                    : '您的账号已被管理员禁用，如有疑问请联系管理员。',
            },
        });
    }
}
/**
 * 删除用户
 */
async function deleteUser(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            ownedBrand: true, // 检查是否拥有品牌
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    // 不能删除平台管理员
    if (user.role === 'PLATFORM_ADMIN') {
        throw (0, errorHandler_1.createBadRequestError)('不能删除平台管理员账号');
    }
    // 检查是否为品牌所有者
    if (user.ownedBrand) {
        throw (0, errorHandler_1.createBadRequestError)(`该用户是品牌「${user.ownedBrand.name}」的所有者，请先删除品牌再删除用户`);
    }
    // 删除用户（相关数据会级联删除或保留，取决于 schema 设置）
    await prisma_1.default.user.delete({
        where: { id: userId },
    });
}
/**
 * 删除达人（平台管理员）
 */
async function deleteInfluencer(influencerId) {
    const influencer = await prisma_1.default.influencer.findUnique({
        where: { id: influencerId },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在');
    }
    // 删除达人（相关数据会级联删除或保留，取决于 schema 设置）
    await prisma_1.default.influencer.delete({
        where: { id: influencerId },
    });
}
// ============ 独立商务管理 ============
/**
 * 获取独立商务列表
 */
async function getIndependentBusinessUsers(pagination, keyword) {
    const { page = 1, pageSize = 20 } = pagination;
    const skip = (page - 1) * pageSize;
    const where = {
        role: 'BUSINESS',
        isIndependent: true,
        // Note: Independent users have a personal workspace brand, so we don't check brandId: null
    };
    if (keyword) {
        where.OR = [
            { name: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
            { phone: { contains: keyword } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
                brandId: true,
                brand: {
                    select: {
                        id: true,
                        name: true,
                        planType: true,
                        planExpiresAt: true,
                        isPaid: true,
                        isLocked: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma_1.default.user.count({ where }),
    ]);
    return {
        data: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取品牌成员列表
 */
async function getBrandMembers(brandId) {
    // 验证品牌存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        select: { id: true, name: true, ownerId: true },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('品牌不存在');
    }
    // 获取所有成员：主账号 + 商务
    const members = await prisma_1.default.user.findMany({
        where: {
            OR: [
                { id: brand.ownerId }, // 主账号
                { brandId: brandId, role: 'BUSINESS' }, // 商务
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            joinedAt: true,
            lastLoginAt: true,
        },
        orderBy: [
            { role: 'asc' }, // BRAND 在前
            { createdAt: 'asc' },
        ],
    });
    return {
        brandId,
        brandName: brand.name,
        members: members.map(m => ({
            ...m,
            isOwner: m.id === brand.ownerId,
            roleLabel: m.id === brand.ownerId ? '主账号' : '商务',
        })),
    };
}
/**
 * 将独立商务划归到品牌
 */
async function assignUserToBrand(userId, brandId) {
    // 验证用户存在且是独立商务
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isIndependent: true, brandId: true },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('用户不存在');
    }
    if (user.role !== 'BUSINESS') {
        throw (0, errorHandler_1.createBadRequestError)('只能划归商务角色的用户');
    }
    if (!user.isIndependent || user.brandId) {
        throw (0, errorHandler_1.createBadRequestError)('该用户已隶属于品牌');
    }
    // 验证品牌存在
    const brand = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        select: { id: true, name: true, staffLimit: true },
    });
    if (!brand) {
        throw (0, errorHandler_1.createNotFoundError)('品牌不存在');
    }
    // 检查品牌商务人数配额
    const currentStaffCount = await prisma_1.default.user.count({
        where: { brandId, role: 'BUSINESS' },
    });
    if (currentStaffCount >= brand.staffLimit) {
        throw (0, errorHandler_1.createQuotaExceededError)('该品牌商务人数已达上限');
    }
    // 执行划归
    await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            brandId,
            isIndependent: false,
            joinedAt: new Date(),
        },
    });
    // 发送通知给用户
    await prisma_1.default.notification.create({
        data: {
            userId,
            type: 'SYSTEM',
            title: '您已加入品牌',
            content: `您已被管理员划归到品牌「${brand.name}」，现在可以在该品牌下开展业务。`,
        },
    });
}
//# sourceMappingURL=platform.service.js.map