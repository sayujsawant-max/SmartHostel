import mongoose, { Schema, type Document } from 'mongoose';

export interface IComplaintEvent extends Document {
  complaintId: mongoose.Types.ObjectId;
  eventType: string;
  actorId: mongoose.Types.ObjectId | null;
  actorRole: string | null;
  note: string | null;
  createdAt: Date;
}

const complaintEventSchema = new Schema<IComplaintEvent>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
    eventType: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null },
    note: { type: String, default: null },
  },
  {
    collection: 'complaintEvents',
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
complaintEventSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const ComplaintEvent = mongoose.model<IComplaintEvent>('ComplaintEvent', complaintEventSchema);
