export const GatePassStatus = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type GatePassStatus = (typeof GatePassStatus)[keyof typeof GatePassStatus];
