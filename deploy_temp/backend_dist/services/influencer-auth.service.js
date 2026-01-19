"use strict";
/**
 * 达人认证服务 (Influencer Auth Service)
 *
 * 提供达人端口的认证功能：
 * - 手机号+验证码登录
 * - 首次登录自动创建账号
 * - Token 验证和刷新
 * - 登录日志记录
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationCode = sendVerificationCode;
exports.loginWithCode = loginWithCode;
exports.loginWithPassword = loginWithPassword;
exports.verifyInfluencerToken = verifyInfluencerToken;
exports.refreshInfluencerToken = refreshInfluencerToken;
exports.checkContactValid = checkContactValid;
exports.getCurrentInfluencerContact = getCurrentInfluencerContact;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
// 验证码存储（生产环境应使用 Redis）
const verificationCodes = new Map();
// 验证码有效期（5分钟）
const CODE_EXPIRY_MINUTES = 5;
/**
 * 解析过期时间字符串为秒数
 */
function parseExpiresIn(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match)
        return 604800; // 默认 7 天
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 604800;
    }
}
/**
 * 生成6位数字验证码
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * 生成达人 JWT Token
 */
function generateInfluencerTokens(contact) {
    const payload = {
        accountId: contact.accountId,
        contactId: contact.id,
        phone: contact.phone,
        contactType: contact.contactType,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: parseExpiresIn(JWT_EXPIRES_IN),
    });
    const refreshToken = jsonwebtoken_1.default.sign({ contactId: contact.id, accountId: contact.accountId }, JWT_REFRESH_SECRET, { expiresIn: parseExpiresIn(JWT_REFRESH_EXPIRES_IN) });
    return {
        accessToken,
        refreshToken,
        expiresIn: parseExpiresIn(JWT_EXPIRES_IN),
        accountId: contact.accountId,
        contactId: contact.id,
    };
}
/**
 * 发送验证码
 *
 * 注意：这是模拟实现，生产环境需要接入真实的短信服务
 * 开发环境：使用固定验证码 123456 方便测试
 */
async function sendVerificationCode(phone) {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        throw (0, errorHandler_1.createBadRequestError)('手机号格式不正确');
    }
    // 开发环境使用固定验证码，方便测试
    const isDev = process.env.NODE_ENV !== 'production';
    const code = isDev ? '123456' : generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    // 存储验证码
    verificationCodes.set(phone, { code, expiresAt });
    // 模拟发送短信（生产环境替换为真实短信服务）
    console.log(`[SMS] 向 ${phone} 发送验证码: ${code} (有效期 ${CODE_EXPIRY_MINUTES} 分钟)`);
    if (isDev) {
        console.log(`[DEV] 开发环境固定验证码: 123456`);
    }
}
/**
 * 验证码登录
 *
 * 首次登录会自动创建账号和联系人
 */
async function loginWithCode(phone, code, deviceInfo) {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        throw (0, errorHandler_1.createBadRequestError)('手机号格式不正确');
    }
    // 验证验证码
    const storedCode = verificationCodes.get(phone);
    if (!storedCode) {
        throw (0, errorHandler_1.createUnauthorizedError)('请先获取验证码');
    }
    if (new Date() > storedCode.expiresAt) {
        verificationCodes.delete(phone);
        throw (0, errorHandler_1.createUnauthorizedError)('验证码已过期，请重新获取');
    }
    if (storedCode.code !== code) {
        throw (0, errorHandler_1.createUnauthorizedError)('验证码错误，请重新输入');
    }
    // 验证成功，删除验证码
    verificationCodes.delete(phone);
    // 查找或创建联系人
    let contact = await prisma_1.default.influencerContact.findUnique({
        where: { phone },
        include: { account: true },
    });
    if (!contact) {
        // 首次登录，创建账号和联系人
        const result = await prisma_1.default.$transaction(async (tx) => {
            // 创建达人账号
            const account = await tx.influencerAccount.create({
                data: {
                    primaryPhone: phone,
                },
            });
            // 创建"本人"类型的联系人
            const newContact = await tx.influencerContact.create({
                data: {
                    accountId: account.id,
                    phone,
                    contactType: 'SELF',
                    lastLoginAt: new Date(),
                },
                include: { account: true },
            });
            return newContact;
        });
        contact = result;
    }
    else {
        // 更新最后登录时间
        contact = await prisma_1.default.influencerContact.update({
            where: { id: contact.id },
            data: { lastLoginAt: new Date() },
            include: { account: true },
        });
    }
    // 记录登录日志
    await prisma_1.default.influencerLoginLog.create({
        data: {
            contactId: contact.id,
            ip: deviceInfo.ip,
            userAgent: deviceInfo.userAgent,
            platform: deviceInfo.platform,
        },
    });
    const contactInfo = {
        id: contact.id,
        accountId: contact.accountId,
        phone: contact.phone,
        name: contact.name,
        contactType: String(contact.contactType),
        createdAt: contact.createdAt,
        lastLoginAt: contact.lastLoginAt,
    };
    const tokens = generateInfluencerTokens(contactInfo);
    return { contact: contactInfo, tokens };
}
/**
 * 密码登录（用于通过主系统注册的达人用户）
 *
 * 验证 User 表中 role=INFLUENCER 的用户，并为其创建/获取 GlobalInfluencer 和 InfluencerContact
 */
