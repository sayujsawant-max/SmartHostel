---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# SmartHostel - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SmartHostel, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

#### Identity & Access (FR1-5)

- FR1: Users can authenticate with credentials and receive role-appropriate session access
- FR2: System enforces role-based access control across four roles (Student, Warden/Admin, Guard, Maintenance Staff)
- FR3: Users are routed to their role-specific dashboard on login; first-time users see a dismissible welcome orientation
- FR4: Users can view a privacy notice; system records consent acknowledgment with timestamp
- FR5: Warden/Admin can create and disable user accounts and reset credentials (manual for MVP)

#### Leave & Gate Pass Management (FR6-11)

- FR6: Students can create leave requests with type, date range, and reason
- FR7: Wardens can view pending leave requests and approve or reject them
- FR8: Approved leaves generate a verifiable gate pass with QR code and passCode; pass verification checks not-before and expiry relative to server time
- FR9: Students can view their leave history, current pass status, and active QR pass
- FR10: Students can cancel an approved leave before gate exit
- FR11: Wardens can correct post-exit pass records with documented reason

#### Gate Verification (FR12-17)

- FR12: Guards can scan a QR code to verify gate pass validity
- FR13: System displays full-screen pass verdict with student identity, pass context, and specific denial reasons
- FR14: Guards can verify passes via manual passCode entry as fallback
- FR15: System logs every verification attempt and enforces one-time-use exit scanning with OUT/IN event recording
- FR16: System supports offline scan logging with deferred reconciliation when network is unavailable; when reconciliation fails (invalid/expired), entry remains flagged for warden review — no silent acceptance
- FR17: System rate-limits manual passCode entry attempts

#### Override Governance (FR18-20)

- FR18: Guards can override gate denials with a required reason category and free-text note
- FR19: System immediately notifies wardens when a guard override occurs
- FR20: Wardens can review and annotate override records; system tracks override rates and surfaces spikes

#### Complaint & SLA (FR21-27)

- FR21: Students can submit complaints with category, description, and optional photo; system stores photos with size/type limits and access restricted to complaint stakeholders
- FR22: Students can view their complaint status timeline and history
- FR23: Wardens can assign complaints to maintenance staff with priority
- FR24: Maintenance staff can view their assigned queue sorted by priority and SLA urgency
- FR25: Maintenance staff can update complaint status and add resolution notes
- FR26: System computes SLA deadlines from configurable category-based thresholds and escalation targets
- FR27: System automates SLA reminders, post-breach escalation with priority elevation, and persistent breach flagging until acknowledged

#### Self-Service Assistant (FR28-30)

- FR28: Students can check complaint, leave, and fee status via quick-action shortcuts; fee status is read-only from a configured data source (seeded for MVP)
- FR29: Users can search hostel FAQs with fuzzy text matching
- FR30: System provides contextual next-action suggestions after status queries

#### Dashboards & Notifications (FR31-36)

- FR31: Students see a dashboard with room info, active notices, fee status (read-only, seeded), and quick actions
- FR32: Wardens see a dashboard with operational KPIs, pending action items, and system health indicators
- FR33: Guards see a dedicated scanning interface as their primary view
- FR34: Maintenance staff see their assigned complaint queue as their primary view
- FR35: Wardens can broadcast notices to all students or filtered by block/floor
- FR36: System delivers in-app notifications for key events (approvals, overrides, escalations, assignments); users can view a notification list (last N) with at-least-once in-app delivery guarantee

#### Audit & Monitoring (FR37-40)

- FR37: System maintains append-only audit logs for all sensitive actions with user attribution and timestamps
- FR38: System enforces role-based data visibility boundaries per the defined visibility matrix
- FR39: System records operational health metrics (cron execution, scan failures, offline backlog) and surfaces status indicators
- FR40: System supports configurable data retention windows and maintains consent records

#### State Machines (FR41-43)

- FR41: Gate passes follow the canonical lifecycle (PENDING → APPROVED → SCANNED_OUT → SCANNED_IN → COMPLETED) with exceptional states (CANCELLED, EXPIRED, REVOKED, CORRECTED)
- FR42: Complaints follow a defined lifecycle (Open → Assigned → In Progress → Resolved) with escalation states
- FR43: System enforces state transition rules, role-locked permissions on transitions, and standardized reason codes

### Non-Functional Requirements

#### Performance (mobile-first)

- NFR1: Guard scanner page load (cold): p95 ≤ 2s on average Android phone
- NFR2: QR verify: p95 ≤ 500ms server-side, ≤ 2-3s scan-to-decision end-to-end
- NFR3: API latency: p95 ≤ 300-500ms for key endpoints (pass verify, complaint status)
- NFR4: Dashboard load ≤ 3s

#### Reliability

- NFR5: Cron SLA cycle: 0 missed cycles/week (heartbeat + alert)
- NFR6: Data integrity: 0 orphan states (e.g., complaint "resolved" without resolver attribution)
- NFR7: API uptime ≥ 99% during active hours

#### Security / Abuse Resistance

- NFR8: QR replay prevention: 0 successful replays in testing (expiry + jti/UUID + anti-replay)
- NFR9: Token expiry enforcement: 100% expired passes rejected
- NFR10: Rate limiting enforced on manual passCode (5/min/guard + lockout) and login endpoints (5 failures → lockout)
- NFR11: Audit log immutability: append-only at app layer; edits require admin + are logged

#### Scalability (MVP Bounds)

- NFR12: Designed-for scale: ~300 students, ~10-20 staff, ~2-4 guards, peak concurrent ~50-100 users
- NFR13: Scanner throughput: handle bursty scans at ~1 scan every 2-3 seconds per guard without queuing or degradation

