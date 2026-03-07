import mongoose, { Schema, type Document } from 'mongoose';

export interface ISos extends Document {
  studentId: mongoose.Types.ObjectId;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sosSchema = new Schema<ISos>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, default: 'Emergency SOS activated' },
    status: { type: String, required: true, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], default: 'ACTIVE' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { collection: 'sos_alerts', timestamps: true, strict: true },
);

sosSchema.index({ status: 1, createdAt: -1 });

export const Sos = mongoose.model<ISos>('Sos', sosSchema);
