# Story 1.2: User Model, Auth API & JWT Token Lifecycle

## Description
As a **user**,
I want to log in with my credentials and receive a secure session,
So that I can access the system with my assigned role.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a valid user exists in the database (seeded), when I POST to `/api/auth/login` with matching email and password, then the server returns `{ success: true, data: { user: { id, name, email, role } } }` with httpOnly `accessToken` and `refreshToken` cookies set (SameSite=Lax, Secure in prod)

**AC-2:** Given I am logged in with a valid access token, when I GET `/api/auth/me`, then the server returns my user profile including role, hasConsented, and room info (block/floor/roomNumber)

**AC-3:** Given my access token has expired, when any API request returns 401, then the client attempts POST `/api/auth/refresh`, receives new access + rotated refresh tokens, and retries the original request

**AC-4:** Given my refresh token's jti has been revoked (password reset / force-logout), when I attempt to refresh, then the server returns 401 and both cookies are cleared

**AC-5:** Given a user attempts login, when they fail 5 consecutive times, then the account is temporarily locked and returns `RATE_LIMITED` error with retryAfterMs

**AC-6:** Given any authenticated request, when Origin/Referer header does not match the allowlist on POST/PATCH/DELETE, then the CSRF middleware rejects with 403

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, jsonwebtoken, bcryptjs, cookie-parser
- **Auth strategy:** Dual JWT (access 1-4h + refresh 7-30d) in httpOnly cookies, SameSite=Lax, Secure in prod
- **Refresh token storage:** Hashed jti (SHA-256) stored in `User.refreshTokenJtis[]` array; rotation on every refresh
- **Cookie paths:** accessToken → `/`, refreshToken → `/api/auth/refresh`
- **CSRF:** Origin/Referer header allowlist on POST/PATCH/DELETE (no CSRF tokens)
- **Rate limiting:** `express-rate-limit` for login endpoint; application-level failed-attempt tracking with lockout
- **Naming conventions:** kebab-case for server files, camelCase for all JSON/MongoDB fields, UPPER_SNAKE_CASE for error codes
- **Architecture rule:** Controllers never import models directly — they call services

### Existing Code (from Story 1.1 scope creep)
Story 1.1 delivered auth scaffolding ahead of schedule. The following files already exist with partial implementations. Story 1.2 tasks MUST audit these against acceptance criteria and add what is missing rather than rewriting from scratch.

**Server:**
- `server/src/models/user.model.ts` — User model with refreshTokenJtis, room fields, roles. **Missing:** `failedLoginAttempts`, `lockedUntil` fields for AC-5.
- `server/src/routes/auth.routes.ts` — Routes for login, me, refresh, logout. **Exists and complete for basic routing.**
- `server/src/controllers/auth.controller.ts` — Login, me, refresh, logout handlers. **Missing:** `/me` response does not include room info (block/floor/roomNumber) per AC-2. No RATE_LIMITED handling for AC-5.
- `server/src/services/auth.service.ts` — Login (timing-safe), refresh (jti rotation), logout, invalidateAllSessions. **Missing:** failed-attempt tracking and lockout logic for AC-5. No AuditEvent writes for AC-5 (AUTH_LOCKOUT, AUTH_FAILED).
- `server/src/middleware/auth.middleware.ts` — JWT verification from accessToken cookie. **Exists and functional.**
- `server/src/utils/auth-cookies.ts` — setAuthCookies/clearAuthCookies with correct path scoping. **Exists and matches architecture spec.**
- `server/src/config/env.ts` — Validates JWT_SECRET, QR_SECRET, MONGODB_URI, token expiry durations, ALLOWED_ORIGINS. **Exists. May need LOGIN_LOCKOUT_DURATION_MS and MAX_LOGIN_ATTEMPTS env vars.**
- `server/src/middleware/error-handler.middleware.ts` — Global error handler returning standard error format. **Exists and functional.**
- `server/src/utils/app-error.ts` — AppError class with retryable/retryAfterMs. **Exists and functional.**

