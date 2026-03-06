import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { getRoleHomePath } from '@utils/role-home';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
