import mongoose, { Schema, type Document } from 'mongoose';
import { NotificationType } from '@smarthostel/shared';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
    },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    collection: 'notifications',
    timestamps: true,
    strict: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
notificationSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
