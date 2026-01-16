import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import multer from 'multer';
import * as influencerService from '../services/influencer.service';
import * as importService from '../services/import.service';
import { authenticate, requireFactoryMember, enrichUserData } from '../middleware/auth.middleware';
import { checkPermission, filterByPermission } from '../middleware/permission.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse, Platform, PipelineStage } from '@ics/shared';
import influencerGroupRoutes from './influencer-group.routes';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 Excel (.xlsx, .xls) 或 CSV 文件'));
    }
  },
});

const router = Router();

// Mount group routes
router.use('/groups', influencerGroupRoutes);

// Validation middleware
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    throw createBadRequestError(errorMessages, errors.array());
  }
  next();
};

// Validation rules
const createInfluencerValidation = [
  body('nickname').trim().notEmpty().withMessage('请输入达人昵称'),
  body('platform')
    .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
    .withMessage('无效的平台类型'),
  body('platformId').trim().notEmpty().withMessage('请输入平台账号ID'),
  body('uid').optional().trim(),
  body('homeUrl').optional().trim(),
  body('phone').optional().trim(),
  body('wechat').optional().trim(),
  body('shippingAddress').optional().trim(),
  body('followers').optional().trim(),
  body('categories').optional().isArray().withMessage('类目必须是数组'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('notes').optional().trim(),
];

const updateInfluencerValidation = [
  body('nickname').optional().trim().notEmpty().withMessage('达人昵称不能为空'),
  body('platform')
    .optional()
    .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
    .withMessage('无效的平台类型'),
  body('platformId').optional().trim().notEmpty().withMessage('平台账号ID不能为空'),
  body('uid').optional().trim(),
  body('homeUrl').optional().trim(),
  body('phone').optional().trim(),
  body('wechat').optional().trim(),
  body('shippingAddress').optional().trim(),
  body('followers').optional().trim(),
  body('categories').optional().isArray().withMessage('类目必须是数组'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('notes').optional().trim(),
];

const listInfluencerValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('keyword').optional().trim(),
  query('platform')
    .optional()
    .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
    .withMessage('无效的平台类型'),
  query('category').optional().trim(),
  query('tags').optional(),
  query('pipelineStage')
    .optional()
    .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
    .withMessage('无效的管道阶段'),
  query('businessStaffId').optional().isUUID().withMessage('无效的商务ID'),
];

const checkDuplicateValidation = [
  query('phone').optional().trim(),
  query('platform')
    .optional()
    .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
    .withMessage('无效的平台类型'),
  query('platformId').optional().trim(),
];

const tagsValidation = [
  body('tags').isArray({ min: 1 }).withMessage('请提供至少一个标签'),
  body('tags.*').isString().trim().notEmpty().withMessage('标签不能为空'),
];

const idParamValidation = [
  param('id').isUUID().withMessage('无效的达人ID'),
];

/**
 * @route GET /api/influencers
 * @desc List influencers with filtering and pagination
 * @access Private (Factory Member)
 * @permission dataVisibility.viewOthersInfluencers - 如果没有此权限，只能看到自己创建的达人
 */

// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(authenticate);
router.use(enrichUserData);

router.get(
  '/',
  requireFactoryMember,
  filterByPermission('dataVisibility.viewOthersInfluencers'),
  listInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      // Parse tags from query string
      let tags: string[] | undefined;
      if (req.query.tags) {
        tags = Array.isArray(req.query.tags)
          ? (req.query.tags as string[])
          : [req.query.tags as string];
      }

      const filter = {
        keyword: req.query.keyword as string | undefined,
        platform: req.query.platform as Platform | undefined,
        category: req.query.category as string | undefined,
        tags,
        pipelineStage: req.query.pipelineStage as PipelineStage | undefined,
        businessStaffId: req.query.businessStaffId as string | undefined,
      };

      const result = await influencerService.list(
        brandId,
        filter,
        { page, pageSize },
        req.user!.userId,
        req.user!.role
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
 * @route GET /api/influencers/check-duplicate
 * @desc Check for duplicate influencer
 * @access Private (Factory Member)
 */
router.get(
  '/check-duplicate',
  requireFactoryMember,
  checkDuplicateValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { phone, platform, platformId } = req.query;

      const result = await influencerService.checkDuplicate(
        brandId,
        phone as string | undefined,
        platform as Platform | undefined,
        platformId as string | undefined
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
 * @route GET /api/influencers/tags
 * @desc Get all unique tags in factory
 * @access Private (Factory Member)
 */
router.get(
  '/tags',
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const tags = await influencerService.getAllTags(brandId);

      res.json({
        success: true,
        data: { tags },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/influencers/categories
 * @desc Get all unique categories in factory
 * @access Private (Factory Member)
 */
router.get(
  '/categories',
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const categories = await influencerService.getAllCategories(brandId);

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/influencers/:id
 * @desc Get influencer by ID
 * @access Private (Factory Member)
 */
router.get(
  '/:id',
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const influencer = await influencerService.getById(req.params.id, brandId);

      res.json({
        success: true,
        data: { influencer },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/influencers/from-global
 * @desc 从全局达人池拉入达人到品牌库
 * @access Private (Factory Member)
 */
router.post(
  '/from-global',
  requireFactoryMember,
  [
    body('globalInfluencerId').isUUID().withMessage('无效的全局达人ID'),
    body('nickname').trim().notEmpty().withMessage('请输入达人昵称'),
    body('phone').optional().trim(),
    body('wechat').optional().trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { globalInfluencerId, nickname, phone, wechat } = req.body;

      // 创建品牌达人记录，关联全局达人
      const influencer = await influencerService.createFromGlobalPool({
        brandId,
        globalInfluencerId,
        nickname,
        phone,
        wechat,
        userId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        data: influencer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/influencers
 * @desc Create a new influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.post(
  '/',
  requireFactoryMember,
  checkPermission('operations.manageInfluencers'),
  createInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, categories, tags, notes } = req.body;

      const influencer = await influencerService.create({
        brandId,
        nickname,
        platform,
        platformId,
        uid,
        homeUrl,
        phone,
        wechat,
        followers,
        categories,
        tags,
        notes,
        userId: req.user!.userId, // 记录添加人ID用于来源追踪
      });

      res.status(201).json({
        success: true,
        data: { influencer },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/influencers/:id
 * @desc Update influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.put(
  '/:id',
  requireFactoryMember,
  checkPermission('operations.manageInfluencers'),
  idParamValidation,
  updateInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, categories, tags, notes } = req.body;

      const influencer = await influencerService.update(req.params.id, brandId, {
        nickname,
        platform,
        platformId,
        uid,
        homeUrl,
        phone,
        wechat,
        followers,
        categories,
        tags,
        notes,
      });

      res.json({
        success: true,
        data: { influencer },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/influencers/:id
 * @desc Delete influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.delete(
  '/:id',
  requireFactoryMember,
  checkPermission('operations.manageInfluencers'),
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      await influencerService.remove(req.params.id, brandId);

      res.json({
        success: true,
        data: { message: '达人已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/influencers/:id/tags
 * @desc Add tags to influencer
 * @access Private (Factory Member)
 */
router.post(
  '/:id/tags',
  requireFactoryMember,
  idParamValidation,
  tagsValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { tags } = req.body;

      const influencer = await influencerService.addTags(req.params.id, brandId, tags);

      res.json({
        success: true,
        data: { influencer },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/influencers/:id/tags
 * @desc Remove tags from influencer
 * @access Private (Factory Member)
 */
router.delete(
  '/:id/tags',
  requireFactoryMember,
  idParamValidation,
  tagsValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { tags } = req.body;

      const influencer = await influencerService.removeTags(req.params.id, brandId, tags);

      res.json({
        success: true,
        data: { influencer },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Import Routes ====================

/**
 * @route POST /api/influencers/import/parse
 * @desc Parse uploaded file and return headers for mapping
 * @access Private (Factory Member)
 */
router.post(
  '/import/parse',
  requireFactoryMember,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      if (!req.file) {
        throw createBadRequestError('请上传文件');
      }

      const { headers } = importService.parseFile(req.file.buffer);
      const suggestedMapping = importService.suggestMapping(headers);

      res.json({
        success: true,
        data: {
          headers,
          suggestedMapping,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/influencers/import/preview
 * @desc Preview import with validation and duplicate checking
 * @access Private (Factory Member)
 */
router.post(
  '/import/preview',
  requireFactoryMember,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      if (!req.file) {
        throw createBadRequestError('请上传文件');
      }

      // Parse mapping from body
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
      if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
        throw createBadRequestError('请提供字段映射（昵称、平台、平台账号ID为必填）');
      }

      const result = await importService.previewImport(
        req.file.buffer,
        mapping,
        brandId
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
 * @route POST /api/influencers/import/execute
 * @desc Execute batch import
 * @access Private (Factory Member)
 */
router.post(
  '/import/execute',
  requireFactoryMember,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      if (!req.file) {
        throw createBadRequestError('请上传文件');
      }

      // Parse mapping from body
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
      if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
        throw createBadRequestError('请提供字段映射（昵称、平台、平台账号ID为必填）');
      }

      const skipDuplicates = req.body.skipDuplicates !== 'false';

      const result = await importService.executeImport(
        req.file.buffer,
        mapping,
        brandId,
        skipDuplicates
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
 * @route GET /api/influencers/recommendations
 * @desc Get smart influencer recommendations
 * @access Private (Factory Member)
 */
router.get(
  '/recommendations',
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      const userId = req.user!.userId;

      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      // Get recommendations based on:
      // 1. Historical collaborations (influencers with successful past collaborations)
      // 2. High ROI influencers
      // 3. Recently contacted influencers

      const recommendations = await influencerService.getSmartRecommendations(brandId, userId);

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/influencers/batch/tags
 * @desc Batch add tags to influencers
 * @access Private (Factory Member)
 */
router.post(
  '/batch/tags',
  requireFactoryMember,
  checkPermission('operations.batchOperations'),
  [
    body('influencerIds').isArray().withMessage('达人ID列表必须是数组'),
    body('influencerIds.*').isUUID().withMessage('无效的达人ID'),
    body('tags').isArray().withMessage('标签列表必须是数组'),
    body('tags.*').isString().withMessage('标签必须是字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      const { influencerIds, tags } = req.body;

      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      // Verify all influencers belong to the factory
      const influencers = await influencerService.getInfluencersByIds(influencerIds, brandId);

      if (influencers.length !== influencerIds.length) {
        throw createBadRequestError('部分达人不存在或不属于当前工厂');
      }

      // Add tags to all influencers
      await influencerService.batchAddTags(influencerIds, tags);

      res.json({
        success: true,
        data: {
          message: `已为 ${influencerIds.length} 个达人添加标签`,
          count: influencerIds.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/influencers/:id/collaboration-history
 * @desc Get influencer collaboration history
 * @access Private (Factory Member)
 */
router.get(
  '/:id/collaboration-history',
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const history = await influencerService.getCollaborationHistory(
        req.params.id,
        brandId
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/influencers/:id/roi-stats
 * @desc Get influencer ROI statistics
 * @access Private (Factory Member)
 */
router.get(
  '/:id/roi-stats',
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const stats = await influencerService.getROIStats(
        req.params.id,
        brandId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/influencers/:id/group
 * @desc Move influencer to group
 * @access Private (Factory Member)
 */
router.put(
  '/:id/group',
  requireFactoryMember,
  idParamValidation,
  [body('groupId').optional().isUUID().withMessage('无效的分组ID')],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { groupId } = req.body;

      // Import group service
      const groupService = await import('../services/influencer-group.service');
      await groupService.moveInfluencerToGroup(req.params.id, groupId || null, brandId);

      res.json({
        success: true,
        data: { message: '达人已移动到分组' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
