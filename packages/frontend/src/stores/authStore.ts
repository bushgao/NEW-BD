import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, AuthToken } from '@ics/shared';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  factoryId?: string;
}

interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: AuthToken) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateToken: (token: AuthToken) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      updateToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

/**
 * Get the default redirect path based on user role
 */
export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/app/admin';
    case 'FACTORY_OWNER':
      return '/app/dashboard';
    case 'BUSINESS_STAFF':
      return '/app/dashboard';
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
    FACTORY_OWNER: ['/app/dashboard', '/app/influencers', '/app/samples', '/app/pipeline', '/app/results', '/app/reports', '/app/notifications'],
    BUSINESS_STAFF: ['/app/dashboard', '/app/influencers', '/app/pipeline', '/app/results', '/app/notifications'],
  };

  const allowedPaths = rolePermissions[role] || [];
  return allowedPaths.some(allowed => path.startsWith(allowed));
}
