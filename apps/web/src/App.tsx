import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import { Layout } from './components/layout';
import {
  SuperadminRoute,
  AdminRoute,
  CompanyMemberRoute,
} from './components/guards';
import { LoginPage } from './pages/login';
import { AcceptInvitePage } from './pages/accept-invite';
import { LandingPage } from './pages/landing';
import { SolutionsPage } from './pages/solutions';
import { PricingPage } from './pages/pricing';
import { DashboardPage } from './pages/dashboard';
import { LeadsPage } from './pages/leads';
import { DealsPage } from './pages/deals';
import { CampaignsPage } from './pages/campaigns';
import { TeamPage } from './pages/team';
import { SettingsPage } from './pages/settings';
import { UsersPage } from './pages/users';
import { SearchPage } from './pages/search';
import { TargetsPage } from './pages/targets';
import { ActivitiesPage } from './pages/activities';
import { AdminDashboardPage } from './pages/admin';
import { AdminCompaniesPage } from './pages/admin/companies';
import { AdminCompanyDetailPage } from './pages/admin/company-detail';
import { AdminBillingPage } from './pages/admin/billing';
import { AdminUsersPage } from './pages/admin/users';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Superadmin platform routes */}
        <Route
          path="/admin"
          element={
            <SuperadminRoute>
              <Layout />
            </SuperadminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="companies/:id" element={<AdminCompanyDetailPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {/* Admin-only company routes */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<UsersPage />} />
        </Route>

        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<SettingsPage />} />
        </Route>

        {/* Company member routes (admin | manager | employee — not superadmin) */}
        <Route
          path="/dashboard"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<DashboardPage />} />
        </Route>

        <Route
          path="/targets"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<TargetsPage />} />
        </Route>

        <Route
          path="/leads"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<LeadsPage />} />
        </Route>

        <Route
          path="/deals"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<DealsPage />} />
        </Route>

        <Route
          path="/campaigns"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<CampaignsPage />} />
        </Route>

        <Route
          path="/team"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<TeamPage />} />
        </Route>

        <Route
          path="/activities"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<ActivitiesPage />} />
        </Route>

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SearchPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
