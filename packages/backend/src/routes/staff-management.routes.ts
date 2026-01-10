import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import * as staffManagementService from '../services/staff-management.service';

const router = Router();

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const factoryId = req.user!.factoryId!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await staffManagementService.listStaff(factoryId, { page, pageSize });

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const factoryId = req.user!.factoryId!;

    const quotaUsage = await staffManagementService.getQuotaUsage(factoryId);

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
  authenticate,
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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const factoryId = req.user!.factoryId!;

    const staffDetail = await staffManagementService.getStaffDetail(id, factoryId);

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const factoryId = req.user!.factoryId!;
    const { name, email, password } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: '姓名、邮箱和密码为必填项',
      });
      return;
    }

    const staffMember = await staffManagementService.createStaff(factoryId, {
      name,
      email,
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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const factoryId = req.user!.factoryId!;
    const { status } = req.body;

    // 验证 status 字段
    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: '状态必须为 ACTIVE 或 DISABLED',
      });
      return;
    }

    const staffMember = await staffManagementService.updateStaffStatus(id, factoryId, status);

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const factoryId = req.user!.factoryId!;

    await staffManagementService.deleteStaff(id, factoryId);

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { staffId } = req.params;
    const factoryId = req.user!.factoryId!;

    const result = await staffManagementService.getStaffPermissions(staffId, factoryId);

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
  authenticate,
  requireRoles('BRAND'),
  asyncHandler(async (req: Request, res: Response) => {
    const { staffId } = req.params;
    const factoryId = req.user!.factoryId!;
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
      factoryId,
      permissions
    );

    res.json(result);
  })
);

export default router;
