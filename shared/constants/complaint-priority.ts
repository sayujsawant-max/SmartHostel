export const ComplaintPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type ComplaintPriority = (typeof ComplaintPriority)[keyof typeof ComplaintPriority];
