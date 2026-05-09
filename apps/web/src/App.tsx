import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import { Layout } from './components/layout';
import { LoginPage } from './pages/login';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="" element={<DashboardPage />} />
        </Route>
        
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LeadsPage />} />
        </Route>
        
        <Route
          path="/deals"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DealsPage />} />
        </Route>
        
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CampaignsPage />} />
        </Route>
        
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeamPage />} />
        </Route>
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SettingsPage />} />
        </Route>

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UsersPage />} />
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
        
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
