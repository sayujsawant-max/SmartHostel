import { Role } from '@smarthostel/shared';

const roleHomePaths: Record<Role, string> = {
  [Role.STUDENT]: '/student/status',
  [Role.WARDEN_ADMIN]: '/warden/dashboard',
  [Role.GUARD]: '/guard/scan',
  [Role.MAINTENANCE]: '/maintenance/tasks',
};

export function getRoleHomePath(role: Role): string {
  return roleHomePaths[role] ?? '/login';
}
