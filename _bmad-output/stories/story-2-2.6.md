# Story 2.6: Leave Expiry Cron & Auto-Return

## Description
As a **warden**,
I want to correct post-exit pass records with a documented reason,
So that I can handle edge cases like wrong scans, administrative errors, or students who need their leave records adjusted after exiting the gate.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a WARDEN_ADMIN viewing a leave that is SCANNED_OUT or SCANNED_IN, when I PATCH `/api/leaves/:id/correct` with `{ reason: "string (min 5 chars)" }`, then the leave transitions atomically to CORRECTED, the reason is stored, and a PASS_CORRECTED audit event is created preserving the original state

**AC-2:** Given a correction is made, when the audit event is created, then the original leave status is captured in `metadata.previousStatus` (either SCANNED_OUT or SCANNED_IN) -- this is append-only, the original state is never overwritten in the leave document

**AC-3:** Given the leave is NOT in SCANNED_OUT or SCANNED_IN state (e.g., PENDING, APPROVED, CANCELLED, COMPLETED), when I attempt to rectify, then the server returns 409 CONFLICT with message indicating only SCANNED_OUT or SCANNED_IN can be rectified

**AC-4:** Given the leave ID does not exist, when I attempt to rectify, then the server returns 404 NOT_FOUND

**AC-5:** Given I am NOT a WARDEN_ADMIN (e.g., STUDENT, GUARD, MAINTENANCE), when I attempt PATCH `/api/leaves/:id/correct`, then the server returns 403 FORBIDDEN

**AC-6:** Given I am a WARDEN_ADMIN, when I submit a correction via PATCH `/api/leaves/:id/correct` without a reason or with a reason shorter than 5 characters, then the server returns 400 VALIDATION_ERROR with field 'reason'

**AC-7:** Given a leave is corrected from SCANNED_OUT, when the correction is saved, then the original leave document's fields (studentId, type, dates, etc.) remain intact -- only the `status` field changes to CORRECTED

