export const ComplaintCategory = {
  PLUMBING: 'PLUMBING',
  ELECTRICAL: 'ELECTRICAL',
  FURNITURE: 'FURNITURE',
  CLEANING: 'CLEANING',
  PEST_CONTROL: 'PEST_CONTROL',
  INTERNET: 'INTERNET',
  GENERAL: 'GENERAL',
} as const;

export type ComplaintCategory = (typeof ComplaintCategory)[keyof typeof ComplaintCategory];
