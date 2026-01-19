/**
 * 订阅管理路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as subscriptionService from '../services/subscription.service';
import type { ApiResponse } from '@ics/shared';

const router = Router();

/**
 * @route GET /api/subscription/status
 * @desc 获取当前用户的订阅状态
 * @access Authenticated
 */
router.get(
    '/status',
    authenticate,
    async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const status = await subscriptionService.getUserSubscriptionStatus(userId);

            if (!status) {
                return res.json({
                    success: true,
                    data: null,
                });
            }

            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/subscription/reminder-seen
 * @desc 标记提醒已查看
 * @access Authenticated
 */
router.post(
    '/reminder-seen',
    authenticate,
    async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const status = await subscriptionService.getUserSubscriptionStatus(userId);

            if (status) {
                await subscriptionService.markReminderSent(status.brandId);
            }

            res.json({
                success: true,
                data: { message: '已标记' },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/subscription/renew
 * @desc 续费套餐（预留接口）
 * @access Authenticated
 */
router.post(
    '/renew',
    authenticate,
    async (_req: Request, res: Response<ApiResponse>, _next: NextFunction) => {
        // 预留接口，实际支付逻辑待实现
        res.json({
            success: false,
            error: {
                code: 'NOT_IMPLEMENTED',
                message: '续费功能即将上线，请联系客服办理',
            },
        });
    }
);

export default router;
