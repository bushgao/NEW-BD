import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, requireRoles, enrichUserData } from '../middleware/auth.middleware';
import { checkPermission, checkStaffDataAccess } from '../middleware/permission.middleware';
import * as reportService from '../services/report.service';
import * as trendService from '../services/trend.service';
import prisma from '../lib/prisma';

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

// 所有报表路由需要认证，并自动补充brandId
router.use(authenticate);
router.use(enrichUserData);

// ==================== 商务绩效统计 ====================

/**
 * GET /api/reports/staff-performance
 * 获取商务绩效报表
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
router.get(
  '/staff-performance',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
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

      const report = await reportService.getStaffPerformance(brandId, dateRange);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 趋势数据 ====================

/**
 * GET /api/reports/dashboard/trends
 * 获取趋势数据
 * @permission advanced.viewCostData - 如果查看成本数据，需要此权限
 */
router.get(
  '/dashboard/trends',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('period').isIn(['week', 'month', 'quarter']).withMessage('周期参数无效'),
    query('dataType').isIn(['gmv', 'cost', 'roi']).withMessage('数据类型参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const period = req.query.period as 'week' | 'month' | 'quarter';
      const dataType = req.query.dataType as 'gmv' | 'cost' | 'roi';

      // 如果查看成本数据，需要检查权限
      if (dataType === 'cost' && req.user!.role === 'BUSINESS') {
        const userWithPermissions = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { permissions: true },
        });

        const permissions = userWithPermissions?.permissions as any;
        if (!permissions?.advanced?.viewCostData) {
          res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '您没有权限查看成本数据',
              details: { permission: 'advanced.viewCostData' }
            },
          });
          return;
        }
      }

      const trendData = await trendService.getTrendData(brandId, period, dataType);

      res.json({
        success: true,
        data: trendData,
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
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('period').optional().isIn(['week', 'month']).withMessage('周期参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const period = (req.query.period as 'week' | 'month') || 'month';
      const dashboard = await reportService.getFactoryDashboard(brandId, period);

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
  requireRoles('BUSINESS', 'BRAND'),
  [
    query('period').optional().isIn(['week', 'month']).withMessage('周期参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      const staffId = req.user!.userId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const period = (req.query.period as 'week' | 'month') || 'month';
      const dashboard = await reportService.getBusinessStaffDashboard(brandId, staffId, period);

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
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
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

      const buffer = await reportService.exportStaffPerformanceReport(brandId, dateRange);

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
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('groupBy').isIn(['influencer', 'sample', 'staff', 'month']).withMessage('分组参数无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
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

      const buffer = await reportService.exportRoiReport(brandId, groupBy, dateRange);

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
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
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

      const buffer = await reportService.exportCollaborationReport(brandId, dateRange);

      const filename = `合作记录_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ROI 分析数据 ====================

/**
 * GET /api/reports/dashboard/roi-analysis
 * 获取 ROI 分析数据
 */
router.get(
  '/dashboard/roi-analysis',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const roiAnalysis = await reportService.getRoiAnalysis(brandId);

      res.json({
        success: true,
        data: roiAnalysis,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 管道漏斗数据 ====================

/**
 * GET /api/reports/dashboard/pipeline-funnel
 * 获取管道漏斗数据
 */
router.get(
  '/dashboard/pipeline-funnel',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const pipelineFunnel = await reportService.getPipelineFunnel(brandId);

      res.json({
        success: true,
        data: pipelineFunnel,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 商务对比分析 ====================

/**
 * GET /api/reports/staff/comparison
 * 获取商务对比分析数据
 */
router.get(
  '/staff/comparison',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  [
    query('staffIds').isString().withMessage('商务ID列表参数无效'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      // 解析商务ID列表（逗号分隔）
      const staffIdsStr = req.query.staffIds as string;
      const staffIds = staffIdsStr.split(',').filter(id => id.trim());

      if (staffIds.length < 2 || staffIds.length > 3) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '请选择2-3个商务进行对比' },
        });
        return;
      }

      const comparison = await reportService.getStaffComparison(brandId, staffIds);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 每日摘要数据 ====================

/**
 * GET /api/reports/dashboard/daily-summary
 * 获取每日摘要数据（用于快捷操作面板）
 * Requirements: FR-1.3
 */
router.get(
  '/dashboard/daily-summary',
  requireRoles('BRAND', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const dailySummary = await reportService.getDailySummary(brandId);

      res.json({
        success: true,
        data: dailySummary,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ==================== 商务工作质量评分 ====================

/**
 * GET /api/reports/staff/:staffId/quality-score
 * 获取商务工作质量评分
 * Requirements: FR-1.2
 * @permission dataVisibility.viewOthersPerformance - 如果查看其他商务的数据，需要此权限
 */
router.get(
  '/staff/:staffId/quality-score',
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  checkStaffDataAccess(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { staffId } = req.params;
      const brandId = req.user!.brandId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      // 验证商务是否属于该工厂
      const staff = await prisma.user.findFirst({
        where: {
          id: staffId,
          brandId,
          role: 'BUSINESS'
        }
      });

      if (!staff) {
        res.status(404).json({
          success: false,
          error: { code: 'STAFF_NOT_FOUND', message: '商务人员不存在或不属于该工厂' },
        });
        return;
      }

      const qualityScore = await reportService.getStaffQualityScore(staffId, brandId);

      res.json({
        success: true,
        data: qualityScore,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ==================== 商务工作日历 ====================

/**
 * GET /api/reports/staff/:staffId/calendar
 * 获取商务工作日历数据
 * Requirements: FR-1.2
 * @permission dataVisibility.viewOthersPerformance - 如果查看其他商务的数据，需要此权限
 */
router.get(
  '/staff/:staffId/calendar',
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  checkStaffDataAccess(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { staffId } = req.params;
      const { month } = req.query;
      const brandId = req.user!.brandId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      if (!month || typeof month !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_MONTH', message: '请提供有效的月份参数 (格式: YYYY-MM)' },
        });
        return;
      }

      // 验证月份格式
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_MONTH_FORMAT', message: '月份格式错误，应为 YYYY-MM' },
        });
        return;
      }

      // 验证商务是否属于该工厂
      const staff = await prisma.user.findFirst({
        where: {
          id: staffId,
          brandId,
          role: 'BUSINESS'
        }
      });

      if (!staff) {
        res.status(404).json({
          success: false,
          error: { code: 'STAFF_NOT_FOUND', message: '商务人员不存在或不属于该工厂' },
        });
        return;
      }

      const calendarData = await reportService.getStaffCalendar(staffId, brandId, month);

      res.json({
        success: true,
        data: calendarData,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ==================== 智能提醒系统 ====================

/**
 * GET /api/reports/dashboard/alerts
 * 获取智能提醒列表
 * Requirements: FR-1.3
 */
router.get(
  '/dashboard/alerts',
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      const userId = req.user!.userId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const alerts = await reportService.getSmartAlerts(brandId, userId);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/reports/dashboard/alerts/:alertId/read
 * 标记提醒为已读
 * Requirements: FR-1.3
 */
router.put(
  '/dashboard/alerts/:alertId/read',
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { alertId } = req.params;
      const userId = req.user!.userId;

      await reportService.markAlertAsRead(alertId, userId);

      res.json({
        success: true,
        message: '已标记为已读',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/reports/dashboard/alerts/read-all
 * 标记所有提醒为已读
 * Requirements: FR-1.3
 */
router.put(
  '/dashboard/alerts/read-all',
  requireRoles('BRAND', 'BUSINESS', 'PLATFORM_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      const userId = req.user!.userId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      await reportService.markAllAlertsAsRead(userId, brandId);

      res.json({
        success: true,
        message: '已全部标记为已读',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 今日工作清单 ====================

/**
 * GET /api/reports/my-dashboard/today-todos
 * 获取今日待办事项
 * Requirements: FR-2.4
 */
router.get(
  '/my-dashboard/today-todos',
  requireRoles('BUSINESS', 'BRAND'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      const staffId = req.user!.userId;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const todosData = await reportService.getTodayTodos(brandId, staffId);

      res.json({
        success: true,
        data: todosData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/my-dashboard/work-stats
 * 获取工作统计
 * Requirements: FR-2.4
 */
router.get(
  '/my-dashboard/work-stats',
  requireRoles('BUSINESS', 'BRAND'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = req.user!.brandId;
      const staffId = req.user!.userId;
      const period = (req.query.period as 'today' | 'week' | 'month') || 'week';

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
        });
        return;
      }

      const workStatsData = await reportService.getWorkStats(brandId, staffId, period);

      res.json({
        success: true,
        data: workStatsData,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