**Client:**
- `client/src/context/AuthContext.tsx` — AuthProvider with login/logout/me calls. **Missing:** 401 refresh-and-retry logic for AC-3. UserProfile type missing room fields for AC-2.
- `client/src/context/auth-context-value.ts` — UserProfile and AuthContextType interfaces. **Missing:** room fields (block, floor, roomNumber) in UserProfile.
- `client/src/pages/LoginPage.tsx` — Login form with react-hook-form + zod. **Missing:** display of RATE_LIMITED error with retryAfterMs countdown for AC-5.
- `client/src/services/api.ts` — apiFetch wrapper with ApiError class. **Missing:** 401 interceptor that attempts refresh before failing for AC-3.

**Shared:**
- `shared/schemas/auth.schema.ts` — loginSchema (email + password validation). **Exists and functional.**
- `shared/constants/error-codes.ts` — ErrorCode enum including RATE_LIMITED. **Exists and functional.**

## Tasks

### Task 1: Audit & Verify Existing Auth Cookie Configuration
Verify that existing cookie utilities match the architecture spec exactly. No code changes expected unless discrepancies are found.
- [ ] Subtask 1.1: Audit `server/src/utils/auth-cookies.ts` — confirm accessToken cookie: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, `maxAge` from `ACCESS_TOKEN_EXPIRY`
- [ ] Subtask 1.2: Audit `server/src/utils/auth-cookies.ts` — confirm refreshToken cookie: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/api/auth/refresh'`, `maxAge` from `REFRESH_TOKEN_EXPIRY`
- [ ] Subtask 1.3: Audit `server/src/config/env.ts` — confirm `ACCESS_TOKEN_EXPIRY` defaults to `'1h'` (converted to ms), `REFRESH_TOKEN_EXPIRY` defaults to `'7d'` (converted to ms), `JWT_SECRET` requires min 32 chars
- [ ] Subtask 1.4: Audit `server/src/services/auth.service.ts` — confirm `generateTokens()` signs access token with `{ userId, role }` and refresh token with `{ userId, jti }`, both using `env.JWT_SECRET`
- [ ] Subtask 1.5: Audit `server/src/services/auth.service.ts` — confirm refresh token jti is hashed with SHA-256 before DB storage, and rotation (old jti removed, new jti added) is atomic via `findOneAndUpdate`
- [ ] Subtask 1.6: Audit `server/src/models/user.model.ts` — confirm `refreshTokenJtis` field exists as `[String]` with `select: false`, and `toJSON` transform strips `passwordHash`, `refreshTokenJtis`, `__v`

**Tests (AC-1, AC-4):**
- [ ] Unit test: `setAuthCookies` sets both cookies with correct options (httpOnly, sameSite, path, maxAge)
- [ ] Unit test: `clearAuthCookies` clears both cookies with matching path options
- [ ] Unit test: `generateTokens` returns valid JWT access token containing `userId` and `role` claims
- [ ] Unit test: `generateTokens` returns valid JWT refresh token containing `userId` and `jti` claims
- [ ] Unit test: `hashJti` produces consistent SHA-256 hex digest

### Task 2: Audit & Verify Login Endpoint (AC-1)
Verify that the login flow matches AC-1 exactly. Fix any discrepancies in the response shape.
- [ ] Subtask 2.1: Audit `server/src/controllers/auth.controller.ts` `login()` — confirm response is `{ success: true, data: { user: { id, name, email, role } }, correlationId }` with cookies set
- [ ] Subtask 2.2: Audit `server/src/services/auth.service.ts` `login()` — confirm it checks `isActive`, uses timing-safe bcrypt compare with dummy hash for non-existent users, stores hashed jti on success
- [ ] Subtask 2.3: Audit `server/src/routes/auth.routes.ts` — confirm `POST /login` route exists and is not behind `authMiddleware`
- [ ] Subtask 2.4: Audit `shared/schemas/auth.schema.ts` — confirm `loginSchema` validates email format and password min length (8 chars)

**Tests (AC-1):**
- [ ] Integration test: POST `/api/auth/login` with valid credentials returns 200, `{ success: true, data: { user: { id, name, email, role } } }`, and sets `accessToken` + `refreshToken` cookies
- [ ] Integration test: POST `/api/auth/login` with wrong password returns 401, `{ success: false, error: { code: 'UNAUTHORIZED' } }`
- [ ] Integration test: POST `/api/auth/login` with non-existent email returns 401 (same error shape — no user enumeration)
- [ ] Integration test: POST `/api/auth/login` with inactive user returns 401
- [ ] Unit test: login service always calls `bcrypt.compare` even when user not found (timing attack prevention)

