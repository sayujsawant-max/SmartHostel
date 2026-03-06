import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import LoginPage from '@pages/LoginPage';

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center p-8 rounded-xl bg-[hsl(var(--card))] shadow-lg border border-[hsl(var(--border))]">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">SmartHostel</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Welcome, {user?.name} ({user?.role})
        </p>
        <button
          onClick={() => logout()}
          className="mt-4 px-4 py-2 rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] font-medium hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading...</div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <DashboardPlaceholder /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
