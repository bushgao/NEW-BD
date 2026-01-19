/**
 * 达人认领服务 (Influencer Claim Service)
 *
 * 提供达人与品牌录入记录的匹配和认领功能：
 * - 自动匹配：根据手机号、微信号等字段匹配
 * - 待认领列表：获取匹配但未关联的记录
 * - 确认认领：建立达人账号与品牌记录的关联
 * - 手动关联：后台管理员手动关联
 */
export interface PendingClaim {
    id: string;
    brandId: string;
    brandName: string;
    nickname: string;
    platform: string;
    platformId: string;
    phone: string | null;
    wechat: string | null;
    matchedBy: 'PHONE' | 'WECHAT' | 'PLATFORM_ID' | 'MANUAL';
    createdAt: Date;
}
export interface MatchResult {
    influencerId: string;
    accountId: string;
    matchedBy: 'PHONE' | 'WECHAT' | 'PLATFORM_ID';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
/**
 * 根据达人信息查找匹配的已注册账号
 *
 * 匹配优先级：
 * 1. 手机号（高置信度）
 * 2. 微信号（高置信度）
 * 3. 后续可扩展：平台UID等
 */
export declare function findMatchingAccount(data: {
    phone?: string | null;
    wechat?: string | null;
}): Promise<{
    accountId: string;
    matchedBy: 'PHONE' | 'WECHAT';
} | null>;
/**
 * 录入达人时自动关联已注册账号
 *
 * 场景 B：达人先注册，商务后录入时自动匹配
 */
export declare function autoLinkOnCreate(influencerId: string): Promise<MatchResult | null>;
/**
 * 获取达人的待认领记录
 *
 * 场景 A：商务先录入，达人后注册登录后查看待认领
 */
export declare function getPendingClaims(accountId: string): Promise<PendingClaim[]>;
/**
 * 获取待认领数量（用于徽标显示）
 */
export declare function getPendingClaimCount(accountId: string): Promise<number>;
/**
 * 确认认领
 */
export declare function confirmClaim(accountId: string, influencerId: string): Promise<void>;
/**
 * 取消认领
 */
export declare function cancelClaim(accountId: string, influencerId: string): Promise<void>;
/**
 * 手动关联（管理员操作）
 */
export declare function manualLink(influencerId: string, accountId: string, operatorId: string): Promise<void>;
/**
 * 解除关联（管理员操作）
 */
export declare function manualUnlink(influencerId: string, operatorId: string): Promise<void>;
/**
 * 获取所有已认领记录（管理后台）
 */
export declare function getClaimedInfluencers(accountId: string): Promise<({
    brand: {
        id: string;
        name: string;
    };
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
})[]>;
//# sourceMappingURL=influencer-claim.service.d.ts.map