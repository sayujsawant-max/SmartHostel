import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import ConsentModal from '@components/features/auth/ConsentModal';

export default function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (user && !user.hasConsented) {
    return <ConsentModal />;
  }

  return <Outlet />;
}
