/**
 * 平台管理员状态管理 Store
 * 
 * 独立于工厂客户的认证系统
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthToken } from '@ics/shared';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'PLATFORM_ADMIN';
    isIndependent?: boolean; // 为类型兼容性添加，对管理员始终为 false
}

interface AdminState {
    user: AdminUser | null;
    token: AuthToken | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;
    setAuth: (user: AdminUser, token: AuthToken) => void;
    setUser: (user: AdminUser) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    updateToken: (token: AuthToken) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: false,

            setAuth: (user, token) => {
                // 验证 token
                if (!token || !token.accessToken || token.accessToken === 'null' || token.accessToken === null) {
                    console.error('[AdminStore] ❌ 尝试设置无效 token:', token);
                    throw new Error('Invalid token: accessToken is null or missing');
                }

                // 验证用户角色
                if (user.role !== 'PLATFORM_ADMIN') {
                    console.error('[AdminStore] ❌ 非管理员账号尝试登录管理后台');
                    throw new Error('只有平台管理员可以登录管理后台');
                }

                console.log('[AdminStore] ✅ 管理员登录成功');
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            setUser: (user) => set({ user }),
            setLoading: (isLoading) => set({ isLoading }),

            logout: () => {
                console.log('[AdminStore] 管理员退出登录');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            updateToken: (token) => set({ token }),

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            },
        }),
        {
            name: 'admin-storage', // 独立的 localStorage key
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
