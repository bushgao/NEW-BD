"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSample = createSample;
exports.getSampleById = getSampleById;
exports.updateSample = updateSample;
exports.deleteSample = deleteSample;
exports.listSamples = listSamples;
exports.createDispatch = createDispatch;
exports.getDispatchById = getDispatchById;
exports.updateDispatchStatus = updateDispatchStatus;
exports.listDispatches = listDispatches;
exports.getSampleCostReport = getSampleCostReport;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ==================== 样品 CRUD ====================
/**
 * 创建样品
 */
async function createSample(data) {
    const { brandId, sku, name, unitCost, retailPrice, canResend, notes } = data;
    // 检查 SKU 是否重复
    const existing = await prisma_1.default.sample.findFirst({
        where: { brandId, sku },
    });
    if (existing) {
        throw (0, errorHandler_1.createConflictError)('SKU 已存在');
    }
    const sample = await prisma_1.default.sample.create({
        data: {
            brandId,
            sku: sku.trim(),
            name: name.trim(),
            unitCost,
            retailPrice,
            canResend: canResend ?? true,
            notes: notes?.trim() || null,
        },
    });
    return sample;
}
/**
 * 根据 ID 获取样品
 */
async function getSampleById(id, brandId) {
    const sample = await prisma_1.default.sample.findFirst({
        where: { id, brandId },
    });
    if (!sample) {
        throw (0, errorHandler_1.createNotFoundError)('样品不存在');
    }
    return sample;
}
/**
 * 更新样品
 */
async function updateSample(id, brandId, data) {
    const existing = await prisma_1.default.sample.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('样品不存在');
    }
    // 如果更新 SKU，检查是否重复
    if (data.sku && data.sku !== existing.sku) {
        const duplicate = await prisma_1.default.sample.findFirst({
            where: { brandId, sku: data.sku, id: { not: id } },
        });
        if (duplicate) {
            throw (0, errorHandler_1.createConflictError)('SKU 已存在');
        }
    }
    const updateData = {};
    if (data.sku !== undefined)
        updateData.sku = data.sku.trim();
    if (data.name !== undefined)
        updateData.name = data.name.trim();
    if (data.unitCost !== undefined)
        updateData.unitCost = data.unitCost;
    if (data.retailPrice !== undefined)
        updateData.retailPrice = data.retailPrice;
    if (data.canResend !== undefined)
        updateData.canResend = data.canResend;
    if (data.notes !== undefined)
        updateData.notes = data.notes?.trim() || null;
    const sample = await prisma_1.default.sample.update({
        where: { id },
        data: updateData,
    });
    return sample;
}
/**
 * 删除样品
 */
async function deleteSample(id, brandId) {
    const existing = await prisma_1.default.sample.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('样品不存在');
    }
    // 检查是否有寄样记录
    const dispatchCount = await prisma_1.default.sampleDispatch.count({
        where: { sampleId: id },
    });
    if (dispatchCount > 0) {
        throw (0, errorHandler_1.createBadRequestError)('该样品存在寄样记录，无法删除');
    }
    await prisma_1.default.sample.delete({ where: { id } });
}
/**
 * 获取样品列表
 */
async function listSamples(brandId, filter, pagination) {
    const { keyword, canResend } = filter;
    const { page, pageSize } = pagination;
    const where = { brandId };
    if (keyword) {
        where.OR = [
            { sku: { contains: keyword, mode: 'insensitive' } },
            { name: { contains: keyword, mode: 'insensitive' } },
        ];
    }
    if (canResend !== undefined) {
        where.canResend = canResend;
    }
    const total = await prisma_1.default.sample.count({ where });
    const data = await prisma_1.default.sample.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
// ==================== 寄样记录 ====================
/**
 * 创建寄样记录（自动计算成本）
 */
async function createDispatch(data) {
    const { sampleId, collaborationId, businessStaffId, quantity, shippingCost, trackingNumber } = data;
    // 获取样品信息
    const sample = await prisma_1.default.sample.findUnique({
        where: { id: sampleId },
    });
    if (!sample) {
        throw (0, errorHandler_1.createNotFoundError)('样品不存在');
    }
    // 验证合作记录存在
    const collaboration = await prisma_1.default.collaboration.findUnique({
        where: { id: collaborationId },
    });
    if (!collaboration) {
        throw (0, errorHandler_1.createNotFoundError)('合作记录不存在');
    }
    // 计算成本（使用整数运算避免精度问题）
    const unitCostSnapshot = sample.unitCost;
    const totalSampleCost = quantity * unitCostSnapshot;
    const totalCost = totalSampleCost + shippingCost;
    const dispatch = await prisma_1.default.sampleDispatch.create({
        data: {
            sampleId,
            collaborationId,
            businessStaffId,
            quantity,
            unitCostSnapshot,
            totalSampleCost,
            shippingCost,
            totalCost,
            trackingNumber: trackingNumber?.trim() || null,
            receivedStatus: 'PENDING',
            onboardStatus: 'UNKNOWN',
            dispatchedAt: new Date(),
        },
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
        },
    });
    return dispatch;
}
/**
 * 获取寄样记录详情
 */
