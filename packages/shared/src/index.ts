// Shared types and utilities for the Influencer Collaboration System

// User roles
export type UserRole = 'PLATFORM_ADMIN' | 'BRAND' | 'BUSINESS' | 'INFLUENCER';

// Platform types
export type Platform = 'DOUYIN' | 'KUAISHOU' | 'XIAOHONGSHU' | 'WEIBO' | 'OTHER';

// Pipeline stages
export type PipelineStage =
  | 'LEAD' // 线索达人
  | 'CONTACTED' // 已联系
  | 'QUOTED' // 已报价
  | 'SAMPLED' // 已寄样
  | 'SCHEDULED' // 已排期
  | 'PUBLISHED' // 已发布
  | 'REVIEWED'; // 已复盘

// Block reasons
export type BlockReason = 'PRICE_HIGH' | 'DELAYED' | 'UNCOOPERATIVE' | 'OTHER';

// Dispatch status
export type ReceivedStatus = 'PENDING' | 'RECEIVED' | 'LOST';
export type OnboardStatus = 'UNKNOWN' | 'ONBOARD' | 'NOT_ONBOARD';

// Content types
export type ContentType = 'SHORT_VIDEO' | 'LIVE_STREAM';

// Profit status
export type ProfitStatus = 'LOSS' | 'BREAK_EVEN' | 'PROFIT' | 'HIGH_PROFIT';

// Influencer source types
export type InfluencerSourceType = 'PLATFORM' | 'FACTORY' | 'STAFF';

// Verification status
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

// Factory status (also used as BrandStatus)
export type FactoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BrandStatus = FactoryStatus;

// Plan types
export type PlanType = 'FREE' | 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE';

// Pagination
export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Date range
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Auth types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  factoryId?: string;
  brandId?: string;
}

// Influencer with details (for platform admin)
export interface InfluencerWithDetails {
  id: string;
  nickname: string;
  platform: Platform;
  platformId: string;
  phone?: string;
  wechat?: string;
  followers?: string;
  categories: string[];
  tags: string[];
  notes?: string;
  sourceType: InfluencerSourceType;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: Date | string;
  createdAt: Date | string;
  factoryId: string;
  factoryName: string;
  factory: {
    id: string;
    name: string;
  };
  creatorName?: string;
  creatorRole?: string;
  creator?: {
    id: string;
    name: string;
    role: UserRole;
  };
  verifierName?: string;
  verifier?: {
    id: string;
    name: string;
  };
  verificationHistory?: {
    entries: VerificationHistoryEntry[];
  };
  collaborations?: Array<{
    id: string;
    stage: string;
    businessStaffName: string;
    createdAt: Date | string;
    deadline?: Date | string;
  }>;
  _count: {
    collaborations: number;
  };
}

// Verification history entry
export interface VerificationHistoryEntry {
  action: 'VERIFIED' | 'REJECTED' | 'RESET';
  verifiedBy: string;
  verifiedByName: string;
  verifiedAt: Date;
  note?: string;
}

// Influencer stats
export interface InfluencerStats {
  total: number;
  bySourceType: {
    PLATFORM: number;
    FACTORY: number;
    STAFF: number;
  };
  byVerificationStatus: {
    UNVERIFIED: number;
    VERIFIED: number;
    REJECTED: number;
  };
  byPlatform: {
    DOUYIN: number;
    KUAISHOU: number;
    XIAOHONGSHU: number;
    WEIBO: number;
    OTHER: number;
  };
  topFactories: Array<{
    factoryId: string;
    factoryName: string;
    count: number;
  }>;
  sourceQuality: Array<{
    sourceType: InfluencerSourceType;
    total: number;
    verified: number;
    verificationRate: number;
  }>;
}
