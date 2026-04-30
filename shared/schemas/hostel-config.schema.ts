import { z } from 'zod';
import { HostelGender, RoomAcType } from '../constants/room-types.js';

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1e40af');

const optionalEmail = z.union([z.string().email(), z.literal('')]).optional();
const optionalUrl = z.union([z.string().url(), z.literal('')]).optional();

export const hostelInfoSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  tagline: z.string().max(200).trim().optional(),
  address: z.string().max(500).trim().optional(),
  contactEmail: optionalEmail,
  contactPhone: z.string().max(20).trim().optional(),
});

export const brandingSchema = z.object({
  primaryColor: hexColor,
  accentColor: hexColor,
  logoUrl: optionalUrl,
});

export const roomTypeConfigSchema = z.object({
  key: z.string().min(1).max(40).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, numbers, and underscores'),
  label: z.string().min(1).max(60).trim(),
  description: z.string().max(300).trim().optional(),
  acType: z.enum([RoomAcType.AC, RoomAcType.NON_AC]),
  feePerSemester: z.number().min(0),
  capacity: z.number().int().min(1).max(10),
  isActive: z.boolean(),
});

export const blockConfigSchema = z.object({
  name: z.string().min(1).max(40).trim(),
  label: z.string().max(60).trim().optional(),
  gender: z.enum([HostelGender.BOYS, HostelGender.GIRLS]),
  floors: z.number().int().min(1).max(20),
  isActive: z.boolean(),
});

export const featureFlagsSchema = z.object({
  laundry: z.boolean(),
  mess: z.boolean(),
  gatePass: z.boolean(),
  complaints: z.boolean(),
  leaves: z.boolean(),
  notices: z.boolean(),
  lostFound: z.boolean(),
  sos: z.boolean(),
  visitors: z.boolean(),
  gamification: z.boolean(),
  roomMatching: z.boolean(),
  wellness: z.boolean(),
  payments: z.boolean(),
});

export const pricingConfigSchema = z.object({
  securityDeposit: z.number().min(0),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, 'Use ISO 4217 code like INR'),
});

export const PAYMENT_PROVIDERS = ['NONE', 'RAZORPAY', 'MOCK'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const paymentsConfigSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDERS),
  enabled: z.boolean(),
  keyId: z.string().max(120).default(''),
  // Server-only — never returned by GET /hostel-config (masked to last 4 chars).
  keySecret: z.string().max(200).default(''),
});

export const hostelConfigSchema = z.object({
  hostel: hostelInfoSchema,
  branding: brandingSchema,
  roomTypes: z.array(roomTypeConfigSchema).max(20),
  blocks: z.array(blockConfigSchema).max(50),
  features: featureFlagsSchema,
  pricing: pricingConfigSchema,
  payments: paymentsConfigSchema,
});

export const updateHostelConfigSchema = z.object({
  hostel: hostelInfoSchema.partial().optional(),
  branding: brandingSchema.partial().optional(),
  roomTypes: z.array(roomTypeConfigSchema).max(20).optional(),
  blocks: z.array(blockConfigSchema).max(50).optional(),
  features: featureFlagsSchema.partial().optional(),
  pricing: pricingConfigSchema.partial().optional(),
  payments: paymentsConfigSchema.partial().optional(),
});

export type HostelInfo = z.infer<typeof hostelInfoSchema>;
export type Branding = z.infer<typeof brandingSchema>;
export type RoomTypeConfig = z.infer<typeof roomTypeConfigSchema>;
export type BlockConfig = z.infer<typeof blockConfigSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type PricingConfig = z.infer<typeof pricingConfigSchema>;
export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type HostelConfig = z.infer<typeof hostelConfigSchema>;
export type UpdateHostelConfigInput = z.infer<typeof updateHostelConfigSchema>;

export const DEFAULT_HOSTEL_CONFIG: HostelConfig = {
  hostel: {
    name: 'SmartHostel',
    tagline: 'Your home away from home',
    address: '',
    contactEmail: '',
    contactPhone: '',
  },
  branding: {
    primaryColor: '#1e40af',
    accentColor: '#f59e0b',
  },
  roomTypes: [
    { key: 'DELUXE_AC', label: 'Deluxe AC', acType: RoomAcType.AC, feePerSemester: 12000, capacity: 2, isActive: true },
    { key: 'DELUXE_NON_AC', label: 'Deluxe Non-AC', acType: RoomAcType.NON_AC, feePerSemester: 9000, capacity: 2, isActive: true },
    { key: 'NORMAL_AC', label: 'Normal AC', acType: RoomAcType.AC, feePerSemester: 8500, capacity: 3, isActive: true },
    { key: 'NORMAL_NON_AC', label: 'Normal Non-AC', acType: RoomAcType.NON_AC, feePerSemester: 6500, capacity: 3, isActive: true },
  ],
  blocks: [
    { name: 'A', label: 'Block A', gender: HostelGender.BOYS, floors: 4, isActive: true },
    { name: 'B', label: 'Block B', gender: HostelGender.GIRLS, floors: 4, isActive: true },
  ],
  features: {
    laundry: true,
    mess: true,
    gatePass: true,
    complaints: true,
    leaves: true,
    notices: true,
    lostFound: true,
    sos: true,
    visitors: true,
    gamification: true,
    roomMatching: true,
    wellness: true,
    payments: true,
  },
  pricing: {
    securityDeposit: 5000,
    currency: 'INR',
  },
  payments: {
    provider: 'NONE',
    enabled: false,
    keyId: '',
    keySecret: '',
  },
};
