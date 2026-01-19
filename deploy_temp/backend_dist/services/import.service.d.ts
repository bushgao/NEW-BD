import type { Platform } from '@prisma/client';
export type ImportType = 'influencers' | 'samples';
export interface InfluencerFieldMapping {
    nickname: string;
    platform: string;
    platformId: string;
    phone?: string;
    categories?: string;
    tags?: string;
    notes?: string;
}
export interface SampleFieldMapping {
    sku: string;
    name: string;
    unitCost: string;
    retailPrice: string;
    canResend?: string;
    notes?: string;
}
export interface ImportPreviewRow<T = any> {
    rowNumber: number;
    data: T | null;
    errors: string[];
    isDuplicate: boolean;
    duplicateInfo?: {
        type: string;
        existingId: string;
        existingName: string;
    };
}
export interface InfluencerPreviewData {
    nickname: string;
    platform: Platform;
    platformId: string;
    phone?: string;
    categories?: string[];
    tags?: string[];
    notes?: string;
}
export interface SamplePreviewData {
    sku: string;
    name: string;
    unitCost: number;
    retailPrice: number;
    canResend: boolean;
    notes?: string;
}
export interface ImportPreviewResult<T = any> {
    totalRows: number;
    validRows: number;
    errorRows: number;
    duplicateRows: number;
    preview: ImportPreviewRow<T>[];
    headers: string[];
}
export interface ImportResult {
    totalRows: number;
    successCount: number;
    errorCount: number;
    duplicateCount: number;
    skippedCount: number;
    errors: {
        rowNumber: number;
        error: string;
    }[];
}
/**
 * Parse Excel/CSV file buffer and return raw data
 */
export declare function parseFile(buffer: Buffer): {
    headers: string[];
    rows: any[][];
};
/**
 * Preview influencer import data with validation and duplicate checking
 */
export declare function previewInfluencerImport(buffer: Buffer, mapping: InfluencerFieldMapping, brandId: string): Promise<ImportPreviewResult<InfluencerPreviewData>>;
/**
 * Execute influencer batch import
 */
export declare function executeInfluencerImport(buffer: Buffer, mapping: InfluencerFieldMapping, brandId: string, skipDuplicates?: boolean): Promise<ImportResult>;
/**
 * Preview sample import data with validation and duplicate checking
 */
export declare function previewSampleImport(buffer: Buffer, mapping: SampleFieldMapping, brandId: string): Promise<ImportPreviewResult<SamplePreviewData>>;
/**
 * Execute sample batch import
 */
export declare function executeSampleImport(buffer: Buffer, mapping: SampleFieldMapping, brandId: string, skipDuplicates?: boolean): Promise<ImportResult>;
/**
 * Get suggested field mapping for influencers based on headers
 */
export declare function suggestInfluencerMapping(headers: string[]): Partial<InfluencerFieldMapping>;
/**
 * Get suggested field mapping for samples based on headers
 */
export declare function suggestSampleMapping(headers: string[]): Partial<SampleFieldMapping>;
export type FieldMapping = InfluencerFieldMapping;
export declare function previewImport(buffer: Buffer, mapping: InfluencerFieldMapping, brandId: string): Promise<ImportPreviewResult<InfluencerPreviewData>>;
export declare function executeImport(buffer: Buffer, mapping: InfluencerFieldMapping, brandId: string, skipDuplicates?: boolean): Promise<ImportResult>;
export declare function suggestMapping(headers: string[]): Partial<InfluencerFieldMapping>;
//# sourceMappingURL=import.service.d.ts.map