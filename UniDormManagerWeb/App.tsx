
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './pages/Dashboard';
import RoomManagement from './pages/RoomManagement';
import RepairRequests from './pages/RepairRequests';
import AiAssistant from './pages/AiAssistant';
import Students from './pages/Students';
import Notices from './pages/Notices';
import NoticeDetail from './pages/NoticeDetail';
import Buildings from './pages/Buildings';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import PermissionList from './pages/PermissionList';
import InspectionScoring from './pages/InspectionScoring';
import InspectionRankings from './pages/InspectionRankings';
import ExchangeRequests from './pages/ExchangeRequests';
import AccessLogs from './pages/AccessLogs';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/buildings" element={<Buildings />} />
                <Route path="/rooms" element={<RoomManagement />} />
                <Route path="/repairs" element={<RepairRequests />} />
                <Route path="/students" element={<Students />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/notices/:id" element={<NoticeDetail />} />
                <Route path="/assistant" element={<AiAssistant />} />

                {/* New Feature Routes */}
                <Route path="/inspections" element={<InspectionScoring />} />
                <Route path="/rankings" element={<InspectionRankings />} />
                <Route path="/workflow" element={<ExchangeRequests />} />
                <Route path="/access-logs" element={<AccessLogs />} />

                {/* Admin Routes */}
                <Route path="/users" element={<UserManagement />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/permissions" element={<PermissionList />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
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
