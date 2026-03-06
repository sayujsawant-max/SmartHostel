import type { Request, Response } from 'express';
import { AppError } from '@utils/app-error.js';
import * as consentService from '@services/consent.service.js';

export async function createConsent(req: Request, res: Response) {
  const { version } = req.body;

  if (!version || typeof version !== 'string' || version.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Consent version is required', 400, {
      field: 'version',
    });
  }

  const consent = await consentService.recordConsent(
    req.user!._id,
    version.trim(),
    req.correlationId,
  );

  res.status(201).json({
    success: true,
    data: {
      consent: {
        id: consent._id,
        userId: consent.userId,
        version: consent.version,
        consentedAt: consent.consentedAt,
      },
    },
    correlationId: req.correlationId,
  });
}
