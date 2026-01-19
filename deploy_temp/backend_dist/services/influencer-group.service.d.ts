export interface CreateGroupInput {
    brandId: string;
    name: string;
    color?: string;
    description?: string;
    createdBy: string;
}
export interface UpdateGroupInput {
    name?: string;
    color?: string;
    description?: string;
}
export interface InfluencerGroup {
    id: string;
    brandId: string;
    name: string;
    color: string;
    description: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    influencerCount?: number;
    stats?: GroupStats;
}
export interface GroupStats {
    totalInfluencers: number;
    totalCollaborations: number;
    avgROI: number;
    totalGMV: number;
}
/**
 * Create a new influencer group
 */
export declare function createGroup(data: CreateGroupInput): Promise<InfluencerGroup>;
/**
 * Get group by ID
 */
export declare function getGroupById(id: string, brandId: string): Promise<InfluencerGroup>;
/**
 * Update group
 */
export declare function updateGroup(id: string, brandId: string, data: UpdateGroupInput): Promise<InfluencerGroup>;
/**
 * Delete group
 */
export declare function deleteGroup(id: string, brandId: string): Promise<void>;
/**
 * List all groups in a factory
 */
export declare function listGroups(brandId: string): Promise<InfluencerGroup[]>;
/**
 * Get group statistics
 */
export declare function getGroupStats(id: string, brandId: string): Promise<GroupStats>;
/**
 * Move influencer to group
 */
export declare function moveInfluencerToGroup(influencerId: string, groupId: string | null, brandId: string): Promise<void>;
/**
 * Batch move influencers to group
 */
export declare function batchMoveInfluencersToGroup(influencerIds: string[], groupId: string | null, brandId: string): Promise<void>;
/**
 * Get influencers in a group
 */
export declare function getGroupInfluencers(groupId: string, brandId: string): Promise<any[]>;
//# sourceMappingURL=influencer-group.service.d.ts.map