#### Data Protection

- NFR14: HTTPS/TLS for all traffic (required by camera API)
- NFR15: Encryption at rest for database and file storage
- NFR16: No secrets in repository; environment variables for keys; JWT signing key rotatable
- NFR17: Separate roles for application vs. database access; audit-level access restricted to admin

#### Account & Session Security

- NFR18: JWT access tokens expire after configurable window (1-4 hours); refresh tokens 7-30 days
- NFR19: Password policy: minimum 8 characters enforced
- NFR20: Account lockout after 5 consecutive failed login attempts
- NFR21: Credential reset invalidates all active sessions; admin can force-logout any user

#### Backup & Recovery

- NFR22: Daily automated database backups with verified restore
- NFR23: RPO ≤ 24 hours, RTO ≤ 4-8 hours

#### Maintainability

- NFR24: Basic API smoke tests for critical flows; CI runs tests on PR/push
- NFR25: Linting + formatting enforced; structured logs for verify, cron, and override events

#### Observability

- NFR26: Dashboards/alerts for: cron heartbeat missing, override/denial spikes, SLA breach threshold crossings, auth failure spikes
- NFR27: Error budget: <1% failed verifies/day (excluding genuine invalid passes)

### Additional Requirements

#### From Architecture

- **Starter Template**: Vite `react-ts` + manual Express setup with npm workspaces (client/server/shared). Project initialization is Epic 1, Story 1
- JWT dual-token strategy: access + refresh in httpOnly cookies, SameSite=Lax + CSRF Origin/Referer allowlist defense
- Separate QR_SECRET from JWT_SECRET — auth key rotation must not invalidate active gate passes
- Mongoose strict schemas + targeted indexes + TTL indexes (cronLogs 90d, notifications 180d, gatePasses expiresAt+30d; gateScans/overrides 1yr no TTL — architecture extends PRD's 90-180d default for dispute evidence; auditEvents indefinite)
- TanStack Query for server state + React Context for auth only
- Standardized API response format: `{ success, data, correlationId }` / `{ success, error: { code, message, retryable }, correlationId }` with AppError class
- Cron worker as separate process (same codebase, separate entry point `server/src/worker/index.ts`)
- Refresh token revocation via DB-stored hashed jti; rotation on every refresh
- Controller → Service → Model layering enforced (controllers never import models)
- Cloudinary for photo storage (no ephemeral local uploads; PaaS-safe)
- Fees are read-only in MVP (seeded; no PATCH endpoint, no management page)
- Rooms denormalized on User in MVP (block/floor/roomNumber on User doc; no Room model)
- camelCase everywhere (Mongo fields, API payloads, client state — no snake_case)
- Test framework: Vitest (both client + server), mongodb-memory-server, Supertest for E2E
- Co-located tests: `{filename}.test.ts(x)` next to source files
- Version pinning: exact versions in package.json (--save-exact)
- Node.js 20 LTS, MongoDB 7.x/8.x
- AuditEvent as single source of truth with canonical schema; pino for operational logging only — both share correlationId
- X-Correlation-Id header propagation via middleware
- Idempotency keys for dangerous gate writes (override, validate, reconcile)
- Same-site deployment (SPA + API under one domain via reverse proxy)
- GateScan model with direction audit fields (directionDetected, directionUsed, directionSource, lastGateStateBeforeScan) and offlineStatus enum
- Offline reconciliation via `POST /api/gate/reconcile` with scanAttemptId idempotency; `reconcileStatus` enum: `PENDING` (initial) | `SUCCESS` | `FAIL`; PRD's `OFFLINE_REVIEW_REQUIRED` invariant is query-derived: `offlineStatus != null AND reconcileStatus == 'PENDING'`
- Consent flow: ConsentModal blocks navigation on first login until accepted; POST /api/consents records consent
- Delegation config: PATCH /api/admin/delegation for secondary approver toggle on warden dashboard
- Missing deps resolved: cookie-parser, cloudinary, html5-qrcode, @tanstack/react-query, react-hook-form, @hookform/resolvers in corrected install commands

#### From UX Design

- shadcn/ui as component foundation (Radix UI primitives + Tailwind) with custom domain components
- 4 role-specific shells (StudentShell, WardenShell, GuardShell, MaintenanceShell) — not one generic AppShell
- Guard scanner page: full-screen VerdictScreen with auto-return (~1-1.5s), haptic feedback, 3s timeout → OFFLINE
- Scanner direction handling: auto-detect (server-decides) with long-press (600ms) + confirm for manual one-shot override
- Scanner timeout thresholds: >1.5s "Still verifying...", >3.0s → NETWORK_UNVERIFIED amber screen
- Student BottomTabBar (Status/Actions/FAQ), Warden sidebar at lg+ / hamburger below lg
- Maintenance BottomTabBar (Tasks/History/FAQ)
- Guard: no nav chrome, full-screen scanner only
- StatusCardV2 for read-only status display with timeline
- SLABadge with auto-coloring countdown (gray→amber→red→green)
- NeedsAttentionWidget: warden exception dashboard (pending approvals, near-breach, breached, overrides, health)
- AssistantShortcuts: quick-reply shortcut pills as structured card responses (not chat)
- QR display: minimum 250×250px (or 60% screen width), Wake Lock API, brightness hint
- PassCode fallback: large input, numeric keyboard, rate-limited (5/min/guard, lockout after failures)
- Accessibility: 48px min touch targets (56px on scanner), WCAG color + text redundancy, outdoor/sunlight readability
- Scanner page performance guardrail: route JS bundle < 100KB gzipped (excluding QR lib), code-split with React.lazy
- Certainty Contract: every screen must answer Status/Owner/Next within 2 seconds of loading
- Notification bundling: grouped notifications per role to prevent alert fatigue
- Progressive disclosure: scaffolding for first-year students, fast path always available
- Copy rules: "What happened → What you can do now" pattern for all errors; role-specific tone
- Internal enum → UI copy mapping (VALID→"ALLOW", EXPIRED→"DENY", etc.)
- Seed data requirements: users, rooms, FAQs, categories, sample complaints/leaves, fee records

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Authentication with credentials |
| FR2 | Epic 1 | RBAC across 4 roles |
| FR3 | Epic 1 | Role-specific dashboard routing |
| FR4 | Epic 1 | Privacy notice + consent |
| FR5 | Epic 1 | Account management (warden) |
| FR6 | Epic 2 | Create leave requests |
| FR7 | Epic 2 | Approve/reject leaves |
| FR8 | Epic 2 | Gate pass + QR generation |
| FR9 | Epic 2 | Leave history + active QR |
| FR10 | Epic 2 | Cancel leave pre-exit |
| FR11 | Epic 2 | Post-exit corrections |
| FR12 | Epic 3 | QR scan verification |
| FR13 | Epic 3 | Full-screen verdict display |
| FR14 | Epic 3 | PassCode fallback |
| FR15 | Epic 3 | Scan logging + OUT/IN |
| FR16 | Epic 3 | Offline scan + reconciliation |
| FR17 | Epic 3 | PassCode rate limiting |
| FR18 | Epic 4 | Override with reason |
| FR19 | Epic 4 | Warden override notification |
| FR20 | Epic 4 | Override review + spike tracking |
| FR21 | Epic 5 | Submit complaints + photo |
| FR22 | Epic 5 | Complaint status timeline |
| FR23 | Epic 5 | Assign complaints |
| FR24 | Epic 5 | Maintenance priority queue |
| FR25 | Epic 5 | Update complaint status + notes |
| FR26 | Epic 5 | SLA deadline computation |
| FR27 | Epic 5 | SLA automation (reminders, escalation) |
| FR28 | Epic 7 | Status shortcuts (complaints, leaves, fees) |
| FR29 | Epic 7 | FAQ fuzzy search |
| FR30 | Epic 7 | Contextual next-action suggestions |
| FR31 | Epic 6 | Student dashboard |
| FR32 | Epic 6 | Warden dashboard + KPIs + health |
| FR33 | Epic 6 | Guard scanner interface (primary view) |
| FR34 | Epic 6 | Maintenance task queue (primary view) |
| FR35 | Epic 6 | Notice broadcasting |
| FR36 | Epic 6 | In-app notifications |
| FR37 | Epic 4 | Append-only audit logs |
| FR38 | Epic 1 | Role-based data visibility |
| FR39 | Epic 4 | Operational health metrics |
| FR40 | Epic 4 | Data retention + consent records |
| FR41 | Epic 2 | Gate pass lifecycle state machine |
| FR42 | Epic 5 | Complaint lifecycle state machine |
| FR43 | Epic 5 | State transition rules + reason codes |

## Epic List

### Epic 1: Project Foundation & Authentication
Users can log in with credentials, receive role-appropriate access, and navigate to their role-specific dashboard. System enforces RBAC and records consent.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR38

### Epic 2: Leave Management & Gate Pass Generation
Students can request leaves, wardens can approve/reject them, approved leaves generate QR-code gate passes, and students can view/cancel their leaves.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR41

### Epic 3: Gate Verification & Scanner
Guards can scan QR codes (or enter passCodes) to verify gate passes with instant full-screen ALLOW/DENY verdicts, with offline fallback and every scan logged.
**FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17

### Epic 4: Override Governance & Audit Trail
Guards can override gate denials with documented reasons, wardens are immediately notified, and wardens can review override records with spike tracking. Full audit trail operational.
**FRs covered:** FR18, FR19, FR20, FR37, FR39, FR40

### Epic 5: Complaint Lifecycle & SLA Automation
Students can submit complaints, wardens assign them to maintenance staff, maintenance staff work through a priority queue, and the system automates SLA deadlines, reminders, and escalation.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR42, FR43

### Epic 6: Dashboards, Notifications & Notices
All 4 roles see their complete dashboards with KPIs, pending items, and health indicators. In-app notifications delivered for key events with bundling. Wardens can broadcast notices.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36

### Epic 7: Self-Service Assistant & FAQ
Students can check complaint/leave/fee status via quick-action shortcuts, search FAQs with fuzzy matching, and receive contextual next-action suggestions.
**FRs covered:** FR28, FR29, FR30

---

## Epic 1: Project Foundation & Authentication

Users can log in with credentials, receive role-appropriate access, and navigate to their role-specific dashboard. System enforces RBAC and records consent.

### Story 1.1: Project Scaffolding & Dev Environment

As a **developer**,
I want the project scaffolded with npm workspaces (client/server/shared), all dependencies installed, and dev scripts working,
So that I have a working development environment to build features on.

**Acceptance Criteria:**

**Given** a fresh checkout of the repository
**When** I run `npm install` at the root
**Then** all three workspaces (client, server, shared) have their dependencies installed with exact versions

**Given** the project is installed
**When** I run `npm run dev`
**Then** the Vite dev server starts on port 5173 and the Express server starts on port 5000, both via concurrently

**Given** the client dev server is running
**When** I make a request to `/api/health`
**Then** the Vite proxy forwards it to Express and returns `{ success: true, data: { status: "healthy" } }`

**Given** the project structure
**When** I inspect the directory layout
**Then** it matches the architecture spec: `client/`, `server/`, `shared/` with correct sub-folders, `.env.example`, `.gitignore`, `.nvmrc`, root `package.json` with workspaces

### Story 1.2: User Model, Auth API & JWT Token Lifecycle

As a **user**,
I want to log in with my credentials and receive a secure session,
So that I can access the system with my assigned role.

**Acceptance Criteria:**

**Given** a valid user exists in the database (seeded)
**When** I POST to `/api/auth/login` with correct email and password
**Then** the server returns `{ success: true, data: { user: { id, name, email, role } } }` with httpOnly `accessToken` and `refreshToken` cookies set (SameSite=Lax, Secure in prod)

**Given** I am logged in with a valid access token
**When** I GET `/api/auth/me`
**Then** the server returns my user profile including role, hasConsented, and room info (block/floor/roomNumber)

**Given** my access token has expired
**When** any API request returns 401
**Then** the client attempts POST `/api/auth/refresh`, receives new access + rotated refresh tokens, and retries the original request

**Given** my refresh token's jti has been revoked (password reset / force-logout)
**When** I attempt to refresh
**Then** the server returns 401 and both cookies are cleared

**Given** a user attempts login
**When** they fail 5 consecutive times
**Then** the account is temporarily locked and returns `RATE_LIMITED` error with retryAfterMs

**Given** any authenticated request
**When** Origin/Referer header does not match the allowlist on POST/PATCH/DELETE
**Then** the CSRF middleware rejects with 403

### Story 1.3: RBAC Middleware & Role-Based Data Visibility

As a **system administrator**,
I want the system to enforce role-based access control on every protected endpoint,
So that users can only access data and actions appropriate to their role.

**Acceptance Criteria:**

**Given** routes are protected with `requireRole()` middleware
**When** a STUDENT attempts to access a warden-only endpoint (e.g., `/api/admin/dashboard`)
**Then** the server returns 403 FORBIDDEN

**Given** a GUARD is authenticated
**When** they attempt to access complaint endpoints
**Then** the server returns 403 (guards never see complaints per RBAC boundary)

**Given** a STUDENT queries their own data
**When** the query executes
**Then** all queries include `{ studentId: req.user._id }` filter — students never see other students' data

**Given** a WARDEN is authenticated
**When** they query any data endpoint
**Then** no visibility restrictions are applied (full access per visibility matrix)

**Given** a MAINTENANCE user queries complaints
**When** the query executes
**Then** only complaints assigned to them are returned

### Story 1.4: Seed Script & Demo Data

As a **developer**,
I want a seed script that populates the database with realistic demo data,
So that all roles can be tested immediately after setup.

**Acceptance Criteria:**

**Given** a connected MongoDB instance
**When** I run `npm run seed`
**Then** the database is populated with: sample users (at least 1 per role: student, warden, guard, maintenance), each with block/floor/roomNumber, hashed passwords

**Given** the seed script has run
**When** I attempt to log in as any seeded user
**Then** authentication succeeds and returns the correct role

**Given** the seed script
**When** I inspect the created data
**Then** FAQ entries (20+), category defaults with SLA thresholds, and fee records (read-only) are seeded

**Given** the seed script runs on an already-seeded database
**When** duplicate data would be created
**Then** the script handles idempotency (skips existing or clears and re-seeds)

### Story 1.5: Frontend Auth Flow & Role-Specific Shells

As a **user**,
I want to log in via a login page and be routed to my role-specific dashboard,
So that I see only the interface relevant to my role.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I visit any page
**Then** I am redirected to the LoginPage

**Given** I am on the LoginPage
**When** I submit valid credentials
**Then** AuthContext stores my user/role, and I am redirected to my role-specific dashboard (/student/status, /warden/dashboard, /guard/scan, /maintenance/tasks)

**Given** I am a STUDENT
**When** I am logged in
**Then** I see StudentShell with BottomTabBar (Status/Actions/FAQ) and a top bar

**Given** I am a WARDEN
**When** I am logged in
**Then** I see WardenShell with sidebar at lg+ and hamburger menu below lg

**Given** I am a GUARD
**When** I am logged in
**Then** I see GuardShell with no nav chrome (full-screen scanner placeholder)

**Given** I am a MAINTENANCE user
**When** I am logged in
**Then** I see MaintenanceShell with BottomTabBar (Tasks/History/FAQ)

**Given** I am authenticated
**When** I click logout
**Then** both cookies are cleared, AuthContext resets, and I am redirected to LoginPage

### Story 1.6: Consent Flow & First-Login Experience

As a **first-time user**,
I want to see a privacy notice and acknowledge consent before using the system,
So that the system has my documented agreement for data collection.

**Acceptance Criteria:**

**Given** I log in for the first time (hasConsented = false)
**When** AuthContext checks consent status
**Then** a blocking ConsentModal is rendered — I cannot navigate to any other page

**Given** the ConsentModal is displayed
**When** I read the privacy notice and click "I Accept"
**Then** POST `/api/consents` records my consent with userId, version, and timestamp, and the modal dismisses

**Given** I have already consented (hasConsented = true)
**When** I log in
**Then** no ConsentModal appears and I proceed directly to my dashboard

**Given** the ConsentModal is displayed
**When** I attempt to dismiss it (Escape key, click outside)
**Then** the modal does not close — acceptance is mandatory

### Story 1.7: Account Management (Warden)

As a **warden/admin**,
I want to create user accounts, disable accounts, and reset credentials,
So that I can manage hostel users for the system.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I POST to `/api/admin/users` with name, email, role, password, block, floor, roomNumber
**Then** a new user account is created with hashed password and the specified role

**Given** I am a WARDEN
**When** I PATCH `/api/admin/users/:id/disable`
**Then** the user account is disabled and all their refresh token jtis are deleted (sessions invalidated)

**Given** I am a WARDEN
**When** I POST `/api/admin/users/:id/reset-password` with a new password
**Then** the password is updated, all refresh token jtis are deleted, and all sessions are invalidated

**Given** I am NOT a WARDEN
**When** I attempt any account management endpoint
**Then** the server returns 403 FORBIDDEN

---

## Epic 2: Leave Management & Gate Pass Generation

Students can request leaves, wardens can approve/reject them, approved leaves generate QR-code gate passes, and students can view/cancel their leaves.

### Story 2.1: Leave Request Creation (Student)

As a **student**,
I want to create a leave request with type, date range, and reason,
So that I can get approval to leave the hostel.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/actions/request-leave
**Then** I see a form with: leave type (Day Outing / Overnight), date picker for start/end, reason template dropdown + optional custom text

**Given** I fill in the leave form
**When** I submit with valid data (type, dates, reason)
**Then** POST `/api/leaves` creates a leave with status PENDING, and I see a success confirmation

**Given** I submit a leave request
**When** the dates are invalid (end before start, past dates)
**Then** zod validation rejects with VALIDATION_ERROR and field-level errors

**Given** I submit a leave request
**When** I already have an active leave (PENDING or APPROVED) overlapping the date range
**Then** the server returns CONFLICT error

**Given** I am on the LeaveRequestPage
**When** I select a reason template (e.g., "Family visit", "Medical appointment")
**Then** the reason field is prefilled and I can optionally customize it

### Story 2.2: Leave Approval & Rejection (Warden)

As a **warden**,
I want to view pending leave requests and approve or reject them,
So that I can control student movement with documented decisions.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I navigate to the pending leaves queue
**Then** I see all PENDING leave requests with student name, type, dates, reason, and submission time

**Given** I view a pending leave request
**When** I click Approve
**Then** PATCH `/api/leaves/:id/approve` transitions the leave to APPROVED via atomic findOneAndUpdate, and a notification is created for the student (LEAVE_APPROVED)

**Given** I view a pending leave request
**When** I click Reject with an optional reason
**Then** PATCH `/api/leaves/:id/reject` transitions to REJECTED, and a notification is created for the student (LEAVE_REJECTED)

**Given** the leave is no longer PENDING (e.g., student cancelled it)
**When** I attempt to approve or reject
**Then** the atomic update fails and returns CONFLICT with the current state

### Story 2.3: Gate Pass & QR Code Generation

As a **student**,
I want an approved leave to automatically generate a verifiable QR-code gate pass,
So that I can present it at the gate for quick verification.

**Acceptance Criteria:**

**Given** a leave transitions to APPROVED
**When** the approval is processed
**Then** a GatePass document is created with: qrToken (JWT signed with QR_SECRET containing leaveRequestId + jti + exp), passCode (short numeric fallback), status, expiresAt matching the leave end time

**Given** the QR token
**When** decoded
**Then** the payload contains only `{ leaveRequestId, jti, exp }` — no studentId (minimal payload per architecture spec)

**Given** QR_SECRET is different from JWT_SECRET
**When** auth JWT signing key is rotated
**Then** existing gate passes remain valid (keys are independent)

**Given** the gate pass expiresAt
**When** the leave end time passes
**Then** the pass is expired and any verification returns EXPIRED

### Story 2.4: Student Leave History & Active QR Display

As a **student**,
I want to view my leave history and display my active QR pass,
So that I can track my leave status and present my pass at the gate.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/status
**Then** I see my active and recent leaves as StatusCardV2 components with status badges (PENDING, APPROVED, REJECTED, etc.)

**Given** I have an APPROVED leave with an active gate pass
**When** I navigate to /student/actions/show-qr
**Then** I see the QR code at minimum 250x250px (or 60% screen width), passCode below as fallback, leave window + return time, and a brightness hint ("Turn brightness to max")

**Given** I am on the ShowQRPage
**When** Wake Lock API is available
**Then** the screen stays awake to prevent sleep at the gate

**Given** I have no active APPROVED pass
**When** I try to navigate to /student/actions/show-qr
**Then** I see a message "No active pass" and a link to request a leave

**Given** my leave history
**When** I view completed/rejected/cancelled leaves
**Then** each shows the appropriate status, timestamps, and reason (if rejected)

### Story 2.5: Leave Cancellation (Student)

As a **student**,
I want to cancel an approved leave before I exit the gate,
So that I can change my plans without leaving an orphan pass.

**Acceptance Criteria:**

**Given** I have an APPROVED leave (not yet SCANNED_OUT)
**When** I tap Cancel on the leave detail
**Then** PATCH `/api/leaves/:id/cancel` transitions to CANCELLED via atomic findOneAndUpdate, and the associated gate pass is invalidated

**Given** my leave is SCANNED_OUT (I've already exited)
**When** I attempt to cancel
**Then** the server returns CONFLICT: "Cannot cancel — you've already exited. Contact your warden for corrections."

**Given** my leave is PENDING
**When** I cancel it
**Then** the leave transitions to CANCELLED (no gate pass exists to invalidate)

### Story 2.6: Post-Exit Pass Correction (Warden)

As a **warden**,
I want to correct post-exit pass records with a documented reason,
So that I can handle edge cases like wrong scans or administrative errors.

**Acceptance Criteria:**

**Given** I am a WARDEN viewing a leave that is SCANNED_OUT or SCANNED_IN
**When** I initiate a correction with a required reason
**Then** PATCH `/api/leaves/:id/correct` transitions the leave to CORRECTED, the reason is stored, and an AuditEvent is created (PASS_CORRECTED with actorId, reason, correlationId)

**Given** a correction is made
**When** the correction is saved
**Then** the original state is preserved in the audit trail (the correction is a new event, never an overwrite)

**Given** I am NOT a WARDEN
**When** I attempt to correct a leave
**Then** the server returns 403 FORBIDDEN

---

## Epic 3: Gate Verification & Scanner

Guards can scan QR codes (or enter passCodes) to verify gate passes with instant full-screen ALLOW/DENY verdicts, with offline fallback and every scan logged.

### Story 3.1: Gate Verification API & Scan Logging

As a **guard**,
I want to verify a gate pass by QR token or passCode and have every attempt logged,
So that the system produces a deterministic ALLOW/DENY result with a complete audit trail.

**Acceptance Criteria:**

**Given** I am a GUARD
**When** I POST `/api/gate/validate` with a valid qrToken
**Then** the server verifies the JWT (QR_SECRET), checks leave status, performs atomic state transition (APPROVED→SCANNED_OUT or SCANNED_OUT→SCANNED_IN), and returns `{ verdict: "ALLOW", student: { name, block }, leaveType, returnBy }`

**Given** a QR token for an expired/cancelled/revoked leave
**When** I verify it
**Then** the server returns the correct denial reason (EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, etc.) with student details where available

**Given** any verification attempt (success or failure)
**When** the verify endpoint processes it
**Then** a GateScan document is created with: verdict, method (QR/PASSCODE), guardId, directionDetected, directionUsed, directionSource (AUTO/MANUAL_ONE_SHOT), lastGateStateBeforeScan, latencyMs, timeoutTriggered, offlineStatus (null for online scans)

**Given** concurrent scans of the same pass
**When** two guards scan simultaneously
**Then** atomic findOneAndUpdate ensures only one transitions the state; the other receives ALREADY_SCANNED_OUT/IN (idempotent)

**Given** the verify endpoint
**When** a duplicate scan within 2s is detected (deterministic key: sha256(token + guardId + directionUsed + 2s-bucket))
**Then** the cached verdict is returned without re-processing

### Story 3.2: Guard Scanner Page & QR Camera

As a **guard**,
I want a full-screen camera scanner that detects QR codes and shows instant ALLOW/DENY results,
So that I can process students at the gate in under 3 seconds.

**Acceptance Criteria:**

**Given** I am a GUARD and logged in
**When** the GuardScannerPage loads
**Then** the camera activates immediately with CameraViewfinder overlay, direction indicator ("Auto: EXIT" / "Auto: ENTRY"), and ShiftPanel (guard name, sync status, shift counters) visible top-right

**Given** a QR code enters the camera frame
**When** html5-qrcode decodes it
**Then** the system calls POST `/api/gate/validate` and displays VerdictScreen within ≤ 3s end-to-end

**Given** the VerdictScreen shows ALLOW
**When** ~1-1.5 seconds pass
**Then** it auto-returns to scanning with no manual tap required
**And** haptic feedback fires (short vibration pulse)

**Given** the VerdictScreen shows DENY
**When** the result displays
**Then** a red full-screen overlay shows "DENY — {Student Name}" with proof line (specific reason + timestamp), [Override] button visible, and double-buzz haptic

**Given** the verify call exceeds 1.5s
**When** the spinner is shown
**Then** "Still verifying..." text appears to keep the guard calm

**Given** the verify call exceeds 3.0s
**When** the timeout triggers
**Then** VerdictScreen shows amber "OFFLINE — Cannot Verify" with timeoutTriggered logged as true

**Given** the GuardScannerPage route
**When** the JS bundle is built
**Then** the route is code-split via React.lazy and the scanner route bundle is < 100KB gzipped (excluding QR library)

### Story 3.3: PassCode Fallback Verification

As a **guard**,
I want to verify a pass by entering a passCode manually when QR scanning fails,
So that I have a reliable fallback for camera issues or glare.

**Acceptance Criteria:**

**Given** camera permission is denied
**When** the scanner page loads
**Then** the camera is hidden and a large passCode input field is shown as primary: "Camera not available — verify by passCode"

**Given** the camera is active but no QR is detected for 5 seconds
**When** the timeout elapses
**Then** a subtle prompt appears: "Having trouble? [Enter PassCode manually]"

**Given** I enter a valid passCode
**When** I submit it
**Then** POST `/api/gate/validate` with `{ passCode }` runs the same verification logic and displays the same VerdictScreen

**Given** I enter passCode attempts
**When** I exceed 5 attempts per minute
**Then** rate limiting kicks in and returns RATE_LIMITED with retryAfterMs
**And** after N consecutive failures: "Too many attempts — wait {minutes} or contact admin"

**Given** the passCode input
**When** I tap it
**Then** it shows a numeric keyboard hint, large input field (56px touch target), suitable for one-handed outdoor use

### Story 3.4: Direction Detection & Manual Override

As a **guard**,
I want the system to auto-detect scan direction (EXIT/ENTRY) based on leave status,
So that I don't have to manually track who is going out vs. coming in.

**Acceptance Criteria:**

**Given** a student's leave is APPROVED (hasn't exited yet)
**When** I scan their pass
**Then** directionDetected = EXIT, the leave transitions APPROVED→SCANNED_OUT, and outLoggedAt is set

**Given** a student's leave is SCANNED_OUT (they've exited)
**When** I scan their pass
**Then** directionDetected = ENTRY, the leave transitions SCANNED_OUT→SCANNED_IN, and inLoggedAt is set

