import axios from 'axios';
import type { ApiResponse } from '@ics/shared';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token?.accessToken) {
      config.headers.Authorization = `Bearer ${token.accessToken}`;

      // Mock data in Demo Mode
      if (token.accessToken === 'demo-token') {
        const mockAdapter = new axios.Cancel('Demo Mode Mock');

        // Mock Factory Dashboard (Default for demo)
        if (config.url?.includes('/reports/dashboard')) {
          // @ts-ignore
          mockAdapter.mockData = {
            success: true,
            data: {
              metrics: {
                totalSampleCost: 12580,
                totalCollaborationCost: 45000,
                totalGmv: 358000,
                overallRoi: 3.5,
                periodComparison: {
                  sampleCostChange: -5.2,
                  gmvChange: 12.8,
                  roiChange: 0.5,
                }
              },
              pipelineDistribution: {
                LEAD: 15,
                CONTACTED: 8,
                QUOTED: 5,
                SAMPLED: 12,
                SCHEDULED: 6,
                PUBLISHED: 4,
                REVIEWED: 2
              },
              pendingItems: {
                overdueCollaborations: 3,
                pendingReceipts: 5,
                pendingResults: 4
              },
              staffRanking: [
                { staffId: '1', staffName: 'Alice', closedDeals: 15, totalGmv: 150000 },
                { staffId: '2', staffName: 'Bob', closedDeals: 12, totalGmv: 120000 }
              ],
              staffProgress: [],
              teamEfficiency: {
                avgLeadToContact: 2,
                avgContactToQuoted: 1,
                avgQuotedToSampled: 3,
                avgSampledToScheduled: 5,
                avgScheduledToPublished: 2,
                overallAvgDays: 13
              },
              recentTeamActivities: [],
              riskAlerts: {
                longStuckCollaborations: 2,
                unbalancedWorkload: false,
                highCostAlert: false
              }
            }
          };
        } else if (config.url?.endsWith('/influencers')) {
          // @ts-ignore
          mockAdapter.mockData = {
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  nickname: '时尚小达人',
                  platform: 'DOUYIN',
                  platformId: 'dy_1001',
                  phone: '13812345678',
                  categories: ['美妆', '服饰'],
                  tags: ['高ROI', '合作愉快'],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                {
                  id: '2',
                  nickname: '美食探店王',
                  platform: 'XIAOHONGSHU',
                  platformId: 'xhs_2002',
                  phone: '13987654321',
                  categories: ['美食', '生活'],
                  tags: ['新品推广'],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ],
              total: 2,
              page: 1,
              pageSize: 20
            }
          };
        } else if (config.url?.includes('/influencers/tags')) {
          // @ts-ignore
          mockAdapter.mockData = { success: true, data: { tags: ['高ROI', '新品推广', '合作愉快', '大V'] } };
        } else if (config.url?.includes('/influencers/categories')) {
          // @ts-ignore
          mockAdapter.mockData = { success: true, data: { categories: ['美妆', '服饰', '美食', '科技', '生活', '母婴'] } };
        } else if (config.url?.includes('/notifications/unread-count')) {
          // @ts-ignore
          mockAdapter.mockData = { success: true, data: { count: 3 } };
        } else {
          // Default fallback
          // @ts-ignore
          mockAdapter.mockData = { success: true, data: { count: 0, data: [], items: [], total: 0 } };
        }

        throw mockAdapter;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Demo Mode Mock Cancel
    if (axios.isCancel(error) && (error as any).mockData) {
      return { data: (error as any).mockData, status: 200, statusText: 'OK', headers: {}, config: {} as any };
    }

    if (error.response?.status === 401) {
      const token = useAuthStore.getState().token;
      // Do not logout if in demo mode
      if (token?.accessToken !== 'demo-token') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic request wrapper
export async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data: method !== 'get' ? data : undefined,
      params: method === 'get' ? data : undefined,
    });
    return response.data;
  } catch (error) {
    // Return mock success for cancelled demo requests that were intercepted and resolved
    if ((error as any)?.data?.success) {
      return (error as any).data;
    }

    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '网络错误，请稍后重试',
      },
    };
  }
}

export default api;
