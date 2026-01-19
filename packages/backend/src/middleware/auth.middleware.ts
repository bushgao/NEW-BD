import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { createUnauthorizedError, createForbiddenError } from './errorHandler';
import type { TokenPayload, UserRole } from '@ics/shared';
import prisma from '../lib/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    console.log('[Auth Middleware] Request:', req.method, req.path);
    console.log('[Auth Middleware] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');

    if (!authHeader) {
      console.log('[Auth Middleware] ❌ No authorization header');
      throw createUnauthorizedError('未提供访问令牌');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[Auth Middleware] ❌ Invalid format:', parts);
      throw createUnauthorizedError('访问令牌格式错误');
    }

    const token = parts[1];
    console.log('[Auth Middleware] Token preview:', token.substring(0, 20) + '...');

    const payload = verifyToken(token);
    console.log('[Auth Middleware] ✅ Token verified, user:', payload.userId);

    req.user = payload;
    next();
  } catch (error) {
    console.log('[Auth Middleware] ❌ Authentication failed:', (error as Error).message);
    next(error);
  }
}

/**
 * Role-based access control configuration
 * Maps routes to allowed roles
 */
export interface RolePermission {
  roles: UserRole[];
  message?: string;
}

/**
 * Middleware factory to check if user has required role(s)
 * @param allowedRoles - Array of roles that can access the route
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createUnauthorizedError('未授权访问');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        throw createForbiddenError('您没有权限执行此操作');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to check if user has required role(s) OR is an independent business
 * This allows independent business users to access owner-only features within their own workspace
 * @param allowedRoles - Array of roles that can access the route
 */
export function requireRolesOrIndependent(...allowedRoles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createUnauthorizedError('未授权访问');
      }

      const userRole = req.user.role;

      // 检查角色是否在允许列表中
      if (allowedRoles.includes(userRole)) {
        return next();
      }

      // 如果是 BUSINESS 角色，检查是否为独立商务
      if (userRole === 'BUSINESS') {
        const userRecord = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { isIndependent: true },
        });

        if (userRecord?.isIndependent) {
          return next(); // 独立商务享有完整权限
        }
      }

      throw createForbiddenError('您没有权限执行此操作');
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user belongs to the specified factory
 * Used for factory-scoped resources
 */
export function requireFactoryAccess(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw createUnauthorizedError('未授权访问');
    }

    // Platform admins can access all factories
    if (req.user.role === 'PLATFORM_ADMIN') {
      return next();
    }

    // Get brandId from request params or body
    const brandId = req.params.brandId || req.body.brandId;

    if (brandId && req.user.brandId !== brandId) {
      throw createForbiddenError('您没有权限访问此工厂的数据');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to ensure user is a Platform Admin
 */
export const requirePlatformAdmin = requireRoles('PLATFORM_ADMIN');

/**
 * Middleware to ensure user is a Brand (formerly Factory Owner)
 */
export const requireBrandOwner = requireRoles('BRAND');

/**
 * Middleware to ensure user is Business (formerly Business Staff)
 */
export const requireBusinessStaff = requireRoles('BUSINESS');

/**
 * Middleware to ensure user is Brand or Business
 */
export const requireFactoryMember = requireRoles('BRAND', 'BUSINESS');

/**
 * Check if a user role has permission to access a specific feature
 */
export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Role hierarchy for permission checking
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  PLATFORM_ADMIN: 3,
  BRAND: 2,
  BUSINESS: 1,
  INFLUENCER: 0,
};

/**
 * Check if user role is at least the minimum required level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Middleware to enrich user data with brandId if missing from token
 * This provides backward compatibility for old tokens
 */
export async function enrichUserData(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    // If token already has brandId, skip
    if (req.user.brandId) {
      console.log('[Enrich User Data] ✅ Token already has brandId:', req.user.brandId);
      return next();
    }

    // Platform admins don't need brandId
    if (req.user.role === 'PLATFORM_ADMIN') {
      console.log('[Enrich User Data] ✅ Platform admin, no brandId needed');
      return next();
    }

    // Query database for brandId
    console.log('[Enrich User Data] ⚠️ Token missing brandId, querying database...');
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        brandId: true,
        ownedBrand: {
          select: { id: true }
        }
      }
    });

    // 优先使用 brandId（商务用户），其次使用 ownedBrand.id（品牌主账号）
    const brandId = user?.brandId || user?.ownedBrand?.id;

    if (brandId) {
      req.user.brandId = brandId;
      console.log('[Enrich User Data] ✅ Added brandId from database:', brandId);
    } else {
      console.log('[Enrich User Data] ⚠️ User has no brandId in database');
    }

    next();
  } catch (error) {
    console.error('[Enrich User Data] ❌ Error:', error);
    next(error);
  }
}
