import mongoose, { Schema, type Document } from 'mongoose';
import { GatePassStatus } from '@smarthostel/shared';

export interface IGatePass extends Document {
  leaveId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  qrToken: string;
  passCode: string;
  jti: string;
  status: GatePassStatus;
  expiresAt: Date;
  lastGateState: 'IN' | 'OUT' | 'UNKNOWN';
  createdAt: Date;
  updatedAt: Date;
}

const gatePassSchema = new Schema<IGatePass>(
  {
    leaveId: { type: Schema.Types.ObjectId, ref: 'Leave', required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    qrToken: { type: String, required: true },
    passCode: { type: String, required: true },
    jti: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: GatePassStatus.ACTIVE,
      enum: Object.values(GatePassStatus),
    },
    expiresAt: { type: Date, required: true, index: true },
    lastGateState: {
      type: String,
      default: 'IN',
      enum: ['IN', 'OUT', 'UNKNOWN'],
    },
  },
  {
    collection: 'gatePasses',
    timestamps: true,
    strict: true,
  },
);

gatePassSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

gatePassSchema.index({ studentId: 1, status: 1 });

export const GatePass = mongoose.model<IGatePass>('GatePass', gatePassSchema);
