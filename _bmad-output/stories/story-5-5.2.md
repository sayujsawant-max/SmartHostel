# Story 5.2: Complaint Assignment & Priority (Warden)

## Description
As a **WARDEN_ADMIN**,
I want to assign complaints to maintenance staff with priority overrides,
So that issues are routed to the right person with clear urgency and recalculated SLA deadlines.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a complaint is in OPEN status, when I PATCH `/api/complaints/:id/assign` with `{ assigneeId }`, then the complaint transitions atomically to ASSIGNED, `assigneeId` is set, a `ComplaintEvent` (COMPLAINT_ASSIGNED) is created with `actorId` and `actorRole: WARDEN_ADMIN`, an `AuditEvent` is logged, and a `COMPLAINT_ASSIGNED` notification is sent to the maintenance staff member.

**AC-2:** Given a complaint is not in OPEN status, when I PATCH `/api/complaints/:id/assign`, then the server returns `409 { success: false, error: { code: 'CONFLICT', message: 'Complaint is not in OPEN status or does not exist' } }`.

**AC-3:** Given a valid complaint exists, when I PATCH `/api/complaints/:id/priority` with `{ priority: 'CRITICAL' }`, then the complaint priority is updated, `dueAt` is recalculated as `createdAt + SLA_HOURS_BY_PRIORITY[newPriority] * 3600000`, a `ComplaintEvent` (PRIORITY_CHANGED) is created with note showing old and new priority, and an `AuditEvent` is logged with `{ oldPriority, newPriority, newDueAt }`.

**AC-4:** Given I am a WARDEN_ADMIN, when I PATCH `/api/complaints/:id/priority` with an invalid priority value (e.g., 'INVALID'), then the server returns `400 { success: false, error: { code: 'VALIDATION_ERROR', field: 'priority' } }`.

**AC-5:** Given I am a WARDEN_ADMIN, when I PATCH `/api/complaints/:id/assign` without `assigneeId` in the body, then the server returns `400 { success: false, error: { code: 'VALIDATION_ERROR', field: 'assigneeId' } }`.

**AC-6:** Given I am logged in as WARDEN_ADMIN, when I GET `/api/complaints/maintenance-staff`, then the server returns `{ staff: [{ _id, name }] }` containing only active MAINTENANCE role users.

**AC-7:** Given I am logged in as WARDEN_ADMIN, when I navigate to the ComplaintsPage, then I see a list of complaints with status/priority badges, a status filter dropdown, inline assignment flow (staff selector + confirm) on OPEN complaints, and a priority override dropdown on OPEN complaints.

**AC-8:** Given I am not a WARDEN_ADMIN, when I attempt to assign or change priority, then the server returns 403 FORBIDDEN.

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, React 19
- **Assignment:** Atomic `findOneAndUpdate` with `{ _id, status: 'OPEN' }` filter ensures no double-assignment race condition
- **Priority recalculation:** Uses `SLA_HOURS_BY_PRIORITY` from `shared/constants/sla-defaults.ts` to compute new `dueAt` from `createdAt`
- **Notification:** Creates `Notification` document with `type: COMPLAINT_ASSIGNED` for the assignee
- **Routes:** PATCH endpoints require `requireRole(Role.WARDEN_ADMIN)`

### Existing Code
Story 5.2 extends the complaint service and routes from Story 5.1. The following files are modified or created:

**Server:**
- `server/src/services/complaint.service.ts` -- Extended with `assignComplaint()` (atomic findOneAndUpdate OPEN->ASSIGNED, creates ComplaintEvent + AuditEvent + Notification), `updatePriority()` (recalculates dueAt from SLA_HOURS_BY_PRIORITY, creates ComplaintEvent + AuditEvent), and `getMaintenanceStaff()` (finds active MAINTENANCE users). **Complete.**
- `server/src/controllers/complaint.controller.ts` -- Extended with `assignComplaint()` (validates assigneeId), `updatePriority()` (validates priority enum), and `getMaintenanceStaff()` controllers. **Complete.**
- `server/src/routes/complaint.routes.ts` -- Added `PATCH /:id/assign` (WARDEN_ADMIN), `PATCH /:id/priority` (WARDEN_ADMIN), `GET /maintenance-staff` (WARDEN_ADMIN). **Complete.**

