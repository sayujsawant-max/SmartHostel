# Story 2.2: Leave Request Form UI

## Description
As a **student**,
I want a form to submit leave requests from the mobile UI,
So that I can request day outings or overnight leaves without needing to use an API client.

As a **warden**,
I want to view pending leave requests and approve or reject them with documented decisions,
So that I can control student movement with an auditable workflow.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a WARDEN_ADMIN, when I GET `/api/leaves?status=PENDING`, then I see all PENDING leave requests with student name, block, roomNumber, leave type, date range, reason, and submission time

**AC-2:** Given I view a pending leave, when I PATCH `/api/leaves/:id/approve`, then the leave transitions to APPROVED atomically (only from PENDING), a LEAVE_APPROVED notification is created for the student, a gate pass is generated, and a LEAVE_APPROVED audit event is logged

**AC-3:** Given I view a pending leave, when I PATCH `/api/leaves/:id/reject` with optional `{ reason }`, then the leave transitions to REJECTED atomically (only from PENDING), a LEAVE_REJECTED notification is created for the student with the reason, and a LEAVE_REJECTED audit event is logged

**AC-4:** Given the leave is no longer PENDING (already APPROVED, REJECTED, CANCELLED, etc.), when I attempt to approve or reject, then the atomic `findOneAndUpdate` returns null and the server responds with 409 CONFLICT indicating the current status

**AC-5:** Given the leave ID does not exist, when I attempt to approve or reject, then the server returns 404 NOT_FOUND

**AC-6:** Given I am NOT a WARDEN_ADMIN (e.g., STUDENT, GUARD), when I attempt PATCH `/api/leaves/:id/approve` or `/reject`, then the server returns 403 FORBIDDEN

**AC-7:** Given I am a WARDEN_ADMIN on the StudentsPage, when I view the leave list, then I can filter by status (PENDING, APPROVED, REJECTED, SCANNED_OUT, COMPLETED) and see student name, block, room number, leave type, dates, reason, and submission time

**AC-8:** Given I am a WARDEN_ADMIN viewing a PENDING leave, when I click Approve, then the leave status updates to APPROVED without a page reload

**AC-8a:** Given I am a WARDEN_ADMIN viewing a PENDING leave, when I click Reject, then a reason input appears and I can confirm rejection

## Technical Context
- **Tech stack:** Express 5 + TypeScript (server), React 19 + TypeScript (client), Mongoose 8
- **Atomic transitions:** Use `findOneAndUpdate({ _id, status: PENDING }, { $set: { status: APPROVED } })` to prevent race conditions on concurrent approve/reject
- **Notification model:** `server/src/models/notification.model.ts` with recipientId, type (NotificationType enum), entityType, entityId, title, body, isRead; TTL 180 days via `createdAt` TTL index
- **Gate pass creation:** On approve, `createGatePass(leave)` is called inline (no event bus for MVP) -- see Story 2.3
- **Warden UI:** `client/src/pages/warden/StudentsPage.tsx` serves as the leave management dashboard with status filter dropdown and approve/reject actions
- **API wrapper:** `client/src/services/api.ts` provides `apiFetch` with automatic refresh-retry on 401

### Existing Code
Story 2.1 delivered the leave model, service (create + list), controller, and routes. The following files already existed:

**Server:**
- `server/src/models/leave.model.ts` -- Leave model with all fields including approvedBy, approvedAt, rejectionReason. **Exists and complete.**
- `server/src/services/leave.service.ts` -- `createLeave`, `getStudentLeaves`, `getAllLeaves` functions. **Missing:** `approveLeave` and `rejectLeave` functions.
- `server/src/controllers/leave.controller.ts` -- `createLeave` and `getLeaves` handlers. **Missing:** `approveLeave` and `rejectLeave` handlers.
- `server/src/routes/leave.routes.ts` -- POST `/` and GET `/` routes. **Missing:** PATCH `/:id/approve` and `/:id/reject` routes.
- `server/src/models/audit-event.model.ts` -- AuditEvent model. **Exists and functional.**

**Shared:**
- `shared/constants/notification-types.ts` -- **Did not exist.** Needed to be created with NotificationType enum.

**Client:**
- `client/src/pages/warden/StudentsPage.tsx` -- **Did not exist.** Needed to be created as the warden leave management UI.

## Tasks

### Task 1: Create Notification Model
Create the notification model for in-app notifications to students.
- [ ] Subtask 1.1: Create `server/src/models/notification.model.ts` with `INotification` interface: recipientId (ObjectId ref User), type (NotificationType enum), entityType (string), entityId (ObjectId), title (string), body (string), isRead (boolean, default false)
- [ ] Subtask 1.2: Configure collection `notifications`, timestamps: true, strict: true
- [ ] Subtask 1.3: Add compound index `{ recipientId: 1, isRead: 1 }` for efficient unread queries
- [ ] Subtask 1.4: Add TTL index on `createdAt` with expireAfterSeconds of 180 days (15552000 seconds)
- [ ] Subtask 1.5: Add toJSON transform to strip `__v`

