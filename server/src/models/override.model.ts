import mongoose, { Schema, type Document } from 'mongoose';

export interface IOverride extends Document {
  leaveId: mongoose.Types.ObjectId | null;
  gatePassId: mongoose.Types.ObjectId | null;
  gateScanId: mongoose.Types.ObjectId | null;
  guardId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId | null;
  reason: string;
  note: string;
  method: 'MANUAL_OVERRIDE' | 'OFFLINE_OVERRIDE';
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  correlationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const overrideSchema = new Schema<IOverride>(
  {
    leaveId: { type: Schema.Types.ObjectId, ref: 'Leave', default: null },
    gatePassId: { type: Schema.Types.ObjectId, ref: 'GatePass', default: null },
    gateScanId: { type: Schema.Types.ObjectId, ref: 'GateScan', default: null },
    guardId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, required: true },
    note: { type: String, required: true, minlength: 5 },
    method: { type: String, required: true, enum: ['MANUAL_OVERRIDE', 'OFFLINE_OVERRIDE'] },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    correlationId: { type: String, default: null },
  },
  {
    collection: 'overrides',
    timestamps: true,
    strict: true,
  },
);

overrideSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

overrideSchema.index({ createdAt: -1 });
overrideSchema.index({ reviewedAt: 1 });

export const Override = mongoose.model<IOverride>('Override', overrideSchema);
