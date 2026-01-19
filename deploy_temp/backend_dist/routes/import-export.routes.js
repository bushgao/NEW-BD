"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const importService = __importStar(require("../services/import.service"));
const exportService = __importStar(require("../services/export.service"));
const reportService = __importStar(require("../services/report.service"));
const templateService = __importStar(require("../services/template.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('只支持 Excel (.xlsx, .xls) 或 CSV 文件'));
        }
    },
});
const router = (0, express_1.Router)();
// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(auth_middleware_1.enrichUserData);
// Validation middleware
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages, errors.array());
    }
    next();
};
// ==================== 导入路由 ====================
/**
 * @route POST /api/import/parse
 * @desc Parse uploaded file and return headers for mapping
 * @access Private (Factory Member)
 */
router.post('/import/parse', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        const importType = req.body.type || 'influencers';
        const { headers } = importService.parseFile(req.file.buffer);
        let suggestedMapping;
        if (importType === 'samples') {
            suggestedMapping = importService.suggestSampleMapping(headers);
        }
        else {
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/import/preview
 * @desc Preview import with validation and duplicate checking
 * @access Private (Factory Member)
 */
router.post('/import/preview', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        const importType = req.body.type || 'influencers';
        const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
        let result;
        if (importType === 'samples') {
            if (!mapping || !mapping.sku || !mapping.name || !mapping.unitCost || !mapping.retailPrice) {
                throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（SKU、名称、单件成本、建议零售价为必填）');
            }
            result = await importService.previewSampleImport(req.file.buffer, mapping, brandId);
        }
        else {
            if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
                throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（昵称、平台、平台账号ID为必填）');
            }
            result = await importService.previewInfluencerImport(req.file.buffer, mapping, brandId);
        }
        res.json({
            success: true,
            data: {
                ...result,
                importType,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/import/execute
 * @desc Execute batch import
 * @access Private (Factory Member)
 */
router.post('/import/execute', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        const importType = req.body.type || 'influencers';
        const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
        const skipDuplicates = req.body.skipDuplicates !== 'false';
        let result;
        if (importType === 'samples') {
            if (!mapping || !mapping.sku || !mapping.name || !mapping.unitCost || !mapping.retailPrice) {
                throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（SKU、名称、单件成本、建议零售价为必填）');
            }
            result = await importService.executeSampleImport(req.file.buffer, mapping, brandId, skipDuplicates);
        }
        else {
            if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
                throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（昵称、平台、平台账号ID为必填）');
            }
            result = await importService.executeInfluencerImport(req.file.buffer, mapping, brandId, skipDuplicates);
        }
        res.json({
            success: true,
            data: {
                ...result,
                importType,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 导出路由 ====================
/**
 * @route GET /api/export/:type
 * @desc Export data to Excel
 * @access Private (Factory Member)
 */
router.get('/export/:type', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
    (0, express_validator_1.query)('groupBy').optional().isIn(['influencer', 'sample', 'staff', 'month']).withMessage('无效的分组方式'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const exportType = req.params.type;
        const validTypes = [
            'influencers', 'samples', 'dispatches', 'collaborations', 'results',
            'staff-performance', 'roi-report', 'sample-cost-report'
        ];
        if (!validTypes.includes(exportType)) {
            throw (0, errorHandler_1.createBadRequestError)(`不支持的导出类型: ${exportType}`);
        }
        // Parse date range
        let dateRange;
        if (req.query.startDate && req.query.endDate) {
            dateRange = {
                startDate: new Date(req.query.startDate),
                endDate: new Date(req.query.endDate),
            };
        }
        const groupBy = req.query.groupBy;
        let buffer;
        let filename;
        // Handle special report types
        if (exportType === 'staff-performance') {
            buffer = await reportService.exportStaffPerformanceReport(brandId, dateRange);
            filename = `商务绩效报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
        }
        else if (exportType === 'roi-report') {
            const validGroupBy = groupBy || 'month';
            buffer = await reportService.exportRoiReport(brandId, validGroupBy, dateRange);
            filename = `ROI报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
        }
        else if (exportType === 'sample-cost-report') {
            // Use collaboration report as sample cost report
            buffer = await reportService.exportCollaborationReport(brandId, dateRange);
            filename = `样品成本报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
        }
        else {
            // Use generic export service
            const result = await exportService.exportData(exportType, {
                brandId,
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
    }
    catch (error) {
        next(error);
    }
});
// ==================== 模板下载路由 ====================
/**
 * @route GET /api/template/:type
 * @desc Download import template
 * @access Private (Factory Member)
 */
router.get('/template/:type', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const templateType = req.params.type;
        const validTypes = ['influencers', 'samples'];
        if (!validTypes.includes(templateType)) {
            throw (0, errorHandler_1.createBadRequestError)(`不支持的模板类型: ${templateType}`);
        }
        const { buffer, filename } = templateService.generateImportTemplate(templateType);
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=import-export.routes.js.map