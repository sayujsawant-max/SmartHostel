import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Role } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { getRoleHomePath } from '@utils/role-home';
import ProtectedRoute from '@components/layout/ProtectedRoute';
import RoleRoute from '@components/layout/RoleRoute';
import { useSmoothScroll } from '@hooks/useSmoothScroll';
import ScrollProgress from '@components/ui/ScrollProgress';
import { OfflineBanner } from '@utils/offline-queue';
import { I18nProvider } from '@context/I18nContext';
import PWAInstallPrompt from '@components/PWAInstallPrompt';
import PushPermissionPrompt from '@components/PushPermissionPrompt';
import RouteAnnouncer from '@components/RouteAnnouncer';

// Lazy-loaded shell layouts (only needed after auth + role check)
const StudentShell = lazy(() => import('@components/layout/StudentShell'));
const WardenShell = lazy(() => import('@components/layout/WardenShell'));
const GuardShell = lazy(() => import('@components/layout/GuardShell'));
const MaintenanceShell = lazy(() => import('@components/layout/MaintenanceShell'));

// Lazy-loaded global widgets (not needed for initial render)
const Chatbot = lazy(() => import('@components/Chatbot'));
const CommandPalette = lazy(() => import('@components/CommandPalette'));
const AccessibilityPanel = lazy(() => import('@components/AccessibilityPanel'));

// Lazy-loaded pages (route-level code splitting)
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
const RoomsPage = lazy(() => import('@pages/RoomsPage'));
const LandingPage = lazy(() => import('@pages/LandingPage'));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/ResetPasswordPage'));

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
const FeesPage = lazy(() => import('@pages/student/FeesPage'));
const MealPreferencesPage = lazy(() => import('@pages/student/MealPreferencesPage'));
const LeaveTrackerPage = lazy(() => import('@pages/student/LeaveTrackerPage'));
const LeaderboardPage = lazy(() => import('@pages/student/LeaderboardPage'));
const DocumentsPage = lazy(() => import('@pages/student/DocumentsPage'));
const PaymentsPage = lazy(() => import('@pages/student/PaymentsPage'));
const ChatPage = lazy(() => import('@pages/student/ChatPage'));
const FeedbackPage = lazy(() => import('@pages/student/FeedbackPage'));
const BookingsPage = lazy(() => import('@pages/student/BookingsPage'));

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
const WardenKpiDashboardPage = lazy(() => import('@pages/warden/KpiDashboardPage'));
const WardenInspectionsPage = lazy(() => import('@pages/warden/InspectionsPage'));
const WardenBulkCommunicationsPage = lazy(() => import('@pages/warden/BulkCommunicationsPage'));
const WardenAuditTrailPage = lazy(() => import('@pages/warden/AuditTrailPage'));
const WardenOccupancyHeatmapPage = lazy(() => import('@pages/warden/OccupancyHeatmapPage'));
const WardenComplaintAnalyticsPage = lazy(() => import('@pages/warden/ComplaintAnalyticsPage'));
const WardenWellnessDashboardPage = lazy(() => import('@pages/warden/WellnessDashboardPage'));
const WardenReportBuilderPage = lazy(() => import('@pages/warden/ReportBuilderPage'));
const WardenEmergencyPage = lazy(() => import('@pages/warden/EmergencyPage'));
const WardenHostelConfigPage = lazy(() => import('@pages/warden/HostelConfigPage'));
const WardenFeesManagePage = lazy(() => import('@pages/warden/FeesManagePage'));

// Guard pages
const GuardVisitorCheckPage = lazy(() => import('@pages/guard/VisitorCheckPage'));
const GuardScanPage = lazy(() => import('@pages/guard/ScanPage'));
const GuardGateAnalyticsPage = lazy(() => import('@pages/guard/GateAnalyticsPage'));

