import { Role } from '@smarthostel/shared';
import type { Role as RoleType } from '@smarthostel/shared';
import { AppError } from '@utils/app-error.js';

interface AuthUser {
  _id: string;
  role: RoleType;
}

type ResourceType = 'ownedByStudent' | 'assignedToMaintenance';

/**
 * Builds a MongoDB query filter based on user role and resource type.
 * Enforces data visibility boundaries per the RBAC matrix:
 *
 * - STUDENT: can only see their own data (studentId filter)
 * - WARDEN_ADMIN: full access (no filter)
 * - MAINTENANCE: can see own assigned complaints only
 * - GUARD: blocked from complaints and student data
 */
export function buildVisibilityFilter(
  user: AuthUser,
  resource: ResourceType,
): Record<string, unknown> {
  switch (resource) {
    case 'ownedByStudent': {
      if (user.role === Role.WARDEN_ADMIN) return {};
      if (user.role === Role.STUDENT) return { studentId: user._id };
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }

    case 'assignedToMaintenance': {
      if (user.role === Role.WARDEN_ADMIN) return {};
      if (user.role === Role.STUDENT) return { studentId: user._id };
      if (user.role === Role.MAINTENANCE) return { assignedTo: user._id };
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }

    default: {
      // Exhaustive check — should never reach here
      const _exhaustive: never = resource;
      throw new AppError('INTERNAL_ERROR', `Unknown resource type: ${_exhaustive}`, 500);
    }
  }
}

/**
 * Merges a base query with a visibility filter.
 * Use this to scope any Mongoose query with role-based restrictions.
 *
 * @param baseQuery - The original query conditions
 * @param visibilityFilter - The filter from buildVisibilityFilter
 * @returns Merged query object
 */
export function scopeQuery(
  baseQuery: Record<string, unknown>,
  visibilityFilter: Record<string, unknown>,
): Record<string, unknown> {
  return { ...baseQuery, ...visibilityFilter };
}