**Given** the direction indicator shows "Auto: EXIT"
**When** I long-press (600ms) on the direction label
**Then** a confirm prompt appears: "Manual ENTRY for next scan only?"
**And** if confirmed, the next scan uses directionUsed = ENTRY with directionSource = MANUAL_ONE_SHOT

**Given** a manual direction override was used for one scan
**When** that scan completes
**Then** the direction automatically resets to Auto mode — manual direction never silently persists

**Given** every scan
**When** the GateScan record is created
**Then** it includes lastGateStateBeforeScan (IN/OUT/UNKNOWN) for full audit reconstruction

### Story 3.5: Offline Scan Handling & Reconciliation

As a **guard**,
I want the system to handle network failures gracefully with offline logging and later reconciliation,
So that gate operations continue even when connectivity is poor.

**Acceptance Criteria:**

**Given** the verify API returns a network error or exceeds 3s timeout
**When** the OFFLINE verdict is shown
**Then** a GateScan is created immediately with offlineStatus = OFFLINE_PRESENTED and reconcileStatus = PENDING (records the attempt even if guard walks away; satisfies PRD OFFLINE_REVIEW_REQUIRED invariant)

**Given** I am on the OFFLINE verdict screen
**When** I tap "Override to Allow"
**Then** the override flow captures reason + note, the scan is stored locally in localStorage (`offlineGateScans` key), and the existing GateScan's offlineStatus is finalized from OFFLINE_PRESENTED to OFFLINE_OVERRIDE (permitted guard-action finalization before sync — see architecture immutability rules)

