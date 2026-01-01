import { Router, Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import * as notificationService from '../services/notification.service';
import type { ApiResponse } from '@ics/shared';

const router = Router();

// 验证中间件
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    throw createBadRequestError(errorMessages, errors.array());
  }
  next();
};

// 所有路由都需要认证
router.use(authenticate);

/**
 * GET /api/notifications
 * 获取当前用户的通知列表
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('isRead').optional().isBoolean().withMessage('isRead必须为布尔值'),
    query('type').optional().isString().withMessage('type必须为字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const isRead = req.query.isRead === 'true' ? true : 
                     req.query.isRead === 'false' ? false : undefined;
      const type = req.query.type as string | undefined;

      const result = await notificationService.listNotifications(
        userId,
        { isRead, type },
        { page, pageSize }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * 获取当前用户的未读通知数量
 */
router.get(
  '/unread-count',
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);


/**
 * PUT /api/notifications/read-all
 * 标记所有通知为已读
 * 注意：此路由必须在 /:id/read 之前定义，否则会被匹配为 id
 */
router.put(
  '/read-all',
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { count, message: `已将 ${count} 条通知标记为已读` },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notifications/clear-read
 * 清空已读通知
 * 注意：此路由必须在 /:id 之前定义，否则会被匹配为 id
 */
router.delete(
  '/clear-read',
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.clearReadNotifications(userId);

      res.json({
        success: true,
        data: { count, message: `已清空 ${count} 条已读通知` },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * 标记单个通知为已读
 */
router.put(
  '/:id/read',
  [param('id').isUUID().withMessage('无效的通知 ID')],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * 删除单个通知
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('无效的通知 ID')],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        data: { message: '通知已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notifications/run-checks
 * 手动触发定时检查任务（仅平台管理员）
 */
router.post(
  '/run-checks',
  requirePlatformAdmin,
  async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const results = await notificationService.runScheduledChecks();

      res.json({
        success: true,
        data: { ...results, message: '定时检查任务执行完成' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
