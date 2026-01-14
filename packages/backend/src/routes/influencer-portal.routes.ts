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
    query('brandId').optional().isUUID().withMessage('工厂ID格式不正确'),
    query('receivedStatus').optional().isIn(['PENDING', 'RECEIVED', 'LOST']).withMessage('签收状态不正确'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const filter = {
        brandId: req.query.brandId as string | undefined,
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
    query('brandId').optional().isUUID().withMessage('工厂ID格式不正确'),
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
        brandId: req.query.brandId as string | undefined,
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

// ============================================
// 认领相关路由
// ============================================

/**
 * GET /api/influencer-portal/claims/pending
 * 获取待认领记录
 */
router.get(
  '/claims/pending',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const { getPendingClaims } = await import('../services/influencer-claim.service');
      const claims = await getPendingClaims(accountId);

      res.json({
        success: true,
        data: claims,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/claims/count
 * 获取待认领数量（用于徽标）
 */
router.get(
  '/claims/count',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const { getPendingClaimCount } = await import('../services/influencer-claim.service');
      const count = await getPendingClaimCount(accountId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/claims/:id/confirm
 * 确认认领
 */
router.post(
  '/claims/:id/confirm',
  [
    param('id').isUUID().withMessage('记录ID格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const influencerId = req.params.id;
      const { confirmClaim } = await import('../services/influencer-claim.service');

      await confirmClaim(accountId, influencerId);

      res.json({
        success: true,
        message: '认领成功',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/influencer-portal/claims/:id
 * 取消认领
 */
router.delete(
  '/claims/:id',
  [
    param('id').isUUID().withMessage('记录ID格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const influencerId = req.params.id;
      const { cancelClaim } = await import('../services/influencer-claim.service');

      await cancelClaim(accountId, influencerId);

      res.json({
        success: true,
        message: '已取消认领',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/claims/claimed
 * 获取已认领记录
 */
router.get(
  '/claims/claimed',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const { getClaimedInfluencers } = await import('../services/influencer-claim.service');
      const claimed = await getClaimedInfluencers(accountId);

      res.json({
        success: true,
        data: claimed,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