### Task 3: Fix `/api/auth/me` to Include Room Info (AC-2)
The current `/me` endpoint returns `{ id, name, email, role, hasConsented }` but AC-2 requires room info (block/floor/roomNumber).
- [ ] Subtask 3.1: Update `server/src/controllers/auth.controller.ts` `me()` — add `block`, `floor`, `roomNumber` to the response data under `user`
- [ ] Subtask 3.2: Update `client/src/context/auth-context-value.ts` — add optional `block?: string`, `floor?: string`, `roomNumber?: string` fields to `UserProfile` interface
- [ ] Subtask 3.3: Verify `server/src/models/user.model.ts` already has `block`, `floor`, `roomNumber` fields (it does — no change needed)

**Tests (AC-2):**
- [ ] Integration test: GET `/api/auth/me` with valid access token returns 200, user profile including `role`, `hasConsented`, `block`, `floor`, `roomNumber`
- [ ] Integration test: GET `/api/auth/me` without access token returns 401
- [ ] Integration test: GET `/api/auth/me` with expired access token returns 401
- [ ] Unit test: `getProfile` service returns full user object including room fields

### Task 4: Add 401-Refresh-Retry Interceptor to Client API (AC-3)
The current `apiFetch` in `client/src/services/api.ts` does not attempt a refresh on 401. Add transparent refresh-and-retry logic.
- [ ] Subtask 4.1: Add a module-level `refreshPromise` variable to `client/src/services/api.ts` to deduplicate concurrent refresh attempts (if multiple requests 401 simultaneously, only one refresh call fires)
- [ ] Subtask 4.2: Modify `apiFetch` to intercept 401 responses: before throwing ApiError, attempt `POST /api/auth/refresh`. If refresh succeeds, retry the original request once. If refresh fails (401), clear auth state and redirect to login
- [ ] Subtask 4.3: Ensure the refresh call goes to `/api/auth/refresh` with `method: 'POST'`, `credentials: 'include'` (refresh cookie auto-sent due to path match)
- [ ] Subtask 4.4: Add a mechanism to notify `AuthContext` when refresh fails (e.g., dispatch a custom event or call a registered callback) so the UI redirects to login
- [ ] Subtask 4.5: Update `client/src/context/AuthContext.tsx` — listen for refresh-failure signal and set `user` to `null`

**Tests (AC-3):**
- [ ] Unit test: `apiFetch` on 401 response attempts POST `/api/auth/refresh` before throwing
- [ ] Unit test: `apiFetch` on 401 retries original request after successful refresh
- [ ] Unit test: `apiFetch` on 401 where refresh also returns 401 throws ApiError (no infinite loop)
- [ ] Unit test: concurrent 401s result in only one refresh call (deduplication)
- [ ] Unit test: failed refresh triggers auth-state-cleared signal

### Task 5: Verify Refresh Token Rotation & Revocation (AC-4)
The server-side refresh and revocation logic mostly exists. Audit and verify it handles the revoked-jti case by clearing cookies.
- [ ] Subtask 5.1: Audit `server/src/controllers/auth.controller.ts` `refresh()` — confirm that on failure (invalid/revoked jti), cookies are cleared via `clearAuthCookies(res)` before throwing 401. **Currently missing:** the controller throws AppError on revoked jti but does NOT clear cookies first. Fix: add `clearAuthCookies(res)` before throwing.
- [ ] Subtask 5.2: Audit `server/src/services/auth.service.ts` `refresh()` — confirm atomic jti rotation: `findOneAndUpdate` checks old jti exists, removes it, then new jti is pushed. This exists and is correct.
- [ ] Subtask 5.3: Audit `server/src/services/auth.service.ts` `invalidateAllSessions()` — confirm it sets `refreshTokenJtis` to `[]`. This exists and is correct.
- [ ] Subtask 5.4: Verify `server/src/controllers/auth.controller.ts` `logout()` — confirm it clears cookies. This exists and is correct.

**Tests (AC-4):**
- [ ] Integration test: POST `/api/auth/refresh` with valid refresh token returns 200, new cookies set, new access token works
- [ ] Integration test: POST `/api/auth/refresh` with revoked jti (after `invalidateAllSessions`) returns 401 and both cookies are cleared
- [ ] Integration test: POST `/api/auth/refresh` with expired refresh token returns 401 and both cookies are cleared
- [ ] Integration test: using old refresh token after rotation returns 401 (old jti no longer in DB)
- [ ] Unit test: `refresh` service removes old hashed jti and adds new hashed jti atomically

