import mongoose, { Schema, type Document } from 'mongoose';
import { HostelGender, RoomAcType } from '@smarthostel/shared';
import type {
  HostelConfig,
  HostelInfo,
  Branding,
  RoomTypeConfig,
  BlockConfig,
  FeatureFlags,
  PricingConfig,
  PaymentsConfig,
} from '@smarthostel/shared';

export const HOSTEL_CONFIG_SINGLETON_KEY = 'default';

export interface IHostelConfig extends Document, HostelConfig {
  key: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const hostelInfoSubSchema = new Schema<HostelInfo>(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    address: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { _id: false },
);

const brandingSubSchema = new Schema<Branding>(
  {
    primaryColor: { type: String, required: true },
    accentColor: { type: String, required: true },
    logoUrl: { type: String },
  },
  { _id: false },
);

const roomTypeSubSchema = new Schema<RoomTypeConfig>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    acType: { type: String, required: true, enum: [RoomAcType.AC, RoomAcType.NON_AC] },
    feePerSemester: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1, max: 10 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const blockSubSchema = new Schema<BlockConfig>(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    gender: { type: String, required: true, enum: [HostelGender.BOYS, HostelGender.GIRLS] },
    floors: { type: Number, required: true, min: 1, max: 20 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const featureFlagsSubSchema = new Schema<FeatureFlags>(
  {
    laundry: { type: Boolean, required: true, default: true },
    mess: { type: Boolean, required: true, default: true },
    gatePass: { type: Boolean, required: true, default: true },
    complaints: { type: Boolean, required: true, default: true },
    leaves: { type: Boolean, required: true, default: true },
    notices: { type: Boolean, required: true, default: true },
    lostFound: { type: Boolean, required: true, default: true },
    sos: { type: Boolean, required: true, default: true },
    visitors: { type: Boolean, required: true, default: true },
    gamification: { type: Boolean, required: true, default: true },
    roomMatching: { type: Boolean, required: true, default: true },
    wellness: { type: Boolean, required: true, default: true },
    payments: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const pricingSubSchema = new Schema<PricingConfig>(
  {
    securityDeposit: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
  },
  { _id: false },
);

const paymentsSubSchema = new Schema<PaymentsConfig>(
  {
    provider: {
      type: String,
      required: true,
      enum: ['NONE', 'RAZORPAY', 'MOCK'],
      default: 'NONE',
    },
    enabled: { type: Boolean, required: true, default: false },
    keyId: { type: String, default: '' },
    keySecret: { type: String, default: '', select: false },
  },
  { _id: false },
);

const hostelConfigSchema = new Schema<IHostelConfig>(
  {
    key: { type: String, required: true, unique: true, default: HOSTEL_CONFIG_SINGLETON_KEY },
    hostel: { type: hostelInfoSubSchema, required: true },
    branding: { type: brandingSubSchema, required: true },
    roomTypes: { type: [roomTypeSubSchema], default: [] },
    blocks: { type: [blockSubSchema], default: [] },
    features: { type: featureFlagsSubSchema, required: true },
    pricing: { type: pricingSubSchema, required: true },
    payments: {
      type: paymentsSubSchema,
      required: true,
      default: () => ({ provider: 'NONE', enabled: false, keyId: '', keySecret: '' }),
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'hostel_configs',
    timestamps: true,
    strict: true,
  },
);

hostelConfigSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    if (ret.payments && typeof ret.payments === 'object') {
      delete ret.payments.keySecret;
    }
    return ret;
  },
});

hostelConfigSchema.set('toObject', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    if (ret.payments && typeof ret.payments === 'object') {
      delete ret.payments.keySecret;
    }
    return ret;
  },
});

export const HostelConfigModel = mongoose.model<IHostelConfig>('HostelConfig', hostelConfigSchema);
