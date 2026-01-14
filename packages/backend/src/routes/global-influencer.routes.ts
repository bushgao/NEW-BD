/**
 * 全局达人路由 (Global Influencer Routes)
 * 
 * 主要用于�?
 * - 平台管理员：认证达人、查看所有达�?
 * - 品牌/商务：搜索达人（用于添加�?
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import * as globalInfluencerService from '../services/global-influencer.service';

const router = Router();

// 验证中间�?
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        throw createBadRequestError(errorMessages, errors.array());
    }
    next();
};

// ============================================
// 平台管理员路�?
// ============================================

/**
 * 获取待认证达人列�?
 * GET /global-influencers/pending-verification
 */
router.get(
    '/pending-verification',
    authenticate,
    requirePlatformAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;

            const result = await globalInfluencerService.getPendingVerificationList({ page, pageSize });

            res.json({
                success: true,
                data: result.data,
                pagination: {
                    page,
                    pageSize,
                    total: result.total,
                    totalPages: Math.ceil(result.total / pageSize),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 认证达人（通过/拒绝�?
 * POST /global-influencers/:id/verify
 */
router.post(
    '/:id/verify',
    authenticate,
    requirePlatformAdmin,
    [
        param('id').isUUID().withMessage('无效的ID'),
        body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('无效的状�?),
        body('note').optional().isString().trim(),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status, note } = req.body;
            const userId = req.user!.userId;

            const result = await globalInfluencerService.verifyInfluencer(id, userId, status, note);

            res.json({
                success: true,
                data: result,
                message: status === 'VERIFIED' ? '认证成功' : '已拒绝认�?,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 搜索全局达人
 * GET /global-influencers/search
 */
router.get(
    '/search',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { keyword, phone, platform, platformId, verificationStatus } = req.query;
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;

            const result = await globalInfluencerService.searchGlobalInfluencers(
                {
                    keyword: keyword as string,
                    phone: phone as string,
                    platform: platform as any,
                    platformId: platformId as string,
                    verificationStatus: verificationStatus as any,
                },
                { page, pageSize }
            );

            res.json({
                success: true,
                data: result.data,
                pagination: {
                    page,
                    pageSize,
                    total: result.total,
                    totalPages: Math.ceil(result.total / pageSize),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 获取全局达人详情
 * GET /global-influencers/:id
 */
router.get(
    '/:id',
    authenticate,
    [param('id').isUUID().withMessage('无效的ID')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await globalInfluencerService.getGlobalInfluencerById(id);

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
 * 创建全局达人（平台管理员�?
 * POST /global-influencers
 */
router.post(
    '/',
    authenticate,
    requirePlatformAdmin,
    [
        body('nickname').isString().trim().notEmpty().withMessage('昵称不能为空'),
        body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
        body('wechat').optional().isString().trim(),
        body('platformAccounts').isArray({ min: 1 }).withMessage('至少需要一个平台账�?),
        body('platformAccounts.*.platform').isIn(['DOUYIN', 'KUAISHOU', 'SHIPINHAO', 'XIAOHONGSHU']).withMessage('无效的平�?),
        body('platformAccounts.*.platformId').isString().trim().notEmpty().withMessage('平台账号ID不能为空'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { nickname, phone, wechat, platformAccounts } = req.body;
            const userId = req.user!.userId;

            const result = await globalInfluencerService.createGlobalInfluencer({
                nickname,
                phone,
                wechat,
                platformAccounts,
                sourceType: 'PLATFORM',
                createdBy: userId,
            });

            res.status(201).json({
                success: true,
                data: result,
                message: '达人创建成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// 账号绑定相关路由（平台管理员�?
// ============================================

/**
 * 通过手机号搜索达人账�?
 * GET /global-influencers/search-account?phone=xxx
 */
router.get(
    '/search-account',
    authenticate,
    requirePlatformAdmin,
    [query('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const phone = req.query.phone as string;
            const account = await globalInfluencerService.searchInfluencerAccount(phone);

            res.json({
                success: true,
                data: account,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 绑定达人账号
 * PUT /global-influencers/:id/bind-account
 */
router.put(
    '/:id/bind-account',
    authenticate,
    requirePlatformAdmin,
    [
        param('id').isUUID().withMessage('无效的达人ID'),
        body('accountId').isUUID().withMessage('无效的账号ID'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { accountId } = req.body;

            const result = await globalInfluencerService.bindInfluencerAccount(id, accountId);

            res.json({
                success: true,
                data: result,
                message: '账号绑定成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 解绑达人账号
 * PUT /global-influencers/:id/unbind-account
 */
router.put(
    '/:id/unbind-account',
    authenticate,
    requirePlatformAdmin,
    [param('id').isUUID().withMessage('无效的达人ID')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const result = await globalInfluencerService.unbindInfluencerAccount(id);

            res.json({
                success: true,
                data: result,
                message: '账号解绑成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
