/**
 * 品牌达人路由 (Brand Influencer Routes)
 * 
 * 用于品牌/商务管理品牌内的达人
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, requireBrandMember, enrichUserData } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import * as brandInfluencerService from '../services/brand-influencer.service';

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

// 所有路由需要认证和工厂成员权限
router.use(authenticate, enrichUserData, requireBrandMember);

// ============================================
// 达人列表和搜�?
// ============================================

/**
 * 获取品牌达人列表
 * GET /brand-influencers
 */
router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const { keyword, tags, categories, groupId, verificationStatus } = req.query;
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;

            const result = await brandInfluencerService.listBrandInfluencers(
                brandId,
                {
                    keyword: keyword as string,
                    tags: tags ? (tags as string).split(',') : undefined,
                    categories: categories ? (categories as string).split(',') : undefined,
                    groupId: groupId as string,
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
 * 搜索全局达人（用于添加）
 * GET /brand-influencers/search-global
 */
router.get(
    '/search-global',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const { keyword, phone, platform, platformId } = req.query;
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;

            const result = await brandInfluencerService.searchGlobalInfluencersForBrand(
                brandId,
                {
                    keyword: keyword as string,
                    phone: phone as string,
                    platform: platform as any,
                    platformId: platformId as string,
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

// ============================================
// 添加达人
// ============================================

/**
 * 关联已有全局达人
 * POST /brand-influencers/add-existing
 */
router.post(
    '/add-existing',
    [
        body('globalInfluencerId').isUUID().withMessage('无效的达人ID'),
        body('tags').optional().isArray(),
        body('notes').optional().isString().trim(),
        body('categories').optional().isArray(),
        body('groupId').optional().isUUID(),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const userId = req.user!.userId;
            const { globalInfluencerId, tags, notes, categories, groupId } = req.body;

            const result = await brandInfluencerService.addInfluencerToBrand({
                brandId,
                globalInfluencerId,
                tags,
                notes,
                categories,
                groupId,
                addedBy: userId,
            });

            res.status(201).json({
                success: true,
                data: result,
                message: '达人添加成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 创建并添加新达人
 * POST /brand-influencers
 */
router.post(
    '/',
    [
        body('nickname').isString().trim().notEmpty().withMessage('昵称不能为空'),
        body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
        body('wechat').optional().isString().trim(),
        body('platform').isIn(['DOUYIN', 'KUAISHOU', 'SHIPINHAO', 'XIAOHONGSHU']).withMessage('无效的平�?),
        body('platformId').isString().trim().notEmpty().withMessage('平台账号ID不能为空'),
        body('followers').optional().isString(),
        body('tags').optional().isArray(),
        body('notes').optional().isString().trim(),
        body('categories').optional().isArray(),
        body('groupId').optional().isUUID(),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const userId = req.user!.userId;
            const { nickname, phone, wechat, platform, platformId, followers, tags, notes, categories, groupId } = req.body;

            const result = await brandInfluencerService.createAndAddInfluencer({
                brandId,
                nickname,
                phone,
                wechat,
                platform,
                platformId,
                followers,
                tags,
                notes,
                categories,
                groupId,
                addedBy: userId,
                sourceType: req.user!.role === 'BRAND' ? 'Brand' : 'STAFF',
            });

            res.status(201).json({
                success: true,
                data: result.brandInfluencer,
                isNew: result.isNew,
                message: result.isNew ? '新达人创建并添加成功' : '已有达人添加成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// 达人详情和更�?
// ============================================

/**
 * 获取达人详情
 * GET /brand-influencers/:id
 */
router.get(
    '/:id',
    [param('id').isUUID().withMessage('无效的ID')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const { id } = req.params;

            const result = await brandInfluencerService.getBrandInfluencerById(id, brandId);

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
 * 更新达人信息（品牌自定义�?
 * PATCH /brand-influencers/:id
 */
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('无效的ID'),
        body('tags').optional().isArray(),
        body('notes').optional().isString().trim(),
        body('categories').optional().isArray(),
        body('groupId').optional(),
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const { id } = req.params;
            const { tags, notes, categories, groupId } = req.body;

            const result = await brandInfluencerService.updateBrandInfluencer(id, brandId, {
                tags,
                notes,
                categories,
                groupId,
            });

            res.json({
                success: true,
                data: result,
                message: '达人信息更新成功',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 删除达人（取消关联）
 * DELETE /brand-influencers/:id
 */
router.delete(
    '/:id',
    [param('id').isUUID().withMessage('无效的ID')],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brandId = req.user!.brandId!;
            const { id } = req.params;

            await brandInfluencerService.removeBrandInfluencer(id, brandId);

            res.json({
                success: true,
                message: '达人已移�?,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
