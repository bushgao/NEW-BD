"use strict";
/**
 * 权限验证中间件
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = checkPermission;
exports.filterByPermission = filterByPermission;
exports.checkStaffDataAccess = checkStaffDataAccess;
const errorHandler_1 = require("./errorHandler");
const permissions_1 = require("../types/permissions");
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * 检查用户是否有指定权限
 *
 * @param permission - 权限字符串，格式：category.key（如 operations.manageSamples）
 * @returns Express 中间件
 *
 * @example
 * router.post('/samples', authenticate, checkPermission('operations.manageSamples'), createSample);
 */
function checkPermission(permission) {
    return async (req, _res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw (0, errorHandler_1.createForbiddenError)('未授权访问');
            }
            // 工厂老板拥有所有权限
            if (user.role === 'BRAND') {
                return next();
            }
            // 平台管理员拥有所有权限
            if (user.role === 'PLATFORM_ADMIN') {
                return next();
            }
            // 检查商务权限
            if (user.role === 'BUSINESS') {
                // 从数据库获取最新权限（确保权限修改立即生效）
                const userWithPermissions = await prisma_1.default.user.findUnique({
                    where: { id: user.userId },
                    select: { permissions: true, isIndependent: true },
                });
                // 独立商务拥有自己工作区的所有权限（相当于品牌老板）
                if (userWithPermissions?.isIndependent) {
                    return next();
                }
                const permissions = userWithPermissions?.permissions;
                if (!(0, permissions_1.hasPermission)(permissions, permission)) {
                    throw (0, errorHandler_1.createForbiddenError)('您没有权限执行此操作，请联系工厂老板开通权限');
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * 根据权限过滤数据
 *
 * 用于限制商务只能查看自己的数据
 *
 * @param permission - 权限字符串
 * @returns Express 中间件
 *
 * @example
 * router.get('/influencers', authenticate, filterByPermission('dataVisibility.viewOthersInfluencers'), getInfluencers);
 */
function filterByPermission(permission) {
    return async (req, _res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw (0, errorHandler_1.createForbiddenError)('未授权访问');
            }
            // 工厂老板和平台管理员可以查看所有数据
            if (user.role === 'BRAND' || user.role === 'PLATFORM_ADMIN') {
                return next();
            }
            // 商务人员根据权限过滤数据
            if (user.role === 'BUSINESS') {
                // 从数据库获取最新权限
                const userWithPermissions = await prisma_1.default.user.findUnique({
                    where: { id: user.userId },
                    select: { permissions: true, isIndependent: true },
                });
                // 独立商务可以查看自己工作区的所有数据
                if (userWithPermissions?.isIndependent) {
                    return next();
                }
                const permissions = userWithPermissions?.permissions;
                // 如果没有查看其他商务数据的权限，只返回自己的数据
                if (permission === 'dataVisibility.viewOthersInfluencers' &&
                    !(0, permissions_1.hasPermission)(permissions, permission)) {
                    // 添加 createdBy 过滤条件
                    req.query.createdBy = user.userId;
                }
                if (permission === 'dataVisibility.viewOthersCollaborations' &&
                    !(0, permissions_1.hasPermission)(permissions, permission)) {
                    // 添加 businessStaffId 过滤条件
                    req.query.businessStaffId = user.userId;
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * 检查是否可以访问指定商务的数据
 *
 * 用于商务详情、商务绩效等需要访问特定商务数据的场景
 *
 * @returns Express 中间件
 */
function checkStaffDataAccess() {
    return async (req, _res, next) => {
        try {
            const user = req.user;
            const targetStaffId = req.params.staffId || req.params.id;
            if (!user) {
                throw (0, errorHandler_1.createForbiddenError)('未授权访问');
            }
            // 工厂老板和平台管理员可以访问所有商务数据
            if (user.role === 'BRAND' || user.role === 'PLATFORM_ADMIN') {
                return next();
            }
            // 商务人员只能访问自己的数据，除非有权限
            if (user.role === 'BUSINESS') {
                // 如果访问的是自己的数据，允许
                if (targetStaffId === user.userId) {
                    return next();
                }
                // 检查是否有查看其他商务业绩的权限
                const userWithPermissions = await prisma_1.default.user.findUnique({
                    where: { id: user.userId },
                    select: { permissions: true },
                });
                const permissions = userWithPermissions?.permissions;
                if (!(0, permissions_1.hasPermission)(permissions, 'dataVisibility.viewOthersPerformance')) {
                    throw (0, errorHandler_1.createForbiddenError)('您没有权限查看其他商务的数据');
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=permission.middleware.js.map