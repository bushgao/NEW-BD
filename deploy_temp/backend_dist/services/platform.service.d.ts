import type { BrandStatus, PlanType, Pagination, PaginatedResult } from '@ics/shared';
export interface FactoryWithOwner {
    id: string;
    name: string;
    ownerId: string;
    status: BrandStatus;
    planType: PlanType;
    staffLimit: number;
    influencerLimit: number;
    planStartedAt?: Date;
    planExpiresAt?: Date;
    isLocked?: boolean;
    isPaid?: boolean;
    bonusStaff?: number;
    bonusInfluencer?: number;
    bonusDays?: number;
    createdAt: Date;
    updatedAt: Date;
    owner: {
        id: string;
        name: string;
        email: string | null;
    };
    _count?: {
        staff: number;
        influencers: number;
        collaborations: number;
    };
}
export interface PlanConfigData {
    id: string;
    planType: PlanType;
    name: string;
    staffLimit: number;
    influencerLimit: number;
    dataRetentionDays: number;
    price: number;
    features: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface PlatformStats {
    totalFactories: number;
    pendingFactories: number;
    approvedFactories: number;
    totalUsers: number;
    totalCollaborations: number;
    totalInfluencers: number;
    independentBusinessUsers: number;
    factoriesByPlan: Record<PlanType, number>;
}
export interface FactoryFilter {
    status?: BrandStatus;
    planType?: PlanType;
    keyword?: string;
}
export interface UpdateFactoryInput {
    status?: BrandStatus;
    planType?: PlanType;
    staffLimit?: number;
    influencerLimit?: number;
    planExpiresAt?: Date | null;
    isPaid?: boolean;
    bonusStaff?: number;
    bonusInfluencer?: number;
    bonusDays?: number;
}
export interface CreatePlanConfigInput {
    planType: PlanType;
    name: string;
    staffLimit: number;
    influencerLimit: number;
    dataRetentionDays: number;
    price: number;
    features: string[];
}
export interface UpdatePlanConfigInput {
    name?: string;
    staffLimit?: number;
    influencerLimit?: number;
    dataRetentionDays?: number;
    price?: number;
    features?: string[];
}
/**
 * 获取工厂列表（支持筛选和分页）
 */
export declare function listFactories(filter: FactoryFilter, pagination: Pagination): Promise<PaginatedResult<FactoryWithOwner>>;
/**
 * 获取工厂详情
 */
export declare function getFactoryById(brandId: string): Promise<FactoryWithOwner>;
/**
 * 审核工厂入驻申请
 */
export declare function reviewFactory(brandId: string, status: 'APPROVED' | 'REJECTED', _reason?: string): Promise<FactoryWithOwner>;
/**
 * 更新工厂信息（套餐、配额等）
 */
export declare function updateFactory(brandId: string, data: UpdateFactoryInput): Promise<FactoryWithOwner>;
/**
 * 暂停/恢复工厂
 */
export declare function toggleBrandStatus(brandId: string, suspend: boolean): Promise<FactoryWithOwner>;
/**
 * 删除品牌（包括关联数据）
 */
export declare function deleteBrand(brandId: string): Promise<void>;
/**
 * 获取所有套餐配置
 */
export declare function listPlanConfigs(): Promise<PlanConfigData[]>;
/**
 * 获取单个套餐配置
 */
export declare function getPlanConfig(planType: PlanType): Promise<PlanConfigData>;
/**
 * 创建套餐配置
 */
export declare function createPlanConfig(data: CreatePlanConfigInput): Promise<PlanConfigData>;
/**
 * 更新套餐配置
 */
export declare function updatePlanConfig(planType: PlanType, data: UpdatePlanConfigInput): Promise<PlanConfigData>;
/**
 * 删除套餐配置
 */
export declare function deletePlanConfig(planType: PlanType): Promise<void>;
/**
 * 检查工厂配额
 */
export declare function checkFactoryQuota(brandId: string, type: 'staff' | 'influencer'): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
}>;
/**
 * 验证并抛出配额错误
 */