**Client:**
- `client/src/pages/warden/ComplaintsPage.tsx` -- Complaint list with status/priority badges, status filter dropdown, inline assignment flow (staff selector + confirm button), priority override dropdown on OPEN complaints. Fetches complaints and maintenance staff in parallel. **Complete.**

## Tasks

### Task 1: Add assignComplaint Service Function
Implement atomic assignment with event/audit/notification creation.
- [ ] Subtask 1.1: Implement `assignComplaint(complaintId, assigneeId, actorId, correlationId)` using `Complaint.findOneAndUpdate({ _id: complaintId, status: 'OPEN' }, { status: 'ASSIGNED', assigneeId }, { new: true })`
- [ ] Subtask 1.2: If `findOneAndUpdate` returns null, throw `AppError('CONFLICT', 'Complaint is not in OPEN status or does not exist', 409)`
- [ ] Subtask 1.3: Create `ComplaintEvent` with `eventType: 'COMPLAINT_ASSIGNED'`, `actorRole: Role.WARDEN_ADMIN`, note with assigneeId
- [ ] Subtask 1.4: Create `AuditEvent` with metadata `{ assigneeId }`
- [ ] Subtask 1.5: Create `Notification` with `type: COMPLAINT_ASSIGNED`, `recipientId: assigneeId`, title and body describing the assignment

**Tests (AC-1, AC-2):**
- [ ] Unit test: `assignComplaint` transitions complaint from OPEN to ASSIGNED and sets assigneeId
- [ ] Unit test: `assignComplaint` creates COMPLAINT_ASSIGNED ComplaintEvent with actorRole WARDEN_ADMIN
- [ ] Unit test: `assignComplaint` creates Notification for the assignee
- [ ] Unit test: `assignComplaint` throws CONFLICT when complaint is not OPEN
- [ ] Integration test: PATCH `/api/complaints/:id/assign` on OPEN complaint returns 200 with updated complaint

### Task 2: Add updatePriority Service Function
Implement priority override with SLA recalculation.
- [ ] Subtask 2.1: Implement `updatePriority(complaintId, priority, actorId, correlationId)` -- look up `SLA_HOURS_BY_PRIORITY[priority]`, compute new `dueAt` from `complaint.createdAt`, save complaint
- [ ] Subtask 2.2: Create `ComplaintEvent` with `eventType: 'PRIORITY_CHANGED'`, note showing old and new priority
- [ ] Subtask 2.3: Create `AuditEvent` with metadata `{ oldPriority, newPriority, newDueAt }`
- [ ] Subtask 2.4: Return updated complaint

**Tests (AC-3):**
- [ ] Unit test: `updatePriority` recalculates dueAt from createdAt + SLA_HOURS_BY_PRIORITY
- [ ] Unit test: `updatePriority` creates PRIORITY_CHANGED ComplaintEvent with old/new priority note
- [ ] Unit test: `updatePriority` throws NOT_FOUND for non-existent complaint
- [ ] Integration test: PATCH `/api/complaints/:id/priority` with valid priority returns updated complaint with new dueAt

### Task 3: Add Controller Endpoints & Routes
Wire up assignment and priority HTTP endpoints with validation.
- [ ] Subtask 3.1: Implement `assignComplaint` controller -- validate `assigneeId` presence, delegate to service
- [ ] Subtask 3.2: Implement `updatePriority` controller -- validate priority against `ComplaintPriority` enum, delegate to service
- [ ] Subtask 3.3: Implement `getMaintenanceStaff` controller -- delegate to service, return `{ staff }`
- [ ] Subtask 3.4: Add routes: `PATCH /:id/assign` (WARDEN_ADMIN), `PATCH /:id/priority` (WARDEN_ADMIN), `GET /maintenance-staff` (WARDEN_ADMIN)

