import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import {
  createNotFoundError,
  createBadRequestError,
  createForbiddenError,
} from '../middleware/errorHandler';
import { validateQuota } from './platform.service';
import type { Pagination, PaginatedResult } from '@ics/shared';
import {
  type StaffPermissions,
  type PermissionTemplate,
  PERMISSION_TEMPLATES,
  identifyTemplate,
} from '../types/permissions';

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

// ============ Permission Management ============

/**
 * 获取商务权限
 */
export async function getStaffPermissions(
  staffId: string,
  brandId: string
): Promise<{ permissions: StaffPermissions; template: string }> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      brandId,
      role: 'BUSINESS',
    },
    select: {
      permissions: true,
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  const permissions = (user.permissions as StaffPermissions) || PERMISSION_TEMPLATES.basic.permissions;
  const template = identifyTemplate(permissions);

  return {
    permissions,
    template,
  };
}

/**
 * 更新商务权限
 */
export async function updateStaffPermissions(
  staffId: string,
  brandId: string,
  permissions: StaffPermissions
): Promise<{ user: StaffMember; permissions: StaffPermissions; template: string }> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      brandId,
      role: 'BUSINESS',
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 更新权限
  const updatedUser = await prisma.user.update({
    where: { id: staffId },
    data: {
      permissions,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      permissions: true,
    },
  });

  const template = identifyTemplate(permissions);

  return {
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: 'ACTIVE',
      createdAt: updatedUser.createdAt,
    },
    permissions,
    template,
  };
}

/**
 * 获取权限模板列表
 */
export function getPermissionTemplates(): PermissionTemplate[] {
  return Object.values(PERMISSION_TEMPLATES);
}

// ============ Staff Management ============

/**
 * 获取工厂商务账号列表
 */
export async function listStaff(
  brandId: string,
  pagination: Pagination
): Promise<PaginatedResult<StaffMember>> {
  const { page, pageSize } = pagination;

  // 验证工厂存在
  const factory = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        brandId,
        role: 'BUSINESS',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({
      where: {
        brandId,
        role: 'BUSINESS',
      },
    }),
  ]);

  // 将数据转换为 StaffMember 格式
  const staffMembers: StaffMember[] = staff.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
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
export async function getStaffDetail(staffId: string, brandId: string): Promise<StaffDetail> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      brandId,
      role: 'BUSINESS',
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 获取工作统计
  const [influencerCount, collaborationCount, dispatchCount, closedDeals, gmvResult] =
    await Promise.all([
      // 管理的达人数量（注：当前 Influencer 模型没有 createdBy 字段，使用 brandId 统计）
      prisma.influencer.count({
        where: {
          brandId,
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
    status: user.status,
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
  brandId: string,
  data: CreateStaffInput
): Promise<StaffMember> {
  const { name, email, password } = data;

  // 验证工厂存在
  const factory = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!factory) {
    throw createNotFoundError('工厂不存在');
  }

  // 检查配额
  await validateQuota(brandId, 'staff');

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
      role: 'BUSINESS',
      brandId,
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
 */
export async function updateStaffStatus(
  staffId: string,
  brandId: string,
  status: 'ACTIVE' | 'DISABLED'
): Promise<StaffMember> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      brandId,
      role: 'BUSINESS',
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 更新状态
  const updatedUser = await prisma.user.update({
    where: { id: staffId },
    data: { 
      status,
      disabledAt: status === 'DISABLED' ? new Date() : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
  };
}

/**
 * 删除商务账号（保留业务数据）
 */
export async function deleteStaff(staffId: string, brandId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      id: staffId,
      brandId,
      role: 'BUSINESS',
    },
  });

  if (!user) {
    throw createNotFoundError('商务账号不存在');
  }

  // 检查是否是工厂老板（不能删除工厂老板）
  if (user.role === 'BRAND') {
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
export async function getQuotaUsage(brandId: string): Promise<QuotaUsage> {
  const factory = await prisma.brand.findUnique({
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
