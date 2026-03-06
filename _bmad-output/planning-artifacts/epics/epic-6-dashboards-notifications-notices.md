# Epic 6: Dashboards, Notifications & Notices

All 4 roles see their complete dashboards with KPIs, pending items, and health indicators. In-app notifications delivered for key events with bundling. Wardens can broadcast notices.

### Story 6.1: Student Dashboard

As a **student**,
I want a dashboard showing my room info, active notices, fee status, and quick actions,
So that I have a single place to see everything relevant to me.

**Acceptance Criteria:**

**Given** I am a STUDENT on /student/status
**When** the page loads
**Then** I see: my room info (block/floor/roomNumber from user profile), active leaves as StatusCardV2, active complaints as StatusCardV2, and AssistantShortcuts pinned at top

**Given** I am on /student/actions
**When** the page loads
**Then** I see action cards: "Request Leave", "Report Issue", and "Show QR" (conditional on having an APPROVED pass)

**Given** there are active notices targeted to me (all students, or my block/floor)
**When** the dashboard loads
**Then** I see notice cards with content and timestamp

**Given** I want to check my fee status
**When** I access it via the assistant or dashboard
**Then** I see read-only fee records (seeded data, no editing)

### Story 6.2: Warden Dashboard & KPIs

As a **warden**,
I want an exception-based dashboard with KPIs, pending items, and system health,
So that I see only what needs my attention in a 5-10 minute daily check.

**Acceptance Criteria:**

**Given** I am a WARDEN on /warden/dashboard
**When** the page loads
**Then** the first section is NeedsAttentionWidget showing: pending leave approvals (count + tap to view), near-breach complaints (<6h remaining, amber), breached complaints (overdue, red), overrides pending review (orange), system health indicator

**Given** the NeedsAttentionWidget
**When** TanStack Query polls with refetchInterval: 60000 (1-minute)
**Then** the data refreshes automatically without manual page reload

**Given** the system health section
**When** the health endpoint returns data
**Then** I see: "All systems operational" (green) or "SLA automation unhealthy" (amber/red) with last cron time, scan failure count, offline backlog count

**Given** nothing needs attention
**When** all counts are zero
**Then** the widget shows "All clear — no pending items or alerts right now."

**Given** secondary sections
**When** I navigate via sidebar/tabs
**Then** I can access: all complaints (filtered/sorted), all leaves (filtered/sorted), delegation settings

### Story 6.3: Warden Complaint & Leave Management Views

As a **warden**,
I want to view and manage all complaints and leaves with filtering and sorting,
So that I can handle my approval and oversight responsibilities efficiently.

**Acceptance Criteria:**

**Given** I am a WARDEN on /warden/complaints
**When** the page loads
**Then** I see a dense table with TableToolbar (filter by status, category, priority, assignee; search by student name; sort by dueAt, createdAt)

**Given** I am on /warden/leaves/:id (LeaveDetailPage)
**When** the page loads
**Then** I see the student profile, leave details (type, dates, reason), and Approve/Reject action buttons

**Given** the complaint or leave table
**When** I apply filters
**Then** the table updates via TanStack Query with query parameters

**Given** the tables on mobile (<lg breakpoint)
**When** I view them
**Then** the layout adapts with the hamburger menu and responsive table/card layout

### Story 6.4: Maintenance History View

As a **maintenance staff member**,
I want to view my resolved task history with date filtering,
So that I can review my completed work.

**Acceptance Criteria:**

**Given** I am a MAINTENANCE user on /maintenance/history
**When** the page loads
**Then** I see resolved TaskCards sorted by resolution date (newest first)

**Given** the history page
**When** I filter by date range
**Then** only tasks resolved within that range are shown

**Given** I tap a resolved task
**When** the detail page loads
**Then** I see the full timeline including my resolution notes

### Story 6.5: In-App Notification System

As a **user**,
I want to receive in-app notifications for key events and view my notification list,
So that I stay informed about actions that affect me.

**Acceptance Criteria:**

**Given** any notifiable event occurs (LEAVE_APPROVED, LEAVE_REJECTED, OVERRIDE_ALERT, SLA_REMINDER, SLA_BREACH, COMPLAINT_ASSIGNED, COMPLAINT_RESOLVED, NOTICE_PUBLISHED)
**When** the notification service processes it
**Then** a Notification document is created with: type, recipientId, entityType, entityId, message, isRead (false), timestamp

**Given** I am logged in
**When** TanStack Query polls notifications with refetchInterval
**Then** unread notification count appears on a notification bell/indicator

**Given** I open the notification list
**When** the list loads
**Then** I see recent notifications (last N) with type-appropriate icons, message preview, and timestamp
**And** I can tap a notification to navigate to the relevant detail page

**Given** I view a notification
**When** I tap it or mark it as read
**Then** PATCH `/api/notifications/:id/read` sets isRead = true

**Given** notification bundling rules
**When** multiple events of the same type occur in a short window
**Then** they are grouped (e.g., "5 leaves pending approval" instead of 5 separate notifications) per role-specific bundling rules

**Given** notifications
**When** they are 180 days old
**Then** TTL index auto-deletes them

### Story 6.6: Notice Broadcasting (Warden)

As a **warden**,
I want to broadcast notices to all students or filtered by block/floor,
So that I can communicate important information to the hostel.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I POST `/api/notices` with content and target (all / block / floor)
**Then** a Notice document is created and notifications (NOTICE_PUBLISHED) are generated for all targeted students

**Given** a notice targets "Block A, Floor 2"
**When** the notification service processes it
**Then** only students with block=A and floor=2 receive the notification

**Given** a notice targets "all"
**When** the notification service processes it
**Then** all students receive the notification

**Given** students view their dashboard
**When** active notices exist
**Then** they appear as notice cards with content and timestamp

---
