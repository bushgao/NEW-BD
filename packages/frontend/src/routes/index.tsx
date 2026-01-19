import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { Suspense, lazy } from 'react';
import { useAuthStore, getDefaultPathForRole } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';
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
const AdminIndependent = lazy(() => import('../pages/Admin/IndependentBusinessList'));
const NotificationsPage = lazy(() => import('../pages/Notifications'));
const UIShowcase = lazy(() => import('../pages/UIShowcase'));
const TeamPage = lazy(() => import('../pages/Team'));
const RoiCalculatorPage = lazy(() => import('../pages/RoiCalculator'));
const AdminInfluencerCollection = lazy(() => import('../pages/Admin/InfluencerCollection'));
const InfluencerSquarePage = lazy(() => import('../pages/InfluencerSquare'));
const PluginUsagePage = lazy(() => import('../pages/PluginUsage'));

// 平台管理员登录页面
const AdminLoginPage = lazy(() => import('../pages/AdminLogin'));

// 邀请注册页面
const InviteRegisterPage = lazy(() => import('../pages/Invite'));

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
  allowIndependent?: boolean; // 允许独立商务访问（即使角色不在 allowedRoles 中）
  requiredPermission?: 'manageSamples' | 'viewCostData'; // 权限检查（用于商务员工）
}

const RoleRoute = ({ children, allowedRoles, allowIndependent = false, requiredPermission }: RoleRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 检查角色是否在允许列表中
  const hasAllowedRole = allowedRoles.includes(user.role);

  // 检查是否为独立商务（当 allowIndependent 为 true 时）
  const isAllowedIndependent = allowIndependent && user.role === 'BUSINESS' && user.isIndependent;

  // 检查基于权限的访问（商务员工特有）
  const hasRequiredPermission = (() => {
    if (!requiredPermission || user.role !== 'BUSINESS') {
      return false;
    }
    const permissions = (user as any)?.permissions;
    if (!permissions) {
      return false;
    }
    if (requiredPermission === 'manageSamples') {
      return permissions?.operations?.manageSamples === true;
    }
    if (requiredPermission === 'viewCostData') {
      return permissions?.advanced?.viewCostData === true;
    }
    return false;
  })();

  if (!hasAllowedRole && !isAllowedIndependent && !hasRequiredPermission) {
    // Redirect to default path for user's role
    const defaultPath = getDefaultPathForRole(user.role);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect if authenticated)
// 注意：PLATFORM_ADMIN 使用独立的 adminStore，不应该基于 authStore 重定向
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  // 只对非管理员用户进行重定向
  if (isAuthenticated && user && user.role !== 'PLATFORM_ADMIN') {
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

// ============================================
// 平台管理员路由守卫（独立认证系统）
// ============================================

// 管理员保护路由
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdminStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// 管理员公开路由（已登录则跳转）
const AdminPublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdminStore();

  if (isAuthenticated) {
    return <Navigate to="/app/admin" replace />;
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

        {/* 邀请注册页面 - 公开访问 */}
        <Route path="/invite/:code" element={<InviteRegisterPage />} />

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
              <RoleRoute allowedRoles={['PLATFORM_ADMIN', 'BRAND', 'BUSINESS']}>
                <Dashboard />
              </RoleRoute>
            }
          />

          {/* Influencer Square - Browse and pull from global pool */}
          <Route
            path="influencer-square"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <InfluencerSquarePage />
              </RoleRoute>
            }
          />

          {/* Influencer management - Factory Owner and Business Staff */}
          <Route
            path="influencers"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <InfluencersPage />
              </RoleRoute>
            }
          />

          {/* Sample management - Factory Owner, Independent Business, and staff with permission */}
          <Route
            path="samples"
            element={
              <RoleRoute allowedRoles={['BRAND']} allowIndependent={true} requiredPermission="manageSamples">
                <SamplesPage />
              </RoleRoute>
            }
          />

          {/* Pipeline - Factory Owner and Business Staff */}
          <Route
            path="pipeline"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <PipelinePage />
              </RoleRoute>
            }
          />

          {/* Results - Factory Owner and Business Staff */}
          <Route
            path="results"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <ResultsPage />
              </RoleRoute>
            }
          />

          {/* Reports - Factory Owner and staff with viewCostData permission */}
          <Route
            path="reports"
            element={
              <RoleRoute allowedRoles={['BRAND']} requiredPermission="viewCostData">
                <ReportsPage />
              </RoleRoute>
            }
          />

          {/* Follow-up Analytics - Factory Owner and Business Staff */}
          <Route
            path="follow-up-analytics"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <FollowUpAnalyticsPage />
              </RoleRoute>
            }
          />

          {/* ROI Calculator - Factory Owner and Business Staff */}
          <Route
            path="roi-calculator"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <RoiCalculatorPage />
              </RoleRoute>
            }
          />

          {/* Team Management - Factory Owner only */}
          <Route
            path="team"
            element={
              <RoleRoute allowedRoles={['BRAND']}>
                <TeamPage />
              </RoleRoute>
            }
          />

          {/* Plugin Usage - All authenticated users */}
          <Route
            path="plugin"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <PluginUsagePage />
              </RoleRoute>
            }
          />

          {/* Admin routes moved outside - using independent auth */}
        </Route>

        {/* ============================================ */}
        {/* 平台管理员路由（独立认证系统） */}
        {/* ============================================ */}

        {/* 管理员登录页 */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLoginPage />
            </AdminPublicRoute>
          }
        />

        {/* 管理后台路由 - 使用独立的 AdminProtectedRoute */}
        <Route
          path="/app/admin"
          element={
            <AdminProtectedRoute>
              <MainLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminPage />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="factories" element={<AdminFactories />} />
          <Route path="independent" element={<AdminIndependent />} />
          <Route path="influencers" element={<AdminInfluencers />} />
          <Route path="collection" element={<AdminInfluencerCollection />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="plugin" element={<PluginUsagePage />} />
        </Route>

        {/* Notifications for admin - using admin auth */}
        <Route
          path="/app/admin/notifications"
          element={
            <AdminProtectedRoute>
              <MainLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<NotificationsPage />} />

        </Route>

        {/* Factory client routes - Notifications */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Notifications - Factory Owner and Business Staff only */}
          <Route
            path="notifications"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
                <NotificationsPage />
              </RoleRoute>
            }
          />

          {/* UI Showcase - All factory users */}
          <Route
            path="ui-showcase"
            element={
              <RoleRoute allowedRoles={['BRAND', 'BUSINESS']}>
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
          <Route path="plugin" element={<PluginUsagePage />} />
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
