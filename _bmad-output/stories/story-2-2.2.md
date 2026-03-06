# Story 2.2: Leave Approval & Rejection (Warden)

## Story

As a **warden**,
I want to view pending leave requests and approve or reject them,
So that I can control student movement with documented decisions.

## Status: Draft

## Acceptance Criteria

**AC1:** Given I am a WARDEN, when I GET `/api/leaves?status=PENDING`, then I see all PENDING leave requests with student name, type, dates, reason, submission time.

**AC2:** Given I view a pending leave, when I PATCH `/api/leaves/:id/approve`, then the leave transitions to APPROVED atomically, and a notification is created for the student.

**AC3:** Given I view a pending leave, when I PATCH `/api/leaves/:id/reject` with optional reason, then the leave transitions to REJECTED, and a notification is created for the student.

**AC4:** Given the leave is no longer PENDING, when I attempt to approve/reject, then the atomic update fails with CONFLICT.

## Tasks

### Task 1: Create Notification Model
**File:** `server/src/models/notification.model.ts`
- Collection: `notifications`, TTL 180 days
- Fields: recipientId, type (NotificationType enum), entityType, entityId, title, body, isRead, createdAt

### Task 2: Create Notification Constants (shared)
**File:** `shared/constants/notification-types.ts`
- NotificationType enum with all 8 types

### Task 3: Add approve/reject to Leave Service
**File:** `server/src/services/leave.service.ts`
- `approveLeave(leaveId, wardenId, correlationId)` — atomic findOneAndUpdate PENDING→APPROVED, create notification
- `rejectLeave(leaveId, wardenId, reason, correlationId)` — atomic findOneAndUpdate PENDING→REJECTED, create notification

### Task 4: Add approve/reject to Leave Controller
**File:** `server/src/controllers/leave.controller.ts`

### Task 5: Add routes + RBAC
**File:** `server/src/routes/leave.routes.ts`
- PATCH /:id/approve — WARDEN_ADMIN only
- PATCH /:id/reject — WARDEN_ADMIN only

### Task 6: Update getLeaves to populate student info for wardens

## Dev Notes
- Use `findOneAndUpdate({ _id, status: PENDING }, { status: APPROVED })` for atomicity
- Populate studentId with name on GET for warden view
- Notification created inline (no event bus needed for MVP)
