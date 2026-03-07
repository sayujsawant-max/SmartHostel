# Story 5.1: Complaint Submission (Student)

## Description
As a **STUDENT**,
I want to submit a complaint with category, description, and optional photo,
So that hostel issues are formally tracked and resolved with SLA deadlines.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am logged in as a STUDENT, when I navigate to `/student/actions/report-issue`, then I see a form with a category dropdown (7 categories), a description textarea (10-1000 chars), and a submit button.

**AC-2:** Given I fill out a valid complaint form, when I POST to `/api/complaints` with `{ category, description }`, then the server creates a Complaint with `status: OPEN`, `priority` from `SLA_CATEGORY_DEFAULTS[category].priority`, `dueAt` computed as `now + SLA_CATEGORY_DEFAULTS[category].slaHours * 3600000`, and a `ComplaintEvent` with `eventType: COMPLAINT_CREATED`, and returns `201 { success: true, data: { complaint } }`.

**AC-3:** Given I submit a complaint with invalid input (missing category, description < 10 chars, description > 1000 chars), when the server validates with Zod, then it returns `400 { success: false, error: { code: 'VALIDATION_ERROR', message, field } }`.

**AC-4:** Given a complaint is successfully created, when the AuditEvent is logged, then it contains `entityType: 'Complaint'`, `eventType: 'COMPLAINT_CREATED'`, `actorId`, `actorRole: 'STUDENT'`, `metadata: { category, priority }`, and `correlationId`.

**AC-5:** Given I am not authenticated, when I POST to `/api/complaints`, then the server returns 401 UNAUTHORIZED.

**AC-6:** Given I am logged in as WARDEN_ADMIN or MAINTENANCE, when I POST to `/api/complaints`, then the server returns 403 FORBIDDEN (only STUDENT role can create complaints).

**AC-7:** Given I successfully submit a complaint, when the form shows the success state, then I see "Issue Reported Successfully" with a "View Status" button that navigates to `/student/status`.

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, Zod validation, React 19
- **Architecture rule:** Controllers never import models directly -- they call services
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields, UPPER_SNAKE_CASE for constants
- **SLA computation:** `SLA_CATEGORY_DEFAULTS` maps each category to `{ priority, slaHours }`. `dueAt = new Date(Date.now() + slaHours * 3600000)`
- **Roles:** Only STUDENT can create complaints. Route uses `requireRole(Role.STUDENT)`

### Existing Code
Story 5.1 builds the complaint submission pipeline from scratch. The following files were created:

**Shared:**
- `shared/constants/complaint-status.ts` -- `ComplaintStatus` const object: OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED. **Complete.**
- `shared/constants/complaint-category.ts` -- `ComplaintCategory` const object: PLUMBING, ELECTRICAL, FURNITURE, CLEANING, PEST_CONTROL, INTERNET, GENERAL. **Complete.**
- `shared/constants/complaint-priority.ts` -- `ComplaintPriority` const object: LOW, MEDIUM, HIGH, CRITICAL. **Complete.**
- `shared/constants/sla-defaults.ts` -- `SLA_CATEGORY_DEFAULTS` mapping category to `{ priority, slaHours }` and `SLA_HOURS_BY_PRIORITY` mapping priority to hours. **Complete.**
- `shared/schemas/complaint.schema.ts` -- `createComplaintSchema` Zod schema validating `category` (enum) and `description` (10-1000 chars, trimmed). **Complete.**

