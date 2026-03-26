import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { Role } from '@smarthostel/shared';

// Mock the emergency alert service
vi.mock('@services/emergency-alert.service.js', () => ({
  createAlert: vi.fn(),
  getAlerts: vi.fn(),
  getActiveAlerts: vi.fn(),
  resolveAlert: vi.fn(),
}));

import * as emergencyAlertController from './emergency-alert.controller.js';
import * as emergencyAlertService from '@services/emergency-alert.service.js';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    correlationId: 'test-corr-id',
    user: {
      _id: 'warden-123',
      role: Role.WARDEN_ADMIN,
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

describe('emergencyAlertController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAlert', () => {
    it('creates alert with valid input and returns 201', async () => {
      const mockAlert = {
        _id: 'alert-1',
        title: 'Fire Alert',
        severity: 'critical',
        description: 'Fire in Block A',
      };
      (emergencyAlertService.createAlert as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlert);

      const req = mockRequest({
        body: {
          title: 'Fire Alert',
          description: 'Fire in Block A',
          type: 'fire',
          severity: 'critical',
          targetScope: 'block',
          targetValue: 'A',
        },
      });
      const res = mockResponse();

      await emergencyAlertController.createAlert(req, res as unknown as Response);

      expect(res._status).toBe(201);
      expect(res._json).toEqual({
        success: true,
        data: { alert: mockAlert },
        correlationId: 'test-corr-id',
      });
      expect(emergencyAlertService.createAlert).toHaveBeenCalledWith(
        {
          type: 'FIRE',
          severity: 'CRITICAL',
          title: 'Fire Alert',
          description: 'Fire in Block A',
          targetScope: 'BLOCK',
          targetValue: 'A',
        },
        'warden-123',
      );
    });

    it('throws validation error for missing title', async () => {
      const req = mockRequest({
        body: { description: 'Some alert', type: 'fire', severity: 'high' },
      });
      const res = mockResponse();

      await expect(
        emergencyAlertController.createAlert(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('throws validation error for missing type', async () => {
      const req = mockRequest({
        body: { title: 'Alert Title', description: 'Body', severity: 'high' },
      });
      const res = mockResponse();

      await expect(
        emergencyAlertController.createAlert(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('throws validation error for missing severity', async () => {
      const req = mockRequest({
        body: { title: 'Alert', description: 'Body', type: 'fire' },
      });
      const res = mockResponse();

      await expect(
        emergencyAlertController.createAlert(req, res as unknown as Response),
      ).rejects.toThrow();
    });

    it('accepts valid severity values', async () => {
      const mockAlert = { _id: 'alert-2', title: 'Test' };
      (emergencyAlertService.createAlert as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlert);

      for (const severity of ['low', 'medium', 'high', 'critical']) {
        const req = mockRequest({
          body: { title: 'Alert', description: 'Body text', type: 'fire', severity },
        });
        const res = mockResponse();

        await emergencyAlertController.createAlert(req, res as unknown as Response);
        expect(res._status).toBe(201);
      }
    });

    it('accepts alert without targetValue (optional)', async () => {
      const mockAlert = { _id: 'alert-3' };
      (emergencyAlertService.createAlert as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlert);

      const req = mockRequest({
        body: { title: 'Alert', description: 'Body text', type: 'fire', severity: 'low' },
      });
      const res = mockResponse();

      await emergencyAlertController.createAlert(req, res as unknown as Response);
      expect(res._status).toBe(201);
    });
  });

  describe('getAlerts', () => {
    it('returns list of alerts', async () => {
      const mockAlerts = [
        { _id: 'alert-1', title: 'Alert 1' },
        { _id: 'alert-2', title: 'Alert 2' },
      ];
      const mockResult = {
        alerts: mockAlerts,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      (emergencyAlertService.getAlerts as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const req = mockRequest({ query: { status: 'ACTIVE' } });
      const res = mockResponse();

      await emergencyAlertController.listAlerts(req, res as unknown as Response);

      expect(res._json).toEqual({
        success: true,
        data: mockResult,
        correlationId: 'test-corr-id',
      });
      expect(emergencyAlertService.getAlerts).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });

    it('passes empty query when no filters', async () => {
      (emergencyAlertService.getAlerts as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await emergencyAlertController.listAlerts(req, res as unknown as Response);

      expect(emergencyAlertService.getAlerts).toHaveBeenCalledWith({});
    });
  });

  describe('getActiveAlerts', () => {
    it('returns active alerts', async () => {
      const mockAlerts = [
        { _id: 'alert-1', title: 'Active Alert', status: 'ACTIVE' },
      ];
      (emergencyAlertService.getActiveAlerts as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAlerts,
      );

      const req = mockRequest();
      const res = mockResponse();

      await emergencyAlertController.getActiveAlerts(req, res as unknown as Response);

      expect(res._json).toEqual({
        success: true,
        data: { alerts: mockAlerts },
        correlationId: 'test-corr-id',
      });
    });

    it('returns empty array when no active alerts', async () => {
      (emergencyAlertService.getActiveAlerts as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const req = mockRequest();
      const res = mockResponse();

      await emergencyAlertController.getActiveAlerts(req, res as unknown as Response);

      expect(res._json).toEqual({
        success: true,
        data: { alerts: [] },
        correlationId: 'test-corr-id',
      });
    });
  });

  describe('resolveAlert', () => {
    it('resolves alert with valid resolution', async () => {
      const mockAlert = { _id: 'alert-1', status: 'RESOLVED', resolution: 'Issue fixed' };
      (emergencyAlertService.resolveAlert as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAlert,
      );

      const req = mockRequest({
        params: { id: 'alert-1' },
        body: { resolution: 'Issue fixed' },
      } as any);
      const res = mockResponse();

      await emergencyAlertController.resolveAlert(
        req as unknown as Request<{ id: string }>,
        res as unknown as Response,
      );

      expect(res._json).toEqual({
        success: true,
        data: { alert: mockAlert },
        correlationId: 'test-corr-id',
      });
      expect(emergencyAlertService.resolveAlert).toHaveBeenCalledWith(
        'alert-1',
        'warden-123',
      );
    });

    it('resolves alert without resolution message (optional)', async () => {
      const mockAlert = { _id: 'alert-1', status: 'RESOLVED' };
      (emergencyAlertService.resolveAlert as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAlert,
      );

      const req = mockRequest({
        params: { id: 'alert-1' },
        body: {},
      } as any);
      const res = mockResponse();

      await emergencyAlertController.resolveAlert(
        req as unknown as Request<{ id: string }>,
        res as unknown as Response,
      );

      expect(res._json).toEqual({
        success: true,
        data: { alert: mockAlert },
        correlationId: 'test-corr-id',
      });
    });

    it('throws validation error for too-long resolution', async () => {
      const req = mockRequest({
        params: { id: 'alert-1' },
        body: { resolution: 'x'.repeat(2001) },
      } as any);
      const res = mockResponse();

      await expect(
        emergencyAlertController.resolveAlert(
          req as unknown as Request<{ id: string }>,
          res as unknown as Response,
        ),
      ).rejects.toThrow();
    });

    it('propagates service errors for non-existent alert', async () => {
      (emergencyAlertService.resolveAlert as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Alert is not active or does not exist'),
      );

      const req = mockRequest({
        params: { id: 'nonexistent' },
        body: {},
      } as any);
      const res = mockResponse();

      await expect(
        emergencyAlertController.resolveAlert(
          req as unknown as Request<{ id: string }>,
          res as unknown as Response,
        ),
      ).rejects.toThrow('Alert is not active or does not exist');
    });
  });
});
