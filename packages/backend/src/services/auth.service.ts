import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { createUnauthorizedError, createConflictError, createBadRequestError } from '../middleware/errorHandler';
import type { UserRole, AuthToken, TokenPayload } from '@ics/shared';
import { createWelcomeNotification, seedDefaultTemplates } from './notification-template.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface RegisterInput {
  email?: string;
  password: string;
  name: string;
  role: UserRole;
  brandId?: string;
  factoryName?: string; // For FACTORY_OWNER creating a new factory
  phone?: string;       // 手机号（邀请注册时使用）
  invitationCode?: string; // 邀请码（通过邀请链接注册时使用）
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginByPhoneInput {
  phone: string;
  password: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string | null;  // 邮箱可选
  name: string;
  role: UserRole;
  brandId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive?: boolean;
  isIndependent?: boolean; // 独立商务标识
  brand?: {
    id: string;
    name: string;
    status: string;
    planType: string;
    planExpiresAt?: Date | null;
    isPaid?: boolean;
    isLocked?: boolean;
    staffLimit: number;
    influencerLimit: number;
    _count?: {
      staff: number;
      influencers: number;
    };
  };
  permissions?: any; // 商务权限
}

/**
 * Generate JWT tokens for a user
 */
function generateTokens(user: UserWithoutPassword): AuthToken {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email || '',  // email可为null，传空字符串给TokenPayload
    role: user.role as UserRole,
    brandId: user.brandId || undefined,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseExpiresIn(JWT_EXPIRES_IN),
  });

  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: parseExpiresIn(JWT_REFRESH_EXPIRES_IN),
  });

  // Parse expiration time
  const expiresIn = parseExpiresIn(JWT_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Parse expiration string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 604800; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 604800;
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterInput): Promise<{ user: UserWithoutPassword; tokens: AuthToken }> {
  const { email, password, name, role, brandId, factoryName, phone, invitationCode } = data;

  // 如果有邀请码，验证并获取邀请信息
  let invitation = null;
  if (invitationCode) {
    invitation = await prisma.invitation.findUnique({
      where: { code: invitationCode },
      include: { brand: true },
    });

    if (!invitation) {
      throw createBadRequestError('邀请码无效');
    }
    if (invitation.status !== 'PENDING') {
      throw createBadRequestError(invitation.status === 'USED' ? '邀请已被使用' : '邀请已被撤销');
    }
    if (new Date() > invitation.expiresAt) {
      throw createBadRequestError('邀请已过期');
    }
  }

  // Check if email already exists (如果提供了邮箱)
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createConflictError('该邮箱已被注册', { field: 'email' });
    }
  }

  // Check if phone already exists (如果提供了手机号)
  if (phone) {
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      throw createConflictError('该手机号已被注册', { field: 'phone' });
    }
  }

  // 邀请注册必须提供手机号
  if (invitationCode && !phone) {
    throw createBadRequestError('通过邀请链接注册需要提供手机号');
  }

  // Validate role-specific requirements
  // BUSINESS 角色可以不关联品牌，此时会作为独立商务注册（isIndependent: true）
  // 注意：isIndependent 字段在 schema 中默认为 true，所以无需额外设置

  if (role === 'BRAND' && !factoryName) {
    throw createBadRequestError('品牌用户必须提供品牌名称');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user (and factory if BRAND)
  let user;

  if (role === 'BRAND') {
    // Create user and brand in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email || undefined, // 邮箱可选
          phone, // 保存手机号（用于登录）
          passwordHash,
          name,
          role,
        },
      });

      // 创建品牌（免费版30天试用）
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 30); // 30天后到期

      const newBrand = await tx.brand.create({
        data: {
          name: factoryName!,
          ownerId: newUser.id,
          status: 'PENDING',
          planType: 'FREE',
          staffLimit: 1,
          influencerLimit: 50,
          planExpiresAt: trialExpiresAt, // 免费试用30天
        },
      });

      // 关键：更新用户的 brandId 字段
      await tx.user.update({
        where: { id: newUser.id },
        data: { brandId: newBrand.id },
      });

      // Fetch user with brand relation
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { ownedBrand: true },
      });
    });

    user = result;
  } else if (role === 'BUSINESS' && !brandId && !invitationCode) {
    // 独立商务注册：自动创建个人品牌，让商务可以完整使用系统功能
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建用户
      const newUser = await tx.user.create({
        data: {
          email: email || undefined, // 邮箱可选
          phone, // 保存手机号（用于登录）
          passwordHash,
          name,
          role,
          isIndependent: true,
        },
      });

      // 2. 为独立商务创建个人品牌（免费版30天试用）
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 30); // 30天后到期

      const personalBrand = await tx.brand.create({
        data: {
          name: `个人工作区 - ${name}`,
          ownerId: newUser.id,
          status: 'APPROVED', // 个人品牌自动审核通过
          planType: 'FREE',
          staffLimit: 1,
          influencerLimit: 50,
          planExpiresAt: trialExpiresAt, // 免费试用30天
        },
      });

      // 3. 更新用户的 brandId
      await tx.user.update({
        where: { id: newUser.id },
        data: { brandId: personalBrand.id },
      });

      // 4. 返回完整用户信息
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { brand: true },
      });
    });

    user = result;
  } else if (invitationCode && invitation) {
    // 通过邀请码注册：商务加入邀请方的品牌
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建用户并关联到邀请方品牌
      const newUser = await tx.user.create({
        data: {
          email: email || undefined, // 邮箱可选，不再生成假邮箱
          phone,
          passwordHash,
          name,
          role: 'BUSINESS',
          brandId: invitation.brandId,
          isIndependent: false,
          joinedAt: new Date(),
        },
      });

      // 2. 更新邀请状态为已使用
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
          usedById: newUser.id,
        },
      });

      // 3. 返回完整用户信息
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { brand: true },
      });
    });

    user = result;
  } else {
    // BUSINESS 加入已有品牌，或其他角色
    user = await prisma.user.create({
      data: {
        email: email || undefined, // 邮箱可选，不再生成假邮箱
        phone,
        passwordHash,
        name,
        role,
        brandId: role === 'BUSINESS' ? brandId : undefined,
        isIndependent: false,
      },
    });
  }

  if (!user) {
    throw createBadRequestError('用户创建失败');
  }

  const userWithoutPassword: UserWithoutPassword = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    brandId: user.brandId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const tokens = generateTokens(userWithoutPassword);

  // 发送欢迎通知（异步执行，不阻塞注册流程）
  try {
    // 确保默认模板存在
    await seedDefaultTemplates();
    await createWelcomeNotification(user.id);
    console.log('[register] ✅ Welcome notification sent to user:', user.id);
  } catch (err) {
    console.error('[register] ⚠️ Failed to send welcome notification:', err);
    // 不抛出错误，注册流程不应该因为通知失败而中断
  }

  return { user: userWithoutPassword, tokens };
}

