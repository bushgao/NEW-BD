import api from './api';
import type { PaginatedResult, ReceivedStatus, OnboardStatus } from '@ics/shared';

// Types
export interface Sample {
  id: string;
  brandId: string;
  sku: string;
  name: string;
  unitCost: number; // 单件成本（分）
  retailPrice: number; // 建议零售价（分）
  canResend: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSampleInput {
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
  page?: number;
  pageSize?: number;
}

export interface SampleDispatch {
  id: string;
  sampleId: string;
  collaborationId: string;
  businessStaffId: string;
  quantity: number;
  unitCostSnapshot: number;
  totalSampleCost: number;
  shippingCost: number;
  totalCost: number;
  trackingNumber: string | null;
  receivedStatus: ReceivedStatus;
  receivedAt: string | null;
  onboardStatus: OnboardStatus;
  dispatchedAt: string;
  sample: Sample;
  collaboration: {
    id: string;
    influencer: {
      id: string;
      nickname: string;
      platform: string;
    };
  };
  businessStaff?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateDispatchInput {
  sampleId: string;
  collaborationId: string;
  quantity: number;
  shippingCost: number;
  trackingNumber?: string;
}

export interface UpdateDispatchStatusInput {
  receivedStatus?: ReceivedStatus;
  onboardStatus?: OnboardStatus;
}

export interface DispatchFilter {
  sampleId?: string;
  collaborationId?: string;
  businessStaffId?: string;
  receivedStatus?: ReceivedStatus;
  onboardStatus?: OnboardStatus;
  page?: number;
  pageSize?: number;
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

// Status labels
export const RECEIVED_STATUS_LABELS: Record<ReceivedStatus, string> = {
  PENDING: '未签收',
  RECEIVED: '已签收',
  LOST: '已丢失',
};

export const ONBOARD_STATUS_LABELS: Record<OnboardStatus, string> = {
  UNKNOWN: '未确认',
  ONBOARD: '已上车',
  NOT_ONBOARD: '未上车',
};

// Helper functions
export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parseMoney(yuan: number): number {
  return Math.round(yuan * 100);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// API functions
export async function getSamples(filter: SampleFilter = {}): Promise<PaginatedResult<Sample>> {
  const params: Record<string, any> = {
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
  };

  if (filter.keyword) params.keyword = filter.keyword;
  if (filter.canResend !== undefined) params.canResend = filter.canResend;

  const response = await api.get('/samples', { params });
  return response.data.data;
}

export async function getSample(id: string): Promise<Sample> {
  const response = await api.get(`/samples/${id}`);
  return response.data.data.sample;
}

export async function createSample(data: CreateSampleInput): Promise<Sample> {
  const response = await api.post('/samples', data);
  return response.data.data.sample;
}

export async function updateSample(id: string, data: UpdateSampleInput): Promise<Sample> {
  const response = await api.put(`/samples/${id}`, data);
  return response.data.data.sample;
}

export async function deleteSample(id: string): Promise<void> {
  await api.delete(`/samples/${id}`);
}

// Dispatch API functions
export async function getDispatches(filter: DispatchFilter = {}): Promise<PaginatedResult<SampleDispatch>> {
  const params: Record<string, any> = {
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
  };

  if (filter.sampleId) params.sampleId = filter.sampleId;
  if (filter.collaborationId) params.collaborationId = filter.collaborationId;
  if (filter.businessStaffId) params.businessStaffId = filter.businessStaffId;
  if (filter.receivedStatus) params.receivedStatus = filter.receivedStatus;
  if (filter.onboardStatus) params.onboardStatus = filter.onboardStatus;

  const response = await api.get('/samples/dispatches/list', { params });
  return response.data.data;
}

export async function getDispatch(id: string): Promise<SampleDispatch> {
  const response = await api.get(`/samples/dispatches/${id}`);
  return response.data.data.dispatch;
}

export async function createDispatch(data: CreateDispatchInput): Promise<SampleDispatch> {
  const response = await api.post('/samples/dispatches', data);
  return response.data.data.dispatch;
}

export async function updateDispatchStatus(id: string, data: UpdateDispatchStatusInput): Promise<SampleDispatch> {
  const response = await api.put(`/samples/dispatches/${id}/status`, data);
  return response.data.data.dispatch;
}

// Report API functions
export async function getSampleCostReport(startDate?: string, endDate?: string): Promise<SampleCostReport> {
  const params: Record<string, any> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get('/samples/report', { params });
  return response.data.data;
}
