"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_TYPE_NAMES = exports.PROFIT_STATUS_NAMES = void 0;
exports.calculateProfitStatus = calculateProfitStatus;
exports.calculateRoi = calculateRoi;
exports.createResult = createResult;
exports.getResultById = getResultById;
exports.getResultByCollaborationId = getResultByCollaborationId;
exports.updateResult = updateResult;
exports.listResults = listResults;
exports.getRoiReport = getRoiReport;
exports.getResultStats = getResultStats;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// 回本状态名称映射
exports.PROFIT_STATUS_NAMES = {
    LOSS: '未回本',
    BREAK_EVEN: '刚回本',
    PROFIT: '已回本',
    HIGH_PROFIT: '爆赚',
};
// 内容类型名称映射
exports.CONTENT_TYPE_NAMES = {
    SHORT_VIDEO: '短视频',
    LIVE_STREAM: '直播',
};
// ==================== ROI 计算逻辑 ====================
/**
 * 计算回本状态
 * ROI < 1 为 LOSS（未回本）
 * ROI = 1 为 BREAK_EVEN（刚回本）
 * 1 < ROI < 3 为 PROFIT（已回本）
 * ROI >= 3 为 HIGH_PROFIT（爆赚）
 */
function calculateProfitStatus(roi) {
    if (roi < 1)
        return 'LOSS';
    if (roi === 1)
        return 'BREAK_EVEN';
    if (roi < 3)
        return 'PROFIT';
    return 'HIGH_PROFIT';
}
/**
 * 计算 ROI
 * ROI = 销售GMV / 合作总成本
 * 如果总成本为0，返回0避免除零错误
 */
function calculateRoi(salesGmv, totalCost) {
    if (totalCost === 0)
        return 0;
    // 保留4位小数
    return Math.round((salesGmv / totalCost) * 10000) / 10000;
}
// ==================== 合作结果 CRUD ====================
/**
 * 录入合作结果
 */
async function createResult(data, brandId) {
    const { collaborationId, contentType, publishedAt, salesQuantity, salesGmv, commissionRate, pitFee = 0, actualCommission, willRepeat, notes, } = data;
    // 验证合作记录存在且属于该工厂
    const collaboration = await prisma_1.default.collaboration.findFirst({
        where: { id: collaborationId, brandId },
        include: {
            dispatches: true,
            result: true,
        },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 检查是否已有结果
    if (collaboration.result) {
        throw (0, errorHandler_1.createBadRequestError)('该合作已有结果记录，请使用更新接口');
    }
    // 计算关联寄样的总成本
    const totalSampleCost = collaboration.dispatches.reduce((sum, d) => sum + d.totalCost, 0);
    // 计算合作总成本 = 样品成本 + 坑位费 + 实付佣金
    const totalCollaborationCost = totalSampleCost + pitFee + actualCommission;
    // 计算 ROI
    const roi = calculateRoi(salesGmv, totalCollaborationCost);
    // 计算回本状态
    const profitStatus = calculateProfitStatus(roi);
    // 创建结果记录
    const result = await prisma_1.default.$transaction(async (tx) => {
        // 创建合作结果
        const newResult = await tx.collaborationResult.create({
            data: {
                collaborationId,
                contentType,
                publishedAt,
                salesQuantity,
                salesGmv,
                commissionRate,
                pitFee,
                actualCommission,
                totalSampleCost,
                totalCollaborationCost,
                roi,
                profitStatus,
                willRepeat,
                notes: notes?.trim() || null,
            },
        });
        // 更新合作记录阶段为已复盘
        await tx.collaboration.update({
            where: { id: collaborationId },
            data: { stage: 'REVIEWED' },
        });
        // 添加阶段历史
        await tx.stageHistory.create({
            data: {
                collaborationId,
                fromStage: collaboration.stage,
                toStage: 'REVIEWED',
                notes: '录入合作结果',
            },
        });
        return newResult;
    });
    return result;
}
/**
 * 获取合作结果详情
 */
async function getResultById(id, brandId) {
    const result = await prisma_1.default.collaborationResult.findFirst({
        where: {
            id,
            collaboration: { brandId },
        },
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: {
                        select: { id: true, name: true, email: true },
                    },
                    dispatches: {
                        include: { sample: true },
                    },
                },
            },
        },
    });
    if (!result) {
        throw (0, errorHandler_1.createNotFoundError)('合作结果不存在');
    }
    return result;
}
/**
 * 根据合作ID获取结果
 */
