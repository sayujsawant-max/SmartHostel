import mongoose, { Schema, type Document } from 'mongoose';

export interface IFaqEntry extends Document {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqEntrySchema = new Schema<IFaqEntry>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    keywords: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'faqEntries',
    timestamps: true,
    strict: true,
  },
);

faqEntrySchema.index({ category: 1, isActive: 1 });

export const FaqEntry = mongoose.model<IFaqEntry>('FaqEntry', faqEntrySchema);
