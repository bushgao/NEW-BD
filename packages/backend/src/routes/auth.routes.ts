import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';
import type { ApiResponse, UserRole } from '@ics/shared';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw createBadRequestError(errorMessages, errors.array());
  }
  next();
};

// Validation rules
const registerValidation = [
  body('phone')
    .notEmpty()
    .withMessage('请输入手机号')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的中国手机号'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6位'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('请输入昵称'),
  body('role')
    .isIn(['PLATFORM_ADMIN', 'BRAND', 'BUSINESS', 'INFLUENCER'])
    .withMessage('无效的用户角色'),
  body('brandId')
    .optional()
    .isUUID()
    .withMessage('无效的品牌ID'),
  body('brandName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('品牌名称不能为空'),
];

const loginValidation = [
  body('phone')
    .notEmpty()
    .withMessage('请输入手机号'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('请提供刷新令牌'),
];

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { email, password, name, role, brandId, brandName } = req.body;

      // 如果是商务人员加入工厂，检查工厂的商务账号配额
      if (role === 'BUSINESS' && brandId) {
        const { validateQuota } = await import('../services/platform.service');
        await validateQuota(brandId, 'staff');
      }

      const result = await authService.register({
        email,
        password,
        name,
        role: role as UserRole,
        brandId,
        factoryName: brandName, // 前端传 brandName，服务层还是用 factoryName
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login user by phone
 * @access Public
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { phone, password } = req.body;

      const result = await authService.loginByPhone({ phone, password });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login/email
 * @desc Login user by email (for admin users)
 * @access Public
 */
router.post(
  '/login/email',
  [
    body('email')
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .notEmpty()
      .withMessage('请输入密码'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post(
  '/logout',
  authenticate,
  (_req: Request, res: Response<ApiResponse>) => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint is for consistency and potential future token blacklisting
    res.json({
      success: true,
      data: { message: '已成功登出' },
    });
  }
);

export default router;
