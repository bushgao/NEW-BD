/**
 * 达人认证服务 (Influencer Auth Service)
 *
 * 提供达人端口的认证功能：
 * - 手机号+验证码登录
 * - 首次登录自动创建账号
 * - Token 验证和刷新
 * - 登录日志记录
 */
import type { ContactType } from '@prisma/client';
export interface DeviceInfo {
    userAgent: string;
    ip: string;
    platform?: string;
}
export interface InfluencerAuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accountId: string;
    contactId: string;
}
export interface InfluencerTokenPayload {
    accountId: string;
    contactId: string;
    phone: string;
    contactType: ContactType;
}
export interface InfluencerContactInfo {
    id: string;
    accountId: string;
    phone: string;
    name: string | null;
    contactType: ContactType;
    createdAt: Date;
    lastLoginAt: Date | null;
}
/**
 * 发送验证码
 *
 * 注意：这是模拟实现，生产环境需要接入真实的短信服务
 * 开发环境：使用固定验证码 123456 方便测试
 */
export declare function sendVerificationCode(phone: string): Promise<void>;
/**
 * 验证码登录
 *
 * 首次登录会自动创建账号和联系人
 */
export declare function loginWithCode(phone: string, code: string, deviceInfo: DeviceInfo): Promise<{
    contact: InfluencerContactInfo;
    tokens: InfluencerAuthToken;
}>;
/**
 * 密码登录（用于通过主系统注册的达人用户）
 *
 * 验证 User 表中 role=INFLUENCER 的用户，并为其创建/获取 GlobalInfluencer 和 InfluencerContact
 */
export declare function loginWithPassword(email: string, password: string, deviceInfo: DeviceInfo): Promise<{
    contact: InfluencerContactInfo;
    tokens: InfluencerAuthToken;
}>;
/**
 * 验证达人 Token
 */
export declare function verifyInfluencerToken(token: string): InfluencerTokenPayload;
/**
 * 刷新达人 Token
 */
export declare function refreshInfluencerToken(refreshTokenStr: string): Promise<InfluencerAuthToken>;
/**
 * 检查联系人是否仍有效（未被移除）
 */
export declare function checkContactValid(contactId: string): Promise<boolean>;
/**
 * 获取当前达人联系人信息
 */
export declare function getCurrentInfluencerContact(contactId: string): Promise<InfluencerContactInfo>;
//# sourceMappingURL=influencer-auth.service.d.ts.map