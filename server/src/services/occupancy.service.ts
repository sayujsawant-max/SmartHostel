import { Room } from '@models/room.model.js';

export async function getOccupancyOverview() {
  const stats = await Room.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
        fullyOccupied: {
          $sum: { $cond: [{ $eq: ['$totalBeds', '$occupiedBeds'] }, 1, 0] },
        },
        vacant: {
          $sum: { $cond: [{ $eq: ['$occupiedBeds', 0] }, 1, 0] },
        },
        partiallyOccupied: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$occupiedBeds', 0] }, { $lt: ['$occupiedBeds', '$totalBeds'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const inactiveCount = await Room.countDocuments({ isActive: false });

  if (stats.length === 0) {
    return {
      totalRooms: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      fullyOccupied: 0,
      vacant: 0,
      partiallyOccupied: 0,
      maintenance: inactiveCount,
      occupancyRate: 0,
    };
  }

  const s = stats[0];

  return {
    totalRooms: s.totalRooms,
    totalBeds: s.totalBeds,
    occupiedBeds: s.occupiedBeds,
    vacantBeds: s.totalBeds - s.occupiedBeds,
    fullyOccupied: s.fullyOccupied,
    vacant: s.vacant,
    partiallyOccupied: s.partiallyOccupied,
    maintenance: inactiveCount,
    occupancyRate: s.totalBeds > 0 ? Math.round((s.occupiedBeds / s.totalBeds) * 10000) / 100 : 0,
  };
}

export async function getBlockOccupancy() {
  const blocks = await Room.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$block',
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return blocks.map((b) => ({
    block: b._id,
    totalRooms: b.totalRooms,
    totalBeds: b.totalBeds,
    occupiedBeds: b.occupiedBeds,
    vacantBeds: b.totalBeds - b.occupiedBeds,
    occupancyRate: b.totalBeds > 0 ? Math.round((b.occupiedBeds / b.totalBeds) * 10000) / 100 : 0,
  }));
}

export async function getFloorOccupancy(block: string) {
  const floors = await Room.aggregate([
    { $match: { block, isActive: true } },
    {
      $group: {
        _id: '$floor',
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return floors.map((f) => ({
    floor: f._id,
    totalRooms: f.totalRooms,
    totalBeds: f.totalBeds,
    occupiedBeds: f.occupiedBeds,
    vacantBeds: f.totalBeds - f.occupiedBeds,
    occupancyRate: f.totalBeds > 0 ? Math.round((f.occupiedBeds / f.totalBeds) * 10000) / 100 : 0,
  }));
}

export async function getRoomGrid(block?: string, floor?: string) {
  const query: Record<string, unknown> = {};
  if (block) query.block = block;
  if (floor) query.floor = floor;

  const rooms = await Room.find(query)
    .sort({ block: 1, floor: 1, roomNumber: 1 })
    .lean();

  return rooms.map((room) => ({
    _id: room._id,
    block: room.block,
    floor: room.floor,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    acType: room.acType,
    totalBeds: room.totalBeds,
    occupiedBeds: room.occupiedBeds,
    vacantBeds: room.totalBeds - room.occupiedBeds,
    isActive: room.isActive,
    status: !room.isActive
      ? 'MAINTENANCE'
      : room.occupiedBeds >= room.totalBeds
        ? 'FULL'
        : room.occupiedBeds > 0
          ? 'PARTIAL'
          : 'VACANT',
  }));
}
