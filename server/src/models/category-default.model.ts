import mongoose, { Schema, type Document } from 'mongoose';

export interface ICategoryDefault extends Document {
  category: string;
  defaultPriority: string;
  slaHours: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const categoryDefaultSchema = new Schema<ICategoryDefault>(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'PLUMBING',
        'ELECTRICAL',
        'CARPENTRY',
        'CLEANING',
        'GENERAL',
        'PEST_CONTROL',
        'INTERNET',
        'OTHER',
      ],
    },
    defaultPriority: {
      type: String,
      required: true,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'],
    },
    slaHours: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
  },
  {
    collection: 'categoryDefaults',
    timestamps: true,
    strict: true,
  },
);

categoryDefaultSchema.index({ category: 1 }, { unique: true });

export const CategoryDefault = mongoose.model<ICategoryDefault>(
  'CategoryDefault',
  categoryDefaultSchema,
);
