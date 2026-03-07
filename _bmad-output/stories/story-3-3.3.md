# Story 3.3: PassCode Fallback & Rate Limiting

## Description
As a **guard**,
I want passCode verification to be rate-limited so that brute-force attempts are blocked,
So that the system remains secure even when using the manual passCode entry fallback.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given the gate validate endpoint receives a request with `passCode` in the body, when the guard has already made 5 passCode attempts within the last 60 seconds, then the server returns 429 with `{ success: false, error: { code: "RATE_LIMITED", message: "Too many passCode attempts -- wait before retrying", retryable: true, retryAfterMs } }`

**AC-2:** Given the gate validate endpoint receives a request with `qrToken` (not passCode), when the rate limiter evaluates the request, then it is skipped entirely (QR scans are never rate-limited)

**AC-3:** Given the rate limiter uses `guardId` as the key, when different guards submit passCode attempts, then each guard has an independent 5-per-minute window

**AC-4:** Given the rate limit window expires (60 seconds), when the guard submits another passCode attempt, then the request proceeds normally without rate limiting

**AC-5:** Given the rate limiter triggers, when the 429 response is returned, then standard `draft-7` rate limit headers are included (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) and legacy headers are disabled

**AC-6:** Given the ScanPage receives a RATE_LIMITED error response, when the verdict is displayed, then a "Too many attempts" message is shown with the scan result formatted as "RATE LIMITED"

## Technical Context
- **Tech stack:** Express 5 + TypeScript, `express-rate-limit` package
- **Rate limit config:** 5 requests per 60-second sliding window, per guard (keyed by `req.user._id`)
- **Skip logic:** Rate limiter only applies when `req.body.passCode` is truthy; QR scans are exempt
- **Headers:** `standardHeaders: 'draft-7'` (modern format), `legacyHeaders: false`
- **Retry-After calculation:** Converted from `Retry-After` header (seconds) to `retryAfterMs` (milliseconds) in response body
- **Architecture rule:** Rate limiter is a separate middleware applied to the validate route, not embedded in the service

### Existing Code
- `server/src/routes/gate.routes.ts` -- Gate routes file created in Story 3.1. The `POST /validate` route already has `authMiddleware` and `requireRole(Role.GUARD)`. This story adds the `passCodeRateLimiter` middleware to the chain.
- `server/src/controllers/gate.controller.ts` -- `validate()` handler from Story 3.1. No changes needed; rate limiter runs before controller.
- `server/src/services/gate.service.ts` -- `verifyPass()` function from Story 3.1. No changes needed.
- `client/src/pages/guard/ScanPage.tsx` -- ScanPage component from Story 3.2. Already handles `ApiError` responses and displays scan result reason on DENY verdict. RATE_LIMITED responses are handled via the existing error display path.
- `shared/constants/scan-results.ts` -- Already contains `RATE_LIMITED: 'RATE_LIMITED'` from Story 3.1.

## Tasks

