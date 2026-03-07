# Story 5.3: Maintenance Task Queue & Status Updates

## Description
As a **MAINTENANCE** staff member,
I want to see my assigned tasks sorted by SLA urgency and update their status,
So that I can work through issues efficiently with documented progress.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am logged in as MAINTENANCE, when I GET `/api/complaints/my-tasks`, then the server returns my assigned complaints (status ASSIGNED or IN_PROGRESS) sorted by `dueAt` ascending (most urgent first), with populated `studentId` (name, block, roomNumber).

**AC-2:** Given I have an ASSIGNED complaint, when I PATCH `/api/complaints/:id/status` with `{ status: 'IN_PROGRESS' }`, then the complaint transitions to IN_PROGRESS, a `ComplaintEvent` (WORK_STARTED) is created with my `actorId` and `actorRole`, and an `AuditEvent` is logged.

**AC-3:** Given I have an IN_PROGRESS complaint, when I PATCH `/api/complaints/:id/status` with `{ status: 'RESOLVED', resolutionNotes: '...' }`, then the complaint transitions to RESOLVED, `resolutionNotes` is saved, a `ComplaintEvent` (COMPLAINT_RESOLVED) is created, an `AuditEvent` is logged, and a `COMPLAINT_RESOLVED` notification is sent to the student.

**AC-4:** Given I attempt an invalid status transition (e.g., ASSIGNED -> RESOLVED, or OPEN -> IN_PROGRESS), when I PATCH `/api/complaints/:id/status`, then the server returns `409 { success: false, error: { code: 'CONFLICT', message: 'Cannot transition from X to Y. Valid: ...' } }`.

**AC-5:** Given I am logged in as MAINTENANCE, when I PATCH `/api/complaints/:id/status` with an invalid status value (e.g., 'INVALID'), then the server returns `400 { success: false, error: { code: 'VALIDATION_ERROR', field: 'status' } }`.

**AC-6:** Given I am logged in as MAINTENANCE, when I view the TasksPage, then I see task cards sorted by urgency with SLA countdown badge, priority badge, student info (name, block, room), "Start Work" button on ASSIGNED tasks, and "Mark Resolved" button on IN_PROGRESS tasks.

**AC-7:** Given I click "Mark Resolved" on an IN_PROGRESS task, when the resolution notes input appears, then I must enter notes before confirming resolution.

**AC-8:** Given I have no assigned tasks, when I view the TasksPage, then I see "No tasks assigned. You're all caught up!" empty state.

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, React 19
- **Status transitions:** Governed by `VALID_TRANSITIONS` map in `complaint.service.ts`:
  - OPEN -> ASSIGNED (done by warden in Story 5.2)
  - ASSIGNED -> IN_PROGRESS (maintenance starts work)
  - IN_PROGRESS -> RESOLVED (maintenance resolves with notes)
  - RESOLVED -> CLOSED (future use)
- **Sort order:** Tasks sorted by `dueAt: 1` (ascending) so most urgent SLA deadlines appear first
- **Notification:** COMPLAINT_RESOLVED notification sent to `complaint.studentId` on resolution
- **Routes:** `GET /my-tasks` requires MAINTENANCE role; `PATCH /:id/status` requires MAINTENANCE or WARDEN_ADMIN

### Existing Code
Story 5.3 extends the complaint service with status transition logic and adds maintenance-facing UI.

**Server:**
- `server/src/services/complaint.service.ts` -- Extended with `VALID_TRANSITIONS` map, `updateStatus()` (validates transition, saves status/resolutionNotes, creates ComplaintEvent with dynamic eventType, creates AuditEvent, sends COMPLAINT_RESOLVED notification on resolution), `getAssignedComplaints()` (filter by assigneeId + active statuses, sort by dueAt asc, populate studentId), and `getResolvedComplaints()` (filter RESOLVED/CLOSED, sort by updatedAt desc). **Complete.**
- `server/src/controllers/complaint.controller.ts` -- Extended with `updateStatus()` (validates status enum, delegates to service), `getAssignedTasks()`, and `getResolvedTasks()` controllers. **Complete.**
- `server/src/routes/complaint.routes.ts` -- Added `GET /my-tasks` (MAINTENANCE), `GET /my-history` (MAINTENANCE), `PATCH /:id/status` (MAINTENANCE, WARDEN_ADMIN). **Complete.**

