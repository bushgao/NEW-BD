import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { createUnauthorizedError, createForbiddenError } from './errorHandler';
import type { TokenPayload, UserRole } from '@ics/shared';

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

    if (!authHeader) {
      throw createUnauthorizedError('未提供访问令牌');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createUnauthorizedError('访问令牌格式错误');
    }

    const token = parts[1];
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
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

    // Get factoryId from request params or body
    const factoryId = req.params.factoryId || req.body.factoryId;

    if (factoryId && req.user.factoryId !== factoryId) {
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
 * Middleware to ensure user is a Factory Owner
 */
export const requireFactoryOwner = requireRoles('FACTORY_OWNER');

/**
 * Middleware to ensure user is Business Staff
 */
export const requireBusinessStaff = requireRoles('BUSINESS_STAFF');

/**
 * Middleware to ensure user is Factory Owner or Business Staff
 */
export const requireFactoryMember = requireRoles('FACTORY_OWNER', 'BUSINESS_STAFF');

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
  FACTORY_OWNER: 2,
  BUSINESS_STAFF: 1,
};

/**
 * Check if user role is at least the minimum required level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}
