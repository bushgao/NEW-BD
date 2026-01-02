import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import * as reportService from '../services/report.service';

const router = Router();

// 验证请求中间件
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: errors.array(),
      },
    });
    return;
  }
  next();
};

// 所有报表路由需要认证
router.use(authenticate);

// ==================== 商务绩效统计 ====================

/**
 * GET /api/reports/staff-performance
 * 获取商务绩效报表
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
router.get(
  '/staff-performance',
  requireRoles('FACTORY_OWNER', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const dateRange = req.query.startDate && req.query.endDate
        ? {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
          }
        : undefined;

      const report = await reportService.getStaffPerformance(factoryId, dateRange);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 工厂看板数据 ====================

/**
 * GET /api/reports/dashboard
 * 获取工厂老板看板数据
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
router.get(
  '/dashboard',
  requireRoles('FACTORY_OWNER', 'PLATFORM_ADMIN'),
  [
    query('period').optional().isIn(['week', 'month']).withMessage('周期参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const period = (req.query.period as 'week' | 'month') || 'month';
      const dashboard = await reportService.getFactoryDashboard(factoryId, period);

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
 * GET /api/reports/my-dashboard
 * 获取商务人员个人看板数据
 */
router.get(
  '/my-dashboard',
  requireRoles('BUSINESS_STAFF', 'FACTORY_OWNER'),
  [
    query('period').optional().isIn(['week', 'month']).withMessage('周期参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      const staffId = req.user!.id;
      
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const period = (req.query.period as 'week' | 'month') || 'month';
      const dashboard = await reportService.getBusinessStaffDashboard(factoryId, staffId, period);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 报表导出 ====================

/**
 * GET /api/reports/export/staff-performance
 * 导出商务绩效报表（Excel）
 * Requirements: 6.5
 */
router.get(
  '/export/staff-performance',
  requireRoles('FACTORY_OWNER', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const dateRange = req.query.startDate && req.query.endDate
        ? {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
          }
        : undefined;

      const buffer = await reportService.exportStaffPerformanceReport(factoryId, dateRange);

      const filename = `商务绩效报表_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/export/roi
 * 导出ROI报表（Excel）
 */
router.get(
  '/export/roi',
  requireRoles('FACTORY_OWNER', 'PLATFORM_ADMIN'),
  [
    query('groupBy').isIn(['influencer', 'sample', 'staff', 'month']).withMessage('分组参数无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const groupBy = req.query.groupBy as 'influencer' | 'sample' | 'staff' | 'month';
      const dateRange = req.query.startDate && req.query.endDate
        ? {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
          }
        : undefined;

      const buffer = await reportService.exportRoiReport(factoryId, groupBy, dateRange);

      const groupByNames: Record<string, string> = {
        influencer: '按达人',
        sample: '按样品',
        staff: '按商务',
        month: '按月份',
      };
      const filename = `ROI报表_${groupByNames[groupBy]}_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/export/collaborations
 * 导出合作记录（Excel）
 */
router.get(
  '/export/collaborations',
  requireRoles('FACTORY_OWNER', 'BUSINESS_STAFF', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const dateRange = req.query.startDate && req.query.endDate
        ? {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
          }
        : undefined;

      const buffer = await reportService.exportCollaborationReport(factoryId, dateRange);

      const filename = `合作记录_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
