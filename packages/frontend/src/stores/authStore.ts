import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, AuthToken } from '@ics/shared';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  brandId?: string;
  factory?: {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    planType: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
    staffLimit: number;
    influencerLimit: number;
    _count?: {
      staff: number;
      influencers: number;
    };
  };
}

interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: AuthToken) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateToken: (token: AuthToken) => void;
  loginAsDemo: (role?: UserRole) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      setAuth: (user, token) => {
        // Validate token before setting
        if (!token || !token.accessToken || token.accessToken === 'null' || token.accessToken === null) {
          console.error('[AuthStore] ❌ Attempted to set invalid token:', token);
          throw new Error('Invalid token: accessToken is null or missing');
        }

        console.log('[AuthStore] ✅ Setting valid token');
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      updateToken: (token) => set({ token }),
      loginAsDemo: (role: UserRole = 'BRAND') => set({
        isAuthenticated: true,
        token: { accessToken: 'demo-token', refreshToken: 'demo-refresh', expiresIn: 3600 },
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: role,
          brandId: 'demo-factory',
        }
      }),
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

/**
 * Get the default redirect path based on user role
 * 注意：PLATFORM_ADMIN 现在使用独立的认证系统，此处重定向到管理员登录页
 */
export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'PLATFORM_ADMIN':
      // 平台管理员应使用独立的登录入口
      return '/admin/login';
    case 'BRAND':
      return '/app/dashboard';
    case 'BUSINESS':
      return '/app/dashboard';
    case 'INFLUENCER':
      // 达人用户跳转到达人端口
      return '/influencer-portal';
    default:
      return '/app/dashboard';
  }
}

/**
 * Check if a role has access to a specific path
 */
export function hasAccessToPath(role: UserRole, path: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    PLATFORM_ADMIN: ['/app/admin', '/app/dashboard', '/app/notifications'],
    BRAND: ['/app/dashboard', '/app/influencers', '/app/samples', '/app/pipeline', '/app/results', '/app/reports', '/app/notifications'],
    BUSINESS: ['/app/dashboard', '/app/influencers', '/app/pipeline', '/app/results', '/app/notifications'],
    INFLUENCER: [],
  };

  const allowedPaths = rolePermissions[role] || [];
  return allowedPaths.some(allowed => path.startsWith(allowed));
}
