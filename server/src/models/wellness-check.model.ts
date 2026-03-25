import mongoose, { Schema, type Document } from 'mongoose';

export enum StressLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IWellnessCheck extends Document {
  studentId: mongoose.Types.ObjectId;
  checkedBy: mongoose.Types.ObjectId;
  moodScore: number;
  stressLevel: StressLevel;
  notes: string | null;
  flags: string[];
  followUpRequired: boolean;
  followUpDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const wellnessCheckSchema = new Schema<IWellnessCheck>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moodScore: { type: Number, required: true, min: 1, max: 10 },
    stressLevel: {
      type: String,
      required: true,
      enum: Object.values(StressLevel),
    },
    notes: { type: String, default: null },
    flags: { type: [String], default: [] },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date, default: null },
  },
  {
    collection: 'wellness_checks',
    timestamps: true,
    strict: true,
  },
);

wellnessCheckSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

wellnessCheckSchema.index({ studentId: 1, createdAt: -1 });
wellnessCheckSchema.index({ stressLevel: 1 });

export const WellnessCheck = mongoose.model<IWellnessCheck>('WellnessCheck', wellnessCheckSchema);
