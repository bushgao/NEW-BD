"use strict";
/**
 * 邀请路由
 *
 * 处理品牌邀请商务相关接口
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
const invitationService = __importStar(require("../services/invitation.service"));
const exportService = __importStar(require("../services/export.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// 校验错误处理
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return _res.status(400).json({
            success: false,
            error: { message: errors.array()[0].msg },
        });
    }
    next();
};
// ============ 公开接口（不需要认证） ============
/**
 * 获取邀请详情（根据邀请码）
 * GET /api/invitations/code/:code
 */
router.get('/code/:code', [(0, express_validator_1.param)('code').isLength({ min: 8, max: 8 }).withMessage('邀请码格式错误')], handleValidationErrors, async (req, res, next) => {
    try {
        const invitation = await invitationService.getInvitationByCode(req.params.code);
        res.json({ success: true, data: invitation });
    }
    catch (error) {
        next(error);
    }
});
// ============ 需要认证的接口 ============
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.enrichUserData);
/**
 * 创建邀请
 * POST /api/invitations
 */
router.post('/', (0, auth_middleware_1.requireRoles)('BRAND', 'BUSINESS'), async (req, res, next) => {
    try {
        const brandId = req.user?.brandId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { message: '用户未关联品牌' },
            });
        }
        const invitation = await invitationService.createInvitation({
            brandId,
            inviterId: req.user.userId,
        });
        res.status(201).json({ success: true, data: invitation });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取当前品牌的邀请列表
 * GET /api/invitations
 */
router.get('/', (0, auth_middleware_1.requireRoles)('BRAND', 'BUSINESS'), [(0, express_validator_1.query)('status').optional().isIn(['PENDING', 'USED', 'REVOKED']).withMessage('状态值无效')], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user?.brandId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { message: '用户未关联品牌' },
            });
        }
        const status = req.query.status;
        const invitations = await invitationService.listInvitations(brandId, status);
        res.json({ success: true, data: invitations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 撤销邀请
 * DELETE /api/invitations/:id
 */
router.delete('/:id', (0, auth_middleware_1.requireRoles)('BRAND', 'BUSINESS'), [(0, express_validator_1.param)('id').isUUID().withMessage('邀请ID格式错误')], handleValidationErrors, async (req, res, next) => {
    try {
        await invitationService.revokeInvitation(req.params.id, req.user.userId);
        res.json({ success: true, message: '邀请已撤销' });
    }
    catch (error) {
        next(error);
    }
});
// ============ 定向邀请接口 ============
/**
 * 根据手机号查找独立商务
 * GET /api/invitations/search-business?phone=xxx
 */
router.get('/search-business', (0, auth_middleware_1.requireRoles)('BRAND', 'BUSINESS'), [(0, express_validator_1.query)('phone').isMobilePhone('zh-CN').withMessage('手机号格式错误')], handleValidationErrors, async (req, res, next) => {
    try {
        const phone = req.query.phone;
        const user = await invitationService.findIndependentBusinessByPhone(phone);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: '未找到该手机号对应的独立商务用户' },
            });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 创建定向邀请（通过手机号邀请独立商务）
 * POST /api/invitations/targeted
 */
router.post('/targeted', (0, auth_middleware_1.requireRoles)('BRAND', 'BUSINESS'), async (req, res, next) => {
    try {
        const brandId = req.user?.brandId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { message: '用户未关联品牌' },
            });
        }
        const { targetPhone } = req.body;
        if (!targetPhone) {
            return res.status(400).json({
                success: false,
                error: { message: '请提供目标手机号' },
            });
        }
        const invitation = await invitationService.createTargetedInvitation({
            brandId,
            inviterId: req.user.userId,
            targetPhone,
        });
        res.status(201).json({ success: true, data: invitation });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取我收到的定向邀请（独立商务端）
 * GET /api/invitations/received
 */
router.get('/received', (0, auth_middleware_1.requireRoles)('BUSINESS'), async (req, res, next) => {
    try {
        const invitations = await invitationService.getReceivedInvitations(req.user.userId);
        res.json({ success: true, data: invitations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 接受定向邀请（独立商务确认加入品牌）
 * POST /api/invitations/targeted/:code/accept
 */
router.post('/targeted/:code/accept', (0, auth_middleware_1.requireRoles)('BUSINESS'), [(0, express_validator_1.param)('code').isLength({ min: 8, max: 8 }).withMessage('邀请码格式错误')], handleValidationErrors, async (req, res, next) => {
    try {
        const { migrateInfluencers = false } = req.body;
        await invitationService.acceptTargetedInvitation(req.params.code, req.user.userId, migrateInfluencers);
        res.json({ success: true, message: '您已成功加入品牌' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 拒绝定向邀请
 * DELETE /api/invitations/targeted/:id/reject
 */
router.delete('/targeted/:id/reject', (0, auth_middleware_1.requireRoles)('BUSINESS'), [(0, express_validator_1.param)('id').isUUID().withMessage('邀请ID格式错误')], handleValidationErrors, async (req, res, next) => {
    try {
        await invitationService.rejectTargetedInvitation(req.params.id, req.user.userId);
        res.json({ success: true, message: '已拒绝该邀请' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 导出用户数据备份（加入品牌前下载）
 * GET /api/invitations/backup-export
 */
router.get('/backup-export', (0, auth_middleware_1.requireRoles)('BUSINESS'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const brandId = req.user?.brandId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { message: '用户未关联品牌' },
            });
        }
        const result = await exportService.exportUserDataBackup(userId, brandId);
        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
        res.setHeader('X-Backup-Summary', JSON.stringify(result.summary));
        res.send(result.buffer);
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取数据备份汇总（不下载，仅获取统计）
 * GET /api/invitations/backup-summary
 */
router.get('/backup-summary', (0, auth_middleware_1.requireRoles)('BUSINESS'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const brandId = req.user?.brandId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { message: '用户未关联品牌' },
            });
        }
        const result = await exportService.exportUserDataBackup(userId, brandId);
        res.json({
            success: true,
            data: result.summary,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=invitation.routes.js.map