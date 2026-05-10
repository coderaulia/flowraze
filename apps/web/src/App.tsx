import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  SuperadminRoute,
  AdminRoute,
  CompanyMemberRoute,
} from './components/guards';
import { COMPANY_ROUTES } from './lib/routes';
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

function RedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
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

        {/* Legacy company app paths */}
        <Route path="/dashboard" element={<RedirectWithSearch to={COMPANY_ROUTES.dashboard} />} />
        <Route path="/targets" element={<RedirectWithSearch to={COMPANY_ROUTES.targets} />} />
        <Route path="/leads" element={<RedirectWithSearch to={COMPANY_ROUTES.leads} />} />
        <Route path="/deals" element={<RedirectWithSearch to={COMPANY_ROUTES.deals} />} />
        <Route path="/campaigns" element={<RedirectWithSearch to={COMPANY_ROUTES.campaigns} />} />
        <Route path="/activities" element={<RedirectWithSearch to={COMPANY_ROUTES.activities} />} />
        <Route path="/team" element={<RedirectWithSearch to={COMPANY_ROUTES.team} />} />
        <Route path="/users" element={<RedirectWithSearch to={COMPANY_ROUTES.users} />} />
        <Route path="/settings" element={<RedirectWithSearch to={COMPANY_ROUTES.settings} />} />
        <Route path="/search" element={<RedirectWithSearch to={COMPANY_ROUTES.search} />} />

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

        {/* Company app routes (admin | manager | employee — not superadmin) */}
        <Route
          path="/company"
          element={
            <CompanyMemberRoute>
              <Layout />
            </CompanyMemberRoute>
          }
        >
          <Route index element={<Navigate to={COMPANY_ROUTES.dashboard} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="targets" element={<TargetsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
          <Route path="search" element={<SearchPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
