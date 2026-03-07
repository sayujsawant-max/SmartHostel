# Story 5.4: Complaint Status Timeline (Student)

## Description
As a **STUDENT**,
I want to view my complaint status timeline with SLA countdown and ownership information,
So that I feel reassured the system is tracking my issue and can see who is responsible.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am logged in as a STUDENT, when I navigate to `/student/status`, then I see a "My Complaints" section showing my complaints with category, status badge, priority badge, SLA badge, and last update timestamp.

**AC-2:** Given I have complaints, when I tap a complaint card on the StatusPage, then I navigate to `/student/status/complaint/:complaintId` with the full complaint detail and timeline.

**AC-3:** Given I view a complaint detail page, when the timeline loads, then I see all events (COMPLAINT_CREATED, COMPLAINT_ASSIGNED, WORK_STARTED, COMPLAINT_RESOLVED, PRIORITY_CHANGED, SLA_REMINDER, SLA_BREACHED) with human-readable labels, actor name (or "System"), and formatted timestamp.

**AC-4:** Given a complaint has a `dueAt` and is not resolved with >2h remaining, when the SLABadge renders, then it shows "Due in Xh" in default (muted) style.

**AC-4b:** Given a complaint has a `dueAt` and is not resolved with <=2h remaining, when the SLABadge renders, then it shows "Due in Xh" in amber style.

**AC-4c:** Given a complaint has a `dueAt` that has passed and is not resolved, when the SLABadge renders, then it shows "Overdue Xh" in red style.

**AC-4a:** Given a complaint is in RESOLVED or CLOSED status, when the SLABadge renders, then it shows "Resolved" in green regardless of the dueAt value

**AC-5:** Given I have no complaints, when I view the StatusPage complaints section, then I see "No complaints filed." with a "Report an Issue" link to `/student/actions/report-issue`.

**AC-6:** Given the complaint has `resolutionNotes`, when I view the complaint detail, then I see the resolution notes in a green-highlighted card.

**AC-7:** Given the complaint has an `assigneeId`, when I view the complaint detail, then I see "Assigned to: [name]" with the populated staff name.

**AC-8:** Given the timeline has events, when they render, then each event shows a vertical connector line between events (except the last), with the most recent event highlighted with the primary color dot.

## Technical Context
- **Tech stack:** React 19, react-router-dom, TypeScript
- **Data fetching:** `apiFetch` calls to `GET /api/complaints` (own complaints) and `GET /api/complaints/:id` + `GET /api/complaints/:id/timeline` (detail + timeline fetched in parallel)
- **SLABadge:** Client-side component computing time difference between `dueAt` and `Date.now()` in hours
- **Event labels:** Mapped via `EVENT_LABELS` record: `COMPLAINT_CREATED -> 'Complaint Created'`, `COMPLAINT_ASSIGNED -> 'Assigned'`, `WORK_STARTED -> 'Work Started'`, `COMPLAINT_RESOLVED -> 'Resolved'`, `PRIORITY_CHANGED -> 'Priority Changed'`, `SLA_REMINDER -> 'Reminder Sent'`, `SLA_BREACHED -> 'SLA Breached'`
- **Routes:** StatusPage at `/student/status`, ComplaintDetailPage at `/student/status/complaint/:complaintId`

### Existing Code
Story 5.4 adds complaint display to the existing StatusPage and creates a new ComplaintDetailPage.

**Server (unchanged -- endpoints already exist from Stories 5.1-5.3):**
- `server/src/routes/complaint.routes.ts` -- `GET /` (STUDENT returns own complaints), `GET /:id`, `GET /:id/timeline` routes already registered. **No changes needed.**
- `server/src/services/complaint.service.ts` -- `getStudentComplaints`, `getComplaintById`, `getComplaintTimeline` already implemented. **No changes needed.**
- `server/src/controllers/complaint.controller.ts` -- `getComplaints`, `getComplaintById`, `getComplaintTimeline` already implemented. **No changes needed.**

**Client:**
- `client/src/pages/student/StatusPage.tsx` -- Extended to include "My Complaints" section. Fetches leaves + complaints in parallel. Complaint cards link to detail page with status/priority/SLA badges. Empty state with "Report an Issue" link. Also includes SLABadge component for overdue/due-soon display. **Complete.**
- `client/src/pages/student/ComplaintDetailPage.tsx` -- New page fetching complaint + timeline in parallel. Shows SLABadge at top, complaint description, status/priority info, assignee name, resolution notes card. Timeline with vertical connector, event labels, actor names, timestamps. **Complete.**

## Tasks

