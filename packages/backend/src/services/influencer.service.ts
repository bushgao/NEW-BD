import prisma from '../lib/prisma';
import {
  createBadRequestError,
  createNotFoundError,
  createConflictError,
  createQuotaExceededError,
} from '../middleware/errorHandler';
import type { Platform, PipelineStage, Pagination, PaginatedResult } from '@ics/shared';

// Types
export interface CreateInfluencerInput {
  brandId: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  uid?: string;
  homeUrl?: string;
  phone?: string;
  wechat?: string;
  shippingAddress?: string;
  followers?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
  userId?: string; // 添加人ID（用于来源追踪）
}

export interface UpdateInfluencerInput {
  nickname?: string;
  platform?: Platform;
  platformId?: string;
  uid?: string;
  homeUrl?: string;
  phone?: string;
  wechat?: string;
  shippingAddress?: string;
  followers?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
}

export interface InfluencerFilter {
  keyword?: string;
  platform?: Platform;
  category?: string;
  tags?: string[];
  pipelineStage?: PipelineStage;
  businessStaffId?: string;
  groupId?: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: 'phone' | 'platformId' | 'both';
  existingInfluencer?: {
    id: string;
    nickname: string;
    platform: Platform;
    platformId: string;
    phone: string | null;
  };
}

export interface Influencer {
  id: string;
  brandId: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  uid: string | null;
  homeUrl: string | null;
  phone: string | null;
  wechat: string | null;
  shippingAddress: string | null;
  followers: string | null;
  categories: string[];
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if factory has reached influencer quota limit
 */
async function checkInfluencerQuota(brandId: string): Promise<void> {
  // 使用 platform.service 的 validateQuota 函数
  const { validateQuota } = await import('./platform.service');
  await validateQuota(brandId, 'influencer');
}

/**
 * Check for duplicate influencer by phone or platform ID
 */
export async function checkDuplicate(
  brandId: string,
  phone?: string,
  platform?: Platform,
  platformId?: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const conditions: any[] = [];

  // Check phone duplicate (if provided and not empty)
  if (phone && phone.trim()) {
    conditions.push({ phone: phone.trim() });
  }

  // Check platform + platformId duplicate (if both provided)
  if (platform && platformId) {
    conditions.push({
      platform,
      platformId: platformId.trim(),
    });
  }

  if (conditions.length === 0) {
    return { isDuplicate: false };
  }

  const existingInfluencer = await prisma.influencer.findFirst({
    where: {
      brandId,
      id: excludeId ? { not: excludeId } : undefined,
      OR: conditions,
    },
    select: {
      id: true,
      nickname: true,
      platform: true,
      platformId: true,
      phone: true,
    },
  });

  if (!existingInfluencer) {
    return { isDuplicate: false };
  }

  // Determine duplicate type
  let duplicateType: 'phone' | 'platformId' | 'both' = 'platformId';
  const phoneMatch = phone && existingInfluencer.phone === phone.trim();
  const platformMatch =
    platform === existingInfluencer.platform &&
    platformId === existingInfluencer.platformId;

  if (phoneMatch && platformMatch) {
    duplicateType = 'both';
  } else if (phoneMatch) {
    duplicateType = 'phone';
  }

  return {
    isDuplicate: true,
    duplicateType,
    existingInfluencer: existingInfluencer as DuplicateCheckResult['existingInfluencer'],
  };
}

/**
 * Determine source type based on user role
 */
function determineSourceType(userRole: string): 'PLATFORM' | 'FACTORY' | 'STAFF' {
  switch (userRole) {
    case 'PLATFORM_ADMIN':
      return 'PLATFORM';
    case 'BRAND':
      return 'FACTORY';
    case 'BUSINESS':
      return 'STAFF';
    default:
      return 'STAFF';
  }
}

/**
 * Create a new influencer
 */
export async function create(data: CreateInfluencerInput): Promise<Influencer> {
  const { brandId, nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, categories, tags, notes, userId } = data;

  // Check quota
  await checkInfluencerQuota(brandId);

  // Check for duplicates
  const duplicateCheck = await checkDuplicate(brandId, phone, platform, platformId);
  if (duplicateCheck.isDuplicate) {
    const typeMsg =
      duplicateCheck.duplicateType === 'phone'
        ? '手机号'
        : duplicateCheck.duplicateType === 'platformId'
          ? '平台账号ID'
          : '手机号和平台账号ID';
    throw createConflictError(`达人${typeMsg}已存在`, {
      duplicateType: duplicateCheck.duplicateType,
      existingInfluencer: duplicateCheck.existingInfluencer,
    });
  }

  // Determine source type if userId is provided
  let sourceType: 'PLATFORM' | 'FACTORY' | 'STAFF' = 'STAFF';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user) {
      sourceType = determineSourceType(user.role);
    }
  }

  const influencer = await prisma.influencer.create({
    data: {
      brandId,
      nickname: nickname.trim(),
      platform,
      platformId: platformId.trim(),
      uid: uid?.trim() || null,
      homeUrl: homeUrl?.trim() || null,
      phone: phone?.trim() || null,
      wechat: wechat?.trim() || null,
      followers: followers?.trim() || null,
      categories: categories || [],
      tags: tags || [],
      notes: notes?.trim() || null,
      createdBy: userId || null,
      sourceType,
    },
  });

  return influencer as Influencer;
}

