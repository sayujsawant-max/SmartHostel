# Story 5.4: Complaint Status Timeline (Student)

## Story

As a **student**,
I want to view my complaint status timeline with SLA countdown and ownership,
So that I feel reassured the system is tracking my issue.

## Status: Complete

## Acceptance Criteria

**AC1:** Student StatusPage shows complaints with category, status, priority, SLA badge, and last update.

**AC2:** Tapping a complaint navigates to /student/status/complaint/:id with full timeline.

**AC3:** Timeline shows all events (Created, Assigned, In Progress, Resolved) with actor + timestamp.

**AC4:** SLABadge shows "Due in Xh" / "Overdue Xh" / "Resolved".

**AC5:** Empty state shows "No complaints filed" with link to Report an Issue.

## Tasks

### Task 1: Extend StatusPage with complaints section
- Parallel fetch of leaves + complaints
- Complaint cards with SLABadge, status/priority badges

### Task 2: Create ComplaintDetailPage
- Fetch complaint + timeline in parallel
- SLABadge prominent at top
- Timeline with vertical line connector, event labels, actor names, timestamps
- Resolution notes display

### Task 3: Add route in App.tsx
- /student/status/complaint/:complaintId
