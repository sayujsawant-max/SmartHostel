# Epic 5: Complaint Lifecycle & SLA Automation

Students can submit complaints, wardens assign them to maintenance staff, maintenance staff work through a priority queue, and the system automates SLA deadlines, reminders, and escalation.

### Story 5.1: Complaint Submission (Student)

As a **student**,
I want to submit a complaint with category, description, and optional photo,
So that hostel issues are formally tracked and resolved.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/actions/report-issue
**Then** I see a form with: category dropdown (auto-sets priority + SLA), description field, optional photo upload, and a hint for first-timers: "Select the category that best matches your issue"

**Given** I submit a valid complaint
**When** POST `/api/complaints` processes it
**Then** a Complaint document is created with status OPEN, priority computed from category defaults, dueAt computed from category SLA thresholds, and a ComplaintEvent (COMPLAINT_CREATED) is added to the timeline

**Given** I attach a photo
**When** the upload processes
**Then** the photo is uploaded to Cloudinary via multer middleware, the photoUrl is stored on the complaint, with size/type limits enforced and access restricted to complaint stakeholders

**Given** the photo upload fails
**When** the error is returned
**Then** the UI shows "Photo couldn't be uploaded. Submit without it and add details later."

**Given** I submit a complaint
**When** zod validation fails (missing category or description)
**Then** VALIDATION_ERROR is returned with field-level errors

### Story 5.2: Complaint Assignment & Priority (Warden)

As a **warden**,
I want to assign complaints to maintenance staff with priority,
So that issues are routed to the right person with clear urgency.

**Acceptance Criteria:**

**Given** I am a WARDEN viewing OPEN complaints
**When** I assign a complaint to a maintenance staff member
**Then** PATCH `/api/complaints/:id/assign` transitions status OPEN→ASSIGNED via atomic findOneAndUpdate, sets assigneeId, and creates a notification (COMPLAINT_ASSIGNED) for the maintenance staff

**Given** I assign a complaint
**When** the assignment is saved
**Then** a ComplaintEvent (COMPLAINT_ASSIGNED) is added to the timeline with actorId, actorRole, and timestamp

**Given** I assign a complaint
**When** I optionally override the auto-computed priority
**Then** PATCH `/api/complaints/:id/priority` updates the priority and recalculates dueAt based on the new priority's SLA thresholds

**Given** the complaint is not OPEN (already assigned or resolved)
**When** I attempt to assign
**Then** the atomic update fails and returns CONFLICT

### Story 5.3: Maintenance Task Queue & Status Updates

As a **maintenance staff member**,
I want to see my assigned tasks sorted by priority and SLA urgency and update their status,
So that I can work through issues efficiently with documented progress.

**Acceptance Criteria:**

**Given** I am a MAINTENANCE user
**When** I navigate to /maintenance/tasks
**Then** I see TaskCard components for my assigned complaints, sorted by priority (CRITICAL > HIGH > MEDIUM > LOW) then by SLA urgency (closest dueAt first)

**Given** I view a task detail at /maintenance/tasks/:complaintId
**When** the page loads
**Then** I see: category, description, photo (if any), priority badge, SLABadge with countdown, ownership line, and full timeline

**Given** I have an ASSIGNED task
**When** I tap "Start Work"
**Then** PATCH `/api/complaints/:id/status` transitions ASSIGNED→IN_PROGRESS and a ComplaintEvent is added

**Given** I have an IN_PROGRESS task
**When** I tap "Mark Resolved" and enter resolution notes
**Then** PATCH `/api/complaints/:id/status` transitions IN_PROGRESS→RESOLVED, resolution notes are stored, a ComplaintEvent (COMPLAINT_RESOLVED) is added, and a notification (COMPLAINT_RESOLVED) is sent to the student

**Given** I attempt an invalid transition (e.g., OPEN→RESOLVED skipping ASSIGNED)
**When** the service validates the transition
**Then** the server returns CONFLICT with the valid transitions for the current state

### Story 5.4: Complaint Status Timeline (Student)

As a **student**,
I want to view my complaint status timeline with SLA countdown and ownership,
So that I feel reassured the system is tracking my issue.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/status
**Then** I see my active complaints as StatusCardV2 with: category icon, title, SLABadge ("Due in 18h" / "Overdue 3h"), current status, last update timestamp, and ownership line

**Given** I tap a complaint card
**When** ComplaintDetailPage loads at /student/status/:complaintId
**Then** I see the full timeline: Created → Assigned → In Progress → [current], each entry with actor + timestamp, SLABadge prominent, and ownership line always visible

**Given** the complaint is escalated
**When** I view the timeline
**Then** I see system-generated entries: "Reminder sent to {staff name}", "Escalated — priority raised to CRITICAL. Warden notified.", "SLA breached {hours}h ago — awaiting action"

**Given** I have no complaints
**When** I view the status page
**Then** EmptyState shows "No complaints filed. [Report an Issue] if something needs fixing."

### Story 5.5: SLA Computation & Category Defaults

As a **system**,
I want to compute SLA deadlines from configurable category-based thresholds,
So that every complaint has a clear, enforceable resolution deadline.

**Acceptance Criteria:**

**Given** category defaults are seeded (e.g., Plumbing: 24h HIGH, Electrical: 12h CRITICAL, General: 48h MEDIUM)
**When** a complaint is created with a specific category
**Then** dueAt is computed as createdAt + category SLA threshold, and priority is set from category defaults

**Given** the warden overrides priority on an existing complaint
**When** the priority changes
**Then** dueAt is recalculated based on the new priority's SLA thresholds

**Given** escalation occurs (SLA breached)
**When** priority is elevated to CRITICAL
**Then** the escalation is recorded but dueAt is NOT reset (the breach persists for accountability)

### Story 5.6: SLA Cron Worker — Reminders & Escalation

As a **warden**,
I want the system to automatically send SLA reminders and escalate breached complaints,
So that nothing falls through the cracks without manual monitoring.

**Acceptance Criteria:**

**Given** the SLA cron worker runs every 10 minutes (separate process: `server/src/worker/index.ts`)
**When** a complaint's dueAt is within 2 hours
**Then** a notification (SLA_REMINDER) is sent to the assigned maintenance staff

**Given** a complaint's dueAt has passed
**When** the cron cycle detects the breach
**Then** the complaint priority is elevated to CRITICAL, escalatedAt is set, escalationLevel is incremented, a notification (SLA_BREACH) is sent to the warden, and a ComplaintEvent (SLA_BREACHED) is added to the timeline

**Given** every cron cycle
**When** the worker runs (success or failure)
**Then** a CronLog entry is created with: jobName, status (SUCCESS/FAIL), complaintsReminded count, complaintsEscalated count, errors (if any), timestamp

**Given** the cron worker fails
**When** the error occurs
**Then** the error is logged via pino, the CronLog records status FAIL, and the health endpoint reflects cronOverdue after 20 minutes

**Given** SLA reminders
**When** multiple complaints are near-breach simultaneously
**Then** notifications are batched where possible ("3 items due in 2h") to prevent alert fatigue

---
