import mongoose, { Schema } from 'mongoose';

export interface INotificationPref extends Document {
  userId: mongoose.Types.ObjectId;
  leaveUpdates: boolean;
  complaintUpdates: boolean;
  visitorUpdates: boolean;
  notices: boolean;
  sosAlerts: boolean;
  feeReminders: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPrefSchema = new Schema<INotificationPref>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    leaveUpdates: { type: Boolean, default: true },
    complaintUpdates: { type: Boolean, default: true },
    visitorUpdates: { type: Boolean, default: true },
    notices: { type: Boolean, default: true },
    sosAlerts: { type: Boolean, default: true },
    feeReminders: { type: Boolean, default: true },
  },
  { collection: 'notificationPrefs', timestamps: true },
);

notificationPrefSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const NotificationPref = mongoose.model<INotificationPref>('NotificationPref', notificationPrefSchema);
