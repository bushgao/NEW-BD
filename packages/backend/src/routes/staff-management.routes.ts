import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, enrichUserData } from '../middleware/auth.middleware';
import * as staffManagementService from '../services/staff-management.service';

const router = Router();

// Apply enrichUserData to all routes to ensure brandId is available
router.use(authenticate);
router.use(enrichUserData);

// Helper function to wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * GET /api/staff
 * 获取工厂商务账号列表
 * 权限：工厂老板
 */
router.get(
  '/',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.user!.brandId!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await staffManagementService.listStaff(brandId, { page, pageSize });

    res.json(result);
  })
);

/**
 * GET /api/staff/quota
 * 获取配额使用情况
 * 权限：工厂老板
 */
router.get(
  '/quota',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.user!.brandId!;

    const quotaUsage = await staffManagementService.getQuotaUsage(brandId);

    res.json(quotaUsage);
  })
);

/**
 * GET /api/staff/permission-templates
 * 获取权限模板列表
 * 权限：工厂老板
 */
router.get(
  '/permission-templates',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const templates = staffManagementService.getPermissionTemplates();

    res.json({ templates });
  })
);

/**
 * GET /api/staff/:id
 * 获取商务账号详情（含工作统计）
 * 权限：工厂老板
 */
router.get(
  '/:id',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const brandId = req.user!.brandId!;

    const staffDetail = await staffManagementService.getStaffDetail(id, brandId);

    res.json(staffDetail);
  })
);

/**
 * POST /api/staff
 * 创建商务账号（检查配额）
 * 权限：工厂老板
 */
router.post(
  '/',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.user!.brandId!;
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
  })
);

/**
 * PUT /api/staff/:id/status
 * 更新商务账号状态（启用/禁用）
 * 权限：工厂老板
 */
router.put(
  '/:id/status',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const brandId = req.user!.brandId!;
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
  })
);

/**
 * DELETE /api/staff/:id
 * 删除商务账号（保留业务数据）
 * 权限：工厂老板
 */
router.delete(
  '/:id',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const brandId = req.user!.brandId!;

    await staffManagementService.deleteStaff(id, brandId);

    res.status(204).send();
  })
);

/**
 * GET /api/staff/:staffId/permissions
 * 获取商务权限
 * 权限：工厂老板
 */
router.get(
  '/:staffId/permissions',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { staffId } = req.params;
    const brandId = req.user!.brandId!;

    const result = await staffManagementService.getStaffPermissions(staffId, brandId);

    res.json(result);
  })
);

/**
 * PUT /api/staff/:staffId/permissions
 * 更新商务权限
 * 权限：工厂老板
 */
router.put(
  '/:staffId/permissions',
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { staffId } = req.params;
    const brandId = req.user!.brandId!;
    const { permissions } = req.body;

    // 验证必填字段
    if (!permissions) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: '权限配置为必填项',
      });
      return;
    }

    const result = await staffManagementService.updateStaffPermissions(
      staffId,
      brandId,
      permissions
    );

    res.json(result);
  })
);

export default router;
