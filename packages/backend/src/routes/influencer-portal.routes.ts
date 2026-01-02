/**
 * 达人端口路由 (Influencer Portal Routes)
 * 
 * 路由前缀: /api/influencer-portal
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';
import {
  getDashboard,
  getSamples,
  getCollaborations,
  getCollaborationDetail,
  confirmSampleReceived,
  getRelatedFactories,
} from '../services/influencer-portal.service';
import { influencerAuthenticate } from '../middleware/influencer-auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ReceivedStatus, PipelineStage } from '@prisma/client';

const router = Router();

// 所有路由都需要达人认证
router.use(influencerAuthenticate);

/**
 * 验证请求参数
 */
function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg).join(', ');
    throw createBadRequestError(errorMessages);
  }
  next();
}

/**
 * GET /api/influencer-portal/dashboard
 * 获取首页数据
 */
router.get(
  '/dashboard',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const dashboard = await getDashboard(accountId);
      
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/samples
 * 获取样品列表
 */
router.get(
  '/samples',
  [
    query('factoryId').optional().isUUID().withMessage('工厂ID格式不正确'),
    query('receivedStatus').optional().isIn(['PENDING', 'RECEIVED', 'LOST']).withMessage('签收状态不正确'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const filter = {
        factoryId: req.query.factoryId as string | undefined,
        receivedStatus: req.query.receivedStatus as ReceivedStatus | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      
      const samples = await getSamples(accountId, filter);
      
      res.json({
        success: true,
        data: samples,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/collaborations
 * 获取合作列表
 */
router.get(
  '/collaborations',
  [
    query('factoryId').optional().isUUID().withMessage('工厂ID格式不正确'),
    query('stage').optional().isIn([
      'LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'
    ]).withMessage('合作阶段不正确'),
    query('isOverdue').optional().isBoolean().withMessage('超期状态格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const filter = {
        factoryId: req.query.factoryId as string | undefined,
        stage: req.query.stage as PipelineStage | undefined,
        isOverdue: req.query.isOverdue === 'true' ? true : req.query.isOverdue === 'false' ? false : undefined,
      };
      
      const collaborations = await getCollaborations(accountId, filter);
      
      res.json({
        success: true,
        data: collaborations,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/collaborations/:id
 * 获取合作详情
 */
router.get(
  '/collaborations/:id',
  [
    param('id').isUUID().withMessage('合作ID格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const collabId = req.params.id;
      
      const detail = await getCollaborationDetail(accountId, collabId);
      
      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/samples/:id/confirm-received
 * 确认签收样品
 */
router.post(
  '/samples/:id/confirm-received',
  [
    param('id').isUUID().withMessage('寄样ID格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const dispatchId = req.params.id;
      
      const sample = await confirmSampleReceived(accountId, dispatchId);
      
      res.json({
        success: true,
        data: sample,
        message: '签收确认成功',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/factories
 * 获取关联的工厂列表（用于筛选）
 */
router.get(
  '/factories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const factories = await getRelatedFactories(accountId);
      
      res.json({
        success: true,
        data: factories,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
