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
  factoryId?: string;
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
  factoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate JWT tokens for a user
 */
function generateTokens(user: UserWithoutPassword): AuthToken {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    factoryId: user.factoryId || undefined,
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
  const { email, password, name, role, factoryId, factoryName } = data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw createConflictError('该邮箱已被注册', { field: 'email' });
  }

  // Validate role-specific requirements
  if (role === 'BUSINESS_STAFF' && !factoryId) {
    throw createBadRequestError('商务人员必须关联工厂');
  }

  if (role === 'FACTORY_OWNER' && !factoryName) {
    throw createBadRequestError('工厂老板必须提供工厂名称');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user (and factory if FACTORY_OWNER)
  let user;
  
  if (role === 'FACTORY_OWNER') {
    // Create user and factory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      await tx.factory.create({
        data: {
          name: factoryName!,
          ownerId: newUser.id,
          status: 'PENDING',
          planType: 'FREE',
        },
      });

      // Fetch user with factory relation
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { ownedFactory: true },
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
        factoryId: role === 'BUSINESS_STAFF' ? factoryId : undefined,
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
    factoryId: user.factoryId,
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
    include: { ownedFactory: true, factory: true },
  });

  if (!user) {
    throw createUnauthorizedError('邮箱或密码错误');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createUnauthorizedError('邮箱或密码错误');
  }

  // Determine factoryId based on role
  let factoryId = user.factoryId;
  if (user.role === 'FACTORY_OWNER' && user.ownedFactory) {
    factoryId = user.ownedFactory.id;
  }

  const userWithoutPassword: UserWithoutPassword = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    factoryId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const tokens = generateTokens(userWithoutPassword);

  return { user: userWithoutPassword, tokens };
}

/**
 * Verify access token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
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
      include: { ownedFactory: true },
    });

    if (!user) {
      throw createUnauthorizedError('用户不存在');
    }

    // Determine factoryId based on role
    let factoryId = user.factoryId;
    if (user.role === 'FACTORY_OWNER' && user.ownedFactory) {
      factoryId = user.ownedFactory.id;
    }

    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      factoryId,
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
    include: { ownedFactory: true },
  });

  if (!user) {
    throw createUnauthorizedError('用户不存在');
  }

  // Determine factoryId based on role
  let factoryId = user.factoryId;
  if (user.role === 'FACTORY_OWNER' && user.ownedFactory) {
    factoryId = user.ownedFactory.id;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    factoryId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
