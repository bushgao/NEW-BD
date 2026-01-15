import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as platformService from '../services/platform.service';
import { authenticate, requirePlatformAdmin } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse, BrandStatus, PlanType } from '@ics/shared';

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
      const status = req.query.status as BrandStatus | undefined;
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
 * @route GET /api/platform/factories/:brandId
 * @desc 获取工厂详情
 * @access Platform Admin
 */
router.get(
  '/factories/:brandId',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factory = await platformService.getFactoryById(req.params.brandId);

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
 * @route POST /api/platform/factories/:brandId/review
 * @desc 审核工厂入驻申请
 * @access Platform Admin
 */
router.post(
  '/factories/:brandId/review',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('状态必须为 APPROVED 或 REJECTED'),
    body('reason').optional().isString().withMessage('原因必须为字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, reason } = req.body;
      const factory = await platformService.reviewFactory(
        req.params.brandId,
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
 * @route PUT /api/platform/factories/:brandId
 * @desc 更新工厂信息
 * @access Platform Admin
 */
router.put(
  '/factories/:brandId',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
    body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).withMessage('无效的状态'),
    body('planType').optional().isIn(['FREE', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    body('staffLimit').optional().isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    body('influencerLimit').optional().isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, planType, staffLimit, influencerLimit } = req.body;
      const factory = await platformService.updateFactory(req.params.brandId, {
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
 * @route POST /api/platform/factories/:brandId/toggle-status
 * @desc 暂停/恢复工厂
 * @access Platform Admin
 */
router.post(
  '/factories/:brandId/toggle-status',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
    body('suspend').isBoolean().withMessage('suspend 必须为布尔值'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { suspend } = req.body;
      const factory = await platformService.toggleBrandStatus(
        req.params.brandId,
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

/**
 * @route DELETE /api/platform/factories/:brandId
 * @desc 删除品牌
 * @access Platform Admin
 */
router.delete(
  '/factories/:brandId',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的品牌ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await platformService.deleteBrand(req.params.brandId);

      res.json({
        success: true,
        data: { message: '品牌已删除' },
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
 * @route GET /api/platform/factories/:brandId/quota
 * @desc 检查工厂配额
 * @access Platform Admin
 */
router.get(
  '/factories/:brandId/quota',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
    query('type').isIn(['staff', 'influencer']).withMessage('类型必须为 staff 或 influencer'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const quota = await platformService.checkFactoryQuota(
        req.params.brandId,
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

// ============ Factory Staff Management Routes ============

/**
 * @route GET /api/platform/factories/:brandId/staff
 * @desc 获取工厂的商务列表
 * @access Platform Admin
 */
router.get(
  '/factories/:brandId/staff',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的工厂ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const staff = await platformService.getBrandStaff(req.params.brandId);

      res.json({
        success: true,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/platform/staff/:staffId/stats
 * @desc 获取商务的工作统计
 * @access Platform Admin
 */
router.get(
  '/staff/:staffId/stats',
  authenticate,
  requirePlatformAdmin,
  [
    param('staffId').isUUID().withMessage('无效的商务ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const stats = await platformService.getStaffWorkStats(req.params.staffId);

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
 * @route GET /api/platform/staff/:staffId/influencers
 * @desc 获取商务添加的达人列表
 * @access Platform Admin
 */
router.get(
  '/staff/:staffId/influencers',
  authenticate,
  requirePlatformAdmin,
  [
    param('staffId').isUUID().withMessage('无效的商务ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await platformService.getStaffInfluencers(
        req.params.staffId,
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
 * @route GET /api/platform/staff/:staffId/collaborations
 * @desc 获取商务的合作列表
 * @access Platform Admin
 */
router.get(
  '/staff/:staffId/collaborations',
  authenticate,
  requirePlatformAdmin,
  [
    param('staffId').isUUID().withMessage('无效的商务ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await platformService.getStaffCollaborations(
        req.params.staffId,
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

// ============ Influencer Management Routes (Platform Admin) ============

/**
 * @route GET /api/platform/influencers
 * @desc 获取所有达人列表（平台级别）
 * @access Platform Admin
 */
router.get(
  '/influencers',
  authenticate,
  requirePlatformAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('keyword').optional().isString(),
    query('platform').optional().isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER']).withMessage('无效的平台'),
    query('brandId').optional().isUUID().withMessage('无效的工厂ID'),
    query('sourceType').optional().isIn(['PLATFORM', 'FACTORY', 'STAFF']).withMessage('无效的来源类型'),
    query('verificationStatus').optional().isIn(['UNVERIFIED', 'VERIFIED', 'REJECTED']).withMessage('无效的认证状态'),
    query('createdBy').optional().isUUID().withMessage('无效的用户ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = req.query.keyword as string | undefined;
      const platform = req.query.platform as string | undefined;
      const brandId = req.query.brandId as string | undefined;
      const sourceType = req.query.sourceType as any;
      const verificationStatus = req.query.verificationStatus as any;
      const createdBy = req.query.createdBy as string | undefined;

      const result = await platformService.listAllInfluencers(
        { keyword, platform, brandId, sourceType, verificationStatus, createdBy },
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
 * @route POST /api/platform/influencers
 * @desc 平台管理员创建达人（入库到指定品牌）
 * @access Platform Admin
 */
router.post(
  '/influencers',
  authenticate,
  requirePlatformAdmin,
  [
    body('brandId').isUUID().withMessage('请选择目标品牌'),
    body('nickname').trim().notEmpty().withMessage('达人昵称不能为空'),
    body('platform').isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'SHIPINHAO', 'WEIBO', 'BILIBILI', 'TAOBAO', 'OTHER']).withMessage('无效的平台'),
    body('platformId').trim().notEmpty().withMessage('平台账号ID不能为空'),
    body('uid').optional().isString(),
    body('homeUrl').optional().isString(),
    body('phone').optional().isString(),
    body('wechat').optional().isString(),
    body('followers').optional().isString(),
    body('tags').optional().isArray(),
    body('notes').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const {
        brandId,
        nickname,
        platform,
        platformId,
        uid,
        homeUrl,
        phone,
        wechat,
        followers,
        tags,
        notes,
      } = req.body;

      const adminId = req.user!.userId;

      const influencer = await platformService.createInfluencerForBrand({
        brandId,
        nickname,
        platform,
        platformId,
        uid,
        homeUrl,
        phone,
        wechat,
        followers,
        tags: tags || [],
        notes,
        createdBy: adminId,
        sourceType: 'PLATFORM',
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
 * @route GET /api/platform/influencers/:influencerId
 * @desc 获取达人详情（平台级别）
 * @access Platform Admin
 */
router.get(
  '/influencers/:influencerId',
  authenticate,
  requirePlatformAdmin,
  [
    param('influencerId').isUUID().withMessage('无效的达人ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const influencer = await platformService.getInfluencerDetail(req.params.influencerId);

      res.json({
        success: true,
        data: influencer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/influencers/:influencerId/verify
 * @desc 认证达人
 * @access Platform Admin
 */
router.post(
  '/influencers/:influencerId/verify',
  authenticate,
  requirePlatformAdmin,
  [
    param('influencerId').isUUID().withMessage('无效的达人ID'),
    body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('状态必须为 VERIFIED 或 REJECTED'),
    body('note').optional().isString().withMessage('备注必须为字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, note } = req.body;
      const adminId = req.user!.userId;

      const influencer = await platformService.verifyInfluencer(
        req.params.influencerId,
        adminId,
        status,
        note
      );

      res.json({
        success: true,
        data: influencer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/platform/influencers/stats
 * @desc 获取达人统计数据
 * @access Platform Admin
 */
router.get(
  '/influencers-stats',
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

      const stats = await platformService.getInfluencerStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ User Management Routes ============

/**
 * @route GET /api/platform/users
 * @desc 获取所有用户列表
 * @access Platform Admin
 */
router.get(
  '/users',
  authenticate,
  requirePlatformAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('search').optional().isString(),
    query('role').optional().isIn(['PLATFORM_ADMIN', 'BRAND', 'BUSINESS']).withMessage('无效的角色'),
    query('isActive').optional().isBoolean().withMessage('isActive 必须为布尔值'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const result = await platformService.listAllUsers(
        { search, role, isActive },
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

// ============ 独立商务管理 Routes ============
// 注意：此路由必须在 /users/:userId 之前定义，否则 independent 会被当作 userId

/**
 * @route GET /api/platform/users/independent
 * @desc 获取独立商务列表（不隶属任何品牌）
 * @access Platform Admin
 */
router.get(
  '/users/independent',
  authenticate,
  requirePlatformAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('keyword').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = req.query.keyword as string | undefined;

      const result = await platformService.getIndependentBusinessUsers(
        { page, pageSize },
        keyword
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
 * @route GET /api/platform/users/:userId
 * @desc 获取用户详情
 * @access Platform Admin
 */
router.get(
  '/users/:userId',
  authenticate,
  requirePlatformAdmin,
  [
    param('userId').isUUID().withMessage('无效的用户ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const user = await platformService.getUserDetail(req.params.userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/users/:userId/toggle-status
 * @desc 切换用户状态（启用/禁用）
 * @access Platform Admin
 */
router.post(
  '/users/:userId/toggle-status',
  authenticate,
  requirePlatformAdmin,
  [
    param('userId').isUUID().withMessage('无效的用户ID'),
    body('isActive').isBoolean().withMessage('isActive 必须为布尔值'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { isActive } = req.body;
      const adminId = req.user!.userId;

      await platformService.toggleUserStatus(
        req.params.userId,
        isActive,
        adminId
      );

      res.json({
        success: true,
        data: { message: isActive ? '用户已启用' : '用户已禁用' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/platform/users/:userId
 * @desc 删除用户
 * @access Platform Admin
 */
router.delete(
  '/users/:userId',
  authenticate,
  requirePlatformAdmin,
  [
    param('userId').isUUID().withMessage('无效的用户ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await platformService.deleteUser(req.params.userId);

      res.json({
        success: true,
        data: { message: '用户已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/platform/brands/:brandId/members
 * @desc 获取品牌成员列表（主账号+商务）
 * @access Platform Admin
 */
router.get(
  '/brands/:brandId/members',
  authenticate,
  requirePlatformAdmin,
  [
    param('brandId').isUUID().withMessage('无效的品牌ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const members = await platformService.getBrandMembers(req.params.brandId);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/platform/users/:userId/assign-brand
 * @desc 将独立商务划归到品牌
 * @access Platform Admin
 */
router.post(
  '/users/:userId/assign-brand',
  authenticate,
  requirePlatformAdmin,
  [
    param('userId').isUUID().withMessage('无效的用户ID'),
    body('brandId').isUUID().withMessage('无效的品牌ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { brandId } = req.body;

      await platformService.assignUserToBrand(
        req.params.userId,
        brandId
      );

      res.json({
        success: true,
        data: { message: '商务已成功划归到品牌' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/platform/influencers/:influencerId
 * @desc 删除达人（平台管理员）
 * @access Platform Admin
 */
router.delete(
  '/influencers/:influencerId',
  authenticate,
  requirePlatformAdmin,
  [
    param('influencerId').isUUID().withMessage('无效的达人ID'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await platformService.deleteInfluencer(req.params.influencerId);

      res.json({
        success: true,
        data: { message: '达人已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


