---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Smart Hostel Management System - Full-stack role-based platform solving real hostel pain points with innovative smart features'
session_goals: 'Feature set (must-have vs nice-to-have), 2-3 smart features, Student + Admin/Warden user flows, screens/pages + DB entities shortlist, MVP roadmap'
selected_approach: 'progressive-flow'
techniques_used: ['Role Playing', 'Six Thinking Hats', 'SCAMPER', 'Solution Matrix']
ideas_generated: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28]
context_file: ''
technique_execution_complete: true
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** sayuj
**Date:** 2026-03-01

## Session Overview

**Topic:** Smart Hostel Management System — A modern, full-stack, role-based hostel platform that solves real hostel pain points (room allocation, complaints, leave, fees, notices) with 2-3 standout "smart" features.

**Goals:**
- Defined feature set split into must-have vs nice-to-have
- 2-3 smart/innovative features that are practical to implement
- Clean user flows for Student and Admin/Warden roles
- Shortlist of screens/pages + database entities
- Simple MVP roadmap with build priority

### Session Setup

_Full-stack development project. Target roles: Student, Admin/Warden, Guard, Maintenance Staff. Focus on practical innovation over complexity. Platform should feel modern and solve genuine hostel operational friction._

## Session Constraints (Locked)

- **MVP Timeline:** ~3-4 weeks
- **Mandatory Roles (MVP):** Student, Warden/Admin, Guard, Maintenance Staff
- **Mandatory Smart Trio (MVP):**
  1. QR Gate Pass + Entry/Exit logs
  2. Complaint SLA automation + escalation
  3. AI Chatbot (FAQ + 3 status tool-calls ONLY)
- **Privacy & Safety Boundaries:**
  - No face recognition (privacy + complexity)
  - Chatbot must not guess personal data — only answers via authenticated backend API calls
  - QR codes are signed + time-bound (JWT token), not plain text
- **MVP Out-of-Scope (Phase 2 only):**
  - IoT sensors (water/electricity), RFID/smart locks
  - Parent OTP notifications
  - Mess forecasting / advanced analytics
  - Chatbot guided flows / RAG
  - Email/push notifications (in-app only for MVP)
  - Fee receipt download / payment gateway
  - Detailed reports beyond dashboard counts

## Technical Decisions (Locked)

- **Stack:** MERN (MongoDB, Express, React, Node.js) + Tailwind CSS
- **Auth:** JWT + RBAC middleware
- **QR:** qrcode (generate) + html5-qrcode (scan), signed JWT payload (contains only IDs + expiry; sensitive info stays in DB)
- **SLA:** node-cron every 10 min, category-based thresholds, `dueAt` computed on creation, `CRON_ENABLED` env flag
- **Chatbot:** Quick-reply buttons for status (no LLM); Fuse.js fuzzy FAQ for free-text; LLM optional for rephrasing only
- **Scale:** ~300 students, ~120 rooms, ~1000 scans/day peak
- **DB:** Mongoose with strict schemas, indexes on userId/studentId/roomId/status/createdAt/dueAt

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Systematic development from exploration to action

**Progressive Techniques:**
- **Phase 1 - Exploration:** Role Playing — persona-based ideation across all stakeholders
- **Phase 2 - Pattern Recognition:** Six Thinking Hats — multi-lens analysis
- **Phase 3 - Development:** SCAMPER Method — refine smart features
- **Phase 4 - Action Planning:** Solution Matrix — screens, entities, MVP roadmap

---

## Phase 1: Role Playing — Expansive Exploration (COMPLETE)

**Technique:** Role Playing across 5 personas
**Ideas Generated:** 23 curated ideas

### Persona A: Student
**Pain points:** Unclear processes (leave/complaints/fees), no transparency on status, repeated queries to office/warden

| # | Idea |
|---|------|
| 1 | Student dashboard: room details, notices, fees summary, quick actions |
| 2 | Raise complaint in <30 seconds (category + description + optional photo) |
| 3 | Complaint tracking timeline (Open → Assigned → In Progress → Resolved) |
| 4 | Leave request with calendar + reason templates |
| 5 | After approval → QR leave pass with expiry (shows in app) |
| 6 | Notifications for leave/complaint updates |
| 7 | Chatbot: rules/timings/FAQ + "my complaint status / leave status / fee due" |

### Persona B: Warden/Admin
**Pain points:** Too many repetitive questions, hard to manage leaves + complaints at scale, escalations happen late

| # | Idea |
|---|------|
| 8 | Warden dashboard KPIs: pending complaints, pending leaves, vacancies |
| 9 | One-click leave approve/reject + QR generation |
| 10 | Complaint assignment to staff with priority and due-time |
| 11 | SLA automation: 24h reminder, 48h escalation |
| 12 | Notice broadcast (all / block / floor) |
| 13 | Basic reports: pending by category, SLA breaches, occupancy |

