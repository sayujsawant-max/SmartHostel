import type { ComplaintCategory } from './complaint-category.js';
import type { ComplaintPriority } from './complaint-priority.js';

export interface SlaCategoryDefault {
  priority: ComplaintPriority;
  slaHours: number;
}

export const SLA_HOURS_BY_PRIORITY: Record<ComplaintPriority, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 12,
};

export const SLA_CATEGORY_DEFAULTS: Record<ComplaintCategory, SlaCategoryDefault> = {
  PLUMBING: { priority: 'HIGH', slaHours: 24 },
  ELECTRICAL: { priority: 'CRITICAL', slaHours: 12 },
  FURNITURE: { priority: 'MEDIUM', slaHours: 48 },
  CLEANING: { priority: 'LOW', slaHours: 72 },
  PEST_CONTROL: { priority: 'MEDIUM', slaHours: 48 },
  INTERNET: { priority: 'HIGH', slaHours: 24 },
  GENERAL: { priority: 'MEDIUM', slaHours: 48 },
};
