/**
 * 达人端口服务 (Influencer Portal Service)
 *
 * 提供达人端口的核心功能：
 * - 首页数据聚合
 * - 样品列表（跨工厂聚合）
 * - 合作列表和详情
 * - 确认签收
 *
 * 注意：所有返回数据都需要过滤敏感信息（成本、ROI等）
 */
import type { ReceivedStatus, PipelineStage } from '@prisma/client';
export interface InfluencerDashboard {
    sampleStats: {
        total: number;
        pending: number;
        received: number;
    };
    collabStats: {
        total: number;
        inProgress: number;
        completed: number;
    };
    recentSamples: InfluencerSampleItem[];
}
export interface InfluencerSampleItem {
    id: string;
    sampleName: string;
    sampleSku: string;
    brandId: string;
    factoryName: string;
    dispatchedAt: Date;
    trackingNumber: string | null;
    receivedStatus: ReceivedStatus;
    receivedAt: Date | null;
    quantity: number;
}
export interface InfluencerSampleList {
    items: InfluencerSampleItem[];
    total: number;
    groupedByFactory: {
        brandId: string;
        factoryName: string;
        samples: InfluencerSampleItem[];
    }[];
}
export interface SampleFilter {
    brandId?: string;
    receivedStatus?: ReceivedStatus;
    startDate?: Date;
    endDate?: Date;
}
export interface InfluencerCollabItem {
    id: string;
    brandId: string;
    factoryName: string;
    stage: PipelineStage;
    deadline: Date | null;
    isOverdue: boolean;
    sampleCount: number;
    createdAt: Date;
}
export interface InfluencerCollabList {
    items: InfluencerCollabItem[];
    total: number;
}
export interface CollabFilter {
    brandId?: string;
    stage?: PipelineStage;
    isOverdue?: boolean;
}
export interface InfluencerCollabDetail {
    id: string;
    brandId: string;
    factoryName: string;
    stage: PipelineStage;
    deadline: Date | null;
    isOverdue: boolean;
    createdAt: Date;
    samples: InfluencerSampleItem[];
    stageHistory: {
        stage: PipelineStage;
        changedAt: Date;
    }[];
}
/**
 * 获取达人首页数据
 */
export declare function getDashboard(accountId: string): Promise<InfluencerDashboard>;
/**
 * 获取样品列表（跨工厂聚合）
 */
export declare function getSamples(accountId: string, filter?: SampleFilter): Promise<InfluencerSampleList>;
/**
 * 获取合作列表
 */
export declare function getCollaborations(accountId: string, filter?: CollabFilter): Promise<InfluencerCollabList>;
/**
 * 获取合作详情
 */
export declare function getCollaborationDetail(accountId: string, collabId: string): Promise<InfluencerCollabDetail>;
/**
 * 确认签收样品
 */
export declare function confirmSampleReceived(accountId: string, dispatchId: string): Promise<InfluencerSampleItem>;
/**
 * 获取达人关联的所有工厂列表（用于筛选）
 */
export declare function getRelatedFactories(accountId: string): Promise<{
    id: string;
    name: string;
}[]>;
//# sourceMappingURL=influencer-portal.service.d.ts.map