async function loginWithPassword(email, password, deviceInfo) {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
    // 查找 INFLUENCER 角色用户
    const user = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw (0, errorHandler_1.createBadRequestError)('邮箱或密码错误');
    }
    if (user.role !== 'INFLUENCER') {
        throw (0, errorHandler_1.createBadRequestError)('该账号不是达人账号');
    }
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw (0, errorHandler_1.createBadRequestError)('邮箱或密码错误');
    }
    // 从邮箱提取手机号（格式：phone@phone.local）
    const phone = email.replace('@phone.local', '');
    // 查找或创建达人账号
    let account = await prisma_1.default.influencerAccount.findFirst({
        where: { primaryPhone: phone },
        include: { contacts: true },
    });
    if (!account) {
        // 创建达人账号和联系人
        account = await prisma_1.default.influencerAccount.create({
            data: {
                primaryPhone: phone,
                contacts: {
                    create: {
                        phone,
                        name: user.name,
                        contactType: 'SELF',
                    },
                },
            },
            include: { contacts: true },
        });
    }
    // 获取或创建联系人
    let contact = account.contacts.find((c) => c.phone === phone);
    if (!contact) {
        contact = await prisma_1.default.influencerContact.create({
            data: {
                accountId: account.id,
                phone,
                name: user.name,
                contactType: 'SELF',
            },
        });
    }
    // 更新最后登录时间
    await prisma_1.default.influencerContact.update({
        where: { id: contact.id },
        data: { lastLoginAt: new Date() },
    });
    // 记录登录日志
    await prisma_1.default.influencerLoginLog.create({
        data: {
            contactId: contact.id,
            userAgent: deviceInfo.userAgent,
            ip: deviceInfo.ip,
            platform: deviceInfo.platform || 'web',
        },
    });
    const contactInfo = {
        id: contact.id,
        accountId: account.id,
        phone: contact.phone,
        name: contact.name,
        contactType: contact.contactType,
        createdAt: contact.createdAt,
        lastLoginAt: new Date(),
    };
    const tokens = generateInfluencerTokens(contactInfo);
    return { contact: contactInfo, tokens };
}
/**
 * 验证达人 Token
 */
function verifyInfluencerToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw (0, errorHandler_1.createUnauthorizedError)('登录已过期，请重新登录');
        }
        throw (0, errorHandler_1.createUnauthorizedError)('无效的访问令牌');
    }
}
/**
 * 刷新达人 Token
 */
async function refreshInfluencerToken(refreshTokenStr) {
    try {
        const payload = jsonwebtoken_1.default.verify(refreshTokenStr, JWT_REFRESH_SECRET);
        // 查找联系人
        const contact = await prisma_1.default.influencerContact.findUnique({
            where: { id: payload.contactId },
            include: { account: true },
        });
        if (!contact) {
            throw (0, errorHandler_1.createUnauthorizedError)('联系人不存在');
        }
        // 检查账号是否匹配
        if (contact.accountId !== payload.accountId) {
            throw (0, errorHandler_1.createUnauthorizedError)('账号信息不匹配');
        }
        const contactInfo = {
            id: contact.id,
            accountId: contact.accountId,
            phone: contact.phone,
            name: contact.name,
            contactType: String(contact.contactType),
            createdAt: contact.createdAt,
            lastLoginAt: contact.lastLoginAt,
        };
        return generateInfluencerTokens(contactInfo);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw (0, errorHandler_1.createUnauthorizedError)('刷新令牌已过期，请重新登录');
        }
        throw (0, errorHandler_1.createUnauthorizedError)('无效的刷新令牌');
    }
}
/**
 * 检查联系人是否仍有效（未被移除）
 */
async function checkContactValid(contactId) {
    const contact = await prisma_1.default.influencerContact.findUnique({
        where: { id: contactId },
    });
    return !!contact;
}
/**
 * 获取当前达人联系人信息
 */
async function getCurrentInfluencerContact(contactId) {
    const contact = await prisma_1.default.influencerContact.findUnique({
        where: { id: contactId },
        include: { account: true },
    });
    if (!contact) {
        throw (0, errorHandler_1.createForbiddenError)('您的访问权限已被撤销');
    }
    return {
        id: contact.id,
        accountId: contact.accountId,
        phone: contact.phone,
        name: contact.name,
        contactType: String(contact.contactType),
        createdAt: contact.createdAt,
        lastLoginAt: contact.lastLoginAt,
    };
}
//# sourceMappingURL=influencer-auth.service.js.map