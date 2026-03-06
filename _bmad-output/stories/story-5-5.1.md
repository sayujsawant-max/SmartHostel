# Story 5.1: Complaint Submission (Student)

## Story

As a **student**,
I want to submit a complaint with category, description, and optional photo,
So that hostel issues are formally tracked and resolved.

## Status: Complete

## Acceptance Criteria

**AC1:** GET /student/actions/report-issue shows a form with category dropdown, description field, and first-timer hint.

**AC2:** POST /api/complaints creates a Complaint with status OPEN, priority from category defaults, dueAt from SLA thresholds, and a ComplaintEvent (COMPLAINT_CREATED) timeline entry.

**AC3:** Zod validation returns VALIDATION_ERROR with field-level errors on invalid input.

**AC4:** AuditEvent (COMPLAINT_CREATED) is logged with correlationId.

## Tasks

### Task 1: Create shared constants
- ComplaintStatus, ComplaintCategory, ComplaintPriority enums
- SLA_CATEGORY_DEFAULTS mapping (category → priority + slaHours)
- createComplaintSchema (zod)

### Task 2: Create Complaint & ComplaintEvent models
- Complaint model with status, priority, dueAt, assigneeId, escalation fields
- ComplaintEvent model for timeline entries

### Task 3: Create complaint service
- createComplaint: compute priority/dueAt from category defaults, create complaint + event + audit
- getStudentComplaints, getAllComplaints, getComplaintById, getComplaintTimeline

### Task 4: Create controller & routes
- POST / (STUDENT), GET / (STUDENT/WARDEN), GET /:id, GET /:id/timeline
- Mount at /api/complaints in app.ts

### Task 5: Create ReportIssuePage UI
- Category dropdown, description textarea, submit button
- Success state with navigation to status page
- Route at /student/actions/report-issue
