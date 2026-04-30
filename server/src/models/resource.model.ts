import mongoose, { Schema, type Document } from 'mongoose';
import type { ResourceSlotTemplate } from '@smarthostel/shared';

export interface IResource extends Document {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  slots: ResourceSlotTemplate[];
  capacity: number;
  allowedRoles: string[];
  bookingWindowDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const slotTemplateSchema = new Schema<ResourceSlotTemplate>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 480 },
  },
  { _id: false },
);

const resourceSchema = new Schema<IResource>(
  {
    key: { type: String, required: true, unique: true, trim: true, uppercase: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    slots: { type: [slotTemplateSchema], default: [] },
    capacity: { type: Number, required: true, min: 1, max: 500 },
    allowedRoles: {
      type: [String],
      enum: ['STUDENT', 'WARDEN_ADMIN', 'GUARD', 'MAINTENANCE'],
      default: ['STUDENT'],
    },
    bookingWindowDays: { type: Number, required: true, min: 1, max: 90, default: 14 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { collection: 'resources', timestamps: true, strict: true },
);

resourceSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

resourceSchema.index({ isActive: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
