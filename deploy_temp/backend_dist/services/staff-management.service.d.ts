import type { Pagination, PaginatedResult } from '@ics/shared';
import { type StaffPermissions, type PermissionTemplate } from '../types/permissions';
export interface StaffMember {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    status: 'ACTIVE' | 'DISABLED';
    createdAt: Date;
}
export interface StaffDetail extends StaffMember {
    stats: {
        influencerCount: number;
        collaborationCount: number;
        dispatchCount: number;
        closedDeals: number;
        totalGmv: number;
    };
}
export interface CreateStaffInput {
    name: string;
    email: string;
    phone?: string;
    password: string;
}
export interface QuotaUsage {
    staff: {
        current: number;
        limit: number;
        available: number;
        isReached: boolean;
    };
    influencer: {
        current: number;
        limit: number;
        available: number;
        isReached: boolean;
    };
}
/**
 * 获取商务权限
 */
export declare function getStaffPermissions(staffId: string, brandId: string): Promise<{
    permissions: StaffPermissions;
    template: string;
}>;
/**
 * 更新商务权限
 */
export declare function updateStaffPermissions(staffId: string, brandId: string, permissions: StaffPermissions): Promise<{
    user: StaffMember;
    permissions: StaffPermissions;
    template: string;
}>;
/**
 * 获取权限模板列表
 */
export declare function getPermissionTemplates(): PermissionTemplate[];
/**
 * 获取工厂商务账号列表
 */
export declare function listStaff(brandId: string, pagination: Pagination): Promise<PaginatedResult<StaffMember>>;
/**
 * 获取商务账号详情（含工作统计）
 */
export declare function getStaffDetail(staffId: string, brandId: string): Promise<StaffDetail>;
/**
 * 创建商务账号（检查配额）
 */
export declare function createStaff(brandId: string, data: CreateStaffInput): Promise<StaffMember>;
/**
 * 更新商务账号状态（启用/禁用）
 */
export declare function updateStaffStatus(staffId: string, brandId: string, status: 'ACTIVE' | 'DISABLED'): Promise<StaffMember>;
/**
 * 删除商务账号（保留业务数据）
 */
export declare function deleteStaff(staffId: string, brandId: string): Promise<void>;
/**
 * 获取配额使用情况
 */
export declare function getQuotaUsage(brandId: string): Promise<QuotaUsage>;
//# sourceMappingURL=staff-management.service.d.ts.map