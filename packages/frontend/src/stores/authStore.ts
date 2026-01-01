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
      return '/admin';
    case 'FACTORY_OWNER':
      return '/dashboard';
    case 'BUSINESS_STAFF':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

/**
 * Check if a role has access to a specific path
 */
export function hasAccessToPath(role: UserRole, path: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    PLATFORM_ADMIN: ['/admin', '/dashboard', '/notifications'],
    FACTORY_OWNER: ['/dashboard', '/influencers', '/samples', '/pipeline', '/results', '/reports', '/notifications'],
    BUSINESS_STAFF: ['/dashboard', '/influencers', '/pipeline', '/results', '/notifications'],
  };

  const allowedPaths = rolePermissions[role] || [];
  return allowedPaths.some(allowed => path.startsWith(allowed));
}