**Client:**
- `client/src/pages/maintenance/TasksPage.tsx` -- Task list sorted by urgency with SLABadge (overdue/due-soon/normal), priority badge, student info, "Start Work" button (ASSIGNED), "Mark Resolved" with notes textarea (IN_PROGRESS), empty state. **Complete.**

## Tasks

### Task 1: Add Status Transition Logic to Service
Implement valid transition enforcement with event/audit/notification creation.
- [ ] Subtask 1.1: Define `VALID_TRANSITIONS` map: `{ OPEN: [ASSIGNED], ASSIGNED: [IN_PROGRESS], IN_PROGRESS: [RESOLVED], RESOLVED: [CLOSED], CLOSED: [] }`
- [ ] Subtask 1.2: Implement `updateStatus(complaintId, newStatus, actorId, actorRole, resolutionNotes, correlationId)` -- find complaint, check transition validity, update status and optionally resolutionNotes, save
- [ ] Subtask 1.3: Determine `eventType` dynamically: IN_PROGRESS -> `WORK_STARTED`, RESOLVED -> `COMPLAINT_RESOLVED`, else `STATUS_${newStatus}`
- [ ] Subtask 1.4: Create `ComplaintEvent` with eventType, actorId, actorRole, and resolutionNotes as note
- [ ] Subtask 1.5: Create `AuditEvent` with metadata `{ from, to }`
- [ ] Subtask 1.6: On RESOLVED status, create `Notification` with `type: COMPLAINT_RESOLVED`, `recipientId: complaint.studentId`

**Tests (AC-2, AC-3, AC-4):**
- [ ] Unit test: `updateStatus` transitions ASSIGNED -> IN_PROGRESS successfully
- [ ] Unit test: `updateStatus` transitions IN_PROGRESS -> RESOLVED successfully with resolutionNotes saved
- [ ] Unit test: `updateStatus` throws CONFLICT for ASSIGNED -> RESOLVED (invalid transition)
- [ ] Unit test: `updateStatus` throws CONFLICT for OPEN -> IN_PROGRESS (invalid transition)
- [ ] Unit test: `updateStatus` creates COMPLAINT_RESOLVED notification to student on resolution
- [ ] Unit test: `updateStatus` throws NOT_FOUND for non-existent complaint

### Task 2: Add getAssignedComplaints Service Function
Implement task queue query for maintenance staff.
- [ ] Subtask 2.1: Implement `getAssignedComplaints(assigneeId)` -- filter by `{ assigneeId, status: { $in: [ASSIGNED, IN_PROGRESS] } }`, populate `studentId` (name, block, roomNumber), sort by `dueAt: 1`
- [ ] Subtask 2.2: Implement `getResolvedComplaints(assigneeId)` -- filter by `{ assigneeId, status: { $in: [RESOLVED, CLOSED] } }`, populate studentId, sort by `updatedAt: -1`

**Tests (AC-1):**
- [ ] Unit test: `getAssignedComplaints` returns only ASSIGNED and IN_PROGRESS complaints for the given assignee
- [ ] Unit test: `getAssignedComplaints` sorts results by dueAt ascending
- [ ] Unit test: `getResolvedComplaints` returns only RESOLVED and CLOSED complaints

### Task 3: Add Controller Endpoints & Routes
Wire up maintenance-facing HTTP endpoints.
- [ ] Subtask 3.1: Implement `updateStatus` controller -- validate status against `ComplaintStatus` enum values, delegate to service with `req.user._id` and `req.user.role`
- [ ] Subtask 3.2: Implement `getAssignedTasks` controller -- delegate to service with `req.user._id`
- [ ] Subtask 3.3: Implement `getResolvedTasks` controller -- delegate to service with `req.user._id`
- [ ] Subtask 3.4: Add routes: `GET /my-tasks` (MAINTENANCE), `GET /my-history` (MAINTENANCE), `PATCH /:id/status` (MAINTENANCE, WARDEN_ADMIN)

