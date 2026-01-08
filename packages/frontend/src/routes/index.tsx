import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { Suspense, lazy } from 'react';
import { useAuthStore, getDefaultPathForRole } from '../stores/authStore';
import { useInfluencerPortalStore } from '../stores/influencerPortalStore';
import type { UserRole } from '@ics/shared';

// Lazy load pages
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/Login'));
const RegisterPage = lazy(() => import('../pages/Register'));
const MainLayout = lazy(() => import('../layouts/MainLayout'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const InfluencersPage = lazy(() => import('../pages/Influencers'));
const SamplesPage = lazy(() => import('../pages/Samples'));
const PipelinePage = lazy(() => import('../pages/Pipeline'));
const ResultsPage = lazy(() => import('../pages/Results'));
const ReportsPage = lazy(() => import('../pages/Reports'));
const FollowUpAnalyticsPage = lazy(() => import('../pages/FollowUpAnalytics'));
const AdminPage = lazy(() => import('../pages/Admin'));
const AdminOverview = lazy(() => import('../pages/Admin/Overview'));
const AdminFactories = lazy(() => import('../pages/Admin/Factories'));
const AdminInfluencers = lazy(() => import('../pages/Admin/Influencers'));
const AdminUsers = lazy(() => import('../pages/Admin/Users'));
const NotificationsPage = lazy(() => import('../pages/Notifications'));
const UIShowcase = lazy(() => import('../pages/UIShowcase'));
const TeamPage = lazy(() => import('../pages/Team'));

// 达人端口页面
const InfluencerLoginPage = lazy(() => import('../pages/InfluencerPortal/Login'));
const InfluencerPortalLayout = lazy(() => import('../layouts/InfluencerPortalLayout'));
const InfluencerDashboardPage = lazy(() => import('../pages/InfluencerPortal/Dashboard'));
const InfluencerSamplesPage = lazy(() => import('../pages/InfluencerPortal/Samples'));
const InfluencerCollaborationsPage = lazy(() => import('../pages/InfluencerPortal/Collaborations'));
const InfluencerCollaborationDetailPage = lazy(() => import('../pages/InfluencerPortal/CollaborationDetail'));
const InfluencerSettingsPage = lazy(() => import('../pages/InfluencerPortal/Settings'));

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role-based route wrapper
interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to default path for user's role
    const defaultPath = getDefaultPathForRole(user.role);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const defaultPath = getDefaultPathForRole(user.role);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// 达人端口路由守卫
const InfluencerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useInfluencerPortalStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/influencer-portal/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// 达人端口公开路由（已登录则跳转）
const InfluencerPublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useInfluencerPortalStore();

  if (isAuthenticated) {
    return <Navigate to="/influencer-portal" replace />;
  }

  return <>{children}</>;
};

// Route guard that checks path access (can be used for more granular control)
// Currently using RoleRoute for simplicity

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Landing Page - Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RedirectToDefault />} />
          {/* Dashboard - accessible by all authenticated users */}
          <Route
            path="dashboard"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <Dashboard />
              </RoleRoute>
            }
          />

          {/* Influencer management - Factory Owner and Business Staff */}
          <Route
            path="influencers"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <InfluencersPage />
              </RoleRoute>
            }
          />

          {/* Sample management - Factory Owner only */}
          <Route
            path="samples"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER']}>
                <SamplesPage />
              </RoleRoute>
            }
          />

          {/* Pipeline - Factory Owner and Business Staff */}
          <Route
            path="pipeline"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <PipelinePage />
              </RoleRoute>
            }
          />

          {/* Results - Factory Owner and Business Staff */}
          <Route
            path="results"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <ResultsPage />
              </RoleRoute>
            }
          />

          {/* Reports - Factory Owner only */}
          <Route
            path="reports"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER']}>
                <ReportsPage />
              </RoleRoute>
            }
          />

          {/* Follow-up Analytics - Factory Owner and Business Staff */}
          <Route
            path="follow-up-analytics"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <FollowUpAnalyticsPage />
              </RoleRoute>
            }
          />

          {/* Team Management - Factory Owner only */}
          <Route
            path="team"
            element={
              <RoleRoute allowedRoles={['FACTORY_OWNER']}>
                <TeamPage />
              </RoleRoute>
            }
          />

          {/* Admin - Platform Admin only */}
          <Route
            path="admin"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/overview"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminOverview />
              </RoleRoute>
            }
          />
          <Route
            path="admin/factories"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminFactories />
              </RoleRoute>
            }
          />
          <Route
            path="admin/influencers"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminInfluencers />
              </RoleRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminUsers />
              </RoleRoute>
            }
          />

          {/* Notifications - All authenticated users */}
          <Route
            path="notifications"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <NotificationsPage />
              </RoleRoute>
            }
          />

          {/* UI Showcase - All authenticated users */}
          <Route
            path="ui-showcase"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF']}>
                <UIShowcase />
              </RoleRoute>
            }
          />
        </Route>

        {/* ============================================ */}
        {/* 达人端口路由（独立于商务端） */}
        {/* ============================================ */}
        
        {/* 达人登录页 */}
        <Route
          path="/influencer-portal/login"
          element={
            <InfluencerPublicRoute>
              <InfluencerLoginPage />
            </InfluencerPublicRoute>
          }
        />

        {/* 达人端口主路由 */}
        <Route
          path="/influencer-portal"
          element={
            <InfluencerProtectedRoute>
              <InfluencerPortalLayout />
            </InfluencerProtectedRoute>
          }
        >
          <Route index element={<InfluencerDashboardPage />} />
          <Route path="samples" element={<InfluencerSamplesPage />} />
          <Route path="collaborations" element={<InfluencerCollaborationsPage />} />
          <Route path="collaborations/:id" element={<InfluencerCollaborationDetailPage />} />
          <Route path="settings" element={<InfluencerSettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Helper component to redirect to default path based on role
const RedirectToDefault = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const defaultPath = getDefaultPathForRole(user.role);
  return <Navigate to={defaultPath} replace />;
};

export default AppRoutes;
