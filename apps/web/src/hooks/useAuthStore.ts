import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'superadmin' | 'admin' | 'staff';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isSuperadmin: () => boolean;
  isAdmin: () => boolean;
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
      
      isSuperadmin: () => {
        return get().user?.role === 'superadmin';
      },
      
      isAdmin: () => {
        const role = get().user?.role;
        return role === 'superadmin' || role === 'admin';
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
