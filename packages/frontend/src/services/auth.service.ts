import { request } from './api';
import type { AuthToken, UserRole } from '@ics/shared';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  brandId?: string;
  createdAt: string;
  updatedAt: string;
  isIndependent?: boolean;
  permissions?: any; // 商务权限
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email?: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  wechat?: string;
  brandName?: string;
  invitationCode?: string;  // 邀请码（通过邀请链接注册时使用）
}

export interface AuthResponse {
  user: User;
  tokens: AuthToken;
}

/**
 * Login user by email (for admin users)
 */
export async function login(data: LoginInput) {
  return request<AuthResponse>('post', '/auth/login/email', data);
}

/**
 * Login user by phone number
 */
export async function loginByPhone(data: { phone: string; password: string }) {
  return request<AuthResponse>('post', '/auth/login', data);
}

/**
 * Register new user
 */
export async function register(data: RegisterInput) {
  return request<AuthResponse>('post', '/auth/register', data);
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string) {
  return request<AuthToken>('post', '/auth/refresh', { refreshToken });
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  return request<{ user: User }>('get', '/auth/me');
}

/**
 * Logout user
 */
export async function logout() {
  return request<{ message: string }>('post', '/auth/logout');
}
