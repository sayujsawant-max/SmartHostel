import mongoose, { Schema, type Document } from 'mongoose';
import { ComplaintStatus, ComplaintCategory, ComplaintPriority } from '@smarthostel/shared';

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  description: string;
  photoUrl: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  dueAt: Date;
  assigneeId: mongoose.Types.ObjectId | null;
  resolutionNotes: string | null;
  escalatedAt: Date | null;
  escalationLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(ComplaintCategory),
    },
    description: { type: String, required: true },
    photoUrl: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(ComplaintPriority),
    },
    dueAt: { type: Date, required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    resolutionNotes: { type: String, default: null },
    escalatedAt: { type: Date, default: null },
    escalationLevel: { type: Number, default: 0 },
  },
  {
    collection: 'complaints',
    timestamps: true,
    strict: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
complaintSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

complaintSchema.index({ status: 1, dueAt: 1 });
complaintSchema.index({ assigneeId: 1, status: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
