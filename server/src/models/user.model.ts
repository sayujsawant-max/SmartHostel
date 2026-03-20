import mongoose, { Schema, type Document } from 'mongoose';
import { Role, Gender, AcademicYear } from '@smarthostel/shared';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  gender?: string;
  academicYear?: string;
  block?: string;
  floor?: string;
  roomNumber?: string;
  hasConsented: boolean;
  consentedAt?: Date;
  isActive: boolean;
  refreshTokenJtis: string[];
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  googleId?: string;
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
    gender: {
      type: String,
      enum: [Gender.MALE, Gender.FEMALE],
    },
    academicYear: {
      type: String,
      enum: [AcademicYear.FIRST, AcademicYear.SECOND, AcademicYear.THIRD, AcademicYear.FOURTH],
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
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
    googleId: { type: String, sparse: true },
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
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
