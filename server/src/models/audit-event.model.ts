import mongoose, { Schema, type Document } from 'mongoose';

export interface IAuditEvent extends Document {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  eventType: string;
  actorRole: string;
  actorId: mongoose.Types.ObjectId | null;
  metadata: Record<string, unknown>;
  correlationId: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    eventType: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    correlationId: { type: String, required: true, index: true },
  },
  {
    collection: 'auditEvents',
    timestamps: true,
    strict: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
auditEventSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

auditEventSchema.index({ entityType: 1, entityId: 1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);