/**
 * Login user
 */
export async function login(data: LoginInput): Promise<{ user: UserWithoutPassword; tokens: AuthToken }> {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ownedBrand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
      brand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw createUnauthorizedError('邮箱或密码错误');
  }

  // 检查账号状态（禁用的账号无法登录）
  if (user.status === 'DISABLED') {
    throw createUnauthorizedError('账号已被禁用，请联系管理员');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createUnauthorizedError('邮箱或密码错误');
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Determine brandId and factory info based on role
  let brandId = user.brandId;
  let factoryInfo = undefined;

  // BRAND (formerly FACTORY_OWNER) - use ownedBrand
  if (user.role === 'BRAND' && user.ownedBrand) {
    brandId = user.ownedBrand.id;
    factoryInfo = {
      id: user.ownedBrand.id,
      name: user.ownedBrand.name,
      status: user.ownedBrand.status,
      planType: user.ownedBrand.planType,
      staffLimit: user.ownedBrand.staffLimit,
      influencerLimit: user.ownedBrand.influencerLimit,
      _count: user.ownedBrand._count,
    };
  }
  // BUSINESS (formerly BUSINESS_STAFF) - use factory relation
  else if (user.role === 'BUSINESS' && user.brand) {
    factoryInfo = {
      id: user.brand.id,
      name: user.brand.name,
      status: user.brand.status,
      planType: user.brand.planType,
      staffLimit: user.brand.staffLimit,
      influencerLimit: user.brand.influencerLimit,
      _count: user.brand._count,
    };
  }

  const userWithoutPassword: UserWithoutPassword = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    brandId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    brand: factoryInfo,
  };

  const tokens = generateTokens(userWithoutPassword);

  return { user: userWithoutPassword, tokens };
}

/**
 * Login user by phone number
 */
