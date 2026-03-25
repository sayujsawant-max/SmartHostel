import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Feedback, FeedbackCategory } from '@models/feedback.model.js';
import { User } from '@models/user.model.js';
import * as feedbackService from './feedback.service.js';

let studentId: string;
let otherStudentId: string;

async function createTestUser(overrides: Record<string, unknown> = {}) {
  const user = await User.create({
    name: 'Test Student',
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: 'hashed',
    role: 'STUDENT',
    isActive: true,
    hasConsented: true,
    block: 'A',
    floor: '1',
    roomNumber: 'A-101',
    ...overrides,
  });
  return user._id.toString();
}

beforeEach(async () => {
  studentId = await createTestUser({ name: 'Student One', email: 'student1@example.com' });
  otherStudentId = await createTestUser({ name: 'Student Two', email: 'student2@example.com' });
});

describe('submitFeedback', () => {
  it('creates feedback successfully', async () => {
    const feedback = await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.MESS,
      rating: 4,
      comment: 'Great food today',
    });

    expect(feedback).toBeDefined();
    expect(feedback._id).toBeDefined();
    expect(feedback.category).toBe(FeedbackCategory.MESS);
    expect(feedback.rating).toBe(4);
    expect(feedback.comment).toBe('Great food today');
    expect(feedback.studentId.toString()).toBe(studentId);
  });

  it('creates anonymous feedback', async () => {
    const feedback = await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.GENERAL,
      rating: 3,
      comment: 'Anonymous feedback',
      isAnonymous: true,
    });

    expect(feedback.isAnonymous).toBe(true);
  });

  it('defaults isAnonymous to false', async () => {
    const feedback = await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.ROOMS,
      rating: 5,
      comment: 'Nice room',
    });

    expect(feedback.isAnonymous).toBe(false);
  });
});

describe('getFeedbacks', () => {
  beforeEach(async () => {
    // Create multiple feedbacks
    for (let i = 0; i < 5; i++) {
      await feedbackService.submitFeedback({
        studentId,
        category: FeedbackCategory.MESS,
        rating: i + 1,
        comment: `Feedback ${i + 1}`,
      });
    }
    for (let i = 0; i < 3; i++) {
      await feedbackService.submitFeedback({
        studentId,
        category: FeedbackCategory.LAUNDRY,
        rating: 3,
        comment: `Laundry feedback ${i + 1}`,
      });
    }
  });

  it('returns paginated feedbacks with default page/limit', async () => {
    const result = await feedbackService.getFeedbacks({});

    expect(result.feedbacks).toHaveLength(8);
    expect(result.total).toBe(8);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it('filters by category', async () => {
    const result = await feedbackService.getFeedbacks({
      category: FeedbackCategory.LAUNDRY,
    });

    expect(result.feedbacks).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('paginates correctly', async () => {
    const result = await feedbackService.getFeedbacks({
      page: 1,
      limit: 3,
    });

    expect(result.feedbacks).toHaveLength(3);
    expect(result.total).toBe(8);
    expect(result.totalPages).toBe(3);
  });

  it('returns second page correctly', async () => {
    const result = await feedbackService.getFeedbacks({
      page: 2,
      limit: 3,
    });

    expect(result.feedbacks).toHaveLength(3);
    expect(result.page).toBe(2);
  });

  it('calculates average rating', async () => {
    const result = await feedbackService.getFeedbacks({
      category: FeedbackCategory.MESS,
    });

    // Ratings are 1,2,3,4,5 => avg = 3
    expect(result.averageRating).toBe(3);
  });

  it('returns 0 average for no matching feedbacks', async () => {
    const result = await feedbackService.getFeedbacks({
      category: FeedbackCategory.MAINTENANCE,
    });

    expect(result.feedbacks).toHaveLength(0);
    expect(result.averageRating).toBe(0);
  });
});

describe('getFeedbackStats', () => {
  beforeEach(async () => {
    await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.MESS,
      rating: 4,
      comment: 'Good',
    });
    await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.MESS,
      rating: 2,
      comment: 'Bad',
    });
    await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.LAUNDRY,
      rating: 5,
      comment: 'Great',
    });
  });

  it('returns aggregated stats by category', async () => {
    const stats = await feedbackService.getFeedbackStats();

    expect(stats.length).toBeGreaterThanOrEqual(2);

    const messStat = stats.find((s) => s.category === FeedbackCategory.MESS);
    expect(messStat).toBeDefined();
    expect(messStat!.count).toBe(2);
    expect(messStat!.averageRating).toBe(3); // (4+2)/2

    const laundryStat = stats.find((s) => s.category === FeedbackCategory.LAUNDRY);
    expect(laundryStat).toBeDefined();
    expect(laundryStat!.count).toBe(1);
    expect(laundryStat!.averageRating).toBe(5);
  });

  it('returns empty array when no feedbacks exist', async () => {
    await Feedback.deleteMany({});
    const stats = await feedbackService.getFeedbackStats();
    expect(stats).toEqual([]);
  });
});

describe('deleteFeedback', () => {
  let feedbackId: string;

  beforeEach(async () => {
    const feedback = await feedbackService.submitFeedback({
      studentId,
      category: FeedbackCategory.GENERAL,
      rating: 4,
      comment: 'To be deleted',
    });
    feedbackId = feedback._id.toString();
  });

  it('allows owner to delete their own feedback', async () => {
    await feedbackService.deleteFeedback(feedbackId, studentId, 'STUDENT');

    const found = await Feedback.findById(feedbackId);
    expect(found).toBeNull();
  });

  it('allows WARDEN_ADMIN to delete any feedback', async () => {
    await feedbackService.deleteFeedback(feedbackId, otherStudentId, 'WARDEN_ADMIN');

    const found = await Feedback.findById(feedbackId);
    expect(found).toBeNull();
  });

  it('prevents non-owner non-admin from deleting', async () => {
    await expect(
      feedbackService.deleteFeedback(feedbackId, otherStudentId, 'STUDENT'),
    ).rejects.toThrow('You can only delete your own feedback');
  });

  it('throws NOT_FOUND for non-existent feedback', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      feedbackService.deleteFeedback(fakeId, studentId, 'STUDENT'),
    ).rejects.toThrow('Feedback not found');
  });
});
