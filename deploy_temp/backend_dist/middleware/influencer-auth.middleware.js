"use strict";
/**
 * 达人认证中间件 (Influencer Auth Middleware)
 *
 * 用于达人端口的身份验证，与商务端/老板端完全隔离
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.influencerAuthenticate = influencerAuthenticate;
exports.requireInfluencer = requireInfluencer;
exports.getDeviceInfo = getDeviceInfo;
const influencer_auth_service_1 = require("../services/influencer-auth.service");
const errorHandler_1 = require("./errorHandler");
/**
 * 达人身份验证中间件
 *
 * 验证达人 Token 并检查联系人是否仍有效
 */
async function influencerAuthenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw (0, errorHandler_1.createUnauthorizedError)('未提供访问令牌');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw (0, errorHandler_1.createUnauthorizedError)('访问令牌格式错误');
        }
        const token = parts[1];
        const payload = (0, influencer_auth_service_1.verifyInfluencerToken)(token);
        // 检查联系人是否仍有效（未被移除）
        const isValid = await (0, influencer_auth_service_1.checkContactValid)(payload.contactId);
        if (!isValid) {
            throw (0, errorHandler_1.createForbiddenError)('您的访问权限已被撤销');
        }
        req.influencer = payload;
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * 确保请求来自达人端口
 *
 * 用于拒绝非达人用户访问达人端口 API
 */
function requireInfluencer(req, _res, next) {
    try {
        if (!req.influencer) {
            throw (0, errorHandler_1.createUnauthorizedError)('此接口仅限达人用户访问');
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * 获取请求中的设备信息
 */
function getDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const platform = req.headers['x-platform'];
    return { userAgent, ip, platform };
}
//# sourceMappingURL=influencer-auth.middleware.js.map