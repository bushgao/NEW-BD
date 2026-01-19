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
const notificationService = __importStar(require("../services/notification.service"));
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
// 所有路由都需要认证
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/notifications
 * 获取当前用户的通知列表
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('isRead').optional().isBoolean().withMessage('isRead必须为布尔值'),
    (0, express_validator_1.query)('type').optional().isString().withMessage('type必须为字符串'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const isRead = req.query.isRead === 'true' ? true :
            req.query.isRead === 'false' ? false : undefined;
        const type = req.query.type;
        const result = await notificationService.listNotifications(userId, { isRead, type }, { page, pageSize });
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
 * GET /api/notifications/unread-count
 * 获取当前用户的未读通知数量
 */
router.get('/unread-count', async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.getUnreadCount(userId);
        res.json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/notifications/read-all
 * 标记所有通知为已读
 * 注意：此路由必须在 /:id/read 之前定义，否则会被匹配为 id
 */
router.put('/read-all', async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.markAllAsRead(userId);
        res.json({
            success: true,
            data: { count, message: `已将 ${count} 条通知标记为已读` },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/notifications/clear-read
 * 清空已读通知
 * 注意：此路由必须在 /:id 之前定义，否则会被匹配为 id
 */
router.delete('/clear-read', async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.clearReadNotifications(userId);
        res.json({
            success: true,
            data: { count, message: `已清空 ${count} 条已读通知` },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/notifications/:id/read
 * 标记单个通知为已读
 */
router.put('/:id/read', [(0, express_validator_1.param)('id').isUUID().withMessage('无效的通知 ID')], handleValidationErrors, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, userId);
        res.json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/notifications/:id
 * 删除单个通知
 */
router.delete('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('无效的通知 ID')], handleValidationErrors, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await notificationService.deleteNotification(id, userId);
        res.json({
            success: true,
            data: { message: '通知已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/run-checks
 * 手动触发定时检查任务（仅平台管理员）
 */
router.post('/run-checks', auth_middleware_1.requirePlatformAdmin, async (_req, res, next) => {
    try {
        const results = await notificationService.runScheduledChecks();
        res.json({
            success: true,
            data: { ...results, message: '定时检查任务执行完成' },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map