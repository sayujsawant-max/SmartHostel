import mongoose, { Schema, type Document } from 'mongoose';

export interface IMessMenu extends Document {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  isActive: boolean;
  ratings: { studentId: mongoose.Types.ObjectId; meal: string; rating: 'up' | 'down' }[];
  createdAt: Date;
  updatedAt: Date;
}

const messMenuSchema = new Schema<IMessMenu>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    breakfast: { type: String, required: true, trim: true },
    lunch: { type: String, required: true, trim: true },
    snacks: { type: String, required: true, trim: true },
    dinner: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    ratings: [{
      studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      meal: { type: String, required: true, enum: ['breakfast', 'lunch', 'snacks', 'dinner'] },
      rating: { type: String, required: true, enum: ['up', 'down'] },
    }],
  },
  { collection: 'mess_menus', timestamps: true, strict: true },
);

messMenuSchema.index({ dayOfWeek: 1 }, { unique: true });

export const MessMenu = mongoose.model<IMessMenu>('MessMenu', messMenuSchema);
