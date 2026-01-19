"use strict";
/**
 * 达人端口路由 (Influencer Portal Routes)
 *
 * 路由前缀: /api/influencer-portal
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
const influencer_portal_service_1 = require("../services/influencer-portal.service");
const influencer_auth_middleware_1 = require("../middleware/influencer-auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// 所有路由都需要达人认证
router.use(influencer_auth_middleware_1.influencerAuthenticate);
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
 * GET /api/influencer-portal/dashboard
 * 获取首页数据
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const dashboard = await (0, influencer_portal_service_1.getDashboard)(accountId);
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/samples
 * 获取样品列表
 */
router.get('/samples', [
    (0, express_validator_1.query)('brandId').optional().isUUID().withMessage('工厂ID格式不正确'),
    (0, express_validator_1.query)('receivedStatus').optional().isIn(['PENDING', 'RECEIVED', 'LOST']).withMessage('签收状态不正确'),
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const filter = {
            brandId: req.query.brandId,
            receivedStatus: req.query.receivedStatus,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        };
        const samples = await (0, influencer_portal_service_1.getSamples)(accountId, filter);
        res.json({
            success: true,
            data: samples,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/collaborations
 * 获取合作列表
 */
router.get('/collaborations', [
    (0, express_validator_1.query)('brandId').optional().isUUID().withMessage('工厂ID格式不正确'),
    (0, express_validator_1.query)('stage').optional().isIn([
        'LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'
    ]).withMessage('合作阶段不正确'),
    (0, express_validator_1.query)('isOverdue').optional().isBoolean().withMessage('超期状态格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const filter = {
            brandId: req.query.brandId,
            stage: req.query.stage,
            isOverdue: req.query.isOverdue === 'true' ? true : req.query.isOverdue === 'false' ? false : undefined,
        };
        const collaborations = await (0, influencer_portal_service_1.getCollaborations)(accountId, filter);
        res.json({
            success: true,
            data: collaborations,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/collaborations/:id
 * 获取合作详情
 */
router.get('/collaborations/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('合作ID格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const collabId = req.params.id;
        const detail = await (0, influencer_portal_service_1.getCollaborationDetail)(accountId, collabId);
        res.json({
            success: true,
            data: detail,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/influencer-portal/samples/:id/confirm-received
 * 确认签收样品
 */
router.post('/samples/:id/confirm-received', [
    (0, express_validator_1.param)('id').isUUID().withMessage('寄样ID格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const dispatchId = req.params.id;
        const sample = await (0, influencer_portal_service_1.confirmSampleReceived)(accountId, dispatchId);
        res.json({
            success: true,
            data: sample,
            message: '签收确认成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/factories
 * 获取关联的工厂列表（用于筛选）
 */
router.get('/factories', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const factories = await (0, influencer_portal_service_1.getRelatedFactories)(accountId);
        res.json({
            success: true,
            data: factories,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// 认领相关路由
// ============================================
/**
 * GET /api/influencer-portal/claims/pending
 * 获取待认领记录
 */
router.get('/claims/pending', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const { getPendingClaims } = await Promise.resolve().then(() => __importStar(require('../services/influencer-claim.service')));
        const claims = await getPendingClaims(accountId);
        res.json({
            success: true,
            data: claims,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/claims/count
 * 获取待认领数量（用于徽标）
 */
router.get('/claims/count', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const { getPendingClaimCount } = await Promise.resolve().then(() => __importStar(require('../services/influencer-claim.service')));
        const count = await getPendingClaimCount(accountId);
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
 * POST /api/influencer-portal/claims/:id/confirm
 * 确认认领
 */
router.post('/claims/:id/confirm', [
    (0, express_validator_1.param)('id').isUUID().withMessage('记录ID格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const influencerId = req.params.id;
        const { confirmClaim } = await Promise.resolve().then(() => __importStar(require('../services/influencer-claim.service')));
        await confirmClaim(accountId, influencerId);
        res.json({
            success: true,
            message: '认领成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/influencer-portal/claims/:id
 * 取消认领
 */
router.delete('/claims/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('记录ID格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const influencerId = req.params.id;
        const { cancelClaim } = await Promise.resolve().then(() => __importStar(require('../services/influencer-claim.service')));
        await cancelClaim(accountId, influencerId);
        res.json({
            success: true,
            message: '已取消认领',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/claims/claimed
 * 获取已认领记录
 */
router.get('/claims/claimed', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const { getClaimedInfluencers } = await Promise.resolve().then(() => __importStar(require('../services/influencer-claim.service')));
        const claimed = await getClaimedInfluencers(accountId);
        res.json({
            success: true,
            data: claimed,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=influencer-portal.routes.js.map