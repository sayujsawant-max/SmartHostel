import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { getRoleHomePath } from '@utils/role-home';
import ProtectedRoute from '@components/layout/ProtectedRoute';
import RoleRoute from '@components/layout/RoleRoute';
import StudentShell from '@components/layout/StudentShell';
import WardenShell from '@components/layout/WardenShell';
import GuardShell from '@components/layout/GuardShell';
import MaintenanceShell from '@components/layout/MaintenanceShell';
import Chatbot from '@components/Chatbot';

// Lazy-loaded pages (route-level code splitting)
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
const RoomsPage = lazy(() => import('@pages/RoomsPage'));
const LandingPage = lazy(() => import('@pages/LandingPage'));

// Student pages
const StudentStatusPage = lazy(() => import('@pages/student/StatusPage'));
const StudentActionsPage = lazy(() => import('@pages/student/ActionsPage'));
const StudentFaqPage = lazy(() => import('@pages/student/FaqPage'));
const ShowQRPage = lazy(() => import('@pages/student/ShowQRPage'));
const ReportIssuePage = lazy(() => import('@pages/student/ReportIssuePage'));
const RequestLeavePage = lazy(() => import('@pages/student/RequestLeavePage'));
const ComplaintDetailPage = lazy(() => import('@pages/student/ComplaintDetailPage'));
const StudentProfilePage = lazy(() => import('@pages/student/ProfilePage'));
const StudentMessMenuPage = lazy(() => import('@pages/student/MessMenuPage'));
const LaundryBookingPage = lazy(() => import('@pages/student/LaundryBookingPage'));
const VisitorRegistrationPage = lazy(() => import('@pages/student/VisitorRegistrationPage'));
const RoomChangePage = lazy(() => import('@pages/student/RoomChangePage'));
const LostFoundPage = lazy(() => import('@pages/student/LostFoundPage'));
const RoomRequestPage = lazy(() => import('@pages/student/RoomRequestPage'));

// Warden pages
const WardenDashboardPage = lazy(() => import('@pages/warden/DashboardPage'));
const WardenStudentsPage = lazy(() => import('@pages/warden/StudentsPage'));
const WardenComplaintsPage = lazy(() => import('@pages/warden/ComplaintsPage'));
const WardenSettingsPage = lazy(() => import('@pages/warden/SettingsPage'));
const WardenNoticesPage = lazy(() => import('@pages/warden/NoticesPage'));
const WardenRoomsManagePage = lazy(() => import('@pages/warden/RoomsManagePage'));
const WardenUsersManagePage = lazy(() => import('@pages/warden/UsersManagePage'));
const WardenMessMenuPage = lazy(() => import('@pages/warden/MessMenuPage'));
const WardenLaundryManagePage = lazy(() => import('@pages/warden/LaundryManagePage'));
const WardenVisitorManagePage = lazy(() => import('@pages/warden/VisitorManagePage'));
const WardenRoomChangeManagePage = lazy(() => import('@pages/warden/RoomChangeManagePage'));
const WardenReportsPage = lazy(() => import('@pages/warden/ReportsPage'));

// Guard pages
const GuardVisitorCheckPage = lazy(() => import('@pages/guard/VisitorCheckPage'));
const GuardScanPage = lazy(() => import('@pages/guard/ScanPage'));

// Maintenance pages
const MaintenanceTasksPage = lazy(() => import('@pages/maintenance/TasksPage'));
const MaintenanceHistoryPage = lazy(() => import('@pages/maintenance/HistoryPage'));
const MaintenanceFaqPage = lazy(() => import('@pages/maintenance/FaqPage'));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[hsl(var(--muted))] border-t-[hsl(var(--accent))] rounded-full animate-spin" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
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
              <Route path="/student/actions/request-leave" element={<RequestLeavePage />} />
              <Route path="/student/status/complaint/:complaintId" element={<ComplaintDetailPage />} />
              <Route path="/student/faq" element={<StudentFaqPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/mess-menu" element={<StudentMessMenuPage />} />
              <Route path="/student/laundry" element={<LaundryBookingPage />} />
              <Route path="/student/visitors" element={<VisitorRegistrationPage />} />
              <Route path="/student/room-change" element={<RoomChangePage />} />
              <Route path="/student/lost-found" element={<LostFoundPage />} />
              <Route path="/student/room-request" element={<RoomRequestPage />} />
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
              <Route path="/warden/mess-menu" element={<WardenMessMenuPage />} />
              <Route path="/warden/laundry" element={<WardenLaundryManagePage />} />
              <Route path="/warden/visitors" element={<WardenVisitorManagePage />} />
              <Route path="/warden/room-changes" element={<WardenRoomChangeManagePage />} />
              <Route path="/warden/reports" element={<WardenReportsPage />} />
            </Route>
          </Route>

          {/* Guard routes */}
          <Route element={<RoleRoute allowedRoles={[Role.GUARD]} />}>
            <Route element={<GuardShell />}>
              <Route path="/guard/scan" element={<GuardScanPage />} />
              <Route path="/guard/visitors" element={<GuardVisitorCheckPage />} />
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
        <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/landing" replace />} />
      </Routes>

      {/* Chatbot - visible only when authenticated */}
      {isAuthenticated && <Chatbot />}
    </Suspense>
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
