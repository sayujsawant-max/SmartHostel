import mongoose, { Schema, type Document } from 'mongoose';
import { RoomAcType, HostelGender } from '@smarthostel/shared';

export interface IRoom extends Document {
  block: string;
  floor: string;
  roomNumber: string;
  hostelGender: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    block: { type: String, required: true, trim: true },
    floor: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    hostelGender: {
      type: String,
      required: true,
      enum: [HostelGender.BOYS, HostelGender.GIRLS],
    },
    roomType: { type: String, required: true, trim: true },
    acType: {
      type: String,
      required: true,
      enum: [RoomAcType.AC, RoomAcType.NON_AC],
    },
    totalBeds: { type: Number, required: true, min: 1 },
    occupiedBeds: { type: Number, default: 0, min: 0 },
    feePerSemester: { type: Number, required: true, min: 0 },
    photos: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'rooms',
    timestamps: true,
    strict: true,
  },
);

roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hostelGender: 1, roomType: 1, acType: 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema);