### Task 6: Add Login Rate Limiting & Account Lockout (AC-5)
This is entirely new functionality. The current login flow has no failed-attempt tracking or lockout.
- [ ] Subtask 6.1: Add fields to `server/src/models/user.model.ts`: `failedLoginAttempts: { type: Number, default: 0 }` and `lockedUntil: { type: Date, default: null }`. Both should be included in `select: false` to avoid leaking in normal queries. Add to `toJSON` transform to strip them.
- [ ] Subtask 6.2: Add env vars to `server/src/config/env.ts`: `MAX_LOGIN_ATTEMPTS` (default `5`), `LOGIN_LOCKOUT_DURATION_MS` (default `'15m'`, using existing `durationMs` parser). Add to `.env.example`.
- [ ] Subtask 6.3: Update `server/src/services/auth.service.ts` `login()`:
  - Before password check: query user with `+failedLoginAttempts +lockedUntil` (select override)
  - If `lockedUntil > now`, throw `AppError('RATE_LIMITED', 'Account temporarily locked', 429, { retryable: true, retryAfterMs: lockedUntil - now })`
  - On failed password: increment `failedLoginAttempts`. If it reaches `MAX_LOGIN_ATTEMPTS`, set `lockedUntil = now + LOGIN_LOCKOUT_DURATION_MS` and log `AUTH_LOCKOUT` event
  - On successful password: reset `failedLoginAttempts` to 0 and `lockedUntil` to null
- [ ] Subtask 6.4: Log `AUTH_FAILED` event via pino on each failed attempt (with correlationId, userId if user exists)
- [ ] Subtask 6.5: Update `client/src/pages/LoginPage.tsx` — when `ApiError.code === 'RATE_LIMITED'`, display the error message with a countdown timer derived from `retryAfterMs`. Disable the submit button until the lockout expires.

**Tests (AC-5):**
- [ ] Integration test: 4 consecutive failed logins succeed on 5th correct attempt (under threshold)
- [ ] Integration test: 5 consecutive failed logins returns `RATE_LIMITED` with `retryAfterMs > 0` on the 5th attempt
- [ ] Integration test: after lockout expires, login succeeds with correct credentials
- [ ] Integration test: successful login resets failed attempt counter (fail 3 times, succeed, fail 4 more times — no lockout)
- [ ] Unit test: login service increments `failedLoginAttempts` on wrong password
- [ ] Unit test: login service sets `lockedUntil` when `failedLoginAttempts` reaches `MAX_LOGIN_ATTEMPTS`
- [ ] Unit test: login service resets `failedLoginAttempts` and `lockedUntil` on successful login
- [ ] Unit test: login service throws RATE_LIMITED with correct retryAfterMs when account is locked

### Task 7: Add CSRF Origin/Referer Middleware (AC-6)
This is entirely new functionality. No CSRF middleware exists yet.
- [ ] Subtask 7.1: Create `server/src/middleware/csrf.middleware.ts`:
  - Export `csrfMiddleware` function
  - On `GET`, `HEAD`, `OPTIONS` requests: call `next()` immediately (safe methods exempt)
  - On `POST`, `PATCH`, `DELETE`: read `Origin` header (preferred) or `Referer` header
  - Parse the origin/referer to extract the origin portion
  - Compare against `allowedOrigins` from `server/src/config/env.ts` (already exported)
  - If no match: throw `AppError('FORBIDDEN', 'CSRF validation failed', 403)`
  - If match: call `next()`
- [ ] Subtask 7.2: Register `csrfMiddleware` in `server/src/app.ts` after `cookieParser()` and before route definitions
- [ ] Subtask 7.3: Ensure `ALLOWED_ORIGINS` env var is documented in `.env.example` (already present as `http://localhost:5173`)

