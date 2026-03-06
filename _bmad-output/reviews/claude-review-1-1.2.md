# Code Review: Story 1.2 - User Model, Auth API & JWT Token Lifecycle

**Reviewer:** Claude (Opus 4.6)
**Date:** 2026-03-06
**Story:** 1.2 - User Model, Auth API & JWT Token Lifecycle
**Verdict:** APPROVE WITH MINOR FINDINGS

---

## Summary

The implementation is solid and well-structured. All six acceptance criteria are met with correct behavior. The auth flow follows the architecture document faithfully: dual JWT tokens in httpOnly cookies, SHA-256 hashed jti storage, timing-safe login, CSRF Origin/Referer validation, and account lockout after failed attempts. Test coverage is comprehensive (70 tests across 7 files). The code is clean, follows established conventions, and the controller-service-model separation is properly maintained.

No critical or major issues were found. Several minor findings are noted below.

---

## Findings

### [MINOR-1] Refresh token rotation is not fully atomic (auth.service.ts:136-147)

The `refresh()` function performs two separate DB operations: (1) `findOneAndUpdate` to pull the old jti, (2) `updateOne` to push the new jti. If the process crashes between these two operations, the user loses their refresh token with no replacement stored. This is a known trade-off documented in the story, and the window is very small, but a single `findOneAndUpdate` using `$pull` + `$push` together would be more robust.

**File:** `c:/Projects/Agent/server/src/services/auth.service.ts`, lines 136-147

```typescript
// Current: two operations
const result = await User.findOneAndUpdate(
  { _id: userId, refreshTokenJtis: hashedOldJti },
  { $pull: { refreshTokenJtis: hashedOldJti } },
  ...
);
// ...
await User.updateOne({ _id: userId }, { $push: { refreshTokenJtis: hashedNewJti } });

// Suggested: single atomic operation
const result = await User.findOneAndUpdate(
  { _id: userId, refreshTokenJtis: hashedOldJti },
  { $pull: { refreshTokenJtis: hashedOldJti }, $push: { refreshTokenJtis: hashedNewJti } },
  ...
);
```

**Note:** MongoDB does not allow `$pull` and `$push` on the same array field in one update. This would need to be restructured, e.g., using `$set` on the filtered array. The current two-operation approach is acceptable for MVP given the negligible crash window.

**Update on further reflection:** Actually, MongoDB *does* disallow `$pull` and `$push` on the same field in one operation. The current two-step approach is the correct pattern for Mongoose. No change needed -- just flagging the theoretical non-atomicity for awareness.

### [MINOR-2] Lockout does not reset `failedLoginAttempts` when lockout expires naturally (auth.service.ts:42-52)

When a locked account's `lockedUntil` time expires, the next successful login resets `failedLoginAttempts` to 0 (line 110). However, if the user fails again after lockout expiry, the counter starts from whatever it was before (e.g., 5). The code at line 60 does `(user.failedLoginAttempts || 0) + 1`, which means the 6th attempt increments to 6, which is >= 5, immediately re-locking the account on the very first failed attempt after the lockout expires.

This is arguably correct behavior (strict security), but it means the user gets only one chance after a lockout -- any single wrong password re-locks them. Consider resetting `failedLoginAttempts` to 0 when `lockedUntil` has expired (before the password check) so the user gets a fresh 5-attempt window.

**File:** `c:/Projects/Agent/server/src/services/auth.service.ts`, lines 42-52 and 57-97

### [MINOR-3] `LOGIN_LOCKOUT_DURATION_MS` env var uses duplicated duration parser (env.ts:58-76)

The `LOGIN_LOCKOUT_DURATION_MS` field has a fully inline duration parser that duplicates the `durationMs` Zod transform already defined at lines 18-36. The dev notes explain this was due to a Zod v4 `.default()` bypass issue with transform chains. This is acceptable as a workaround but should be revisited if Zod is updated.

**File:** `c:/Projects/Agent/server/src/config/env.ts`, lines 58-76

### [MINOR-4] CORS `origins` in app.ts reads from `process.env` directly, not from validated `env` (app.ts:23-25)

The CORS setup reads `process.env.ALLOWED_ORIGINS` directly and re-parses it, rather than importing from `env.ts`. The comment says this is to keep `app.ts` test-safe, but it means there are two separate parsing paths for the same env var. If someone changes the format or default in `env.ts`, the CORS config would diverge. This is documented and intentional, but worth noting.

**File:** `c:/Projects/Agent/server/src/app.ts`, lines 23-25

### [MINOR-5] `DUMMY_HASH` is a syntactically invalid bcrypt hash (auth.service.ts:16)

The dummy hash `'$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012'` is used to ensure constant-time comparison when the user doesn't exist. bcryptjs will still process it (returning false), so the timing defense works. However, if bcryptjs ever validates hash structure before comparison, this could cause an early return that reintroduces timing leakage. Consider generating a real bcrypt hash of a random string at module load time instead.