// Maintenance pages
const MaintenanceTasksPage = lazy(() => import('@pages/maintenance/TasksPage'));
const MaintenanceHistoryPage = lazy(() => import('@pages/maintenance/HistoryPage'));
const MaintenanceFaqPage = lazy(() => import('@pages/maintenance/FaqPage'));
const MaintenanceInventoryPage = lazy(() => import('@pages/maintenance/InventoryPage'));
const MaintenanceAssetTrackingPage = lazy(() => import('@pages/maintenance/AssetTrackingPage'));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
        <div
          className="w-10 h-10 border-3 border-[hsl(var(--muted))] border-t-[hsl(var(--accent))] rounded-full animate-spin"
        />
        <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
          Loading...
        </p>
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <Route path="/student/fees" element={<FeesPage />} />
              <Route path="/student/meal-preferences" element={<MealPreferencesPage />} />
              <Route path="/student/leave-tracker" element={<LeaveTrackerPage />} />
              <Route path="/student/leaderboard" element={<LeaderboardPage />} />
              <Route path="/student/documents" element={<DocumentsPage />} />
              <Route path="/student/payments" element={<PaymentsPage />} />
              <Route path="/student/chat" element={<ChatPage />} />
              <Route path="/student/feedback" element={<FeedbackPage />} />
              <Route path="/student/bookings" element={<BookingsPage />} />
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
              <Route path="/warden/kpi" element={<WardenKpiDashboardPage />} />
              <Route path="/warden/inspections" element={<WardenInspectionsPage />} />
              <Route path="/warden/communications" element={<WardenBulkCommunicationsPage />} />
              <Route path="/warden/audit-trail" element={<WardenAuditTrailPage />} />
              <Route path="/warden/occupancy-heatmap" element={<WardenOccupancyHeatmapPage />} />
              <Route path="/warden/complaint-analytics" element={<WardenComplaintAnalyticsPage />} />
              <Route path="/warden/wellness" element={<WardenWellnessDashboardPage />} />
              <Route path="/warden/report-builder" element={<WardenReportBuilderPage />} />
              <Route path="/warden/emergency" element={<WardenEmergencyPage />} />
              <Route path="/warden/hostel-config" element={<WardenHostelConfigPage />} />
              <Route path="/warden/fees" element={<WardenFeesManagePage />} />
            </Route>
          </Route>

          {/* Guard routes */}
          <Route element={<RoleRoute allowedRoles={[Role.GUARD]} />}>
            <Route element={<GuardShell />}>
              <Route path="/guard/scan" element={<GuardScanPage />} />
              <Route path="/guard/visitors" element={<GuardVisitorCheckPage />} />
              <Route path="/guard/analytics" element={<GuardGateAnalyticsPage />} />
            </Route>
          </Route>

          {/* Maintenance routes */}
          <Route element={<RoleRoute allowedRoles={[Role.MAINTENANCE]} />}>
            <Route element={<MaintenanceShell />}>
              <Route path="/maintenance/tasks" element={<MaintenanceTasksPage />} />
              <Route path="/maintenance/history" element={<MaintenanceHistoryPage />} />
              <Route path="/maintenance/faq" element={<MaintenanceFaqPage />} />
              <Route path="/maintenance/inventory" element={<MaintenanceInventoryPage />} />
              <Route path="/maintenance/assets" element={<MaintenanceAssetTrackingPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/landing" replace />} />
      </Routes>

      {/* Chatbot - visible only when authenticated */}
      {isAuthenticated && <Suspense fallback={null}><Chatbot /></Suspense>}
    </Suspense>
  );
}

function App() {
  useSmoothScroll();

  return (
    <I18nProvider>
    <BrowserRouter>
      <OfflineBanner />
      <ScrollProgress />
      <Suspense fallback={null}><CommandPalette /></Suspense>
      <Suspense fallback={null}><AccessibilityPanel /></Suspense>
      <PWAInstallPrompt />
      <PushPermissionPrompt />
      <RouteAnnouncer />
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm',
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
        richColors
        closeButton
      />
    </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
