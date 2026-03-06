# Code Review — Story 2.2

## Summary
- Files reviewed: 7
- Critical: 0
- Major: 0
- Minor: 2

## Findings

### 1. [MINOR] Reject body not validated with Zod
**File:** server/src/controllers/leave.controller.ts
**Issue:** Rejection reason is cast from req.body without Zod validation. Could contain arbitrary data.
**Fix:** Add optional Zod schema or at minimum validate reason is string with max length. Acceptable for MVP since warden is trusted actor.

### 2. [MINOR] Notification body uses raw date slice
**File:** server/src/services/leave.service.ts
**Issue:** Notification body formats dates with `.toISOString().slice(0, 10)` — functional but not user-friendly (e.g., "2026-03-10").
**Fix:** Format with a friendlier locale string in notification body. Low priority — notification display can reformat.

## Acceptance Criteria Verification
- [x] AC1: GET /api/leaves?status=PENDING returns pending leaves with student info (populated)
- [x] AC2: PATCH approve uses atomic findOneAndUpdate, creates LEAVE_APPROVED notification
- [x] AC3: PATCH reject uses atomic findOneAndUpdate, creates LEAVE_REJECTED notification with reason
- [x] AC4: Non-PENDING leaves return CONFLICT with current state

## Overall Assessment
PASS — All ACs verified. Only minor observations.
