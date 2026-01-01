import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { Suspense, lazy } from 'react';
import { useAuthStore, getDefaultPathForRole } from '../stores/authStore';
import type { UserRole } from '@ics/shared';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/Login'));
const RegisterPage = lazy(() => import('../pages/Register'));
const MainLayout = lazy(() => import('../layouts/MainLayout'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const InfluencersPage = lazy(() => import('../pages/Influencers'));
const SamplesPage = lazy(() => import('../pages/Samples'));
const PipelinePage = lazy(() => import('../pages/Pipeline'));
const ResultsPage = lazy(() => import('../pages/Results'));
const ReportsPage = lazy(() => import('../pages/Reports'));
const AdminPage = lazy(() => import('../pages/Admin'));
const NotificationsPage = lazy(() => import('../pages/Notifications'));

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

// Route guard that checks path access (can be used for more granular control)
// Currently using RoleRoute for simplicity

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
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
          path="/"
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

          {/* Admin - Platform Admin only */}
          <Route
            path="admin"
            element={
              <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminPage />
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