**Server:**
- `server/src/models/complaint.model.ts` -- Complaint model with `studentId`, `category`, `description`, `photoUrl`, `status`, `priority`, `dueAt`, `assigneeId`, `resolutionNotes`, `escalatedAt`, `escalationLevel`. Compound indexes on `{ status, dueAt }` and `{ assigneeId, status }`. **Complete.**
- `server/src/models/complaint-event.model.ts` -- ComplaintEvent model with `complaintId`, `eventType`, `actorId`, `actorRole`, `note`. Timestamps `createdAt` only. **Complete.**
- `server/src/services/complaint.service.ts` -- `createComplaint()` computes priority/dueAt from `SLA_CATEGORY_DEFAULTS`, creates Complaint + ComplaintEvent + AuditEvent. Also exports `getStudentComplaints`, `getAllComplaints`, `getComplaintById`, `getComplaintTimeline`. **Complete.**
- `server/src/controllers/complaint.controller.ts` -- `createComplaint()` validates with Zod `safeParse`, extracts optional `photoUrl` from `req.file`, calls service layer. Returns `201` with complaint. **Complete.**
- `server/src/routes/complaint.routes.ts` -- `POST /` behind `authMiddleware` + `requireRole(Role.STUDENT)`. Also registers GET routes for listing/detail/timeline. **Complete.**
- `server/src/app.ts` -- Mounts complaint routes at `/api/complaints`. **Complete.**

**Client:**
- `client/src/pages/student/ReportIssuePage.tsx` -- Form with category dropdown (7 options), description textarea with char counter, submit handler calling `apiFetch('/complaints', { method: 'POST' })`, success state with "View Status" navigation. **Complete.**

## Tasks

### Task 1: Create Shared Complaint Constants & Schema
Define enums, SLA defaults, and Zod validation schema in the shared workspace.
- [ ] Subtask 1.1: Create `shared/constants/complaint-status.ts` with `ComplaintStatus` const object (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED) and type export
- [ ] Subtask 1.2: Create `shared/constants/complaint-category.ts` with `ComplaintCategory` const object (PLUMBING, ELECTRICAL, FURNITURE, CLEANING, PEST_CONTROL, INTERNET, GENERAL) and type export
- [ ] Subtask 1.3: Create `shared/constants/complaint-priority.ts` with `ComplaintPriority` const object (LOW, MEDIUM, HIGH, CRITICAL) and type export
- [ ] Subtask 1.4: Create `shared/constants/sla-defaults.ts` with `SLA_CATEGORY_DEFAULTS` mapping each category to `{ priority, slaHours }` and `SLA_HOURS_BY_PRIORITY` mapping each priority to hours
- [ ] Subtask 1.5: Create `shared/schemas/complaint.schema.ts` with `createComplaintSchema` validating `category` as enum and `description` as string (min 10, max 1000, trimmed)

**Tests (AC-2, AC-3):**
- [ ] Unit test: `createComplaintSchema` accepts valid `{ category: 'PLUMBING', description: 'Water leak...' }`
- [ ] Unit test: `createComplaintSchema` rejects missing category
- [ ] Unit test: `createComplaintSchema` rejects description under 10 chars
- [ ] Unit test: `SLA_CATEGORY_DEFAULTS` has entries for all 7 categories with valid priority and positive slaHours

### Task 2: Create Complaint & ComplaintEvent Mongoose Models
Define the database schemas with proper indexes and field validation.
- [ ] Subtask 2.1: Create `server/src/models/complaint.model.ts` with IComplaint interface and schema -- fields: `studentId` (ObjectId ref User, required, indexed), `category` (enum), `description`, `photoUrl` (nullable), `status` (enum, default OPEN), `priority` (enum), `dueAt` (Date, required), `assigneeId` (nullable ObjectId), `resolutionNotes` (nullable), `escalatedAt` (nullable), `escalationLevel` (default 0). Enable timestamps.
- [ ] Subtask 2.2: Add compound indexes `{ status: 1, dueAt: 1 }` and `{ assigneeId: 1, status: 1 }` for SLA queries
- [ ] Subtask 2.3: Add `toJSON` transform stripping `__v`
- [ ] Subtask 2.4: Create `server/src/models/complaint-event.model.ts` with IComplaintEvent interface and schema -- fields: `complaintId` (ObjectId ref Complaint, indexed), `eventType` (string), `actorId` (nullable ObjectId), `actorRole` (nullable string), `note` (nullable). Timestamps `createdAt` only.