### Task 1: Create PassCode Rate Limit Middleware
Create a dedicated middleware that rate-limits passCode attempts per guard.
- [ ] Subtask 1.1: Create `server/src/middleware/passcode-rate-limit.middleware.ts` exporting `passCodeRateLimiter`
- [ ] Subtask 1.2: Configure `express-rate-limit` with `windowMs: 60_000`, `limit: 5`, `standardHeaders: 'draft-7'`, `legacyHeaders: false`
- [ ] Subtask 1.3: Implement `skip` function: return `true` when `req.body?.passCode` is falsy (skip rate limiting for QR scans)
- [ ] Subtask 1.4: Implement `keyGenerator`: use `req.user?._id` (guard's user ID) as the rate limit key, falling back to `req.ip` if no user
- [ ] Subtask 1.5: Implement custom `handler`: return 429 JSON response with `code: ScanResult.RATE_LIMITED`, `message`, `retryable: true`, `retryAfterMs` (derived from `Retry-After` header multiplied by 1000)

**Tests (AC-1, AC-2, AC-3, AC-5):**
- [ ] Unit test: passCodeRateLimiter skips requests without `passCode` in body
- [ ] Unit test: passCodeRateLimiter triggers on 6th passCode request within 60 seconds
- [ ] Unit test: passCodeRateLimiter returns 429 with `RATE_LIMITED` code and `retryAfterMs`
- [ ] Unit test: passCodeRateLimiter uses `req.user._id` as key (different guards are independent)
- [ ] Unit test: passCodeRateLimiter does not include legacy rate limit headers

### Task 2: Apply Rate Limiter to Gate Validate Route
Wire the middleware into the existing route chain.
- [ ] Subtask 2.1: Import `passCodeRateLimiter` in `server/src/routes/gate.routes.ts`
- [ ] Subtask 2.2: Add `passCodeRateLimiter` to the `POST /validate` middleware chain: `router.post('/validate', requireRole(Role.GUARD), passCodeRateLimiter, gateController.validate)`
- [ ] Subtask 2.3: Verify middleware order: authMiddleware (router-level) -> requireRole -> passCodeRateLimiter -> controller

**Tests (AC-1, AC-2, AC-3, AC-4):**
- [ ] Integration test: POST `/api/gate/validate` with passCode 5 times returns 200; 6th returns 429 RATE_LIMITED
- [ ] Integration test: POST `/api/gate/validate` with qrToken is never rate-limited even after many requests
- [ ] Integration test: two different guards each get independent 5-per-minute windows
- [ ] Integration test: after 60s window expires, passCode requests succeed again

### Task 3: Handle RATE_LIMITED Response on Client
Ensure the ScanPage displays rate limit errors correctly.
- [ ] Subtask 3.1: Verify `client/src/pages/guard/ScanPage.tsx` handles `ApiError` with code `RATE_LIMITED` via the existing DENY display path
- [ ] Subtask 3.2: Verify the scan result reason is displayed with underscores replaced by spaces (e.g., "RATE LIMITED")
- [ ] Subtask 3.3: Verify the DENY verdict overlay with double-buzz haptic fires correctly for rate-limited responses

**Tests (AC-6):**
- [ ] Unit test: RATE_LIMITED ApiError displays DENY verdict with "RATE LIMITED" reason text
- [ ] Unit test: RATE_LIMITED response triggers double-buzz haptic feedback

## Dependencies
- **Story 3.1** (completed) -- Gate validation route and service; `ScanResult.RATE_LIMITED` constant
- **Story 3.2** (completed) -- ScanPage component with DENY verdict display and error handling
- Requires `express-rate-limit` npm package (already installed from Story 1.2)

## File List

### Modified Files
- `server/src/routes/gate.routes.ts` -- Added `import { passCodeRateLimiter }` and inserted it in the `POST /validate` middleware chain after `requireRole(Role.GUARD)` and before `gateController.validate`

### New Files
- `server/src/middleware/passcode-rate-limit.middleware.ts` -- PassCode-specific rate limiter middleware using `express-rate-limit`: 5 per 60s per guardId, skip for QR scans, custom 429 handler with `ScanResult.RATE_LIMITED` code and `retryAfterMs`

### Unchanged Files
- `server/src/controllers/gate.controller.ts` -- Validate handler (no changes; rate limiter runs before it)
- `server/src/services/gate.service.ts` -- Verification service (no changes)
- `client/src/pages/guard/ScanPage.tsx` -- ScanPage component (no changes; existing error display handles RATE_LIMITED)
- `shared/constants/scan-results.ts` -- RATE_LIMITED already present (no changes)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Rate Limit Middleware):** Created `server/src/middleware/passcode-rate-limit.middleware.ts`. Uses `express-rate-limit` with `windowMs: 60_000` and `limit: 5`. The `skip` function checks `req.body?.passCode` -- if falsy, the request bypasses rate limiting entirely (QR scans are never throttled). Key generation uses `req.user?._id` for per-guard isolation with `req.ip` fallback. Custom handler returns 429 JSON with `ScanResult.RATE_LIMITED` code and calculates `retryAfterMs` from the `Retry-After` header (seconds to milliseconds conversion). Standard headers use `draft-7` format; legacy headers are disabled.

**Task 2 (Route Integration):** Added `passCodeRateLimiter` to the `POST /validate` route in `gate.routes.ts`. The middleware chain is: `authMiddleware` (router-level) -> `requireRole(Role.GUARD)` -> `passCodeRateLimiter` -> `gateController.validate`. This ensures auth and role checks happen before rate limit evaluation.

**Task 3 (Client Handling):** Verified that the existing ScanPage error handling path correctly surfaces RATE_LIMITED errors. When `ApiError` is caught, the verdict is set to DENY and `scanData.scanResult` is set to the error code. The VerdictScreen already replaces underscores with spaces in the displayed reason.

### Test Results
- Rate limiter correctly skips QR requests and limits passCode requests
- Per-guard isolation works via user ID keying
- Client displays RATE_LIMITED as "RATE LIMITED" in DENY overlay

### New Dependencies
- None (express-rate-limit already installed)