### Persona C: Guard/Security (Gate Scanner)
**Pain points:** Fake approvals (screenshots), manual register is slow and inaccurate

| # | Idea |
|---|------|
| 14 | Simple mobile gate page: "Scan QR" |
| 15 | Scan result shows: Valid/Expired/Cancelled + student name + leave window |
| 16 | Auto log OUT / IN with timestamp |
| 17 | Alert if student tries exit without valid pass (or pass already used) |

### Persona D: Maintenance Staff
**Pain points:** Unclear assignment, no priority, no proof of completion

| # | Idea |
|---|------|
| 18 | Staff view: assigned complaints only |
| 19 | Accept → In progress → Resolved |
| 20 | Photo before/after + notes |
| 21 | Student auto-notified on status change |

### Persona E: AI Chatbot (Helpdesk Agent)
**Pain points:** Repetitive questions waste staff time

| # | Idea |
|---|------|
| 22 | FAQ bot using hostel rules/policies |
| 23 | Tool-calling bot: complaint status, leave status, fee due via authenticated APIs |

### Phase 1 Clustered Idea Buckets

**Bucket 1 — QR & Gate System (MVP)**
- Approved leave → signed QR pass
- Gate scan logs entry/exit
- Valid/expired/cancelled handling
- Anti-fraud: expiry + signed token + single-use logic

**Bucket 2 — Complaints & Maintenance Workflow (MVP)**
- Complaint creation + status tracking
- Assignment workflow
- SLA timer + escalation automation
- Maintenance staff view (assigned complaints, status updates, notes)

**Bucket 3 — AI Chatbot (MVP)**
- FAQs + rules (rule-based fallback)
- Fetch real personal status via 3 authenticated API tool-calls
- No guided flows in MVP

**Bucket 4 — Admin Ops (MVP)**
- Student list + room allocation basics
- Room capacity enforcement
- Notice broadcast
- Dashboard KPI counts (not full reports)

**Bucket 5 — Fees Module (MVP-lite)**
- Fee status (paid/unpaid) — read-only table
- No receipt download, no payment gateway in MVP

---

## Phase 2: Six Thinking Hats — Pattern Recognition (COMPLETE)

**Technique:** Six Thinking Hats applied to all 5 idea buckets

### White Hat (Facts & Data)
- 3-4 week MVP window; MERN stack; ~300 students / ~120 rooms
- QR needs JWT signing; SLA needs node-cron
- Chatbot: quick-reply buttons for status (no LLM); Fuse.js fuzzy FAQ for free-text; LLM optional for rephrasing only
- Mongoose strict schemas with indexes on key fields
- Pagination on all list views (limit 20-50)

### Red Hat (Gut Feelings)
- QR Gate Pass = strongest demo moment (live scan, green/red flash)
- SLA Automation = strongest real-world differentiator
- Chatbot = highest time-risk; build last, demo first
- Maintenance role = high-value, low-cost (~1 day of work)
- Fees = keep dead simple (read-only table)

### Yellow Hat (Benefits)
- 4 architectural layers beyond typical student projects: crypto (QR signing), time-based automation (SLA cron), AI integration (chatbot tool-calls), role-based access (4 roles)
- Each smart feature has both portfolio/demo value AND real-world utility

### Black Hat (Risks)
- **HIGH:** Chatbot scope creep → locked to FAQ + 3 tool-calls only
- **MEDIUM:** QR replay attacks → nonce + single-use flag
- **MEDIUM:** SLA cron silent failures → log every run + admin health indicator
- **MEDIUM:** MongoDB schema drift → strict Mongoose schemas upfront
- **MEDIUM:** 4 roles = 4x auth testing → build RBAC middleware once, seed test users

### Green Hat (Creative Opportunities)
- Smart complaint auto-categorization (LLM one-shot during creation)
- "Hostel Pulse" health widget (one glanceable card)
- QR pass visual card with countdown timer
- Escalation chain visibility to student
- Duplicate complaint detection

### Blue Hat (Process & Organization) — with Final Customizations

**Customizations Applied:**
1. Trimmed MVP must-haves from 17 → 14 (moved reports, fancy notifications, fee extras to nice-to-have)
2. Promoted Maintenance Staff role view to must-have (cheap + completes the loop)
3. Added Audit Trail fields as must-have (approvedBy, assignedBy, statusChangedBy, timestamps)
4. Added System Health indicators as must-have (last cron run, QR scan failures today)
5. Locked AI chatbot scope: FAQ + 3 tool-calls only, no guided flows, no RAG

