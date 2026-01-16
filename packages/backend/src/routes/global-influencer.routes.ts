import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// 验证错误处理中间件
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: '请求参数验证失败',
                details: errors.array(),
            },
        });
    }
    next();
};

/**
 * 创建全局达人（平台管理员入库到达人池）
 * POST /global-influencers
 * 
 * 使用 InfluencerAccount 模型作为全局达人池
 */
router.post(
    '/',
    authenticate,
    requirePlatformAdmin,
    [
        body('nickname').isString().trim().notEmpty().withMessage('昵称不能为空'),
        body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式错误'),
        body('wechat').optional().isString().trim(),
        body('platformAccounts').isArray({ min: 1 }).withMessage('至少需要一个平台账号'),
        body('platformAccounts.*.platform').isIn(['DOUYIN', 'KUAISHOU', 'SHIPINHAO', 'XIAOHONGSHU']).withMessage('平台格式错误'),
        body('platformAccounts.*.platformId').isString().trim().notEmpty().withMessage('平台账号ID不能为空'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { nickname, phone, wechat, platformAccounts } = req.body;

            // 使用 InfluencerAccount 存储全局达人
            // InfluencerAccount 只需要 primaryPhone，其他信息存储在 nickname 和 wechatId
            const influencerAccount = await prisma.influencerAccount.create({
                data: {
                    primaryPhone: phone || `temp_${Date.now()}`, // 如果没有手机号，使用临时标识
                    nickname: nickname,
                    wechatId: wechat,
                },
            });

            // 返回创建的全局达人信息
            res.status(201).json({
                success: true,
                data: {
                    id: influencerAccount.id,
                    nickname: influencerAccount.nickname,
                    phone: influencerAccount.primaryPhone,
                    wechat: influencerAccount.wechatId,
                    platformAccounts: platformAccounts, // 前端传入的平台信息（暂存，后续可扩展）
                    createdAt: influencerAccount.createdAt,
                },
                message: '达人入库成功',
            });
        } catch (error: any) {
            // 处理唯一约束冲突
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    error: { message: '该手机号或微信号已存在' },
                });
            }
            next(error);
        }
    }
);

/**
 * 获取全局达人列表
 * GET /global-influencers
 */
router.get(
    '/',
    authenticate,
    requirePlatformAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { keyword, page = '1', pageSize = '20', createdAfter } = req.query;
            const skip = (Number(page) - 1) * Number(pageSize);

            const where: any = {};
            if (keyword) {
                where.OR = [
                    { nickname: { contains: keyword, mode: 'insensitive' } },
                    { primaryPhone: { contains: keyword } },
                    { wechatId: { contains: keyword, mode: 'insensitive' } },
                ];
            }

            // 时间筛选
            if (createdAfter) {
                where.createdAt = { gte: new Date(createdAfter as string) };
            }

            const [total, accounts] = await Promise.all([
                prisma.influencerAccount.count({ where }),
                prisma.influencerAccount.findMany({
                    where,
                    skip,
                    take: Number(pageSize),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: { claimedInfluencers: true },
                        },
                    },
                }),
            ]);

            res.json({
                success: true,
                data: accounts.map(acc => ({
                    id: acc.id,
                    nickname: acc.nickname,
                    phone: acc.primaryPhone,
                    wechat: acc.wechatId,
                    brandCount: acc._count.claimedInfluencers,
                    createdAt: acc.createdAt,
                })),
                pagination: {
                    page: Number(page),
                    pageSize: Number(pageSize),
                    total,
                    totalPages: Math.ceil(total / Number(pageSize)),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 搜索全局达人（供品牌选择添加）
 * GET /global-influencers/search
 */
router.get(
    '/search',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { keyword, phone } = req.query;

            const where: any = {};
            if (phone) {
                where.primaryPhone = { contains: phone };
            } else if (keyword) {
                where.OR = [
                    { nickname: { contains: keyword, mode: 'insensitive' } },
                    { primaryPhone: { contains: keyword } },
                    { wechatId: { contains: keyword, mode: 'insensitive' } },
                ];
            }

            const accounts = await prisma.influencerAccount.findMany({
                where,
                take: 20,
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                success: true,
                data: accounts.map(acc => ({
                    id: acc.id,
                    nickname: acc.nickname,
                    phone: acc.primaryPhone,
                    wechat: acc.wechatId,
                    createdAt: acc.createdAt,
                })),
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
    [param('id').isUUID().withMessage('ID格式错误')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const account = await prisma.influencerAccount.findUnique({
                where: { id },
                include: {
                    claimedInfluencers: {
                        include: {
                            brand: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
            });

            if (!account) {
                return res.status(404).json({
                    success: false,
                    error: { message: '达人不存在' },
                });
            }

            res.json({
                success: true,
                data: {
                    id: account.id,
                    nickname: account.nickname,
                    phone: account.primaryPhone,
                    wechat: account.wechatId,
                    createdAt: account.createdAt,
                    brandInfluencers: account.claimedInfluencers.map(inf => ({
                        id: inf.id,
                        brandId: inf.brandId,
                        brandName: inf.brand.name,
                        platform: inf.platform,
                        platformId: inf.platformId,
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