### Task 1: Extend StatusPage with Complaints Section
Add complaint cards with badges to the existing StatusPage.
- [ ] Subtask 1.1: Add `Complaint` interface to StatusPage with fields: `_id`, `category`, `description`, `status`, `priority`, `dueAt`, `createdAt`, `updatedAt`
- [ ] Subtask 1.2: Fetch complaints via `apiFetch('/complaints')` in parallel with leaves on mount
- [ ] Subtask 1.3: Render complaint cards as `Link` to `/student/status/complaint/:id` with category name, status badge (color-coded), priority badge (color-coded), and SLABadge
- [ ] Subtask 1.4: Implement `SLABadge` component: overdue (red, "Overdue Xh"), due-soon <= 2h (amber, "Due in Xh"), normal (muted, "Due in Xh")
- [ ] Subtask 1.5: Add empty state "No complaints filed." with "Report an Issue" link
- [ ] Subtask 1.6: Add contextual hint text per status (OPEN: "Waiting for assignment", ASSIGNED: "Assigned to maintenance staff", IN_PROGRESS: "Work is in progress", RESOLVED: "Issue resolved")

**Tests (AC-1, AC-4b, AC-4c, AC-5):**
- [ ] Unit test: StatusPage renders complaint cards with status and priority badges
- [ ] Unit test: SLABadge shows "Overdue" for past-due complaints
- [ ] Unit test: SLABadge shows amber "Due in Xh" for complaints due within 2 hours
- [ ] Unit test: Empty state renders with link to report-issue page
- [ ] Unit test: Complaint cards link to correct detail page URL

### Task 2: Create ComplaintDetailPage
Build the full complaint detail view with timeline.
- [ ] Subtask 2.1: Create `client/src/pages/student/ComplaintDetailPage.tsx` with `useParams` to extract `complaintId`
- [ ] Subtask 2.2: Fetch complaint and timeline in parallel using `Promise.all` on mount
- [ ] Subtask 2.3: Render complaint detail card with SLABadge (prominent at top, with "Resolved" variant for RESOLVED/CLOSED), category, description, status, priority, and assignee name
- [ ] Subtask 2.4: Render resolution notes in a green-highlighted card when present
- [ ] Subtask 2.5: Render timeline with vertical connector line between events, primary-color dot on latest event, event label (from EVENT_LABELS), optional note, actor name (or "System"), and formatted timestamp
- [ ] Subtask 2.6: Add "Back to Status" link at top

**Tests (AC-2, AC-3, AC-4a, AC-6, AC-7, AC-8):**
- [ ] Unit test: ComplaintDetailPage fetches complaint and timeline on mount
- [ ] Unit test: SLABadge shows "Resolved" for RESOLVED/CLOSED status
- [ ] Unit test: Timeline renders event labels from EVENT_LABELS map
- [ ] Unit test: Resolution notes card renders when resolutionNotes is present
- [ ] Unit test: "Back to Status" link navigates to /student/status

### Task 3: Add Route in App.tsx
Register the ComplaintDetailPage route.
- [ ] Subtask 3.1: Add route `/student/status/complaint/:complaintId` rendering `ComplaintDetailPage`
- [ ] Subtask 3.2: Ensure route is protected by auth (within student route group)

**Tests (AC-2):**
- [ ] Integration test: Navigating to `/student/status/complaint/:id` renders ComplaintDetailPage
- [ ] Integration test: Unauthenticated access to the route redirects to login

## Dependencies
- **Story 5.1** (completed) -- Complaint model, GET /api/complaints endpoint, shared constants
- **Story 5.2** (completed) -- Assignment data (assigneeId populated)
- **Story 5.3** (completed) -- Status transitions create timeline events
- **Story 1.2** (completed) -- Auth context, protected routes

## File List

### Modified Files
- `client/src/pages/student/StatusPage.tsx` -- Added Complaint interface, complaint fetching, complaint cards with SLABadge/status/priority badges, empty state with report-issue link, contextual hints
- `client/src/App.tsx` -- Added route `/student/status/complaint/:complaintId` for ComplaintDetailPage

### New Files
- `client/src/pages/student/ComplaintDetailPage.tsx` -- Complaint detail view with SLABadge, assignee info, resolution notes, and timeline with vertical connector

### Unchanged Files
- `server/src/routes/complaint.routes.ts` -- GET routes already exist from Stories 5.1-5.3
- `server/src/services/complaint.service.ts` -- Query functions already exist
- `server/src/controllers/complaint.controller.ts` -- Controllers already exist

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (StatusPage):** Extended the existing StatusPage to include a "My Complaints" section below leaves. Complaints are fetched in parallel with leaves to avoid sequential loading. SLABadge computes time difference client-side using `dueAt - Date.now()` and rounds to hours. Status hint text provides reassurance to students about what is happening with their complaint.

**Task 2 (ComplaintDetailPage):** Created new page with parallel fetch of complaint detail (with populated assignee) and timeline. Event labels are mapped via a const record for human-readable display. Timeline uses a vertical connector design with the most recent event highlighted. Resolution notes appear in a distinct green card for visibility.

**Task 3 (Route):** Added route within the student route group, protected by auth middleware.

### Test Results
- SLABadge renders correctly for overdue, near-breach, and normal states
- Timeline events render with correct labels and actor names
- Navigation between StatusPage and ComplaintDetailPage works correctly

### New Dependencies
- None