/**
 * Get influencer by ID
 */
export async function getById(id: string, brandId: string): Promise<Influencer> {
  const influencer = await prisma.influencer.findFirst({
    where: { id, brandId },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在');
  }

  return influencer as Influencer;
}

/**
 * Update influencer
 */
export async function update(
  id: string,
  brandId: string,
  data: UpdateInfluencerInput
): Promise<Influencer> {
  // Check if influencer exists
  const existing = await prisma.influencer.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('达人不存在');
  }

  // Check for duplicates if phone or platformId is being updated
  if (data.phone || (data.platform && data.platformId)) {
    const duplicateCheck = await checkDuplicate(
      brandId,
      data.phone,
      data.platform || (existing.platform as Platform),
      data.platformId || existing.platformId,
      id
    );

    if (duplicateCheck.isDuplicate) {
      const typeMsg =
        duplicateCheck.duplicateType === 'phone'
          ? '手机号'
          : duplicateCheck.duplicateType === 'platformId'
            ? '平台账号ID'
            : '手机号和平台账号ID';
      throw createConflictError(`达人${typeMsg}已存在`, {
        duplicateType: duplicateCheck.duplicateType,
        existingInfluencer: duplicateCheck.existingInfluencer,
      });
    }
  }

  const updateData: any = {};
  if (data.nickname !== undefined) updateData.nickname = data.nickname.trim();
  if (data.platform !== undefined) updateData.platform = data.platform;
  if (data.platformId !== undefined) updateData.platformId = data.platformId.trim();
  if (data.uid !== undefined) updateData.uid = data.uid?.trim() || null;
  if (data.homeUrl !== undefined) updateData.homeUrl = data.homeUrl?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.wechat !== undefined) updateData.wechat = data.wechat?.trim() || null;
  if (data.followers !== undefined) updateData.followers = data.followers?.trim() || null;
  if (data.categories !== undefined) updateData.categories = data.categories;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

  const influencer = await prisma.influencer.update({
    where: { id },
    data: updateData,
  });

  return influencer as Influencer;
}

/**
 * Delete influencer
 */
export async function remove(id: string, brandId: string): Promise<void> {
  const existing = await prisma.influencer.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('达人不存在');
  }

  // Check if influencer has collaborations
  const collaborationCount = await prisma.collaboration.count({
    where: { influencerId: id },
  });

  if (collaborationCount > 0) {
    throw createBadRequestError('该达人存在合作记录，无法删除');
  }

  await prisma.influencer.delete({ where: { id } });
}

/**
 * List influencers with filtering and pagination
 */
export async function list(
  brandId: string,
  filter: InfluencerFilter,
  pagination: Pagination,
  userId?: string,
  userRole?: string
): Promise<PaginatedResult<Influencer>> {
  const { keyword, platform, category, tags, pipelineStage, businessStaffId, groupId } = filter;
  const { page, pageSize } = pagination;

  // Build where clause
  const where: any = { brandId };

  // 权限过滤：基础商务只能看到自己创建的达人
  if (userId && userRole === 'BUSINESS') {
    // 从数据库获取用户权限
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    const permissions = user?.permissions as any;

    // 如果没有查看其他商务达人的权限，只显示自己创建的
    if (!permissions?.dataVisibility?.viewOthersInfluencers) {
      where.createdBy = userId;
    }
  }

  // Group filter
  if (groupId !== undefined) {
    where.groupId = groupId;
  }

  // Keyword search (nickname)
  if (keyword) {
    where.nickname = { contains: keyword, mode: 'insensitive' };
  }

  // Platform filter
  if (platform) {
    where.platform = platform;
  }

  // Category filter
  if (category) {
    where.categories = { has: category };
  }

  // Tags filter (match any)
  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  // Pipeline stage filter - requires joining with collaborations
  if (pipelineStage || businessStaffId) {
    where.collaborations = {
      some: {
        ...(pipelineStage && { stage: pipelineStage }),
        ...(businessStaffId && { businessStaffId }),
      },
    };
  }

  // Get total count
  const total = await prisma.influencer.count({ where });

  // Get paginated data
  const data = await prisma.influencer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data: data as Influencer[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Add tags to influencer
 */
export async function addTags(
  id: string,
  brandId: string,
  newTags: string[]
): Promise<Influencer> {
  const existing = await prisma.influencer.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('达人不存在');
  }

  // Merge tags and remove duplicates
  const mergedTags = [...new Set([...existing.tags, ...newTags.map((t) => t.trim())])];

  const influencer = await prisma.influencer.update({
    where: { id },
    data: { tags: mergedTags },
  });

  return influencer as Influencer;
}

/**
 * Remove tags from influencer
 */
export async function removeTags(
  id: string,
  brandId: string,
  tagsToRemove: string[]
): Promise<Influencer> {
  const existing = await prisma.influencer.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('达人不存在');
  }

  const updatedTags = existing.tags.filter((t) => !tagsToRemove.includes(t));

  const influencer = await prisma.influencer.update({
    where: { id },
    data: { tags: updatedTags },
  });

  return influencer as Influencer;
}

