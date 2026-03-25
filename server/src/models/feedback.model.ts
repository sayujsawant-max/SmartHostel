import mongoose, { Schema, type Document } from 'mongoose';

export enum FeedbackCategory {
  MESS = 'MESS',
  LAUNDRY = 'LAUNDRY',
  ROOMS = 'ROOMS',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL',
}

export interface IFeedback extends Document {
  studentId: mongoose.Types.ObjectId;
  category: FeedbackCategory;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(FeedbackCategory),
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    isAnonymous: { type: Boolean, default: false },
  },
  {
    collection: 'feedbacks',
    timestamps: true,
    strict: true,
  },
);

feedbackSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

feedbackSchema.index({ category: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
