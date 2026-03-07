import mongoose, { Schema, type Document } from 'mongoose';

export interface IRoomChange extends Document {
  studentId: mongoose.Types.ObjectId;
  currentRoomId: mongoose.Types.ObjectId;
  requestedRoomId: mongoose.Types.ObjectId;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roomChangeSchema = new Schema<IRoomChange>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentRoomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    requestedRoomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: 'PENDING',
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    completedAt: { type: Date },
  },
  {
    collection: 'roomchanges',
    timestamps: true,
    strict: true,
  },
);

roomChangeSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

roomChangeSchema.index({ studentId: 1, status: 1 });

export const RoomChange = mongoose.model<IRoomChange>('RoomChange', roomChangeSchema);
