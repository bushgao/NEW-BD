import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as collaborationService from '../services/collaboration.service';
import { authenticate, requireFactoryMember } from '../middleware/auth.middleware';
import { checkPermission, filterByPermission } from '../middleware/permission.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse } from '@ics/shared';
import type { PipelineStage, BlockReason } from '@prisma/client';

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
const createCollaborationValidation = [
  body('influencerId').isUUID().withMessage('无效的达人 ID'),
  body('stage')
    .optional()
    .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
    .withMessage('无效的阶段状态'),
  body('deadline').optional().isISO8601().withMessage('无效的截止时间格式'),
  body('notes').optional().trim(),
];

const updateStageValidation = [
  body('stage')
    .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
    .withMessage('无效的阶段状态'),
  body('notes').optional().trim(),
];

const setDeadlineValidation = [
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('无效的截止时间格式'),
];

const setBlockReasonValidation = [
  body('reason')
    .optional({ nullable: true })
    .isIn(['PRICE_HIGH', 'DELAYED', 'UNCOOPERATIVE', 'OTHER', null])
    .withMessage('无效的卡点原因'),
  body('notes').optional().trim(),
];

const addFollowUpValidation = [
  body('content').trim().notEmpty().withMessage('跟进内容不能为空'),
];

const idParamValidation = [
  param('id').isUUID().withMessage('无效的 ID'),
];

const validateDataValidation = [
  body('type')
    .isIn(['collaboration', 'dispatch', 'result'])
    .withMessage('无效的数据类型'),
  body('data').isObject().withMessage('数据必须是对象'),
];


// ==================== 合作记录路由 ====================

/**
 * @route GET /api/collaborations
 * @desc 获取合作记录列表
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的合作记录
 */
