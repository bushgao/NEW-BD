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
  factoryId: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  phone?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
}

export interface UpdateInfluencerInput {
  nickname?: string;
  platform?: Platform;
  platformId?: string;
  phone?: string;
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
  factoryId: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  phone: string | null;
  categories: string[];
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if factory has reached influencer quota limit
 */
async function checkInfluencerQuota(factoryId: string): Promise<void> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
    select: { influencerLimit: true },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  const currentCount = await prisma.influencer.count({
    where: { factoryId },
  });

  if (currentCount >= factory.influencerLimit) {
    throw createQuotaExceededError('已达到达人数量上限，请升级套餐');
  }
}

/**
 * Check for duplicate influencer by phone or platform ID
 */
export async function checkDuplicate(
  factoryId: string,
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
      factoryId,
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
 * Create a new influencer
 */
export async function create(data: CreateInfluencerInput): Promise<Influencer> {
  const { factoryId, nickname, platform, platformId, phone, categories, tags, notes } = data;

  // Check quota
  await checkInfluencerQuota(factoryId);

  // Check for duplicates
  const duplicateCheck = await checkDuplicate(factoryId, phone, platform, platformId);
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

  const influencer = await prisma.influencer.create({
    data: {
      factoryId,
      nickname: nickname.trim(),
      platform,
      platformId: platformId.trim(),
      phone: phone?.trim() || null,
      categories: categories || [],
      tags: tags || [],
      notes: notes?.trim() || null,
    },
  });

  return influencer as Influencer;
}

/**
 * Get influencer by ID
 */
export async function getById(id: string, factoryId: string): Promise<Influencer> {
  const influencer = await prisma.influencer.findFirst({
    where: { id, factoryId },
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
  factoryId: string,
  data: UpdateInfluencerInput
): Promise<Influencer> {
  // Check if influencer exists
  const existing = await prisma.influencer.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('达人不存在');
  }

  // Check for duplicates if phone or platformId is being updated
  if (data.phone || (data.platform && data.platformId)) {
    const duplicateCheck = await checkDuplicate(
      factoryId,
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
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
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
export async function remove(id: string, factoryId: string): Promise<void> {
  const existing = await prisma.influencer.findFirst({
    where: { id, factoryId },
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
  factoryId: string,
  filter: InfluencerFilter,
  pagination: Pagination
): Promise<PaginatedResult<Influencer>> {
  const { keyword, platform, category, tags, pipelineStage, businessStaffId } = filter;
  const { page, pageSize } = pagination;

  // Build where clause
  const where: any = { factoryId };

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
  factoryId: string,
  newTags: string[]
): Promise<Influencer> {
  const existing = await prisma.influencer.findFirst({
    where: { id, factoryId },
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
  factoryId: string,
  tagsToRemove: string[]
): Promise<Influencer> {
  const existing = await prisma.influencer.findFirst({
    where: { id, factoryId },
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
export async function getAllTags(factoryId: string): Promise<string[]> {
  const influencers = await prisma.influencer.findMany({
    where: { factoryId },
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
export async function getAllCategories(factoryId: string): Promise<string[]> {
  const influencers = await prisma.influencer.findMany({
    where: { factoryId },
    select: { categories: true },
  });

  const allCategories = new Set<string>();
  influencers.forEach((inf) => {
    inf.categories.forEach((cat) => allCategories.add(cat));
  });

  return Array.from(allCategories).sort();
}
