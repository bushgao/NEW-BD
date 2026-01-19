/**
 * 邀请路由
 * 
 * 处理品牌邀请商务相关接口
 */

import { Router, Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import * as invitationService from '../services/invitation.service';
import * as exportService from '../services/export.service';
import { authenticate, enrichUserData, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// 校验错误处理
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return _res.status(400).json({
            success: false,
            error: { message: errors.array()[0].msg },
        });
    }
    next();
};

// ============ 公开接口（不需要认证） ============

/**
 * 获取邀请详情（根据邀请码）
 * GET /api/invitations/code/:code
 */
router.get(
    '/code/:code',
    [param('code').isLength({ min: 8, max: 8 }).withMessage('邀请码格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invitation = await invitationService.getInvitationByCode(req.params.code);
            res.json({ success: true, data: invitation });
        } catch (error) {
            next(error);
        }
    }
);

// ============ 需要认证的接口 ============

router.use(authenticate);
router.use(enrichUserData);

/**
 * 创建邀请
 * POST /api/invitations
 */
router.post(
    '/',
    requireRoles('BRAND', 'BUSINESS'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user?.brandId;
            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    error: { message: '用户未关联品牌' },
                });
            }

            const invitation = await invitationService.createInvitation({
                brandId,
                inviterId: req.user!.userId,
            });

            res.status(201).json({ success: true, data: invitation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 获取当前品牌的邀请列表
 * GET /api/invitations
 */
router.get(
    '/',
    requireRoles('BRAND', 'BUSINESS'),
    [query('status').optional().isIn(['PENDING', 'USED', 'REVOKED']).withMessage('状态值无效')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user?.brandId;
            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    error: { message: '用户未关联品牌' },
                });
            }

            const status = req.query.status as 'PENDING' | 'USED' | 'REVOKED' | undefined;
            const invitations = await invitationService.listInvitations(brandId, status);

            res.json({ success: true, data: invitations });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 撤销邀请
 * DELETE /api/invitations/:id
 */
router.delete(
    '/:id',
    requireRoles('BRAND', 'BUSINESS'),
    [param('id').isUUID().withMessage('邀请ID格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await invitationService.revokeInvitation(req.params.id, req.user!.userId);
            res.json({ success: true, message: '邀请已撤销' });
        } catch (error) {
            next(error);
        }
    }
);

// ============ 定向邀请接口 ============

/**
 * 根据手机号查找独立商务
 * GET /api/invitations/search-business?phone=xxx
 */
router.get(
    '/search-business',
    requireRoles('BRAND', 'BUSINESS'),
    [query('phone').isMobilePhone('zh-CN').withMessage('手机号格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const phone = req.query.phone as string;
            const user = await invitationService.findIndependentBusinessByPhone(phone);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: { message: '未找到该手机号对应的独立商务用户' },
                });
            }

            res.json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 创建定向邀请（通过手机号邀请独立商务）
 * POST /api/invitations/targeted
 */
router.post(
    '/targeted',
    requireRoles('BRAND', 'BUSINESS'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user?.brandId;
            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    error: { message: '用户未关联品牌' },
                });
            }

            const { targetPhone } = req.body;
            if (!targetPhone) {
                return res.status(400).json({
                    success: false,
                    error: { message: '请提供目标手机号' },
                });
            }

            const invitation = await invitationService.createTargetedInvitation({
                brandId,
                inviterId: req.user!.userId,
                targetPhone,
            });

            res.status(201).json({ success: true, data: invitation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 获取我收到的定向邀请（独立商务端）
 * GET /api/invitations/received
 */
router.get(
    '/received',
    requireRoles('BUSINESS'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invitations = await invitationService.getReceivedInvitations(req.user!.userId);
            res.json({ success: true, data: invitations });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 接受定向邀请（独立商务确认加入品牌）
 * POST /api/invitations/targeted/:code/accept
 */
router.post(
    '/targeted/:code/accept',
    requireRoles('BUSINESS'),
    [param('code').isLength({ min: 8, max: 8 }).withMessage('邀请码格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { migrateInfluencers = false } = req.body;
            await invitationService.acceptTargetedInvitation(
                req.params.code,
                req.user!.userId,
                migrateInfluencers
            );
            res.json({ success: true, message: '您已成功加入品牌' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 拒绝定向邀请
 * DELETE /api/invitations/targeted/:id/reject
 */
router.delete(
    '/targeted/:id/reject',
    requireRoles('BUSINESS'),
    [param('id').isUUID().withMessage('邀请ID格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await invitationService.rejectTargetedInvitation(req.params.id, req.user!.userId);
            res.json({ success: true, message: '已拒绝该邀请' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 导出用户数据备份（加入品牌前下载）
 * GET /api/invitations/backup-export
 */
router.get(
    '/backup-export',
    requireRoles('BUSINESS'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const brandId = req.user?.brandId;

            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    error: { message: '用户未关联品牌' },
                });
            }

            const result = await exportService.exportUserDataBackup(userId, brandId);

            // 设置响应头
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
            res.setHeader('X-Backup-Summary', JSON.stringify(result.summary));

            res.send(result.buffer);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 获取数据备份汇总（不下载，仅获取统计）
 * GET /api/invitations/backup-summary
 */
router.get(
    '/backup-summary',
    requireRoles('BUSINESS'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const brandId = req.user?.brandId;

            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    error: { message: '用户未关联品牌' },
                });
            }

            const result = await exportService.exportUserDataBackup(userId, brandId);

            res.json({
                success: true,
                data: result.summary,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
