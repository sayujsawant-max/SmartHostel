# Code Review — Story 1.7

## Summary
- Files reviewed: 6
- Critical: 1
- Major: 2
- Minor: 3

## Findings

### 1. [CRITICAL] Email duplicate check is case-sensitive but storage is lowercase
**File:** server/src/services/admin.service.ts:10
**Issue:** `User.findOne({ email: data.email })` uses raw input, but the model applies `lowercase: true` only on save. A query with different casing (e.g. `Admin@Example.com` vs stored `admin@example.com`) bypasses the check. The unique index then throws an unhandled E11000 → 500 error.
**Fix:** Normalize email before the duplicate check: use `.toLowerCase()` in the schema or service.

### 2. [MAJOR] Unhandled MongoDB E11000 on race condition for duplicate email
**File:** server/src/services/admin.service.ts:10-17
**Issue:** TOCTOU race between `findOne` and `User.create` — concurrent requests can both pass the check, one gets raw E11000 → 500.
**Fix:** Wrap `User.create` in try/catch for error code 11000 → throw AppError CONFLICT.

### 3. [MAJOR] WARDEN can create another WARDEN_ADMIN account
**File:** shared/schemas/admin.schema.ts:8
**Issue:** Schema allows creating WARDEN_ADMIN users, enabling unlimited admin account creation from any compromised WARDEN account.
**Fix:** Accept as intentional (warden IS the admin in this system) but add `createdBy` audit field or log it.

### 4. [MINOR] createUser response includes undefined optional fields
**File:** server/src/controllers/admin.controller.ts:19-28
**Fix:** Consistent with existing `me` endpoint. No action needed.

### 5. [MINOR] No asyncHandler wrapper — relies on Express 5
**File:** server/src/routes/admin.routes.ts
**Fix:** Correct for Express 5.2.1. No action needed.

### 6. [MINOR] Self-disable check uses strict string equality
**File:** server/src/services/admin.service.ts:36
**Fix:** Defensive `String()` cast recommended but not critical.

## Acceptance Criteria Verification
- [x] AC1: WARDEN can create users — PASS
- [x] AC2: WARDEN can disable users + invalidate sessions — PASS
- [x] AC3: WARDEN can reset passwords + invalidate sessions — PASS
- [x] AC4: Non-WARDEN gets 403 — PASS

## Overall Assessment
**PASS WITH FIXES**

All 4 ACs verified. Fix critical email case issue and E11000 race condition.
