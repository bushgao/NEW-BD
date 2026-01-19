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
const platformService = __importStar(require("../services/platform.service"));
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
// ============ Factory Management Routes ============
/**
 * @route GET /api/platform/factories
 * @desc 获取工厂列表
 * @access Platform Admin
 */
router.get('/factories', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).withMessage('无效的状态'),
    (0, express_validator_1.query)('planType').optional().isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    (0, express_validator_1.query)('keyword').optional().isString(),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const status = req.query.status;
        const planType = req.query.planType;
        const keyword = req.query.keyword;
        const result = await platformService.listFactories({ status, planType, keyword }, { page, pageSize });
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
 * @route GET /api/platform/factories/:brandId
 * @desc 获取工厂详情
 * @access Platform Admin
 */
router.get('/factories/:brandId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const factory = await platformService.getFactoryById(req.params.brandId);
        res.json({
            success: true,
            data: factory,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/factories/:brandId/review
 * @desc 审核工厂入驻申请
 * @access Platform Admin
 */
router.post('/factories/:brandId/review', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
    (0, express_validator_1.body)('status').isIn(['APPROVED', 'REJECTED']).withMessage('状态必须为 APPROVED 或 REJECTED'),
    (0, express_validator_1.body)('reason').optional().isString().withMessage('原因必须为字符串'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const factory = await platformService.reviewFactory(req.params.brandId, status, reason);
        res.json({
            success: true,
            data: factory,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/platform/factories/:brandId
 * @desc 更新工厂信息
 * @access Platform Admin
 */
router.put('/factories/:brandId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
    (0, express_validator_1.body)('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).withMessage('无效的状态'),
    (0, express_validator_1.body)('planType').optional().isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    (0, express_validator_1.body)('staffLimit').optional().isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    (0, express_validator_1.body)('influencerLimit').optional().isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
    (0, express_validator_1.body)('planExpiresAt').optional().isISO8601().withMessage('到期时间格式无效'),
    (0, express_validator_1.body)('isPaid').optional().isBoolean().withMessage('付费状态必须为布尔值'),
    // 赠送额度字段
    (0, express_validator_1.body)('bonusStaff').optional().isInt({ min: 0 }).withMessage('赠送商务账号必须为非负整数'),
    (0, express_validator_1.body)('bonusInfluencer').optional().isInt({ min: 0 }).withMessage('赠送达人数量必须为非负整数'),
    (0, express_validator_1.body)('bonusDays').optional().isInt({ min: 0 }).withMessage('赠送天数必须为非负整数'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { status, planType, staffLimit, influencerLimit, planExpiresAt, isPaid, bonusStaff, bonusInfluencer, bonusDays } = req.body;
        const factory = await platformService.updateFactory(req.params.brandId, {
            status,
            planType,
            staffLimit,
            influencerLimit,
            planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : undefined,
            isPaid,
            bonusStaff,
            bonusInfluencer,
            bonusDays,
        });
        res.json({
            success: true,
            data: factory,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/factories/:brandId/toggle-status
 * @desc 暂停/恢复工厂
 * @access Platform Admin
 */
router.post('/factories/:brandId/toggle-status', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
    (0, express_validator_1.body)('suspend').isBoolean().withMessage('suspend 必须为布尔值'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { suspend } = req.body;
        const factory = await platformService.toggleBrandStatus(req.params.brandId, suspend);
        res.json({
            success: true,
            data: factory,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/platform/factories/:brandId
 * @desc 删除品牌
 * @access Platform Admin
 */
router.delete('/factories/:brandId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的品牌ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        await platformService.deleteBrand(req.params.brandId);
        res.json({
            success: true,
            data: { message: '品牌已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ Plan Configuration Routes ============
/**
 * @route GET /api/platform/plans
 * @desc 获取所有套餐配置
 * @access Platform Admin
 */
router.get('/plans', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, async (_req, res, next) => {
    try {
        const plans = await platformService.listPlanConfigs();
        res.json({
            success: true,
            data: plans,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/platform/plans/:planType
 * @desc 获取单个套餐配置
 * @access Platform Admin
 */
router.get('/plans/:planType', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('planType').isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const plan = await platformService.getPlanConfig(req.params.planType);
        res.json({
            success: true,
            data: plan,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/plans
 * @desc 创建套餐配置
 * @access Platform Admin
 */
router.post('/plans', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.body)('planType').isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('套餐名称不能为空'),
    (0, express_validator_1.body)('staffLimit').isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    (0, express_validator_1.body)('influencerLimit').isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
    (0, express_validator_1.body)('dataRetentionDays').isInt({ min: 1 }).withMessage('数据保留天数必须为正整数'),
    (0, express_validator_1.body)('price').isInt({ min: 0 }).withMessage('价格必须为非负整数'),
    (0, express_validator_1.body)('features').isArray().withMessage('功能列表必须为数组'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const plan = await platformService.createPlanConfig(req.body);
        res.status(201).json({
            success: true,
            data: plan,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/platform/plans/:planType
 * @desc 更新套餐配置
 * @access Platform Admin
 */
router.put('/plans/:planType', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('planType').isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('套餐名称不能为空'),
    (0, express_validator_1.body)('staffLimit').optional().isInt({ min: 1 }).withMessage('商务账号上限必须为正整数'),
    (0, express_validator_1.body)('influencerLimit').optional().isInt({ min: 1 }).withMessage('达人上限必须为正整数'),
    (0, express_validator_1.body)('dataRetentionDays').optional().isInt({ min: 1 }).withMessage('数据保留天数必须为正整数'),
    (0, express_validator_1.body)('price').optional().isInt({ min: 0 }).withMessage('价格必须为非负整数'),
    (0, express_validator_1.body)('features').optional().isArray().withMessage('功能列表必须为数组'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const plan = await platformService.updatePlanConfig(req.params.planType, req.body);
        res.json({
            success: true,
            data: plan,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/platform/plans/:planType
 * @desc 删除套餐配置
 * @access Platform Admin
 */
router.delete('/plans/:planType', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('planType').isIn(['FREE', 'PERSONAL', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('无效的套餐类型'),
], handleValidationErrors, async (req, res, next) => {
    try {
        await platformService.deletePlanConfig(req.params.planType);
        res.json({
            success: true,
            data: { message: '套餐配置已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ Quota Check Routes ============
/**
 * @route GET /api/platform/factories/:brandId/quota
 * @desc 检查工厂配额
 * @access Platform Admin
 */
router.get('/factories/:brandId/quota', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
    (0, express_validator_1.query)('type').isIn(['staff', 'influencer']).withMessage('类型必须为 staff 或 influencer'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const quota = await platformService.checkFactoryQuota(req.params.brandId, req.query.type);
        res.json({
            success: true,
            data: quota,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ Factory Staff Management Routes ============
/**
 * @route GET /api/platform/factories/:brandId/staff
 * @desc 获取工厂的商务列表
 * @access Platform Admin
 */
router.get('/factories/:brandId/staff', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的工厂ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const staff = await platformService.getBrandStaff(req.params.brandId);
        res.json({
            success: true,
            data: staff,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/platform/staff/:staffId/stats
 * @desc 获取商务的工作统计
 * @access Platform Admin
 */
router.get('/staff/:staffId/stats', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('staffId').isUUID().withMessage('无效的商务ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const stats = await platformService.getStaffWorkStats(req.params.staffId);
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
 * @route GET /api/platform/staff/:staffId/influencers
 * @desc 获取商务添加的达人列表
 * @access Platform Admin
 */
router.get('/staff/:staffId/influencers', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('staffId').isUUID().withMessage('无效的商务ID'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = await platformService.getStaffInfluencers(req.params.staffId, { page, pageSize });
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
 * @route GET /api/platform/staff/:staffId/collaborations
 * @desc 获取商务的合作列表
 * @access Platform Admin
 */
router.get('/staff/:staffId/collaborations', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('staffId').isUUID().withMessage('无效的商务ID'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = await platformService.getStaffCollaborations(req.params.staffId, { page, pageSize });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ Platform Statistics Routes ============
/**
 * @route GET /api/platform/stats
 * @desc 获取平台统计数据
 * @access Platform Admin
 */
router.get('/stats', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, async (_req, res, next) => {
    try {
        const stats = await platformService.getPlatformStats();
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
 * @route GET /api/platform/stats/detailed
 * @desc 获取平台详细统计数据
 * @access Platform Admin
 */
router.get('/stats/detailed', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const stats = await platformService.getPlatformDetailedStats(startDate, endDate);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ Influencer Management Routes (Platform Admin) ============
/**
 * @route GET /api/platform/influencers
 * @desc 获取所有达人列表（平台级别）
 * @access Platform Admin
 */
router.get('/influencers', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('keyword').optional().isString(),
    (0, express_validator_1.query)('platform').optional().isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER']).withMessage('无效的平台'),
    (0, express_validator_1.query)('brandId').optional().isUUID().withMessage('无效的工厂ID'),
    (0, express_validator_1.query)('sourceType').optional().isIn(['PLATFORM', 'FACTORY', 'STAFF']).withMessage('无效的来源类型'),
    (0, express_validator_1.query)('verificationStatus').optional().isIn(['UNVERIFIED', 'VERIFIED', 'REJECTED']).withMessage('无效的认证状态'),
    (0, express_validator_1.query)('createdBy').optional().isUUID().withMessage('无效的用户ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const keyword = req.query.keyword;
        const platform = req.query.platform;
        const brandId = req.query.brandId;
        const sourceType = req.query.sourceType;
        const verificationStatus = req.query.verificationStatus;
        const createdBy = req.query.createdBy;
        const result = await platformService.listAllInfluencers({ keyword, platform, brandId, sourceType, verificationStatus, createdBy }, { page, pageSize });
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
 * @route POST /api/platform/influencers
 * @desc 平台管理员创建达人（入库到指定品牌）
 * @access Platform Admin
 */
router.post('/influencers', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.body)('brandId').isUUID().withMessage('请选择目标品牌'),
    (0, express_validator_1.body)('nickname').trim().notEmpty().withMessage('达人昵称不能为空'),
    (0, express_validator_1.body)('platform').isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'SHIPINHAO', 'WEIBO', 'BILIBILI', 'TAOBAO', 'OTHER']).withMessage('无效的平台'),
    (0, express_validator_1.body)('platformId').trim().notEmpty().withMessage('平台账号ID不能为空'),
    (0, express_validator_1.body)('uid').optional().isString(),
    (0, express_validator_1.body)('homeUrl').optional().isString(),
    (0, express_validator_1.body)('phone').optional().isString(),
    (0, express_validator_1.body)('wechat').optional().isString(),
    (0, express_validator_1.body)('followers').optional().isString(),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('notes').optional().isString(),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { brandId, nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, tags, notes, } = req.body;
        const adminId = req.user.userId;
        const influencer = await platformService.createInfluencerForBrand({
            brandId,
            nickname,
            platform,
            platformId,
            uid,
            homeUrl,
            phone,
            wechat,
            followers,
            tags: tags || [],
            notes,
            createdBy: adminId,
            sourceType: 'PLATFORM',
        });
        res.status(201).json({
            success: true,
            data: influencer,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/platform/influencers/:influencerId
 * @desc 获取达人详情（平台级别）
 * @access Platform Admin
 */
router.get('/influencers/:influencerId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('influencerId').isUUID().withMessage('无效的达人ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const influencer = await platformService.getInfluencerDetail(req.params.influencerId);
        res.json({
            success: true,
            data: influencer,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/influencers/:influencerId/verify
 * @desc 认证达人
 * @access Platform Admin
 */
router.post('/influencers/:influencerId/verify', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('influencerId').isUUID().withMessage('无效的达人ID'),
    (0, express_validator_1.body)('status').isIn(['VERIFIED', 'REJECTED']).withMessage('状态必须为 VERIFIED 或 REJECTED'),
    (0, express_validator_1.body)('note').optional().isString().withMessage('备注必须为字符串'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { status, note } = req.body;
        const adminId = req.user.userId;
        const influencer = await platformService.verifyInfluencer(req.params.influencerId, adminId, status, note);
        res.json({
            success: true,
            data: influencer,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/platform/influencers/stats
 * @desc 获取达人统计数据
 * @access Platform Admin
 */
router.get('/influencers-stats', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const stats = await platformService.getInfluencerStats(startDate, endDate);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ User Management Routes ============
/**
 * @route GET /api/platform/users
 * @desc 获取所有用户列表
 * @access Platform Admin
 */
router.get('/users', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('role').optional().isIn(['PLATFORM_ADMIN', 'BRAND', 'BUSINESS']).withMessage('无效的角色'),
    (0, express_validator_1.query)('isActive').optional().isBoolean().withMessage('isActive 必须为布尔值'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search;
        const role = req.query.role;
        const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
        const result = await platformService.listAllUsers({ search, role, isActive }, { page, pageSize });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============ 独立商务管理 Routes ============
// 注意：此路由必须在 /users/:userId 之前定义，否则 independent 会被当作 userId
/**
 * @route GET /api/platform/users/independent
 * @desc 获取独立商务列表（不隶属任何品牌）
 * @access Platform Admin
 */
router.get('/users/independent', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('keyword').optional().isString(),
], handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const keyword = req.query.keyword;
        const result = await platformService.getIndependentBusinessUsers({ page, pageSize }, keyword);
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
 * @route GET /api/platform/users/:userId
 * @desc 获取用户详情
 * @access Platform Admin
 */
router.get('/users/:userId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('userId').isUUID().withMessage('无效的用户ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const user = await platformService.getUserDetail(req.params.userId);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/users/:userId/toggle-status
 * @desc 切换用户状态（启用/禁用）
 * @access Platform Admin
 */
router.post('/users/:userId/toggle-status', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('userId').isUUID().withMessage('无效的用户ID'),
    (0, express_validator_1.body)('isActive').isBoolean().withMessage('isActive 必须为布尔值'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const adminId = req.user.userId;
        await platformService.toggleUserStatus(req.params.userId, isActive, adminId);
        res.json({
            success: true,
            data: { message: isActive ? '用户已启用' : '用户已禁用' },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/platform/users/:userId
 * @desc 删除用户
 * @access Platform Admin
 */
router.delete('/users/:userId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('userId').isUUID().withMessage('无效的用户ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        await platformService.deleteUser(req.params.userId);
        res.json({
            success: true,
            data: { message: '用户已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/platform/brands/:brandId/members
 * @desc 获取品牌成员列表（主账号+商务）
 * @access Platform Admin
 */
router.get('/brands/:brandId/members', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('brandId').isUUID().withMessage('无效的品牌ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const members = await platformService.getBrandMembers(req.params.brandId);
        res.json({
            success: true,
            data: members,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/platform/users/:userId/assign-brand
 * @desc 将独立商务划归到品牌
 * @access Platform Admin
 */
router.post('/users/:userId/assign-brand', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('userId').isUUID().withMessage('无效的用户ID'),
    (0, express_validator_1.body)('brandId').isUUID().withMessage('无效的品牌ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const { brandId } = req.body;
        await platformService.assignUserToBrand(req.params.userId, brandId);
        res.json({
            success: true,
            data: { message: '商务已成功划归到品牌' },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/platform/influencers/:influencerId
 * @desc 删除达人（平台管理员）
 * @access Platform Admin
 */
router.delete('/influencers/:influencerId', auth_middleware_1.authenticate, auth_middleware_1.requirePlatformAdmin, [
    (0, express_validator_1.param)('influencerId').isUUID().withMessage('无效的达人ID'),
], handleValidationErrors, async (req, res, next) => {
    try {
        await platformService.deleteInfluencer(req.params.influencerId);
        res.json({
            success: true,
            data: { message: '达人已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=platform.routes.js.map