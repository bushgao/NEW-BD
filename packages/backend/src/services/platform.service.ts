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

// ============ Factory Staff Management ============

export interface FactoryStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  _count?: {
    influencers: number;
    collaborations: number;
  };
}

export interface StaffWorkStats {
  id: string;
  name: string;
  email: string;
  role: string;
  factoryId: string;
  factoryName: string;
  createdAt: Date;
  influencersAdded: number;
  collaborationsCreated: number;
  collaborationsCompleted: number;
  successRate: number;
}

/**
 * 获取工厂的商务列表
 */
export async function getFactoryStaff(factoryId: string): Promise<FactoryStaffMember[]> {
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  const staff = await prisma.user.findMany({
    where: {
      factoryId,
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
  })) as FactoryStaffMember[];
}

/**
 * 获取商务的工作统计
 */
export async function getStaffWorkStats(staffId: string): Promise<StaffWorkStats> {
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    include: {
      factory: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!staff) {
    throw createNotFoundError('商务人员不存在');
  }

  if (staff.role !== 'BUSINESS') {
    throw createBadRequestError('该用户不是商务人员');
  }

  // 统计添加的达人数
  const influencersAdded = await prisma.influencer.count({
    where: { createdBy: staffId },
  });

  // 统计创建的合作数
  const collaborationsCreated = await prisma.collaboration.count({
    where: { businessStaffId: staffId },
  });

  // 统计完成的合作数（有结果的）
  const collaborationsCompleted = await prisma.collaboration.count({
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
    factoryId: staff.factoryId!,
    factoryName: staff.factory!.name,
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
export async function getStaffInfluencers(
  staffId: string,
  pagination: Pagination
): Promise<PaginatedResult<any>> {
  const { page, pageSize } = pagination;

  const [influencers, total] = await Promise.all([
    prisma.influencer.findMany({
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
    prisma.influencer.count({ where: { createdBy: staffId } }),
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
export async function getStaffCollaborations(
  staffId: string,
  pagination: Pagination
): Promise<PaginatedResult<any>> {
  const { page, pageSize } = pagination;

  const [collaborations, total] = await Promise.all([
    prisma.collaboration.findMany({
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
    prisma.collaboration.count({ where: { businessStaffId: staffId } }),
  ]);

  return {
    data: collaborations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============ Influencer Management (Platform Admin) ============

import type {
  InfluencerSourceType,
  VerificationStatus,
  InfluencerWithDetails,
  InfluencerStats,
} from '@ics/shared';

export interface InfluencerFilter {
  keyword?: string;
  platform?: string;
  factoryId?: string;
  sourceType?: InfluencerSourceType;
  verificationStatus?: VerificationStatus;
  createdBy?: string;
}

/**
 * 获取所有达人列表（平台级别）
 */
export async function listAllInfluencers(
  filter: InfluencerFilter,
  pagination: Pagination
): Promise<PaginatedResult<InfluencerWithDetails>> {
  const { keyword, platform, factoryId, sourceType, verificationStatus, createdBy } = filter;
  const { page, pageSize } = pagination;

  const where: Record<string, unknown> = {};

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
  if (factoryId) {
    where.factoryId = factoryId;
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
    prisma.influencer.findMany({
      where,
      include: {
        factory: {
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
    prisma.influencer.count({ where }),
  ]);

  return {
    data: influencers as unknown as InfluencerWithDetails[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取达人详情（平台级别）
 */
export async function getInfluencerDetail(influencerId: string) {
  const influencer = await prisma.influencer.findUnique({
    where: { id: influencerId },
    include: {
      factory: {
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
    throw createNotFoundError('达人不存在');
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
export async function verifyInfluencer(
  influencerId: string,
  adminId: string,
  status: 'VERIFIED' | 'REJECTED',
  note?: string
) {
  const influencer = await prisma.influencer.findUnique({
    where: { id: influencerId },
    include: {
      factory: {
        include: {
          owner: true,
        },
      },
      creator: true,
    },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在');
  }

  // 如果是拒绝认证，备注必填
  if (status === 'REJECTED' && !note) {
    throw createBadRequestError('拒绝认证时必须填写原因');
  }

  // 获取管理员信息
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { name: true, role: true },
  });

  if (!admin || admin.role !== 'PLATFORM_ADMIN') {
    throw createBadRequestError('只有平台管理员可以进行认证操作');
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
  const existingHistory = influencer.verificationHistory as any;
  const entries = existingHistory?.entries || [];
  entries.push(historyEntry);

  // 更新达人认证状态
  const updated = await prisma.influencer.update({
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
  await prisma.notification.create({
    data: {
      userId: influencer.factory.ownerId,
      type: 'INFLUENCER_VERIFICATION',
      title: status === 'VERIFIED' ? '达人认证通过' : '达人认证失败',
      content: `达人 ${influencer.nickname} 的认证${status === 'VERIFIED' ? '已通过' : '未通过'}${note ? `，原因：${note}` : ''}`,
      relatedId: influencerId,
    },
  });

  // 如果有添加人，也发送通知
  if (influencer.createdBy && influencer.createdBy !== influencer.factory.ownerId) {
    await prisma.notification.create({
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

/**
 * 获取达人统计数据
 */
export async function getInfluencerStats(startDate?: Date, endDate?: Date): Promise<InfluencerStats> {
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  // 总数
  const total = await prisma.influencer.count({ where: dateFilter });

  // 按来源统计
  const bySource = await prisma.influencer.groupBy({
    by: ['sourceType'],
    where: dateFilter,
    _count: true,
  });

  // 按认证状态统计
  const byVerificationStatus = await prisma.influencer.groupBy({
    by: ['verificationStatus'],
    where: dateFilter,
    _count: true,
  });

  // 按平台统计
  const byPlatform = await prisma.influencer.groupBy({
    by: ['platform'],
    where: dateFilter,
    _count: true,
  });

  // 按工厂统计（前10）
  const byFactory = await prisma.influencer.groupBy({
    by: ['factoryId'],
    where: dateFilter,
    _count: true,
    orderBy: {
      _count: {
        factoryId: 'desc',
      },
    },
    take: 10,
  });

  // 获取工厂名称
  const factoryIds = byFactory.map((f) => f.factoryId);
  const factories = await prisma.factory.findMany({
    where: { id: { in: factoryIds } },
    select: { id: true, name: true },
  });

  const factoryMap = new Map(factories.map((f) => [f.id, f.name]));

  // 来源质量分析
  const sourceQuality = await Promise.all(
    ['PLATFORM', 'FACTORY', 'STAFF'].map(async (sourceType) => {
      const totalCount = await prisma.influencer.count({
        where: { ...dateFilter, sourceType: sourceType as InfluencerSourceType },
      });

      const verifiedCount = await prisma.influencer.count({
        where: {
          ...dateFilter,
          sourceType: sourceType as InfluencerSourceType,
          verificationStatus: 'VERIFIED',
        },
      });

      const collaborationsCount = await prisma.collaboration.count({
        where: {
          influencer: {
            sourceType: sourceType as InfluencerSourceType,
          },
        },
      });

      const successfulCollaborations = await prisma.collaboration.count({
        where: {
          influencer: {
            sourceType: sourceType as InfluencerSourceType,
          },
          result: {
            isNot: null,
          },
        },
      });

      return {
        sourceType: sourceType as InfluencerSourceType,
        total: totalCount,
        verified: verifiedCount,
        verificationRate: totalCount > 0 ? verifiedCount / totalCount : 0,
        collaborations: collaborationsCount,
        successRate: collaborationsCount > 0 ? successfulCollaborations / collaborationsCount : 0,
      };
    })
  );

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
      factoryId: f.factoryId,
      factoryName: factoryMap.get(f.factoryId) || '未知工厂',
      count: f._count,
    })),
    sourceQuality,
  };
}

// ============ User Management ============

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  factoryId?: string;
  factoryName?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserListFilter {
  search?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * 获取所有用户列表（平台管理员）
 */
export async function listAllUsers(
  filter: UserListFilter,
  pagination: Pagination
): Promise<PaginatedResult<UserListItem>> {
  const { search, role, isActive } = filter;
  const { page, pageSize } = pagination;

  const where: Record<string, unknown> = {};

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
    prisma.user.findMany({
      where,
      include: {
        factory: {
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
    prisma.user.count({ where }),
  ]);

  // 格式化返回数据
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    factoryId: user.factoryId || undefined,
    factoryName: user.factory?.name || undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || undefined,
  }));

  return {
    data: formattedUsers as UserListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取用户详情
 */
export async function getUserDetail(userId: string): Promise<UserListItem> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      factory: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw createNotFoundError('用户不存在');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    factoryId: user.factoryId || undefined,
    factoryName: user.factory?.name || undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || undefined,
  };
}

/**
 * 切换用户状态（启用/禁用）
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean,
  adminId: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createNotFoundError('用户不存在');
  }

  // 不能禁用平台管理员
  if (user.role === 'PLATFORM_ADMIN' && !isActive) {
    throw createBadRequestError('不能禁用平台管理员账号');
  }

  // 不能禁用自己
  if (userId === adminId) {
    throw createBadRequestError('不能禁用自己的账号');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive,
      disabledAt: isActive ? null : new Date(),
      disabledBy: isActive ? null : adminId,
    },
  });

  // 发送通知给用户
  if (user.role !== 'PLATFORM_ADMIN') {
    await prisma.notification.create({
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
