"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.requireFactoryMember = exports.requireBusinessStaff = exports.requireBrandOwner = exports.requirePlatformAdmin = void 0;
exports.authenticate = authenticate;
exports.requireRoles = requireRoles;
exports.requireRolesOrIndependent = requireRolesOrIndependent;
exports.requireFactoryAccess = requireFactoryAccess;
exports.hasPermission = hasPermission;
exports.hasMinimumRole = hasMinimumRole;
exports.enrichUserData = enrichUserData;
const auth_service_1 = require("../services/auth.service");
const errorHandler_1 = require("./errorHandler");
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Middleware to verify JWT token and attach user to request
 */
function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        console.log('[Auth Middleware] Request:', req.method, req.path);
        console.log('[Auth Middleware] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');
        if (!authHeader) {
            console.log('[Auth Middleware] ❌ No authorization header');
            throw (0, errorHandler_1.createUnauthorizedError)('未提供访问令牌');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('[Auth Middleware] ❌ Invalid format:', parts);
            throw (0, errorHandler_1.createUnauthorizedError)('访问令牌格式错误');
        }
        const token = parts[1];
        console.log('[Auth Middleware] Token preview:', token.substring(0, 20) + '...');
        const payload = (0, auth_service_1.verifyToken)(token);
        console.log('[Auth Middleware] ✅ Token verified, user:', payload.userId);
        req.user = payload;
        next();
    }
    catch (error) {
        console.log('[Auth Middleware] ❌ Authentication failed:', error.message);
        next(error);
    }
}
/**
 * Middleware factory to check if user has required role(s)
 * @param allowedRoles - Array of roles that can access the route
 */
function requireRoles(...allowedRoles) {
    return (req, _res, next) => {
        try {
            if (!req.user) {
                throw (0, errorHandler_1.createUnauthorizedError)('未授权访问');
            }
            const userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                throw (0, errorHandler_1.createForbiddenError)('您没有权限执行此操作');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware factory to check if user has required role(s) OR is an independent business
 * This allows independent business users to access owner-only features within their own workspace
 * @param allowedRoles - Array of roles that can access the route
 */
function requireRolesOrIndependent(...allowedRoles) {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                throw (0, errorHandler_1.createUnauthorizedError)('未授权访问');
            }
            const userRole = req.user.role;
            // 检查角色是否在允许列表中
            if (allowedRoles.includes(userRole)) {
                return next();
            }
            // 如果是 BUSINESS 角色，检查是否为独立商务
            if (userRole === 'BUSINESS') {
                const userRecord = await prisma_1.default.user.findUnique({
                    where: { id: req.user.userId },
                    select: { isIndependent: true },
                });
                if (userRecord?.isIndependent) {
                    return next(); // 独立商务享有完整权限
                }
            }
            throw (0, errorHandler_1.createForbiddenError)('您没有权限执行此操作');
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware to check if user belongs to the specified factory
 * Used for factory-scoped resources
 */
function requireFactoryAccess(req, _res, next) {
    try {
        if (!req.user) {
            throw (0, errorHandler_1.createUnauthorizedError)('未授权访问');
        }
        // Platform admins can access all factories
        if (req.user.role === 'PLATFORM_ADMIN') {
            return next();
        }
        // Get brandId from request params or body
        const brandId = req.params.brandId || req.body.brandId;
        if (brandId && req.user.brandId !== brandId) {
            throw (0, errorHandler_1.createForbiddenError)('您没有权限访问此工厂的数据');
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Middleware to ensure user is a Platform Admin
 */
exports.requirePlatformAdmin = requireRoles('PLATFORM_ADMIN');
/**
 * Middleware to ensure user is a Brand (formerly Factory Owner)
 */
exports.requireBrandOwner = requireRoles('BRAND');
/**
 * Middleware to ensure user is Business (formerly Business Staff)
 */
exports.requireBusinessStaff = requireRoles('BUSINESS');
/**
 * Middleware to ensure user is Brand or Business
 */
exports.requireFactoryMember = requireRoles('BRAND', 'BUSINESS');
/**
 * Check if a user role has permission to access a specific feature
 */
function hasPermission(userRole, allowedRoles) {
    return allowedRoles.includes(userRole);
}
/**
 * Role hierarchy for permission checking
 * Higher roles inherit permissions from lower roles
 */
exports.ROLE_HIERARCHY = {
    PLATFORM_ADMIN: 3,
    BRAND: 2,
    BUSINESS: 1,
    INFLUENCER: 0,
};
/**
 * Check if user role is at least the minimum required level
 */
function hasMinimumRole(userRole, minimumRole) {
    return exports.ROLE_HIERARCHY[userRole] >= exports.ROLE_HIERARCHY[minimumRole];
}
/**
 * Middleware to enrich user data with brandId if missing from token
 * This provides backward compatibility for old tokens
 */
async function enrichUserData(req, _res, next) {
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
        const user = await prisma_1.default.user.findUnique({
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
        }
        else {
            console.log('[Enrich User Data] ⚠️ User has no brandId in database');
        }
        next();
    }
    catch (error) {
        console.error('[Enrich User Data] ❌ Error:', error);
        next(error);
    }
}
//# sourceMappingURL=auth.middleware.js.map