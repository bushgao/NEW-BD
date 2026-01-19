/**
 * 邀请服务
 * 
 * 处理品牌邀请商务相关API调用
 */

import { request } from './api';

// ============ Types ============

export interface InvitationInfo {
    id: string;
    code: string;
    brandId: string;
    brandName: string;
    inviterName: string;
    status: 'PENDING' | 'USED' | 'REVOKED';
    expiresAt: string;
    createdAt: string;
    usedAt: string | null;
    usedByName: string | null;
}

// ============ API Functions ============

/**
 * 创建邀请
 */
export async function createInvitation(): Promise<InvitationInfo> {
    const response = await request<InvitationInfo>('post', '/invitations');
    if (!response.success) {
        throw new Error(response.error?.message || '创建邀请失败');
    }
    return response.data!;
}

/**
 * 获取邀请详情（根据邀请码，公开接口）
 */
export async function getInvitationByCode(code: string): Promise<InvitationInfo> {
    const response = await request<InvitationInfo>('get', `/invitations/code/${code}`);
    if (!response.success) {
        throw new Error(response.error?.message || '获取邀请信息失败');
    }
    return response.data!;
}

/**
 * 获取邀请列表
 */
export async function listInvitations(status?: 'PENDING' | 'USED' | 'REVOKED'): Promise<InvitationInfo[]> {
    const params = status ? { status } : undefined;
    const response = await request<InvitationInfo[]>('get', '/invitations', params);
    if (!response.success) {
        throw new Error(response.error?.message || '获取邀请列表失败');
    }
    return response.data!;
}

/**
 * 撤销邀请
 */
export async function revokeInvitation(id: string): Promise<void> {
    const response = await request<void>('delete', `/invitations/${id}`);
    if (!response.success) {
        throw new Error(response.error?.message || '撤销邀请失败');
    }
}

// ============ 定向邀请 API ============

export interface TargetedInvitationInfo extends InvitationInfo {
    inviteType: string;
    targetPhone: string | null;
    targetUserId: string | null;
    targetUserName: string | null;
}

export interface IndependentBusinessInfo {
    id: string;
    name: string;
    phone: string;
    email: string;
}

/**
 * 根据手机号搜索独立商务
 */
export async function searchIndependentBusiness(phone: string): Promise<IndependentBusinessInfo> {
    const response = await request<IndependentBusinessInfo>('get', '/invitations/search-business', { phone });
    if (!response.success) {
        throw new Error(response.error?.message || '未找到该手机号对应的独立商务');
    }
    return response.data!;
}

/**
 * 创建定向邀请
 */
export async function createTargetedInvitation(targetPhone: string): Promise<TargetedInvitationInfo> {
    const response = await request<TargetedInvitationInfo>('post', '/invitations/targeted', { targetPhone });
    if (!response.success) {
        throw new Error(response.error?.message || '发送邀请失败');
    }
    return response.data!;
}

/**
 * 获取我收到的定向邀请（独立商务端）
 */
export async function getReceivedInvitations(): Promise<TargetedInvitationInfo[]> {
    const response = await request<TargetedInvitationInfo[]>('get', '/invitations/received');
    if (!response.success) {
        throw new Error(response.error?.message || '获取邀请列表失败');
    }
    return response.data!;
}

/**
 * 接受定向邀请
 */
export async function acceptTargetedInvitation(code: string, migrateInfluencers: boolean = false): Promise<void> {
    const response = await request<void>('post', `/invitations/targeted/${code}/accept`, { migrateInfluencers });
    if (!response.success) {
        throw new Error(response.error?.message || '接受邀请失败');
    }
}

/**
 * 拒绝定向邀请
 */
export async function rejectTargetedInvitation(id: string): Promise<void> {
    const response = await request<void>('delete', `/invitations/targeted/${id}/reject`);
    if (!response.success) {
        throw new Error(response.error?.message || '拒绝邀请失败');
    }
}

// ============ 数据备份导出 ============

export interface BackupSummary {
    sampleCount: number;
    influencerCount: number;
    groupCount: number;
    collaborationCount: number;
    resultCount: number;
    dispatchCount: number;
    followUpCount: number;
}

/**
 * 获取数据备份汇总
 */
export async function getBackupSummary(): Promise<BackupSummary> {
    const response = await request<BackupSummary>('get', '/invitations/backup-summary');
    if (!response.success) {
        throw new Error(response.error?.message || '获取备份汇总失败');
    }
    return response.data!;
}

/**
 * 下载数据备份
 */
export async function downloadBackup(): Promise<void> {
    // 从 zustand persist 存储中获取 token
    const authData = localStorage.getItem('auth-storage');
    if (!authData) {
        throw new Error('未登录');
    }

    const parsed = JSON.parse(authData);
    const token = parsed?.state?.token?.accessToken;

    if (!token) {
        throw new Error('token 无效');
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // 使用 fetch 下载
    const response = await fetch(`${apiUrl}/invitations/backup-export`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('下载失败');
    }

    const blob = await response.blob();
    const filename = decodeURIComponent(
        response.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] ||
        `数据备份_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