export declare function validateQuota(brandId: string, type: 'staff' | 'influencer'): Promise<void>;
/**
 * 获取平台统计数据
 */
export declare function getPlatformStats(): Promise<PlatformStats>;
/**
 * 获取平台详细统计（按时间段）
 */
export declare function getPlatformDetailedStats(startDate?: Date, endDate?: Date): Promise<{
    period: {
        startDate: Date | undefined;
        endDate: Date | undefined;
    };
    newFactories: number;
    newUsers: number;
    newCollaborations: number;
    newInfluencers: number;
    factoriesByStatus: Record<string, number>;
    factoriesByPlan: Record<string, number>;
    usersByRole: Record<string, number>;
}>;
export interface BrandStaffMember {
    id: string;
    name: string;
    email: string | null;
    role: string;
    createdAt: Date;
    _count?: {
        influencers: number;
        collaborations: number;
    };
}
export interface StaffWorkStats {
    id: string;
    name: string;
    email: string | null;
    role: string;
    brandId: string;
    factoryName: string;
    createdAt: Date;
    influencersAdded: number;
    collaborationsCreated: number;
    collaborationsCompleted: number;
    successRate: number;
}
/**
 * 获取工厂的商务列表
 */
export declare function getBrandStaff(brandId: string): Promise<BrandStaffMember[]>;
/**
 * 获取商务的工作统计
 */
export declare function getStaffWorkStats(staffId: string): Promise<StaffWorkStats>;
/**
 * 获取商务添加的达人列表
 */
export declare function getStaffInfluencers(staffId: string, pagination: Pagination): Promise<PaginatedResult<any>>;
/**
 * 获取商务的合作列表
 */
export declare function getStaffCollaborations(staffId: string, pagination: Pagination): Promise<PaginatedResult<any>>;
import type { InfluencerSourceType, VerificationStatus, InfluencerWithDetails, InfluencerStats } from '@ics/shared';
export interface InfluencerFilter {
    keyword?: string;
    platform?: string;
    brandId?: string;
    sourceType?: InfluencerSourceType;
    verificationStatus?: VerificationStatus;
    createdBy?: string;
}
/**
 * 获取所有达人列表（平台级别）
 */
export declare function listAllInfluencers(filter: InfluencerFilter, pagination: Pagination): Promise<PaginatedResult<InfluencerWithDetails>>;
/**
 * 获取达人详情（平台级别）
 */
