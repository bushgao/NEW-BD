"use strict";
/**
 * 达人账号管理服务 (Influencer Account Service)
 *
 * 提供达人账号和联系人管理功能：
 * - 获取账号信息
 * - 联系人列表管理
 * - 添加/移除/更新联系人
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccount = getAccount;
exports.getContacts = getContacts;
exports.addContact = addContact;
exports.removeContact = removeContact;
exports.updateContact = updateContact;
exports.getContactById = getContactById;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ============================================
// 服务函数
// ============================================
/**
 * 获取达人账号信息
 */
async function getAccount(accountId) {
    const account = await prisma_1.default.influencerAccount.findUnique({
        where: { id: accountId },
        include: {
            contacts: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    return {
        id: account.id,
        primaryPhone: account.primaryPhone,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        contacts: account.contacts.map((c) => ({
            id: c.id,
            accountId: c.accountId,
            phone: c.phone,
            name: c.name,
            contactType: c.contactType,
            createdAt: c.createdAt,
            lastLoginAt: c.lastLoginAt,
        })),
    };
}
/**
 * 获取联系人列表
 */
async function getContacts(accountId) {
    const contacts = await prisma_1.default.influencerContact.findMany({
        where: { accountId },
        orderBy: { createdAt: 'asc' },
    });
    return contacts.map((c) => ({
        id: c.id,
        accountId: c.accountId,
        phone: c.phone,
        name: c.name,
        contactType: c.contactType,
        createdAt: c.createdAt,
        lastLoginAt: c.lastLoginAt,
    }));
}
/**
 * 添加联系人
 */
async function addContact(accountId, data) {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(data.phone)) {
        throw (0, errorHandler_1.createBadRequestError)('手机号格式不正确');
    }
    // 检查账号是否存在
    const account = await prisma_1.default.influencerAccount.findUnique({
        where: { id: accountId },
    });
    if (!account) {
        throw (0, errorHandler_1.createNotFoundError)('达人账号不存在');
    }
    // 检查手机号是否已被使用
    const existingContact = await prisma_1.default.influencerContact.findUnique({
        where: { phone: data.phone },
    });
    if (existingContact) {
        if (existingContact.accountId === accountId) {
            throw (0, errorHandler_1.createConflictError)('该手机号已添加为联系人');
        }
        else {
            throw (0, errorHandler_1.createConflictError)('该手机号已被其他账号使用');
        }
    }
    // 创建联系人
    const contact = await prisma_1.default.influencerContact.create({
        data: {
            accountId,
            phone: data.phone,
            name: data.name,
            contactType: data.contactType,
        },
    });
    return {
        id: contact.id,
        accountId: contact.accountId,
        phone: contact.phone,
        name: contact.name,
        contactType: contact.contactType,
        createdAt: contact.createdAt,
        lastLoginAt: contact.lastLoginAt,
    };
}
/**
 * 移除联系人
 */
async function removeContact(accountId, contactId) {
    // 查找联系人
    const contact = await prisma_1.default.influencerContact.findUnique({
        where: { id: contactId },
        include: { account: true },
    });
    if (!contact) {
        throw (0, errorHandler_1.createNotFoundError)('联系人不存在');
    }
    // 验证联系人属于该账号
    if (contact.accountId !== accountId) {
        throw (0, errorHandler_1.createBadRequestError)('无权操作此联系人');
    }
    // 不能移除"本人"类型的联系人（如果是主手机号）
    if (contact.contactType === 'SELF' && contact.phone === contact.account.primaryPhone) {
        throw (0, errorHandler_1.createBadRequestError)('不能移除本人联系人');
    }
    // 删除联系人的登录日志
    await prisma_1.default.influencerLoginLog.deleteMany({
        where: { contactId },
    });
    // 删除联系人
    await prisma_1.default.influencerContact.delete({
        where: { id: contactId },
    });
}
/**
 * 更新联系人信息
 */
async function updateContact(accountId, contactId, data) {
    // 查找联系人
    const contact = await prisma_1.default.influencerContact.findUnique({
        where: { id: contactId },
    });
    if (!contact) {
        throw (0, errorHandler_1.createNotFoundError)('联系人不存在');
    }
    // 验证联系人属于该账号
    if (contact.accountId !== accountId) {
        throw (0, errorHandler_1.createBadRequestError)('无权操作此联系人');
    }
    // 更新联系人
    const updatedContact = await prisma_1.default.influencerContact.update({
        where: { id: contactId },
        data: {
            name: data.name !== undefined ? data.name : contact.name,
            contactType: data.contactType !== undefined ? data.contactType : contact.contactType,
        },
    });
    return {
        id: updatedContact.id,
        accountId: updatedContact.accountId,
        phone: updatedContact.phone,
        name: updatedContact.name,
        contactType: updatedContact.contactType,
        createdAt: updatedContact.createdAt,
        lastLoginAt: updatedContact.lastLoginAt,
    };
}
/**
 * 获取联系人详情
 */
async function getContactById(contactId) {
    const contact = await prisma_1.default.influencerContact.findUnique({
        where: { id: contactId },
    });
    if (!contact) {
        return null;
    }
    return {
        id: contact.id,
        accountId: contact.accountId,
        phone: contact.phone,
        name: contact.name,
        contactType: contact.contactType,
        createdAt: contact.createdAt,
        lastLoginAt: contact.lastLoginAt,
    };
}
//# sourceMappingURL=influencer-account.service.js.map