**File:** `c:/Projects/Agent/server/src/services/auth.service.ts`, line 16

### [MINOR-6] Client refresh POST includes `Content-Type: application/json` but sends no body (api.ts:57-61)

The `attemptRefresh()` function sets `Content-Type: application/json` on the refresh POST request, but sends no body. This is harmless but unnecessary. Some strict proxies or WAFs might flag a JSON content-type with no body.

**File:** `c:/Projects/Agent/client/src/services/api.ts`, lines 57-61

### [MINOR-7] Exported `_refreshPromise` for testing breaks encapsulation (api.ts:121)

The module exports `refreshPromise` as `_refreshPromise` solely for testing. The tests don't actually use it -- the deduplication test works by counting fetch calls instead. This export can be removed.

**File:** `c:/Projects/Agent/client/src/services/api.ts`, line 121

---

## AC Verification

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-1 | Login returns `{ success, data: { user: { id, name, email, role } } }` with httpOnly cookies | PASS | Response shape verified in controller (lines 22-33). Cookie config correct: httpOnly, SameSite=Lax, secure in prod, correct paths. Integration test confirms. |
| AC-2 | `/me` returns user with role, hasConsented, block/floor/roomNumber | PASS | Controller includes all fields (lines 39-54). Client `UserProfile` interface updated with optional room fields. Integration test verifies room data. |
| AC-3 | Client retries on 401 with refresh token | PASS | `apiFetch` intercepts 401, calls `attemptRefresh()`, retries original request. Module-level `refreshPromise` deduplicates concurrent refreshes. `AUTH_REFRESH_FAILED_EVENT` dispatched on failure. AuthContext listens and clears user. 7 client tests cover all paths. |
| AC-4 | Revoked jti returns 401 + cookies cleared | PASS | Controller calls `clearAuthCookies(res)` on all refresh failure paths (missing token, expired token, revoked jti via service error). Integration tests verify 401 + cookie clearing for revoked jti, expired token, and rotated token. |
| AC-5 | 5 failed logins -> account locked with RATE_LIMITED + retryAfterMs | PASS | `failedLoginAttempts` and `lockedUntil` fields added with `select: false`. Service increments on failure, locks at threshold, resets on success. RATE_LIMITED error thrown with correct retryAfterMs. LoginPage shows countdown and disables submit. Integration tests cover threshold, reset, and expiry. |
| AC-6 | CSRF middleware rejects non-matching Origin on POST/PATCH/DELETE | PASS | `csrfMiddleware` exempts safe methods (GET/HEAD/OPTIONS), validates Origin (preferred) or Referer against `allowedOrigins`. Returns 403 FORBIDDEN on mismatch. Registered in app.ts after cookieParser, before routes. 9 tests cover all scenarios including Referer fallback. |

---

## Architecture Compliance

| Rule | Status | Notes |
|------|--------|-------|
| Controllers never import models directly | PASS | `auth.controller.ts` only imports from services, utils, and config |
| camelCase for JSON/MongoDB fields | PASS | All fields use camelCase |
| kebab-case for server files | PASS | All server files follow kebab-case naming |
| UPPER_SNAKE_CASE for error codes | PASS | UNAUTHORIZED, RATE_LIMITED, FORBIDDEN, VALIDATION_ERROR |
| Cookie paths: accessToken `/`, refreshToken `/api/auth/refresh` | PASS | Verified in auth-cookies.ts |
| Refresh jti hashed with SHA-256 | PASS | `hashJti` uses `createHash('sha256')` |
| Timing-safe login (bcrypt always called) | PASS | `DUMMY_HASH` used when user not found |

---

## Test Coverage Assessment

- **Server unit tests:** auth.service (19 tests), auth-cookies (5 tests) -- cover token generation, hashing, cookie config, login logic, refresh rotation, logout, invalidation, lockout
- **Server integration tests:** auth.controller (17 tests), csrf.middleware (9 tests) -- cover full HTTP lifecycle including cookies, CSRF, lockout, E2E flows
- **Client unit tests:** api.ts (7 tests) -- cover refresh-retry, deduplication, event dispatch, no-infinite-loop
- **Total:** 70 tests, 0 failures (per dev record)

Coverage is thorough. All acceptance criteria have dedicated test cases. Edge cases (expired tokens, rotated tokens, concurrent refreshes, lockout expiry) are covered.

---

## Overall Assessment

**APPROVE.** The implementation is production-quality for an MVP. All acceptance criteria are met with correct security properties. The codebase follows the architecture document closely. The minor findings are low-risk observations rather than issues requiring immediate fixes. The most actionable item is MINOR-2 (lockout counter not resetting after expiry), which should be discussed with the team to confirm desired behavior -- immediate re-lock on any single failure after lockout is strict but may frustrate legitimate users who mistype their password once.
