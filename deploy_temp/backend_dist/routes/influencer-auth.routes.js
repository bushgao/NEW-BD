"use strict";
/**
 * 达人认证路由 (Influencer Auth Routes)
 *
 * 路由前缀: /api/influencer-portal/auth
 */
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
const influencer_auth_service_1 = require("../services/influencer-auth.service");
const influencer_auth_middleware_1 = require("../middleware/influencer-auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * 验证请求参数
 */
function validateRequest(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((e) => e.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages);
    }
    next();
}
/**
 * POST /api/influencer-portal/auth/send-code
 * 发送验证码
 */
router.post('/send-code', [
    (0, express_validator_1.body)('phone')
        .notEmpty().withMessage('手机号不能为空')
        .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const { phone } = req.body;
        await (0, influencer_auth_service_1.sendVerificationCode)(phone);
        res.json({
            success: true,
            message: '验证码已发送',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/influencer-portal/auth/login
 * 验证码登录
 */
router.post('/login', [
    (0, express_validator_1.body)('phone')
        .notEmpty().withMessage('手机号不能为空')
        .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
    (0, express_validator_1.body)('code')
        .notEmpty().withMessage('验证码不能为空')
        .isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字'),
], validateRequest, async (req, res, next) => {
    try {
        const { phone, code } = req.body;
        const deviceInfo = (0, influencer_auth_middleware_1.getDeviceInfo)(req);
        const result = await (0, influencer_auth_service_1.loginWithCode)(phone, code, deviceInfo);
        res.json({
            success: true,
            data: {
                contact: result.contact,
                tokens: result.tokens,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/influencer-portal/auth/login-password
 * 密码登录（用于通过主系统注册的达人用户）
 */
router.post('/login-password', [
    (0, express_validator_1.body)('email')
        .notEmpty().withMessage('邮箱不能为空')
        .isEmail().withMessage('邮箱格式不正确'),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 6 }).withMessage('密码至少6位'),
], validateRequest, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const deviceInfo = (0, influencer_auth_middleware_1.getDeviceInfo)(req);
        // 使用密码登录服务
        const { loginWithPassword } = await Promise.resolve().then(() => __importStar(require('../services/influencer-auth.service')));
        const result = await loginWithPassword(email, password, deviceInfo);
        res.json({
            success: true,
            data: {
                contact: result.contact,
                tokens: result.tokens,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/influencer-portal/auth/refresh
 * 刷新 Token
 */
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('刷新令牌不能为空'),
], validateRequest, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await (0, influencer_auth_service_1.refreshInfluencerToken)(refreshToken);
        res.json({
            success: true,
            data: { tokens },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/auth/me
 * 获取当前用户信息
 */
router.get('/me', influencer_auth_middleware_1.influencerAuthenticate, async (req, res, next) => {
    try {
        const contact = await (0, influencer_auth_service_1.getCurrentInfluencerContact)(req.influencer.contactId);
        res.json({
            success: true,
            data: { contact },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=influencer-auth.routes.js.map