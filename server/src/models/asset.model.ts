import mongoose, { Schema, type Document } from 'mongoose';

export enum AssetCategory {
  FURNITURE = 'FURNITURE',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  HVAC = 'HVAC',
  IT_EQUIPMENT = 'IT_EQUIPMENT',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  WORKING = 'WORKING',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  UNDER_REPAIR = 'UNDER_REPAIR',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface IAsset extends Document {
  name: string;
  assetTag: string;
  category: AssetCategory;
  location: {
    block: string;
    floor: string;
    room: string;
  };
  status: AssetStatus;
  lastMaintenanceDate: Date | null;
  assignedTo: mongoose.Types.ObjectId | null;
  qrCode: string;
  purchaseDate: Date;
  warrantyExpiry: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true },
    assetTag: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(AssetCategory),
    },
    location: {
      block: { type: String, required: true, trim: true },
      floor: { type: String, required: true, trim: true },
      room: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(AssetStatus),
      default: AssetStatus.WORKING,
    },
    lastMaintenanceDate: { type: Date, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    qrCode: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    warrantyExpiry: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  {
    collection: 'assets',
    timestamps: true,
    strict: true,
  },
);

assetSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

assetSchema.index({ assetTag: 1 });
assetSchema.index({ status: 1 });

export const Asset = mongoose.model<IAsset>('Asset', assetSchema);
