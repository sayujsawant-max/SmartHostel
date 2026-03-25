import { Feedback, FeedbackCategory } from '@models/feedback.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function submitFeedback(data: {
  studentId: string;
  category: FeedbackCategory;
  rating: number;
  comment: string;
  isAnonymous?: boolean;
}) {
  const feedback = await Feedback.create(data);

  logger.info({ feedbackId: feedback._id, category: data.category }, 'Feedback submitted');

  return feedback;
}

export async function getFeedbacks(filters: {
  category?: FeedbackCategory;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.category) {
    query.category = filters.category;
  }

  const [feedbacks, total] = await Promise.all([
    Feedback.find(query)
      .populate('studentId', 'name email block roomNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(query),
  ]);

  // Calculate average rating for the filtered set
  const avgResult = await Feedback.aggregate([
    { $match: query },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
  ]);

  const averageRating = avgResult.length > 0 ? Math.round(avgResult[0].averageRating * 100) / 100 : 0;

  return {
    feedbacks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    averageRating,
  };
}

export async function getFeedbackStats() {
  const stats = await Feedback.aggregate([
    {
      $group: {
        _id: '$category',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return stats.map((s) => ({
    category: s._id,
    averageRating: Math.round(s.averageRating * 100) / 100,
    count: s.count,
  }));
}

export async function deleteFeedback(feedbackId: string, userId: string, userRole: string) {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new AppError('NOT_FOUND', 'Feedback not found', 404);
  }

  // Only the owner or an admin can delete
  if (feedback.studentId.toString() !== userId && userRole !== 'WARDEN_ADMIN') {
    throw new AppError('FORBIDDEN', 'You can only delete your own feedback', 403);
  }

  await Feedback.deleteOne({ _id: feedbackId });

  logger.info({ feedbackId, deletedBy: userId }, 'Feedback deleted');
}
