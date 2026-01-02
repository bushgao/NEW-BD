/**
 * 达人认证中间件 (Influencer Auth Middleware)
 * 
 * 用于达人端口的身份验证，与商务端/老板端完全隔离
 */

import { Request, Response, NextFunction } from 'express';
import { verifyInfluencerToken, checkContactValid } from '../services/influencer-auth.service';
import { createUnauthorizedError, createForbiddenError } from './errorHandler';
import type { InfluencerTokenPayload } from '../services/influencer-auth.service';

// 扩展 Express Request 类型，添加达人用户信息
declare global {
  namespace Express {
    interface Request {
      influencer?: InfluencerTokenPayload;
    }
  }
}

/**
 * 达人身份验证中间件
 * 
 * 验证达人 Token 并检查联系人是否仍有效
 */
export async function influencerAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createUnauthorizedError('未提供访问令牌');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createUnauthorizedError('访问令牌格式错误');
    }

    const token = parts[1];
    const payload = verifyInfluencerToken(token);

    // 检查联系人是否仍有效（未被移除）
    const isValid = await checkContactValid(payload.contactId);
    if (!isValid) {
      throw createForbiddenError('您的访问权限已被撤销');
    }

    req.influencer = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 确保请求来自达人端口
 * 
 * 用于拒绝非达人用户访问达人端口 API
 */
export function requireInfluencer(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.influencer) {
      throw createUnauthorizedError('此接口仅限达人用户访问');
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 获取请求中的设备信息
 */
export function getDeviceInfo(req: Request): {
  userAgent: string;
  ip: string;
  platform?: string;
} {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const platform = req.headers['x-platform'] as string | undefined;

  return { userAgent, ip, platform };
}
