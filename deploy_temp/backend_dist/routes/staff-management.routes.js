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
const auth_middleware_1 = require("../middleware/auth.middleware");
const staffManagementService = __importStar(require("../services/staff-management.service"));
const router = (0, express_1.Router)();
// Apply enrichUserData to all routes to ensure brandId is available
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.enrichUserData);
// Helper function to wrap async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
/**
 * GET /api/staff
 * 获取工厂商务账号列表
 * 权限：工厂老板
 */
router.get('/', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const brandId = req.user.brandId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await staffManagementService.listStaff(brandId, { page, pageSize });
    res.json(result);
}));
/**
 * GET /api/staff/quota
 * 获取配额使用情况
 * 权限：工厂老板
 */
router.get('/quota', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const brandId = req.user.brandId;
    const quotaUsage = await staffManagementService.getQuotaUsage(brandId);
    res.json(quotaUsage);
}));
/**
 * GET /api/staff/permission-templates
 * 获取权限模板列表
 * 权限：工厂老板
 */
router.get('/permission-templates', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const templates = staffManagementService.getPermissionTemplates();
    res.json({ templates });
}));
/**
 * GET /api/staff/:id
 * 获取商务账号详情（含工作统计）
 * 权限：工厂老板
 */
router.get('/:id', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brandId = req.user.brandId;
    const staffDetail = await staffManagementService.getStaffDetail(id, brandId);
    res.json(staffDetail);
}));
/**
 * POST /api/staff
 * 创建商务账号（检查配额）
 * 权限：工厂老板
 */
router.post('/', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const brandId = req.user.brandId;
    const { name, email, phone, password } = req.body;
    // 验证必填字段（手机号是必填的）
    if (!name || !phone || !password) {
        res.status(400).json({
            error: 'BAD_REQUEST',
            message: '请提供手机号',
        });
        return;
    }
    const staffMember = await staffManagementService.createStaff(brandId, {
        name,
        email,
        phone,
        password,
    });
    res.status(201).json(staffMember);
}));
/**
 * PUT /api/staff/:id/status
 * 更新商务账号状态（启用/禁用）
 * 权限：工厂老板
 */
router.put('/:id/status', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brandId = req.user.brandId;
    const { status } = req.body;
    // 验证 status 字段
    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) {
        res.status(400).json({
            error: 'BAD_REQUEST',
            message: '状态必须为 ACTIVE 或 DISABLED',
        });
        return;
    }
    const staffMember = await staffManagementService.updateStaffStatus(id, brandId, status);
    res.json(staffMember);
}));
/**
 * DELETE /api/staff/:id
 * 删除商务账号（保留业务数据）
 * 权限：工厂老板
 */
router.delete('/:id', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brandId = req.user.brandId;
    await staffManagementService.deleteStaff(id, brandId);
    res.status(204).send();
}));
/**
 * GET /api/staff/:staffId/permissions
 * 获取商务权限
 * 权限：工厂老板
 */
router.get('/:staffId/permissions', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const { staffId } = req.params;
    const brandId = req.user.brandId;
    const result = await staffManagementService.getStaffPermissions(staffId, brandId);
    res.json(result);
}));
/**
 * PUT /api/staff/:staffId/permissions
 * 更新商务权限
 * 权限：工厂老板
 */
router.put('/:staffId/permissions', (0, auth_middleware_1.requireRoles)('BRAND'), asyncHandler(async (req, res) => {
    const { staffId } = req.params;
    const brandId = req.user.brandId;
    const { permissions } = req.body;
    // 验证必填字段
    if (!permissions) {
        res.status(400).json({
            error: 'BAD_REQUEST',
            message: '权限配置为必填项',
        });
        return;
    }
    const result = await staffManagementService.updateStaffPermissions(staffId, brandId, permissions);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=staff-management.routes.js.map