**Tests (AC-1, AC-2, AC-4, AC-5):**
- [ ] Integration test: GET `/api/complaints/my-tasks` as MAINTENANCE returns assigned complaints sorted by dueAt
- [ ] Integration test: PATCH `/api/complaints/:id/status` with `{ status: 'IN_PROGRESS' }` on ASSIGNED complaint returns 200
- [ ] Integration test: PATCH `/api/complaints/:id/status` with invalid transition returns 409 CONFLICT with valid transitions listed
- [ ] Integration test: PATCH `/api/complaints/:id/status` with invalid status value returns 400 VALIDATION_ERROR
- [ ] Integration test: GET `/api/complaints/my-tasks` as STUDENT returns 403

### Task 4: Build Maintenance TasksPage UI
Create the maintenance-facing task queue interface.
- [ ] Subtask 4.1: Create `client/src/pages/maintenance/TasksPage.tsx` with task card layout showing category, student info, description
- [ ] Subtask 4.2: Implement `SLABadge` component showing "Overdue Xh" (red), "Due in Xh" (amber for <= 2h), or "Due in Xh" (muted) based on dueAt
- [ ] Subtask 4.3: Add priority badge with color-coded styling (CRITICAL: red border + bg, HIGH: orange, MEDIUM: yellow, LOW: green)
- [ ] Subtask 4.4: Implement "Start Work" button on ASSIGNED tasks calling PATCH status with IN_PROGRESS
- [ ] Subtask 4.5: Implement "Mark Resolved" flow on IN_PROGRESS tasks -- toggles resolution notes textarea + "Confirm Resolved"/"Cancel" buttons, requires non-empty notes
- [ ] Subtask 4.6: Implement empty state "No tasks assigned. You're all caught up!" when task list is empty

**Tests (AC-6, AC-7, AC-8):**
- [ ] Unit test: TasksPage renders SLABadge with correct urgency text
- [ ] Unit test: "Start Work" button calls PATCH with IN_PROGRESS status
- [ ] Unit test: "Mark Resolved" shows textarea, "Confirm Resolved" is disabled without notes
- [ ] Unit test: Empty state renders when no tasks

## Dependencies
- **Story 5.1** (completed) -- Complaint model, ComplaintEvent model, shared constants
- **Story 5.2** (completed) -- Assignment flow (creates ASSIGNED complaints for maintenance to work on)
- **Story 1.2** (completed) -- Auth middleware, role-based access control
- Requires `Notification` model with `COMPLAINT_RESOLVED` type

## File List

### Modified Files
- `server/src/services/complaint.service.ts` -- Added VALID_TRANSITIONS, updateStatus, getAssignedComplaints, getResolvedComplaints
- `server/src/controllers/complaint.controller.ts` -- Added updateStatus, getAssignedTasks, getResolvedTasks controllers
- `server/src/routes/complaint.routes.ts` -- Added GET /my-tasks, GET /my-history, PATCH /:id/status routes

### New Files
- `client/src/pages/maintenance/TasksPage.tsx` -- Maintenance task queue UI with SLA badges and status update actions

### Unchanged Files
- `server/src/models/complaint.model.ts` -- Complaint model (created in Story 5.1)
- `server/src/models/complaint-event.model.ts` -- ComplaintEvent model (created in Story 5.1)
- `server/src/models/notification.model.ts` -- Notification model (used for COMPLAINT_RESOLVED)
- `shared/constants/complaint-status.ts` -- ComplaintStatus enum (used for transition validation)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Status Transitions):** Implemented VALID_TRANSITIONS map with strict enforcement. The `updateStatus` function dynamically determines eventType (WORK_STARTED for IN_PROGRESS, COMPLAINT_RESOLVED for RESOLVED). Resolution notification is sent to the student only on RESOLVED transition.

**Task 2 (Task Queue):** `getAssignedComplaints` filters by assigneeId + active statuses and sorts by `dueAt: 1` so most urgent tasks appear first. `getResolvedComplaints` provides history sorted by most recently updated.

**Task 3 (Routes):** Status update endpoint accepts both MAINTENANCE and WARDEN_ADMIN roles (wardens can also update status). Task queue endpoints are MAINTENANCE-only.

**Task 4 (UI):** Built TasksPage with SLABadge showing overdue/due-soon/normal states. CRITICAL priority tasks get a distinct red border. Resolution flow requires non-empty notes before confirming. Auto-refetches task list after each action.

### Test Results
- Status transition validation: all valid transitions succeed, all invalid transitions return 409
- Notification creation verified on RESOLVED transition
- Task queue sorting verified by dueAt ascending

### New Dependencies
- None
