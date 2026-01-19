/**
 * 邀请服务
 *
 * 处理品牌邀请商务相关逻辑
 */
import { InvitationStatus } from '@prisma/client';
export interface CreateInvitationInput {
    brandId: string;
    inviterId: string;
}
export interface InvitationInfo {
    id: string;
    code: string;
    brandId: string;
    brandName: string;
    inviterName: string;
    status: InvitationStatus;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
    usedByName: string | null;
}
/**
 * 创建邀请
 */
export declare function createInvitation(input: CreateInvitationInput): Promise<InvitationInfo>;
/**
 * 获取邀请详情（根据邀请码，公开接口）
 */
export declare function getInvitationByCode(code: string): Promise<InvitationInfo>;
/**
 * 使用邀请（注册时调用）
 */
export declare function useInvitation(code: string, userId: string): Promise<void>;
/**
 * 获取品牌的邀请列表
 */
export declare function listInvitations(brandId: string, status?: InvitationStatus): Promise<InvitationInfo[]>;
/**
 * 撤销邀请
 */
export declare function revokeInvitation(id: string, userId: string): Promise<void>;
export interface CreateTargetedInvitationInput {
    brandId: string;
    inviterId: string;
    targetPhone: string;
}
export interface TargetedInvitationInfo extends InvitationInfo {
    inviteType: string;
    targetPhone: string | null;
    targetUserId: string | null;
    targetUserName: string | null;
}
/**
 * 根据手机号查找独立商务用户
 * 更新：现在只按 phone 字段搜索，不再使用假邮箱格式
 */
export declare function findIndependentBusinessByPhone(phone: string): Promise<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
}>;
/**
 * 创建定向邀请（通过手机号邀请已存在的独立商务）
 */
export declare function createTargetedInvitation(input: CreateTargetedInvitationInput): Promise<TargetedInvitationInfo>;
/**
 * 获取我收到的定向邀请（独立商务端）
 */
export declare function getReceivedInvitations(userId: string): Promise<TargetedInvitationInfo[]>;
/**
 * 接受定向邀请（独立商务确认加入品牌）
 */
export declare function acceptTargetedInvitation(code: string, userId: string, migrateInfluencers?: boolean): Promise<void>;
/**
 * 拒绝定向邀请
 */
export declare function rejectTargetedInvitation(invitationId: string, userId: string): Promise<void>;
//# sourceMappingURL=invitation.service.d.ts.map