/**
 * Get all unique tags used in a factory
 */
export async function getAllTags(brandId: string): Promise<string[]> {
  const influencers = await prisma.influencer.findMany({
    where: { brandId },
    select: { tags: true },
  });

  const allTags = new Set<string>();
  influencers.forEach((inf) => {
    inf.tags.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Get all unique categories used in a factory
 */
export async function getAllCategories(brandId: string): Promise<string[]> {
  const influencers = await prisma.influencer.findMany({
    where: { brandId },
    select: { categories: true },
  });

  const allCategories = new Set<string>();
  influencers.forEach((inf) => {
    inf.categories.forEach((cat) => allCategories.add(cat));
  });

  return Array.from(allCategories).sort();
}

/**
 * Get smart influencer recommendations
 */
export async function getSmartRecommendations(
  brandId: string,
  _userId: string
): Promise<any[]> {
  const recommendations: any[] = [];

  // 1. Get influencers with successful past collaborations (high ROI)
  const highROIInfluencers = await prisma.influencer.findMany({
    where: {
      brandId,
      collaborations: {
        some: {
          stage: 'REVIEWED',
          result: {
            salesGmv: { gt: 0 },
          },
        },
      },
    },
    include: {
      collaborations: {
        where: {
          stage: 'REVIEWED',
        },
        include: {
          result: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    take: 5,
  });

  for (const influencer of highROIInfluencers) {
    const lastCollab = influencer.collaborations[0];
    if (lastCollab && lastCollab.result) {
      const result = lastCollab.result;
      const roi = result.salesGmv && result.cost ? (result.salesGmv / result.cost - 1) * 100 : 0;

      if (roi > 0) {
        recommendations.push({
          ...influencer,
          reason: 'roi',
          score: roi,
          details: `上次合作ROI ${roi.toFixed(0)}%，表现优秀`,
        });
      }
    }
  }

  // 2. Get influencers with multiple successful collaborations (history)
  const historicalInfluencers = await prisma.influencer.findMany({
    where: {
      brandId,
      collaborations: {
        some: {
          stage: {
            in: ['PUBLISHED', 'REVIEWED'],
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          collaborations: {
            where: {
              stage: {
                in: ['PUBLISHED', 'REVIEWED'],
              },
            },
          },
        },
      },
      collaborations: {
        where: {
          stage: {
            in: ['PUBLISHED', 'REVIEWED'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      collaborations: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  for (const influencer of historicalInfluencers) {
    const collabCount = influencer._count.collaborations;
    if (collabCount >= 2 && !recommendations.find(r => r.id === influencer.id)) {
      recommendations.push({
        ...influencer,
        reason: 'history',
        score: collabCount,
        details: `已成功合作 ${collabCount} 次，值得信赖`,
      });
    }
  }

  // 3. Get recently contacted influencers (within last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentInfluencers = await prisma.influencer.findMany({
    where: {
      brandId,
      collaborations: {
        some: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
    include: {
      collaborations: {
        where: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
    take: 5,
  });

  for (const influencer of recentInfluencers) {
    if (!recommendations.find(r => r.id === influencer.id)) {
      const lastCollab = influencer.collaborations[0];
      if (lastCollab) {
        const daysAgo = Math.floor(
          (Date.now() - new Date(lastCollab.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        recommendations.push({
          ...influencer,
          reason: 'recent',
          score: 30 - daysAgo,
          details: `${daysAgo} 天前有过联系，可继续跟进`,
        });
      }
    }
  }

  // Sort by score and return top 10
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ _count, collaborations, ...rest }) => rest);
}

/**
 * Get influencers by IDs
 */
export async function getInfluencersByIds(
  influencerIds: string[],
  brandId: string
): Promise<any[]> {
  return await prisma.influencer.findMany({
    where: {
      id: { in: influencerIds },
      brandId,
    },
  });
}

/**
 * Batch add tags to influencers
 */
export async function batchAddTags(influencerIds: string[], tags: string[]): Promise<void> {
  // Get current tags for each influencer
  const influencers = await prisma.influencer.findMany({
    where: { id: { in: influencerIds } },
    select: { id: true, tags: true },
  });

  // Update each influencer with merged tags
  await Promise.all(
    influencers.map((influencer) => {
      const mergedTags = Array.from(new Set([...influencer.tags, ...tags]));
      return prisma.influencer.update({
        where: { id: influencer.id },
        data: { tags: mergedTags },
      });
    })
  );
}

/**
 * Get influencer collaboration history
 */
export async function getCollaborationHistory(
  influencerId: string,
  brandId: string
): Promise<any[]> {
  // Verify influencer belongs to factory
  const influencer = await prisma.influencer.findFirst({
    where: { id: influencerId, brandId },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在');
  }

  // Get all collaborations for this influencer
  const collaborations: any[] = await prisma.collaboration.findMany({
    where: { influencerId },
    include: {
      dispatches: {
        include: {
          sample: {
            select: {
              name: true,
            },
          },
        },
      },
      businessStaff: {
        select: {
          name: true,
        },
      },
      result: {
        select: {
          salesGmv: true,
          totalCollaborationCost: true,
          roi: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Format the response
  return collaborations.map((collab) => {
    // Get total cost from result
    const totalCost = collab.result?.totalCollaborationCost || 0;

    return {
      id: collab.id,
      stage: collab.stage,
      sampleName: collab.dispatches.length > 0
        ? collab.dispatches[0].sample.name
        : '未知样品',
      businessStaffName: collab.businessStaff?.name || '未知商务',
      createdAt: collab.createdAt.toISOString(),
      updatedAt: collab.updatedAt.toISOString(),
      result: collab.result
        ? {
          salesGmv: collab.result.salesGmv || 0,
          cost: totalCost,
          roi: collab.result.salesGmv && totalCost > 0
            ? ((collab.result.salesGmv / totalCost - 1) * 100)
            : 0,
        }
        : undefined,
    };
  });
}

/**
 * Get influencer ROI statistics
 */
export async function getROIStats(
  influencerId: string,
  brandId: string
): Promise<any> {
  // Verify influencer belongs to factory
  const influencer = await prisma.influencer.findFirst({
    where: { id: influencerId, brandId },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在');
  }

  // Get all completed collaborations with results
  const collaborations: any[] = await prisma.collaboration.findMany({
    where: {
      influencerId,
      stage: 'REVIEWED',
      result: {
        isNot: null,
      },
    },
    include: {
      result: {
        select: {
          salesGmv: true,
          totalCollaborationCost: true,
          roi: true,
        },
      },
      dispatches: {
        include: {
          sample: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (collaborations.length === 0) {
    return {
      avgROI: 0,
      totalGMV: 0,
      totalCost: 0,
      collaborationCount: 0,
      successRate: 0,
      bestSample: null,
    };
  }

  // Calculate statistics
  let totalGMV = 0;
  let totalCost = 0;
  let successCount = 0;
  let bestSample: any = null;
  let bestROI = -Infinity;

  collaborations.forEach((collab) => {
    if (collab.result) {
      const gmv = collab.result.salesGmv || 0;
      const cost = collab.result.totalCollaborationCost || 0;

      totalGMV += gmv;
      totalCost += cost;

      // Count as success if ROI > 0
      if (cost > 0) {
        const roi = (gmv / cost - 1) * 100;
        if (roi > 0) {
          successCount++;
        }

        // Track best sample - get the first sample from dispatches
        if (roi > bestROI && collab.dispatches.length > 0) {
          bestROI = roi;
          const firstDispatch = collab.dispatches[0];
          bestSample = {
            id: firstDispatch.sample.id,
            name: firstDispatch.sample.name,
            roi,
            gmv,
          };
        }
      }
    }
  });

  const avgROI = totalCost > 0 ? ((totalGMV / totalCost - 1) * 100) : 0;
  const successRate = (successCount / collaborations.length) * 100;

  return {
    avgROI,
    totalGMV,
    totalCost,
    collaborationCount: collaborations.length,
    successRate,
    bestSample,
  };
}

