import type { ContentType, ProfitStatus } from '@prisma/client';
export interface CreateResultInput {
    collaborationId: string;
    contentType: ContentType;
    publishedAt: Date;
    salesQuantity: number;
    salesGmv: number;
    commissionRate?: number;
    pitFee?: number;
    actualCommission: number;
    willRepeat: boolean;
    notes?: string;
}
export interface UpdateResultInput {
    contentType?: ContentType;
    publishedAt?: Date;
    salesQuantity?: number;
    salesGmv?: number;
    commissionRate?: number;
    pitFee?: number;
    actualCommission?: number;
    willRepeat?: boolean;
    notes?: string;
}
export interface RoiReportFilter {
    groupBy: 'influencer' | 'sample' | 'staff' | 'month';
    startDate?: Date;
    endDate?: Date;
}
export interface RoiReportItem {
    groupKey: string;
    groupName: string;
    collaborationCount: number;
    totalSampleCost: number;
    totalPitFee: number;
    totalCommission: number;
    totalCost: number;
    totalGmv: number;
    roi: number;
    profitCount: number;
    lossCount: number;
}
export interface RoiReport {
    items: RoiReportItem[];
    summary: {
        totalCollaborations: number;
        totalSampleCost: number;
        totalPitFee: number;
        totalCommission: number;
        totalCost: number;
        totalGmv: number;
        overallRoi: number;
        profitRate: number;
    };
}
export declare const PROFIT_STATUS_NAMES: Record<ProfitStatus, string>;
export declare const CONTENT_TYPE_NAMES: Record<ContentType, string>;
/**
 * 计算回本状态
 * ROI < 1 为 LOSS（未回本）
 * ROI = 1 为 BREAK_EVEN（刚回本）
 * 1 < ROI < 3 为 PROFIT（已回本）
 * ROI >= 3 为 HIGH_PROFIT（爆赚）
 */
export declare function calculateProfitStatus(roi: number): ProfitStatus;
/**
 * 计算 ROI
 * ROI = 销售GMV / 合作总成本
 * 如果总成本为0，返回0避免除零错误
 */
export declare function calculateRoi(salesGmv: number, totalCost: number): number;
/**
 * 录入合作结果
 */
export declare function createResult(data: CreateResultInput, brandId: string): Promise<{
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
}>;
/**
 * 获取合作结果详情
 */
export declare function getResultById(id: string, brandId: string): Promise<{
    collaboration: {
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
    };
} & {
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
}>;
/**
 * 根据合作ID获取结果
 */
export declare function getResultByCollaborationId(collaborationId: string, brandId: string): Promise<({
    collaboration: {
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
    };
} & {
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
}) | null>;
/**
 * 更新合作结果
 */
export declare function updateResult(id: string, brandId: string, data: UpdateResultInput): Promise<{
    collaboration: {
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
    };
} & {
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
}>;
/**
 * 获取合作结果列表
 */
export declare function listResults(brandId: string, filter: {
    profitStatus?: ProfitStatus;
    contentType?: ContentType;
    businessStaffId?: string;
    startDate?: Date;
    endDate?: Date;
}, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: ({
        collaboration: {
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
        };
    } & {
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
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 获取 ROI 报表（按维度分组）
 */
export declare function getRoiReport(brandId: string, filter: RoiReportFilter): Promise<RoiReport>;
/**
 * 获取合作结果统计概览
 */
export declare function getResultStats(brandId: string, dateRange?: {
    startDate: Date;
    endDate: Date;
}): Promise<{
    totalCount: number;
    totalGmv: number;
    totalCost: number;
    totalQuantity: number;
    overallRoi: number;
    byStatus: {
        LOSS: number;
        BREAK_EVEN: number;
        PROFIT: number;
        HIGH_PROFIT: number;
    };
}>;
//# sourceMappingURL=result.service.d.ts.map