#### FINAL Must-Have (MVP — 14 features)

| # | Feature | Bucket |
|---|---------|--------|
| 1 | JWT auth + RBAC (Student, Warden/Admin, Guard, Maintenance) | Auth |
| 2 | Student dashboard (room, notices, fee status, quick actions) | Admin Ops |
| 3 | Complaint creation (category + desc + optional photo) | Complaints |
| 4 | Complaint status timeline (Open → Assigned → In Progress → Resolved) | Complaints |
| 5 | Complaint assignment to staff with priority + due-time | Complaints |
| 6 | SLA automation: 24h reminder, 48h escalation (node-cron) | Complaints |
| 7 | Maintenance staff view: assigned complaints, update status + notes | Complaints |
| 8 | Leave request with calendar + reason templates | QR & Gate |
| 9 | Leave approve/reject by warden + signed QR pass generation | QR & Gate |
| 10 | Guard scan page: scan QR → Valid/Expired/Cancelled + student info | QR & Gate |
| 11 | Auto entry/exit logging + anti-fraud (expiry, signed JWT, nonce) | QR & Gate |
| 12 | Warden dashboard KPIs + notice broadcast (all/block/floor) | Admin Ops |
| 13 | AI Chatbot: FAQ fallback + 3 tool-calls (complaint/leave/fee status) | Chatbot |
| 14 | Audit trail fields + system health indicators (cron status, scan failures) | Platform |

#### Nice-to-Have (If Time Permits)

| # | Feature | Source |
|---|---------|--------|
| 15 | Photo before/after on complaint resolution | Phase 1 |
| 16 | Chatbot guided flows (apply leave wizard, register complaint wizard) | Phase 1 |
| 17 | Smart complaint auto-categorization (LLM one-shot) | Green Hat |
| 18 | "Hostel Pulse" health widget | Green Hat |
| 19 | QR pass visual card with countdown timer | Green Hat |
| 20 | Escalation chain visibility to student | Green Hat |
| 21 | Duplicate complaint detection | Green Hat |
| 22 | Fee receipt download | Phase 1 |
| 23 | Detailed reports (SLA breaches, pending by category, occupancy) | Phase 1 |
| 24 | Email/push notifications | Phase 1 |
| 25 | Student + room management (bulk import, capacity enforcement) | Admin Ops |
| 26 | In-app notification center | Phase 1 |

---

## Phase 3: SCAMPER — Smart Trio Refinement (COMPLETE)

**Technique:** SCAMPER applied to each of the 3 smart features

### Smart Feature #1: QR Gate Pass (Final MVP Spec)

| Element | Decision |
|---------|----------|
| **QR payload** | Signed JWT: `{leaveRequestId, qrTokenId (UUID), passType, exp}` — contains only IDs + expiry; sensitive info stays in DB |
| **Manual fallback** | Random 6-8 digit `passCode` stored in DB (not JWT-derived); guard enters code → backend validates same as QR |
| **Pass types** | `DAY_OUTING`: OUT → IN same-day (2 scans); `OVERNIGHT`: OUT → IN across dates (2 scans) |
| **Scan direction logic** | `outLoggedAt` null → OUT allowed; `inLoggedAt` null → IN allowed; both set → DENIED (completed) |
| **Scan result UX** | Full-screen green (VALID) / red (DENIED) with large text + student name + leave window |
| **Student pass view** | QR code + passCode + leave window + countdown + status badge (merged into My Leaves detail) |
| **Attendance proxy** | `GET /admin/hostel/present-count` — derived from latest IN/OUT scan per student |
| **Scan audit log** | Every scan attempt logged: `guardId, method (QR\|MANUAL), result, timestamp, reasonDenied` |
| **Parked (Phase 2)** | Emergency bulk pass, student self-scan kiosk |

### Smart Feature #2: Complaint SLA Automation (Final MVP Spec)

| Element | Decision |
|---------|----------|
| **SLA config** | Category-based defaults as JSON config file in backend (seeded to DB only if admin edits needed later): `{ plumbing: {warn:12h, esc:24h, priority:"HIGH"}, ... }` |
| **dueAt on creation** | Computed from config at complaint creation time; UI reads `dueAt`, cron queries `dueAt < now`; config changes don't retroactively affect existing complaints |
| **Countdown badge** | Shown on complaint detail + list views; derived from `dueAt - now()`; yellow = warning, red = breached |
| **Two-step escalation** | Step 1 (reminder): notifies assigned staff; Step 2 (escalation): bumps priority + notifies warden; Fields: `reminderSentAt`, `escalatedAt`, `escalationLevel` |
| **Auto-priority** | Category → default priority + default SLA; warden can override; covers 80% of cases |
| **Parked (Phase 2)** | Urgency score sorting, staff performance aggregations, student urgency bump button |

