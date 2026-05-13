import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'employee';

export interface Entitlements {
  plan: string;
  status: string;
  isActive: boolean;
  seats: number;
  features: {
    analytics: boolean;
    apiKeys: boolean;
    automation: boolean;
    campaigns: boolean;
    exports: boolean;
    targets: boolean;
    teamPerformance: boolean;
    webhooks: boolean;
  };
  limits: {
    apiKeys: number;
    webhooks: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  emailVerifiedAt?: Date | string | null;
  entitlements?: Entitlements | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  isSuperadmin: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAdminOrManager: () => boolean;
  isCompanyMember: () => boolean;
  hasFeature: (feature: keyof Entitlements['features']) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },

      isSuperadmin: () => get().user?.role === 'superadmin',
      isAdmin: () => get().user?.role === 'admin',
      isManager: () => get().user?.role === 'manager',
      isAdminOrManager: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'manager';
      },
      isCompanyMember: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'manager' || role === 'employee';
      },
      hasFeature: (feature) => {
        const user = get().user;
        if (user?.role === 'superadmin') return true;
        return Boolean(user?.entitlements?.features[feature]);
      },
    }),
    {
      name: 'flowraze-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
