import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { correlationIdMiddleware } from '@middleware/correlation-id.middleware.js';
import { csrfMiddleware } from '@middleware/csrf.middleware.js';
import { errorHandlerMiddleware } from '@middleware/error-handler.middleware.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';
import { env } from '@config/env.js';
import healthRoutes from '@/routes/health.routes.js';
import authRoutes from '@/routes/auth.routes.js';
import consentRoutes from '@/routes/consent.routes.js';
import adminRoutes from '@/routes/admin.routes.js';
import leaveRoutes from '@/routes/leave.routes.js';
import gatePassRoutes from '@/routes/gate-pass.routes.js';
import gateRoutes from '@/routes/gate.routes.js';
import complaintRoutes from '@/routes/complaint.routes.js';
import notificationRoutes from '@/routes/notification.routes.js';
import noticeRoutes from '@/routes/notice.routes.js';

const app = express();

// Trust proxy (for rate limiting, secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — use validated env config
const origins = env.ALLOWED_ORIGINS
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));

// Body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correlation ID — must come before pino-http so logs include it
app.use(correlationIdMiddleware);

// Structured logging
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      correlationId: (req as express.Request).correlationId,
    }),
  }),
);

// CSRF protection — Origin/Referer allowlist on state-changing methods
app.use(csrfMiddleware);

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/admin/users', adminRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/gate-passes', gatePassRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);

// Test-only routes for RBAC integration testing (static import, only registered in test)
if (env.NODE_ENV === 'test') {
  const { default: rbacTestRoutes } = await import('@/routes/rbac-test.routes.js');
  app.use('/api/test', rbacTestRoutes);
}

// 404 catch-all — undefined routes return JSON, not HTML
app.use((_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'Resource not found', 404));
});

// Global error handler — must be last
app.use(errorHandlerMiddleware);

export default app;
