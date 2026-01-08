import prisma from '../lib/prisma';
import {
  createBadRequestError,
  createNotFoundError,
  createConflictError,
} from '../middleware/errorHandler';

// Types
export interface CreateGroupInput {
  factoryId: string;
  name: string;
  color?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  description?: string;
}

export interface InfluencerGroup {
  id: string;
  factoryId: string;
  name: string;
  color: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  influencerCount?: number;
  stats?: GroupStats;
}

export interface GroupStats {
  totalInfluencers: number;
  totalCollaborations: number;
  avgROI: number;
  totalGMV: number;
}

/**
 * Create a new influencer group
 */
export async function createGroup(data: CreateGroupInput): Promise<InfluencerGroup> {
  const { factoryId, name, color, description, createdBy } = data;

  // Check if group name already exists in this factory
  const existing = await prisma.influencerGroup.findFirst({
    where: {
      factoryId,
      name: name.trim(),
    },
  });

  if (existing) {
    throw createConflictError('分组名称已存在');
  }

  const group = await prisma.influencerGroup.create({
    data: {
      factoryId,
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
export async function getGroupById(
  id: string,
  factoryId: string
): Promise<InfluencerGroup> {
  const group = await prisma.influencerGroup.findFirst({
    where: { id, factoryId },
    include: {
      _count: {
        select: {
          influencers: true,
        },
      },
    },
  });

  if (!group) {
    throw createNotFoundError('分组不存在');
  }

  return {
    ...group,
    influencerCount: group._count.influencers,
  };
}

/**
 * Update group
 */
export async function updateGroup(
  id: string,
  factoryId: string,
  data: UpdateGroupInput
): Promise<InfluencerGroup> {
  // Check if group exists
  const existing = await prisma.influencerGroup.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('分组不存在');
  }

  // Check if new name conflicts with existing group
  if (data.name) {
    const nameConflict = await prisma.influencerGroup.findFirst({
      where: {
        factoryId,
        name: data.name.trim(),
        id: { not: id },
      },
    });

    if (nameConflict) {
      throw createConflictError('分组名称已存在');
    }
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.color !== undefined) updateData.color = data.color;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;

  const group = await prisma.influencerGroup.update({
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
export async function deleteGroup(id: string, factoryId: string): Promise<void> {
  const existing = await prisma.influencerGroup.findFirst({
    where: { id, factoryId },
    include: {
      _count: {
        select: {
          influencers: true,
        },
      },
    },
  });

  if (!existing) {
    throw createNotFoundError('分组不存在');
  }

  // If group has influencers, remove them from the group first
  if (existing._count.influencers > 0) {
    await prisma.influencer.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });
  }

  await prisma.influencerGroup.delete({ where: { id } });
}

/**
 * List all groups in a factory
 */
export async function listGroups(factoryId: string): Promise<InfluencerGroup[]> {
  const groups = await prisma.influencerGroup.findMany({
    where: { factoryId },
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
export async function getGroupStats(
  id: string,
  factoryId: string
): Promise<GroupStats> {
  const group = await prisma.influencerGroup.findFirst({
    where: { id, factoryId },
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
    throw createNotFoundError('分组不存在');
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
export async function moveInfluencerToGroup(
  influencerId: string,
  groupId: string | null,
  factoryId: string
): Promise<void> {
  // Verify influencer exists and belongs to factory
  const influencer = await prisma.influencer.findFirst({
    where: { id: influencerId, factoryId },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在');
  }

  // If groupId is provided, verify group exists and belongs to factory
  if (groupId) {
    const group = await prisma.influencerGroup.findFirst({
      where: { id: groupId, factoryId },
    });

    if (!group) {
      throw createNotFoundError('分组不存在');
    }
  }

  // Update influencer's group
  await prisma.influencer.update({
    where: { id: influencerId },
    data: { groupId },
  });
}

/**
 * Batch move influencers to group
 */
export async function batchMoveInfluencersToGroup(
  influencerIds: string[],
  groupId: string | null,
  factoryId: string
): Promise<void> {
  // Verify all influencers exist and belong to factory
  const influencers = await prisma.influencer.findMany({
    where: {
      id: { in: influencerIds },
      factoryId,
    },
  });

  if (influencers.length !== influencerIds.length) {
    throw createBadRequestError('部分达人不存在或不属于该工厂');
  }

  // If groupId is provided, verify group exists and belongs to factory
  if (groupId) {
    const group = await prisma.influencerGroup.findFirst({
      where: { id: groupId, factoryId },
    });

    if (!group) {
      throw createNotFoundError('分组不存在');
    }
  }

  // Update all influencers' group
  await prisma.influencer.updateMany({
    where: { id: { in: influencerIds } },
    data: { groupId },
  });
}

/**
 * Get influencers in a group
 */
export async function getGroupInfluencers(
  groupId: string,
  factoryId: string
): Promise<any[]> {
  const group = await prisma.influencerGroup.findFirst({
    where: { id: groupId, factoryId },
  });

  if (!group) {
    throw createNotFoundError('分组不存在');
  }

  const influencers = await prisma.influencer.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
  });

  return influencers;
}
