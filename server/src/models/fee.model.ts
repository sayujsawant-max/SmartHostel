import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IFee extends Document {
  studentId: Types.ObjectId;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: string;
  semester: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    feeType: {
      type: String,
      required: true,
      enum: ['HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE'],
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['PAID', 'UNPAID', 'OVERDUE'],
    },
    semester: { type: String, required: true },
    academicYear: { type: String, required: true },
  },
  {
    collection: 'fees',
    timestamps: true,
    strict: true,
  },
);

feeSchema.index({ studentId: 1, status: 1 });

export const Fee = mongoose.model<IFee>('Fee', feeSchema);