export declare function getInfluencerDetail(influencerId: string): Promise<{
    collaborations: {
        id: string;
        stage: import(".prisma/client").$Enums.PipelineStage;
        businessStaff: {
            id: string;
            name: string;
        };
        createdAt: Date;
        hasResult: boolean;
    }[];
    brand: {
        owner: {
            id: string;
            name: string;
            email: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.BrandStatus;
        ownerId: string;
        contactPhone: string | null;
        planType: import(".prisma/client").$Enums.PlanType;
        planStartedAt: Date;
        planExpiresAt: Date | null;
        isLocked: boolean;
        lockedAt: Date | null;
        lastReminderAt: Date | null;
        isPaid: boolean;
        staffLimit: number;
        influencerLimit: number;
        bonusStaff: number;
        bonusInfluencer: number;
        bonusDays: number;
    };
    creator: {
        id: string;
        name: string;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
    } | null;
    verifier: {
        id: string;
        name: string;
        email: string | null;
    } | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    phone: string | null;
    wechat: string | null;
    createdBy: string | null;
    notes: string | null;
    nickname: string;
    platform: import(".prisma/client").$Enums.Platform;
    platformId: string;
    uid: string | null;
    homeUrl: string | null;
    shippingAddress: string | null;
    followers: string | null;
    categories: string[];
    tags: string[];
    sourceType: import(".prisma/client").$Enums.InfluencerSourceType;
    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verificationNote: string | null;
    verificationHistory: import("@prisma/client/runtime/library").JsonValue | null;
    groupId: string | null;
    accountId: string | null;
    claimedAt: Date | null;
}>;
/**
 * 认证达人
 */
export declare function verifyInfluencer(influencerId: string, adminId: string, status: 'VERIFIED' | 'REJECTED', note?: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    phone: string | null;
    wechat: string | null;
    createdBy: string | null;
    notes: string | null;
    nickname: string;
    platform: import(".prisma/client").$Enums.Platform;
    platformId: string;
    uid: string | null;
    homeUrl: string | null;
    shippingAddress: string | null;
    followers: string | null;
    categories: string[];
    tags: string[];
    sourceType: import(".prisma/client").$Enums.InfluencerSourceType;
    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verificationNote: string | null;
    verificationHistory: import("@prisma/client/runtime/library").JsonValue | null;
    groupId: string | null;
    accountId: string | null;
    claimedAt: Date | null;
}>;
/**
 * 平台管理员创建达人（入库到指定品牌）
 */
export interface CreateInfluencerInput {
    brandId: string;
    nickname: string;
    platform: string;
    platformId: string;
    uid?: string;
    homeUrl?: string;
    phone?: string;
    wechat?: string;
    followers?: string;
    tags: string[];
    notes?: string;
    createdBy: string;
    sourceType: string;
}
export declare function createInfluencerForBrand(input: CreateInfluencerInput): Promise<{
    brand: {
        id: string;
        name: string;
    };
    creator: {
        id: string;
        name: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    phone: string | null;
    wechat: string | null;
    createdBy: string | null;
    notes: string | null;
    nickname: string;
    platform: import(".prisma/client").$Enums.Platform;
    platformId: string;
    uid: string | null;
    homeUrl: string | null;
    shippingAddress: string | null;
    followers: string | null;
    categories: string[];
    tags: string[];
    sourceType: import(".prisma/client").$Enums.InfluencerSourceType;
    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verificationNote: string | null;
    verificationHistory: import("@prisma/client/runtime/library").JsonValue | null;
    groupId: string | null;
    accountId: string | null;
    claimedAt: Date | null;
}>;
/**
 * 获取达人统计数据
 */
export declare function getInfluencerStats(startDate?: Date, endDate?: Date): Promise<InfluencerStats>;
export interface UserListItem {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    role: string;
    brandId?: string;
    factoryName?: string;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
}
export interface UserListFilter {
    search?: string;
    role?: string;
    isActive?: boolean;
}
/**
 * 获取所有用户列表（平台管理员）
 */
export declare function listAllUsers(filter: UserListFilter, pagination: Pagination): Promise<PaginatedResult<UserListItem>>;
/**
 * 获取用户详情
 */
export declare function getUserDetail(userId: string): Promise<UserListItem>;
/**
 * 切换用户状态（启用/禁用）
 */
export declare function toggleUserStatus(userId: string, isActive: boolean, adminId: string): Promise<void>;
/**
 * 删除用户
 */
export declare function deleteUser(userId: string): Promise<void>;
/**
 * 删除达人（平台管理员）
 */
export declare function deleteInfluencer(influencerId: string): Promise<void>;
/**
 * 获取独立商务列表
 */
export declare function getIndependentBusinessUsers(pagination: Pagination, keyword?: string): Promise<PaginatedResult<any>>;
/**
 * 获取品牌成员列表
 */
export declare function getBrandMembers(brandId: string): Promise<{
    brandId: string;
    brandName: string;
    members: {
        isOwner: boolean;
        roleLabel: string;
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        phone: string | null;
        joinedAt: Date | null;
        isActive: boolean;
        lastLoginAt: Date | null;
    }[];
}>;
/**
 * 将独立商务划归到品牌
 */
export declare function assignUserToBrand(userId: string, brandId: string): Promise<void>;
//# sourceMappingURL=platform.service.d.ts.map