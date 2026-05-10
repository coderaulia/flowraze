import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';

export function SuperadminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperadmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to="/admin" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function ManagerOrAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdminOrManager, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to="/admin" replace />;
  if (!isAdminOrManager()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function CompanyMemberRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
