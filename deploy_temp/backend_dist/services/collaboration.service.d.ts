import type { PipelineStage, BlockReason } from '@prisma/client';
export interface CreateCollaborationInput {
    influencerId: string;
    brandId: string;
    businessStaffId: string;
    stage?: PipelineStage;
    sampleId?: string;
    quotedPrice?: number;
    deadline?: Date;
    notes?: string;
}
export interface UpdateCollaborationInput {
    deadline?: Date;
    blockReason?: BlockReason | null;
}
export interface CollaborationFilter {
    stage?: PipelineStage;
    businessStaffId?: string;
    influencerId?: string;
    isOverdue?: boolean;
    keyword?: string;
}
export interface PipelineView {
    stages: {
        stage: PipelineStage;
        stageName: string;
        collaborations: CollaborationCard[];
        count: number;
    }[];
    totalCount: number;
}
export interface CollaborationCard {
    id: string;
    influencer: {
        id: string;
        nickname: string;
        platform: string;
        platformId: string;
    };
    businessStaff: {
        id: string;
        name: string;
    };
    stage: PipelineStage;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: BlockReason | null;
    followUpCount: number;
    dispatchCount: number;
    lastFollowUp: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const STAGE_NAMES: Record<PipelineStage, string>;
export declare const STAGE_ORDER: PipelineStage[];
/**
 * 冲突信息类型
 */
export interface CollaborationConflictInfo {
    id: string;
    staffId: string;
    staffName: string;
    stage: PipelineStage;
    stageName: string;
    createdAt: Date;
}
/**
 * 检查达人是否已被其他商务跟进
 * 返回所有冲突的商务列表
 */
export declare function checkInfluencerConflict(influencerId: string, brandId: string, currentStaffId: string): Promise<{
    hasConflict: boolean;
    conflicts: CollaborationConflictInfo[];
}>;
/**
 * 创建合作记录
 * @param data 合作记录数据
 * @param forceCreate 是否强制创建（忽略冲突警告）
 */
export declare function createCollaboration(data: CreateCollaborationInput, forceCreate?: boolean): Promise<{
    influencer: {
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
    };
    stageHistory: {
        id: string;
        collaborationId: string;
        notes: string | null;
        fromStage: import(".prisma/client").$Enums.PipelineStage | null;
        toStage: import(".prisma/client").$Enums.PipelineStage;
        changedAt: Date;
    }[];
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
    dispatches: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessStaffId: string;
        collaborationId: string;
        totalSampleCost: number;
        sampleId: string;
        quantity: number;
        shippingCost: number;
        trackingNumber: string | null;
        unitCostSnapshot: number;
        totalCost: number;
        receivedStatus: import(".prisma/client").$Enums.ReceivedStatus;
        receivedAt: Date | null;
        onboardStatus: import(".prisma/client").$Enums.OnboardStatus;
        dispatchedAt: Date;
    }[];
    followUps: {
        id: string;
        content: string;
        createdAt: Date;
        userId: string;
        collaborationId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}>;
/**
 * 根据 ID 获取合作记录详情
 */
export declare function getCollaborationById(id: string, brandId: string): Promise<{
    influencer: {
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
    };
    sample: {
        id: string;
        name: string;
        sku: string;
    } | null;
    stageHistory: {
        id: string;
        collaborationId: string;
        notes: string | null;
        fromStage: import(".prisma/client").$Enums.PipelineStage | null;
        toStage: import(".prisma/client").$Enums.PipelineStage;
        changedAt: Date;
    }[];
    result: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collaborationId: string;
        contentType: import(".prisma/client").$Enums.ContentType;
        publishedAt: Date;
        salesQuantity: number;
        salesGmv: number;
        commissionRate: number | null;
        pitFee: number;
        actualCommission: number;
        totalSampleCost: number;
        totalCollaborationCost: number;
        roi: number;
        profitStatus: import(".prisma/client").$Enums.ProfitStatus;
        willRepeat: boolean;
        notes: string | null;
    } | null;
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
    dispatches: ({
        sample: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            brandId: string;
            notes: string | null;
            sku: string;
            unitCost: number;
            retailPrice: number;
            canResend: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessStaffId: string;
        collaborationId: string;
        totalSampleCost: number;
        sampleId: string;
        quantity: number;
        shippingCost: number;
        trackingNumber: string | null;
        unitCostSnapshot: number;
        totalCost: number;
        receivedStatus: import(".prisma/client").$Enums.ReceivedStatus;
        receivedAt: Date | null;
        onboardStatus: import(".prisma/client").$Enums.OnboardStatus;
        dispatchedAt: Date;
    })[];
    followUps: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        content: string;
        createdAt: Date;
        userId: string;
        collaborationId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}>;
