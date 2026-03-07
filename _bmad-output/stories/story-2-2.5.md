# Story 2.5: Guard Gate Scan (QR verification)

## Description
As a **student**,
I want to cancel an approved leave before I exit the gate,
So that I can change my plans without leaving an orphaned gate pass active in the system.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I have an APPROVED leave that has not yet been SCANNED_OUT, when I PATCH `/api/leaves/:id/cancel`, then the leave transitions atomically to CANCELLED (via `findOneAndUpdate` with status condition), and the associated gate pass is invalidated (status set to CANCELLED)

**AC-2:** Given my leave is SCANNED_OUT (I have already exited the gate), when I attempt to cancel via PATCH `/api/leaves/:id/cancel`, then the server returns 409 CONFLICT with message "Cannot cancel -- you've already exited. Contact your warden for corrections."

**AC-3:** Given my leave is PENDING (not yet approved), when I cancel it via PATCH `/api/leaves/:id/cancel`, then the leave transitions to CANCELLED (no gate pass exists to invalidate since approval hasn't happened)

**AC-4:** Given my leave is in a terminal state (REJECTED, COMPLETED, EXPIRED, CORRECTED), when I attempt to cancel, then the server returns 409 CONFLICT with message indicating the current status

**AC-5:** Given I attempt to cancel a leave that belongs to a different student, when PATCH `/api/leaves/:id/cancel` is called, then the server returns 404 NOT_FOUND (the query includes both `_id` and `studentId` conditions)

**AC-6:** Given I am NOT a STUDENT (e.g., WARDEN_ADMIN, GUARD), when I attempt PATCH `/api/leaves/:id/cancel`, then the server returns 403 FORBIDDEN

**AC-7:** Given a leave is in APPROVED state with an active gate pass, when it is cancelled via PATCH `/api/leaves/:id/cancel`, then a LEAVE_CANCELLED audit event is created with metadata recording `previousStatus: 'APPROVED'`, and the gate pass invalidation is logged

**AC-8:** Given a leave is in PENDING state (no gate pass exists), when it is cancelled via PATCH `/api/leaves/:id/cancel`, then a LEAVE_CANCELLED audit event is created with metadata recording `previousStatus: 'PENDING'`

## Technical Context
- **Atomic transition:** `findOneAndUpdate({ _id: leaveId, studentId, status: { $in: [PENDING, APPROVED] } }, { $set: { status: CANCELLED } }, { new: true })` -- the compound condition ensures only the owning student can cancel and only from valid states
- **Gate pass invalidation:** When cancelling an APPROVED leave (detected by checking `leave.approvedBy` presence), `invalidatePassByLeaveId(leaveId)` is called to atomically set the gate pass status from ACTIVE to CANCELLED
- **Ownership enforcement:** The `studentId` condition in the query prevents students from cancelling other students' leaves without requiring a separate ownership check
- **Error differentiation:** If findOneAndUpdate returns null, a second query `Leave.findOne({ _id: leaveId, studentId })` determines if the leave exists (CONFLICT with status info) or not (NOT_FOUND)
- **RBAC:** `requireRole(Role.STUDENT)` on the cancel route

### Existing Code
Stories 2.1-2.3 delivered the leave and gate pass infrastructure. The following files already existed:

**Server:**
- `server/src/models/leave.model.ts` -- Leave model with status field. **Exists and functional.**
- `server/src/models/gate-pass.model.ts` -- GatePass model with status field. **Exists and functional.**
- `server/src/services/leave.service.ts` -- createLeave, getStudentLeaves, getAllLeaves, approveLeave, rejectLeave. **Missing:** `cancelLeave` function.
- `server/src/services/gate-pass.service.ts` -- createGatePass, getActivePassForStudent, invalidatePassByLeaveId. **Exists and functional.** `invalidatePassByLeaveId` already implemented for this story's needs.
- `server/src/controllers/leave.controller.ts` -- createLeave, getLeaves, approveLeave, rejectLeave handlers. **Missing:** `cancelLeave` handler.
- `server/src/routes/leave.routes.ts` -- POST `/`, GET `/`, PATCH `/:id/approve`, PATCH `/:id/reject`. **Missing:** PATCH `/:id/cancel` route.
- `server/src/models/audit-event.model.ts` -- AuditEvent model. **Exists and functional.**

## Tasks

### Task 1: Implement cancelLeave in Leave Service
Add the cancellation business logic with state validation and gate pass cleanup.
- [ ] Subtask 1.1: Add `cancelLeave(leaveId, studentId, correlationId?)` to `server/src/services/leave.service.ts`
- [ ] Subtask 1.2: Use atomic `findOneAndUpdate({ _id: leaveId, studentId, status: { $in: [PENDING, APPROVED] } }, { $set: { status: CANCELLED } }, { new: true })` for safe transition
- [ ] Subtask 1.3: If result is null, query `Leave.findOne({ _id: leaveId, studentId })` to differentiate NOT_FOUND vs CONFLICT
- [ ] Subtask 1.4: For SCANNED_OUT status, throw specific CONFLICT message: "Cannot cancel -- you've already exited. Contact your warden for corrections."
- [ ] Subtask 1.5: For other non-cancellable states, throw generic CONFLICT: "Leave is {status}, cannot be cancelled"
- [ ] Subtask 1.6: If the cancelled leave was APPROVED (check `leave.approvedBy`), call `invalidatePassByLeaveId(leaveId, correlationId)` to cancel the associated gate pass
- [ ] Subtask 1.7: Create LEAVE_CANCELLED audit event with `previousStatus` in metadata (either 'APPROVED' or 'PENDING')
- [ ] Subtask 1.8: Log cancellation via pino logger

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-8):**
- [ ] Unit test: cancelLeave from PENDING state transitions to CANCELLED
- [ ] Unit test: cancelLeave from APPROVED state transitions to CANCELLED and calls invalidatePassByLeaveId
- [ ] Unit test: cancelLeave from SCANNED_OUT throws CONFLICT with exit message
- [ ] Unit test: cancelLeave from REJECTED throws CONFLICT with status info
- [ ] Unit test: cancelLeave with non-existent leaveId throws NOT_FOUND
- [ ] Unit test: cancelLeave with wrong studentId throws NOT_FOUND (ownership enforcement)
- [ ] Unit test: cancelLeave creates LEAVE_CANCELLED audit event with previousStatus metadata
- [ ] Unit test: cancelLeave from APPROVED creates audit with previousStatus 'APPROVED'

