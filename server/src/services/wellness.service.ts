import mongoose from 'mongoose';
import { WellnessCheck, StressLevel } from '@models/wellness-check.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function createCheck(data: {
  studentId: string;
  checkedBy: string;
  moodScore: number;
  stressLevel: StressLevel;
  notes?: string;
  flags?: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
}) {
  const check = await WellnessCheck.create(data);

  logger.info(
    { checkId: check._id, studentId: data.studentId, stressLevel: data.stressLevel },
    'Wellness check created',
  );

  return check;
}

export async function getChecks(filters: {
  studentId?: string;
  stressLevel?: StressLevel;
  followUpRequired?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.studentId) {
    query.studentId = new mongoose.Types.ObjectId(filters.studentId);
  }
  if (filters.stressLevel) {
    query.stressLevel = filters.stressLevel;
  }
  if (filters.followUpRequired !== undefined) {
    query.followUpRequired = filters.followUpRequired;
  }

  const [checks, total] = await Promise.all([
    WellnessCheck.find(query)
      .populate('studentId', 'name email block roomNumber')
      .populate('checkedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WellnessCheck.countDocuments(query),
  ]);

  return {
    checks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAtRiskStudents() {
  const atRisk = await WellnessCheck.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$studentId',
        latestCheck: { $first: '$$ROOT' },
      },
    },
    {
      $match: {
        $or: [
          { 'latestCheck.stressLevel': { $in: [StressLevel.HIGH, StressLevel.CRITICAL] } },
          { 'latestCheck.followUpRequired': true },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $project: {
        studentId: '$_id',
        studentName: '$student.name',
        studentEmail: '$student.email',
        block: '$student.block',
        roomNumber: '$student.roomNumber',
        moodScore: '$latestCheck.moodScore',
        stressLevel: '$latestCheck.stressLevel',
        flags: '$latestCheck.flags',
        followUpRequired: '$latestCheck.followUpRequired',
        followUpDate: '$latestCheck.followUpDate',
        checkedAt: '$latestCheck.createdAt',
      },
    },
    { $sort: { stressLevel: -1, moodScore: 1 } },
  ]);

  return atRisk;
}

export async function getWellnessStats() {
  const [moodStats, stressDistribution] = await Promise.all([
    WellnessCheck.aggregate([
      {
        $group: {
          _id: null,
          averageMoodScore: { $avg: '$moodScore' },
          totalChecks: { $sum: 1 },
          minMoodScore: { $min: '$moodScore' },
          maxMoodScore: { $max: '$moodScore' },
        },
      },
    ]),
    WellnessCheck.aggregate([
      { $group: { _id: '$stressLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    averageMoodScore: moodStats.length > 0 ? Math.round(moodStats[0].averageMoodScore * 100) / 100 : 0,
    totalChecks: moodStats.length > 0 ? moodStats[0].totalChecks : 0,
    minMoodScore: moodStats.length > 0 ? moodStats[0].minMoodScore : 0,
    maxMoodScore: moodStats.length > 0 ? moodStats[0].maxMoodScore : 0,
    stressDistribution: stressDistribution.map((s) => ({
      stressLevel: s._id,
      count: s.count,
    })),
  };
}

export async function getStudentHistory(studentId: string) {
  const checks = await WellnessCheck.find({
    studentId: new mongoose.Types.ObjectId(studentId),
  })
    .populate('checkedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  if (checks.length === 0) {
    logger.info({ studentId }, 'No wellness checks found for student');
  }

  return checks;
}