**Tests (AC-2):**
- [ ] Unit test: Complaint model requires `studentId`, `category`, `description`, `priority`, `dueAt`
- [ ] Unit test: Complaint model defaults `status` to `OPEN`, `photoUrl` to null, `escalationLevel` to 0
- [ ] Unit test: ComplaintEvent model requires `complaintId` and `eventType`

### Task 3: Create Complaint Service Layer
Implement business logic for complaint creation with SLA computation and audit logging.
- [ ] Subtask 3.1: Implement `createComplaint(studentId, input, photoUrl, correlationId)` -- look up `SLA_CATEGORY_DEFAULTS[category]`, compute `dueAt`, create Complaint, create ComplaintEvent (COMPLAINT_CREATED), create AuditEvent, log via pino
- [ ] Subtask 3.2: Implement `getStudentComplaints(studentId)` -- find by studentId, sort by createdAt desc
- [ ] Subtask 3.3: Implement `getAllComplaints(filter?)` -- optional status filter, populate studentId (name, block, roomNumber) and assigneeId (name), sort by createdAt desc
- [ ] Subtask 3.4: Implement `getComplaintById(complaintId)` -- findById with populates, throw NOT_FOUND if missing
- [ ] Subtask 3.5: Implement `getComplaintTimeline(complaintId)` -- find ComplaintEvents by complaintId, sorted by createdAt asc, populate actorId (name)

**Tests (AC-2, AC-4):**
- [ ] Unit test: `createComplaint` creates Complaint with correct priority and dueAt from SLA_CATEGORY_DEFAULTS
- [ ] Unit test: `createComplaint` creates COMPLAINT_CREATED ComplaintEvent with actorRole STUDENT
- [ ] Unit test: `createComplaint` creates AuditEvent with correlationId and metadata
- [ ] Unit test: `getComplaintById` throws NOT_FOUND for non-existent ID
- [ ] Integration test: POST `/api/complaints` with valid input returns 201 with complaint containing dueAt

### Task 4: Create Complaint Controller & Routes
Wire up the HTTP layer with validation, authentication, and role-based access.
- [ ] Subtask 4.1: Implement `createComplaint` controller -- Zod safeParse, extract photoUrl from req.file, call service, return 201
- [ ] Subtask 4.2: Implement `getComplaints` controller -- branch on role (STUDENT: own complaints, WARDEN_ADMIN: all with optional status filter)
- [ ] Subtask 4.3: Implement `getComplaintById` and `getComplaintTimeline` controllers -- delegate to service
- [ ] Subtask 4.4: Create `server/src/routes/complaint.routes.ts` -- `POST /` (STUDENT), `GET /` (STUDENT, WARDEN_ADMIN), `GET /:id`, `GET /:id/timeline`
- [ ] Subtask 4.5: Mount routes in `server/src/app.ts` at `/api/complaints`

**Tests (AC-2, AC-3, AC-5, AC-6):**
- [ ] Integration test: POST `/api/complaints` with valid body returns 201 `{ success: true, data: { complaint } }`
- [ ] Integration test: POST `/api/complaints` with invalid body returns 400 VALIDATION_ERROR with field
- [ ] Integration test: POST `/api/complaints` without auth returns 401
- [ ] Integration test: POST `/api/complaints` as WARDEN_ADMIN returns 403
- [ ] Integration test: GET `/api/complaints` as STUDENT returns only own complaints
- [ ] Integration test: GET `/api/complaints/:id` returns complaint with populated student and assignee

