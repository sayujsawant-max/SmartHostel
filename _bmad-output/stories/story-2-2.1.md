# Story 2.1: Leave Request Model & API

## Description
As a **student**,
I want to create a leave request with type, date range, and reason,
So that I can submit it for warden approval and track my leave history.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a STUDENT, when I POST `/api/leaves` with valid data `{ type: "DAY_OUTING"|"OVERNIGHT", startDate, endDate, reason }`, then a leave with status PENDING is created and returned with 201, and a PASS_REQUESTED audit event is logged

**AC-2:** Given I submit a leave request, when the dates are invalid (endDate before startDate, startDate in the past), then zod validation rejects with VALIDATION_ERROR and field-level errors including the failing field name

**AC-3:** Given I submit a leave request, when I already have an active leave (PENDING or APPROVED) overlapping the requested date range, then the server returns 409 CONFLICT with message "You already have an active leave overlapping this date range"

**AC-4:** Given I am NOT a STUDENT (e.g., WARDEN_ADMIN, GUARD, MAINTENANCE), when I attempt to POST `/api/leaves`, then the server returns 403 FORBIDDEN with message "Insufficient permissions"

**AC-5:** Given I am a STUDENT, when I GET `/api/leaves`, then I see only my own leaves sorted by createdAt descending (data visibility scoped by studentId)

**AC-6:** Given I am a WARDEN_ADMIN, when I GET `/api/leaves?status=PENDING`, then I see all leaves matching the filter with studentId populated (name, email, block, floor, roomNumber)

**AC-7:** Given I am not authenticated, when I attempt any `/api/leaves` endpoint, then the server returns 401 UNAUTHORIZED

**AC-8:** Given I submit a leave request, when the reason is shorter than 5 characters or longer than 500 characters, then validation rejects with VALIDATION_ERROR

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, Zod validation (shared workspace)
- **Shared constants:** `LeaveStatus` (10-value const object) in `shared/constants/leave-status.ts`, `LeaveType` (DAY_OUTING, OVERNIGHT) in `shared/constants/leave-types.ts`
- **Shared schema:** `createLeaveSchema` in `shared/schemas/leave.schema.ts` with Zod — validates type enum, startDate (ISO datetime, >= today), endDate (>= startDate), reason (string, min 5, max 500, trimmed)
- **Architecture rule:** Controllers never import models directly — they call services
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields, UPPER_SNAKE_CASE for enums/error codes
- **Overlap detection formula:** `existing.startDate <= new.endDate AND existing.endDate >= new.startDate` with status in [PENDING, APPROVED]
- **Route mounting:** Leave routes mounted at `/api/leaves` in `server/src/app.ts`
- **RBAC:** `requireRole(Role.STUDENT)` for POST, `requireRole(Role.STUDENT, Role.WARDEN_ADMIN)` for GET

### Existing Code
Story 1.2 delivered the auth stack, RBAC middleware, and CSRF middleware. The following files existed before this story:

**Server:**
- `server/src/middleware/auth.middleware.ts` -- JWT verification from accessToken cookie. **Exists and functional.**
- `server/src/middleware/rbac.middleware.ts` -- `requireRole(...allowedRoles)` factory checking `req.user.role`. **Exists and functional.**
- `server/src/middleware/csrf.middleware.ts` -- Origin/Referer validation on POST/PATCH/DELETE. **Exists and functional.**
- `server/src/utils/app-error.ts` -- AppError class with code, message, statusCode. **Exists and functional.**
- `server/src/middleware/error-handler.middleware.ts` -- Global error handler returning `{ success: false, error: { code, message } }`. **Exists and functional.**
- `server/src/utils/logger.ts` -- Pino logger instance. **Exists and functional.**
- `server/src/models/user.model.ts` -- User model with role, block, floor, roomNumber. **Exists and functional.**
- `server/src/models/audit-event.model.ts` -- AuditEvent model with entityType, entityId, eventType, actorId, actorRole, metadata, correlationId. **Exists and functional.**
- `server/src/app.ts` -- Express app with middleware stack. **Needed route registration for `/api/leaves`.**

**Shared:**
- `shared/constants/roles.ts` -- Role const object (STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE). **Exists and functional.**
- `shared/constants/error-codes.ts` -- ErrorCode enum including VALIDATION_ERROR, CONFLICT. **Exists and functional.**
- `shared/index.ts` -- Barrel export for shared workspace. **Needed new exports.**

## Tasks

### Task 1: Create Leave Constants (shared)
Define the leave-related enums in the shared workspace for use by both server and client.
- [ ] Subtask 1.1: Create `shared/constants/leave-status.ts` with `LeaveStatus` const object containing all 10 states: PENDING, APPROVED, REJECTED, CANCELLED, SCANNED_OUT, SCANNED_IN, COMPLETED, EXPIRED, REVOKED, CORRECTED
- [ ] Subtask 1.2: Create `shared/constants/leave-types.ts` with `LeaveType` const object containing DAY_OUTING and OVERNIGHT
- [ ] Subtask 1.3: Export both from `shared/index.ts`

