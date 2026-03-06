# Requirements Inventory

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
