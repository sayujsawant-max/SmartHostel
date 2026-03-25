import { randomUUID } from 'node:crypto';
import { Asset, AssetCategory, AssetStatus } from '@models/asset.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function createAsset(data: {
  name: string;
  assetTag: string;
  category: AssetCategory;
  location: { block: string; floor: string; room: string };
  status?: AssetStatus;
  assignedTo?: string;
  purchaseDate: Date;
  warrantyExpiry?: Date;
  notes?: string;
}) {
  const existing = await Asset.findOne({ assetTag: data.assetTag });
  if (existing) {
    throw new AppError('CONFLICT', 'An asset with this tag already exists', 409);
  }

  // Auto-generate QR code value
  const qrCode = `ASSET-${data.assetTag}-${randomUUID().slice(0, 8)}`;

  const asset = await Asset.create({
    ...data,
    qrCode,
  });

  logger.info({ assetId: asset._id, assetTag: data.assetTag }, 'Asset created');

  return asset;
}

export async function getAssets(filters: {
  status?: AssetStatus;
  category?: AssetCategory;
  location?: { block?: string; floor?: string; room?: string };
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.location?.block) {
    query['location.block'] = filters.location.block;
  }
  if (filters.location?.floor) {
    query['location.floor'] = filters.location.floor;
  }
  if (filters.location?.room) {
    query['location.room'] = filters.location.room;
  }

  const [assets, total] = await Promise.all([
    Asset.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Asset.countDocuments(query),
  ]);

  return {
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAssetByTag(assetTag: string) {
  const asset = await Asset.findOne({ assetTag })
    .populate('assignedTo', 'name email')
    .lean();

  if (!asset) {
    throw new AppError('NOT_FOUND', 'Asset not found', 404);
  }

  return asset;
}

export async function updateAsset(assetId: string, data: Partial<{
  name: string;
  category: AssetCategory;
  location: { block: string; floor: string; room: string };
  status: AssetStatus;
  assignedTo: string | null;
  warrantyExpiry: Date | null;
  notes: string | null;
}>) {
  const asset = await Asset.findByIdAndUpdate(
    assetId,
    { $set: data },
    { returnDocument: 'after' },
  );

  if (!asset) {
    throw new AppError('NOT_FOUND', 'Asset not found', 404);
  }

  logger.info({ assetId, updates: Object.keys(data) }, 'Asset updated');

  return asset;
}

export async function logMaintenance(assetId: string, notes: string) {
  const asset = await Asset.findByIdAndUpdate(
    assetId,
    {
      $set: {
        lastMaintenanceDate: new Date(),
        notes,
      },
    },
    { returnDocument: 'after' },
  );

  if (!asset) {
    throw new AppError('NOT_FOUND', 'Asset not found', 404);
  }

  logger.info({ assetId }, 'Asset maintenance logged');

  return asset;
}

export async function getAssetStats() {
  const [byStatus, byCategory] = await Promise.all([
    Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    total: byStatus.reduce((sum, s) => sum + s.count, 0),
  };
}
