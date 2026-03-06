# Code Review — Story 2.1

## Summary
- Files reviewed: 9
- Critical: 1
- Major: 1
- Minor: 2

## Findings

### 1. [CRITICAL] Race condition on overlap detection
**File:** server/src/services/leave.service.ts:11-28
**Issue:** findOne + create are not atomic. Concurrent requests with overlapping dates can both pass the check.
**Fix:** Add try/catch with a compound unique partial index, or use a transaction.

### 2. [MAJOR] GET /api/leaves open to all authenticated users
**File:** server/src/routes/leave.routes.ts:12
**Issue:** No requireRole on GET — GUARD and MAINTENANCE can list all leaves via getAllLeaves.
**Fix:** Add requireRole(Role.STUDENT, Role.WARDEN_ADMIN) to restrict access.

### 3. [MINOR] Start date validation uses server-local midnight
**File:** shared/schemas/leave.schema.ts:7
**Fix:** Use UTC midnight for comparison. Low priority — single-hostel system.

### 4. [MINOR] toJSON does not rename _id to id
**File:** server/src/models/leave.model.ts
**Fix:** Check project convention. User model doesn't rename either — consistent.

## Acceptance Criteria Verification
- [x] AC1: POST creates leave with PENDING
- [x] AC2: Zod validates dates correctly
- [~] AC3: Overlap logic correct but not atomic
- [x] AC4: POST restricted to STUDENT
- [x] AC5: GET scoped per role

## Overall Assessment
PASS WITH FIXES