### Smart Feature #3: AI Chatbot (Final MVP Spec)

| Element | Decision |
|---------|----------|
| **Entry point** | Quick-reply buttons: "Complaint Status" / "Leave Status" / "Fee Due" / "Ask a Question" |
| **Status queries** | No LLM — button press → direct backend API call → template response; instant and reliable |
| **FAQ handling** | Fuse.js fuzzy match over 20 FAQ entries; handles typos and shorthand; no LLM needed |
| **LLM usage (optional)** | Only for rephrasing/nicer responses or category suggestion; never for correctness |
| **Next-action suggestions** | Hardcoded per status: e.g. Resolved → "Need help with something else?" |
| **Scope guardrail** | No RAG, no guided flows, no personal data guessing; "Ask a Question" = FAQ-only |
| **Parked (Phase 2)** | Proactive login greeting, chatbot as notification feed, query demand tracking |

### Creative Facilitation Narrative

_This session demonstrated exceptional collaborative refinement. The user brought strong product instincts — every SCAMPER suggestion was evaluated against a clear mental model of "shippable in 3-4 weeks" and "doesn't compromise security." Key breakthrough: the passType simplification (DAY_OUTING/OVERNIGHT instead of maxScans) made the QR system both simpler and more secure. The dueAt-on-creation pattern for SLA was a clean architectural insight that eliminates retroactive config bugs. The chatbot quick-reply buttons + no-LLM-for-status decision dramatically de-risked the highest-variance feature._

---

## Phase 4: Solution Matrix — Screens, Entities & MVP Roadmap (COMPLETE)

**Technique:** Solution Matrix for implementation planning
**Final customizations applied:** Page merges (21→16), QR logic refinement (outLoggedAt/inLoggedAt), CategoryConfig as JSON file, Notification collection added, Fees simplified, cron reliability hardened, index optimizations, notices moved earlier in roadmap.

### A. Screen/Page Shortlist by Role (16 Pages)

**Shared Pages (All Roles) — 2 pages**

| # | Page | Purpose |
|---|------|---------|
| S1 | Login | JWT auth, role-based redirect |
| S2 | Chatbot (floating widget) | FAQ + 3 status quick-reply buttons |

**Student — 5 pages**

| # | Page | Key Elements |
|---|------|-------------|
| ST1 | Dashboard | Room info, fee status card, unread notifications count, notices preview, quick-action buttons (Leave, Complaint, Chat) |
| ST2 | My Complaints | List with status badges + SLA countdown; click → detail drawer with full timeline |
| ST3 | New Complaint | Category dropdown (auto-sets priority), description, optional photo upload |
| ST4 | My Leaves | List with status; click → detail with QR pass view inline (QR code + passCode + leave window + countdown + status badge) |
| ST5 | Notices | Full notice list, filterable by date |

**Warden/Admin — 7 pages**

| # | Page | Key Elements |
|---|------|-------------|
| W1 | Dashboard | KPI cards (pending complaints, pending leaves, SLA breaches, occupancy, present count) + system health (last cron run, cron status, scan failures today) |
| W2 | Leave Requests | Pending list, one-click approve/reject, auto-generates QR pass on approve |
| W3 | Complaints | List with SLA countdown badges, filter by status/category/priority; click → detail drawer (timeline, assign to staff, override priority, view audit trail) |
| W4 | Students | Student list with room assignment, basic search/filter |
| W5 | Room Management | Room list, occupancy, assign/unassign students, capacity enforcement |
| W6 | Notices | Create + broadcast (target: all / block / floor), view history |
| W7 | Fee Management | Simple list form or CSV upload; student sees only due amount + paid/unpaid |

**Guard — 1 page**

| # | Page | Key Elements |
|---|------|-------------|
| G1 | Gate Scanner | Camera scanner on top + manual passCode input; scan result as full-screen green/red overlay with student name + leave window + pass type; auto-logs entry/exit |

**Maintenance Staff — 1 page**

| # | Page | Key Elements |
|---|------|-------------|
| M1 | My Assignments | Assigned complaints list filtered by priority/status; click → "Update" modal (Accept → In Progress → Resolved + add notes); student auto-notified on change |

---

### B. Database Entities (11 MongoDB Collections + 1 Config File)

