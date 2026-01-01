import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as platformService from '../services/platform.service';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse, FactoryStatus, PlanType } from '@ics/shared';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw createBadRequestError(errorMessages, errors.array());
  }
  next();
};

// ============ Factory Management Routes ============

/**
 * @route GET /api/platform/factories
 * @desc 获取工厂列表
 * @access Platform Admin
 */
router.get(
  '/factories',
  authenticate,
  requirePlatformAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).withMessage('无效的状态'),
    query('planType').optional().isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    query('keyword').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as FactoryStatus | undefined;
      const planType = req.query.planType as PlanType | undefined;
      const keyword = req.query.keyword as string | undefined;

      const result = await platformService.listFactories(
        { status, planType, keyword },
        { page, pageSize }
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
 * @route GET /api/platform/factories/:factoryId
 * @desc 获取工厂详情
 * @access Platform Admin
 */
router.get(
  '/factories/:factoryId',
  authenticate,
  requirePlatformAdmin,
  [
    param('factoryId').isUUID().withMessage('无效的工厂ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factory = await platformService.getFactoryById(req.params.factoryId);

      res.json({
        success: true,
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/factories/:factoryId/review
 * @desc 审核工厂入驻申请
 * @access Platform Admin
 */
router.post(
  '/factories/:factoryId/review',
  authenticate,
  requirePlatformAdmin,
  [
    param('factoryId').isUUID().withMessage('无效的工厂ID'),
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('状态必须为 APPROVED 或 REJECTED'),
    body('reason').optional().isString().withMessage('原因必须为字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, reason } = req.body;
      const factory = await platformService.reviewFactory(
        req.params.factoryId,
        status,
        reason
      );

      res.json({
        success: true,
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/platform/factories/:factoryId
 * @desc 更新工厂信息
 * @access Platform Admin
 */
router.put(
  '/factories/:factoryId',
  authenticate,
  requirePlatformAdmin,
  [
    param('factoryId').isUUID().withMessage('无效的工厂ID'),
    body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).withMessage('无效的状态'),
    body('planType').optional().isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    body('staffLimit').optional().isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    body('influencerLimit').optional().isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, planType, staffLimit, influencerLimit } = req.body;
      const factory = await platformService.updateFactory(req.params.factoryId, {
        status,
        planType,
        staffLimit,
        influencerLimit,
      });

      res.json({
        success: true,
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/factories/:factoryId/toggle-status
 * @desc 暂停/恢复工厂
 * @access Platform Admin
 */
router.post(
  '/factories/:factoryId/toggle-status',
  authenticate,
  requirePlatformAdmin,
  [
    param('factoryId').isUUID().withMessage('无效的工厂ID'),
    body('suspend').isBoolean().withMessage('suspend 必须为布尔值'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { suspend } = req.body;
      const factory = await platformService.toggleFactoryStatus(
        req.params.factoryId,
        suspend
      );

      res.json({
        success: true,
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ Plan Configuration Routes ============

/**
 * @route GET /api/platform/plans
 * @desc 获取所有套餐配置
 * @access Platform Admin
 */
router.get(
  '/plans',
  authenticate,
  requirePlatformAdmin,
  async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const plans = await platformService.listPlanConfigs();

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/platform/plans/:planType
 * @desc 获取单个套餐配置
 * @access Platform Admin
 */
router.get(
  '/plans/:planType',
  authenticate,
  requirePlatformAdmin,
  [
    param('planType').isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const plan = await platformService.getPlanConfig(req.params.planType as PlanType);

      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/plans
 * @desc 创建套餐配置
 * @access Platform Admin
 */
router.post(
  '/plans',
  authenticate,
  requirePlatformAdmin,
  [
    body('planType').isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    body('name').trim().notEmpty().withMessage('套餐名称不能为空'),
    body('staffLimit').isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    body('influencerLimit').isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
    body('dataRetentionDays').isInt({ min: 1 }).withMessage('数据保留天数必须为正整数'),
    body('price').isInt({ min: 0 }).withMessage('价格必须为非负整数'),
    body('features').isArray().withMessage('功能列表必须为数组'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const plan = await platformService.createPlanConfig(req.body);

      res.status(201).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/platform/plans/:planType
 * @desc 更新套餐配置
 * @access Platform Admin
 */
router.put(
  '/plans/:planType',
  authenticate,
  requirePlatformAdmin,
  [
    param('planType').isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    body('name').optional().trim().notEmpty().withMessage('套餐名称不能为空'),
    body('staffLimit').optional().isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    body('influencerLimit').optional().isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
    body('dataRetentionDays').optional().isInt({ min: 1 }).withMessage('数据保留天数必须为正整数'),
    body('price').optional().isInt({ min: 0 }).withMessage('价格必须为非负整数'),
    body('features').optional().isArray().withMessage('功能列表必须为数组'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const plan = await platformService.updatePlanConfig(
        req.params.planType as PlanType,
        req.body
      );

      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/platform/plans/:planType
 * @desc 删除套餐配置
 * @access Platform Admin
 */
router.delete(
  '/plans/:planType',
  authenticate,
  requirePlatformAdmin,
  [
    param('planType').isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await platformService.deletePlanConfig(req.params.planType as PlanType);

      res.json({
        success: true,
        data: { message: '套餐配置已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ Quota Check Routes ============

/**
 * @route GET /api/platform/factories/:factoryId/quota
 * @desc 检查工厂配额
 * @access Platform Admin
 */
router.get(
  '/factories/:factoryId/quota',
  authenticate,
  requirePlatformAdmin,
  [
    param('factoryId').isUUID().withMessage('无效的工厂ID'),
    query('type').isIn(['staff', 'influencer']).withMessage('类型必须为 staff 或 influencer'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const quota = await platformService.checkFactoryQuota(
        req.params.factoryId,
        req.query.type as 'staff' | 'influencer'
      );

      res.json({
        success: true,
        data: quota,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ Platform Statistics Routes ============

/**
 * @route GET /api/platform/stats
 * @desc 获取平台统计数据
 * @access Platform Admin
 */
router.get(
  '/stats',
  authenticate,
  requirePlatformAdmin,
  async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const stats = await platformService.getPlatformStats();

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
 * @route GET /api/platform/stats/detailed
 * @desc 获取平台详细统计数据
 * @access Platform Admin
 */
router.get(
  '/stats/detailed',
  authenticate,
  requirePlatformAdmin,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await platformService.getPlatformDetailedStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