router.get(
  '/',
  authenticate,
  requireFactoryMember,
  filterByPermission('dataVisibility.viewOthersCollaborations'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const filter: collaborationService.CollaborationFilter = {
        stage: req.query.stage as PipelineStage | undefined,
        businessStaffId: req.query.businessStaffId as string | undefined,
        influencerId: req.query.influencerId as string | undefined,
        isOverdue: req.query.isOverdue === 'true' ? true : 
                   req.query.isOverdue === 'false' ? false : undefined,
        keyword: req.query.keyword as string | undefined,
      };

      const result = await collaborationService.listCollaborations(
        factoryId,
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
 * @route GET /api/collaborations/pipeline
 * @desc 获取管道视图数据
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的合作记录
 */
router.get(
  '/pipeline',
  authenticate,
  requireFactoryMember,
  filterByPermission('dataVisibility.viewOthersCollaborations'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const filter = {
        businessStaffId: req.query.businessStaffId as string | undefined,
        keyword: req.query.keyword as string | undefined,
      };

      const pipelineView = await collaborationService.getPipelineView(
        factoryId, 
        filter,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data: pipelineView,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/stats
 * @desc 获取管道统计数据
 * @access Private (工厂成员)
 */
router.get(
  '/stats',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const stats = await collaborationService.getPipelineStats(factoryId);

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
 * @route GET /api/collaborations/overdue
 * @desc 获取超期合作列表
 * @access Private (工厂成员)
 */
router.get(
  '/overdue',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await collaborationService.getOverdueCollaborations(
        factoryId,
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
 * @route GET /api/collaborations/follow-up-templates
 * @desc 获取跟进模板列表
 * @access Private (工厂成员)
 */
router.get(
  '/follow-up-templates',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const templates = await collaborationService.getFollowUpTemplates();

      res.json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/suggestions
 * @desc 获取智能建议（样品、报价、排期）
 * @access Private (工厂成员)
 */
router.get(
  '/suggestions',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const influencerId = req.query.influencerId as string;
      const type = req.query.type as 'sample' | 'price' | 'schedule';

      if (!influencerId) {
        throw createBadRequestError('缺少达人ID参数');
      }

      if (!type || !['sample', 'price', 'schedule'].includes(type)) {
        throw createBadRequestError('无效的建议类型，必须是 sample、price 或 schedule');
      }

      const suggestions = await collaborationService.getCollaborationSuggestions(
        factoryId,
        influencerId,
        type
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/follow-up-reminders
 * @desc 获取跟进提醒列表
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的提醒
 */
router.get(
  '/follow-up-reminders',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const reminders = await collaborationService.getFollowUpReminders(
        factoryId,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data: reminders,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/follow-up-analytics
 * @desc 获取跟进分析数据
 * @access Private (工厂成员)
 */
router.get(
  '/follow-up-analytics',
  authenticate,
  requireFactoryMember,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const staffId = req.query.staffId as string | undefined;
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';

      const analytics = await collaborationService.getFollowUpAnalytics(
        factoryId,
        staffId,
        period
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/:id
 * @desc 获取合作记录详情
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
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const collaboration = await collaborationService.getCollaborationById(
        req.params.id,
        factoryId
      );

      res.json({
        success: true,
        data: { collaboration },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/collaborations
 * @desc 创建合作记录
 * @access Private (商务人员)
 * @permission operations.manageCollaborations - 需要合作管理权限
 */
router.post(
  '/',
  authenticate,
  requireFactoryMember,
  checkPermission('operations.manageCollaborations'),
  createCollaborationValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      const businessStaffId = req.user!.userId;

      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { influencerId, stage, deadline, notes } = req.body;

      const collaboration = await collaborationService.createCollaboration({
        influencerId,
        factoryId,
        businessStaffId,
        stage,
        deadline: deadline ? new Date(deadline) : undefined,
        notes,
      });

      res.status(201).json({
        success: true,
        data: { collaboration },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/collaborations/:id
 * @desc 删除合作记录
 * @access Private (工厂成员)
 * @permission operations.deleteCollaborations - 需要删除合作记录权限
 */
router.delete(
  '/:id',
  authenticate,
  requireFactoryMember,
  checkPermission('operations.deleteCollaborations'),
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      await collaborationService.deleteCollaboration(req.params.id, factoryId);

      res.json({
        success: true,
        data: { message: '合作记录已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 阶段状态路由 ====================

/**
 * @route PUT /api/collaborations/:id/stage
 * @desc 更新合作阶段
 * @access Private (商务人员)
 */
router.put(
  '/:id/stage',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  updateStageValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { stage, notes } = req.body;

      const collaboration = await collaborationService.updateStage(
        req.params.id,
        factoryId,
        stage as PipelineStage,
        notes
      );

      res.json({
        success: true,
        data: { collaboration },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/collaborations/:id/history
 * @desc 获取阶段变更历史
 * @access Private (工厂成员)
 */
router.get(
  '/:id/history',
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

      const history = await collaborationService.getStageHistory(req.params.id, factoryId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }
);


// ==================== 截止时间路由 ====================

/**
 * @route PUT /api/collaborations/:id/deadline
 * @desc 设置截止时间
 * @access Private (商务人员)
 */
router.put(
  '/:id/deadline',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  setDeadlineValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { deadline } = req.body;

      const collaboration = await collaborationService.setDeadline(
        req.params.id,
        factoryId,
        deadline ? new Date(deadline) : null
      );

      res.json({
        success: true,
        data: { collaboration },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 卡点原因路由 ====================

/**
 * @route PUT /api/collaborations/:id/block-reason
 * @desc 设置卡点原因
 * @access Private (商务人员)
 */
router.put(
  '/:id/block-reason',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  setBlockReasonValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { reason, notes } = req.body;

      const collaboration = await collaborationService.setBlockReason(
        req.params.id,
        factoryId,
        reason as BlockReason | null,
        notes
      );

      res.json({
        success: true,
        data: { collaboration },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 跟进记录路由 ====================

/**
 * @route GET /api/collaborations/:id/follow-ups
 * @desc 获取跟进记录列表
 * @access Private (工厂成员)
 */
router.get(
  '/:id/follow-ups',
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

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await collaborationService.getFollowUps(
        req.params.id,
        factoryId,
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
 * @route POST /api/collaborations/:id/follow-ups
 * @desc 添加跟进记录
 * @access Private (商务人员)
 */
router.post(
  '/:id/follow-ups',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  addFollowUpValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      const userId = req.user!.userId;

      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { content } = req.body;

      const followUp = await collaborationService.addFollowUp(
        req.params.id,
        factoryId,
        userId,
        content
      );

      res.status(201).json({
        success: true,
        data: { followUp },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/collaborations/:id/follow-up/quick
 * @desc 快速跟进（支持图片上传）
 * @access Private (商务人员)
 */
router.post(
  '/:id/follow-up/quick',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      const userId = req.user!.userId;

      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      // For now, we'll handle this as a simple text follow-up
      // In a production environment, you would use multer or similar for file uploads
      const { content, images } = req.body;

      if (!content || !content.trim()) {
        throw createBadRequestError('跟进内容不能为空');
      }

      const followUp = await collaborationService.addFollowUp(
        req.params.id,
        factoryId,
        userId,
        content.trim()
      );

      res.status(201).json({
        success: true,
        data: { followUp },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/collaborations/batch-update
 * @desc 批量更新合作记录
 * @access Private (商务人员)
 * @permission operations.manageCollaborations - 需要合作管理权限
 */
router.post(
  '/batch-update',
  authenticate,
  requireFactoryMember,
  checkPermission('operations.manageCollaborations'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;

      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { ids, operation, data } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw createBadRequestError('请选择要操作的合作记录');
      }

      if (!operation) {
        throw createBadRequestError('请指定操作类型');
      }

      if (!['dispatch', 'updateStage', 'setDeadline'].includes(operation)) {
        throw createBadRequestError('不支持的操作类型');
      }

      const result = await collaborationService.batchUpdateCollaborations(factoryId, {
        ids,
        operation,
        data,
      });

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
 * @route POST /api/collaborations/validate
 * @desc 验证合作数据
 * @access Private (工厂成员)
 */
router.post(
  '/validate',
  authenticate,
  requireFactoryMember,
  validateDataValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { type, data } = req.body;

      const result = await collaborationService.validateData(factoryId, type, data);

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
