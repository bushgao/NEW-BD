import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as sampleService from '../services/sample.service';
import { authenticate, requireFactoryMember, requireRoles } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse } from '@ics/shared';
import type { ReceivedStatus, OnboardStatus } from '@prisma/client';

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
const createSampleValidation = [
  body('sku').trim().notEmpty().withMessage('请输入 SKU'),
  body('name').trim().notEmpty().withMessage('请输入样品名称'),
  body('unitCost').isInt({ min: 0 }).withMessage('单件成本必须是非负整数（分）'),
  body('retailPrice').isInt({ min: 0 }).withMessage('建议零售价必须是非负整数（分）'),
  body('canResend').optional().isBoolean().withMessage('是否可复寄必须是布尔值'),
  body('notes').optional().trim(),
];

const updateSampleValidation = [
  body('sku').optional().trim().notEmpty().withMessage('SKU 不能为空'),
  body('name').optional().trim().notEmpty().withMessage('样品名称不能为空'),
  body('unitCost').optional().isInt({ min: 0 }).withMessage('单件成本必须是非负整数（分）'),
  body('retailPrice').optional().isInt({ min: 0 }).withMessage('建议零售价必须是非负整数（分）'),
  body('canResend').optional().isBoolean().withMessage('是否可复寄必须是布尔值'),
  body('notes').optional().trim(),
];

const createDispatchValidation = [
  body('sampleId').isUUID().withMessage('无效的样品 ID'),
  body('collaborationId').isUUID().withMessage('无效的合作记录 ID'),
  body('quantity').isInt({ min: 1 }).withMessage('寄样数量必须是正整数'),
  body('shippingCost').isInt({ min: 0 }).withMessage('快递费必须是非负整数（分）'),
  body('trackingNumber').optional().trim(),
];

const updateDispatchStatusValidation = [
  body('receivedStatus')
    .optional()
    .isIn(['PENDING', 'RECEIVED', 'LOST'])
    .withMessage('无效的签收状态'),
  body('onboardStatus')
    .optional()
    .isIn(['UNKNOWN', 'ONBOARD', 'NOT_ONBOARD'])
    .withMessage('无效的上车状态'),
];

const idParamValidation = [
  param('id').isUUID().withMessage('无效的 ID'),
];

// ==================== 样品路由 ====================

/**
 * @route GET /api/samples
 * @desc 获取样品列表
 * @access Private (工厂成员)
 */
router.get(
  '/',
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
      const keyword = req.query.keyword as string | undefined;
      const canResend = req.query.canResend === 'true' ? true : 
                        req.query.canResend === 'false' ? false : undefined;

      const result = await sampleService.listSamples(
        factoryId,
        { keyword, canResend },
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
 * @route GET /api/samples/report
 * @desc 获取样品成本报表
 * @access Private (工厂老板)
 */
router.get(
  '/report',
  authenticate,
  requireFactoryMember,
  requireRoles('FACTORY_OWNER'),
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      let dateRange: sampleService.DateRange | undefined;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string),
        };
      }

      const report = await sampleService.getSampleCostReport(factoryId, dateRange);

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
 * @route GET /api/samples/:id
 * @desc 获取样品详情
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

      const sample = await sampleService.getSampleById(req.params.id, factoryId);

      res.json({
        success: true,
        data: { sample },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/samples
 * @desc 创建样品
 * @access Private (工厂老板)
 */
router.post(
  '/',
  authenticate,
  requireFactoryMember,
  requireRoles('FACTORY_OWNER'),
  createSampleValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { sku, name, unitCost, retailPrice, canResend, notes } = req.body;

      const sample = await sampleService.createSample({
        factoryId,
        sku,
        name,
        unitCost,
        retailPrice,
        canResend,
        notes,
      });

      res.status(201).json({
        success: true,
        data: { sample },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/samples/:id
 * @desc 更新样品
 * @access Private (工厂老板)
 */
router.put(
  '/:id',
  authenticate,
  requireFactoryMember,
  requireRoles('FACTORY_OWNER'),
  idParamValidation,
  updateSampleValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { sku, name, unitCost, retailPrice, canResend, notes } = req.body;

      const sample = await sampleService.updateSample(req.params.id, factoryId, {
        sku,
        name,
        unitCost,
        retailPrice,
        canResend,
        notes,
      });

      res.json({
        success: true,
        data: { sample },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/samples/:id
 * @desc 删除样品
 * @access Private (工厂老板)
 */
router.delete(
  '/:id',
  authenticate,
  requireFactoryMember,
  requireRoles('FACTORY_OWNER'),
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      await sampleService.deleteSample(req.params.id, factoryId);

      res.json({
        success: true,
        data: { message: '样品已删除' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 寄样记录路由 ====================

/**
 * @route GET /api/samples/dispatches
 * @desc 获取寄样记录列表
 * @access Private (工厂成员)
 */
router.get(
  '/dispatches/list',
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

      const filter = {
        sampleId: req.query.sampleId as string | undefined,
        collaborationId: req.query.collaborationId as string | undefined,
        businessStaffId: req.query.businessStaffId as string | undefined,
        receivedStatus: req.query.receivedStatus as ReceivedStatus | undefined,
        onboardStatus: req.query.onboardStatus as OnboardStatus | undefined,
      };

      const result = await sampleService.listDispatches(factoryId, filter, { page, pageSize });

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
 * @route GET /api/samples/dispatches/:id
 * @desc 获取寄样记录详情
 * @access Private (工厂成员)
 */
router.get(
  '/dispatches/:id',
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

      const dispatch = await sampleService.getDispatchById(req.params.id, factoryId);

      res.json({
        success: true,
        data: { dispatch },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/samples/dispatches
 * @desc 创建寄样记录
 * @access Private (商务人员)
 */
router.post(
  '/dispatches',
  authenticate,
  requireFactoryMember,
  createDispatchValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const businessStaffId = req.user!.userId;

      const { sampleId, collaborationId, quantity, shippingCost, trackingNumber } = req.body;

      const dispatch = await sampleService.createDispatch({
        sampleId,
        collaborationId,
        businessStaffId,
        quantity,
        shippingCost,
        trackingNumber,
      });

      res.status(201).json({
        success: true,
        data: { dispatch },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/samples/dispatches/:id/status
 * @desc 更新寄样状态
 * @access Private (商务人员)
 */
router.put(
  '/dispatches/:id/status',
  authenticate,
  requireFactoryMember,
  idParamValidation,
  updateDispatchStatusValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const { receivedStatus, onboardStatus } = req.body;

      const dispatch = await sampleService.updateDispatchStatus(req.params.id, factoryId, {
        receivedStatus,
        onboardStatus,
      });

      res.json({
        success: true,
        data: { dispatch },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
