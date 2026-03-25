import mongoose, { Schema, type Document } from 'mongoose';

export enum WidgetType {
  OCCUPANCY = 'OCCUPANCY',
  COMPLAINTS = 'COMPLAINTS',
  NOTICES = 'NOTICES',
  FEES = 'FEES',
  LEAVES = 'LEAVES',
  MAINTENANCE = 'MAINTENANCE',
  VISITORS = 'VISITORS',
  WELLNESS = 'WELLNESS',
}

export interface IDashboardWidget extends Document {
  userId: mongoose.Types.ObjectId;
  widgetType: WidgetType;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const dashboardWidgetSchema = new Schema<IDashboardWidget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    widgetType: {
      type: String,
      required: true,
      enum: Object.values(WidgetType),
    },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
      w: { type: Number, required: true, default: 1 },
      h: { type: Number, required: true, default: 1 },
    },
    isVisible: { type: Boolean, default: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'dashboard_widgets',
    timestamps: true,
    strict: true,
  },
);

dashboardWidgetSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

dashboardWidgetSchema.index({ userId: 1 });

export const DashboardWidget = mongoose.model<IDashboardWidget>('DashboardWidget', dashboardWidgetSchema);
