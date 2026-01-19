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
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const templateService = __importStar(require("../services/notification-template.service"));
const router = (0, express_1.Router)();
// 验证中间件
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages, errors.array());
    }
    next();
};
// 所有路由都需要认证和平台管理员权限
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.requirePlatformAdmin);
/**
 * GET /api/notification-templates
 * 获取所有通知模板
 */
router.get('/', async (_req, res, next) => {
    try {
        const templates = await templateService.listTemplates();
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/notification-templates/:type
 * 获取单个模板
 */
router.get('/:type', async (req, res, next) => {
    try {
        const { type } = req.params;
        const template = await templateService.getTemplateByType(type);
        if (!template) {
            throw (0, errorHandler_1.createBadRequestError)('模板不存在');
        }
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/notification-templates/:type
 * 更新模板内容
 */
router.put('/:type', [
    (0, express_validator_1.body)('title').optional().isString().withMessage('标题必须为字符串'),
    (0, express_validator_1.body)('content').optional().isString().withMessage('内容必须为字符串'),
    (0, express_validator_1.body)('isEnabled').optional().isBoolean().withMessage('isEnabled必须为布尔值'),
    (0, express_validator_1.body)('metadata').optional().isObject().withMessage('metadata必须为对象'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { type } = req.params;
        const { title, content, isEnabled, metadata } = req.body;
        const template = await templateService.updateTemplate(type, {
            title,
            content,
            isEnabled,
            metadata,
        });
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notification-templates/seed
 * 初始化默认模板（仅开发环境使用）
 */
router.post('/seed', async (_req, res, next) => {
    try {
        await templateService.seedDefaultTemplates();
        res.json({
            success: true,
            data: { message: '默认模板已初始化' },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification-template.routes.js.map