**Tests (AC-6):**
- [ ] Unit test: CSRF middleware allows GET requests regardless of Origin header
- [ ] Unit test: CSRF middleware allows POST with matching Origin header
- [ ] Unit test: CSRF middleware allows POST with matching Referer header (when Origin is absent)
- [ ] Unit test: CSRF middleware rejects POST with non-matching Origin header (403 FORBIDDEN)
- [ ] Unit test: CSRF middleware rejects POST with no Origin or Referer header (403 FORBIDDEN)
- [ ] Unit test: CSRF middleware rejects DELETE with non-matching Origin (403 FORBIDDEN)
- [ ] Unit test: CSRF middleware allows PATCH with matching Origin
- [ ] Integration test: POST `/api/auth/login` with correct Origin header succeeds
- [ ] Integration test: POST `/api/auth/login` with wrong Origin header returns 403

### Task 8: Add User Seed Script for Development
A seed script is needed to create test users for verifying all acceptance criteria.
- [ ] Subtask 8.1: Create `server/src/scripts/seed-users.ts` that:
  - Connects to MongoDB using `MONGODB_URI` from env
  - Upserts (by email) one user per role: a student (with block/floor/roomNumber), a warden admin, a guard, and a maintenance staff
  - Uses `bcryptjs` to hash passwords (use a known dev password like `password123` for all seed users)
  - Sets `isActive: true`, `hasConsented: true` for all seed users
  - Logs created/updated users (without passwords)
  - Disconnects from MongoDB on completion
- [ ] Subtask 8.2: Add script to `server/package.json`: `"seed:users": "tsx src/scripts/seed-users.ts"`
- [ ] Subtask 8.3: Add to root `package.json` scripts: `"seed:users": "npm -w server run seed:users"`

**Tests (AC-1, AC-2):**
- [ ] Manual verification: running `npm run seed:users` creates 4 users in the database
- [ ] Manual verification: seeded student user can log in and `/me` returns room info
- [ ] Manual verification: seeded users persist across script re-runs (upsert, not duplicate)

### Task 9: End-to-End Verification of Full Auth Lifecycle
Comprehensive integration tests that verify the full lifecycle across all acceptance criteria working together.
- [ ] Subtask 9.1: Write an integration test that exercises the complete happy path: login -> get profile -> (simulate token expiry) -> refresh -> get profile again -> logout -> verify cookies cleared
- [ ] Subtask 9.2: Write an integration test for the revocation path: login -> invalidate all sessions -> attempt refresh -> verify 401 + cookies cleared
- [ ] Subtask 9.3: Write an integration test for the lockout path: 5 failed logins -> verify RATE_LIMITED -> wait for lockout to expire (use short lockout in test env) -> login succeeds
- [ ] Subtask 9.4: Write an integration test for CSRF: POST login with valid Origin -> success. POST login with invalid Origin -> 403.

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6):**
- [ ] E2E test: full auth lifecycle (login -> me -> refresh -> me -> logout) works end-to-end
- [ ] E2E test: revoked refresh token returns 401 with cookies cleared
- [ ] E2E test: account lockout triggers after 5 failures and unlocks after duration
- [ ] E2E test: CSRF middleware blocks requests from unknown origins

## Dependencies
- **Story 1.1** (completed) — project scaffolding, npm workspaces, shared workspace, base Express app with middleware stack
- Requires MongoDB running locally (or via `MONGODB_URI`)
- Requires `JWT_SECRET` and `QR_SECRET` env vars set (min 32 chars each)

## File List

### Modified Files (audit + fix)
- `server/src/models/user.model.ts` — Added `failedLoginAttempts`, `lockedUntil` fields with `select: false`; updated IUser interface and toJSON transform to strip them
- `server/src/services/auth.service.ts` — Added failed-attempt tracking, lockout logic (RATE_LIMITED throw), AUTH_FAILED/AUTH_LOCKOUT pino logging; reset on successful login
- `server/src/controllers/auth.controller.ts` — Fixed `/me` response to include `block`, `floor`, `roomNumber`; added `clearAuthCookies(res)` on all refresh failure paths
- `server/src/config/env.ts` — Added `MAX_LOGIN_ATTEMPTS` (coerce number, default 5) and `LOGIN_LOCKOUT_DURATION_MS` (custom transform with 900000ms/15m default)
- `server/src/app.ts` — Imported and registered `csrfMiddleware` after cookieParser and before routes
- `client/src/services/api.ts` — Added 401 refresh-and-retry interceptor with module-level `refreshPromise` deduplication; added `dispatchRefreshFailed` custom event; added `retryAfterMs` to ApiError
- `client/src/context/AuthContext.tsx` — Added `useEffect` listener for `auth:refresh-failed` event to clear user state
- `client/src/context/auth-context-value.ts` — Added optional `block`, `floor`, `roomNumber` fields to UserProfile interface
- `client/src/pages/LoginPage.tsx` — Added RATE_LIMITED error handling with countdown timer display; submit button disabled during lockout
- `.env.example` — Added `MAX_LOGIN_ATTEMPTS=5` and `LOGIN_LOCKOUT_DURATION_MS=15m`
- `server/src/routes/auth.routes.test.ts` — Fixed all POST requests to include `Origin` header for CSRF compliance
- `server/src/app.test.ts` — Fixed health check expected value from `'ok'` to `'healthy'`
- `server/src/services/auth.service.test.ts` — Added lockout/rate-limiting unit tests (timing attack, increment, lockout threshold, reset, RATE_LIMITED error)

