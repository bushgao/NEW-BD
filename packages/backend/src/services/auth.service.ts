import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { createUnauthorizedError, createConflictError, createBadRequestError } from '../middleware/errorHandler';
import type { UserRole, AuthToken, TokenPayload } from '@ics/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  brandId?: string;
  factoryName?: string; // For FACTORY_OWNER creating a new factory
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  brandId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive?: boolean;
  brand?: {
    id: string;
    name: string;
    status: string;
    planType: string;
    staffLimit: number;
    influencerLimit: number;
    _count?: {
      staff: number;
      influencers: number;
    };
  };
}

/**
 * Generate JWT tokens for a user
 */
function generateTokens(user: UserWithoutPassword): AuthToken {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
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
  const { email, password, name, role, brandId, factoryName } = data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw createConflictError('该邮箱已被注册', { field: 'email' });
  }

  // Validate role-specific requirements
  if (role === 'BUSINESS' && !brandId) {
    throw createBadRequestError('商务人员必须关联工厂');
  }

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
          email,
          passwordHash,
          name,
          role,
        },
      });

      const newBrand = await tx.brand.create({
        data: {
          name: factoryName!,
          ownerId: newUser.id,
          status: 'PENDING',
          planType: 'FREE',
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
  } else {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        brandId: role === 'BUSINESS' ? brandId : undefined,
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
    console.log('[verifyToken] ❌ Verification failed:', error.message);
    console.log('[verifyToken] Error type:', error.constructor.name);

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
    brand: factoryInfo,
    preferences: user.preferences,
  };
}
