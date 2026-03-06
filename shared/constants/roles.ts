export const Role = {
  STUDENT: 'STUDENT',
  WARDEN_ADMIN: 'WARDEN_ADMIN',
  GUARD: 'GUARD',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
