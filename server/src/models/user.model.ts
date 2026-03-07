import mongoose, { Schema, type Document } from 'mongoose';
import { Role } from '@smarthostel/shared';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  block?: string;
  floor?: string;
  roomNumber?: string;
  hasConsented: boolean;
  consentedAt?: Date;
  isActive: boolean;
  refreshTokenJtis: string[];
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [Role.STUDENT, Role.WARDEN_ADMIN, Role.GUARD, Role.MAINTENANCE],
    },
    block: { type: String },
    floor: { type: String },
    roomNumber: { type: String },
    hasConsented: { type: Boolean, default: false },
    consentedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    refreshTokenJtis: { type: [String], default: [], select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  {
    collection: 'users',
    timestamps: true,
    strict: true,
  },
);

userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    delete ret.refreshTokenJtis;
    delete ret.failedLoginAttempts;
    delete ret.lockedUntil;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
