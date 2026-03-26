import mongoose, { Schema, type Document } from 'mongoose';

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IInspection extends Document {
  roomNumber: string;
  block: string;
  floor: string;
  inspectedBy: mongoose.Types.ObjectId;
  date: Date;
  status: InspectionStatus;
  score: number;
  remarks: string;
  issues: string[];
  createdAt: Date;
  updatedAt: Date;
}

const inspectionSchema = new Schema<IInspection>(
  {
    roomNumber: { type: String, required: true, trim: true },
    block: { type: String, required: true, trim: true },
    floor: { type: String, default: '1' },
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: Object.values(InspectionStatus),
      default: InspectionStatus.COMPLETED,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    remarks: { type: String, default: '', trim: true },
    issues: [{ type: String, trim: true }],
  },
  {
    collection: 'inspections',
    timestamps: true,
    strict: true,
  },
);

inspectionSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

inspectionSchema.index({ block: 1, roomNumber: 1 });
inspectionSchema.index({ status: 1, date: -1 });

export const Inspection = mongoose.model<IInspection>('Inspection', inspectionSchema);
