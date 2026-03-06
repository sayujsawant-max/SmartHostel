# Story 5.3: Maintenance Task Queue & Status Updates

## Story

As a **maintenance staff member**,
I want to see my assigned tasks sorted by SLA urgency and update their status,
So that I can work through issues efficiently with documented progress.

## Status: Complete

## Acceptance Criteria

**AC1:** GET /api/complaints/my-tasks returns assigned complaints sorted by dueAt (most urgent first).

**AC2:** PATCH /api/complaints/:id/status transitions ASSIGNED→IN_PROGRESS (Start Work) and IN_PROGRESS→RESOLVED (with resolution notes).

**AC3:** Invalid transitions return CONFLICT with valid transitions listed.

**AC4:** COMPLAINT_RESOLVED notification sent to student on resolution.

**AC5:** TasksPage shows task cards with SLA countdown badge, priority badge, Start Work / Mark Resolved actions.

## Tasks

### Task 1: Add status transition logic
- VALID_TRANSITIONS map, updateStatus service function
- ComplaintEvent + AuditEvent on each transition
- Notification to student on RESOLVED

### Task 2: Add getAssignedComplaints service function
- Filter by assigneeId + active statuses, sort by dueAt

### Task 3: Add controller endpoints + routes
- GET /my-tasks (MAINTENANCE), PATCH /:id/status (MAINTENANCE/WARDEN)

### Task 4: Build maintenance TasksPage UI
- Task cards with SLABadge, priority badge, student info
- Start Work button (ASSIGNED), Mark Resolved with notes (IN_PROGRESS)
