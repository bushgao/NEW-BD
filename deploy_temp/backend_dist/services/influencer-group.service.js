"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroup = createGroup;
exports.getGroupById = getGroupById;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
exports.listGroups = listGroups;
exports.getGroupStats = getGroupStats;
exports.moveInfluencerToGroup = moveInfluencerToGroup;
exports.batchMoveInfluencersToGroup = batchMoveInfluencersToGroup;
exports.getGroupInfluencers = getGroupInfluencers;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Create a new influencer group
 */
async function createGroup(data) {
    const { brandId, name, color, description, createdBy } = data;
    // Check if group name already exists in this factory
    const existing = await prisma_1.default.influencerGroup.findFirst({
        where: {
            brandId,
            name: name.trim(),
        },
    });
    if (existing) {
        throw (0, errorHandler_1.createConflictError)('分组名称已存在');
    }
    const group = await prisma_1.default.influencerGroup.create({
        data: {
            brandId,
            name: name.trim(),
            color: color || '#1890ff',
            description: description?.trim() || null,
            createdBy,
        },
    });
    return {
        ...group,
        influencerCount: 0,
    };
}
/**
 * Get group by ID
 */
async function getGroupById(id, brandId) {
    const group = await prisma_1.default.influencerGroup.findFirst({
        where: { id, brandId },
        include: {
            _count: {
                select: {
                    influencers: true,
                },
            },
        },
    });
    if (!group) {
        throw (0, errorHandler_1.createNotFoundError)('分组不存在');
    }
    return {
        ...group,
        influencerCount: group._count.influencers,
    };
}
/**
 * Update group
 */
async function updateGroup(id, brandId, data) {
    // Check if group exists
    const existing = await prisma_1.default.influencerGroup.findFirst({
        where: { id, brandId },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('分组不存在');
    }
    // Check if new name conflicts with existing group
    if (data.name) {
        const nameConflict = await prisma_1.default.influencerGroup.findFirst({
            where: {
                brandId,
                name: data.name.trim(),
                id: { not: id },
            },
        });
        if (nameConflict) {
            throw (0, errorHandler_1.createConflictError)('分组名称已存在');
        }
    }
    const updateData = {};
    if (data.name !== undefined)
        updateData.name = data.name.trim();
    if (data.color !== undefined)
        updateData.color = data.color;
    if (data.description !== undefined)
        updateData.description = data.description?.trim() || null;
    const group = await prisma_1.default.influencerGroup.update({
        where: { id },
        data: updateData,
        include: {
            _count: {
                select: {
                    influencers: true,
                },
            },
        },
    });
    return {
        ...group,
        influencerCount: group._count.influencers,
    };
}
/**
 * Delete group
 */
async function deleteGroup(id, brandId) {
    const existing = await prisma_1.default.influencerGroup.findFirst({
        where: { id, brandId },
        include: {
            _count: {
                select: {
                    influencers: true,
                },
            },
        },
    });
    if (!existing) {
        throw (0, errorHandler_1.createNotFoundError)('分组不存在');
    }
    // If group has influencers, remove them from the group first
    if (existing._count.influencers > 0) {
        await prisma_1.default.influencer.updateMany({
            where: { groupId: id },
            data: { groupId: null },
        });
    }
    await prisma_1.default.influencerGroup.delete({ where: { id } });
}
/**
 * List all groups in a factory
 */
async function listGroups(brandId) {
    const groups = await prisma_1.default.influencerGroup.findMany({
        where: { brandId },
        include: {
            _count: {
                select: {
                    influencers: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return groups.map((group) => ({
        ...group,
        influencerCount: group._count.influencers,
    }));
}
/**
 * Get group statistics
 */
async function getGroupStats(id, brandId) {
    const group = await prisma_1.default.influencerGroup.findFirst({
        where: { id, brandId },
        include: {
            influencers: {
                include: {
                    collaborations: {
                        where: {
                            stage: 'REVIEWED',
                            result: {
                                isNot: null,
                            },
                        },
                        include: {
                            result: true,
                        },
                    },
                },
            },
        },
    });
    if (!group) {
        throw (0, errorHandler_1.createNotFoundError)('分组不存在');
    }
    let totalCollaborations = 0;
    let totalGMV = 0;
    let totalCost = 0;
    group.influencers.forEach((influencer) => {
        influencer.collaborations.forEach((collab) => {
            if (collab.result) {
                totalCollaborations++;
                totalGMV += collab.result.salesGmv || 0;
                totalCost += collab.result.totalCollaborationCost || 0;
            }
        });
    });
    const avgROI = totalCost > 0 ? ((totalGMV / totalCost - 1) * 100) : 0;
    return {
        totalInfluencers: group.influencers.length,
        totalCollaborations,
        avgROI,
        totalGMV,
    };
}
/**
 * Move influencer to group
 */
async function moveInfluencerToGroup(influencerId, groupId, brandId) {
    // Verify influencer exists and belongs to factory
    const influencer = await prisma_1.default.influencer.findFirst({
        where: { id: influencerId, brandId },
    });
    if (!influencer) {
        throw (0, errorHandler_1.createNotFoundError)('达人不存在');
    }
    // If groupId is provided, verify group exists and belongs to factory
    if (groupId) {
        const group = await prisma_1.default.influencerGroup.findFirst({
            where: { id: groupId, brandId },
        });
        if (!group) {
            throw (0, errorHandler_1.createNotFoundError)('分组不存在');
        }
    }
    // Update influencer's group
    await prisma_1.default.influencer.update({
        where: { id: influencerId },
        data: { groupId },
    });
}
/**
 * Batch move influencers to group
 */
async function batchMoveInfluencersToGroup(influencerIds, groupId, brandId) {
    // Verify all influencers exist and belong to factory
    const influencers = await prisma_1.default.influencer.findMany({
        where: {
            id: { in: influencerIds },
            brandId,
        },
    });
    if (influencers.length !== influencerIds.length) {
        throw (0, errorHandler_1.createBadRequestError)('部分达人不存在或不属于该工厂');
    }
    // If groupId is provided, verify group exists and belongs to factory
    if (groupId) {
        const group = await prisma_1.default.influencerGroup.findFirst({
            where: { id: groupId, brandId },
        });
        if (!group) {
            throw (0, errorHandler_1.createNotFoundError)('分组不存在');
        }
    }
    // Update all influencers' group
    await prisma_1.default.influencer.updateMany({
        where: { id: { in: influencerIds } },
        data: { groupId },
    });
}
/**
 * Get influencers in a group
 */
async function getGroupInfluencers(groupId, brandId) {
    const group = await prisma_1.default.influencerGroup.findFirst({
        where: { id: groupId, brandId },
    });
    if (!group) {
        throw (0, errorHandler_1.createNotFoundError)('分组不存在');
    }
    const influencers = await prisma_1.default.influencer.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
    });
    return influencers;
}
//# sourceMappingURL=influencer-group.service.js.map