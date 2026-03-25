import mongoose, { Schema, type Document } from 'mongoose';

export interface ILostFound extends Document {
  postedBy: mongoose.Types.ObjectId;
  type: 'LOST' | 'FOUND';
  itemName: string;
  description: string;
  category: 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'ID_CARDS' | 'KEYS' | 'ACCESSORIES' | 'OTHER';
  locationFound: string;
  dateOccurred: Date;
  status: 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'EXPIRED';
  claimedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  contactInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lostFoundSchema = new Schema<ILostFound>(
  {
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['LOST', 'FOUND'] },
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['ELECTRONICS', 'CLOTHING', 'BOOKS', 'ID_CARDS', 'KEYS', 'ACCESSORIES', 'OTHER'],
      default: 'OTHER',
    },
    locationFound: { type: String },
    dateOccurred: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'CLAIMED', 'RETURNED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    claimedAt: { type: Date },
    contactInfo: { type: String },
  },
  { collection: 'lost_found_posts', timestamps: true, strict: true },
);

lostFoundSchema.index({ type: 1, status: 1, createdAt: -1 });
lostFoundSchema.index({ status: 1, type: 1 });

export const LostFound = mongoose.model<ILostFound>('LostFound', lostFoundSchema);
