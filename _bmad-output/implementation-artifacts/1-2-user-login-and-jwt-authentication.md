# Story 1.2: User Login & JWT Authentication

Status: done

## Story

As a hostel user,
I want to log in with my credentials and receive a secure session,
so that I can access the system without re-authenticating constantly.

## Acceptance Criteria

1. **Given** a user with valid credentials exists in the database, **When** they POST to `/api/auth/login` with correct email and password, **Then** the server returns `{ success: true, data: { user: { id, name, email, role } }, correlationId }` **And** sets an `accessToken` httpOnly cookie (path: `/`, maxAge: ACCESS_TOKEN_EXPIRY, secure in prod, SameSite=Lax) **And** sets a `refreshToken` httpOnly cookie (path: `/api/auth`, maxAge: REFRESH_TOKEN_EXPIRY, secure in prod, SameSite=Lax) **And** stores the hashed refresh token jti in `User.refreshTokenJtis[]`.

2. **Given** a user with invalid credentials, **When** they POST to `/api/auth/login`, **Then** the server returns 401 `{ success: false, error: { code: 'UNAUTHORIZED' }, correlationId }` **And** no cookies are set **And** no `Set-Cookie` header is present.

3. **Given** a valid access token cookie exists, **When** the client calls `GET /api/auth/me`, **Then** the server returns `{ success: true, data: { user: { id, name, email, role, hasConsented } }, correlationId }`.

4. **Given** an expired access token but valid refresh token, **When** the client calls `POST /api/auth/refresh`, **Then** a new access token cookie is set **And** the refresh token is rotated (new jti issued, old jti removed from DB, new refresh cookie set).

5. **Given** a user calls `POST /api/auth/logout` (no auth middleware — uses refresh cookie), **When** the server processes the request, **Then** both cookies are cleared via `res.clearCookie` **And** if the refresh token is parseable, the jti is removed from `User.refreshTokenJtis[]` **And** if the refresh token is missing/invalid, cookies are still cleared and 200 returned (idempotent).

6. **Given** an admin triggers a password reset for a user, **When** the reset completes, **Then** all entries in that user's `refreshTokenJtis[]` are deleted (all sessions invalidated) **And** the user must log in with the new password. *(This story implements `authService.invalidateAllSessions(userId)` only; the admin endpoint/UI comes in Story 1.6.)*

7. **Given** the User model, **When** I inspect the schema, **Then** it has: `name`, `email` (unique), `passwordHash` (bcryptjs salt=10), `role` (enum: STUDENT, WARDEN, GUARD, MAINTENANCE), `block`, `floor`, `roomNumber` (denormalized), `hasConsented`, `consentedAt`, `isActive`, `refreshTokenJtis[]`, `createdAt`, `updatedAt` **And** collection is explicitly set to `'users'` with `{ timestamps: true, strict: true }` **And** indexes: `{ email: 1 }` unique, `{ role: 1, isActive: 1 }`.

## Tasks / Subtasks

