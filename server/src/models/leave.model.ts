import mongoose, { Schema, type Document } from 'mongoose';
import { LeaveStatus, LeaveType } from '@smarthostel/shared';

export interface ILeave extends Document {
  studentId: mongoose.Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  outLoggedAt?: Date;
  inLoggedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [LeaveType.DAY_OUTING, LeaveType.OVERNIGHT],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: LeaveStatus.PENDING,
      enum: Object.values(LeaveStatus),
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    outLoggedAt: { type: Date },
    inLoggedAt: { type: Date },
  },
  {
    collection: 'leaves',
    timestamps: true,
    strict: true,
  },
);

leaveSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

leaveSchema.index({ studentId: 1, status: 1 });

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);
