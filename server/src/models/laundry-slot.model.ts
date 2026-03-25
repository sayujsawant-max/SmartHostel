import mongoose, { Schema, type Document } from 'mongoose';

export interface ILaundrySlot extends Document {
  machineNumber: number;
  date: Date;
  timeSlot: string;
  bookedBy: mongoose.Types.ObjectId | null;
  status: 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const laundrySlotSchema = new Schema<ILaundrySlot>(
  {
    machineNumber: { type: Number, required: true, min: 1, max: 5 },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'BOOKED', 'IN_USE', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true, strict: true },
);

laundrySlotSchema.index({ machineNumber: 1, date: 1, timeSlot: 1 }, { unique: true });
laundrySlotSchema.index({ bookedBy: 1, status: 1 });
laundrySlotSchema.index({ date: 1, status: 1 });

export const LaundrySlot = mongoose.model<ILaundrySlot>('LaundrySlot', laundrySlotSchema);
