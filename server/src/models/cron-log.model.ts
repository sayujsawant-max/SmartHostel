import mongoose, { Schema, type Document } from 'mongoose';

export interface ICronLog extends Document {
  jobName: string;
  result: 'SUCCESS' | 'FAIL';
  complaintsReminded: number;
  complaintsEscalated: number;
  errorMessages: string[];
  createdAt: Date;
}

const cronLogSchema = new Schema<ICronLog>(
  {
    jobName: { type: String, required: true, index: true },
    result: { type: String, required: true, enum: ['SUCCESS', 'FAIL'] },
    complaintsReminded: { type: Number, default: 0 },
    complaintsEscalated: { type: Number, default: 0 },
    errorMessages: { type: [String], default: [] },
  },
  {
    collection: 'cronLogs',
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
cronLogSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const CronLog = mongoose.model<ICronLog>('CronLog', cronLogSchema);