**Given** I am on the OFFLINE verdict screen
**When** I tap "Deny (Log Attempt)"
**Then** the scan is stored locally with offlineStatus = OFFLINE_DENY_LOGGED

**Given** offline scans are queued in localStorage
**When** navigator.onLine fires (reconnection detected)
**Then** the queue is flushed sequentially to POST `/api/gate/reconcile` with each entry's scanAttemptId for idempotency

**Given** the reconcile endpoint processes an offline scan
**When** the pass was valid at scannedAt time
**Then** reconcileStatus = SUCCESS and the state transition is applied

**Given** the reconcile endpoint processes an offline scan
**When** the pass was expired/cancelled at scannedAt time
**Then** reconcileStatus = FAIL with reconcileErrorCode (e.g., EXPIRED_AT_SCAN_TIME), and the entry is flagged for warden review

**Given** the GuardScannerPage
**When** offline scans are pending
**Then** a "Sync Now" button is visible and the NetworkStatusPill shows "Offline" (amber dot)

---

## Epic 4: Override Governance & Audit Trail

Guards can override gate denials with documented reasons, wardens are immediately notified, and wardens can review override records with spike tracking. Full audit trail operational.

### Story 4.1: Guard Override Flow

As a **guard**,
I want to override a gate denial with a documented reason and note,
So that I can allow a student through in emergencies while maintaining accountability.

