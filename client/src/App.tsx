import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { getRoleHomePath } from '@utils/role-home';
import LoginPage from '@pages/LoginPage';
import RegisterPage from '@pages/RegisterPage';
import RoomsPage from '@pages/RoomsPage';
import ProtectedRoute from '@components/layout/ProtectedRoute';
import RoleRoute from '@components/layout/RoleRoute';
import StudentShell from '@components/layout/StudentShell';
import WardenShell from '@components/layout/WardenShell';
import GuardShell from '@components/layout/GuardShell';
import MaintenanceShell from '@components/layout/MaintenanceShell';
import Chatbot from '@components/Chatbot';

// Student pages
import StudentStatusPage from '@pages/student/StatusPage';
import StudentActionsPage from '@pages/student/ActionsPage';
import StudentFaqPage from '@pages/student/FaqPage';
import ShowQRPage from '@pages/student/ShowQRPage';
import ReportIssuePage from '@pages/student/ReportIssuePage';
import ComplaintDetailPage from '@pages/student/ComplaintDetailPage';

// Warden pages
import WardenDashboardPage from '@pages/warden/DashboardPage';
import WardenStudentsPage from '@pages/warden/StudentsPage';
import WardenComplaintsPage from '@pages/warden/ComplaintsPage';
import WardenSettingsPage from '@pages/warden/SettingsPage';
import WardenNoticesPage from '@pages/warden/NoticesPage';
import WardenRoomsManagePage from '@pages/warden/RoomsManagePage';
import WardenUsersManagePage from '@pages/warden/UsersManagePage';

// Guard pages
import GuardScanPage from '@pages/guard/ScanPage';

// Maintenance pages
import MaintenanceTasksPage from '@pages/maintenance/TasksPage';
import MaintenanceHistoryPage from '@pages/maintenance/HistoryPage';
import MaintenanceFaqPage from '@pages/maintenance/FaqPage';

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user.role)} replace />;
}

function LoginRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <LoginPage />;
}

function RegisterRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <RegisterPage />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/rooms" element={<RoomsPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Root redirects to role home */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* Student routes */}
          <Route element={<RoleRoute allowedRoles={[Role.STUDENT]} />}>
            <Route element={<StudentShell />}>
              <Route path="/student/status" element={<StudentStatusPage />} />
              <Route path="/student/actions" element={<StudentActionsPage />} />
              <Route path="/student/actions/show-qr" element={<ShowQRPage />} />
              <Route path="/student/actions/report-issue" element={<ReportIssuePage />} />
              <Route path="/student/status/complaint/:complaintId" element={<ComplaintDetailPage />} />
              <Route path="/student/faq" element={<StudentFaqPage />} />
            </Route>
          </Route>

          {/* Warden routes */}
          <Route element={<RoleRoute allowedRoles={[Role.WARDEN_ADMIN]} />}>
            <Route element={<WardenShell />}>
              <Route path="/warden/dashboard" element={<WardenDashboardPage />} />
              <Route path="/warden/students" element={<WardenStudentsPage />} />
              <Route path="/warden/complaints" element={<WardenComplaintsPage />} />
              <Route path="/warden/notices" element={<WardenNoticesPage />} />
              <Route path="/warden/rooms" element={<WardenRoomsManagePage />} />
              <Route path="/warden/users" element={<WardenUsersManagePage />} />
              <Route path="/warden/settings" element={<WardenSettingsPage />} />
            </Route>
          </Route>

          {/* Guard routes */}
          <Route element={<RoleRoute allowedRoles={[Role.GUARD]} />}>
            <Route element={<GuardShell />}>
              <Route path="/guard/scan" element={<GuardScanPage />} />
            </Route>
          </Route>

          {/* Maintenance routes */}
          <Route element={<RoleRoute allowedRoles={[Role.MAINTENANCE]} />}>
            <Route element={<MaintenanceShell />}>
              <Route path="/maintenance/tasks" element={<MaintenanceTasksPage />} />
              <Route path="/maintenance/history" element={<MaintenanceHistoryPage />} />
              <Route path="/maintenance/faq" element={<MaintenanceFaqPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Chatbot - visible only when authenticated */}
      {isAuthenticated && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
