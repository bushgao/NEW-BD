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
const authService = __importStar(require("../services/auth.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Validation middleware
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages, errors.array());
    }
    next();
};
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少为6位'),
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('请输入昵称'),
    (0, express_validator_1.body)('role')
        .isIn(['PLATFORM_ADMIN', 'BRAND', 'BUSINESS', 'INFLUENCER'])
        .withMessage('无效的用户角色'),
    (0, express_validator_1.body)('brandId')
        .optional()
        .isUUID()
        .withMessage('无效的品牌ID'),
    (0, express_validator_1.body)('brandName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('品牌名称不能为空'),
];
const loginValidation = [
    (0, express_validator_1.body)('phone')
        .notEmpty()
        .withMessage('请输入手机号'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('请输入密码'),
];
const refreshTokenValidation = [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('请提供刷新令牌'),
];
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password, name, role, brandId, brandName } = req.body;
        // 如果是商务人员加入工厂，检查工厂的商务账号配额
        if (role === 'BUSINESS' && brandId) {
            const { validateQuota } = await Promise.resolve().then(() => __importStar(require('../services/platform.service')));
            await validateQuota(brandId, 'staff');
        }
        const result = await authService.register({
            email,
            password,
            name,
            role: role,
            brandId,
            factoryName: brandName, // 前端传 brandName，服务层还是用 factoryName
        });
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/auth/login
 * @desc Login user by phone
 * @access Public
 */
router.post('/login', loginValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const { phone, password } = req.body;
        const result = await authService.loginByPhone({ phone, password });
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
 * @route POST /api/auth/login/email
 * @desc Login user by email (for admin users)
 * @access Public
 */
router.post('/login/email', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('请输入密码'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
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
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', refreshTokenValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshToken(refreshToken);
        res.json({
            success: true,
            data: tokens,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user.userId);
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', auth_middleware_1.authenticate, (_req, res) => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint is for consistency and potential future token blacklisting
    res.json({
        success: true,
        data: { message: '已成功登出' },
    });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map