import mongoose, { Schema, type Document } from 'mongoose';

export interface INotice extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  target: 'ALL' | 'BLOCK' | 'FLOOR';
  targetBlock?: string;
  targetFloor?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    target: { type: String, required: true, enum: ['ALL', 'BLOCK', 'FLOOR'] },
    targetBlock: { type: String },
    targetFloor: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'notices',
    timestamps: true,
    strict: true,
  },
);

noticeSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: Document, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

noticeSchema.index({ isActive: 1, createdAt: -1 });

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
