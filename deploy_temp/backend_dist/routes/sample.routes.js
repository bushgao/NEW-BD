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
const sampleService = __importStar(require("../services/sample.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
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
const createSampleValidation = [
    (0, express_validator_1.body)('sku').trim().notEmpty().withMessage('请输入 SKU'),
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('请输入样品名称'),
    (0, express_validator_1.body)('unitCost').isInt({ min: 0 }).withMessage('单件成本必须是非负整数（分）'),
    (0, express_validator_1.body)('retailPrice').isInt({ min: 0 }).withMessage('建议零售价必须是非负整数（分）'),
    (0, express_validator_1.body)('canResend').optional().isBoolean().withMessage('是否可复寄必须是布尔值'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const updateSampleValidation = [
    (0, express_validator_1.body)('sku').optional().trim().notEmpty().withMessage('SKU 不能为空'),
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('样品名称不能为空'),
    (0, express_validator_1.body)('unitCost').optional().isInt({ min: 0 }).withMessage('单件成本必须是非负整数（分）'),
    (0, express_validator_1.body)('retailPrice').optional().isInt({ min: 0 }).withMessage('建议零售价必须是非负整数（分）'),
    (0, express_validator_1.body)('canResend').optional().isBoolean().withMessage('是否可复寄必须是布尔值'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const createDispatchValidation = [
    (0, express_validator_1.body)('sampleId').isUUID().withMessage('无效的样品 ID'),
    (0, express_validator_1.body)('collaborationId').isUUID().withMessage('无效的合作记录 ID'),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('寄样数量必须是正整数'),
    (0, express_validator_1.body)('shippingCost').isInt({ min: 0 }).withMessage('快递费必须是非负整数（分）'),
    (0, express_validator_1.body)('trackingNumber').optional().trim(),
];
const updateDispatchStatusValidation = [
    (0, express_validator_1.body)('receivedStatus')
        .optional()
        .isIn(['PENDING', 'RECEIVED', 'LOST'])
        .withMessage('无效的签收状态'),
    (0, express_validator_1.body)('onboardStatus')
        .optional()
        .isIn(['UNKNOWN', 'ONBOARD', 'NOT_ONBOARD'])
        .withMessage('无效的上车状态'),
];
const idParamValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('无效的 ID'),
];
// ==================== 样品路由 ====================
/**
 * @route GET /api/samples
 * @desc 获取样品列表
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
        const keyword = req.query.keyword;
        const canResend = req.query.canResend === 'true' ? true :
            req.query.canResend === 'false' ? false : undefined;
        const result = await sampleService.listSamples(brandId, { keyword, canResend }, { page, pageSize });
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
 * @route GET /api/samples/report
 * @desc 获取样品成本报表
 * @access Private (工厂老板)
 */
router.get('/report', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, (0, auth_middleware_1.requireRoles)('BRAND'), async (req, res, next) => {
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
        const report = await sampleService.getSampleCostReport(brandId, dateRange);
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
 * @route GET /api/samples/:id
 * @desc 获取样品详情
 * @access Private (工厂成员)
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const sample = await sampleService.getSampleById(req.params.id, brandId);
        res.json({
            success: true,
            data: { sample },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/samples
 * @desc 创建样品
 * @access Private (工厂老板 或 有样品管理权限的商务)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageSamples'), createSampleValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { sku, name, unitCost, retailPrice, canResend, notes } = req.body;
        const sample = await sampleService.createSample({
            brandId,
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/samples/:id
 * @desc 更新样品
 * @access Private (工厂老板 或 有样品管理权限的商务)
 */
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageSamples'), idParamValidation, updateSampleValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { sku, name, unitCost, retailPrice, canResend, notes } = req.body;
        const sample = await sampleService.updateSample(req.params.id, brandId, {
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/samples/:id
 * @desc 删除样品
 * @access Private (工厂老板 或 有样品管理权限的商务)
 */
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageSamples'), idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        await sampleService.deleteSample(req.params.id, brandId);
        res.json({
            success: true,
            data: { message: '样品已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 寄样记录路由 ====================
/**
 * @route GET /api/samples/dispatches
 * @desc 获取寄样记录列表
 * @access Private (工厂成员)
 */
router.get('/dispatches/list', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const filter = {
            sampleId: req.query.sampleId,
            collaborationId: req.query.collaborationId,
            businessStaffId: req.query.businessStaffId,
            receivedStatus: req.query.receivedStatus,
            onboardStatus: req.query.onboardStatus,
        };
        const result = await sampleService.listDispatches(brandId, filter, { page, pageSize });
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
 * @route GET /api/samples/dispatches/:id
 * @desc 获取寄样记录详情
 * @access Private (工厂成员)
 */
router.get('/dispatches/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const dispatch = await sampleService.getDispatchById(req.params.id, brandId);
        res.json({
            success: true,
            data: { dispatch },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/samples/dispatches
 * @desc 创建寄样记录
 * @access Private (商务人员)
 */
router.post('/dispatches', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, createDispatchValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const businessStaffId = req.user.userId;
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/samples/dispatches/:id/status
 * @desc 更新寄样状态
 * @access Private (商务人员)
 */
router.put('/dispatches/:id/status', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, idParamValidation, updateDispatchStatusValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { receivedStatus, onboardStatus } = req.body;
        const dispatch = await sampleService.updateDispatchStatus(req.params.id, brandId, {
            receivedStatus,
            onboardStatus,
        });
        res.json({
            success: true,
            data: { dispatch },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=sample.routes.js.map