| Collection | Key Fields | Notes |
|------------|-----------|-------|
| **User** | `_id, name, email, passwordHash, role (STUDENT\|WARDEN\|GUARD\|MAINTENANCE), phone, createdAt` | RBAC source of truth |
| **Student** | `_id, userId (ref User), rollNumber, roomId (ref Room), block, floor, admissionYear, isActive` | Extended student profile |
| **Room** | `_id, roomNumber, block, floor, capacity, currentOccupancy, isActive` | Capacity enforcement via pre-save hook |
| **LeaveRequest** | `_id, studentId, leaveType (DAY_OUTING\|OVERNIGHT), fromDate, toDate, reason, reasonTemplate, status (PENDING\|APPROVED\|REJECTED\|CANCELLED), approvedBy, approvedAt, passCode (random 6-8 digit), qrTokenId (UUID), outLoggedAt, inLoggedAt, createdAt` | QR pass lives here; direction logic via outLoggedAt/inLoggedAt |
| **GateLog** | `_id, studentId, leaveRequestId, direction (OUT\|IN), method (QR\|MANUAL), guardId, result (VALID\|EXPIRED\|CANCELLED\|INVALID\|NO_PASS), reasonDenied, scannedAt` | Scan audit trail; attendance proxy derived from latest per student |
| **Complaint** | `_id, studentId, category, description, photoUrl, priority (HIGH\|MEDIUM\|LOW), status (OPEN\|ASSIGNED\|IN_PROGRESS\|RESOLVED), assignedTo (ref User), assignedBy, dueAt, reminderSentAt, escalatedAt, escalationLevel, resolvedAt, resolvedNotes, statusChangedBy, createdAt, updatedAt` | SLA + audit fields baked in |
| **CategoryConfig** _(config file, not a collection)_ | Loaded from `config/categoryDefaults.json` at startup; not a MongoDB collection in MVP; seed to DB only if admin edit UI added later | `{ categoryName, defaultPriority, warnHours, escalateHours }` |
| **Notice** | `_id, title, content, targetScope (ALL\|BLOCK\|FLOOR), targetValue, createdBy, createdAt` | Broadcast targeting |
| **Fee** | `_id, studentId, semester, amount, status (PAID\|UNPAID\|PARTIAL), updatedBy, updatedAt` | MVP-lite: read-only for students, simple list edit or CSV upload by warden |
| **FAQ** | `_id, question, answer, keywords[], category, sortOrder` | Fuse.js search source for chatbot |
| **Notification** | `_id, userId, title, body, type (COMPLAINT_UPDATE\|LEAVE_UPDATE\|NOTICE\|SLA_ALERT), isRead, linkTo, createdAt` | In-app notifications; makes dashboard feel alive; supports chatbot "you have 2 updates" |
| **CronLog** | `_id, jobName, ranAt, status (SUCCESS\|FAIL), complaintsReminded, complaintsEscalated, errors[]` | System health indicator source; admin dashboard shows last run + status |

**Indexes (optimized)**

| Collection | Index | Purpose |
|------------|-------|---------|
| User | `email (unique)`, `role` | Auth lookup, role filtering |
| Student | `userId (unique)`, `roomId`, `rollNumber (unique)` | Profile lookup, room queries |
| Room | `roomNumber (unique)`, `{ block: 1, floor: 1 }` | Room lookup, block/floor filtering |
| LeaveRequest | `studentId`, `status`, `passCode (unique)`, `{ status: 1, fromDate: 1 }` | Student queries, guard validation |
| GateLog | `{ scannedAt: -1 }`, `{ studentId: 1, scannedAt: -1 }`, `leaveRequestId`, `guardId` | Attendance proxy, date-range queries, audit |
| Complaint | `studentId`, `{ status: 1, dueAt: 1 }`, `assignedTo`, `category`, `createdAt` | Cron efficiency, staff view, filters |
| Notice | `{ targetScope: 1, targetValue: 1 }`, `createdAt` | Targeted queries |
| Fee | `{ studentId: 1, semester: 1 }` | Student fee lookup |
| Notification | `{ userId: 1, isRead: 1, createdAt: -1 }` | Unread count, notification feed |
| CronLog | `ranAt` | Health check query |

---

### C. MVP Roadmap (4 Sprints)

#### Sprint 1 (Week 1): Foundation + Auth + Core Models

| Day | Deliverable |
|-----|------------|
| 1-2 | Project setup: MERN boilerplate, Tailwind config, folder structure, Mongoose connection, env config (`CRON_ENABLED`, `JWT_SECRET`, `QR_SECRET`) |
| 2-3 | All 11 Mongoose schemas + indexes + `config/categoryDefaults.json`, seed script (sample students, rooms, categories, FAQs, fee records) |
| 3-4 | Auth: register, login, JWT middleware, RBAC middleware (`requireRole()`), 4 seed users (one per role) |
| 5 | Login page + role-based redirect, layout shell per role (sidebar/header), basic Notification model + unread count API |

