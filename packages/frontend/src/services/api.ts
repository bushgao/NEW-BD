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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
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