async function getResultByCollaborationId(collaborationId, brandId) {
    const result = await prisma_1.default.collaborationResult.findFirst({
        where: {
            collaborationId,
            collaboration: { brandId },
        },
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: {
                        select: { id: true, name: true, email: true },
                    },
                    dispatches: {
                        include: { sample: true },
                    },
                },
            },
        },
    });
    return result;
}
/**
 * 更新合作结果
 */
async function updateResult(id, brandId, data) {
    const existing = await prisma_1.default.collaborationResult.findFirst({
        where: {
            id,
            collaboration: { brandId },
        },
        include: {
            collaboration: {
                include: { dispatches: true },
            },
        },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('合作结果不存在');
    }
    // 准备更新数据
    const updateData = {};
    if (data.contentType !== undefined)
        updateData.contentType = data.contentType;
    if (data.publishedAt !== undefined)
        updateData.publishedAt = data.publishedAt;
    if (data.salesQuantity !== undefined)
        updateData.salesQuantity = data.salesQuantity;
    if (data.salesGmv !== undefined)
        updateData.salesGmv = data.salesGmv;
    if (data.commissionRate !== undefined)
        updateData.commissionRate = data.commissionRate;
    if (data.pitFee !== undefined)
        updateData.pitFee = data.pitFee;
    if (data.actualCommission !== undefined)
        updateData.actualCommission = data.actualCommission;
    if (data.willRepeat !== undefined)
        updateData.willRepeat = data.willRepeat;
    if (data.notes !== undefined)
        updateData.notes = data.notes?.trim() || null;
    // 如果更新了影响成本或GMV的字段，重新计算ROI
    const needRecalculate = data.salesGmv !== undefined ||
        data.pitFee !== undefined ||
        data.actualCommission !== undefined;
    if (needRecalculate) {
        const salesGmv = data.salesGmv ?? existing.salesGmv;
        const pitFee = data.pitFee ?? existing.pitFee;
        const actualCommission = data.actualCommission ?? existing.actualCommission;
        const totalSampleCost = existing.totalSampleCost;
        const totalCollaborationCost = totalSampleCost + pitFee + actualCommission;
        const roi = calculateRoi(salesGmv, totalCollaborationCost);
        const profitStatus = calculateProfitStatus(roi);
        updateData.totalCollaborationCost = totalCollaborationCost;
        updateData.roi = roi;
        updateData.profitStatus = profitStatus;
    }
    const result = await prisma_1.default.collaborationResult.update({
        where: { id },
        data: updateData,
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });
    return result;
}
/**
 * 获取合作结果列表
 */
async function listResults(brandId, filter, pagination) {
    const { page, pageSize } = pagination;
    const where = {
        collaboration: { brandId },
    };
    if (filter.profitStatus)
        where.profitStatus = filter.profitStatus;
    if (filter.contentType)
        where.contentType = filter.contentType;
    if (filter.businessStaffId) {
        where.collaboration = { ...where.collaboration, businessStaffId: filter.businessStaffId };
    }
    if (filter.startDate || filter.endDate) {
        where.publishedAt = {};
        if (filter.startDate)
            where.publishedAt.gte = filter.startDate;
        if (filter.endDate)
            where.publishedAt.lte = filter.endDate;
    }
    const total = await prisma_1.default.collaborationResult.count({ where });
    const data = await prisma_1.default.collaborationResult.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: {
                        select: { id: true, name: true, email: true },
                    },
                },
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
// ==================== ROI 报表 ====================
/**
 * 获取 ROI 报表（按维度分组）
 */
async function getRoiReport(brandId, filter) {
    const { groupBy, startDate, endDate } = filter;
    // 构建查询条件
    const where = {
        collaboration: { brandId },
    };
    if (startDate || endDate) {
        where.publishedAt = {};
        if (startDate)
            where.publishedAt.gte = startDate;
        if (endDate)
            where.publishedAt.lte = endDate;
    }
    // 获取所有结果数据
    const results = await prisma_1.default.collaborationResult.findMany({
        where,
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: {
                        select: { id: true, name: true },
                    },
                    dispatches: {
                        include: { sample: true },
                    },
                },
            },
        },
    });
    // 按维度分组
    const groupMap = new Map();
    for (const result of results) {
        let groupKey;
        let groupName;
        switch (groupBy) {
            case 'influencer':
                groupKey = result.collaboration.influencerId;
                groupName = result.collaboration.influencer.nickname;
                break;
            case 'sample':
                // 按主要样品分组（取第一个寄样的样品）
                const firstDispatch = result.collaboration.dispatches[0];
                if (firstDispatch) {
                    groupKey = firstDispatch.sampleId;
                    groupName = firstDispatch.sample.name;
                }
                else {
                    groupKey = 'no-sample';
                    groupName = '无样品';
                }
                break;
            case 'staff':
                groupKey = result.collaboration.businessStaffId;
                groupName = result.collaboration.businessStaff.name;
                break;
            case 'month':
                const date = new Date(result.publishedAt);
                groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                groupName = `${date.getFullYear()}年${date.getMonth() + 1}月`;
                break;
            default:
                groupKey = 'all';
                groupName = '全部';
        }
        if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, { groupKey, groupName, results: [] });
        }
        groupMap.get(groupKey).results.push(result);
    }
    // 计算每组的汇总数据
    const items = [];
    let summaryTotalCollaborations = 0;
    let summaryTotalSampleCost = 0;
    let summaryTotalPitFee = 0;
    let summaryTotalCommission = 0;
    let summaryTotalCost = 0;
    let summaryTotalGmv = 0;
    let summaryProfitCount = 0;
    for (const [, group] of groupMap) {
        const collaborationCount = group.results.length;
        const totalSampleCost = group.results.reduce((sum, r) => sum + r.totalSampleCost, 0);
        const totalPitFee = group.results.reduce((sum, r) => sum + r.pitFee, 0);
        const totalCommission = group.results.reduce((sum, r) => sum + r.actualCommission, 0);
        const totalCost = group.results.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
        const totalGmv = group.results.reduce((sum, r) => sum + r.salesGmv, 0);
        const roi = calculateRoi(totalGmv, totalCost);
        const profitCount = group.results.filter((r) => r.roi >= 1).length;
        const lossCount = collaborationCount - profitCount;
        items.push({
            groupKey: group.groupKey,
            groupName: group.groupName,
            collaborationCount,
            totalSampleCost,
            totalPitFee,
            totalCommission,
            totalCost,
            totalGmv,
            roi,
            profitCount,
            lossCount,
        });
        // 累加汇总
        summaryTotalCollaborations += collaborationCount;
        summaryTotalSampleCost += totalSampleCost;
        summaryTotalPitFee += totalPitFee;
        summaryTotalCommission += totalCommission;
        summaryTotalCost += totalCost;
        summaryTotalGmv += totalGmv;
        summaryProfitCount += profitCount;
    }
    // 按 ROI 降序排序
    items.sort((a, b) => b.roi - a.roi);
    return {
        items,
        summary: {
            totalCollaborations: summaryTotalCollaborations,
            totalSampleCost: summaryTotalSampleCost,
            totalPitFee: summaryTotalPitFee,
            totalCommission: summaryTotalCommission,
            totalCost: summaryTotalCost,
            totalGmv: summaryTotalGmv,
            overallRoi: calculateRoi(summaryTotalGmv, summaryTotalCost),
            profitRate: summaryTotalCollaborations > 0
                ? Math.round((summaryProfitCount / summaryTotalCollaborations) * 10000) / 100
                : 0,
        },
    };
}
/**
 * 获取合作结果统计概览
 */
