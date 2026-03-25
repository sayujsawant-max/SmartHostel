import mongoose, { Schema, type Document } from 'mongoose';

export enum EmergencyType {
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  SECURITY = 'SECURITY',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  LOCKDOWN = 'LOCKDOWN',
  OTHER = 'OTHER',
}

export enum EmergencySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum EmergencyTargetScope {
  ALL = 'ALL',
  BLOCK = 'BLOCK',
  FLOOR = 'FLOOR',
}

export enum EmergencyAlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export interface IEmergencyAlert extends Document {
  type: EmergencyType;
  severity: EmergencySeverity;
  title: string;
  description: string;
  targetScope: EmergencyTargetScope;
  targetValue: string | null;
  createdBy: mongoose.Types.ObjectId;
  status: EmergencyAlertStatus;
  resolvedAt: Date | null;
  resolvedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(EmergencyType),
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(EmergencySeverity),
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    targetScope: {
      type: String,
      required: true,
      enum: Object.values(EmergencyTargetScope),
    },
    targetValue: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(EmergencyAlertStatus),
      default: EmergencyAlertStatus.ACTIVE,
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    collection: 'emergency_alerts',
    timestamps: true,
    strict: true,
  },
);

emergencyAlertSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

emergencyAlertSchema.index({ status: 1, severity: -1 });

export const EmergencyAlert = mongoose.model<IEmergencyAlert>('EmergencyAlert', emergencyAlertSchema);
