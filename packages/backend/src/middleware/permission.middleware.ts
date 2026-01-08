/**
 * 权限验证中间件
 */

import { Request, Response, NextFunction } from 'express';
import { createForbiddenError } from './errorHandler';
import { hasPermission, type StaffPermissions } from '../types/permissions';
import prisma from '../lib/prisma';

/**
 * 检查用户是否有指定权限
 * 
 * @param permission - 权限字符串，格式：category.key（如 operations.manageSamples）
 * @returns Express 中间件
 * 
 * @example
 * router.post('/samples', authenticate, checkPermission('operations.manageSamples'), createSample);
 */
export function checkPermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw createForbiddenError('未授权访问');
      }

      // 工厂老板拥有所有权限
      if (user.role === 'FACTORY_OWNER') {
        return next();
      }

      // 平台管理员拥有所有权限
      if (user.role === 'PLATFORM_ADMIN') {
        return next();
      }

      // 检查商务权限
      if (user.role === 'BUSINESS_STAFF') {
        // 从数据库获取最新权限（确保权限修改立即生效）
        const userWithPermissions = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { permissions: true },
        });

        const permissions = userWithPermissions?.permissions as StaffPermissions | null;

        if (!hasPermission(permissions, permission)) {
          throw createForbiddenError('您没有权限执行此操作', {
            permission,
            message: '请联系工厂老板开通权限',
          });
        }
      }

      next();
    } catch (error) {
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
export function filterByPermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw createForbiddenError('未授权访问');
      }

      // 工厂老板和平台管理员可以查看所有数据
      if (user.role === 'FACTORY_OWNER' || user.role === 'PLATFORM_ADMIN') {
        return next();
      }

      // 商务人员根据权限过滤数据
      if (user.role === 'BUSINESS_STAFF') {
        // 从数据库获取最新权限
        const userWithPermissions = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { permissions: true },
        });

        const permissions = userWithPermissions?.permissions as StaffPermissions | null;

        // 如果没有查看其他商务数据的权限，只返回自己的数据
        if (permission === 'dataVisibility.viewOthersInfluencers' && 
            !hasPermission(permissions, permission)) {
          // 添加 createdBy 过滤条件
          req.query.createdBy = user.userId;
        }

        if (permission === 'dataVisibility.viewOthersCollaborations' && 
            !hasPermission(permissions, permission)) {
          // 添加 businessStaffId 过滤条件
          req.query.businessStaffId = user.userId;
        }
      }

      next();
    } catch (error) {
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
export function checkStaffDataAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const targetStaffId = req.params.staffId || req.params.id;

      if (!user) {
        throw createForbiddenError('未授权访问');
      }

      // 工厂老板和平台管理员可以访问所有商务数据
      if (user.role === 'FACTORY_OWNER' || user.role === 'PLATFORM_ADMIN') {
        return next();
      }

      // 商务人员只能访问自己的数据，除非有权限
      if (user.role === 'BUSINESS_STAFF') {
        // 如果访问的是自己的数据，允许
        if (targetStaffId === user.userId) {
          return next();
        }

        // 检查是否有查看其他商务业绩的权限
        const userWithPermissions = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { permissions: true },
        });

        const permissions = userWithPermissions?.permissions as StaffPermissions | null;

        if (!hasPermission(permissions, 'dataVisibility.viewOthersPerformance')) {
          throw createForbiddenError('您没有权限查看其他商务的数据');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
