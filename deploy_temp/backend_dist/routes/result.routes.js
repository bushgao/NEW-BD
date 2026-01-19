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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const resultService = __importStar(require("../services/result.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(auth_middleware_1.enrichUserData);
// 验证中间件
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages, errors.array());
    }
    next();
};
// 验证规则
const createResultValidation = [
    (0, express_validator_1.body)('collaborationId').isUUID().withMessage('无效的合作记录 ID'),
    (0, express_validator_1.body)('contentType')
        .isIn(['SHORT_VIDEO', 'LIVE_STREAM'])
        .withMessage('内容类型必须是 SHORT_VIDEO 或 LIVE_STREAM'),
    (0, express_validator_1.body)('publishedAt').isISO8601().withMessage('无效的发布时间格式'),
    (0, express_validator_1.body)('salesQuantity').isInt({ min: 0 }).withMessage('销售件数必须是非负整数'),
    (0, express_validator_1.body)('salesGmv').isInt({ min: 0 }).withMessage('销售GMV必须是非负整数（分）'),
    (0, express_validator_1.body)('commissionRate')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('佣金比例必须在0-100之间'),
    (0, express_validator_1.body)('pitFee')
        .optional()
        .isInt({ min: 0 })
        .withMessage('坑位费必须是非负整数（分）'),
    (0, express_validator_1.body)('actualCommission').isInt({ min: 0 }).withMessage('实付佣金必须是非负整数（分）'),
    (0, express_validator_1.body)('willRepeat').isBoolean().withMessage('是否复投必须是布尔值'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const updateResultValidation = [
    (0, express_validator_1.body)('contentType')
        .optional()
        .isIn(['SHORT_VIDEO', 'LIVE_STREAM'])
        .withMessage('内容类型必须是 SHORT_VIDEO 或 LIVE_STREAM'),
    (0, express_validator_1.body)('publishedAt').optional().isISO8601().withMessage('无效的发布时间格式'),
    (0, express_validator_1.body)('salesQuantity').optional().isInt({ min: 0 }).withMessage('销售件数必须是非负整数'),
    (0, express_validator_1.body)('salesGmv').optional().isInt({ min: 0 }).withMessage('销售GMV必须是非负整数（分）'),
    (0, express_validator_1.body)('commissionRate')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('佣金比例必须在0-100之间'),
    (0, express_validator_1.body)('pitFee')
        .optional()
        .isInt({ min: 0 })
        .withMessage('坑位费必须是非负整数（分）'),
    (0, express_validator_1.body)('actualCommission')
        .optional()
        .isInt({ min: 0 })
        .withMessage('实付佣金必须是非负整数（分）'),
    (0, express_validator_1.body)('willRepeat').optional().isBoolean().withMessage('是否复投必须是布尔值'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const idParamValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('无效的 ID'),
];
// ==================== 合作结果路由 ====================
/**
 * @route GET /api/results
 * @desc 获取合作结果列表
 * @access Private (工厂成员)
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const filter = {
            profitStatus: req.query.profitStatus,
            contentType: req.query.contentType,
            businessStaffId: req.query.businessStaffId,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        };
        const result = await resultService.listResults(brandId, filter, { page, pageSize });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/results/stats
 * @desc 获取合作结果统计概览
 * @access Private (工厂成员)
 */
router.get('/stats', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, 
// 商务人员也需要查看统计数据
async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        let dateRange;
        if (req.query.startDate && req.query.endDate) {
            dateRange = {
                startDate: new Date(req.query.startDate),
                endDate: new Date(req.query.endDate),
            };
        }
        const stats = await resultService.getResultStats(brandId, dateRange);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/results/report
 * @desc 获取 ROI 报表
 * @access Private (工厂成员)
 */
router.get('/report', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, 
// 独立商务也需要查看 ROI 报表
async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const groupBy = req.query.groupBy || 'influencer';
        if (!['influencer', 'sample', 'staff', 'month'].includes(groupBy)) {
            throw (0, errorHandler_1.createBadRequestError)('无效的分组维度');
        }
        const filter = {
            groupBy: groupBy,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        };
        const report = await resultService.getRoiReport(brandId, filter);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/results/collaboration/:collaborationId
 * @desc 根据合作ID获取结果
 * @access Private (工厂成员)
 */
router.get('/collaboration/:collaborationId', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, [(0, express_validator_1.param)('collaborationId').isUUID().withMessage('无效的合作记录 ID')], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const result = await resultService.getResultByCollaborationId(req.params.collaborationId, brandId);
        res.json({
            success: true,
            data: { result },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/results/:id
 * @desc 获取合作结果详情
 * @access Private (工厂成员)
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const result = await resultService.getResultById(req.params.id, brandId);
        res.json({
            success: true,
            data: { result },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/results
 * @desc 录入合作结果
 * @access Private (商务人员)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, createResultValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { collaborationId, contentType, publishedAt, salesQuantity, salesGmv, commissionRate, pitFee, actualCommission, willRepeat, notes, } = req.body;
        const result = await resultService.createResult({
            collaborationId,
            contentType,
            publishedAt: new Date(publishedAt),
            salesQuantity,
            salesGmv,
            commissionRate,
            pitFee,
            actualCommission,
            willRepeat,
            notes,
        }, brandId);
        res.status(201).json({
            success: true,
            data: { result },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/results/:id
 * @desc 更新合作结果
 * @access Private (商务人员)
 */
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, idParamValidation, updateResultValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { contentType, publishedAt, salesQuantity, salesGmv, commissionRate, pitFee, actualCommission, willRepeat, notes, } = req.body;
        const result = await resultService.updateResult(req.params.id, brandId, {
            contentType,
            publishedAt: publishedAt ? new Date(publishedAt) : undefined,
            salesQuantity,
            salesGmv,
            commissionRate,
            pitFee,
            actualCommission,
            willRepeat,
            notes,
        });
        res.json({
            success: true,
            data: { result },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=result.routes.js.map