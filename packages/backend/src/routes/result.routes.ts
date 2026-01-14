import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as resultService from '../services/result.service';
import { authenticate, requireFactoryMember, requireRoles } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse } from '@ics/shared';
import type { ContentType, ProfitStatus } from '@prisma/client';

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

// 验证规则
const createResultValidation = [
  body('collaborationId').isUUID().withMessage('无效的合作记录 ID'),
  body('contentType')
    .isIn(['SHORT_VIDEO', 'LIVE_STREAM'])
    .withMessage('内容类型必须是 SHORT_VIDEO 或 LIVE_STREAM'),
  body('publishedAt').isISO8601().withMessage('无效的发布时间格式'),
  body('salesQuantity').isInt({ min: 0 }).withMessage('销售件数必须是非负整数'),
  body('salesGmv').isInt({ min: 0 }).withMessage('销售GMV必须是非负整数（分）'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('佣金比例必须在0-100之间'),
  body('pitFee')
    .optional()
    .isInt({ min: 0 })
    .withMessage('坑位费必须是非负整数（分）'),
  body('actualCommission').isInt({ min: 0 }).withMessage('实付佣金必须是非负整数（分）'),
  body('willRepeat').isBoolean().withMessage('是否复投必须是布尔值'),
  body('notes').optional().trim(),
];

const updateResultValidation = [
  body('contentType')
    .optional()
    .isIn(['SHORT_VIDEO', 'LIVE_STREAM'])
    .withMessage('内容类型必须是 SHORT_VIDEO 或 LIVE_STREAM'),
  body('publishedAt').optional().isISO8601().withMessage('无效的发布时间格式'),
  body('salesQuantity').optional().isInt({ min: 0 }).withMessage('销售件数必须是非负整数'),
  body('salesGmv').optional().isInt({ min: 0 }).withMessage('销售GMV必须是非负整数（分）'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('佣金比例必须在0-100之间'),
  body('pitFee')
    .optional()
    .isInt({ min: 0 })
    .withMessage('坑位费必须是非负整数（分）'),
  body('actualCommission')
    .optional()
    .isInt({ min: 0 })
    .withMessage('实付佣金必须是非负整数（分）'),
  body('willRepeat').optional().isBoolean().withMessage('是否复投必须是布尔值'),
  body('notes').optional().trim(),
];

const idParamValidation = [
  param('id').isUUID().withMessage('无效的 ID'),
];


// ==================== 合作结果路由 ====================

/**
 * @route GET /api/results
 * @desc 获取合作结果列表
 * @access Private (工厂成员)
 */
router.get(
  '/',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const filter = {
        profitStatus: req.query.profitStatus as ProfitStatus | undefined,
        contentType: req.query.contentType as ContentType | undefined,
        businessStaffId: req.query.businessStaffId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await resultService.listResults(brandId, filter, { page, pageSize });

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
 * @route GET /api/results/stats
 * @desc 获取合作结果统计概览
 * @access Private (工厂老板)
 */
router.get(
  '/stats',
  authenticate,
  requireFactoryMember,
  requireRoles('BRAND'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      let dateRange: { startDate: Date; endDate: Date } | undefined;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string),
        };
      }

      const stats = await resultService.getResultStats(brandId, dateRange);

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
 * @route GET /api/results/report
 * @desc 获取 ROI 报表
 * @access Private (工厂老板)
 */
router.get(
  '/report',
  authenticate,
  requireFactoryMember,
  requireRoles('BRAND'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const groupBy = (req.query.groupBy as string) || 'influencer';
      if (!['influencer', 'sample', 'staff', 'month'].includes(groupBy)) {
        throw createBadRequestError('无效的分组维度');
      }

      const filter: resultService.RoiReportFilter = {
        groupBy: groupBy as 'influencer' | 'sample' | 'staff' | 'month',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const report = await resultService.getRoiReport(brandId, filter);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);


/**
 * @route GET /api/results/collaboration/:collaborationId
 * @desc 根据合作ID获取结果
 * @access Private (工厂成员)
 */
router.get(
  '/collaboration/:collaborationId',
  authenticate,
  requireFactoryMember,
  [param('collaborationId').isUUID().withMessage('无效的合作记录 ID')],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const result = await resultService.getResultByCollaborationId(
        req.params.collaborationId,
        brandId
      );

      res.json({
        success: true,
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/results/:id
 * @desc 获取合作结果详情
 * @access Private (工厂成员)
 */
router.get(
  '/:id',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const result = await resultService.getResultById(req.params.id, brandId);

      res.json({
        success: true,
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/results
 * @desc 录入合作结果
 * @access Private (商务人员)
 */
router.post(
  '/',
  authenticate,
  requireFactoryMember,
  createResultValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const {
        collaborationId,
        contentType,
        publishedAt,
        salesQuantity,
        salesGmv,
        commissionRate,
        pitFee,
        actualCommission,
        willRepeat,
        notes,
      } = req.body;

      const result = await resultService.createResult(
        {
          collaborationId,
          contentType,
          publishedAt: new Date(publishedAt),
          salesQuantity,
          salesGmv,
          commissionRate,
          pitFee,
          actualCommission,
          willRepeat,
          notes,
        },
        brandId
      );

      res.status(201).json({
        success: true,
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/results/:id
 * @desc 更新合作结果
 * @access Private (商务人员)
 */
router.put(
  '/:id',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  updateResultValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const {
        contentType,
        publishedAt,
        salesQuantity,
        salesGmv,
        commissionRate,
        pitFee,
        actualCommission,
        willRepeat,
        notes,
      } = req.body;

      const result = await resultService.updateResult(req.params.id, brandId, {
        contentType,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        salesQuantity,
        salesGmv,
        commissionRate,
        pitFee,
        actualCommission,
        willRepeat,
        notes,
      });

      res.json({
        success: true,
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