**Exit criteria:** 4 users can log in and see their empty dashboard shell with correct navigation per role.

---

#### Sprint 2 (Week 2): Complaints + SLA + Notices

| Day | Deliverable |
|-----|------------|
| 1-2 | Complaint CRUD APIs: create (auto-priority + `dueAt` from categoryDefaults), list (paginated + filtered), detail, assign, update status; audit trail fields populated on every mutation |
| 2-3 | Complaint UI: student creates + views timeline with SLA countdown badge; warden lists + assigns via detail drawer + overrides priority |
| 3 | Maintenance staff page: assigned complaints list, update modal (accept → in-progress → resolved + notes); status change triggers Notification creation for student |
| 4 | SLA cron job: 10-min interval, queries `{ status: 1, dueAt: 1 }`, reminder + escalation logic, CronLog writes with status, `CRON_ENABLED` env check |
| 5 | Notice CRUD APIs + UI: warden creates + broadcasts (all/block/floor); student notices page; notice list on student dashboard |

**Exit criteria:** Full complaint lifecycle works end-to-end including SLA escalation + CronLog. Notices broadcast and display. Maintenance staff can update assigned complaints.

---

#### Sprint 3 (Week 3): QR Gate System + Leave Flow + Admin Ops

| Day | Deliverable |
|-----|------------|
| 1 | Leave request CRUD APIs: create, list, approve/reject; on approve → generate signed JWT (`qrTokenId` + `leaveRequestId` + `passType` + `exp`) + random `passCode`, store on LeaveRequest |
| 2 | Leave UI: student creates (calendar + reason template + leave type); warden approves/rejects from pending list; approved → student sees QR pass inline in leave detail |
| 3 | Guard scanner page: html5-qrcode camera + manual passCode input; validate endpoint (JWT signature + expiry + `qrTokenId` lookup + `outLoggedAt`/`inLoggedAt` direction check); full-screen green/red overlay |
| 4 | GateLog: auto-create on every scan attempt (valid or denied); update `outLoggedAt`/`inLoggedAt` on LeaveRequest on valid scan; `GET /admin/hostel/present-count` endpoint |
| 5 | Admin ops: student list + room management pages (assign/unassign, capacity enforcement); warden dashboard KPIs (pending counts, SLA breaches, occupancy, present count) + system health cards (last cron run + status, scan failures today) |

**Exit criteria:** Live QR scan demo works on mobile. Guard scans → green/red → logged. Warden sees full dashboard with KPIs + health. Leave → QR → scan → log pipeline complete.

---

#### Sprint 4 (Week 4): Chatbot + Fees + Polish

| Day | Deliverable |
|-----|------------|
| 1-2 | Chatbot widget: quick-reply buttons → direct backend API calls for 3 status queries (complaint/leave/fee) + template responses + next-action suggestions (hardcoded per status) |
| 2-3 | Chatbot FAQ: seed 20 FAQ entries, Fuse.js fuzzy search for "Ask a Question" free-text; display matched answer or "I couldn't find that — try rephrasing or contact your warden" |
| 3 | Fee management: warden simple list form (or CSV upload), student read-only fee status card on dashboard |
| 4 | System polish: responsive pass on all pages (especially guard scanner on mobile), error handling, loading states, empty states, 404/403 pages |
| 5 | Demo prep: seed realistic demo data (20+ students, 5+ complaints at various statuses, 3+ leaves with QR passes, gate logs, notices, FAQ entries); end-to-end smoke test all 4 roles |

**Exit criteria:** Full system demo-ready with all 14 must-have features working. Chatbot handles status + FAQ. Guard scanner works on mobile. Dashboard KPIs + health indicators live.

---

#### Buffer / Nice-to-Have (if ahead of schedule, in priority order)

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | QR pass visual card with countdown timer | ~2h |
| 2 | "Hostel Pulse" health widget on admin dashboard | ~2h |
| 3 | Escalation chain visibility to student | ~3h |
| 4 | Photo before/after on complaint resolution | ~4h |
| 5 | In-app notification center page | ~4h |

---

### D. Permissions Matrix (RBAC)