**AC-8:** Given a leave correction is processed, when the PASS_CORRECTED AuditEvent is created, then it records: entityType 'leave', eventType 'PASS_CORRECTED', actorRole 'WARDEN_ADMIN', actorId (warden's userId), metadata with previousStatus and reason, and correlationId for traceability

## Technical Context
- **Atomic transition:** `findOneAndUpdate({ _id, status: { $in: [SCANNED_OUT, SCANNED_IN] } }, { $set: { status: CORRECTED } }, { new: false })` -- `new: false` returns the ORIGINAL document so the previous status can be captured in the audit event before the update
- **Audit trail design:** AuditEvent model is append-only with no TTL (unlike notifications). Each correction creates exactly one audit event with the complete pre-correction state in metadata. The leave document itself only stores the final CORRECTED status.
- **AuditEvent model:** `server/src/models/audit-event.model.ts` with fields: entityType, entityId, eventType, actorRole, actorId, metadata (Mixed schema for flexible data), correlationId. Indexes on eventType and `{ entityType, entityId }`.
- **Validation:** Reason is validated in the controller (not via shared schema) with minimum 5 characters, trimmed
- **RBAC:** `requireRole(Role.WARDEN_ADMIN)` on the correct route

### Existing Code
Stories 2.1-2.5 delivered the complete leave lifecycle. The following files already existed:

**Server:**
- `server/src/models/leave.model.ts` -- Leave model with status field including CORRECTED value. **Exists and functional.**
- `server/src/services/leave.service.ts` -- createLeave, getStudentLeaves, getAllLeaves, approveLeave, rejectLeave, cancelLeave. **Missing:** `correctLeave` function.
- `server/src/controllers/leave.controller.ts` -- All handlers except `correctLeave`. **Missing:** `correctLeave` handler with reason validation.
- `server/src/routes/leave.routes.ts` -- All routes except `/:id/correct`. **Missing:** PATCH `/:id/correct` route.
- `server/src/models/audit-event.model.ts` -- AuditEvent model with entityType, entityId, eventType, actorRole, actorId, metadata, correlationId. **Exists and functional.** Already used by leave approval/rejection/cancellation flows.

## Tasks

### Task 1: Create AuditEvent Model (if not exists)
Verify the audit event model exists and supports the correction use case.
- [ ] Subtask 1.1: Audit `server/src/models/audit-event.model.ts` -- confirm it has entityType (String, required), entityId (ObjectId, required), eventType (String, required, indexed), actorRole (String, required), actorId (ObjectId, ref User, default null), metadata (Mixed, default {}), correlationId (String, required, indexed)
- [ ] Subtask 1.2: Confirm collection is `auditEvents`, timestamps: true, strict: true
- [ ] Subtask 1.3: Confirm compound index on `{ entityType: 1, entityId: 1 }` for querying all events for an entity
- [ ] Subtask 1.4: Confirm NO TTL index (audit events are permanent, append-only)
- [ ] Subtask 1.5: Confirm toJSON transform strips `__v`

**Tests (AC-2, AC-8):**
- [ ] Unit test: AuditEvent.create with valid data creates document
- [ ] Unit test: AuditEvent metadata accepts arbitrary key-value pairs (Mixed schema)
- [ ] Unit test: No TTL index exists on the collection

### Task 2: Implement correctLeave in Leave Service
Add the correction business logic with audit trail preservation.
- [ ] Subtask 2.1: Add `correctLeave(leaveId, wardenId, reason, correlationId?)` to `server/src/services/leave.service.ts`
- [ ] Subtask 2.2: Use `findOneAndUpdate({ _id: leaveId, status: { $in: [SCANNED_OUT, SCANNED_IN] } }, { $set: { status: CORRECTED } }, { new: false })` -- `new: false` returns the original document
- [ ] Subtask 2.3: If result is null, query `Leave.findById(leaveId)` to differentiate NOT_FOUND vs CONFLICT
- [ ] Subtask 2.4: For non-correctable states, throw CONFLICT: "Leave is {status}, only SCANNED_OUT or SCANNED_IN can be corrected"
- [ ] Subtask 2.5: Create PASS_CORRECTED audit event with `{ entityType: 'leave', entityId, eventType: 'PASS_CORRECTED', actorRole: 'WARDEN_ADMIN', actorId: wardenId, metadata: { previousStatus: leave.status, reason }, correlationId }`
- [ ] Subtask 2.6: Log correction via pino logger with eventType, leaveId, wardenId, previousStatus, reason
- [ ] Subtask 2.7: Fetch and return the updated leave document (separate `findById` after audit event creation)

**Tests (AC-1, AC-2, AC-3, AC-4, AC-7):**
- [ ] Unit test: correctLeave from SCANNED_OUT transitions to CORRECTED
- [ ] Unit test: correctLeave from SCANNED_IN transitions to CORRECTED
- [ ] Unit test: correctLeave from PENDING throws CONFLICT
- [ ] Unit test: correctLeave from APPROVED throws CONFLICT
- [ ] Unit test: correctLeave from CANCELLED throws CONFLICT
- [ ] Unit test: correctLeave with non-existent leaveId throws NOT_FOUND
- [ ] Unit test: correctLeave creates PASS_CORRECTED audit event with previousStatus in metadata
- [ ] Unit test: correctLeave audit event metadata.previousStatus is 'SCANNED_OUT' when correcting from SCANNED_OUT

### Task 3: Add Correct Controller and Route
Wire up the correction endpoint with validation and WARDEN_ADMIN role restriction.
- [ ] Subtask 3.1: Add `correctLeave(req, res)` handler to `server/src/controllers/leave.controller.ts`
- [ ] Subtask 3.2: Extract `reason` from `req.body`, validate: must be a non-empty string with minimum 5 characters after trimming; throw VALIDATION_ERROR with field 'reason' if invalid
- [ ] Subtask 3.3: Call `leaveService.correctLeave(req.params.id, req.user._id, reason.trim(), req.correlationId)`
- [ ] Subtask 3.4: Return `{ success: true, data: { leave }, correlationId }`
- [ ] Subtask 3.5: Add `PATCH /:id/correct` route to `server/src/routes/leave.routes.ts` with `requireRole(Role.WARDEN_ADMIN)`

**Tests (AC-1, AC-3, AC-4, AC-5, AC-6):**
- [ ] Integration test: PATCH `/api/leaves/:id/correct` as WARDEN_ADMIN with valid reason returns 200 with CORRECTED leave
- [ ] Integration test: PATCH `/api/leaves/:id/correct` without reason returns 400 VALIDATION_ERROR
- [ ] Integration test: PATCH `/api/leaves/:id/correct` with reason shorter than 5 chars returns 400 VALIDATION_ERROR
- [ ] Integration test: PATCH `/api/leaves/:id/correct` as STUDENT returns 403
- [ ] Integration test: PATCH `/api/leaves/:id/correct` as GUARD returns 403
- [ ] Integration test: PATCH `/api/leaves/:id/correct` with PENDING leave returns 409
- [ ] Integration test: PATCH `/api/leaves/:id/correct` with non-existent ID returns 404
- [ ] Integration test: PATCH `/api/leaves/:id/correct` without auth returns 401

## Dependencies
- **Story 2.1** (completed) -- Leave model with CORRECTED status, leave service base
- **Story 2.5** (completed) -- Leave cancellation flow (cancel is the student-side; correct is the warden-side)
- **Story 1.2** (completed) -- Auth middleware, RBAC middleware, AuditEvent model
- The AuditEvent model was already created in Story 1.2 scope and used by leave approval/rejection/cancellation flows; this story adds the PASS_CORRECTED event type

## File List

### Modified Files
- `server/src/services/leave.service.ts` -- Added `correctLeave(leaveId, wardenId, reason, correlationId)` function with atomic SCANNED_OUT/SCANNED_IN -> CORRECTED transition, original document retrieval via `new: false`, PASS_CORRECTED audit event, and pino logging
- `server/src/controllers/leave.controller.ts` -- Added `correctLeave(req, res)` handler with reason validation (min 5 chars, trimmed) and VALIDATION_ERROR on invalid input
- `server/src/routes/leave.routes.ts` -- Added `PATCH /:id/correct` route with `requireRole(Role.WARDEN_ADMIN)`

### New Files
- None (AuditEvent model already existed from Story 1.2)

### Unchanged Files
- `server/src/models/leave.model.ts` -- Leave model already has CORRECTED in status enum
- `server/src/models/audit-event.model.ts` -- AuditEvent model already functional with Mixed metadata schema
- `server/src/middleware/auth.middleware.ts` -- JWT verification already correct
- `server/src/middleware/rbac.middleware.ts` -- requireRole already correct
- `server/src/utils/app-error.ts` -- AppError class already supports code, message, statusCode

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (AuditEvent Audit):** Verified the existing AuditEvent model at `server/src/models/audit-event.model.ts`. Confirmed: entityType/entityId/eventType/actorRole/actorId/metadata/correlationId all present. Compound index on `{ entityType: 1, entityId: 1 }` exists. No TTL index (permanent append-only). toJSON strips `__v`. No changes needed.

**Task 2 (correctLeave Service):** Key design decision: using `{ new: false }` in `findOneAndUpdate` to get the ORIGINAL document before the status change. This lets us capture `previousStatus` accurately in the audit event metadata without a race condition. After creating the audit event, a separate `findById` returns the updated document for the API response. The `correlationId` defaults to empty string (`?? ''`) to satisfy the required field constraint on AuditEvent.

**Task 3 (Controller/Route):** Reason validation is done in the controller (not via a shared Zod schema) since it's a simple string length check specific to this endpoint. The controller trims the reason before passing to the service. Route restricted to WARDEN_ADMIN only -- this is the warden-side counterpart to the student cancellation flow.

### Test Results
- **Server:** Correction service and controller integration tests pass
- **Total:** 0 failures

### New Dependencies
- None
