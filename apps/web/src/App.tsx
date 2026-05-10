import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  SuperadminRoute,
  AdminRoute,
  CompanyMemberRoute,
  FeatureRoute,
} from './components/guards';
import { COMPANY_ROUTES } from './lib/routes';
import { useAuthStore } from './hooks/useAuthStore';
import { get } from './lib/api';
import type { User } from './types';
import { LoginPage } from './pages/auth/login';
import { RegisterPage } from './pages/auth/register';
import { OnboardingPage } from './pages/company/onboarding';
import { AcceptInvitePage } from './pages/company/accept-invite';
import { LandingPage } from './pages/marketing/landing';
import { SolutionsPage } from './pages/marketing/solutions';
import { PricingPage } from './pages/marketing/pricing';
import { AboutPage } from './pages/marketing/about';
import { PrivacyPage } from './pages/marketing/privacy';
import { TermsPage } from './pages/marketing/terms';
import { BlogPage } from './pages/marketing/blog';
import { CareersPage } from './pages/marketing/careers';
import { HelpPage } from './pages/marketing/help';
import { ResourcesPage } from './pages/marketing/resources';
import { DashboardPage } from './pages/company';
import { LeadsPage } from './pages/company/leads';
import { DealsPage } from './pages/company/deals';
import { CampaignsPage } from './pages/company/campaigns';
import { TeamPage } from './pages/company/team';
import { SettingsPage } from './pages/company/settings';
import { UsersPage } from './pages/company/users';
import { SearchPage } from './pages/company/search';
import { TargetsPage } from './pages/company/targets';
import { ActivitiesPage } from './pages/company/activities';
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
  const { isAuthenticated, updateUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      get<{ user: User }>('/auth/me').then((response) => {
        if (response.success && response.data) {
          updateUser(response.data.user);
        }
      });
    }
  }, [isAuthenticated, updateUser]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/resources" element={<ResourcesPage />} />

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
          <Route
            path="targets"
            element={
              <FeatureRoute feature="targets">
                <TargetsPage />
              </FeatureRoute>
            }
          />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route
            path="campaigns"
            element={
              <FeatureRoute feature="campaigns">
                <CampaignsPage />
              </FeatureRoute>
            }
          />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route
            path="team"
            element={
              <FeatureRoute feature="teamPerformance">
                <TeamPage />
              </FeatureRoute>
            }
          />
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
