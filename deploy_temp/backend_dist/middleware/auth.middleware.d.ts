import { Request, Response, NextFunction } from 'express';
import type { TokenPayload, UserRole } from '@ics/shared';
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
export declare function authenticate(req: Request, _res: Response, next: NextFunction): void;
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
export declare function requireRoles(...allowedRoles: UserRole[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware factory to check if user has required role(s) OR is an independent business
 * This allows independent business users to access owner-only features within their own workspace
 * @param allowedRoles - Array of roles that can access the route
 */
export declare function requireRolesOrIndependent(...allowedRoles: UserRole[]): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user belongs to the specified factory
 * Used for factory-scoped resources
 */
export declare function requireFactoryAccess(req: Request, _res: Response, next: NextFunction): void;
/**
 * Middleware to ensure user is a Platform Admin
 */
export declare const requirePlatformAdmin: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to ensure user is a Brand (formerly Factory Owner)
 */
export declare const requireBrandOwner: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to ensure user is Business (formerly Business Staff)
 */
export declare const requireBusinessStaff: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to ensure user is Brand or Business
 */
export declare const requireFactoryMember: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Check if a user role has permission to access a specific feature
 */
export declare function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean;
/**
 * Role hierarchy for permission checking
 * Higher roles inherit permissions from lower roles
 */
export declare const ROLE_HIERARCHY: Record<UserRole, number>;
/**
 * Check if user role is at least the minimum required level
 */
export declare function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean;
/**
 * Middleware to enrich user data with brandId if missing from token
 * This provides backward compatibility for old tokens
 */
export declare function enrichUserData(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map