**Tests (AC-2, AC-3):**
- [ ] Unit test: Notification.create with valid data creates document with isRead: false
- [ ] Unit test: toJSON transform removes __v
- [ ] Unit test: TTL index exists on createdAt field

### Task 2: Create Notification Constants (shared)
Define the NotificationType enum for use across server and client.
- [ ] Subtask 2.1: Create `shared/constants/notification-types.ts` with `NotificationType` const object containing all 8 types: LEAVE_APPROVED, LEAVE_REJECTED, OVERRIDE_ALERT, SLA_REMINDER, SLA_BREACH, COMPLAINT_ASSIGNED, COMPLAINT_RESOLVED, NOTICE_PUBLISHED
- [ ] Subtask 2.2: Export from `shared/index.ts`

**Tests (AC-2, AC-3):**
- [ ] Unit test: NotificationType contains all 8 expected keys

### Task 3: Add approve/reject to Leave Service
Implement the atomic approve and reject business logic with notification creation.
- [ ] Subtask 3.1: Add `approveLeave(leaveId, wardenId, correlationId)` to `server/src/services/leave.service.ts`
- [ ] Subtask 3.2: Use `findOneAndUpdate({ _id: leaveId, status: PENDING }, { $set: { status: APPROVED, approvedBy: wardenId, approvedAt: new Date() } }, { new: true })` for atomic transition
- [ ] Subtask 3.3: If findOneAndUpdate returns null, check if leave exists (NOT_FOUND) or has wrong status (CONFLICT with current status)
- [ ] Subtask 3.4: Create LEAVE_APPROVED notification for the student with title and body describing dates
- [ ] Subtask 3.5: Call `createGatePass(leave)` after approval (imported from gate-pass service)
- [ ] Subtask 3.6: Create LEAVE_APPROVED audit event with wardenId and studentId in metadata
- [ ] Subtask 3.7: Add `rejectLeave(leaveId, wardenId, reason?, correlationId)` with same atomic pattern, setting rejectionReason if provided, creating LEAVE_REJECTED notification

**Tests (AC-2, AC-3, AC-4, AC-5):**
- [ ] Unit test: approveLeave transitions PENDING to APPROVED with approvedBy and approvedAt set
- [ ] Unit test: approveLeave throws CONFLICT when leave is already APPROVED
- [ ] Unit test: approveLeave throws NOT_FOUND when leaveId does not exist
- [ ] Unit test: approveLeave creates LEAVE_APPROVED notification for the student
- [ ] Unit test: approveLeave creates LEAVE_APPROVED audit event
- [ ] Unit test: rejectLeave transitions PENDING to REJECTED with optional rejectionReason
- [ ] Unit test: rejectLeave creates LEAVE_REJECTED notification with reason in body

### Task 4: Add approve/reject to Leave Controller
Implement the request handlers for approve and reject endpoints.
- [ ] Subtask 4.1: Add `approveLeave(req, res)` handler to `server/src/controllers/leave.controller.ts`
- [ ] Subtask 4.2: Extract `req.params.id`, call `leaveService.approveLeave`, return `{ success: true, data: { leave, gatePass: { id, passCode, expiresAt } } }`
- [ ] Subtask 4.3: Add `rejectLeave(req, res)` handler, extract optional `reason` from body, call `leaveService.rejectLeave`, return `{ success: true, data: { leave } }`

**Tests (AC-2, AC-3, AC-4, AC-5, AC-6):**
- [ ] Integration test: PATCH `/api/leaves/:id/approve` as WARDEN_ADMIN returns 200 with leave and gatePass data
- [ ] Integration test: PATCH `/api/leaves/:id/reject` as WARDEN_ADMIN with reason returns 200 with rejected leave
- [ ] Integration test: PATCH `/api/leaves/:id/approve` as STUDENT returns 403
- [ ] Integration test: PATCH `/api/leaves/:id/approve` with non-existent ID returns 404
- [ ] Integration test: PATCH `/api/leaves/:id/approve` when already APPROVED returns 409

### Task 5: Add Routes + RBAC
Wire up the approve and reject routes with WARDEN_ADMIN role restriction.
- [ ] Subtask 5.1: Add `PATCH /:id/approve` with `requireRole(Role.WARDEN_ADMIN)` and `leaveController.approveLeave` to `server/src/routes/leave.routes.ts`
- [ ] Subtask 5.2: Add `PATCH /:id/reject` with `requireRole(Role.WARDEN_ADMIN)` and `leaveController.rejectLeave`
- [ ] Subtask 5.3: Verify both routes are behind `authMiddleware` (applied via `router.use`)

**Tests (AC-6):**
- [ ] Integration test: PATCH routes return 403 for non-WARDEN_ADMIN roles
- [ ] Integration test: PATCH routes return 401 without authentication