**Tests (AC-4, AC-5, AC-6, AC-8):**
- [ ] Integration test: PATCH `/api/complaints/:id/assign` without assigneeId returns 400 VALIDATION_ERROR
- [ ] Integration test: PATCH `/api/complaints/:id/priority` with invalid priority returns 400 VALIDATION_ERROR
- [ ] Integration test: PATCH `/api/complaints/:id/assign` as STUDENT returns 403
- [ ] Integration test: GET `/api/complaints/maintenance-staff` returns active MAINTENANCE users

### Task 4: Build Warden ComplaintsPage UI
Create the complaint management interface for wardens.
- [ ] Subtask 4.1: Create `client/src/pages/warden/ComplaintsPage.tsx` with complaint list rendering status/priority badges
- [ ] Subtask 4.2: Add status filter dropdown (All, Open, Assigned, In Progress, Resolved)
- [ ] Subtask 4.3: Implement inline assignment flow on OPEN complaints -- click "Assign" button shows staff selector dropdown + "Confirm"/"Cancel" buttons
- [ ] Subtask 4.4: Implement priority override dropdown on OPEN complaints calling PATCH priority endpoint
- [ ] Subtask 4.5: Fetch complaints and maintenance staff in parallel on mount, re-fetch after assign/priority changes

**Tests (AC-7):**
- [ ] Unit test: ComplaintsPage renders complaint cards with status and priority badges
- [ ] Unit test: Status filter dropdown filters displayed complaints
- [ ] Unit test: Assign button toggles staff selector inline
- [ ] Unit test: Priority dropdown calls PATCH endpoint on change

## Dependencies
- **Story 5.1** (completed) -- Complaint model, service, routes, shared constants
- **Story 1.2** (completed) -- Auth middleware, role-based access control
- Requires `Notification` model (from earlier epic)
- Requires active MAINTENANCE role users in database for assignment dropdown

## File List

### Modified Files
- `server/src/services/complaint.service.ts` -- Added `assignComplaint`, `updatePriority`, `getMaintenanceStaff` functions
- `server/src/controllers/complaint.controller.ts` -- Added `assignComplaint`, `updatePriority`, `getMaintenanceStaff` controllers
- `server/src/routes/complaint.routes.ts` -- Added PATCH /:id/assign, PATCH /:id/priority, GET /maintenance-staff routes

### New Files
- `client/src/pages/warden/ComplaintsPage.tsx` -- Warden complaint management UI with assignment and priority controls

### Unchanged Files
- `server/src/models/complaint.model.ts` -- Complaint model (created in Story 5.1)
- `server/src/models/complaint-event.model.ts` -- ComplaintEvent model (created in Story 5.1)
- `shared/constants/sla-defaults.ts` -- SLA_HOURS_BY_PRIORITY used for dueAt recalculation
- `server/src/models/notification.model.ts` -- Notification model (used for assignment notifications)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Assignment):** Implemented `assignComplaint` with atomic `findOneAndUpdate` guarding against race conditions on OPEN status. Creates ComplaintEvent, AuditEvent, and Notification for the assigned maintenance staff member.

**Task 2 (Priority):** Implemented `updatePriority` using `SLA_HOURS_BY_PRIORITY` lookup. New `dueAt` is computed from `complaint.createdAt` (not current time) to maintain SLA accountability. Both old and new priority are recorded in ComplaintEvent note and AuditEvent metadata.

**Task 3 (Routes):** Added three WARDEN_ADMIN-only endpoints. Assignment and priority controllers validate inputs before delegating to service. Maintenance staff endpoint returns `_id` and `name` only for dropdown population.

**Task 4 (UI):** Built ComplaintsPage with parallel data fetching, inline assignment flow (toggle staff selector per complaint), and priority dropdown. Data re-fetches after each mutation to keep UI in sync.

### Test Results
- Assignment flow tested: OPEN->ASSIGNED transition, CONFLICT on non-OPEN, notification creation
- Priority recalculation verified against SLA_HOURS_BY_PRIORITY values
- Role-based access verified: only WARDEN_ADMIN can assign/change priority

### New Dependencies
- None