**Tests (AC-1):**
- [ ] Unit test: `LeaveStatus` object contains all 10 expected keys
- [ ] Unit test: `LeaveType` object contains DAY_OUTING and OVERNIGHT

### Task 2: Create Leave Validation Schema (shared)
Create the Zod schema for validating leave creation payloads.
- [ ] Subtask 2.1: Create `shared/schemas/leave.schema.ts` with `createLeaveSchema` using Zod
- [ ] Subtask 2.2: Validate `type` as enum of LeaveType values
- [ ] Subtask 2.3: Validate `startDate` as ISO datetime string refined to be today or future
- [ ] Subtask 2.4: Validate `endDate` as ISO datetime string, with cross-field refinement ensuring endDate >= startDate (path: ['endDate'])
- [ ] Subtask 2.5: Validate `reason` as string with min 5, max 500, trimmed
- [ ] Subtask 2.6: Export `CreateLeaveInput` type and schema from `shared/index.ts`

**Tests (AC-2, AC-8):**
- [ ] Unit test: valid payload passes schema validation
- [ ] Unit test: startDate in the past is rejected
- [ ] Unit test: endDate before startDate is rejected with path ['endDate']
- [ ] Unit test: reason shorter than 5 chars is rejected
- [ ] Unit test: reason longer than 500 chars is rejected
- [ ] Unit test: invalid type value is rejected

### Task 3: Create Leave Model
Create the Mongoose model for leave requests.
- [ ] Subtask 3.1: Create `server/src/models/leave.model.ts` with `ILeave` interface extending Document
- [ ] Subtask 3.2: Define schema fields: studentId (ObjectId ref User, required, indexed), type (enum LeaveType, required), startDate (Date, required), endDate (Date, required), reason (String, required), status (enum LeaveStatus, default PENDING, indexed), approvedBy (ObjectId ref User), approvedAt (Date), rejectionReason (String), outLoggedAt (Date), inLoggedAt (Date)
- [ ] Subtask 3.3: Configure collection name `leaves`, timestamps: true, strict: true
- [ ] Subtask 3.4: Add toJSON transform to strip `__v`
- [ ] Subtask 3.5: Add compound index `{ studentId: 1, status: 1 }` for overlap queries

**Tests (AC-1):**
- [ ] Unit test: Leave.create with valid data creates document with status PENDING
- [ ] Unit test: Leave.create without required fields throws validation error
- [ ] Unit test: toJSON transform removes __v from output

### Task 4: Create Leave Service
Implement the business logic for leave creation and retrieval.
- [ ] Subtask 4.1: Create `server/src/services/leave.service.ts` with `createLeave(studentId, data, correlationId)` function
- [ ] Subtask 4.2: Parse ISO date strings to Date objects for startDate and endDate
- [ ] Subtask 4.3: Implement overlap detection: query `Leave.findOne` where studentId matches, status is in [PENDING, APPROVED], and dates overlap (startDate <= newEnd AND endDate >= newStart); throw AppError CONFLICT if found
- [ ] Subtask 4.4: Create Leave document with status PENDING and log PASS_REQUESTED audit event
- [ ] Subtask 4.5: Implement `getStudentLeaves(studentId)` returning leaves sorted by createdAt desc
- [ ] Subtask 4.6: Implement `getAllLeaves(filters?)` with optional status filter, populating studentId with name, email, block, floor, roomNumber

**Tests (AC-1, AC-3, AC-5, AC-6):**
- [ ] Unit test: createLeave creates a leave with PENDING status
- [ ] Unit test: createLeave throws CONFLICT when overlapping active leave exists
- [ ] Unit test: createLeave does NOT throw when existing leave is REJECTED/CANCELLED (non-active)
- [ ] Unit test: getStudentLeaves returns only leaves for the given studentId
- [ ] Unit test: getAllLeaves with status filter returns only matching leaves
- [ ] Unit test: createLeave creates a PASS_REQUESTED audit event

### Task 5: Create Leave Controller
Implement the request handlers that validate input and delegate to the service.
- [ ] Subtask 5.1: Create `server/src/controllers/leave.controller.ts` with `createLeave(req, res)` handler
- [ ] Subtask 5.2: Parse and validate body with `createLeaveSchema.safeParse`; on failure, throw AppError VALIDATION_ERROR with field info
- [ ] Subtask 5.3: Call `leaveService.createLeave` with `req.user._id` and return 201 with `{ success: true, data: { leave }, correlationId }`
- [ ] Subtask 5.4: Implement `getLeaves(req, res)` handler: if user is STUDENT, call `getStudentLeaves`; otherwise call `getAllLeaves` with optional status query param

**Tests (AC-1, AC-2, AC-4, AC-5, AC-6, AC-7):**
- [ ] Integration test: POST `/api/leaves` with valid STUDENT auth returns 201 with leave data
- [ ] Integration test: POST `/api/leaves` with invalid body returns 400 VALIDATION_ERROR
- [ ] Integration test: POST `/api/leaves` with WARDEN_ADMIN auth returns 403
- [ ] Integration test: POST `/api/leaves` without auth returns 401
- [ ] Integration test: GET `/api/leaves` as STUDENT returns only that student's leaves
- [ ] Integration test: GET `/api/leaves?status=PENDING` as WARDEN_ADMIN returns all pending leaves with populated student info