**Acceptance Criteria:**

**Given** I see a DENY or OFFLINE verdict on the scanner
**When** I tap [Override]
**Then** a bottom sheet slides up with: reason category selector (Medical Emergency / Family Emergency / Staff Instruction / Other), note field prefilled based on reason, and Confirm button

**Given** I select "Medical Emergency"
**When** the note field appears
**Then** it is prefilled with "Medical emergency — allowed {EXIT/ENTRY} at {time}" and I can edit it (minimum 5 characters required)

**Given** I complete the override form
**When** I tap Confirm
**Then** POST `/api/gate/override` creates an Override document with: reason, note, guardId, method (MANUAL_OVERRIDE or OFFLINE_OVERRIDE), correlationId, and an Idempotency-Key header prevents duplicate submissions

**Given** the override is saved
**When** the response returns
**Then** VerdictScreen shows green ALLOW with proof line "Override — {reason}", auto-returns to scanning, and an AuditEvent (SCAN_OVERRIDE_GRANTED) is written

**Given** I am NOT a GUARD
**When** the Override button would appear
**Then** it is never rendered — override is guard-only

### Story 4.2: Override Notification & Warden Review

As a **warden**,
I want to be immediately notified when a guard override occurs and review it with full context,
So that I can maintain accountability and identify patterns.

