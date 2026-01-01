import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import multer from 'multer';
import * as influencerService from '../services/influencer.service';
import * as importService from '../services/import.service';
import { authenticate, requireFactoryMember } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse, Platform, PipelineStage } from '@ics/shared';

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
  body('phone').optional().trim(),
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
  body('phone').optional().trim(),
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
 */
router.get(
  '/',
  authenticate,
  requireFactoryMember,
  listInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
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

      const result = await influencerService.list(factoryId, filter, { page, pageSize });

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
  authenticate,
  requireFactoryMember,
  checkDuplicateValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { phone, platform, platformId } = req.query;

      const result = await influencerService.checkDuplicate(
        factoryId,
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
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const tags = await influencerService.getAllTags(factoryId);

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
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const categories = await influencerService.getAllCategories(factoryId);

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
  authenticate,
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const influencer = await influencerService.getById(req.params.id, factoryId);

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
 * @route POST /api/influencers
 * @desc Create a new influencer
 * @access Private (Factory Member)
 */
router.post(
  '/',
  authenticate,
  requireFactoryMember,
  createInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { nickname, platform, platformId, phone, categories, tags, notes } = req.body;

      const influencer = await influencerService.create({
        factoryId,
        nickname,
        platform,
        platformId,
        phone,
        categories,
        tags,
        notes,
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
 */
router.put(
  '/:id',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  updateInfluencerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { nickname, platform, platformId, phone, categories, tags, notes } = req.body;

      const influencer = await influencerService.update(req.params.id, factoryId, {
        nickname,
        platform,
        platformId,
        phone,
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
 */
router.delete(
  '/:id',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      await influencerService.remove(req.params.id, factoryId);

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
  authenticate,
  requireFactoryMember,
  idParamValidation,
  tagsValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { tags } = req.body;

      const influencer = await influencerService.addTags(req.params.id, factoryId, tags);

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
  authenticate,
  requireFactoryMember,
  idParamValidation,
  tagsValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { tags } = req.body;

      const influencer = await influencerService.removeTags(req.params.id, factoryId, tags);

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
  authenticate,
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
  authenticate,
  requireFactoryMember,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
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
        factoryId
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
  authenticate,
  requireFactoryMember,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
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
        factoryId,
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

export default router;
