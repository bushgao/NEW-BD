export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export type ExportType = 'influencers' | 'samples' | 'dispatches' | 'collaborations' | 'results' | 'staff-performance' | 'roi-report' | 'sample-cost-report';
export interface ExportOptions {
    brandId: string;
    dateRange?: DateRange;
    groupBy?: string;
    filters?: Record<string, any>;
}
/**
 * 导出达人列表
 * Requirements: 9.4
 */
export declare function exportInfluencers(options: ExportOptions): Promise<Buffer>;
/**
 * 导出样品列表
 * Requirements: 9.4
 */
export declare function exportSamples(options: ExportOptions): Promise<Buffer>;
/**
 * 导出寄样记录
 * Requirements: 9.4
 */
export declare function exportDispatches(options: ExportOptions): Promise<Buffer>;
/**
 * 导出合作记录
 * Requirements: 9.4
 */
export declare function exportCollaborations(options: ExportOptions): Promise<Buffer>;
/**
 * 导出合作结果
 * Requirements: 9.4
 */
export declare function exportResults(options: ExportOptions): Promise<Buffer>;
/**
 * 统一导出接口
 */
export declare function exportData(type: ExportType, options: ExportOptions): Promise<{
    buffer: Buffer;
    filename: string;
}>;
interface BackupSummary {
    sampleCount: number;
    influencerCount: number;
    groupCount: number;
    collaborationCount: number;
    resultCount: number;
    dispatchCount: number;
    followUpCount: number;
}
/**
 * 导出用户在指定品牌下的所有业务数据（多 sheet Excel）
 * 用于加入品牌前的数据备份
 *
 * 独立商务拥有的数据：
 * - 样品列表（属于品牌）
 * - 达人列表（属于品牌，由用户创建）
 * - 达人分组（属于品牌）
 * - 合作记录（属于品牌，由用户负责）
 * - 合作结果（关联合作）
 * - 样品发放（由用户发放）
 * - 跟进记录（由用户添加）
 */
export declare function exportUserDataBackup(userId: string, brandId: string): Promise<{
    buffer: Buffer;
    filename: string;
    summary: BackupSummary;
}>;
export {};
//# sourceMappingURL=export.service.d.ts.map