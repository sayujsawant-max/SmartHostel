export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  SCANNED_OUT: 'SCANNED_OUT',
  SCANNED_IN: 'SCANNED_IN',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  CORRECTED: 'CORRECTED',
} as const;

export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];
