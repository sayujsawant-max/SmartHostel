import { Consent } from '@models/consent.model.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function recordConsent(userId: string, version: string, correlationId?: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'User not found or inactive', 401);
  }

  const consentedAt = new Date();

  const consent = await Consent.create({
    userId: user._id,
    version,
    consentedAt,
  });

  await User.updateOne(
    { _id: user._id },
    { $set: { hasConsented: true, consentedAt } },
  );

  logger.info(
    { eventType: 'CONSENT_RECORDED', correlationId, userId, version },
    'User consent recorded',
  );

  return consent;
}
