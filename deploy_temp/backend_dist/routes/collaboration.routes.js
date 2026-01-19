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
const collaborationService = __importStar(require("../services/collaboration.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
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
// 验证规则
const createCollaborationValidation = [
    (0, express_validator_1.body)('influencerId').isUUID().withMessage('无效的达人 ID'),
    (0, express_validator_1.body)('stage')
        .optional()
        .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
        .withMessage('无效的阶段状态'),
    (0, express_validator_1.body)('deadline').optional().isISO8601().withMessage('无效的截止时间格式'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const updateStageValidation = [
    (0, express_validator_1.body)('stage')
        .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
        .withMessage('无效的阶段状态'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const setDeadlineValidation = [
    (0, express_validator_1.body)('deadline').optional({ nullable: true }).isISO8601().withMessage('无效的截止时间格式'),
];
const setBlockReasonValidation = [
    (0, express_validator_1.body)('reason')
        .optional({ nullable: true })
        .isIn(['PRICE_HIGH', 'DELAYED', 'UNCOOPERATIVE', 'OTHER', null])
        .withMessage('无效的卡点原因'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const addFollowUpValidation = [
    (0, express_validator_1.body)('content').trim().notEmpty().withMessage('跟进内容不能为空'),
];
const idParamValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('无效的 ID'),
];
const validateDataValidation = [
    (0, express_validator_1.body)('type')
        .isIn(['collaboration', 'dispatch', 'result'])
        .withMessage('无效的数据类型'),
    (0, express_validator_1.body)('data').isObject().withMessage('数据必须是对象'),
];
// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.enrichUserData);
// ==================== 合作记录路由 ====================
/**
 * @route GET /api/collaborations
 * @desc 获取合作记录列表
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的合作记录
 */
router.get('/', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.filterByPermission)('dataVisibility.viewOthersCollaborations'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const filter = {
            stage: req.query.stage,
            businessStaffId: req.query.businessStaffId,
            influencerId: req.query.influencerId,
            isOverdue: req.query.isOverdue === 'true' ? true :
                req.query.isOverdue === 'false' ? false : undefined,
            keyword: req.query.keyword,
        };
        const result = await collaborationService.listCollaborations(brandId, filter, { page, pageSize }, req.user.userId, req.user.role);
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
 * @route GET /api/collaborations/pipeline
 * @desc 获取管道视图数据
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的合作记录
 */
router.get('/pipeline', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.filterByPermission)('dataVisibility.viewOthersCollaborations'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const filter = {
            businessStaffId: req.query.businessStaffId,
            keyword: req.query.keyword,
        };
        const pipelineView = await collaborationService.getPipelineView(brandId, filter, req.user.userId, req.user.role);
        res.json({
            success: true,
            data: pipelineView,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/stats
 * @desc 获取管道统计数据
 * @access Private (工厂成员)
 */
router.get('/stats', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const stats = await collaborationService.getPipelineStats(brandId);
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
 * @route GET /api/collaborations/overdue
 * @desc 获取超期合作列表
 * @access Private (工厂成员)
 */
router.get('/overdue', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const result = await collaborationService.getOverdueCollaborations(brandId, { page, pageSize });
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
 * @route GET /api/collaborations/follow-up-templates
 * @desc 获取跟进模板列表
 * @access Private (工厂成员)
 */
router.get('/follow-up-templates', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const templates = await collaborationService.getFollowUpTemplates();
        res.json({
            success: true,
            data: { templates },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/suggestions
 * @desc 获取智能建议（样品、报价、排期）
 * @access Private (工厂成员)
 */
router.get('/suggestions', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const influencerId = req.query.influencerId;
        const type = req.query.type;
        if (!influencerId) {
            throw (0, errorHandler_1.createBadRequestError)('缺少达人ID参数');
        }
        if (!type || !['sample', 'price', 'schedule'].includes(type)) {
            throw (0, errorHandler_1.createBadRequestError)('无效的建议类型，必须是 sample、price 或 schedule');
        }
        const suggestions = await collaborationService.getCollaborationSuggestions(brandId, influencerId, type);
        res.json({
            success: true,
            data: suggestions,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/follow-up-reminders
 * @desc 获取跟进提醒列表
 * @access Private (工厂成员)
 * @permission dataVisibility.viewOthersCollaborations - 如果没有此权限，只能看到自己的提醒
 */
router.get('/follow-up-reminders', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const reminders = await collaborationService.getFollowUpReminders(brandId, req.user.userId, req.user.role);
        res.json({
            success: true,
            data: reminders,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/follow-up-analytics
 * @desc 获取跟进分析数据
 * @access Private (工厂成员)
 */
router.get('/follow-up-analytics', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const staffId = req.query.staffId;
        const period = req.query.period || 'month';
        const analytics = await collaborationService.getFollowUpAnalytics(brandId, staffId, period);
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/:id
 * @desc 获取合作记录详情
 * @access Private (工厂成员)
 */
router.get('/:id', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const collaboration = await collaborationService.getCollaborationById(req.params.id, brandId);
        res.json({
            success: true,
            data: { collaboration },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/collaborations
 * @desc 创建合作记录
 * @access Private (商务人员)
 * @permission operations.manageCollaborations - 需要合作管理权限
 * @note 如果该达人已被其他商务跟进，返回 409 冲突状态码
 *       前端可传入 forceCreate=true 强制创建（忽略冲突）
 */
router.post('/', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageCollaborations'), createCollaborationValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const businessStaffId = req.user.userId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { influencerId, stage, sampleId, quotedPrice, deadline, notes, forceCreate } = req.body;
        const collaboration = await collaborationService.createCollaboration({
            influencerId,
            brandId,
            businessStaffId,
            stage,
            sampleId,
            quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
            deadline: deadline ? new Date(deadline) : undefined,
            notes,
        }, forceCreate === true);
        res.status(201).json({
            success: true,
            data: { collaboration },
        });
    }
    catch (error) {
        // 特殊处理冲突错误，返回 409 状态码和冲突详情
        if (error.name === 'CollaborationConflict') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'COLLABORATION_CONFLICT',
                    message: error.message,
                },
                data: {
                    conflicts: error.conflicts, // 返回所有冲突的商务列表
                },
            });
            return;
        }
        next(error);
    }
});
/**
 * @route DELETE /api/collaborations/:id
 * @desc 删除合作记录
 * @access Private (工厂成员)
 * @permission operations.deleteCollaborations - 需要删除合作记录权限
 */
router.delete('/:id', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.deleteCollaborations'), idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        await collaborationService.deleteCollaboration(req.params.id, brandId);
        res.json({
            success: true,
            data: { message: '合作记录已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 阶段状态路由 ====================
/**
 * @route PUT /api/collaborations/:id/stage
 * @desc 更新合作阶段
 * @access Private (商务人员)
 */
router.put('/:id/stage', auth_middleware_1.requireFactoryMember, idParamValidation, updateStageValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { stage, notes } = req.body;
        const collaboration = await collaborationService.updateStage(req.params.id, brandId, stage, notes);
        res.json({
            success: true,
            data: { collaboration },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/collaborations/:id/history
 * @desc 获取阶段变更历史
 * @access Private (工厂成员)
 */
router.get('/:id/history', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const history = await collaborationService.getStageHistory(req.params.id, brandId);
        res.json({
            success: true,
            data: { history },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 截止时间路由 ====================
/**
 * @route PUT /api/collaborations/:id/deadline
 * @desc 设置截止时间
 * @access Private (商务人员)
 */
router.put('/:id/deadline', auth_middleware_1.requireFactoryMember, idParamValidation, setDeadlineValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { deadline } = req.body;
        const collaboration = await collaborationService.setDeadline(req.params.id, brandId, deadline ? new Date(deadline) : null);
        res.json({
            success: true,
            data: { collaboration },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 卡点原因路由 ====================
/**
 * @route PUT /api/collaborations/:id/block-reason
 * @desc 设置卡点原因
 * @access Private (商务人员)
 */
router.put('/:id/block-reason', auth_middleware_1.requireFactoryMember, idParamValidation, setBlockReasonValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { reason, notes } = req.body;
        const collaboration = await collaborationService.setBlockReason(req.params.id, brandId, reason, notes);
        res.json({
            success: true,
            data: { collaboration },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 跟进记录路由 ====================
/**
 * @route GET /api/collaborations/:id/follow-ups
 * @desc 获取跟进记录列表
 * @access Private (工厂成员)
 */
router.get('/:id/follow-ups', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const result = await collaborationService.getFollowUps(req.params.id, brandId, { page, pageSize });
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
 * @route POST /api/collaborations/:id/follow-ups
 * @desc 添加跟进记录
 * @access Private (商务人员)
 */
router.post('/:id/follow-ups', auth_middleware_1.requireFactoryMember, idParamValidation, addFollowUpValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const userId = req.user.userId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { content } = req.body;
        const followUp = await collaborationService.addFollowUp(req.params.id, brandId, userId, content);
        res.status(201).json({
            success: true,
            data: { followUp },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/collaborations/:id/follow-up/quick
 * @desc 快速跟进（支持图片上传）
 * @access Private (商务人员)
 */
router.post('/:id/follow-up/quick', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const userId = req.user.userId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        // For now, we'll handle this as a simple text follow-up
        // In a production environment, you would use multer or similar for file uploads
        const { content, images } = req.body;
        if (!content || !content.trim()) {
            throw (0, errorHandler_1.createBadRequestError)('跟进内容不能为空');
        }
        const followUp = await collaborationService.addFollowUp(req.params.id, brandId, userId, content.trim());
        res.status(201).json({
            success: true,
            data: { followUp },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/collaborations/batch-update
 * @desc 批量更新合作记录
 * @access Private (商务人员)
 * @permission operations.manageCollaborations - 需要合作管理权限
 */
router.post('/batch-update', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageCollaborations'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { ids, operation, data } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw (0, errorHandler_1.createBadRequestError)('请选择要操作的合作记录');
        }
        if (!operation) {
            throw (0, errorHandler_1.createBadRequestError)('请指定操作类型');
        }
        if (!['dispatch', 'updateStage', 'setDeadline'].includes(operation)) {
            throw (0, errorHandler_1.createBadRequestError)('不支持的操作类型');
        }
        const result = await collaborationService.batchUpdateCollaborations(brandId, {
            ids,
            operation,
            data,
        });
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
 * @route POST /api/collaborations/validate
 * @desc 验证合作数据
 * @access Private (工厂成员)
 */
router.post('/validate', auth_middleware_1.requireFactoryMember, validateDataValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { type, data } = req.body;
        const result = await collaborationService.validateData(brandId, type, data);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=collaboration.routes.js.map