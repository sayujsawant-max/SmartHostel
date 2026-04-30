import mongoose, { Schema, type Document } from 'mongoose';

export type ResourceBookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface IResourceBooking extends Document {
  resourceKey: string;
  userId: mongoose.Types.ObjectId;
  date: Date;
  slotIndex: number;
  startTime: string;
  endTime: string;
  status: ResourceBookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const resourceBookingSchema = new Schema<IResourceBooking>(
  {
    resourceKey: { type: String, required: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    slotIndex: { type: Number, required: true, min: 0 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED',
    },
  },
  { collection: 'resource_bookings', timestamps: true, strict: true },
);

resourceBookingSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

// Capacity counting: filter on (resourceKey, date, slotIndex, status='CONFIRMED')
resourceBookingSchema.index({ resourceKey: 1, date: 1, slotIndex: 1, status: 1 });
// User's bookings
resourceBookingSchema.index({ userId: 1, date: 1 });
// Prevent the same user booking the same slot twice (only when CONFIRMED — partial index)
resourceBookingSchema.index(
  { resourceKey: 1, userId: 1, date: 1, slotIndex: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } },
);

export const ResourceBooking = mongoose.model<IResourceBooking>(
  'ResourceBooking',
  resourceBookingSchema,
);
