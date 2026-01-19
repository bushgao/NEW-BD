/**
 * 达人认证中间件 (Influencer Auth Middleware)
 *
 * 用于达人端口的身份验证，与商务端/老板端完全隔离
 */
import { Request, Response, NextFunction } from 'express';
import type { InfluencerTokenPayload } from '../services/influencer-auth.service';
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
export declare function influencerAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * 确保请求来自达人端口
 *
 * 用于拒绝非达人用户访问达人端口 API
 */
export declare function requireInfluencer(req: Request, _res: Response, next: NextFunction): void;
/**
 * 获取请求中的设备信息
 */
export declare function getDeviceInfo(req: Request): {
    userAgent: string;
    ip: string;
    platform?: string;
};
//# sourceMappingURL=influencer-auth.middleware.d.ts.map