**Acceptance Criteria:**

**Given** a guard override is recorded
**When** the override is saved
**Then** a notification (OVERRIDE_ALERT) is created for the warden immediately

**Given** I am a WARDEN on the dashboard
**When** I view the "Overrides Pending Review" section in NeedsAttentionWidget
**Then** I see override cards with: student name, scan time, reason category, guard note, guard name, method (MANUAL_OVERRIDE / OFFLINE_OVERRIDE), correlationId

**Given** I view an override review card
**When** I click [Mark Reviewed]
**Then** PATCH `/api/gate/overrides/:id/review` adds warden attribution (reviewedBy, reviewedAt), removes it from the pending queue, and writes an AuditEvent

**Given** the override review queue
**When** there are no pending overrides
**Then** the widget shows "No overrides pending review"

### Story 4.3: Override Spike Tracking

As a **warden**,
I want the system to track override rates and surface spikes,
So that I can identify guard behavior patterns requiring attention.

**Acceptance Criteria:**

**Given** more than 5 overrides occur in a day OR more than 3 in an hour
**When** the threshold is crossed
**Then** the health widget displays "Override rate above threshold ({N} today / {N} this hour)"

**Given** the warden dashboard
**When** override rates are normal (below thresholds)
**Then** no spike alert is shown

**Given** override records
**When** the warden queries gate logs
**Then** override counts are aggregated per guard, per day, for pattern visibility

