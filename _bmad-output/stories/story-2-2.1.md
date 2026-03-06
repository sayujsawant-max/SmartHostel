# Story 2.1: Leave Request Creation (Student)

## Story

As a **student**,
I want to create a leave request with type, date range, and reason,
So that I can get approval to leave the hostel.

## Status: Draft

## Acceptance Criteria

**AC1:** Given I am a STUDENT, when I POST `/api/leaves` with valid data (type: DAY_OUTING|OVERNIGHT, startDate, endDate, reason), then a leave with status PENDING is created.

**AC2:** Given I submit a leave request, when the dates are invalid (end before start, past dates), then zod validation rejects with VALIDATION_ERROR and field-level errors.

**AC3:** Given I submit a leave request, when I already have an active leave (PENDING or APPROVED) overlapping the date range, then the server returns CONFLICT error.

**AC4:** Given I am NOT a STUDENT, when I attempt to POST `/api/leaves`, then the server returns 403 FORBIDDEN.

**AC5:** Given I am a STUDENT, when I GET `/api/leaves`, then I see my own leaves only (data visibility filter applied).

## Tasks

### Task 1: Create Leave Constants (shared)

**File:** `shared/constants/leave-status.ts`

- Define `LeaveStatus` enum: PENDING, APPROVED, REJECTED, CANCELLED, SCANNED_OUT, SCANNED_IN, COMPLETED, EXPIRED, REVOKED, CORRECTED

**File:** `shared/constants/leave-types.ts`

- Define `LeaveType` enum: DAY_OUTING, OVERNIGHT

Export both from `shared/index.ts`.

### Task 2: Create Leave Validation Schema (shared)

**File:** `shared/schemas/leave.schema.ts`

- `createLeaveSchema` with Zod:
  - `type`: enum LeaveType (DAY_OUTING | OVERNIGHT)
  - `startDate`: string (ISO date), refined to be today or future
  - `endDate`: string (ISO date), refined to be >= startDate
  - `reason`: string, min 5, max 500, trimmed
- Export from `shared/index.ts`

### Task 3: Create Leave Model

**File:** `server/src/models/leave.model.ts`

- Collection: `leaves`
- Fields per architecture:
  - `studentId`: ObjectId ref User, required, indexed
  - `type`: enum LeaveType, required
  - `startDate`: Date, required
  - `endDate`: Date, required
  - `reason`: string, required
  - `status`: enum LeaveStatus, default PENDING, indexed
  - `approvedBy`: ObjectId ref User (set on approve)
  - `approvedAt`: Date
  - `rejectionReason`: string
  - `outLoggedAt`: Date
  - `inLoggedAt`: Date
- timestamps: true
- Compound index on { studentId: 1, status: 1 } for overlap queries
- toJSON transform: remove __v

### Task 4: Create Leave Service

**File:** `server/src/services/leave.service.ts`

- `createLeave(studentId, data, correlationId)`:
  - Parse dates from ISO strings
  - Check for overlapping active leaves (PENDING or APPROVED with overlapping dates)
  - Create Leave document with status PENDING
  - Log event
  - Return created leave

- `getStudentLeaves(studentId, correlationId)`:
  - Return all leaves for the student, sorted by createdAt desc

### Task 5: Create Leave Controller

**File:** `server/src/controllers/leave.controller.ts`

- `createLeave(req, res)` — validate body, call service, return 201
- `getLeaves(req, res)` — return student's leaves (uses req.user._id for student, or all for warden)

### Task 6: Create Leave Routes

**File:** `server/src/routes/leave.routes.ts`

- All routes use `authMiddleware`
- `POST /` — `requireRole(Role.STUDENT)` → `leaveController.createLeave`
- `GET /` — authenticated (all roles can list, visibility scoped per role)

### Task 7: Register Leave Routes

**File:** `server/src/app.ts`

- Mount at `/api/leaves`

## Dev Notes

- Leave status includes all states for full lifecycle but only PENDING is used in this story
- Overlap detection: find where `studentId` matches AND `status` is in [PENDING, APPROVED] AND dates overlap
- Date overlap formula: existing.startDate <= new.endDate AND existing.endDate >= new.startDate
- Reason templates are frontend-only (dropdown prefills the reason text field) — backend just validates min/max length
- No frontend page in this story — Story 2.4 handles the frontend display
- The LeaveRequestPage frontend form will come in a later story (since AC1 from epic mentions a form page, but the critical backend must exist first)
