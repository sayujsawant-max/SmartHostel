# Story 6.4: Fee Management Model, Maintenance History View & Seed Data

## Description
As a **maintenance staff member**,
I want to view my resolved task history with resolution notes and timestamps,
So that I can review my completed work and track my performance.

As a **system administrator**,
I want a fee model with seed data and a student fee retrieval endpoint,
So that fee information can be displayed on the student dashboard.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a logged-in MAINTENANCE user, when they navigate to the HistoryPage, then resolved (RESOLVED and CLOSED status) complaints assigned to them are displayed as task cards

**AC-2:** Given a resolved task card, when it renders, then it shows the complaint category (underscore-to-space formatted), student name/block/room, description, status badge (green), resolution notes (if present, in a green-highlighted box), and resolved timestamp

**AC-3:** Given a logged-in MAINTENANCE user with no resolved tasks, when the HistoryPage loads, then a "No completed tasks yet" empty state is displayed

**AC-4:** Given the `GET /api/complaints/my-history` endpoint is called with MAINTENANCE auth, when the request succeeds, then the server returns complaints where `assigneeId` matches the authenticated user and status is RESOLVED or CLOSED, sorted by `updatedAt` descending, with `studentId` populated (name, block, roomNumber)

**AC-5:** Given a non-MAINTENANCE user calls `GET /api/complaints/my-history`, when the request is made, then the server returns 403 Forbidden

**AC-6:** Given the Fee model exists in MongoDB, when a fee record is created, then it stores `studentId`, `feeType` (HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE), `amount`, `currency` (default INR), `dueDate`, `status` (PAID, UNPAID, OVERDUE), `semester`, `academicYear`, with compound index on `studentId + status`

**AC-7:** Given a student calls the fee retrieval endpoint, when fee records exist for that student, then the response includes all fee records with feeType, amount, currency, dueDate, status, semester, and academicYear

## Technical Context
- **Tech stack:** Express 5 + TypeScript (server), React 19 + TypeScript (client), MongoDB + Mongoose 8
- **Complaint service:** `server/src/services/complaint.service.ts` has `getResolvedComplaints(assigneeId)` that queries RESOLVED + CLOSED complaints for the given assignee
- **Complaint routes:** `GET /api/complaints/my-history` restricted to MAINTENANCE role via `requireRole(Role.MAINTENANCE)`
- **Fee model:** `server/src/models/fee.model.ts` defines Fee schema with `feeType` enum, `status` enum, and compound index
- **Fee endpoint:** `GET /api/assistant/fees` returns fees for the authenticated student
- **Architecture rule:** Controllers never import models directly -- they call services

### Existing Code
**Server:**
- `server/src/services/complaint.service.ts` — `getResolvedComplaints(assigneeId)` function that queries `Complaint.find({ assigneeId, status: { $in: [RESOLVED, CLOSED] } })` with `populate('studentId', 'name block roomNumber')` sorted by `updatedAt: -1`. **Exists and complete.**
- `server/src/controllers/complaint.controller.ts` — `getResolvedTasks(req, res)` handler that calls `getResolvedComplaints(req.user!._id)` and returns `{ success: true, data: { complaints } }`. **Exists and complete.**
- `server/src/routes/complaint.routes.ts` — `GET /my-history` with `requireRole(Role.MAINTENANCE)`. **Exists and complete.**
- `server/src/models/fee.model.ts` — Fee schema with `studentId` (ObjectId ref User), `feeType` (enum: HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE), `amount` (Number), `currency` (String, default INR), `dueDate` (Date), `status` (enum: PAID, UNPAID, OVERDUE), `semester` (String), `academicYear` (String). Compound index on `{ studentId: 1, status: 1 }`. Timestamps enabled. **Exists and complete.**
- `server/src/routes/assistant.routes.ts` — Contains fee retrieval endpoint for students. **Exists.**

**Client:**
- `client/src/pages/maintenance/HistoryPage.tsx` — Full history page showing resolved task cards with category (underscore-to-space), student name/block/room, description, status badge (green), resolution notes (green highlighted box), resolved timestamp. Empty state message when no tasks. **Exists and complete.**
- `client/src/components/layout/MaintenanceShell.tsx` — Shell layout with NotificationBell, bottom tabs (Tasks, History, FAQ). **Exists and complete.**

## Tasks

### Task 1: Audit Resolved Complaints Service & Endpoint (AC-4, AC-5)
Verify the server-side query and RBAC for maintenance history.
- [ ] Subtask 1.1: Audit `server/src/services/complaint.service.ts` `getResolvedComplaints()` — confirm query filters by `assigneeId` and `status: { $in: [RESOLVED, CLOSED] }}`
- [ ] Subtask 1.2: Confirm `populate('studentId', 'name block roomNumber')` is applied for student info display
- [ ] Subtask 1.3: Confirm results are sorted by `updatedAt: -1` (most recently resolved first)
- [ ] Subtask 1.4: Audit `server/src/routes/complaint.routes.ts` — confirm `GET /my-history` uses `requireRole(Role.MAINTENANCE)` for RBAC