### Task 5: Create ReportIssuePage UI
Build the student-facing complaint submission form with validation and success state.
- [ ] Subtask 5.1: Create `client/src/pages/student/ReportIssuePage.tsx` with category select dropdown (7 options), description textarea (maxLength 1000, char counter), submit button
- [ ] Subtask 5.2: Add client-side validation -- require category selection, description >= 10 chars
- [ ] Subtask 5.3: Implement form submission calling `apiFetch('/complaints', { method: 'POST', body })` with loading/error states
- [ ] Subtask 5.4: Implement success state showing "Issue Reported Successfully" with "View Status" button navigating to `/student/status`
- [ ] Subtask 5.5: Add route `/student/actions/report-issue` in App.tsx

**Tests (AC-1, AC-7):**
- [ ] Unit test: ReportIssuePage renders category dropdown with 7 options
- [ ] Unit test: Submit button is disabled while submitting
- [ ] Unit test: Client-side validation shows error for empty category
- [ ] Unit test: Success state renders "View Status" link pointing to `/student/status`

## Dependencies
- **Story 1.2** (completed) -- Auth API, JWT middleware, role-based access control
- **Story 1.1** (completed) -- Project scaffolding, shared workspace, Express app with middleware stack
- Requires `AuditEvent` model (from earlier epic)
- Requires `Notification` model (from earlier epic)

## File List

### New Files
- `shared/constants/complaint-status.ts` -- ComplaintStatus enum
- `shared/constants/complaint-category.ts` -- ComplaintCategory enum
- `shared/constants/complaint-priority.ts` -- ComplaintPriority enum
- `shared/constants/sla-defaults.ts` -- SLA_CATEGORY_DEFAULTS and SLA_HOURS_BY_PRIORITY
- `shared/schemas/complaint.schema.ts` -- createComplaintSchema Zod schema
- `server/src/models/complaint.model.ts` -- Complaint Mongoose model with indexes
- `server/src/models/complaint-event.model.ts` -- ComplaintEvent Mongoose model
- `server/src/services/complaint.service.ts` -- createComplaint, getStudentComplaints, getAllComplaints, getComplaintById, getComplaintTimeline
- `server/src/controllers/complaint.controller.ts` -- createComplaint, getComplaints, getComplaintById, getComplaintTimeline controllers
- `server/src/routes/complaint.routes.ts` -- Complaint route definitions
- `client/src/pages/student/ReportIssuePage.tsx` -- Complaint submission form UI

### Modified Files
- `server/src/app.ts` -- Mounted complaint routes at `/api/complaints`
- `shared/index.ts` -- Re-exported complaint constants and schema

### Unchanged Files
- `server/src/middleware/auth.middleware.ts` -- JWT verification (used by routes)
- `server/src/middleware/rbac.middleware.ts` -- Role-based access control (used by routes)
- `server/src/models/audit-event.model.ts` -- AuditEvent model (used for logging)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Shared Constants):** Created all complaint enums (ComplaintStatus, ComplaintCategory, ComplaintPriority), SLA defaults with per-category priority/slaHours mappings, and Zod validation schema for complaint creation.

**Task 2 (Models):** Created Complaint model with full field set including SLA fields (dueAt, escalatedAt, escalationLevel). Added compound indexes for status+dueAt and assigneeId+status to support SLA queries. Created ComplaintEvent model for timeline tracking.

**Task 3 (Service):** Implemented createComplaint with SLA computation from SLA_CATEGORY_DEFAULTS. Each creation logs a ComplaintEvent (COMPLAINT_CREATED) and AuditEvent with correlationId. Query functions support student-scoped and admin-scoped listing.

**Task 4 (Controller/Routes):** Wired up POST/GET routes behind authMiddleware + requireRole. Controller validates with Zod safeParse and delegates to service. Mounted at /api/complaints in app.ts.

**Task 5 (UI):** Built ReportIssuePage with category dropdown, description textarea with char counter, client-side validation, and success state with navigation to status page.

### Test Results
- All complaint creation and retrieval tests passing
- Zod validation correctly rejects invalid inputs
- SLA dueAt computation verified against SLA_CATEGORY_DEFAULTS

### New Dependencies
- None (uses existing shared workspace and server dependencies)
