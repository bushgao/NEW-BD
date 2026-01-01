import prisma from '../lib/prisma';
import {
  createNotFoundError,
  createBadRequestError,
  createQuotaExceededError,
} from '../middleware/errorHandler';
import type { FactoryStatus, PlanType, Pagination, PaginatedResult } from '@ics/shared';

// ============ Types ============

export interface FactoryWithOwner {
  id: string;
  name: string;
  ownerId: string;
  status: FactoryStatus;
  planType: PlanType;
  staffLimit: number;
  influencerLimit: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    staff: number;
    influencers: number;
    collaborations: number;
  };
}

export interface PlanConfigData {
  id: string;
  planType: PlanType;
  name: string;
  staffLimit: number;
  influencerLimit: number;
  dataRetentionDays: number;
  price: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformStats {
  totalFactories: number;
  pendingFactories: number;
  approvedFactories: number;
  totalUsers: number;
  totalCollaborations: number;
  totalInfluencers: number;
  factoriesByPlan: Record<PlanType, number>;
}

export interface FactoryFilter {
  status?: FactoryStatus;
  planType?: PlanType;
  keyword?: string;
}

export interface UpdateFactoryInput {
  status?: FactoryStatus;
  planType?: PlanType;
  staffLimit?: number;
  influencerLimit?: number;
}

export interface CreatePlanConfigInput {
  planType: PlanType;
  name: string;
  staffLimit: number;
  influencerLimit: number;
  dataRetentionDays: number;
  price: number;
  features: string[];
}

export interface UpdatePlanConfigInput {
  name?: string;
  staffLimit?: number;
  influencerLimit?: number;
  dataRetentionDays?: number;
  price?: number;
  features?: string[];
}

// ============ Factory Management ============

/**
 * 获取工厂列表（支持筛选和分页）
 */
export async function listFactories(
  filter: FactoryFilter,
  pagination: Pagination
): Promise<PaginatedResult<FactoryWithOwner>> {
  const { status, planType, keyword } = filter;
  const { page, pageSize } = pagination;

  const where: Record<string, unknown> = {};

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
    prisma.factory.findMany({
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
    prisma.factory.count({ where }),
  ]);

  return {
    data: factories as FactoryWithOwner[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取工厂详情
 */
export async function getFactoryById(factoryId: string): Promise<FactoryWithOwner> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
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
    throw createNotFoundError('工厂不存在');
  }

  return factory as FactoryWithOwner;
}

/**
 * 审核工厂入驻申请
 */
export async function reviewFactory(
  factoryId: string,
  status: 'APPROVED' | 'REJECTED',
  _reason?: string
): Promise<FactoryWithOwner> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  if (factory.status !== 'PENDING') {
    throw createBadRequestError('只能审核待审核状态的工厂');
  }

  const updatedFactory = await prisma.factory.update({
    where: { id: factoryId },
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

  return updatedFactory as FactoryWithOwner;
}

/**
 * 更新工厂信息（套餐、配额等）
 */
export async function updateFactory(
  factoryId: string,
  data: UpdateFactoryInput
): Promise<FactoryWithOwner> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  const updatedFactory = await prisma.factory.update({
    where: { id: factoryId },
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

  return updatedFactory as FactoryWithOwner;
}

/**
 * 暂停/恢复工厂
 */
export async function toggleFactoryStatus(
  factoryId: string,
  suspend: boolean
): Promise<FactoryWithOwner> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  if (factory.status === 'PENDING') {
    throw createBadRequestError('待审核的工厂不能执行此操作');
  }

  const newStatus = suspend ? 'SUSPENDED' : 'APPROVED';

  const updatedFactory = await prisma.factory.update({
    where: { id: factoryId },
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

  return updatedFactory as FactoryWithOwner;
}

// ============ Plan Configuration ============

/**
 * 获取所有套餐配置
 */
export async function listPlanConfigs(): Promise<PlanConfigData[]> {
  const configs = await prisma.planConfig.findMany({
    orderBy: { price: 'asc' },
  });

  return configs as PlanConfigData[];
}

/**
 * 获取单个套餐配置
 */
export async function getPlanConfig(planType: PlanType): Promise<PlanConfigData> {
  const config = await prisma.planConfig.findUnique({
    where: { planType },
  });

  if (!config) {
    throw createNotFoundError('套餐配置不存在');
  }

  return config as PlanConfigData;
}

/**
 * 创建套餐配置
 */
export async function createPlanConfig(data: CreatePlanConfigInput): Promise<PlanConfigData> {
  const existing = await prisma.planConfig.findUnique({
    where: { planType: data.planType },
  });

  if (existing) {
    throw createBadRequestError('该套餐类型已存在');
  }

  const config = await prisma.planConfig.create({
    data,
  });

  return config as PlanConfigData;
}

/**
 * 更新套餐配置
 */
export async function updatePlanConfig(
  planType: PlanType,
  data: UpdatePlanConfigInput
): Promise<PlanConfigData> {
  const existing = await prisma.planConfig.findUnique({
    where: { planType },
  });

  if (!existing) {
    throw createNotFoundError('套餐配置不存在');
  }

  const config = await prisma.planConfig.update({
    where: { planType },
    data,
  });

  return config as PlanConfigData;
}

/**
 * 删除套餐配置
 */
export async function deletePlanConfig(planType: PlanType): Promise<void> {
  const existing = await prisma.planConfig.findUnique({
    where: { planType },
  });

  if (!existing) {
    throw createNotFoundError('套餐配置不存在');
  }

  // 检查是否有工厂正在使用此套餐
  const factoriesUsingPlan = await prisma.factory.count({
    where: { planType },
  });

  if (factoriesUsingPlan > 0) {
    throw createBadRequestError(`有 ${factoriesUsingPlan} 个工厂正在使用此套餐，无法删除`);
  }

  await prisma.planConfig.delete({
    where: { planType },
  });
}

// ============ Quota Check ============

/**
 * 检查工厂配额
 */
export async function checkFactoryQuota(
  factoryId: string,
  type: 'staff' | 'influencer'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
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
    throw createNotFoundError('工厂不存在');
  }

  if (type === 'staff') {
    return {
      allowed: factory._count.staff < factory.staffLimit,
      current: factory._count.staff,
      limit: factory.staffLimit,
    };
  } else {
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
export async function validateQuota(
  factoryId: string,
  type: 'staff' | 'influencer'
): Promise<void> {
  const quota = await checkFactoryQuota(factoryId, type);

  if (!quota.allowed) {
    const typeLabel = type === 'staff' ? '商务账号' : '达人';
    throw createQuotaExceededError(
      `已达到${typeLabel}数量上限（${quota.current}/${quota.limit}），请升级套餐`
    );
  }
}

// ============ Platform Statistics ============

/**
 * 获取平台统计数据
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalFactories,
    pendingFactories,
    approvedFactories,
    totalUsers,
    totalCollaborations,
    totalInfluencers,
    freeFactories,
    professionalFactories,
    enterpriseFactories,
  ] = await Promise.all([
    prisma.factory.count(),
    prisma.factory.count({ where: { status: 'PENDING' } }),
    prisma.factory.count({ where: { status: 'APPROVED' } }),
    prisma.user.count(),
    prisma.collaboration.count(),
    prisma.influencer.count(),
    prisma.factory.count({ where: { planType: 'FREE' } }),
    prisma.factory.count({ where: { planType: 'PROFESSIONAL' } }),
    prisma.factory.count({ where: { planType: 'ENTERPRISE' } }),
  ]);

  return {
    totalFactories,
    pendingFactories,
    approvedFactories,
    totalUsers,
    totalCollaborations,
    totalInfluencers,
    factoriesByPlan: {
      FREE: freeFactories,
      PROFESSIONAL: professionalFactories,
      ENTERPRISE: enterpriseFactories,
    },
  };
}

/**
 * 获取平台详细统计（按时间段）
 */
export async function getPlatformDetailedStats(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const [
    newFactories,
    newUsers,
    newCollaborations,
    newInfluencers,
  ] = await Promise.all([
    prisma.factory.count({ where: dateFilter }),
    prisma.user.count({ where: dateFilter }),
    prisma.collaboration.count({ where: dateFilter }),
    prisma.influencer.count({ where: dateFilter }),
  ]);

  // 获取各状态工厂数量
  const factoriesByStatus = await prisma.factory.groupBy({
    by: ['status'],
    _count: true,
  });

  // 获取各套餐工厂数量
  const factoriesByPlan = await prisma.factory.groupBy({
    by: ['planType'],
    _count: true,
  });

  // 获取各角色用户数量
  const usersByRole = await prisma.user.groupBy({
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
    }, {} as Record<string, number>),
    factoriesByPlan: factoriesByPlan.reduce((acc, item) => {
      acc[item.planType] = item._count;
      return acc;
    }, {} as Record<string, number>),
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