### Task 2: Add Cancel Controller and Route
Wire up the cancellation endpoint with STUDENT role restriction.
- [ ] Subtask 2.1: Add `cancelLeave(req, res)` handler to `server/src/controllers/leave.controller.ts`
- [ ] Subtask 2.2: Extract `req.params.id` and `req.user._id`, call `leaveService.cancelLeave`, return `{ success: true, data: { leave } }`
- [ ] Subtask 2.3: Add `PATCH /:id/cancel` route to `server/src/routes/leave.routes.ts` with `requireRole(Role.STUDENT)`
- [ ] Subtask 2.4: Verify route is behind `authMiddleware`

**Tests (AC-1, AC-2, AC-3, AC-5, AC-6):**
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as STUDENT with PENDING leave returns 200 with CANCELLED leave
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as STUDENT with APPROVED leave returns 200 and gate pass is invalidated
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as STUDENT with SCANNED_OUT leave returns 409 with exit message
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as STUDENT with non-existent ID returns 404
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as STUDENT with another student's leave returns 404
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` as WARDEN_ADMIN returns 403
- [ ] Integration test: PATCH `/api/leaves/:id/cancel` without auth returns 401

## Dependencies
- **Story 2.1** (completed) -- Leave model and service with createLeave, getStudentLeaves
- **Story 2.2** (completed) -- Leave approval flow (approveLeave creates gate pass)
- **Story 2.3** (completed) -- Gate pass model and invalidatePassByLeaveId service function
- **Story 1.2** (completed) -- Auth middleware, RBAC middleware

## File List

### Modified Files
- `server/src/services/leave.service.ts` -- Added `cancelLeave(leaveId, studentId, correlationId)` function with atomic state transition, ownership enforcement, SCANNED_OUT-specific error, gate pass invalidation for APPROVED leaves, audit event creation
- `server/src/controllers/leave.controller.ts` -- Added `cancelLeave(req, res)` handler extracting params and user ID, delegating to service
- `server/src/routes/leave.routes.ts` -- Added `PATCH /:id/cancel` route with `requireRole(Role.STUDENT)`

### New Files
- None

### Unchanged Files
- `server/src/models/leave.model.ts` -- Leave model already has all needed fields and status values
- `server/src/models/gate-pass.model.ts` -- GatePass model already supports CANCELLED status
- `server/src/services/gate-pass.service.ts` -- `invalidatePassByLeaveId` already implemented and functional
- `server/src/models/audit-event.model.ts` -- AuditEvent model already functional
- `server/src/middleware/auth.middleware.ts` -- JWT verification already correct
- `server/src/middleware/rbac.middleware.ts` -- requireRole already correct

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Cancel Service):** Implemented `cancelLeave` with compound `findOneAndUpdate` condition including both `_id`, `studentId`, and `status: { $in: [PENDING, APPROVED] }`. This single query handles both state validation and ownership enforcement atomically. When findOneAndUpdate returns null, a follow-up `Leave.findOne({ _id, studentId })` differentiates between NOT_FOUND (no match at all) and CONFLICT (leave exists but in wrong state). For SCANNED_OUT, the specific error message directs the student to contact their warden for corrections (Story 2.6). Gate pass invalidation is conditional on `leave.approvedBy` presence since PENDING leaves have no gate pass.

**Task 2 (Controller/Route):** Simple handler that extracts `req.params.id` and `req.user._id`, delegates to service, and returns the updated leave. Route restricted to STUDENT role only -- wardens cannot cancel on behalf of students (they have the correction flow in Story 2.6 instead).

### Test Results
- **Server:** Cancel service and controller integration tests pass
- **Total:** 0 failures

### New Dependencies
- None
