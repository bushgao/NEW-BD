import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import * as templateService from '../services/notification-template.service';
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

// 所有路由都需要认证和平台管理员权限
router.use(authenticate);
router.use(requirePlatformAdmin);

/**
 * GET /api/notification-templates
 * 获取所有通知模板
 */
router.get(
    '/',
    async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            const templates = await templateService.listTemplates();

            res.json({
                success: true,
                data: templates,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/notification-templates/:type
 * 获取单个模板
 */
router.get(
    '/:type',
    async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            const { type } = req.params;
            const template = await templateService.getTemplateByType(type);

            if (!template) {
                throw createBadRequestError('模板不存在');
            }

            res.json({
                success: true,
                data: template,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/notification-templates/:type
 * 更新模板内容
 */
router.put(
    '/:type',
    [
        body('title').optional().isString().withMessage('标题必须为字符串'),
        body('content').optional().isString().withMessage('内容必须为字符串'),
        body('isEnabled').optional().isBoolean().withMessage('isEnabled必须为布尔值'),
        body('metadata').optional().isObject().withMessage('metadata必须为对象'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            const { type } = req.params;
            const { title, content, isEnabled, metadata } = req.body;

            const template = await templateService.updateTemplate(type, {
                title,
                content,
                isEnabled,
                metadata,
            });

            res.json({
                success: true,
                data: template,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/notification-templates/seed
 * 初始化默认模板（仅开发环境使用）
 */
router.post(
    '/seed',
    async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            await templateService.seedDefaultTemplates();

            res.json({
                success: true,
                data: { message: '默认模板已初始化' },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
