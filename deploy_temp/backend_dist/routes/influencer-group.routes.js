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
const groupService = __importStar(require("../services/influencer-group.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(auth_middleware_1.enrichUserData);
/**
 * @route   POST /api/influencers/groups
 * @desc    Create a new influencer group
 * @access  Private
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { name, color, description } = req.body;
        const brandId = req.user.brandId;
        const userId = req.user.userId;
        if (!brandId) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '用户未关联品牌' },
            });
        }
        if (!name) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '分组名称不能为空' },
            });
        }
        const group = await groupService.createGroup({
            brandId,
            name,
            color,
            description,
            createdBy: userId,
        });
        res.status(201).json({
            success: true,
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   GET /api/influencers/groups
 * @desc    List all groups in factory
 * @access  Private
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const brandId = req.user.brandId;
        const groups = await groupService.listGroups(brandId);
        res.json({
            success: true,
            data: groups,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   GET /api/influencers/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brandId;
        const group = await groupService.getGroupById(id, brandId);
        res.json({
            success: true,
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   GET /api/influencers/groups/:id/stats
 * @desc    Get group statistics
 * @access  Private
 */
router.get('/:id/stats', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brandId;
        const stats = await groupService.getGroupStats(id, brandId);
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
 * @route   GET /api/influencers/groups/:id/influencers
 * @desc    Get influencers in a group
 * @access  Private
 */
router.get('/:id/influencers', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brandId;
        const influencers = await groupService.getGroupInfluencers(id, brandId);
        res.json({
            success: true,
            data: influencers,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   PUT /api/influencers/groups/:id
 * @desc    Update group
 * @access  Private
 */
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brandId;
        const { name, color, description } = req.body;
        const group = await groupService.updateGroup(id, brandId, {
            name,
            color,
            description,
        });
        res.json({
            success: true,
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   DELETE /api/influencers/groups/:id
 * @desc    Delete group
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brandId;
        await groupService.deleteGroup(id, brandId);
        res.json({
            success: true,
            message: '分组已删除',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   POST /api/influencers/groups/batch-move
 * @desc    Batch move influencers to group
 * @access  Private
 */
router.post('/batch-move', auth_middleware_1.authenticate, auth_middleware_1.requireFactoryMember, async (req, res, next) => {
    try {
        const { influencerIds, groupId } = req.body;
        const brandId = req.user.brandId;
        if (!influencerIds || !Array.isArray(influencerIds) || influencerIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '请选择要移动的达人' },
            });
        }
        await groupService.batchMoveInfluencersToGroup(influencerIds, groupId, brandId);
        res.json({
            success: true,
            message: `已将 ${influencerIds.length} 个达人移动到分组`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=influencer-group.routes.js.map