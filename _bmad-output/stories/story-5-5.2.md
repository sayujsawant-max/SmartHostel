# Story 5.2: Complaint Assignment & Priority (Warden)

## Story

As a **warden**,
I want to assign complaints to maintenance staff with priority,
So that issues are routed to the right person with clear urgency.

## Status: Complete

## Acceptance Criteria

**AC1:** PATCH /api/complaints/:id/assign transitions OPEN→ASSIGNED atomically, sets assigneeId, creates notification for maintenance staff.

**AC2:** ComplaintEvent (COMPLAINT_ASSIGNED) added to timeline with actorId, actorRole.

**AC3:** PATCH /api/complaints/:id/priority updates priority and recalculates dueAt from SLA thresholds.

**AC4:** Assignment on non-OPEN complaint returns CONFLICT.

## Tasks

### Task 1: Add assignComplaint service function
- Atomic findOneAndUpdate (status: OPEN → ASSIGNED)
- Create ComplaintEvent, AuditEvent, Notification

### Task 2: Add updatePriority service function
- Recalculate dueAt from priority SLA hours
- Create ComplaintEvent + AuditEvent

### Task 3: Add controller endpoints + routes
- PATCH /:id/assign, PATCH /:id/priority (WARDEN only)
- GET /maintenance-staff for assignment dropdown

### Task 4: Build warden ComplaintsPage UI
- Complaint list with status/priority badges
- Status filter dropdown
- Inline assignment flow (staff selector + confirm)
- Priority override dropdown on OPEN complaints
