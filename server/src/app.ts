import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { correlationIdMiddleware } from '@middleware/correlation-id.middleware.js';
import { csrfMiddleware } from '@middleware/csrf.middleware.js';
import { mongoSanitizeMiddleware } from '@middleware/mongo-sanitize.middleware.js';
import { errorHandlerMiddleware } from '@middleware/error-handler.middleware.js';
import { swaggerSpec } from '@config/swagger.js';
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
import assistantRoutes from '@/routes/assistant.routes.js';
import roomRoutes from '@/routes/room.routes.js';
import sosRoutes from '@/routes/sos.routes.js';
import messMenuRoutes from '@/routes/mess-menu.routes.js';
import laundryRoutes from '@/routes/laundry.routes.js';
import visitorRoutes from '@/routes/visitor.routes.js';
import roomChangeRoutes from '@/routes/room-change.routes.js';
import lostFoundRoutes from '@/routes/lost-found.routes.js';
import gamificationRoutes from '@/routes/gamification.routes.js';
import roomMatchingRoutes from '@/routes/room-matching.routes.js';
import feedbackRoutes from '@/routes/feedback.routes.js';
import chatRoutes from '@/routes/chat.routes.js';
import assetRoutes from '@/routes/asset.routes.js';
import wellnessRoutes from '@/routes/wellness.routes.js';
import emergencyAlertRoutes from '@/routes/emergency-alert.routes.js';
import pushRoutes from '@/routes/push.routes.js';
import complaintAnalyticsRoutes from '@/routes/complaint-analytics.routes.js';
import occupancyRoutes from '@/routes/occupancy.routes.js';
import reportBuilderRoutes from '@/routes/report-builder.routes.js';
import dashboardWidgetRoutes from '@/routes/dashboard-widget.routes.js';
import fileUploadRoutes from '@/routes/file-upload.routes.js';

const app = express();

// Trust proxy (for rate limiting, secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Response compression (gzip/deflate)
app.use(compression());

// Security headers with hardened CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'wss:', 'ws:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Google Sign-In
  }),
);

// CORS — use validated env config
const origins = env.ALLOWED_ORIGINS
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));

// Body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strip MongoDB operator injection ($gt, $ne, etc.) from inputs
app.use(mongoSanitizeMiddleware);

// Correlation ID — must come before pino-http so logs include it
app.use(correlationIdMiddleware);

// Structured logging
app.use(
  (pinoHttp as unknown as typeof pinoHttp.default)({
    logger,
    customProps: (req: express.Request) => ({
      correlationId: req.correlationId,
    }),
  }),
);

// General rate limiting — 200 requests per minute per IP
if (env.NODE_ENV !== 'test') {
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 200,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
}

// CSRF protection — Origin/Referer allowlist on state-changing methods
app.use(csrfMiddleware);

// API docs (Swagger UI) — available in non-production environments
if (env.NODE_ENV !== 'production') {
  const swaggerUi = await import('swagger-ui-express');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

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
app.use('/api/assistant', assistantRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/mess-menu', messMenuRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/room-changes', roomChangeRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/room-matching', roomMatchingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/admin/wellness', wellnessRoutes);
app.use('/api/admin/emergency-alerts', emergencyAlertRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin/complaint-analytics', complaintAnalyticsRoutes);
app.use('/api/admin/occupancy', occupancyRoutes);
app.use('/api/admin/report-builder', reportBuilderRoutes);
app.use('/api/admin/dashboard-widgets', dashboardWidgetRoutes);
app.use('/api/files', fileUploadRoutes);

// Test-only routes for RBAC integration testing (static import, only registered in test)
if (env.NODE_ENV === 'test') {
  const { default: rbacTestRoutes } = await import('@/routes/rbac-test.routes.js');
  app.use('/api/test', rbacTestRoutes);
}

// In production, serve the built client SPA
if (env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback — serve index.html for GET navigation requests only
  app.use((req, _res, next) => {
    // Only GET requests can be SPA navigations
    if (req.method !== 'GET') {
      return next(new AppError('NOT_FOUND', 'Resource not found', 404));
    }
    // API routes fall through to the 404 handler
    if (req.path.startsWith('/api')) {
      return next(new AppError('NOT_FOUND', 'Resource not found', 404));
    }
    // Static asset requests that weren't found by express.static should 404
    // Match common asset extensions (Vite outputs hashed filenames like index-abc123.js)
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map|json)$/i.test(req.path)) {
      return next(new AppError('NOT_FOUND', 'Resource not found', 404));
    }
    _res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 catch-all — undefined API routes return JSON, not HTML
app.use((_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'Resource not found', 404));
});

// Global error handler — must be last
app.use(errorHandlerMiddleware);

export default app;
