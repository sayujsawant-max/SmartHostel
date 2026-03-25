import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load .env from monorepo root (parent of server workspace)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Safe boolean parser for env vars — "false" string must become false
const booleanString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

// Duration string parser — converts "4h", "7d", "30m", "120s" to milliseconds,
// or passes through raw numeric strings as-is.
const durationMs = z.string().transform((v, ctx) => {
  const match = v.match(/^(\d+)(ms|s|m|h|d)$/);
  if (match) {
    const num = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return num * multipliers[unit];
  }
  const asNum = Number(v);
  if (!Number.isNaN(asNum) && v.trim() !== '') return asNum;
  ctx.addIssue(`Invalid duration: "${v}". Use e.g. "4h", "7d", "30m", or a number in ms.`);
  return z.NEVER;
});

const envSchema = z.object({
  // Required — no defaults, crash if missing
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  QR_SECRET: z.string().min(32, 'QR_SECRET must be at least 32 characters'),
  MONGODB_URI: z.string().refine(
    (v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'),
    'MONGODB_URI must start with mongodb:// or mongodb+srv://',
  ),
  CLOUDINARY_URL: z
    .string()
    .refine((v) => v === '' || v.startsWith('cloudinary://'), 'CLOUDINARY_URL must start with cloudinary:// or be empty')
    .default(''),

  // Defaulted-optional — safe defaults for dev, override in production
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CRON_ENABLED: booleanString,
  ACCESS_TOKEN_EXPIRY: durationMs.default(3_600_000),
  REFRESH_TOKEN_EXPIRY: durationMs.default(604_800_000),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOGIN_LOCKOUT_DURATION_MS: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return 900_000; // 15 minutes default
      const match = v.match(/^(\d+)(ms|s|m|h|d)$/);
      if (match) {
        const num = Number(match[1]);
        const unit = match[2];
        const multipliers: Record<string, number> = {
          ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000,
        };
        return num * multipliers[unit];
      }
      const asNum = Number(v);
      if (!Number.isNaN(asNum) && v.trim() !== '') return asNum;
      ctx.addIssue(`Invalid duration: "${v}". Use e.g. "15m", "7d", or a number in ms.`);
      return z.NEVER;
    }),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),

  // Email (optional — SMTP)
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('noreply@smarthostel.com'),

  // Error monitoring (optional — Sentry)
  SENTRY_DSN: z.string().optional().default(''),

  // Push notifications (optional — VAPID)
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default('mailto:admin@smarthostel.com'),
});

// Validate on import — crashes server immediately if invalid
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Use stderr — pino logger may not be initialized yet
  // eslint-disable-next-line no-console -- logger not available during env validation
  console.error(
    'Environment validation failed:',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;

// Derived helpers
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