| Action | Student | Warden/Admin | Guard | Maintenance |
|--------|---------|-------------|-------|-------------|
| **Auth** | | | | |
| Login / view own profile | Y | Y | Y | Y |
| **Complaints** | | | | |
| Create complaint | Y | - | - | - |
| View own complaints | Y | - | - | - |
| View all complaints | - | Y | - | - |
| Assign complaint to staff | - | Y | - | - |
| Override complaint priority | - | Y | - | - |
| View assigned complaints | - | - | - | Y |
| Update complaint status (accept/resolve) | - | - | - | Y |
| **Leave & QR** | | | | |
| Create leave request | Y | - | - | - |
| View own leaves + QR pass | Y | - | - | - |
| Approve / reject leave | - | Y | - | - |
| View all leave requests | - | Y | - | - |
| Scan QR / validate passCode | - | - | Y | - |
| **Admin Ops** | | | | |
| View student list | - | Y | - | - |
| Manage rooms (assign/unassign) | - | Y | - | - |
| Create / broadcast notices | - | Y | - | - |
| View notices | Y | Y | - | - |
| Edit fee records | - | Y | - | - |
| View own fee status | Y | - | - | - |
| **System** | | | | |
| View dashboard KPIs + health | - | Y | - | - |
| View notifications (own) | Y | Y | - | Y |
| Use chatbot | Y | - | - | - |

---

### E. State Machines

#### LeaveRequest Status

```
PENDING ──→ APPROVED ──→ (gate scans) ──→ COMPLETED (both outLoggedAt + inLoggedAt set)
   │            │
   │            └──→ CANCELLED (by student, only before OUT scan / outLoggedAt is null)
   │
   └──→ REJECTED (by warden)
```

