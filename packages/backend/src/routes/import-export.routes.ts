import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import multer from 'multer';
import * as importService from '../services/import.service';
import * as exportService from '../services/export.service';
import * as reportService from '../services/report.service';
import { authenticate, requireFactoryMember } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse } from '@ics/shared';

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

// ==================== 导入路由 ====================

/**
 * @route POST /api/import/parse
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

      const importType = req.body.type || 'influencers';
      const { headers } = importService.parseFile(req.file.buffer);
      
      let suggestedMapping: any;
      if (importType === 'samples') {
        suggestedMapping = importService.suggestSampleMapping(headers);
      } else {
        suggestedMapping = importService.suggestInfluencerMapping(headers);
      }

      res.json({
        success: true,
        data: {
          headers,
          suggestedMapping,
          importType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/import/preview
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

      const importType = req.body.type || 'influencers';
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;

      let result: any;
      if (importType === 'samples') {
        if (!mapping || !mapping.sku || !mapping.name || !mapping.unitCost || !mapping.retailPrice) {
          throw createBadRequestError('请提供字段映射（SKU、名称、单件成本、建议零售价为必填）');
        }
        result = await importService.previewSampleImport(req.file.buffer, mapping, factoryId);
      } else {
        if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
          throw createBadRequestError('请提供字段映射（昵称、平台、平台账号ID为必填）');
        }
        result = await importService.previewInfluencerImport(req.file.buffer, mapping, factoryId);
      }

      res.json({
        success: true,
        data: {
          ...result,
          importType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/import/execute
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

      const importType = req.body.type || 'influencers';
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
      const skipDuplicates = req.body.skipDuplicates !== 'false';

      let result: importService.ImportResult;
      if (importType === 'samples') {
        if (!mapping || !mapping.sku || !mapping.name || !mapping.unitCost || !mapping.retailPrice) {
          throw createBadRequestError('请提供字段映射（SKU、名称、单件成本、建议零售价为必填）');
        }
        result = await importService.executeSampleImport(req.file.buffer, mapping, factoryId, skipDuplicates);
      } else {
        if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
          throw createBadRequestError('请提供字段映射（昵称、平台、平台账号ID为必填）');
        }
        result = await importService.executeInfluencerImport(req.file.buffer, mapping, factoryId, skipDuplicates);
      }

      res.json({
        success: true,
        data: {
          ...result,
          importType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== 导出路由 ====================

/**
 * @route GET /api/export/:type
 * @desc Export data to Excel
 * @access Private (Factory Member)
 */
router.get(
  '/export/:type',
  authenticate,
  requireFactoryMember,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
    query('groupBy').optional().isIn(['influencer', 'sample', 'staff', 'month']).withMessage('无效的分组方式'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const factoryId = req.user!.factoryId;
      if (!factoryId) {
        throw createBadRequestError('用户未关联工厂');
      }

      const exportType = req.params.type as exportService.ExportType;
      const validTypes: exportService.ExportType[] = [
        'influencers', 'samples', 'dispatches', 'collaborations', 'results',
        'staff-performance', 'roi-report', 'sample-cost-report'
      ];

      if (!validTypes.includes(exportType)) {
        throw createBadRequestError(`不支持的导出类型: ${exportType}`);
      }

      // Parse date range
      let dateRange: exportService.DateRange | undefined;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string),
        };
      }

      const groupBy = req.query.groupBy as string | undefined;

      let buffer: Buffer;
      let filename: string;

      // Handle special report types
      if (exportType === 'staff-performance') {
        buffer = await reportService.exportStaffPerformanceReport(factoryId, dateRange);
        filename = `商务绩效报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else if (exportType === 'roi-report') {
        const validGroupBy = groupBy as 'influencer' | 'sample' | 'staff' | 'month' || 'month';
        buffer = await reportService.exportRoiReport(factoryId, validGroupBy, dateRange);
        filename = `ROI报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else if (exportType === 'sample-cost-report') {
        // Use collaboration report as sample cost report
        buffer = await reportService.exportCollaborationReport(factoryId, dateRange);
        filename = `样品成本报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else {
        // Use generic export service
        const result = await exportService.exportData(exportType, {
          factoryId,
          dateRange,
          groupBy,
        });
        buffer = result.buffer;
        filename = result.filename;
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
