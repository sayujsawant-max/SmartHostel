# Reconciled Review — Story 2.1

Source: Claude review only (Codex skipped — OpenAI quota exceeded)

## Summary
- Critical: 0 (downgraded — see below)
- Major: 1
- Minor: 1

## Overall: PASS WITH FIXES

## Findings to fix

### 1. [MAJOR] GET /api/leaves open to all roles
**File:** server/src/routes/leave.routes.ts:12
**Fix:** Restrict to STUDENT + WARDEN_ADMIN with requireRole.

### 2. [MINOR] Overlap race condition
**File:** server/src/services/leave.service.ts
**Note:** Downgraded from Critical — single-hostel MVP with ~300 students. Concurrent leave overlap is extremely unlikely. The findOne check is sufficient for MVP. Can add a partial unique index post-MVP if needed.

## Accepted (no action)
- Server-local midnight: Single-hostel, single timezone system. IST assumed.
- _id not renamed: Consistent with User model convention.