**Transition rules:**
- `PENDING → APPROVED`: Warden only; generates QR pass + passCode
- `PENDING → REJECTED`: Warden only
- `APPROVED → CANCELLED`: Student only; allowed only if `outLoggedAt` is null (hasn't left yet)
- Gate scans only allowed when `status = APPROVED`

#### Complaint Status

```
OPEN ──→ ASSIGNED ──→ IN_PROGRESS ──→ RESOLVED
```

**Transition rules:**
- `OPEN → ASSIGNED`: Warden assigns to maintenance staff (sets `assignedTo`, `assignedBy`)
- `ASSIGNED → IN_PROGRESS`: Maintenance staff accepts (sets `statusChangedBy`)
- `IN_PROGRESS → RESOLVED`: Maintenance staff resolves (sets `resolvedAt`, `resolvedNotes`, `statusChangedBy`)
- Warden can override priority at any status
- SLA cron checks `dueAt` regardless of status (until RESOLVED)

---

### F. API Inventory

#### Auth
- `POST /api/auth/register` — Create user (admin-only in MVP)
- `POST /api/auth/login` — Returns JWT + role
- `GET /api/auth/me` — Current user profile

#### Complaints
- `POST /api/complaints` — Create (student; auto-sets priority + dueAt)
- `GET /api/complaints` — List (filtered by role: own for student, assigned for maintenance, all for warden)
- `GET /api/complaints/:id` — Detail with timeline + audit trail
- `PATCH /api/complaints/:id/assign` — Assign to staff (warden)
- `PATCH /api/complaints/:id/status` — Update status (maintenance: accept/resolve; sets audit fields)
- `PATCH /api/complaints/:id/priority` — Override priority (warden)

#### Leave & QR
- `POST /api/leaves` — Create leave request (student)
- `GET /api/leaves` — List (own for student, all pending for warden)
- `PATCH /api/leaves/:id/approve` — Approve + generate QR (warden)
- `PATCH /api/leaves/:id/reject` — Reject (warden)
- `PATCH /api/leaves/:id/cancel` — Cancel (student; only if outLoggedAt is null)
- `POST /api/gate/validate` — Validate QR token or passCode (guard); atomic `findOneAndUpdate` on outLoggedAt/inLoggedAt; returns scan result
- `GET /api/gate/logs` — Gate log history (warden)

#### Admin Ops
- `GET /api/students` — Student list with room info (warden)
- `POST /api/rooms/:id/assign` — Assign student to room (warden)
- `POST /api/rooms/:id/unassign` — Remove student from room (warden)
- `GET /api/rooms` — Room list with occupancy (warden)
- `POST /api/notices` — Create + broadcast (warden)
- `GET /api/notices` — List (filtered by student's block/floor or all)
- `GET /api/admin/dashboard` — KPI counts + system health
- `GET /api/admin/hostel/present-count` — Students currently in hostel

#### Fees
- `GET /api/fees/me` — Own fee status (student)
- `GET /api/fees` — All fee records (warden)
- `PATCH /api/fees/:id` — Update fee status (warden)

#### Chatbot
- `GET /api/chat/status/complaints` — My latest complaint status (student, authenticated)
- `GET /api/chat/status/leaves` — My latest leave status (student, authenticated)
- `GET /api/chat/status/fees` — My fee summary (student, authenticated)
- `GET /api/chat/faq?q=` — Fuse.js fuzzy search over FAQ entries

#### Notifications
- `GET /api/notifications` — Unread + recent (own, authenticated)
- `PATCH /api/notifications/:id/read` — Mark as read

#### Anti-Replay & Rate Limiting
- `POST /api/gate/validate` uses atomic `findOneAndUpdate` with conditions (`outLoggedAt: null` for OUT, `inLoggedAt: null` for IN) to prevent race conditions
- Manual passCode validation: rate-limited to **5 attempts per minute per guard** (prevents brute force)

---

### G. Timezone & Date Handling

- **Storage:** All timestamps stored in UTC (`Date` type in MongoDB stores UTC by default)
- **Display:** Frontend converts to `Asia/Kolkata` (IST) for display using `Intl.DateTimeFormat` or dayjs
- **Leave windows:** `fromDate` / `toDate` validated server-side in UTC; QR `exp` claim set in UTC
- **SLA `dueAt`:** Computed in UTC on complaint creation; cron compares against `new Date()` (UTC)

---

### H. Demo Setup

#### Seed Accounts

| Role | Email | Password | Name |
|------|-------|----------|------|
| Student | student@hostel.demo | demo1234 | Rahul Sharma |
| Warden | warden@hostel.demo | demo1234 | Dr. Priya Nair |
| Guard | guard@hostel.demo | demo1234 | Suresh Kumar |
| Maintenance | maintenance@hostel.demo | demo1234 | Ravi Patel |

#### Seed Data

- **Students:** 20 students across 10 rooms (2 per room), Block-A floors 1-3
- **Rooms:** 10 rooms (capacity 2-4), mix of full and available
- **Complaints:** 5 at various statuses:
  - 1 OPEN (Plumbing, auto-priority HIGH, near SLA breach)
  - 1 ASSIGNED (Electrical, assigned to Ravi)
  - 1 IN_PROGRESS (Furniture, with notes)
  - 1 RESOLVED (Cleanliness, with resolvedNotes + timestamps)
  - 1 OPEN + SLA BREACHED (to demo escalation visibility)
- **Leaves:** 3 at various statuses:
  - 1 PENDING (to demo approve/reject flow)
  - 1 APPROVED with valid QR (to demo live scan)
  - 1 COMPLETED with both gate logs (to demo full lifecycle)
- **Gate Logs:** 4 entries matching the leave lifecycle above
- **Notices:** 2 (1 targeting ALL, 1 targeting Block-A Floor-2)
- **FAQs:** 20 entries covering hostel timings, rules, fees, contact info
- **Fees:** Records for all 20 students (mix of PAID and UNPAID)
- **Notifications:** 3-4 unread for the demo student (complaint update, leave approved, notice)

---

## Session Summary and Insights

### Key Achievements

- **23 core ideas** generated in Phase 1, expanded to **28** with Phase 2-3 refinements (5 Green Hat additions)
- **14 must-have features** locked with clear scope boundaries
- **3 smart features** fully specified with implementation details and security considerations
- **16 pages** mapped across 4 roles (reduced from 21 via smart merges)
- **11 MongoDB collections + 1 config file** with optimized indexes
- **4-sprint roadmap** with daily deliverables and exit criteria
- **12 nice-to-have features** prioritized for stretch goals
- **RBAC permissions matrix** covering all actions across 4 roles
- **State machines** for LeaveRequest and Complaint status transitions
- **30+ API endpoints** inventoried with anti-replay + rate limiting notes
- **Demo seed data** with 4 accounts + realistic test data across all entities

### Architectural Differentiators (Why This Isn't "Just CRUD")

1. **Cryptographic security** — Signed JWT QR passes with UUID token IDs, time-bound expiry, direction-aware scan logic
2. **Time-based automation** — Category-driven SLA with `dueAt` computation, two-step escalation chain, CronLog audit trail
3. **AI integration** — Chatbot with direct API tool-calls for status, Fuse.js fuzzy FAQ, hardcoded next-action suggestions
4. **Role-based access** — 4 distinct roles with RBAC middleware, each with tailored UI and permissions
5. **Audit & observability** — Scan attempt logs, complaint audit trail fields, cron health indicators, in-app notifications

### Session Reflections

_This brainstorming session was a masterclass in disciplined product thinking. The facilitator (sayuj) consistently applied the "shippable in 3-4 weeks" filter to every feature suggestion, preventing scope creep while maintaining innovation. Key decisions that will save significant build time: passType simplification over maxScans, dueAt-on-creation over retroactive SLA calculation, quick-reply buttons over LLM intent detection for status queries, page merges reducing route count by 25%. The result is a system that looks and feels advanced while remaining genuinely buildable within the timeline._
