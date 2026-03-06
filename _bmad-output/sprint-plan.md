# Sprint Plan — SmartHostel
Generated: 2026-03-06

## Sprint 1: Project Foundation & Core Auth
- Story 1.1: Project Scaffolding & Dev Environment (Epic 1)
- Story 1.2: User Model, Auth API & JWT Token Lifecycle (Epic 1)
- Story 1.3: RBAC Middleware & Role-Based Data Visibility (Epic 1)

Deliverables: Working monorepo with npm workspaces (client/server/shared), Express + Vite dev servers, MongoDB connection, JWT auth with refresh token rotation, RBAC middleware enforcing role boundaries
Dependencies: None
Risks: MongoDB connection setup; JWT/CSRF configuration complexity; RBAC edge cases across 4 roles

## Sprint 2: Auth Completion & User Management
- Story 1.4: Seed Script & Demo Data (Epic 1)
- Story 1.5: Frontend Auth Flow & Role-Specific Shells (Epic 1)
- Story 1.6: Consent Flow & First-Login Experience (Epic 1)
- Story 1.7: Account Management (Warden) (Epic 1)

Deliverables: Seeded database with demo users (all 4 roles), FAQ entries, category defaults; login page with role-based routing; 4 role-specific shells (Student/Warden/Guard/Maintenance); consent modal; warden account CRUD
Dependencies: Sprint 1 (auth API, RBAC middleware, project structure)
Risks: Role-specific shell layout complexity; consent flow blocking navigation; seed script idempotency

## Sprint 3: Leave Requests & Gate Pass Generation
- Story 2.1: Leave Request Creation (Student) (Epic 2)
- Story 2.2: Leave Approval & Rejection (Warden) (Epic 2)
- Story 2.3: Gate Pass & QR Code Generation (Epic 2)

Deliverables: Student leave request form with validation; warden approval/rejection queue with atomic state transitions; QR-code gate pass generation on approval with JWT-signed tokens and passCode fallback
Dependencies: Sprint 2 (auth flow, role shells, seed data for testing)
Risks: QR token security (separate QR_SECRET from JWT_SECRET); atomic state transitions for concurrent approvals; zod validation schema complexity

## Sprint 4: Leave Lifecycle Completion
- Story 2.4: Student Leave History & Active QR Display (Epic 2)
- Story 2.5: Leave Cancellation (Student) (Epic 2)
- Story 2.6: Post-Exit Pass Correction (Warden) (Epic 2)

Deliverables: Student leave history with StatusCardV2 components; QR display page (250x250px min, Wake Lock, brightness hint); leave cancellation with gate pass invalidation; warden post-exit correction with audit trail
Dependencies: Sprint 3 (leave model, gate pass generation, approval flow)
Risks: Wake Lock API browser support; cancellation race conditions with gate scans; correction audit trail integrity

## Sprint 5: Gate Verification Core
- Story 3.1: Gate Verification API & Scan Logging (Epic 3)
- Story 3.2: Guard Scanner Page & QR Camera (Epic 3)
- Story 3.3: PassCode Fallback Verification (Epic 3)

Deliverables: Gate verify API with atomic state transitions (APPROVED→SCANNED_OUT→SCANNED_IN); full-screen camera scanner with html5-qrcode; ALLOW/DENY verdict screens with haptic feedback; passCode manual entry fallback; dedup cache (2s window); GateScan logging for every attempt
Dependencies: Sprint 3 (gate pass model, QR tokens); Sprint 4 (leave states for verification)
Risks: Camera permissions across devices; <3s end-to-end latency target; html5-qrcode bundle size (<100KB gzipped); concurrent scan idempotency

## Sprint 6: Gate Advanced Features & Override Start
- Story 3.4: Direction Detection & Manual Override (Epic 3)
- Story 3.5: Offline Scan Handling & Reconciliation (Epic 3)
- Story 4.1: Guard Override Flow (Epic 4)

Deliverables: Auto direction detection (EXIT/ENTRY) based on leave state; manual direction override (one-shot); offline scan queuing in localStorage with reconciliation on reconnect; guard override bottom sheet with reason categories and idempotency
Dependencies: Sprint 5 (gate verification API, scanner page, scan logging)
Risks: Offline reconciliation edge cases (expired at scan time); localStorage reliability; override idempotency-key handling; direction reset after manual override