async function getResultStats(brandId, dateRange) {
    const where = {
        collaboration: { brandId },
    };
    if (dateRange) {
        where.publishedAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
        };
    }
    // 获取各状态数量
    const statusCounts = await prisma_1.default.collaborationResult.groupBy({
        by: ['profitStatus'],
        where,
        _count: { id: true },
    });
    // 获取汇总数据
    const aggregation = await prisma_1.default.collaborationResult.aggregate({
        where,
        _sum: {
            salesGmv: true,
            totalCollaborationCost: true,
            salesQuantity: true,
        },
        _count: { id: true },
    });
    const totalGmv = aggregation._sum.salesGmv || 0;
    const totalCost = aggregation._sum.totalCollaborationCost || 0;
    const totalQuantity = aggregation._sum.salesQuantity || 0;
    const totalCount = aggregation._count.id;
    return {
        totalCount,
        totalGmv,
        totalCost,
        totalQuantity,
        overallRoi: calculateRoi(totalGmv, totalCost),
        byStatus: {
            LOSS: statusCounts.find((s) => s.profitStatus === 'LOSS')?._count.id || 0,
            BREAK_EVEN: statusCounts.find((s) => s.profitStatus === 'BREAK_EVEN')?._count.id || 0,
            PROFIT: statusCounts.find((s) => s.profitStatus === 'PROFIT')?._count.id || 0,
            HIGH_PROFIT: statusCounts.find((s) => s.profitStatus === 'HIGH_PROFIT')?._count.id || 0,
        },
    };
}
//# sourceMappingURL=result.service.js.map