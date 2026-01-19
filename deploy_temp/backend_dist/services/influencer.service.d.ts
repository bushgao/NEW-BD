import type { Platform, PipelineStage, Pagination, PaginatedResult } from '@ics/shared';
export interface CreateInfluencerInput {
    brandId: string;
    nickname: string;
    platform: Platform;
    platformId: string;
    uid?: string;
    homeUrl?: string;
    phone?: string;
    wechat?: string;
    shippingAddress?: string;
    followers?: string;
    categories?: string[];
    tags?: string[];
    notes?: string;
    userId?: string;
}
export interface UpdateInfluencerInput {
    nickname?: string;
    platform?: Platform;
    platformId?: string;
    uid?: string;
    homeUrl?: string;
    phone?: string;
    wechat?: string;
    shippingAddress?: string;
    followers?: string;
    categories?: string[];
    tags?: string[];
    notes?: string;
}
export interface InfluencerFilter {
    keyword?: string;
    platform?: Platform;
    category?: string;
    tags?: string[];
    pipelineStage?: PipelineStage;
    businessStaffId?: string;
    groupId?: string | null;
}
export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateType?: 'phone' | 'platformId' | 'both';
    existingInfluencer?: {
        id: string;
        nickname: string;
        platform: Platform;
        platformId: string;
        phone: string | null;
    };
}
export interface Influencer {
    id: string;
    brandId: string;
    nickname: string;
    platform: Platform;
    platformId: string;
    uid: string | null;
    homeUrl: string | null;
    phone: string | null;
    wechat: string | null;
    shippingAddress: string | null;
    followers: string | null;
    categories: string[];
    tags: string[];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Check for duplicate influencer by phone or platform ID
 */
export declare function checkDuplicate(brandId: string, phone?: string, platform?: Platform, platformId?: string, excludeId?: string): Promise<DuplicateCheckResult>;
/**
 * Create a new influencer
 */
export declare function create(data: CreateInfluencerInput): Promise<Influencer>;
/**
 * 从全局达人池拉入达人到品牌库
 */
export interface CreateFromGlobalPoolInput {
    brandId: string;
    globalInfluencerId: string;
    nickname: string;
    phone?: string;
    wechat?: string;
    userId: string;
}
export declare function createFromGlobalPool(data: CreateFromGlobalPoolInput): Promise<Influencer>;
/**
 * Get influencer by ID
 */
export declare function getById(id: string, brandId: string): Promise<Influencer>;
/**
 * Update influencer
 */
export declare function update(id: string, brandId: string, data: UpdateInfluencerInput): Promise<Influencer>;
/**
 * Delete influencer
 */
export declare function remove(id: string, brandId: string): Promise<void>;
/**
 * List influencers with filtering and pagination
 */
export declare function list(brandId: string, filter: InfluencerFilter, pagination: Pagination, userId?: string, userRole?: string): Promise<PaginatedResult<Influencer>>;
/**
 * Add tags to influencer
 */
export declare function addTags(id: string, brandId: string, newTags: string[]): Promise<Influencer>;
/**
 * Remove tags from influencer
 */
export declare function removeTags(id: string, brandId: string, tagsToRemove: string[]): Promise<Influencer>;
/**
 * Get all unique tags used in a factory
 */
export declare function getAllTags(brandId: string): Promise<string[]>;
/**
 * Get all unique categories used in a factory
 */
export declare function getAllCategories(brandId: string): Promise<string[]>;
/**
 * Get smart influencer recommendations
 */
export declare function getSmartRecommendations(brandId: string, _userId: string): Promise<any[]>;
/**
 * Get influencers by IDs
 */
export declare function getInfluencersByIds(influencerIds: string[], brandId: string): Promise<any[]>;
/**
 * Batch add tags to influencers
 */
export declare function batchAddTags(influencerIds: string[], tags: string[]): Promise<void>;
/**
 * Get influencer collaboration history
 */
export declare function getCollaborationHistory(influencerId: string, brandId: string): Promise<any[]>;
/**
 * Get influencer ROI statistics
 */
export declare function getROIStats(influencerId: string, brandId: string): Promise<any>;
//# sourceMappingURL=influencer.service.d.ts.map