/**
 * 达人账号管理服务 (Influencer Account Service)
 *
 * 提供达人账号和联系人管理功能：
 * - 获取账号信息
 * - 联系人列表管理
 * - 添加/移除/更新联系人
 */
import type { ContactType } from '@prisma/client';
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
/**
 * 获取达人账号信息
 */
export declare function getAccount(accountId: string): Promise<InfluencerAccountInfo>;
/**
 * 获取联系人列表
 */
export declare function getContacts(accountId: string): Promise<InfluencerContactInfo[]>;
/**
 * 添加联系人
 */
export declare function addContact(accountId: string, data: AddContactInput): Promise<InfluencerContactInfo>;
/**
 * 移除联系人
 */
export declare function removeContact(accountId: string, contactId: string): Promise<void>;
/**
 * 更新联系人信息
 */
export declare function updateContact(accountId: string, contactId: string, data: UpdateContactInput): Promise<InfluencerContactInfo>;
/**
 * 获取联系人详情
 */
export declare function getContactById(contactId: string): Promise<InfluencerContactInfo | null>;
//# sourceMappingURL=influencer-account.service.d.ts.map