- [x] Task 1: Create User model (AC: #7)
  - [x]1.1 Create `server/src/models/user.model.ts` with Mongoose schema matching AC #7 field list
  - [x]1.2 Set schema options: `{ collection: 'users', timestamps: true, strict: true }`
  - [x]1.3 Add unique index on `{ email: 1 }` and compound index on `{ role: 1, isActive: 1 }`
  - [x]1.4 Add `.toJSON()` transform to strip `passwordHash` and `refreshTokenJtis` from serialized output
  - [x]1.5 Export model as `User`

- [x]Task 2: Create shared auth schemas (AC: #1, #2)
  - [x]2.1 Create `shared/schemas/auth.schema.ts` with zod login schema: `{ email: z.string().email(), password: z.string().min(8).max(128) }`
  - [x]2.2 Export `loginSchema`, `LoginInput` type
  - [x]2.3 Re-export from `shared/index.ts` barrel
  - [x]2.4 Rebuild shared: `npm -w shared run build`

- [x]Task 3: Create auth cookie helper + auth service (AC: #1, #4, #5, #6)
  - [x]3.0 Create `server/src/utils/auth-cookies.ts` — centralized `setAuthCookies(res, tokens)` and `clearAuthCookies(res)` with shared cookie options (prevents path mismatch bugs on clear)
  - [x]3.1 Create `server/src/services/auth.service.ts`
  - [x]3.2 Implement `login(email, password)` — find user by email, verify password with `bcryptjs.compare`, generate tokens, store hashed jti
  - [x]3.3 Implement `generateTokens(userId, role)` — create access JWT (payload: `{ userId, role }`, expiresIn: `Math.floor(env.ACCESS_TOKEN_EXPIRY / 1000)` seconds) + refresh JWT (payload: `{ userId, jti }`, expiresIn: `Math.floor(env.REFRESH_TOKEN_EXPIRY / 1000)` seconds). Env vars are in ms (for cookie maxAge); jsonwebtoken `expiresIn` expects seconds when given a number.
  - [x]3.4 Implement `hashJti(jti)` — SHA-256 hash using Node `crypto` module
  - [x]3.5 Implement `refresh(userId, currentJti)` — verify hashed jti exists in array, remove old, generate new tokens, store new hashed jti
  - [x]3.6 Implement `logout(userId, jti)` — remove hashed jti from `User.refreshTokenJtis[]`
  - [x]3.7 Implement `invalidateAllSessions(userId)` — delete all entries in `User.refreshTokenJtis[]` (used by password reset in Story 1.6)

- [x]Task 4: Create auth middleware (AC: #3)
  - [x]4.1 Create `server/src/middleware/auth.middleware.ts`
  - [x]4.2 Read access token from `req.cookies.accessToken` (requires cookie-parser from Story 1.1)
  - [x]4.3 Verify JWT with `jwt.verify(token, env.JWT_SECRET)`
  - [x]4.4 Attach decoded payload to `req.user = { _id: userId, role }`
  - [x]4.5 Return 401 `UNAUTHORIZED` if token missing, invalid, or expired
  - [x]4.6 Add TypeScript declaration merging for `req.user` on Express Request

- [x]Task 5: Create auth controller (AC: #1, #2, #3, #4, #5)
  - [x]5.1 Create `server/src/controllers/auth.controller.ts`
  - [x]5.2 Implement `login` — validate body with loginSchema, call authService.login, set cookies via `res.cookie()`, return user data
  - [x]5.3 Implement `me` — return `req.user` profile from DB (strip sensitive fields)
  - [x]5.4 Implement `refresh` — extract refresh token from cookie, verify JWT, call authService.refresh, set new cookies
  - [x]5.5 Implement `logout` — extract refresh token from cookie, if parseable extract jti and call authService.logout, always clear cookies via `clearAuthCookies(res)`, return 200 (idempotent even if no cookie)
  - [x]5.6 Controller NEVER imports User model — only calls auth service

- [x]Task 6: Create auth routes (AC: #1, #2, #3, #4, #5)
  - [x]6.1 Create `server/src/routes/auth.routes.ts`
  - [x]6.2 `POST /api/auth/login` — no auth required
  - [x]6.3 `GET /api/auth/me` — auth middleware required
  - [x]6.4 `POST /api/auth/refresh` — no auth middleware (uses refresh cookie directly)
  - [x]6.5 `POST /api/auth/logout` — NO auth middleware (uses refresh cookie directly; must work even when access token is expired)
  - [x]6.6 Mount in `app.ts` under `/api/auth`

- [x]Task 7: Create login page (AC: #1, #2)
  - [x]7.1 Create `client/src/pages/LoginPage.tsx` — email + password form with react-hook-form + zod resolver
  - [x]7.2 Form validation on blur + submit; inline error display below fields
  - [x]7.3 Submit button: full-width, 48px min height, disabled + spinner during submission
  - [x]7.4 Error display: inline text below form for "Invalid credentials" (not toast)
  - [x]7.5 On success: store user in AuthContext, redirect to `/` (placeholder — shells built in Story 1.5)
  - [x]7.6 SmartHostel logo/title above form

- [x]Task 8: Create AuthContext (AC: #1, #3)
  - [x]8.1 Create `client/src/context/AuthContext.tsx` with AuthProvider
  - [x]8.2 State: `user` (null | UserProfile), `isLoading` (boolean), `isAuthenticated` (boolean)
  - [x]8.3 On mount: call `GET /api/auth/me` to check existing session (cookie-based)
  - [x]8.4 Expose: `login(email, password)`, `logout()`, `user`, `isLoading`, `isAuthenticated`
  - [x]8.5 Wrap app with AuthProvider in `main.tsx`

- [x]Task 9: Create API service utility
  - [x]9.1 Create `client/src/services/api.ts` with `apiFetch` wrapper
  - [x]9.2 Base URL: `/api` (proxied by Vite to server in dev)
  - [x]9.3 Include `credentials: 'include'` on all fetch calls (required for cookies)
  - [x]9.4 JSON content-type header
  - [x]9.5 Typed response handling with standard API envelope

- [x] Task 10: Update client routing (AC: #1, #2)
  - [x]10.1 Update `App.tsx` with react-router-dom routes: `/login` → LoginPage, `/` → placeholder authenticated page
  - [x]10.2 Basic route guard: if not authenticated → redirect to `/login`; if authenticated on `/login` → redirect to `/`
  - [x]10.3 Show loading skeleton while AuthContext checks session on mount

- [x] Task 11: Write tests (AC: all)
  - [x]11.1 Create `server/src/services/auth.service.test.ts` — test login success, login invalid password, login nonexistent email, token generation, jti hashing, refresh rotation, logout jti removal, invalidateAllSessions
  - [x]11.2 Create `server/src/routes/auth.routes.test.ts` — integration tests with supertest + mongodb-memory-server: POST login (success + failure), GET /me (auth'd + unauth'd), POST /refresh (valid + invalid), POST /logout
  - [x]11.3 Verify: `npm run test` passes from root

## Dev Notes

### Architecture Compliance (From Story 1.1 — MUST Follow)

**API Response Format:**
```typescript
// Success
{ success: true, data: T, correlationId: string }
// Error
{ success: false, error: { code, message, retryable, field?, retryAfterMs? }, correlationId: string }
```

**Error Codes (Locked — NEVER invent new ones):**
`VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500)

**Controller → Service → Model Layering:**
Controllers NEVER import models directly. Controllers call services; services call models.

**Logging Rule:**
`pino` structured logging ONLY. No `console.log` anywhere in server code. Every log includes `eventType` + `correlationId`.

**Mongoose Schema Pattern:**
```typescript
new Schema({ ... }, {
  collection: 'users',  // REQUIRED — explicit on every schema
  timestamps: true,
  strict: true
})
```

### Scope Boundaries

**IN this story:**
- User model, auth service, auth controller, auth routes
- Auth middleware (verify access token, attach req.user)
- JWT dual-token with httpOnly cookies
- Refresh token rotation with jti
- Login page (client)
- AuthContext (minimal)
- API service utility
- Tests

**NOT in this story (later stories):**
- CSRF middleware → Story 1.4
- RBAC middleware (requireRole) → Story 1.4
- Rate limiting on login → Story 1.4
- Account lockout on failed attempts → Story 1.4
- ConsentModal UI → Story 1.6
- Consent recording endpoint → Story 1.6
- Role-specific shells + navigation → Story 1.5
- ProtectedRoute / RoleGate components → Story 1.5
- apiFetch 401 auto-refresh interceptor → Story 1.5
- Audit events (AUTH_LOGIN, etc.) → Story 1.7
- Seed users → Story 1.8

### Technical Requirements

#### User Model Schema

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'WARDEN' | 'GUARD' | 'MAINTENANCE';
  block?: string;
  floor?: string;
  roomNumber?: string;
  hasConsented: boolean;
  consentedAt?: Date;
  isActive: boolean;
  refreshTokenJtis: string[];  // SHA-256 hashed jtis
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['STUDENT', 'WARDEN', 'GUARD', 'MAINTENANCE'] },
    block: { type: String },
    floor: { type: String },
    roomNumber: { type: String },
    hasConsented: { type: Boolean, default: false },
    consentedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    refreshTokenJtis: { type: [String], default: [], select: false },  // never returned by default queries
  },
  {
    collection: 'users',
    timestamps: true,
    strict: true,
  }
);

// Strip sensitive fields from JSON serialization
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshTokenJtis;
    delete ret.__v;
    return ret;
  },
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
```

**Role enum:** Import from `@smarthostel/shared/constants/roles` (created in Story 1.1). Use the shared enum values for the Mongoose enum constraint.

#### JWT Token Strategy

**Access Token:**
- Payload: `{ userId: string, role: string }`
- Signed with: `env.JWT_SECRET`
- JWT expiresIn: `Math.floor(env.ACCESS_TOKEN_EXPIRY / 1000)` (env is ms, JWT wants seconds)
- Cookie: `accessToken`, httpOnly, path `/`, maxAge: `env.ACCESS_TOKEN_EXPIRY` (ms), SameSite=Lax, Secure in prod

**Refresh Token:**
- Payload: `{ userId: string, jti: string }` (jti = UUID)
- Signed with: `env.JWT_SECRET`
- JWT expiresIn: `Math.floor(env.REFRESH_TOKEN_EXPIRY / 1000)` (env is ms, JWT wants seconds)
- Cookie: `refreshToken`, httpOnly, path `/api/auth` (scoped), maxAge: `env.REFRESH_TOKEN_EXPIRY` (ms), SameSite=Lax, Secure in prod

**Critical: JWT expiry unit mismatch.** Env vars are in milliseconds (for cookie `maxAge`), but `jsonwebtoken` `expiresIn` expects seconds (number) or duration string ("1h"). Always convert: `Math.floor(ms / 1000)`.

**Critical: Refresh cookie path scoping.** Path `/api/auth` means the browser sends the refresh cookie to `/api/auth/refresh`, `/api/auth/logout`, and `/api/auth/me` — but NOT to other API routes like `/api/leaves`. This scopes exposure to auth endpoints only.

#### Cookie Helper Utility

Create `server/src/utils/auth-cookies.ts` to centralize cookie options. Duplicating cookie options across set/clear calls is a bug magnet — one path mismatch and `clearCookie` silently fails.

```typescript
// server/src/utils/auth-cookies.ts
import { Response } from 'express';
import { env } from '@config/env';

const isProduction = env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/auth',  // scoped to auth routes only (refresh + logout)
};

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  res.cookie('accessToken', tokens.accessToken, {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: env.ACCESS_TOKEN_EXPIRY,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: env.REFRESH_TOKEN_EXPIRY,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
}
```

Controllers call `setAuthCookies(res, tokens)` and `clearAuthCookies(res)` — never construct cookie options inline.

#### JTI Hashing

```typescript
import { createHash, randomUUID } from 'crypto';

function hashJti(jti: string): string {
  return createHash('sha256').update(jti).digest('hex');
}

function generateJti(): string {
  return randomUUID();
}
```

Store HASHED jtis only — never plaintext. This limits exposure if the DB is compromised.

#### Refresh Token Rotation Flow

1. Client sends `POST /api/auth/refresh` (refresh cookie auto-sent by browser — path `/api/auth` matches)
2. Server verifies refresh JWT signature + expiry with `jwt.verify(token, env.JWT_SECRET)`
3. Extract `userId` and `jti` from payload → hash jti
4. **Race-safe atomic rotation** — single query acts as both check and update:
```typescript
const result = await User.findOneAndUpdate(
  { _id: userId, refreshTokenJtis: hashedOldJti },  // precondition: jti must exist
  { $pull: { refreshTokenJtis: hashedOldJti }, $push: { refreshTokenJtis: hashedNewJti } },
  { new: true }
).select('+refreshTokenJtis');  // select: false requires explicit inclusion
```
5. If `result` is null → 401 (jti already rotated/revoked — concurrent or stolen token)
6. Generate new access token + new refresh token (new jti)
7. Set both cookies via `setAuthCookies(res, tokens)`

#### Auth Middleware Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { AppError } from '@utils/app-error';

interface JwtPayload {
  userId: string;
  role: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { _id: decoded.userId, role: decoded.role };
    next();
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
  }
}
```

**Express 5 note:** Route handlers can return/throw promises — the error handler will catch thrown errors without explicit `next(err)`. The `authMiddleware` can throw `AppError` directly.

#### Login Page (Client)

**Component:** `client/src/pages/LoginPage.tsx`
- Use `react-hook-form` + `@hookform/resolvers/zod` with `loginSchema` from shared
- Mobile-first layout: centered card, max-w-sm
- Fields: email (type="email"), password (type="password")
- Submit button: full-width, min-h-[48px], disabled + spinner during submit
- Error: inline red text below form (NOT toast) for auth errors
- No "forgot password" link — admin reset only (see Story 1.6)
- SmartHostel branding above form

**Validation timing:** On blur + on submit. NOT on every keystroke.

**On successful login:**
- Store user in AuthContext
- Navigate to `/` (placeholder — role-specific routing added in Story 1.5)

#### AuthContext Pattern

```typescript
// client/src/context/AuthContext.tsx
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**On mount:** Call `GET /api/auth/me` to check if a session exists (cookies are sent automatically). If 200 → set user. If 401 → user is null (not authenticated).

**`credentials: 'include'`** is REQUIRED on all fetch calls for cookies to be sent cross-origin (even with same-origin proxy, use it for consistency).

### File Structure (New/Modified Files)

```
server/src/
├── models/
│   └── user.model.ts              ★ NEW — User schema + indexes
├── services/
│   ├── auth.service.ts            ★ NEW — login, refresh, logout, generateTokens, hashJti
│   └── auth.service.test.ts       ★ NEW — unit tests (co-located)
├── controllers/
│   └── auth.controller.ts        ★ NEW — login, me, refresh, logout handlers
├── routes/
│   ├── auth.routes.ts             ★ NEW — POST login, GET me, POST refresh, POST logout
│   └── auth.routes.test.ts        ★ NEW — integration tests (co-located)
├── middleware/
│   └── auth.middleware.ts         ★ NEW — JWT verification, req.user attachment
├── utils/
│   └── auth-cookies.ts           ★ NEW — setAuthCookies / clearAuthCookies helper
├── types/
│   └── express.d.ts               ★ NEW — Express Request augmentation for req.user
├── test/
│   └── setup.ts                   ★ NEW — mongodb-memory-server setup for vitest
└── app.ts                         ✏️ MODIFIED — mount auth routes

shared/
├── schemas/
│   └── auth.schema.ts             ★ NEW — loginSchema, LoginInput
└── index.ts                       ✏️ MODIFIED — re-export auth schemas

client/src/
├── pages/
│   └── LoginPage.tsx              ★ NEW — login form
├── context/
│   └── AuthContext.tsx            ★ NEW — auth state management
├── services/
│   └── api.ts                     ★ NEW — apiFetch wrapper
├── App.tsx                        ✏️ MODIFIED — routes for /login + placeholder
└── main.tsx                       ✏️ MODIFIED — wrap with AuthProvider
```

### Testing Requirements

- **Framework:** Vitest + supertest + mongodb-memory-server
- **Co-located tests:** `{file}.test.ts` next to source files
- **Test scripts MUST use `--passWithNoTests`** flag

**auth.service.test.ts — Unit tests:**
- Login with valid credentials → returns user + tokens
- Login with wrong password → throws UNAUTHORIZED
- Login with nonexistent email → throws UNAUTHORIZED
- Login with inactive user (isActive: false) → throws UNAUTHORIZED
- generateTokens → returns valid JWTs with correct payload
- hashJti → returns consistent SHA-256 hex string
- refresh with valid jti → rotates tokens, old jti removed, new jti added
- refresh with invalid jti → throws UNAUTHORIZED
- logout → removes jti from array
- invalidateAllSessions → clears entire jti array

**auth.routes.test.ts — Integration tests:**
- POST /api/auth/login success → 200, user data (no passwordHash), correlationId present
  - Assert `Set-Cookie` headers: `accessToken` (Path=/, HttpOnly, SameSite=Lax) + `refreshToken` (Path=/api/auth, HttpOnly, SameSite=Lax)
  - Assert NO `Secure` flag in test env (NODE_ENV=test)
- POST /api/auth/login invalid → 401, error code UNAUTHORIZED, correlationId present
  - Assert NO `Set-Cookie` header present
- GET /api/auth/me with valid token → 200, user profile (id, name, email, role, hasConsented), correlationId
- GET /api/auth/me without token → 401
- POST /api/auth/refresh with valid refresh → 200, new cookies set (verify both Set-Cookie headers)
- POST /api/auth/refresh with invalid/expired → 401
- POST /api/auth/logout with valid refresh cookie → 200, cookies cleared
- POST /api/auth/logout with no cookies → 200 (idempotent, no error)

**mongodb-memory-server setup:** Create a test helper `server/src/test/setup.ts` that starts MongoMemoryServer before all tests and tears down after. Vitest config should reference this setup file.

### Naming Conventions (MUST follow)

| Element | Convention | Example |
|---------|-----------|---------|
| Mongoose collections | Explicit `{ collection: 'camelCasePlural' }` | `'users'` |
| Mongoose models | PascalCase singular | `User` |
| MongoDB fields | camelCase | `passwordHash`, `refreshTokenJtis` |
| Enum values | UPPER_SNAKE_CASE | `STUDENT`, `WARDEN` |
| API endpoints | `/api/{resource}` plural lowercase | `/api/auth/login` |
| Server files | kebab-case `.ts` | `user.model.ts`, `auth.service.ts` |
| React components | PascalCase `.tsx` | `LoginPage.tsx` |
| React pages | PascalCase + `Page` suffix | `LoginPage.tsx` |
| Zod schemas | `{entity}.schema.ts` in `shared/schemas/` | `auth.schema.ts` |

### Anti-Pattern Prevention

1. **Do NOT store plaintext jtis** — always hash with SHA-256 before DB storage
2. **Do NOT return passwordHash in any API response** — use `.toJSON()` transform on model
3. **Do NOT use localStorage for tokens** — httpOnly cookies only (prevents XSS theft)
4. **Do NOT import User model in controllers** — go through auth.service
5. **Do NOT create separate `__tests__/` directories** — co-locate tests
6. **Do NOT use `console.log`** — use pino logger from Story 1.1
7. **Do NOT invent new error codes** — use only the 7 locked codes
8. **Do NOT forget `credentials: 'include'` on client fetch calls** — cookies won't be sent without it
9. **Do NOT forget to clear cookies with matching options** — `res.clearCookie` requires same path/httpOnly/secure/sameSite as when set
10. **Do NOT use `req.body` without zod validation** — validate all input
11. **Do NOT put login, refresh, or logout behind auth middleware** — login and refresh are public; logout must work even when access token is expired (uses refresh cookie)
12. **Do NOT construct cookie options inline** — use `setAuthCookies` / `clearAuthCookies` from `auth-cookies.ts` to prevent path/option mismatch bugs
13. **Do NOT pass env expiry values directly to `jwt.sign` expiresIn** — env vars are in ms (for cookie maxAge), but jsonwebtoken expects seconds; always convert with `Math.floor(ms / 1000)`

### Cross-Story Context

| Future Story | What 1.2 Provides |
|-------------|-------------------|
| 1.3 (API Standards) | Zod validation pattern on auth routes, standard error response usage |
| 1.4 (RBAC) | Auth middleware (req.user populated), User model with role field |
| 1.5 (Shells) | AuthContext (user + role), login page, session check on mount |
| 1.6 (Account Mgmt) | User model, authService.invalidateAllSessions, hasConsented field |
| 1.7 (Observability) | Auth middleware for protected routes |
| 1.8 (Seed/CI) | User model for seeding test users |
| 1.9 (Password Change) | Auth service pattern, User model passwordHash update |

### Previous Story (1.1) Intelligence

Story 1.1 creates the foundation this story builds on:
- Express app with middleware stack (cookie-parser, correlation ID, pino-http, error handler)
- Mongoose connection (`server/src/config/db.ts`)
- Environment config (`server/src/config/env.ts`) — JWT_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY all validated
- AppError class (`server/src/utils/app-error.ts`) with locked error codes
- Logger (`server/src/utils/logger.ts`) — pino structured logging
- Health route (`/api/health`) already mounted
- Shared workspace with `@smarthostel/shared` — roles.ts, error-codes.ts, api-responses.ts
- Vitest configured in both workspaces with --passWithNoTests
- Path aliases working at runtime (server: tsconfig-paths/register, client: vite-tsconfig-paths)

**Reuse from 1.1:**
- Import `AppError` from `@utils/app-error` for throwing errors
- Import `env` from `@config/env` for JWT_SECRET, token expiry values
- Import `logger` from `@utils/logger` for structured logging
- Import `Role` from `@smarthostel/shared` for role enum values
- Error handler middleware already catches AppError and formats response

### Project Structure Notes

- Auth routes mount at `/api/auth` in `app.ts` — add AFTER existing middleware, BEFORE error handler
- User model is the first Mongoose model — establishes pattern for all subsequent models
- Auth service pattern (generate tokens, hash jti, cookie config) will be reused by refresh flow
- The login page is the first real client page — establishes react-hook-form + zod validation pattern
- AuthContext is minimal now — Story 1.5 will add apiFetch auto-refresh interceptor and role-based routing
- Shared auth schema is the first shared zod schema — establishes the pattern for all domain schemas

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: User Login & JWT Authentication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Auth & Session — JWT Dual-Token Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cookie Configuration]
- [Source: _bmad-output/planning-artifacts/architecture.md#Refresh Token Revocation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Login Page]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Auth + Navigation Cluster]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-and-dev-environment.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- MongoDB `$pull` + `$push` conflict on same field: Cannot combine `$pull` and `$push` on `refreshTokenJtis` in a single `findOneAndUpdate`. Fixed by splitting into two atomic operations.
- Mongoose duplicate index warning: `unique: true` on field definition AND `schema.index({ email: 1 }, { unique: true })` creates a duplicate. Removed the explicit index call since `unique: true` on the field already creates it.
- Mongoose 9.x deprecation: `{ new: true }` replaced with `{ returnDocument: 'after' }` for `findOneAndUpdate`.

### Completion Notes List

- All 11 tasks implemented across server, client, and shared workspaces
- 27 tests passing (3 test files: app.test.ts, auth.service.test.ts, auth.routes.test.ts)
- Lint clean (0 errors, 0 warnings)
- Controller → Service → Model layering strictly enforced (controllers never import models)
- Cookie helper utility centralizes all cookie options to prevent path mismatch bugs
- Refresh token rotation uses two-step atomic operation (pull old jti, then push new jti) to avoid MongoDB update conflict
- Express Request augmented via `declare module 'express-serve-static-core'` in types/express.d.ts
- JWT expiry correctly converted from ms (env) to seconds (jsonwebtoken)

### File List

**New files:**
- `server/src/models/user.model.ts` — User Mongoose schema with indexes and toJSON transform
- `server/src/services/auth.service.ts` — login, refresh, logout, invalidateAllSessions, getProfile, generateTokens, hashJti
- `server/src/services/auth.service.test.ts` — 16 unit tests for auth service
- `server/src/controllers/auth.controller.ts` — login, me, refresh, logout HTTP handlers
- `server/src/routes/auth.routes.ts` — POST /login, GET /me, POST /refresh, POST /logout
- `server/src/routes/auth.routes.test.ts` — 11 integration tests with supertest
- `server/src/middleware/auth.middleware.ts` — JWT access token verification, req.user attachment
- `server/src/utils/auth-cookies.ts` — setAuthCookies / clearAuthCookies helper
- `server/src/types/express.d.ts` — Express Request augmentation for req.user
- `server/src/test/setup.ts` — MongoMemoryServer vitest setup
- `shared/schemas/auth.schema.ts` — loginSchema, LoginInput zod schema
- `client/src/pages/LoginPage.tsx` — Login form with react-hook-form + zod
- `client/src/context/AuthContext.tsx` — AuthProvider component with session check on mount
- `client/src/context/auth-context-value.ts` — AuthContext, UserProfile and AuthContextType definitions
- `client/src/hooks/useAuth.ts` — useAuth hook (separated for react-refresh compliance)
- `client/src/services/api.ts` — apiFetch wrapper with credentials: 'include'

**Modified files:**
- `server/src/app.ts` — mounted auth routes at /api/auth
- `server/vitest.config.ts` — added setupFiles for MongoMemoryServer
- `shared/index.ts` — re-exported loginSchema, LoginInput
- `client/src/App.tsx` — added react-router-dom routes (/login, / with guard)
- `client/src/main.tsx` — wrapped App with AuthProvider

### Change Log

| Change | Reason |
|--------|--------|
| Split refresh `$pull/$push` into two operations | MongoDB does not allow `$pull` and `$push` on the same field in a single update |
| Removed duplicate `userSchema.index({ email: 1 })` | `unique: true` on field definition already creates the index |
| Used `{ returnDocument: 'after' }` instead of `{ new: true }` | Mongoose 9.x deprecation |
| Added `getProfile()` to auth service | Controller must not import User model directly |
| Removed unused imports from auth.routes.test.ts | Lint errors (jwt, env, authService were unused) |
| [Review] Added timing attack mitigation to login | Always run bcrypt.compare against dummy hash when user not found |
| [Review] Added correlationId to all service-level pino logs | Architecture requires correlationId on every log entry |
| [Review] Added refresh token replay integration test | Verify old token returns 401 after rotation — security-critical |
| [Review] Removed unnecessary `.select('+refreshTokenJtis')` from login | Login doesn't need to read the jtis array |
| [Review] Typed UserProfile.role as Role enum instead of string | Type safety for role-based routing in future stories |
| [Review] Fixed cookie value extraction to use indexOf('=') | Prevents truncation of values containing '=' characters |
| [Review] Added cookie-clearing assertions to logout test | Verify Set-Cookie headers expire cookies at HTTP level |
| [Review] Split AuthContext into separate files | react-refresh lint rule requires contexts separate from components |
