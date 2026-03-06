# Story 2.5: Leave Cancellation (Student)

## Story

As a **student**,
I want to cancel an approved leave before I exit the gate,
So that I can change my plans without leaving an orphan pass.

## Status: Complete

## Acceptance Criteria

**AC1:** Given I have an APPROVED leave (not yet SCANNED_OUT), when I tap Cancel, then PATCH `/api/leaves/:id/cancel` transitions to CANCELLED via atomic findOneAndUpdate, and the associated gate pass is invalidated.

**AC2:** Given my leave is SCANNED_OUT, when I attempt to cancel, then the server returns CONFLICT: "Cannot cancel -- you've already exited. Contact your warden for corrections."

**AC3:** Given my leave is PENDING, when I cancel it, then the leave transitions to CANCELLED (no gate pass exists to invalidate).

## Tasks

### Task 1: Implement cancelLeave in leave.service.ts
**File:** `server/src/services/leave.service.ts`
- Atomic findOneAndUpdate with status condition (PENDING or APPROVED only)
- If APPROVED, also invalidate associated gate pass via gate-pass.service.invalidatePassByLeaveId
- Return CONFLICT error if leave is in a non-cancellable state (SCANNED_OUT, etc.)

### Task 2: Add cancel controller and route
**File:** `server/src/controllers/leave.controller.ts`, `server/src/routes/leave.routes.ts`
- PATCH /api/leaves/:id/cancel — requireRole(STUDENT)
- Verify the leave belongs to the requesting student

## Dev Notes
- Cancellation is allowed from PENDING or APPROVED states only
- Uses atomic findOneAndUpdate with `{ status: { $in: [PENDING, APPROVED] } }` condition
- Gate pass invalidation: sets gate pass status to CANCELLED
