import mongoose, { Schema, type Document } from 'mongoose';

export interface IGateScan extends Document {
  leaveId: mongoose.Types.ObjectId | null;
  gatePassId: mongoose.Types.ObjectId | null;
  guardId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId | null;
  verdict: 'ALLOW' | 'DENY' | 'OFFLINE';
  scanResult: string;
  method: 'QR' | 'PASSCODE';
  directionDetected: 'ENTRY' | 'EXIT' | null;
  directionUsed: 'ENTRY' | 'EXIT' | null;
  directionSource: 'AUTO' | 'MANUAL_ONE_SHOT';
  lastGateStateBeforeScan: 'IN' | 'OUT' | 'UNKNOWN';
  latencyMs: number;
  timeoutTriggered: boolean;
  offlineStatus: 'OFFLINE_PRESENTED' | 'OFFLINE_DENY_LOGGED' | 'OFFLINE_OVERRIDE' | null;
  reconcileStatus: 'PENDING' | 'SUCCESS' | 'FAIL' | null;
  reconcileErrorCode: string | null;
  reconciledAt: Date | null;
  scanAttemptId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const gateScanSchema = new Schema<IGateScan>(
  {
    leaveId: { type: Schema.Types.ObjectId, ref: 'Leave', default: null },
    gatePassId: { type: Schema.Types.ObjectId, ref: 'GatePass', default: null },
    guardId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verdict: { type: String, required: true, enum: ['ALLOW', 'DENY', 'OFFLINE'] },
    scanResult: { type: String, required: true },
    method: { type: String, required: true, enum: ['QR', 'PASSCODE'] },
    directionDetected: { type: String, default: null, enum: ['ENTRY', 'EXIT', null] },
    directionUsed: { type: String, default: null, enum: ['ENTRY', 'EXIT', null] },
    directionSource: { type: String, default: 'AUTO', enum: ['AUTO', 'MANUAL_ONE_SHOT'] },
    lastGateStateBeforeScan: { type: String, default: 'UNKNOWN', enum: ['IN', 'OUT', 'UNKNOWN'] },
    latencyMs: { type: Number, required: true },
    timeoutTriggered: { type: Boolean, default: false },
    offlineStatus: {
      type: String,
      default: null,
      enum: ['OFFLINE_PRESENTED', 'OFFLINE_DENY_LOGGED', 'OFFLINE_OVERRIDE', null],
    },
    reconcileStatus: { type: String, default: null, enum: ['PENDING', 'SUCCESS', 'FAIL', null] },
    reconcileErrorCode: { type: String, default: null },
    reconciledAt: { type: Date, default: null },
    scanAttemptId: { type: String, default: null, sparse: true, unique: true },
  },
  {
    collection: 'gateScans',
    timestamps: true,
    strict: true,
  },
);

gateScanSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

gateScanSchema.index({ leaveId: 1 });
gateScanSchema.index({ createdAt: -1 });

export const GateScan = mongoose.model<IGateScan>('GateScan', gateScanSchema);