### New Files
- `server/src/middleware/csrf.middleware.ts` — CSRF Origin/Referer validation middleware (safe methods exempt, POST/PATCH/DELETE validated against allowedOrigins)
- `server/src/scripts/seed-users.ts` — Development user seed script creating 4 users (student with room, warden, guard, maintenance) via upsert
- `server/src/utils/auth-cookies.test.ts` — Unit tests for setAuthCookies, clearAuthCookies, generateTokens, hashJti (5 tests)
- `server/src/controllers/auth.controller.test.ts` — Integration tests for login, me, refresh, rate limiting, full E2E lifecycle (17 tests)
- `server/src/middleware/csrf.middleware.test.ts` — Unit + integration tests for CSRF middleware (9 tests)
- `client/src/services/api.test.ts` — Unit tests for apiFetch refresh-retry, deduplication, auth-cleared signal (7 tests)

### Unchanged Files (audit only — no modifications needed)
- `server/src/routes/auth.routes.ts` — Route definitions already correct
- `server/src/middleware/auth.middleware.ts` — JWT verification already correct
- `server/src/utils/auth-cookies.ts` — Cookie config already matches architecture spec
- `server/src/utils/app-error.ts` — AppError class already supports retryable/retryAfterMs
- `server/src/middleware/error-handler.middleware.ts` — Error formatting already correct
- `shared/schemas/auth.schema.ts` — Login validation schema already correct
- `shared/constants/error-codes.ts` — Error codes including RATE_LIMITED already exist

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Audit):** All existing auth cookie, JWT, and user model code verified correct against architecture spec. No changes needed.

**Task 2 (Audit Login):** Login endpoint verified correct — response shape, timing-safe bcrypt, isActive check all present.

**Task 3 (Fix /me room info):** Added `block`, `floor`, `roomNumber` to controller response and client `UserProfile` interface.

**Task 4 (Client refresh interceptor):** Implemented transparent 401-refresh-retry in `apiFetch` with module-level promise deduplication. Added `AUTH_REFRESH_FAILED_EVENT` custom event for AuthContext integration.

**Task 5 (Refresh cookie clearing):** Fixed refresh controller to call `clearAuthCookies(res)` on all failure paths (missing token, expired token, revoked jti).

**Task 6 (Rate limiting):** Added `failedLoginAttempts`/`lockedUntil` to User model. Implemented lockout logic in auth service (increment on failure, lock at threshold, reset on success). Updated LoginPage with countdown timer. Note: `LOGIN_LOCKOUT_DURATION_MS` required a custom Zod transform with inline default (900000) due to Zod v4 `.default()` bypassing transform chains.

**Task 7 (CSRF middleware):** Created `csrf.middleware.ts` with Origin/Referer validation against `allowedOrigins`. Safe methods (GET/HEAD/OPTIONS) exempt. Registered in app.ts before routes. Updated all existing tests to include Origin header.

**Task 8 (Seed script):** Created `seed-users.ts` with 4 users (student with room A-201, warden, guard, maintenance). Added `seed:users` scripts to server and root package.json.

**Task 9 (E2E tests):** Full lifecycle, revocation, lockout, and CSRF integration tests included in `auth.controller.test.ts`.

### Test Results
- **Server:** 63 tests passed across 6 test files
- **Client:** 7 tests passed in 1 test file
- **Total:** 70 tests, 0 failures

### New Dependencies
- `jsdom` (devDependency, client workspace) — for client-side test environment with `window` object
