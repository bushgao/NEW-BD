import type { ReceivedStatus, OnboardStatus } from '@prisma/client';
export interface CreateSampleInput {
    brandId: string;
    sku: string;
    name: string;
    unitCost: number;
    retailPrice: number;
    canResend?: boolean;
    notes?: string;
}
export interface UpdateSampleInput {
    sku?: string;
    name?: string;
    unitCost?: number;
    retailPrice?: number;
    canResend?: boolean;
    notes?: string;
}
export interface SampleFilter {
    keyword?: string;
    canResend?: boolean;
}
export interface CreateDispatchInput {
    sampleId: string;
    collaborationId: string;
    businessStaffId: string;
    quantity: number;
    shippingCost: number;
    trackingNumber?: string;
}
export interface UpdateDispatchStatusInput {
    receivedStatus?: ReceivedStatus;
    receivedAt?: Date;
    onboardStatus?: OnboardStatus;
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface SampleCostReportItem {
    sampleId: string;
    sku: string;
    name: string;
    unitCost: number;
    totalDispatchCount: number;
    totalQuantity: number;
    totalSampleCost: number;
    totalShippingCost: number;
    totalCost: number;
    receivedCount: number;
    receivedRate: number;
    onboardCount: number;
    onboardRate: number;
}
export interface SampleCostReport {
    items: SampleCostReportItem[];
    summary: {
        totalDispatchCount: number;
        totalQuantity: number;
        totalSampleCost: number;
        totalShippingCost: number;
        totalCost: number;
        overallReceivedRate: number;
        overallOnboardRate: number;
    };
}
/**
 * 创建样品
 */
export declare function createSample(data: CreateSampleInput): Promise<{
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
}>;
/**
 * 根据 ID 获取样品
 */
export declare function getSampleById(id: string, brandId: string): Promise<{
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
}>;
/**
 * 更新样品
 */
export declare function updateSample(id: string, brandId: string, data: UpdateSampleInput): Promise<{
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
}>;
/**
 * 删除样品
 */
export declare function deleteSample(id: string, brandId: string): Promise<void>;
/**
 * 获取样品列表
 */
export declare function listSamples(brandId: string, filter: SampleFilter, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: {
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
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 创建寄样记录（自动计算成本）
 */
export declare function createDispatch(data: CreateDispatchInput): Promise<{
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
}>;
/**
 * 获取寄样记录详情
 */
export declare function getDispatchById(id: string, brandId: string): Promise<{
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
    businessStaff: {
        id: string;
        name: string;
        email: string | null;
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
}>;
/**
 * 更新寄样状态
 */
export declare function updateDispatchStatus(id: string, brandId: string, data: UpdateDispatchStatusInput): Promise<{
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
}>;
/**
 * 获取寄样记录列表
 */
export declare function listDispatches(brandId: string, filter: {
    sampleId?: string;
    collaborationId?: string;
    businessStaffId?: string;
    receivedStatus?: ReceivedStatus;
    onboardStatus?: OnboardStatus;
}, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: ({
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
        businessStaff: {
            id: string;
            name: string;
            email: string | null;
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
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 获取样品成本报表
 */
export declare function getSampleCostReport(brandId: string, dateRange?: DateRange): Promise<SampleCostReport>;
//# sourceMappingURL=sample.service.d.ts.map