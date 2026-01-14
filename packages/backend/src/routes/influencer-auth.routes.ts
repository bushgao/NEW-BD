/**
 * 达人认证路由 (Influencer Auth Routes)
 * 
 * 路由前缀: /api/influencer-portal/auth
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import {
  sendVerificationCode,
  loginWithCode,
  refreshInfluencerToken,
  getCurrentInfluencerContact,
} from '../services/influencer-auth.service';
import { influencerAuthenticate, getDeviceInfo } from '../middleware/influencer-auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';

const router = Router();

/**
 * 验证请求参数
 */
function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg).join(', ');
    throw createBadRequestError(errorMessages);
  }
  next();
}

/**
 * POST /api/influencer-portal/auth/send-code
 * 发送验证码
 */
router.post(
  '/send-code',
  [
    body('phone')
      .notEmpty().withMessage('手机号不能为空')
      .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;
      await sendVerificationCode(phone);
      res.json({
        success: true,
        message: '验证码已发送',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/auth/login
 * 验证码登录
 */
router.post(
  '/login',
  [
    body('phone')
      .notEmpty().withMessage('手机号不能为空')
      .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
    body('code')
      .notEmpty().withMessage('验证码不能为空')
      .isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code } = req.body;
      const deviceInfo = getDeviceInfo(req);

      const result = await loginWithCode(phone, code, deviceInfo);

      res.json({
        success: true,
        data: {
          contact: result.contact,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/auth/login-password
 * 密码登录（用于通过主系统注册的达人用户）
 */
router.post(
  '/login-password',
  [
    body('email')
      .notEmpty().withMessage('邮箱不能为空')
      .isEmail().withMessage('邮箱格式不正确'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码至少6位'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const deviceInfo = getDeviceInfo(req);

      // 使用密码登录服务
      const { loginWithPassword } = await import('../services/influencer-auth.service');
      const result = await loginWithPassword(email, password, deviceInfo);

      res.json({
        success: true,
        data: {
          contact: result.contact,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/auth/refresh
 * 刷新 Token
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('刷新令牌不能为空'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await refreshInfluencerToken(refreshToken);

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/auth/me
 * 获取当前用户信息
 */
router.get(
  '/me',
  influencerAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contact = await getCurrentInfluencerContact(req.influencer!.contactId);

      res.json({
        success: true,
        data: { contact },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
