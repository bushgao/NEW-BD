import axios from 'axios';
import type { ApiResponse } from '@ics/shared';
import { useAuthStore } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 获取当前应该使用的 token
 * 根据当前路径判断使用哪个 store 的 token
 */
function getActiveToken() {
  const currentPath = window.location.pathname;

  // 如果是管理员页面，优先使用 adminStore 的 token
  if (currentPath.startsWith('/app/admin') || currentPath.startsWith('/admin')) {
    const adminState = useAdminStore.getState();
    if (adminState.isAuthenticated && adminState.token?.accessToken) {
      console.log('[API] 使用管理员 Token');
      return adminState.token;
    }
  }

  // 默认使用 authStore 的 token（工厂客户）
  const authState = useAuthStore.getState();
  if (authState.token?.accessToken) {
    console.log('[API] 使用工厂客户 Token');
    return authState.token;
  }

  return null;
}

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    // Wait for store to hydrate
    const maxWait = 50; // 50ms max wait
    const startTime = Date.now();
    while (!useAuthStore.getState()._hasHydrated && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const token = getActiveToken();

    console.log('[API Interceptor] Request URL:', config.url);
    console.log('[API Interceptor] Token status:', token ? 'Found' : 'Not found');

    // CRITICAL FIX: Check if token is the string "null"
    if (token?.accessToken === 'null' || token?.accessToken === null) {
      console.error('[API Interceptor] ❌ CRITICAL: Token is null or string "null"!');
      // 根据路径决定跳转到哪个登录页
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/app/admin') || currentPath.startsWith('/admin')) {
        useAdminStore.getState().logout();
        window.location.href = '/admin/login';
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      throw new Error('Invalid token detected, please login again');
    }

    if (token?.accessToken && typeof token.accessToken === 'string' && token.accessToken.length > 10) {
      config.headers.Authorization = `Bearer ${token.accessToken}`;
      console.log('[API Interceptor] ✅ Authorization header set successfully');

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
        } else if (config.url?.includes('/collaborations/follow-up-analytics')) {
          // @ts-ignore
          mockAdapter.mockData = {
            success: true,
            data: {
              effectivenessScore: 75,
              bestTime: '下午 (12-18点)',
              bestFrequency: '2-3天跟进一次',
              totalFollowUps: 156,
              successfulConversions: 42,
              conversionRate: 26.9,
              avgResponseTime: 3.5,
              conversionByTime: [
                { timeRange: '早上 (6-12点)', followUps: 35, conversions: 8, conversionRate: 22.9 },
                { timeRange: '下午 (12-18点)', followUps: 68, conversions: 22, conversionRate: 32.4 },
                { timeRange: '晚上 (18-24点)', followUps: 45, conversions: 10, conversionRate: 22.2 },
                { timeRange: '深夜 (0-6点)', followUps: 8, conversions: 2, conversionRate: 25.0 }
              ],
              conversionByFrequency: [
                { frequency: '每天跟进', followUps: 45, conversions: 10, conversionRate: 22.2 },
                { frequency: '2-3天跟进一次', followUps: 68, conversions: 22, conversionRate: 32.4 },
                { frequency: '每周跟进', followUps: 30, conversions: 8, conversionRate: 26.7 },
                { frequency: '两周跟进一次', followUps: 10, conversions: 2, conversionRate: 20.0 },
                { frequency: '很少跟进', followUps: 3, conversions: 0, conversionRate: 0 }
              ],
              conversionByDay: [
                { day: '1/1', followUps: 5, conversions: 1 },
                { day: '1/2', followUps: 8, conversions: 2 },
                { day: '1/3', followUps: 6, conversions: 2 },
                { day: '1/4', followUps: 7, conversions: 1 },
                { day: '1/5', followUps: 9, conversions: 3 },
                { day: '1/6', followUps: 4, conversions: 1 },
                { day: '1/7', followUps: 6, conversions: 2 }
              ],
              suggestions: [
                '转化率良好，继续保持当前的跟进策略',
                '建议在下午 (12-18点)进行跟进，此时段转化率最高',
                '建议保持"2-3天跟进一次"的跟进节奏，效果最佳',
                '平均响应时间适中，保持当前的跟进频率'
              ]
            }
          };
        } else {
          // Default fallback
          // @ts-ignore
          mockAdapter.mockData = { success: true, data: { count: 0, data: [], items: [], total: 0 } };
        }

        throw mockAdapter;
      }
    } else {
      console.log('[API Interceptor] ⚠️ No valid token found, request will be sent without Authorization header');
      console.log('[API Interceptor] Token details:', {
        tokenExists: !!token,
        accessTokenExists: token ? !!token.accessToken : false,
        accessTokenValue: token?.accessToken,
      });
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

    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      const authToken = useAuthStore.getState().token;
      const adminToken = useAdminStore.getState().token;

      // Do not logout if in demo mode
      if (authToken?.accessToken === 'demo-token' || adminToken?.accessToken === 'demo-token') {
        return Promise.reject(error);
      }

      // 根据路径决定跳转到哪个登录页
      if (currentPath.startsWith('/app/admin') || currentPath.startsWith('/admin')) {
        useAdminStore.getState().logout();
        window.location.href = '/admin/login';
      } else {
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
