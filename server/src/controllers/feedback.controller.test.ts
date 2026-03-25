import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { Role } from '@smarthostel/shared';

// Mock the feedback service
vi.mock('@services/feedback.service.js', () => ({
  submitFeedback: vi.fn(),
  getFeedbacks: vi.fn(),
  getFeedbackStats: vi.fn(),
  deleteFeedback: vi.fn(),
}));

import * as feedbackController from './feedback.controller.js';
import * as feedbackService from '@services/feedback.service.js';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    correlationId: 'test-corr-id',
    user: {
      _id: 'user-123',
      role: Role.STUDENT,
    },
    ...overrides,
  } as unknown as Request;
}

function mockResponse(): Response & { _status: number; _json: unknown } {
  const res = {
    _status: 200,
    _json: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
  };
  return res as unknown as Response & { _status: number; _json: unknown };
}

describe('feedbackController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitFeedback', () => {
    it('creates feedback with valid input and returns 201', async () => {
      const mockFeedback = { _id: 'fb-1', category: 'MESS', message: 'Good food', rating: 4 };
      (feedbackService.submitFeedback as ReturnType<typeof vi.fn>).mockResolvedValue(mockFeedback);

      const req = mockRequest({
        body: { category: 'MESS', message: 'Good food', rating: 4 },
      });
      const res = mockResponse();

      await feedbackController.submitFeedback(req, res as unknown as Response);

      expect(res._status).toBe(201);
      expect(res._json).toEqual({
        success: true,
        data: { feedback: mockFeedback },
        correlationId: 'test-corr-id',
      });
      expect(feedbackService.submitFeedback).toHaveBeenCalledWith(
        { category: 'MESS', comment: 'Good food', rating: 4, studentId: 'user-123' },
      );
    });

    it('throws validation error for missing category', async () => {
      const req = mockRequest({
        body: { message: 'Good food' },
      });
      const res = mockResponse();

      await expect(
        feedbackController.submitFeedback(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('throws validation error for empty message', async () => {
      const req = mockRequest({
        body: { category: 'MESS', message: '' },
      });
      const res = mockResponse();

      await expect(
        feedbackController.submitFeedback(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('throws validation error for out-of-range rating', async () => {
      const req = mockRequest({
        body: { category: 'MESS', message: 'Good food', rating: 10 },
      });
      const res = mockResponse();

      await expect(
        feedbackController.submitFeedback(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('accepts feedback without rating (optional field)', async () => {
      const mockFeedback = { _id: 'fb-2', category: 'GENERAL', message: 'Suggestion' };
      (feedbackService.submitFeedback as ReturnType<typeof vi.fn>).mockResolvedValue(mockFeedback);

      const req = mockRequest({
        body: { category: 'GENERAL', message: 'Suggestion' },
      });
      const res = mockResponse();

      await feedbackController.submitFeedback(req, res as unknown as Response);

      expect(res._status).toBe(201);
    });
  });

  describe('getFeedbacks', () => {
    it('returns feedbacks for admin (no userId filter)', async () => {
      const mockFeedbacks = [{ _id: 'fb-1' }, { _id: 'fb-2' }];
      (feedbackService.getFeedbacks as ReturnType<typeof vi.fn>).mockResolvedValue(mockFeedbacks);

      const req = mockRequest({
        user: { _id: 'admin-1', role: Role.WARDEN_ADMIN } as any,
        query: {},
      });
      const res = mockResponse();

      await feedbackController.listFeedbacks(req, res as unknown as Response);

      expect(res._json).toEqual({
        success: true,
        data: { feedbacks: mockFeedbacks },
        correlationId: 'test-corr-id',
      });
      expect(feedbackService.getFeedbacks).toHaveBeenCalledWith({});
    });

    it('returns feedbacks for student (filtered by userId)', async () => {
      const mockFeedbacks = [{ _id: 'fb-1' }];
      (feedbackService.getFeedbacks as ReturnType<typeof vi.fn>).mockResolvedValue(mockFeedbacks);

      const req = mockRequest({
        user: { _id: 'student-1', role: Role.STUDENT } as any,
        query: { category: 'MESS' },
      });
      const res = mockResponse();

      await feedbackController.listFeedbacks(req, res as unknown as Response);

      expect(feedbackService.getFeedbacks).toHaveBeenCalledWith({ category: 'MESS' });
    });
  });

  describe('getFeedbackStats', () => {
    it('returns aggregated stats', async () => {
      const mockStats = [
        { category: 'MESS', averageRating: 3.5, count: 10 },
        { category: 'LAUNDRY', averageRating: 4.2, count: 5 },
      ];
      (feedbackService.getFeedbackStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

      const req = mockRequest();
      const res = mockResponse();

      await feedbackController.getFeedbackStats(req, res as unknown as Response);

      expect(res._json).toEqual({
        success: true,
        data: { stats: mockStats },
        correlationId: 'test-corr-id',
      });
    });
  });

  describe('deleteFeedback', () => {
    it('deletes feedback and returns success', async () => {
      (feedbackService.deleteFeedback as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const req = mockRequest({
        params: { id: 'fb-123' },
      } as any);
      const res = mockResponse();

      await feedbackController.deleteFeedback(
        req as unknown as Request<{ id: string }>,
        res as unknown as Response,
      );

      expect(res._json).toEqual({
        success: true,
        data: { message: 'Feedback deleted' },
        correlationId: 'test-corr-id',
      });
      expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(
        'fb-123',
        'user-123',
        Role.STUDENT,
      );
    });

    it('propagates service errors', async () => {
      (feedbackService.deleteFeedback as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Feedback not found'),
      );

      const req = mockRequest({
        params: { id: 'nonexistent' },
      } as any);
      const res = mockResponse();

      await expect(
        feedbackController.deleteFeedback(
          req as unknown as Request<{ id: string }>,
          res as unknown as Response,
        ),
      ).rejects.toThrow('Feedback not found');
    });
  });
});
