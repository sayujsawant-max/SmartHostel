import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IConsent extends Document {
  userId: Types.ObjectId;
  version: string;
  consentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const consentSchema = new Schema<IConsent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: String, required: true, trim: true },
    consentedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: 'consents',
    timestamps: true,
    strict: true,
  },
);

consentSchema.index({ userId: 1 });

export const Consent = mongoose.model<IConsent>('Consent', consentSchema);
