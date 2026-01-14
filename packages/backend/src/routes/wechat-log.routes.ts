import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireBrandMember } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { WeChatAddStatus } from '@prisma/client';

const router = Router();

// 所有路由都需要认�?
router.use(authenticate);
router.use(requireBrandMember);

// ============================================
// 微信添加日志 API
// ============================================

/**
 * GET /api/wechat-logs
 * 获取添加日志列表
 */
router.get(
    '/',
    [
        query('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'FAILED']),
        query('staffId').optional().isUUID(),
        query('influencerId').optional().isUUID(),
        query('page').optional().isInt({ min: 1 }),
        query('pageSize').optional().isInt({ min: 1, max: 100 }),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { status, staffId, influencerId, page = 1, pageSize = 20 } = req.query;

            const where: any = {
                brandId: user.brandId,
            };

            // 筛选条�?
            if (status) {
                where.status = status as WeChatAddStatus;
            }
            if (influencerId) {
                where.influencerId = influencerId;
            }

            // 商务只能看到自己的日志（除非是品牌）
            if (user.role === 'BUSINESS') {
                where.staffId = user.userId;
            } else if (staffId) {
                where.staffId = staffId;
            }

            const [logs, total] = await Promise.all([
                prisma.weChatAddLog.findMany({
                    where,
                    include: {
                        influencer: {
                            select: { id: true, nickname: true, platform: true, wechat: true },
                        },
                        staff: {
                            select: { id: true, name: true },
                        },
                        script: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (Number(page) - 1) * Number(pageSize),
                    take: Number(pageSize),
                }),
                prisma.weChatAddLog.count({ where }),
            ]);

            return res.json({
                success: true,
                data: {
                    list: logs,
                    pagination: {
                        page: Number(page),
                        pageSize: Number(pageSize),
                        total,
                        totalPages: Math.ceil(total / Number(pageSize)),
                    },
                },
            });
        } catch (error) {
            console.error('获取添加日志列表失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * GET /api/wechat-logs/influencer/:influencerId
 * 获取达人的最新微信添加状�?
 */
router.get(
    '/influencer/:influencerId',
    [param('influencerId').isUUID()],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { influencerId } = req.params;

            const latestLog = await prisma.weChatAddLog.findFirst({
                where: {
                    influencerId,
                    brandId: user.brandId,
                },
                include: {
                    staff: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!latestLog) {
                return res.json({
                    success: true,
                    data: {
                        status: null,
                        canAdd: true,
                        message: '未添加过微信',
                    },
                });
            }

            // 根据状态判断是否可以添�?
            let canAdd = false;
            let message = '';

            switch (latestLog.status) {
                case 'ACCEPTED':
                    canAdd = false;
                    message = '微信已通过';
                    break;
                case 'PENDING':
                    canAdd = false;
                    if (latestLog.staffId === user.userId) {
                        message = '您已发送添加请求，等待通过�?;
                    } else {
                        message = `${latestLog.staff.name} 已在添加中`;
                    }
                    break;
                case 'REJECTED':
                case 'EXPIRED':
                case 'FAILED':
                    canAdd = true;
                    message = '可以重新添加';
                    break;
                default:
                    canAdd = true;
            }

            return res.json({
                success: true,
                data: {
                    ...latestLog,
                    canAdd,
                    message,
                },
            });
        } catch (error) {
            console.error('获取达人微信状态失�?', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * POST /api/wechat-logs
 * 创建添加日志（发起微信添加）
 */
router.post(
    '/',
    [
        body('targetWechatId').trim().notEmpty().withMessage('微信号不能为�?),
        body('targetNickname').trim().notEmpty().withMessage('昵称不能为空'),
        body('targetPlatform').optional().trim(),
        body('influencerId').optional({ nullable: true }).isUUID(),
        body('scriptId').optional({ nullable: true }).isUUID(),
        body('noteSet').optional().trim(),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { targetWechatId, targetNickname, targetPlatform, influencerId, scriptId, noteSet } = req.body;

            // 如果有关联达人，检查是否可以添�?
            if (influencerId) {
                const existingLog = await prisma.weChatAddLog.findFirst({
                    where: {
                        influencerId,
                        brandId: user.brandId,
                        status: { in: ['PENDING', 'ACCEPTED'] },
                    },
                });

                if (existingLog) {
                    if (existingLog.status === 'ACCEPTED') {
                        return res.status(400).json({ success: false, error: { message: '该达人微信已通过，无需重复添加' } });
                    }
                    if (existingLog.status === 'PENDING') {
                        return res.status(400).json({ success: false, error: { message: '该达人微信添加请求待通过中，请勿重复添加' } });
                    }
                }
            }

            const log = await prisma.weChatAddLog.create({
                data: {
                    brandId: user.brandId,
                    staffId: user.userId,
                    targetWechatId,
                    targetNickname,
                    targetPlatform: targetPlatform || null,
                    influencerId: influencerId || null,
                    scriptId: scriptId || null,
                    noteSet: noteSet || `${targetNickname}-${targetPlatform || '未知平台'}`,
                    status: 'PENDING',
                },
                include: {
                    staff: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.status(201).json({ success: true, data: log });
        } catch (error) {
            console.error('创建添加日志失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * PUT /api/wechat-logs/:id/status
 * 更新添加状�?
 */
router.put(
    '/:id/status',
    [
        param('id').isUUID(),
        body('status').isIn(['ACCEPTED', 'REJECTED', 'EXPIRED', 'FAILED']).withMessage('无效的状�?),
        body('errorMessage').optional().trim(),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;
            const { status, errorMessage } = req.body;

            // 检查日志是否存�?
            const existing = await prisma.weChatAddLog.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: { message: '日志不存�? } });
            }

            // 商务只能更新自己的日�?
            if (user.role === 'BUSINESS' && existing.staffId !== user.userId) {
                return res.status(403).json({ success: false, error: { message: '无权更新此日�? } });
            }

            const updateData: any = {
                status: status as WeChatAddStatus,
            };

            if (status === 'ACCEPTED') {
                updateData.acceptedAt = new Date();
                updateData.isRetryable = false;
            }

            if (status === 'FAILED' && errorMessage) {
                updateData.errorMessage = errorMessage;
                // 判断是否可重�?
                const nonRetryableErrors = ['微信号不存在', '账号异常', '对方已是好友'];
                updateData.isRetryable = !nonRetryableErrors.some(e => errorMessage.includes(e));
            }

            if (status === 'REJECTED' || status === 'EXPIRED') {
                updateData.isRetryable = true;
            }

            const log = await prisma.weChatAddLog.update({
                where: { id },
                data: updateData,
                include: {
                    staff: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.json({ success: true, data: log });
        } catch (error) {
            console.error('更新状态失�?', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * POST /api/wechat-logs/:id/retry
 * 重试添加
 */
router.post(
    '/:id/retry',
    [param('id').isUUID()],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;

            // 检查日志是否存�?
            const existing = await prisma.weChatAddLog.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: { message: '日志不存�? } });
            }

            if (!existing.isRetryable) {
                return res.status(400).json({ success: false, error: { message: '该记录不可重�? } });
            }

            if (existing.retryCount >= 3) {
                return res.status(400).json({ success: false, error: { message: '已达到最大重试次�? } });
            }

            // 更新重试信息
            const log = await prisma.weChatAddLog.update({
                where: { id },
                data: {
                    status: 'PENDING',
                    retryCount: existing.retryCount + 1,
                    errorMessage: null,
                    nextRetryAt: null,
                },
                include: {
                    staff: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.json({ success: true, data: log, message: '已加入重试队�? });
        } catch (error) {
            console.error('重试失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * GET /api/wechat-logs/stats
 * 获取统计数据
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const where: any = {
            brandId: user.brandId,
        };

        // 商务只看自己�?
        if (user.role === 'BUSINESS') {
            where.staffId = user.userId;
        }

        const [total, pending, accepted, failed, retryable] = await Promise.all([
            prisma.weChatAddLog.count({ where }),
            prisma.weChatAddLog.count({ where: { ...where, status: 'PENDING' } }),
            prisma.weChatAddLog.count({ where: { ...where, status: 'ACCEPTED' } }),
            prisma.weChatAddLog.count({ where: { ...where, status: 'FAILED' } }),
            prisma.weChatAddLog.count({ where: { ...where, status: 'FAILED', isRetryable: true } }),
        ]);

        return res.json({
            success: true,
            data: {
                total,
                pending,
                accepted,
                failed,
                retryable,
                successRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0',
            },
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        return res.status(500).json({ success: false, error: { message: '服务器错�? } });
    }
});

export default router;
