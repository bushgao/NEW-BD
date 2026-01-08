import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse } from '@ics/shared';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw createBadRequestError(errorMessages, errors.array());
  }
  next();
};

// Validation rules
const dashboardLayoutValidation = [
  body('layout')
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null to reset layout
      }
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('布局配置必须是对象或null');
      }
      return true;
    }),
  body('layout.cards')
    .optional()
    .isArray()
    .withMessage('卡片配置必须是数组'),
];

/**
 * @route GET /api/users/dashboard-layout
 * @desc Get user's dashboard layout configuration
 * @access Private
 */
router.get(
  '/dashboard-layout',
  authenticate,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // 获取用户的偏好设置
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      // 从 preferences 中提取 dashboard 布局
      const preferences = user.preferences as any;
      const layout = preferences?.dashboard?.layout || null;

      res.json({
        success: true,
        data: { layout },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/users/dashboard-layout
 * @desc Save user's dashboard layout configuration
 * @access Private
 */
router.post(
  '/dashboard-layout',
  authenticate,
  dashboardLayoutValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { layout } = req.body;

      // 获取当前用户的偏好设置
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      // 合并现有偏好设置和新的布局配置
      const currentPreferences = (user.preferences as any) || {};
      const updatedPreferences = {
        ...currentPreferences,
        dashboard: {
          ...(currentPreferences.dashboard || {}),
          layout,
        },
      };

      // 更新用户偏好设置
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: updatedPreferences,
        },
      });

      res.json({
        success: true,
        data: {
          message: '布局保存成功',
          layout,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/users/saved-filters
 * @desc Get user's saved filter configurations
 * @access Private
 */
router.get(
  '/saved-filters',
  authenticate,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      const preferences = user.preferences as any;
      const savedFilters = preferences?.influencerFilters?.saved || [];

      res.json({
        success: true,
        data: { savedFilters },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/users/saved-filters
 * @desc Save a new filter configuration
 * @access Private
 */
router.post(
  '/saved-filters',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('筛选名称不能为空'),
    body('filter').isObject().withMessage('筛选条件必须是对象'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { name, filter } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      const currentPreferences = (user.preferences as any) || {};
      const savedFilters = currentPreferences?.influencerFilters?.saved || [];

      // 创建新的筛选条件
      const newFilter = {
        id: uuidv4(),
        name,
        filter,
        createdAt: new Date().toISOString(),
        isFavorite: false,
      };

      // 添加到已保存的筛选条件列表
      const updatedFilters = [...savedFilters, newFilter];

      const updatedPreferences = {
        ...currentPreferences,
        influencerFilters: {
          ...(currentPreferences.influencerFilters || {}),
          saved: updatedFilters,
        },
      };

      await prisma.user.update({
        where: { id: userId },
        data: { preferences: updatedPreferences },
      });

      res.json({
        success: true,
        data: {
          message: '筛选条件已保存',
          filter: newFilter,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/users/saved-filters/:filterId
 * @desc Delete a saved filter
 * @access Private
 */
router.delete(
  '/saved-filters/:filterId',
  authenticate,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { filterId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      const currentPreferences = (user.preferences as any) || {};
      const savedFilters = currentPreferences?.influencerFilters?.saved || [];

      // 删除指定的筛选条件
      const updatedFilters = savedFilters.filter((f: any) => f.id !== filterId);

      const updatedPreferences = {
        ...currentPreferences,
        influencerFilters: {
          ...(currentPreferences.influencerFilters || {}),
          saved: updatedFilters,
        },
      };

      await prisma.user.update({
        where: { id: userId },
        data: { preferences: updatedPreferences },
      });

      res.json({
        success: true,
        data: { message: '筛选条件已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/users/saved-filters/:filterId/favorite
 * @desc Toggle favorite status of a saved filter
 * @access Private
 */
router.put(
  '/saved-filters/:filterId/favorite',
  authenticate,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { filterId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      const currentPreferences = (user.preferences as any) || {};
      const savedFilters = currentPreferences?.influencerFilters?.saved || [];

      // 切换收藏状态
      const updatedFilters = savedFilters.map((f: any) => {
        if (f.id === filterId) {
          return { ...f, isFavorite: !f.isFavorite };
        }
        return f;
      });

      const updatedPreferences = {
        ...currentPreferences,
        influencerFilters: {
          ...(currentPreferences.influencerFilters || {}),
          saved: updatedFilters,
        },
      };

      await prisma.user.update({
        where: { id: userId },
        data: { preferences: updatedPreferences },
      });

      res.json({
        success: true,
        data: { message: '收藏状态已更新' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
