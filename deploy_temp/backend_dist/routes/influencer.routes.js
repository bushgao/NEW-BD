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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const influencerService = __importStar(require("../services/influencer.service"));
const importService = __importStar(require("../services/import.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const influencer_group_routes_1 = __importDefault(require("./influencer-group.routes"));
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'text/csv',
            'application/csv',
        ];
        if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error('只支持 Excel (.xlsx, .xls) 或 CSV 文件'));
        }
    },
});
const router = (0, express_1.Router)();
// Mount group routes
router.use('/groups', influencer_group_routes_1.default);
// Validation middleware
const handleValidationErrors = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages, errors.array());
    }
    next();
};
// Validation rules
const createInfluencerValidation = [
    (0, express_validator_1.body)('nickname').trim().notEmpty().withMessage('请输入达人昵称'),
    (0, express_validator_1.body)('platform')
        .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
        .withMessage('无效的平台类型'),
    (0, express_validator_1.body)('platformId').trim().notEmpty().withMessage('请输入平台账号ID'),
    (0, express_validator_1.body)('uid').optional().trim(),
    (0, express_validator_1.body)('homeUrl').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('wechat').optional().trim(),
    (0, express_validator_1.body)('shippingAddress').optional().trim(),
    (0, express_validator_1.body)('followers').optional().trim(),
    (0, express_validator_1.body)('categories').optional().isArray().withMessage('类目必须是数组'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('标签必须是数组'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const updateInfluencerValidation = [
    (0, express_validator_1.body)('nickname').optional().trim().notEmpty().withMessage('达人昵称不能为空'),
    (0, express_validator_1.body)('platform')
        .optional()
        .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
        .withMessage('无效的平台类型'),
    (0, express_validator_1.body)('platformId').optional().trim().notEmpty().withMessage('平台账号ID不能为空'),
    (0, express_validator_1.body)('uid').optional().trim(),
    (0, express_validator_1.body)('homeUrl').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('wechat').optional().trim(),
    (0, express_validator_1.body)('shippingAddress').optional().trim(),
    (0, express_validator_1.body)('followers').optional().trim(),
    (0, express_validator_1.body)('categories').optional().isArray().withMessage('类目必须是数组'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('标签必须是数组'),
    (0, express_validator_1.body)('notes').optional().trim(),
];
const listInfluencerValidation = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('keyword').optional().trim(),
    (0, express_validator_1.query)('platform')
        .optional()
        .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
        .withMessage('无效的平台类型'),
    (0, express_validator_1.query)('category').optional().trim(),
    (0, express_validator_1.query)('tags').optional(),
    (0, express_validator_1.query)('pipelineStage')
        .optional()
        .isIn(['LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'])
        .withMessage('无效的管道阶段'),
    (0, express_validator_1.query)('businessStaffId').optional().isUUID().withMessage('无效的商务ID'),
];
const checkDuplicateValidation = [
    (0, express_validator_1.query)('phone').optional().trim(),
    (0, express_validator_1.query)('platform')
        .optional()
        .isIn(['DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER'])
        .withMessage('无效的平台类型'),
    (0, express_validator_1.query)('platformId').optional().trim(),
];
const tagsValidation = [
    (0, express_validator_1.body)('tags').isArray({ min: 1 }).withMessage('请提供至少一个标签'),
    (0, express_validator_1.body)('tags.*').isString().trim().notEmpty().withMessage('标签不能为空'),
];
const idParamValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('无效的达人ID'),
];
/**
 * @route GET /api/influencers
 * @desc List influencers with filtering and pagination
 * @access Private (Factory Member)
 * @permission dataVisibility.viewOthersInfluencers - 如果没有此权限，只能看到自己创建的达人
 */
// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.enrichUserData);
router.get('/', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.filterByPermission)('dataVisibility.viewOthersInfluencers'), listInfluencerValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        // Parse tags from query string
        let tags;
        if (req.query.tags) {
            tags = Array.isArray(req.query.tags)
                ? req.query.tags
                : [req.query.tags];
        }
        const filter = {
            keyword: req.query.keyword,
            platform: req.query.platform,
            category: req.query.category,
            tags,
            pipelineStage: req.query.pipelineStage,
            businessStaffId: req.query.businessStaffId,
        };
        const result = await influencerService.list(brandId, filter, { page, pageSize }, req.user.userId, req.user.role);
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
 * @route GET /api/influencers/check-duplicate
 * @desc Check for duplicate influencer
 * @access Private (Factory Member)
 */
router.get('/check-duplicate', auth_middleware_1.requireFactoryMember, checkDuplicateValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { phone, platform, platformId } = req.query;
        const result = await influencerService.checkDuplicate(brandId, phone, platform, platformId);
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
 * @route GET /api/influencers/tags
 * @desc Get all unique tags in factory
 * @access Private (Factory Member)
 */
router.get('/tags', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const tags = await influencerService.getAllTags(brandId);
        res.json({
            success: true,
            data: { tags },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/influencers/categories
 * @desc Get all unique categories in factory
 * @access Private (Factory Member)
 */
router.get('/categories', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const categories = await influencerService.getAllCategories(brandId);
        res.json({
            success: true,
            data: { categories },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/influencers/:id
 * @desc Get influencer by ID
 * @access Private (Factory Member)
 */
router.get('/:id', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const influencer = await influencerService.getById(req.params.id, brandId);
        res.json({
            success: true,
            data: { influencer },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/influencers/from-global
 * @desc 从全局达人池拉入达人到品牌库
 * @access Private (Factory Member)
 */
router.post('/from-global', auth_middleware_1.requireFactoryMember, [
    (0, express_validator_1.body)('globalInfluencerId').isUUID().withMessage('无效的全局达人ID'),
    (0, express_validator_1.body)('nickname').trim().notEmpty().withMessage('请输入达人昵称'),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('wechat').optional().trim(),
], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { globalInfluencerId, nickname, phone, wechat } = req.body;
        // 创建品牌达人记录，关联全局达人
        const influencer = await influencerService.createFromGlobalPool({
            brandId,
            globalInfluencerId,
            nickname,
            phone,
            wechat,
            userId: req.user.userId,
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
 * @route POST /api/influencers
 * @desc Create a new influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.post('/', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageInfluencers'), createInfluencerValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, categories, tags, notes } = req.body;
        const influencer = await influencerService.create({
            brandId,
            nickname,
            platform,
            platformId,
            uid,
            homeUrl,
            phone,
            wechat,
            followers,
            categories,
            tags,
            notes,
            userId: req.user.userId, // 记录添加人ID用于来源追踪
        });
        res.status(201).json({
            success: true,
            data: { influencer },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/influencers/:id
 * @desc Update influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.put('/:id', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageInfluencers'), idParamValidation, updateInfluencerValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { nickname, platform, platformId, uid, homeUrl, phone, wechat, followers, categories, tags, notes } = req.body;
        const influencer = await influencerService.update(req.params.id, brandId, {
            nickname,
            platform,
            platformId,
            uid,
            homeUrl,
            phone,
            wechat,
            followers,
            categories,
            tags,
            notes,
        });
        res.json({
            success: true,
            data: { influencer },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/influencers/:id
 * @desc Delete influencer
 * @access Private (Factory Member)
 * @permission operations.manageInfluencers - 需要达人管理权限
 */
router.delete('/:id', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.manageInfluencers'), idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        await influencerService.remove(req.params.id, brandId);
        res.json({
            success: true,
            data: { message: '达人已删除' },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/influencers/:id/tags
 * @desc Add tags to influencer
 * @access Private (Factory Member)
 */
router.post('/:id/tags', auth_middleware_1.requireFactoryMember, idParamValidation, tagsValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { tags } = req.body;
        const influencer = await influencerService.addTags(req.params.id, brandId, tags);
        res.json({
            success: true,
            data: { influencer },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route DELETE /api/influencers/:id/tags
 * @desc Remove tags from influencer
 * @access Private (Factory Member)
 */
router.delete('/:id/tags', auth_middleware_1.requireFactoryMember, idParamValidation, tagsValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { tags } = req.body;
        const influencer = await influencerService.removeTags(req.params.id, brandId, tags);
        res.json({
            success: true,
            data: { influencer },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== Import Routes ====================
/**
 * @route POST /api/influencers/import/parse
 * @desc Parse uploaded file and return headers for mapping
 * @access Private (Factory Member)
 */
router.post('/import/parse', auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        const { headers } = importService.parseFile(req.file.buffer);
        const suggestedMapping = importService.suggestMapping(headers);
        res.json({
            success: true,
            data: {
                headers,
                suggestedMapping,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/influencers/import/preview
 * @desc Preview import with validation and duplicate checking
 * @access Private (Factory Member)
 */
router.post('/import/preview', auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        // Parse mapping from body
        const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
        if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
            throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（昵称、平台、平台账号ID为必填）');
        }
        const result = await importService.previewImport(req.file.buffer, mapping, brandId);
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
 * @route POST /api/influencers/import/execute
 * @desc Execute batch import
 * @access Private (Factory Member)
 */
router.post('/import/execute', auth_middleware_1.requireFactoryMember, upload.single('file'), async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        if (!req.file) {
            throw (0, errorHandler_1.createBadRequestError)('请上传文件');
        }
        // Parse mapping from body
        const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
        if (!mapping || !mapping.nickname || !mapping.platform || !mapping.platformId) {
            throw (0, errorHandler_1.createBadRequestError)('请提供字段映射（昵称、平台、平台账号ID为必填）');
        }
        const skipDuplicates = req.body.skipDuplicates !== 'false';
        const result = await importService.executeImport(req.file.buffer, mapping, brandId, skipDuplicates);
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
 * @route GET /api/influencers/recommendations
 * @desc Get smart influencer recommendations
 * @access Private (Factory Member)
 */
router.get('/recommendations', auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const userId = req.user.userId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        // Get recommendations based on:
        // 1. Historical collaborations (influencers with successful past collaborations)
        // 2. High ROI influencers
        // 3. Recently contacted influencers
        const recommendations = await influencerService.getSmartRecommendations(brandId, userId);
        res.json({
            success: true,
            data: { recommendations },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/influencers/batch/tags
 * @desc Batch add tags to influencers
 * @access Private (Factory Member)
 */
router.post('/batch/tags', auth_middleware_1.requireFactoryMember, (0, permission_middleware_1.checkPermission)('operations.batchOperations'), [
    (0, express_validator_1.body)('influencerIds').isArray().withMessage('达人ID列表必须是数组'),
    (0, express_validator_1.body)('influencerIds.*').isUUID().withMessage('无效的达人ID'),
    (0, express_validator_1.body)('tags').isArray().withMessage('标签列表必须是数组'),
    (0, express_validator_1.body)('tags.*').isString().withMessage('标签必须是字符串'),
], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const { influencerIds, tags } = req.body;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        // Verify all influencers belong to the factory
        const influencers = await influencerService.getInfluencersByIds(influencerIds, brandId);
        if (influencers.length !== influencerIds.length) {
            throw (0, errorHandler_1.createBadRequestError)('部分达人不存在或不属于当前工厂');
        }
        // Add tags to all influencers
        await influencerService.batchAddTags(influencerIds, tags);
        res.json({
            success: true,
            data: {
                message: `已为 ${influencerIds.length} 个达人添加标签`,
                count: influencerIds.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/influencers/:id/collaboration-history
 * @desc Get influencer collaboration history
 * @access Private (Factory Member)
 */
router.get('/:id/collaboration-history', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const history = await influencerService.getCollaborationHistory(req.params.id, brandId);
        res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/influencers/:id/roi-stats
 * @desc Get influencer ROI statistics
 * @access Private (Factory Member)
 */
router.get('/:id/roi-stats', auth_middleware_1.requireFactoryMember, idParamValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const stats = await influencerService.getROIStats(req.params.id, brandId);
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
 * @route PUT /api/influencers/:id/group
 * @desc Move influencer to group
 * @access Private (Factory Member)
 */
router.put('/:id/group', auth_middleware_1.requireFactoryMember, idParamValidation, [(0, express_validator_1.body)('groupId').optional().isUUID().withMessage('无效的分组ID')], handleValidationErrors, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        if (!brandId) {
            throw (0, errorHandler_1.createBadRequestError)('用户未关联工厂');
        }
        const { groupId } = req.body;
        // Import group service
        const groupService = await Promise.resolve().then(() => __importStar(require('../services/influencer-group.service')));
        await groupService.moveInfluencerToGroup(req.params.id, groupId || null, brandId);
        res.json({
            success: true,
            data: { message: '达人已移动到分组' },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=influencer.routes.js.map