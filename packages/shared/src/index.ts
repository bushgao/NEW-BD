// Shared types and utilities for the Influencer Collaboration System

// User roles
export type UserRole = 'PLATFORM_ADMIN' | 'FACTORY_OWNER' | 'BUSINESS_STAFF';

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

// Factory status
export type FactoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

// Plan types
export type PlanType = 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';

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
}