### Story 4.4: Audit Event System & Correlation Tracking

As a **warden**,
I want all sensitive actions logged with attribution, timestamps, and correlation IDs,
So that I can trace any action end-to-end for accountability and dispute resolution.

**Acceptance Criteria:**

**Given** any auditable action occurs (from the canonical event list: PASS_REQUESTED, SCAN_VERIFIED, COMPLAINT_CREATED, etc.)
**When** the service processes the action
**Then** an AuditEvent is written first (entityType, entityId, eventType, actorId, actorRole, timestamp, metadata, correlationId), then a pino log with matching correlationId + eventType

**Given** a request enters the system
**When** correlation-id.middleware processes it
**Then** X-Correlation-Id is extracted from the request header (or a UUID is generated), attached to req.correlationId, and echoed in the response header

**Given** audit events
**When** they are stored in the auditEvents collection
**Then** they are append-only (no updates, no deletes), have no TTL (indefinite retention), and corrections are new events (never overwrites)

**Given** pino structured logs
**When** they reference an audit event
**Then** they include the same correlationId and eventType fields for cross-referencing

### Story 4.5: Operational Health & Data Retention

As a **warden**,
I want to see system health indicators and know that data retention is enforced,
So that I can trust the system is operating correctly and within policy.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I GET `/api/admin/health`
**Then** the response includes: db connected + latencyMs, lastCronSuccess timestamp, cronOverdue flag (true if >20min since last success), offlineScansPending count, offlineScansFailed count, uptime

