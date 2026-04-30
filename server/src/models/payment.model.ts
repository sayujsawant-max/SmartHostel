import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface IPayment extends Document {
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'RAZORPAY' | 'MOCK';
  providerOrderId: string;
  providerPaymentId?: string;
  signatureVerified?: boolean;
  paidAt?: Date;
  method?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    feeId: { type: Schema.Types.ObjectId, ref: 'Fee', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    provider: { type: String, required: true, enum: ['RAZORPAY', 'MOCK'] },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String },
    signatureVerified: { type: Boolean },
    paidAt: { type: Date },
    method: { type: String },
    failureReason: { type: String },
  },
  { collection: 'payments', timestamps: true, strict: true },
);

paymentSchema.index({ studentId: 1, status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