### Task 6: Update getLeaves to Populate Student Info for Wardens
Ensure the GET endpoint returns populated student data for warden view.
- [ ] Subtask 6.1: In `getAllLeaves`, add `.populate('studentId', 'name email block floor roomNumber')` to the query
- [ ] Subtask 6.2: Verify STUDENT role calls `getStudentLeaves` (no population needed since it's their own data)
- [ ] Subtask 6.3: Support `?status=` query parameter filtering in `getAllLeaves`

**Tests (AC-1, AC-7):**
- [ ] Integration test: GET `/api/leaves` as WARDEN_ADMIN returns leaves with populated studentId containing name, block, roomNumber
- [ ] Integration test: GET `/api/leaves?status=PENDING` as WARDEN_ADMIN returns only PENDING leaves

### Task 7: Create Warden StudentsPage UI
Build the warden-facing leave management page.
- [ ] Subtask 7.1: Create `client/src/pages/warden/StudentsPage.tsx` with leave list display
- [ ] Subtask 7.2: Add status filter dropdown (PENDING, APPROVED, REJECTED, SCANNED_OUT, COMPLETED) defaulting to PENDING
- [ ] Subtask 7.3: Display each leave card with student name, block, room number, leave type, date range, reason, submission time, and status badge
- [ ] Subtask 7.4: For PENDING leaves, show Approve button (calls PATCH approve, re-fetches list) and Reject button (shows inline reason input + Confirm Reject)
- [ ] Subtask 7.5: Handle empty state: "No leaves found" message

**Tests (AC-7, AC-8):**
- [ ] Manual verification: StudentsPage loads and displays pending leaves
- [ ] Manual verification: Approve button updates leave status without page reload
- [ ] Manual verification: Reject button shows reason input, Confirm Reject sends rejection
- [ ] Manual verification: Status filter dropdown changes displayed leaves

## Dependencies
- **Story 2.1** (completed) -- Leave model, create/list service and API, shared constants and schema
- **Story 1.2** (completed) -- Auth middleware, RBAC middleware, User model
- Gate pass creation on approve triggers Story 2.3 functionality (createGatePass called inline)

## File List

### Modified Files
- `server/src/services/leave.service.ts` -- Added `approveLeave` (atomic PENDING->APPROVED with notification + gate pass + audit) and `rejectLeave` (atomic PENDING->REJECTED with optional reason + notification + audit); added `.populate('studentId')` to `getAllLeaves`
- `server/src/controllers/leave.controller.ts` -- Added `approveLeave` and `rejectLeave` request handlers
- `server/src/routes/leave.routes.ts` -- Added PATCH `/:id/approve` and `/:id/reject` routes with WARDEN_ADMIN RBAC
- `shared/index.ts` -- Added NotificationType export

### New Files
- `server/src/models/notification.model.ts` -- Notification Mongoose model with TTL 180 days, recipientId+isRead compound index, toJSON transform
- `shared/constants/notification-types.ts` -- NotificationType const object with 8 types and derived type
- `client/src/pages/warden/StudentsPage.tsx` -- Warden leave management page with status filter, approve/reject actions, student info display

### Unchanged Files
- `server/src/models/leave.model.ts` -- Leave model already has approvedBy, approvedAt, rejectionReason fields
- `server/src/middleware/auth.middleware.ts` -- JWT verification already correct
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory already correct
- `server/src/models/audit-event.model.ts` -- AuditEvent model already functional
- `shared/constants/leave-status.ts` -- LeaveStatus already includes APPROVED, REJECTED
- `client/src/services/api.ts` -- apiFetch wrapper already functional

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Notification Model):** Created with `notifications` collection, TTL of 180 days via `expireAfterSeconds: 15552000` on createdAt. Compound index on `{ recipientId: 1, isRead: 1 }` for efficient unread notification queries.

**Task 2 (Notification Constants):** Created NotificationType with all 8 types covering leaves, overrides, SLA, complaints, and notices. Future stories will use the same enum.

**Task 3 (Approve/Reject Service):** Both use atomic `findOneAndUpdate` with `{ status: PENDING }` condition. If result is null, a second query distinguishes NOT_FOUND vs CONFLICT. Approve creates LEAVE_APPROVED notification with formatted date range in body, then calls `createGatePass(leave)` from gate-pass service. Reject stores optional `rejectionReason` and creates LEAVE_REJECTED notification with reason in body.

**Task 4-5 (Controller/Routes):** Approve handler returns both leave and gate pass summary `{ id, passCode, expiresAt }`. Reject handler extracts optional reason from body. Both routes restricted to WARDEN_ADMIN via `requireRole`.

**Task 6 (Student Population):** `getAllLeaves` populates `studentId` with `name email block floor roomNumber` for warden view. STUDENT role calls `getStudentLeaves` which does not populate (data is the student's own).

**Task 7 (StudentsPage UI):** Built with status filter dropdown defaulting to PENDING. Each leave card shows student info (name, block, room), leave type, date range, reason, and submission timestamp. Approve calls PATCH and re-fetches. Reject shows inline input with Confirm/Cancel buttons. Uses `useCallback` + `useEffect` for data fetching.

### Test Results
- **Server:** Approve/reject service and controller tests pass
- **Client:** StudentsPage renders correctly in manual testing
- **Total:** 0 failures

### New Dependencies
- None