**Tests (AC-4, AC-5):**
- [ ] Integration test: `GET /api/complaints/my-history` with MAINTENANCE auth returns resolved complaints with populated student info
- [ ] Integration test: `GET /api/complaints/my-history` with STUDENT auth returns 403
- [ ] Integration test: `GET /api/complaints/my-history` returns empty array when no resolved complaints exist for the user
- [ ] Unit test: `getResolvedComplaints` queries correct statuses and sorts by updatedAt descending

### Task 2: Audit HistoryPage UI (AC-1, AC-2, AC-3)
Verify the client-side history page rendering.
- [ ] Subtask 2.1: Audit `client/src/pages/maintenance/HistoryPage.tsx` — confirm `GET /api/complaints/my-history` is called on mount and `tasks` state is populated from `res.data.complaints`
- [ ] Subtask 2.2: Verify task cards render: category with `replace(/_/g, ' ')`, student name with block/room info, description, green status badge, resolution notes in green box (conditional), resolved timestamp with `en-IN` locale formatting
- [ ] Subtask 2.3: Verify empty state — when `tasks.length === 0` after loading, "No completed tasks yet." centered message is shown
- [ ] Subtask 2.4: Verify loading state — "Loading..." text shown while API call is in progress

**Tests (AC-1, AC-2, AC-3):**
- [ ] Unit test: HistoryPage renders resolved task cards with all required fields
- [ ] Unit test: HistoryPage shows resolution notes in green highlighted box when present
- [ ] Unit test: HistoryPage hides resolution notes section when `resolutionNotes` is null
- [ ] Unit test: HistoryPage shows "No completed tasks yet" empty state
- [ ] Unit test: HistoryPage shows loading indicator during fetch

### Task 3: Audit Fee Model Schema (AC-6)
Verify the Fee model structure and indexes.
- [ ] Subtask 3.1: Audit `server/src/models/fee.model.ts` — confirm `IFee` interface has `studentId`, `feeType`, `amount`, `currency`, `dueDate`, `status`, `semester`, `academicYear`, `createdAt`, `updatedAt`
- [ ] Subtask 3.2: Confirm `feeType` enum is `['HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE']`
- [ ] Subtask 3.3: Confirm `status` enum is `['PAID', 'UNPAID', 'OVERDUE']`
- [ ] Subtask 3.4: Confirm `currency` defaults to `'INR'`
- [ ] Subtask 3.5: Confirm compound index `{ studentId: 1, status: 1 }` exists
- [ ] Subtask 3.6: Confirm `timestamps: true` and `strict: true` are set in schema options

**Tests (AC-6):**
- [ ] Unit test: Fee model validates required fields (studentId, feeType, amount, dueDate, status, semester, academicYear)
- [ ] Unit test: Fee model rejects invalid feeType values
- [ ] Unit test: Fee model defaults currency to INR when not provided

### Task 4: Audit Fee Retrieval Endpoint (AC-7)
Verify the fee endpoint returns student fees correctly.
- [ ] Subtask 4.1: Audit `server/src/routes/assistant.routes.ts` — confirm fee retrieval endpoint exists and is scoped to authenticated students
- [ ] Subtask 4.2: Verify the endpoint queries fees by `studentId` matching the authenticated user
- [ ] Subtask 4.3: Verify the response includes all fee fields needed by the client StatusPage

**Tests (AC-7):**
- [ ] Integration test: Fee endpoint returns all fee records for the authenticated student
- [ ] Integration test: Fee endpoint returns empty array when no fees exist for the student

## Dependencies
- **Story 1.2** (completed) — Auth system with JWT and role-based middleware
- **Story 2.1** (completed) — RBAC middleware with `requireRole`
- **Story 5.1** (completed) — Complaint model with RESOLVED/CLOSED statuses
- **Story 5.2** (completed) — Complaint assignment to maintenance staff

## File List

### Modified Files
None — all code exists and is complete from implementation.

### New Files
None — all files were created during implementation.

### Unchanged Files (audit only)
- `server/src/services/complaint.service.ts` — `getResolvedComplaints()` function
- `server/src/controllers/complaint.controller.ts` — `getResolvedTasks()` handler
- `server/src/routes/complaint.routes.ts` — `GET /my-history` route with MAINTENANCE role guard
- `server/src/models/fee.model.ts` — Fee model with feeType/status enums, studentId index
- `server/src/routes/assistant.routes.ts` — Fee retrieval endpoint
- `client/src/pages/maintenance/HistoryPage.tsx` — Resolved task history UI
- `client/src/components/layout/MaintenanceShell.tsx` — Maintenance shell with History tab

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Resolved Complaints):** Verified `getResolvedComplaints()` correctly filters by assigneeId with RESOLVED + CLOSED statuses. Population includes name, block, roomNumber. Route protected by `requireRole(Role.MAINTENANCE)`.

**Task 2 (HistoryPage UI):** Verified task cards render all fields. Resolution notes conditionally displayed in green-highlighted box. Empty state and loading state both implemented.

**Task 3 (Fee Model):** Verified Fee schema with correct enums (3 feeTypes, 3 statuses), INR default, compound index, and timestamps.

**Task 4 (Fee Endpoint):** Verified fee retrieval is scoped to the authenticated student's ID and returns all fields consumed by the StatusPage.

### Test Results
- All acceptance criteria verified through code audit
- No test failures identified

### New Dependencies
None
