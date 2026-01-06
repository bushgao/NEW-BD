import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import {
  createNotFoundError,
  createBadRequestError,
  createForbiddenError,
} from '../middleware/errorHandler';
import { validateQuota } from './platform.service';
import type { Pagination, PaginatedResult } from '@ics/shared';

// ============ Types ============

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: Date;
}

export interface StaffDetail extends StaffMember {
  stats: {
    influencerCount: number;
    collaborationCount: number;
    dispatchCount: number;
    closedDeals: number;
    totalGmv: number;
  };
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
}

export interface QuotaUsage {
  staff: {
    current: number;
    limit: number;
    available: number;
    isReached: boolean;
  };
  influencer: {
    current: number;
    limit: number;
    available: number;
    isReached: boolean;
  };
}

// ============ Staff Management ============

/**
 * 获取工厂商务账号列表
 */
export async function listStaff(
  factoryId: string,
  pagination: Pagination
): Promise<PaginatedResult<StaffMember>> {
  const { page, pageSize } = pagination;

  // 验证工厂存在
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        factoryId,
        role: 'BUSINESS_STAFF',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({
      where: {
        factoryId,
        role: 'BUSINESS_STAFF',
      },
    }),
  ]);

  // 将数据转换为 StaffMember 格式（添加 status 字段）
  const staffMembers: StaffMember[] = staff.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    status: 'ACTIVE', // 当前数据库没有 status 字段，默认为 ACTIVE
    createdAt: user.createdAt,
  }));

  return {
    data: staffMembers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取商务账号详情（含工作统计）
 */
export async function getStaffDetail(staffId: string, factoryId: string): Promise<StaffDetail> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 获取工作统计
  const [influencerCount, collaborationCount, dispatchCount, closedDeals, gmvResult] =
    await Promise.all([
      // 管理的达人数量（注：当前 Influencer 模型没有 createdBy 字段，使用 factoryId 统计）
      prisma.influencer.count({
        where: {
          factoryId,
        },
      }),
      // 创建的合作数量
      prisma.collaboration.count({
        where: {
          businessStaffId: staffId,
        },
      }),
      // 寄样次数
      prisma.sampleDispatch.count({
        where: {
          businessStaffId: staffId,
        },
      }),
      // 成交数量（已发布或已复盘）
      prisma.collaboration.count({
        where: {
          businessStaffId: staffId,
          stage: {
            in: ['PUBLISHED', 'REVIEWED'],
          },
        },
      }),
      // 总GMV
      prisma.collaborationResult.aggregate({
        where: {
          collaboration: {
            businessStaffId: staffId,
          },
        },
        _sum: {
          salesGmv: true,
        },
      }),
    ]);

  const staffDetail: StaffDetail = {
    id: user.id,
    name: user.name,
    email: user.email,
    status: 'ACTIVE',
    createdAt: user.createdAt,
    stats: {
      influencerCount,
      collaborationCount,
      dispatchCount,
      closedDeals,
      totalGmv: gmvResult._sum.salesGmv || 0,
    },
  };

  return staffDetail;
}

/**
 * 创建商务账号（检查配额）
 */
export async function createStaff(
  factoryId: string,
  data: CreateStaffInput
): Promise<StaffMember> {
  const { name, email, password } = data;

  // 验证工厂存在
  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  // 检查配额
  await validateQuota(factoryId, 'staff');

  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createBadRequestError('该邮箱已被注册');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 12);

  // 创建商务账号
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'BUSINESS_STAFF',
      factoryId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: 'ACTIVE',
    createdAt: user.createdAt,
  };
}

/**
 * 更新商务账号状态（启用/禁用）
 * 注：当前数据库 schema 没有 status 字段，此功能暂时无法实现
 * 需要在 Prisma schema 中添加 status 字段后才能使用
 */
export async function updateStaffStatus(
  staffId: string,
  factoryId: string,
  status: 'ACTIVE' | 'DISABLED'
): Promise<StaffMember> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      factoryId,
      role: 'BUSINESS_STAFF',
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // TODO: 当 Prisma schema 添加 status 字段后，取消注释以下代码
  // const updatedUser = await prisma.user.update({
  //   where: { id: staffId },
  //   data: { status },
  //   select: {
  //     id: true,
  //     name: true,
  //     email: true,
  //     factoryJoinedAt: true,
  //     createdAt: true,
  //   },
  // });

  // 临时返回（模拟更新）
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status, // 使用传入的 status
    createdAt: user.createdAt,
  };
}

/**
 * 删除商务账号（保留业务数据）
 */
export async function deleteStaff(staffId: string, factoryId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      factoryId,
      role: 'BUSINESS_STAFF',
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 检查是否是工厂老板（不能删除工厂老板）
  if (user.role === 'FACTORY_OWNER') {
    throw createForbiddenError('不能删除工厂老板账号');
  }

  // 删除用户记录
  // 注意：由于外键关系，业务数据（达人、合作、寄样记录）会保留
  // businessStaffId 字段会保留，但用户无法登录
  await prisma.user.delete({
    where: { id: staffId },
  });
}

/**
 * 获取配额使用情况
 */
export async function getQuotaUsage(factoryId: string): Promise<QuotaUsage> {
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

  const staffCurrent = factory._count.staff;
  const staffLimit = factory.staffLimit;
  const influencerCurrent = factory._count.influencers;
  const influencerLimit = factory.influencerLimit;

  return {
    staff: {
      current: staffCurrent,
      limit: staffLimit,
      available: Math.max(0, staffLimit - staffCurrent),
      isReached: staffCurrent >= staffLimit,
    },
    influencer: {
      current: influencerCurrent,
      limit: influencerLimit,
      available: Math.max(0, influencerLimit - influencerCurrent),
      isReached: influencerCurrent >= influencerLimit,
    },
  };
}
