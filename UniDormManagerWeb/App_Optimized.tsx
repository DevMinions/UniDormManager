import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 代码分割 - 懒加载组件
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoomManagement = lazy(() => import('./pages/RoomManagement'));
const RepairRequests = lazy(() => import('./pages/RepairRequests'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const Students = lazy(() => import('./pages/Students'));
const Notices = lazy(() => import('./pages/Notices'));
const Buildings = lazy(() => import('./pages/Buildings'));
const Login = lazy(() => import('./pages/Login'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const PermissionList = lazy(() => import('./pages/PermissionList'));

// 加载组件
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">加载中...</p>
    </div>
  </div>
);

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('页面加载错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">页面加载失败</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Layout wrapper to handle conditional rendering of Sidebar/MobileNav
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 relative w-full">
        {children}
      </div>
      <MobileNav />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Route: Login */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/buildings" element={<Buildings />} />
                      <Route path="/rooms" element={<RoomManagement />} />
                      <Route path="/repairs" element={<RepairRequests />} />
                      <Route path="/students" element={<Students />} />
                      <Route path="/notices" element={<Notices />} />
                      <Route path="/assistant" element={<AiAssistant />} />

                      {/* Admin Routes */}
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/roles" element={<RoleManagement />} />
                      <Route path="/permissions" element={<PermissionList />} />
                    </Routes>
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;