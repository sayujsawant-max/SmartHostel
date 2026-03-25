import mongoose, { Schema, type Document } from 'mongoose';

export type VisitorStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'EXPIRED';

export interface IVisitor extends Document {
  studentId: mongoose.Types.ObjectId;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  purpose: string;
  expectedDate: Date;
  expectedTime: string;
  status: VisitorStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitorName: { type: String, required: true },
    visitorPhone: { type: String, required: true },
    relationship: { type: String, default: 'Other' },
    purpose: { type: String, required: true },
    expectedDate: { type: Date, required: true },
    expectedTime: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      default: 'PENDING' as const,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED'],
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
  },
  {
    collection: 'visitors',
    timestamps: true,
    strict: true,
  },
);

visitorSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

visitorSchema.index({ studentId: 1, status: 1 });
visitorSchema.index({ expectedDate: 1, status: 1 });
visitorSchema.index({ status: 1, expectedDate: 1 });

export const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