### Task 6: Create Leave Routes
Wire up the leave endpoints with auth and RBAC middleware.
- [ ] Subtask 6.1: Create `server/src/routes/leave.routes.ts` with Router
- [ ] Subtask 6.2: Apply `authMiddleware` to all routes via `router.use(authMiddleware)`
- [ ] Subtask 6.3: Register `POST /` with `requireRole(Role.STUDENT)` and `leaveController.createLeave`
- [ ] Subtask 6.4: Register `GET /` with `requireRole(Role.STUDENT, Role.WARDEN_ADMIN)` and `leaveController.getLeaves`

**Tests (AC-4, AC-7):**
- [ ] Integration test: POST `/api/leaves` route is accessible only to STUDENT role
- [ ] Integration test: GET `/api/leaves` route is accessible to both STUDENT and WARDEN_ADMIN

### Task 7: Register Leave Routes in App
Mount the leave routes in the Express application.
- [ ] Subtask 7.1: Import `leaveRoutes` in `server/src/app.ts`
- [ ] Subtask 7.2: Mount at `/api/leaves` with `app.use('/api/leaves', leaveRoutes)`
- [ ] Subtask 7.3: Verify route appears in application route stack

**Tests (AC-1, AC-5):**
- [ ] Integration test: POST `/api/leaves` endpoint responds (not 404)
- [ ] Integration test: GET `/api/leaves` endpoint responds (not 404)

## Dependencies
- **Story 1.1** (completed) -- project scaffolding, npm workspaces, shared workspace, base Express app
- **Story 1.2** (completed) -- auth middleware, RBAC middleware, CSRF middleware, User model, AuditEvent model
- Requires MongoDB running locally (or via `MONGODB_URI`)
- No frontend page in this story -- the leave request form is in Story 2.2

## File List

### Modified Files
- `shared/index.ts` -- Added exports for LeaveStatus, LeaveType, createLeaveSchema, CreateLeaveInput
- `server/src/app.ts` -- Imported and mounted leaveRoutes at `/api/leaves`

### New Files
- `shared/constants/leave-status.ts` -- LeaveStatus const object with 10 states and derived type
- `shared/constants/leave-types.ts` -- LeaveType const object (DAY_OUTING, OVERNIGHT) and derived type
- `shared/schemas/leave.schema.ts` -- createLeaveSchema Zod validator with CreateLeaveInput type
- `server/src/models/leave.model.ts` -- Leave Mongoose model with ILeave interface, compound index, toJSON transform
- `server/src/services/leave.service.ts` -- createLeave (with overlap detection + audit), getStudentLeaves, getAllLeaves
- `server/src/controllers/leave.controller.ts` -- createLeave and getLeaves request handlers
- `server/src/routes/leave.routes.ts` -- Leave routes with authMiddleware and requireRole RBAC

### Unchanged Files
- `server/src/middleware/auth.middleware.ts` -- JWT verification already correct
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory already correct
- `server/src/middleware/csrf.middleware.ts` -- CSRF validation already correct
- `server/src/utils/app-error.ts` -- AppError class already supports code, message, statusCode
- `server/src/models/user.model.ts` -- User model already has role, block, floor, roomNumber
- `server/src/models/audit-event.model.ts` -- AuditEvent model already functional

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Leave Constants):** Created `LeaveStatus` with all 10 states as a const object with derived type, and `LeaveType` with DAY_OUTING and OVERNIGHT. Both exported from `shared/index.ts`.

**Task 2 (Validation Schema):** Created `createLeaveSchema` with Zod. Uses `z.string().datetime({ offset: true })` for date fields. startDate refined to be >= today. Cross-field refinement ensures endDate >= startDate with path `['endDate']`. Reason is trimmed with min 5, max 500.

**Task 3 (Leave Model):** Created Mongoose schema with collection `leaves`, timestamps, strict mode. Compound index `{ studentId: 1, status: 1 }` for efficient overlap queries. toJSON strips `__v`.

**Task 4 (Leave Service):** `createLeave` parses ISO strings to Dates, checks overlap using `$lte/$gte` date range query, creates leave with PENDING status, logs PASS_REQUESTED audit event. `getStudentLeaves` returns sorted by createdAt desc. `getAllLeaves` supports optional status filter with student population.

**Task 5 (Leave Controller):** `createLeave` validates body with `safeParse`, extracts first issue for error message with field path. `getLeaves` branches on role: STUDENT sees own leaves, WARDEN_ADMIN sees all with populated student info.

**Task 6-7 (Routes):** Routes registered with `authMiddleware` globally, POST restricted to STUDENT, GET restricted to STUDENT and WARDEN_ADMIN. Mounted at `/api/leaves` in app.ts.

### Test Results
- **Server:** Leave service and controller tests pass
- **Shared:** Schema validation tests pass
- **Total:** 0 failures

### New Dependencies
- None (all dependencies already in place from Story 1.1/1.2)
