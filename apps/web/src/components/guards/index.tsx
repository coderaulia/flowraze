import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ADMIN_HOME_ROUTE, COMPANY_ROUTES } from '@/lib/routes';

export function SuperadminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperadmin()) return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to={ADMIN_HOME_ROUTE} replace />;
  if (!isAdmin()) return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  return <>{children}</>;
}

export function ManagerOrAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdminOrManager, isSuperadmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to={ADMIN_HOME_ROUTE} replace />;
  if (!isAdminOrManager()) return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  return <>{children}</>;
}

export function CompanyMemberRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperadmin, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperadmin()) return <Navigate to={ADMIN_HOME_ROUTE} replace />;

  // If a regular user (not superadmin) has no company, they must onboard
  if (!user?.companyId) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
