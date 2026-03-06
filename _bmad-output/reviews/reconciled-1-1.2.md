# Reconciled Review — Story 1.2

Source: Claude review only (Codex skipped — OpenAI quota exceeded)

## Summary
- Critical: 0
- Major: 0
- Minor: 7

## Overall: APPROVE

All 6 acceptance criteria verified. Only minor findings.

## Findings (all minor)

### 1. [MINOR] Lockout counter doesn't reset after expiry
**File:** server/src/services/auth.service.ts
**Issue:** After lockout expires, first wrong password re-locks immediately because failedLoginAttempts isn't reset to 0 on lock expiry.
**Fix:** Reset failedLoginAttempts to 0 when lockedUntil has passed.

### 2. [MINOR] Duplicated duration parser for LOGIN_LOCKOUT_DURATION_MS
**File:** server/src/config/env.ts
**Issue:** Duration parser duplicated due to Zod v4 issue.
**Fix:** Extract shared parseDuration utility. Low priority.

### 3. [MINOR] CORS reads process.env directly instead of validated env
**File:** server/src/app.ts
**Issue:** Uses process.env.ALLOWED_ORIGINS instead of env.ALLOWED_ORIGINS.
**Fix:** Use validated env import. Low priority.

### 4. [MINOR] DUMMY_HASH could break on bcryptjs validation
**File:** server/src/services/auth.service.ts
**Issue:** Synthetic bcrypt hash for timing-safe comparison.
**Fix:** Pre-hash a known string at startup instead.

### 5. [MINOR] Refresh POST sends Content-Type with no body
**File:** client/src/services/api.ts
**Fix:** Remove Content-Type header from refresh call.

### 6. [MINOR] Unused _refreshPromise test export
**File:** client/src/services/api.ts
**Fix:** Remove if not used in tests.

### 7. [MINOR] Non-atomic refresh token rotation
**File:** server/src/services/auth.service.ts
**Issue:** Two DB ops for $pull/$push on same array field.
**Fix:** Acceptable MongoDB limitation. No action needed.