**Given** TTL indexes are configured
**When** documents age past their retention window
**Then** cronLogs are auto-deleted after 90 days, notifications after 180 days, gatePasses after expiresAt + 30 days

**Given** gateScans and overrides
**When** they reach 1 year old
**Then** they are NOT auto-deleted (dispute evidence — architecture extends PRD's 90-180d default to 1 year because gate scans must survive complaint resolution windows; no TTL in MVP; archive to cold storage post-MVP)

**Given** auditEvents
**When** they exist in the collection
**Then** they are never auto-deleted (legal backbone, indefinite retention)

**Given** the consent model
**When** users have consented
**Then** consent records (userId, version, timestamp) are maintained in the consents collection per FR40

---

## Epic 5: Complaint Lifecycle & SLA Automation

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

## Epic 6: Dashboards, Notifications & Notices

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

## Epic 7: Self-Service Assistant & FAQ

Students can check complaint/leave/fee status via quick-action shortcuts, search FAQs with fuzzy matching, and receive contextual next-action suggestions.

### Story 7.1: Status Shortcuts & Structured Card Responses

As a **student**,
I want to check my complaint, leave, and fee status via quick-action shortcuts,
So that I can get instant answers without visiting the warden's office.

**Acceptance Criteria:**

**Given** I am a STUDENT on /student/status
**When** I see the AssistantShortcuts component (pinned at top)
**Then** I see quick-action buttons: "My Complaints" / "My Leaves" / "Fee Status" / "Ask a Question"

**Given** I tap "My Complaints"
**When** the query returns
**Then** I see a card list (top 3 active complaints) with status badge, SLABadge, ownership line, and "View all →" link — NOT a chat-style text response

**Given** I tap "My Leaves"
**When** the query returns
**Then** I see a card list (top 3 recent leaves) with status badge, dates, and "View all →" link

**Given** I tap "Fee Status"
**When** the query returns
**Then** I see read-only fee status cards from seeded fee data

**Given** there are no active items for a shortcut
**When** the query returns empty
**Then** I see: "No active complaints. [Report an Issue]" or "No active leaves. [Request Leave]"

**Given** the API fails
**When** the error is returned
**Then** I see: "Couldn't load status. [Retry] or check the main page."

### Story 7.2: FAQ Search with Fuzzy Matching

As a **user** (any role),
I want to search hostel FAQs with fuzzy text matching,
So that I can find answers to common questions without asking staff.

**Acceptance Criteria:**

**Given** I am on the FAQ page (/student/faq, /maintenance/faq, or accessible from any role)
**When** the page loads
**Then** I see FAQ entries organized by category in an accordion layout

**Given** I type a search query
**When** Fuse.js processes it client-side against the fetched FAQ list
**Then** I see matching FAQ entries ranked by relevance, with title + answer preview + "Read more"

**Given** I search for a typo or partial match (e.g., "plumbin" for "plumbing")
**When** Fuse.js fuzzy matching processes it
**Then** relevant results still appear (fuzzy threshold configured for helpful matching)

**Given** my search returns no matches
**When** the results are empty
**Then** I see: "No matching answer found. Try rephrasing or contact your warden."

**Given** FAQ data
**When** the page loads
**Then** FAQ entries are fetched from GET `/api/assistant/faq` and cached client-side in the Fuse.js index (no server round-trip per keystroke)

### Story 7.3: Contextual Next-Action Suggestions

As a **student**,
I want the system to suggest what I can do next after checking status,
So that I know my options without memorizing the system.

**Acceptance Criteria:**

**Given** I view a complaint with status OPEN
**When** the status card renders
**Then** a next-action hint appears: "Waiting for assignment. You'll be notified when someone is on it."

**Given** I view a leave with status APPROVED
**When** the status card renders
**Then** a next-action hint appears: "Your pass is ready. [Show QR at Gate]"

**Given** I view a leave with status REJECTED
**When** the status card renders
**Then** a next-action hint appears: "Rejected. You can [Request a New Leave] with updated details."

**Given** I have no active leaves or complaints
**When** the assistant shortcuts return empty
**Then** suggestions appear: "Need something? [Request Leave] or [Report an Issue]"

**Given** I use an FAQ shortcut
**When** the FAQ answer is displayed
**Then** if the FAQ references a specific action (e.g., "how to request leave"), a direct link to that action page is included