async function getDispatchById(id, brandId) {
    const dispatch = await prisma_1.default.sampleDispatch.findFirst({
        where: {
            id,
            sample: { brandId },
        },
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
            businessStaff: {
                select: { id: true, name: true, email: true },
            },
        },
    });
    if (!dispatch) {
        throw (0, errorHandler_1.createNotFoundError)('寄样记录不存在');
    }
    return dispatch;
}
/**
 * 更新寄样状态
 */
async function updateDispatchStatus(id, brandId, data) {
    const existing = await prisma_1.default.sampleDispatch.findFirst({
        where: {
            id,
            sample: { brandId },
        },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('寄样记录不存在');
    }
    const updateData = {};
    if (data.receivedStatus !== undefined) {
        updateData.receivedStatus = data.receivedStatus;
        if (data.receivedStatus === 'RECEIVED' && !existing.receivedAt) {
            updateData.receivedAt = data.receivedAt || new Date();
        }
    }
    if (data.onboardStatus !== undefined) {
        updateData.onboardStatus = data.onboardStatus;
    }
    const dispatch = await prisma_1.default.sampleDispatch.update({
        where: { id },
        data: updateData,
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
        },
    });
    return dispatch;
}
/**
 * 获取寄样记录列表
 */
async function listDispatches(brandId, filter, pagination) {
    const { page, pageSize } = pagination;
    const where = {
        sample: { brandId },
    };
    if (filter.sampleId)
        where.sampleId = filter.sampleId;
    if (filter.collaborationId)
        where.collaborationId = filter.collaborationId;
    if (filter.businessStaffId)
        where.businessStaffId = filter.businessStaffId;
    if (filter.receivedStatus)
        where.receivedStatus = filter.receivedStatus;
    if (filter.onboardStatus)
        where.onboardStatus = filter.onboardStatus;
    const total = await prisma_1.default.sampleDispatch.count({ where });
    const data = await prisma_1.default.sampleDispatch.findMany({
        where,
        orderBy: { dispatchedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
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
// ==================== 样品成本报表 ====================
/**
 * 获取样品成本报表
 */
async function getSampleCostReport(brandId, dateRange) {
    // 构建日期筛选条件
    const dateFilter = dateRange
        ? {
            dispatchedAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
            },
        }
        : {};
    // 获取工厂所有样品
    const samples = await prisma_1.default.sample.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
    });
    const items = [];
    let summaryTotalDispatchCount = 0;
    let summaryTotalQuantity = 0;
    let summaryTotalSampleCost = 0;
    let summaryTotalShippingCost = 0;
    let summaryTotalCost = 0;
    let summaryReceivedCount = 0;
    let summaryOnboardCount = 0;
    for (const sample of samples) {
        // 获取该样品的所有寄样记录
        const dispatches = await prisma_1.default.sampleDispatch.findMany({
            where: {
                sampleId: sample.id,
                ...dateFilter,
            },
        });
        if (dispatches.length === 0) {
            continue; // 跳过没有寄样记录的样品
        }
        const totalDispatchCount = dispatches.length;
        const totalQuantity = dispatches.reduce((sum, d) => sum + d.quantity, 0);
        const totalSampleCost = dispatches.reduce((sum, d) => sum + d.totalSampleCost, 0);
        const totalShippingCost = dispatches.reduce((sum, d) => sum + d.shippingCost, 0);
        const totalCost = dispatches.reduce((sum, d) => sum + d.totalCost, 0);
        const receivedCount = dispatches.filter((d) => d.receivedStatus === 'RECEIVED').length;
        const onboardCount = dispatches.filter((d) => d.onboardStatus === 'ONBOARD').length;
        items.push({
            sampleId: sample.id,
            sku: sample.sku,
            name: sample.name,
            unitCost: sample.unitCost,
            totalDispatchCount,
            totalQuantity,
            totalSampleCost,
            totalShippingCost,
            totalCost,
            receivedCount,
            receivedRate: totalDispatchCount > 0 ? receivedCount / totalDispatchCount : 0,
            onboardCount,
            onboardRate: totalDispatchCount > 0 ? onboardCount / totalDispatchCount : 0,
        });
        // 累加汇总数据
        summaryTotalDispatchCount += totalDispatchCount;
        summaryTotalQuantity += totalQuantity;
        summaryTotalSampleCost += totalSampleCost;
        summaryTotalShippingCost += totalShippingCost;
        summaryTotalCost += totalCost;
        summaryReceivedCount += receivedCount;
        summaryOnboardCount += onboardCount;
    }
    return {
        items,
        summary: {
            totalDispatchCount: summaryTotalDispatchCount,
            totalQuantity: summaryTotalQuantity,
            totalSampleCost: summaryTotalSampleCost,
            totalShippingCost: summaryTotalShippingCost,
            totalCost: summaryTotalCost,
            overallReceivedRate: summaryTotalDispatchCount > 0 ? summaryReceivedCount / summaryTotalDispatchCount : 0,
            overallOnboardRate: summaryTotalDispatchCount > 0 ? summaryOnboardCount / summaryTotalDispatchCount : 0,
        },
    };
}
//# sourceMappingURL=sample.service.js.map