## Sprint 7: Override Governance & Audit System
- Story 4.2: Override Notification & Warden Review (Epic 4)
- Story 4.3: Override Spike Tracking (Epic 4)
- Story 4.4: Audit Event System & Correlation Tracking (Epic 4)
- Story 4.5: Operational Health & Data Retention (Epic 4)

Deliverables: Override alert notifications to wardens; override review queue in warden dashboard; spike detection (>5/day or >3/hour); full audit event system (append-only, correlationId middleware, pino structured logging); health endpoint with DB latency, cron status, offline scan counts; TTL indexes for data retention
Dependencies: Sprint 6 (override model, gate scan records)
Risks: Audit event write-ahead pattern (audit before action); correlation ID propagation across middleware; TTL index configuration; spike threshold tuning

## Sprint 8: Complaint Submission & Assignment
- Story 5.1: Complaint Submission (Student) (Epic 5)
- Story 5.2: Complaint Assignment & Priority (Warden) (Epic 5)
- Story 5.3: Maintenance Task Queue & Status Updates (Epic 5)

Deliverables: Student complaint form with category-based auto-priority and SLA; Cloudinary photo upload; warden assignment with priority override; maintenance task queue sorted by priority + SLA urgency; status transitions (OPEN→ASSIGNED→IN_PROGRESS→RESOLVED) with timeline events
Dependencies: Sprint 2 (role shells, auth); Sprint 7 (audit events for complaint tracking)
Risks: Cloudinary integration and upload limits; state machine transition validation; SLA computation accuracy

## Sprint 9: Complaint SLA Automation
- Story 5.4: Complaint Status Timeline (Student) (Epic 5)
- Story 5.5: SLA Computation & Category Defaults (Epic 5)
- Story 5.6: SLA Cron Worker — Reminders & Escalation (Epic 5)

Deliverables: Student complaint timeline with SLABadge and ownership line; configurable SLA thresholds per category; cron worker (10-min interval) for reminders (<2h to breach) and auto-escalation (priority→CRITICAL on breach); CronLog entries; notification batching for alert fatigue prevention
Dependencies: Sprint 8 (complaint model, assignment, status transitions)
Risks: Cron worker reliability and failure handling; escalation cascade behavior; notification batching logic; dueAt recalculation on priority override

## Sprint 10: Role Dashboards
- Story 6.1: Student Dashboard (Epic 6)
- Story 6.2: Warden Dashboard & KPIs (Epic 6)
- Story 6.3: Warden Complaint & Leave Management Views (Epic 6)

Deliverables: Student dashboard with room info, active leaves/complaints, notices, fee status, AssistantShortcuts; warden exception-based dashboard with NeedsAttentionWidget (pending approvals, near-breach, overrides, health); auto-refresh (1-min polling via TanStack Query); warden complaint/leave tables with filtering, sorting, and search
Dependencies: Sprint 4 (leave history); Sprint 8 (complaints); Sprint 7 (override review, health endpoint)
Risks: Dashboard aggregation query performance; TanStack Query cache coordination; responsive layout across breakpoints

## Sprint 11: Notifications, History & Notices
- Story 6.4: Maintenance History View (Epic 6)
- Story 6.5: In-App Notification System (Epic 6)
- Story 6.6: Notice Broadcasting (Warden) (Epic 6)

Deliverables: Maintenance resolved task history with date filtering; notification system (create, poll, mark-read) for all event types; notification bundling per role; unread count indicator; 180-day TTL on notifications; warden notice broadcasting with block/floor targeting
Dependencies: Sprint 9 (SLA notifications, complaint resolution); Sprint 10 (dashboard integration points)
Risks: Notification bundling rules complexity; polling frequency vs. server load; notice targeting query performance (block+floor filtering)

## Sprint 12: Self-Service Assistant & FAQ
- Story 7.1: Status Shortcuts & Structured Card Responses (Epic 7)
- Story 7.2: FAQ Search with Fuzzy Matching (Epic 7)
- Story 7.3: Contextual Next-Action Suggestions (Epic 7)

Deliverables: AssistantShortcuts component (My Complaints, My Leaves, Fee Status, Ask a Question) with card-based responses (not chat); FAQ page with Fuse.js client-side fuzzy search, accordion layout, typo tolerance; contextual next-action hints on status cards (e.g., "Your pass is ready. [Show QR at Gate]")
Dependencies: Sprint 10 (student dashboard, AssistantShortcuts placement); Sprint 2 (seeded FAQ data)
Risks: Fuse.js fuzzy threshold tuning; next-action mapping completeness across all status states; FAQ data freshness
