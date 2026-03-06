export const LeaveType = {
  DAY_OUTING: 'DAY_OUTING',
  OVERNIGHT: 'OVERNIGHT',
} as const;

export type LeaveType = (typeof LeaveType)[keyof typeof LeaveType];
