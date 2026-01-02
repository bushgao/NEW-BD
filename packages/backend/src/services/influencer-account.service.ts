/**
 * 达人账号管理服务 (Influencer Account Service)
 * 
 * 提供达人账号和联系人管理功能：
 * - 获取账号信息
 * - 联系人列表管理
 * - 添加/移除/更新联系人
 */

import prisma from '../lib/prisma';
import { createNotFoundError, createBadRequestError, createConflictError } from '../middleware/errorHandler';
import type { ContactType } from '@prisma/client';

// ============================================
// 类型定义
// ============================================

export interface InfluencerAccountInfo {
  id: string;
  primaryPhone: string;
  createdAt: Date;
  updatedAt: Date;
  contacts: InfluencerContactInfo[];
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

export interface AddContactInput {
  phone: string;
  name?: string;
  contactType: ContactType;
}

export interface UpdateContactInput {
  name?: string;
  contactType?: ContactType;
}

// ============================================
// 服务函数
// ============================================

/**
 * 获取达人账号信息
 */
export async function getAccount(accountId: string): Promise<InfluencerAccountInfo> {
  const account = await prisma.influencerAccount.findUnique({
    where: { id: accountId },
    include: {
      contacts: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!account) {
    throw createNotFoundError('达人账号不存在');
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
export async function getContacts(accountId: string): Promise<InfluencerContactInfo[]> {
  const contacts = await prisma.influencerContact.findMany({
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
export async function addContact(
  accountId: string,
  data: AddContactInput
): Promise<InfluencerContactInfo> {
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(data.phone)) {
    throw createBadRequestError('手机号格式不正确');
  }

  // 检查账号是否存在
  const account = await prisma.influencerAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw createNotFoundError('达人账号不存在');
  }

  // 检查手机号是否已被使用
  const existingContact = await prisma.influencerContact.findUnique({
    where: { phone: data.phone },
  });

  if (existingContact) {
    if (existingContact.accountId === accountId) {
      throw createConflictError('该手机号已添加为联系人');
    } else {
      throw createConflictError('该手机号已被其他账号使用');
    }
  }

  // 创建联系人
  const contact = await prisma.influencerContact.create({
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
export async function removeContact(
  accountId: string,
  contactId: string
): Promise<void> {
  // 查找联系人
  const contact = await prisma.influencerContact.findUnique({
    where: { id: contactId },
    include: { account: true },
  });

  if (!contact) {
    throw createNotFoundError('联系人不存在');
  }

  // 验证联系人属于该账号
  if (contact.accountId !== accountId) {
    throw createBadRequestError('无权操作此联系人');
  }

  // 不能移除"本人"类型的联系人（如果是主手机号）
  if (contact.contactType === 'SELF' && contact.phone === contact.account.primaryPhone) {
    throw createBadRequestError('不能移除本人联系人');
  }

  // 删除联系人的登录日志
  await prisma.influencerLoginLog.deleteMany({
    where: { contactId },
  });

  // 删除联系人
  await prisma.influencerContact.delete({
    where: { id: contactId },
  });
}

/**
 * 更新联系人信息
 */
export async function updateContact(
  accountId: string,
  contactId: string,
  data: UpdateContactInput
): Promise<InfluencerContactInfo> {
  // 查找联系人
  const contact = await prisma.influencerContact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    throw createNotFoundError('联系人不存在');
  }

  // 验证联系人属于该账号
  if (contact.accountId !== accountId) {
    throw createBadRequestError('无权操作此联系人');
  }

  // 更新联系人
  const updatedContact = await prisma.influencerContact.update({
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
export async function getContactById(contactId: string): Promise<InfluencerContactInfo | null> {
  const contact = await prisma.influencerContact.findUnique({
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