export async function loginByPhone(data: LoginByPhoneInput): Promise<{ user: UserWithoutPassword; tokens: AuthToken }> {
  const { phone, password } = data;

  // Find user by phone
  const user = await prisma.user.findFirst({
    where: { phone },
    include: {
      ownedBrand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
      brand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw createUnauthorizedError('手机号或密码错误');
  }

  // 检查账号状态（禁用的账号无法登录）
  if (user.status === 'DISABLED') {
    throw createUnauthorizedError('账号已被禁用，请联系管理员');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createUnauthorizedError('手机号或密码错误');
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Determine brandId and factory info based on role
  let brandId = user.brandId;
  let factoryInfo = undefined;

  // BRAND (formerly FACTORY_OWNER) - use ownedBrand
  if (user.role === 'BRAND' && user.ownedBrand) {
    brandId = user.ownedBrand.id;
    factoryInfo = {
      id: user.ownedBrand.id,
      name: user.ownedBrand.name,
      status: user.ownedBrand.status,
      planType: user.ownedBrand.planType,
      staffLimit: user.ownedBrand.staffLimit,
      influencerLimit: user.ownedBrand.influencerLimit,
      _count: user.ownedBrand._count,
    };
  }
  // BUSINESS (formerly BUSINESS_STAFF) - use factory relation
  else if (user.role === 'BUSINESS' && user.brand) {
    factoryInfo = {
      id: user.brand.id,
      name: user.brand.name,
      status: user.brand.status,
      planType: user.brand.planType,
      staffLimit: user.brand.staffLimit,
      influencerLimit: user.brand.influencerLimit,
      _count: user.brand._count,
    };
  }

  const userWithoutPassword: UserWithoutPassword = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    brandId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isIndependent: user.isIndependent,
    brand: factoryInfo,
    permissions: user.permissions, // 商务权限
  };

  const tokens = generateTokens(userWithoutPassword);

  return { user: userWithoutPassword, tokens };
}

/**
 * Verify access token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    console.log('[verifyToken] Verifying token...');
    console.log('[verifyToken] JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
    console.log('[verifyToken] Token preview:', token.substring(0, 30) + '...');

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log('[verifyToken] ✅ Token valid, payload:', payload);
    return payload;
  } catch (error) {
    const err = error as Error;
    console.log('[verifyToken] ❌ Verification failed:', err.message);
    console.log('[verifyToken] Error type:', err.constructor?.name);

    if (error instanceof jwt.TokenExpiredError) {
      throw createUnauthorizedError('登录已过期，请重新登录');
    }
    throw createUnauthorizedError('无效的访问令牌');
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshTokenStr: string): Promise<AuthToken> {
  try {
    const payload = jwt.verify(refreshTokenStr, JWT_REFRESH_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { ownedBrand: true },
    });

    if (!user) {
      throw createUnauthorizedError('用户不存在');
    }

    // Determine brandId based on role
    let brandId = user.brandId;
    // BRAND (formerly FACTORY_OWNER) - use ownedBrand
    if (user.role === 'BRAND' && user.ownedBrand) {
      brandId = user.ownedBrand.id;
    }

    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      brandId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return generateTokens(userWithoutPassword);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createUnauthorizedError('刷新令牌已过期，请重新登录');
    }
    throw createUnauthorizedError('无效的刷新令牌');
  }
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: string): Promise<UserWithoutPassword> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedBrand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
      brand: {
        include: {
          _count: {
            select: {
              staff: true,
              influencers: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw createUnauthorizedError('用户不存在');
  }

  // Determine brandId and factory info based on role
  let brandId = user.brandId;
  let factoryInfo = undefined;

  // BRAND (formerly FACTORY_OWNER) - use ownedBrand
  if (user.role === 'BRAND' && user.ownedBrand) {
    brandId = user.ownedBrand.id;
    const brand = user.ownedBrand as typeof user.ownedBrand & {
      planExpiresAt?: Date | null;
      isPaid?: boolean;
      isLocked?: boolean;
    };
    factoryInfo = {
      id: brand.id,
      name: brand.name,
      status: brand.status,
      planType: brand.planType,
      planExpiresAt: brand.planExpiresAt,
      isPaid: brand.isPaid,
      isLocked: brand.isLocked,
      staffLimit: brand.staffLimit,
      influencerLimit: brand.influencerLimit,
      _count: brand._count,
    };
  }
  // BUSINESS (formerly BUSINESS_STAFF) - use factory relation
  else if (user.role === 'BUSINESS' && user.brand) {
    const brand = user.brand as typeof user.brand & {
      planExpiresAt?: Date | null;
      isPaid?: boolean;
      isLocked?: boolean;
    };
    factoryInfo = {
      id: brand.id,
      name: brand.name,
      status: brand.status,
      planType: brand.planType,
      planExpiresAt: brand.planExpiresAt,
      isPaid: brand.isPaid,
      isLocked: brand.isLocked,
      staffLimit: brand.staffLimit,
      influencerLimit: brand.influencerLimit,
      _count: brand._count,
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    brandId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || undefined,
    isActive: user.isActive,
    isIndependent: user.isIndependent, // 独立商务标识
    brand: factoryInfo,
    permissions: user.permissions, // 商务权限
  };
}