/**
 * 更新合作记录基本信息
 */
export declare function updateCollaboration(id: string, brandId: string, data: UpdateCollaborationInput): Promise<{
    influencer: {
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
    };
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}>;
/**
 * 删除合作记录
 */
export declare function deleteCollaboration(id: string, brandId: string): Promise<void>;
/**
 * 获取合作记录列表
 */
export declare function listCollaborations(brandId: string, filter: CollaborationFilter, pagination: {
    page: number;
    pageSize: number;
}, userId?: string, userRole?: string): Promise<{
    data: ({
        influencer: {
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
        };
        businessStaff: {
            id: string;
            name: string;
            email: string | null;
        };
        dispatches: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            businessStaffId: string;
            collaborationId: string;
            totalSampleCost: number;
            sampleId: string;
            quantity: number;
            shippingCost: number;
            trackingNumber: string | null;
            unitCostSnapshot: number;
            totalCost: number;
            receivedStatus: import(".prisma/client").$Enums.ReceivedStatus;
            receivedAt: Date | null;
            onboardStatus: import(".prisma/client").$Enums.OnboardStatus;
            dispatchedAt: Date;
        }[];
        followUps: {
            id: string;
            content: string;
            createdAt: Date;
            userId: string;
            collaborationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        businessStaffId: string;
        influencerId: string;
        stage: import(".prisma/client").$Enums.PipelineStage;
        sampleId: string | null;
        quotedPrice: number | null;
        deadline: Date | null;
        isOverdue: boolean;
        blockReason: import(".prisma/client").$Enums.BlockReason | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 更新合作阶段
 */
export declare function updateStage(id: string, brandId: string, newStage: PipelineStage, notes?: string): Promise<({
    influencer: {
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
    };
    stageHistory: {
        id: string;
        collaborationId: string;
        notes: string | null;
        fromStage: import(".prisma/client").$Enums.PipelineStage | null;
        toStage: import(".prisma/client").$Enums.PipelineStage;
        changedAt: Date;
    }[];
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}) | null>;
/**
 * 获取阶段变更历史
 */
export declare function getStageHistory(id: string, brandId: string): Promise<{
    fromStageName: string | null;
    toStageName: string;
    id: string;
    collaborationId: string;
    notes: string | null;
    fromStage: import(".prisma/client").$Enums.PipelineStage | null;
    toStage: import(".prisma/client").$Enums.PipelineStage;
    changedAt: Date;
}[]>;
/**
 * 设置截止时间
 */
export declare function setDeadline(id: string, brandId: string, deadline: Date | null): Promise<{
    influencer: {
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
    };
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}>;
/**
 * 检查并更新所有超期状态
 * 用于定时任务
 */
export declare function checkAndUpdateOverdueStatus(brandId?: string): Promise<number>;
/**
 * 获取超期合作列表
 */
export declare function getOverdueCollaborations(brandId: string, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: ({
        influencer: {
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
        };
        businessStaff: {
            id: string;
            name: string;
            email: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        businessStaffId: string;
        influencerId: string;
        stage: import(".prisma/client").$Enums.PipelineStage;
        sampleId: string | null;
        quotedPrice: number | null;
        deadline: Date | null;
        isOverdue: boolean;
        blockReason: import(".prisma/client").$Enums.BlockReason | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 获取跟进模板列表
 */
export declare function getFollowUpTemplates(): Promise<{
    id: string;
    name: string;
    content: string;
    category: string;
}[]>;
/**
 * 添加跟进记录
 */
export declare function addFollowUp(collaborationId: string, brandId: string, userId: string, content: string): Promise<{
    user: {
        id: string;
        name: string;
    };
} & {
    id: string;
    content: string;
    createdAt: Date;
    userId: string;
    collaborationId: string;
}>;
/**
 * 获取跟进记录列表
 */
export declare function getFollowUps(collaborationId: string, brandId: string, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        content: string;
        createdAt: Date;
        userId: string;
        collaborationId: string;
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 设置卡点原因
 */
export declare function setBlockReason(id: string, brandId: string, reason: BlockReason | null, notes?: string): Promise<{
    influencer: {
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
    };
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    brandId: string;
    businessStaffId: string;
    influencerId: string;
    stage: import(".prisma/client").$Enums.PipelineStage;
    sampleId: string | null;
    quotedPrice: number | null;
    deadline: Date | null;
    isOverdue: boolean;
    blockReason: import(".prisma/client").$Enums.BlockReason | null;
}>;
export declare const BLOCK_REASON_NAMES: Record<BlockReason, string>;
/**
 * 获取管道视图数据
 */
export declare function getPipelineView(brandId: string, filter?: {
    businessStaffId?: string;
    keyword?: string;
}, userId?: string, userRole?: string): Promise<PipelineView>;
/**
 * 获取管道统计数据
 */
export declare function getPipelineStats(brandId: string): Promise<{
    byStage: Record<import(".prisma/client").$Enums.PipelineStage, number>;
    total: number;
    overdueCount: number;
}>;
/**
 * 获取跟进提醒列表
 */
export declare function getFollowUpReminders(brandId: string, userId?: string, userRole?: string): Promise<{
    collaborationId: string;
    influencerName: string;
    influencerPlatform: import(".prisma/client").$Enums.Platform;
    lastFollowUpDate: Date;
    suggestedNextDate: Date;
    daysSinceLastFollowUp: number;
    frequency: "daily" | "weekly" | "biweekly";
    priority: "low" | "medium" | "high";
    stage: string;
}[]>;
interface TimeConversionData {
    timeRange: string;
    followUps: number;
    conversions: number;
    conversionRate: number;
}
interface FrequencyConversionData {
    frequency: string;
    followUps: number;
    conversions: number;
    conversionRate: number;
}
interface DayConversionData {
    day: string;
    followUps: number;
    conversions: number;
}
interface FollowUpAnalytics {
    effectivenessScore: number;
    bestTime: string;
    bestFrequency: string;
    totalFollowUps: number;
    successfulConversions: number;
    conversionRate: number;
    avgResponseTime: number;
    conversionByTime: TimeConversionData[];
    conversionByFrequency: FrequencyConversionData[];
    conversionByDay: DayConversionData[];
    suggestions: string[];
}
/**
 * 获取跟进分析数据
 */
export declare function getFollowUpAnalytics(brandId: string, staffId?: string, period?: 'week' | 'month' | 'quarter'): Promise<FollowUpAnalytics>;
export interface CollaborationSuggestion {
    type: 'sample' | 'price' | 'schedule';
    suggestions: {
        field: string;
        value: any;
        label: string;
        reason: string;
        confidence: 'high' | 'medium' | 'low';
    }[];
}
/**
 * 获取智能建议
 * 基于历史数据推荐样品、报价、排期等
 */
export declare function getCollaborationSuggestions(brandId: string, influencerId: string, type: 'sample' | 'price' | 'schedule'): Promise<CollaborationSuggestion>;
export interface BatchUpdateInput {
    ids: string[];
    operation: 'dispatch' | 'updateStage' | 'setDeadline';
    data: any;
}
export interface BatchUpdateResult {
    updated: number;
    failed: number;
    errors: {
        id: string;
        message: string;
    }[];
}
/**
 * 批量更新合作记录
 */
export declare function batchUpdateCollaborations(brandId: string, input: BatchUpdateInput): Promise<BatchUpdateResult>;
export interface ValidationError {
    field: string;
    message: string;
    type: 'error';
}
export interface ValidationWarning {
    field: string;
    message: string;
    type: 'warning';
}
export interface ValidationInfo {
    field: string;
    message: string;
    type: 'info';
}
export interface DuplicateCheck {
    field: string;
    value: any;
    existingRecordId: string;
    existingRecordInfo: string;
    message: string;
}
export interface AnomalyCheck {
    field: string;
    value: any;
    expectedRange?: {
        min: number;
        max: number;
    };
    message: string;
    severity: 'high' | 'medium' | 'low';
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    infos: ValidationInfo[];
    duplicates: DuplicateCheck[];
    anomalies: AnomalyCheck[];
}
/**
 * 验证合作数据
 * 包括数据完整性验证、重复数据检测、异常数据检测
 */
export declare function validateData(brandId: string, type: 'collaboration' | 'dispatch' | 'result', data: any): Promise<ValidationResult>;
export {};
//# sourceMappingURL=collaboration.service.d.ts.map