import mongoose, { Schema, type Document } from 'mongoose';

export enum InventoryCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  CLEANING = 'CLEANING',
  HARDWARE = 'HARDWARE',
  SAFETY = 'SAFETY',
  PAINTING = 'PAINTING',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface IInventoryItem extends Document {
  name: string;
  category: InventoryCategory;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  lastRestocked: Date | null;
  status: InventoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(InventoryCategory),
    },
    quantity: { type: Number, required: true, min: 0 },
    minStock: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    lastRestocked: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK,
    },
  },
  {
    collection: 'inventoryItems',
    timestamps: true,
    strict: true,
  },
);

inventoryItemSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ category: 1 });

/** Compute status from quantity and minStock before saving. */
inventoryItemSchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = InventoryStatus.OUT_OF_STOCK;
  } else if (this.quantity <= this.minStock) {
    this.status = InventoryStatus.LOW_STOCK;
  } else {
    this.status = InventoryStatus.IN_STOCK;
  }
  next();
});

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
