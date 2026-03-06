---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowComplete: true
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-03-01-1500.md
date: 2026-03-01
author: sayuj
---

# Product Brief: SmartHostel

## Executive Summary

SmartHostel is a full-stack hostel management platform that replaces the informal, trust-based processes many hostels rely on today — WhatsApp approvals, paper registers, verbal follow-ups — with verified access, time-bound workflows, and self-service information. Built on a MERN stack with four distinct roles (Student, Warden/Admin, Guard, Maintenance Staff), it focuses on three integrated capabilities: cryptographically signed QR gate passes that eliminate gate disputes, SLA-driven complaint automation that enforces accountability, and a chat-style self-service assistant that deflects repetitive queries through FAQ search and instant status shortcuts. The result is a system that feels modern and operationally accountable while remaining buildable within a 3-4 week MVP timeline — with auditability and system health built in by design.

**Expected outcomes (6-month view):** fewer gate disputes and fake approvals, predictable complaint resolution through SLA escalation, reduced staff workload from repetitive questions, and clear action trails for warden accountability to parents and management.

**Success Metrics:**
- Gate disputes reduced (proxy: denied/override incidents trend)
- % complaints resolved before SLA breach
- Average complaint resolution time
- Reduction in repeat follow-ups (proxy: complaint comments/updates)
- Chat deflection rate (FAQ/status interactions vs. manual queries)

---

## Core Vision

### Problem Statement

Hostels commonly rely on manual, trust-based processes for approvals, complaints, and communication — creating delays, disputes, and no systemic accountability. Leave approvals are often verified through WhatsApp screenshots that can be faked, misread, or outdated. Complaints disappear into a black hole with no timer, no escalation, and no transparency. Communication is scattered across WhatsApp groups, paper notice boards, and word-of-mouth. The hostel ends up running on manual coordination, not a system.

### Problem Impact

This breakdown affects every role:

- **Students** experience helplessness — a plumbing complaint is raised and there's no update for a week; a leave is approved but the guard doesn't believe the screenshot. Low visibility into status forces repeated follow-ups for basic resolution.
- **Wardens/Admins** are overwhelmed — managing dozens of untracked requests across WhatsApp and registers, unable to prove what action was taken, and reacting only after issues become noisy. When parents call to escalate, there's no audit trail to demonstrate accountability.
- **Guards** are forced into judgment calls using unreliable proof (forwarded messages, edited screenshots), causing either security gaps or wrongful blocking of approved students. They get blamed either way.
- **Maintenance staff** lack clarity — assignments come through phone calls or verbal messages with no priority, no tracking, and no proof of completion. Their work goes unrecognized.

Measurable consequences include slow complaint resolution, duplicate complaints, gate disputes, and high staff overhead from repetitive queries — all eroding trust between students and administration.

### Why Existing Solutions Fall Short

Many hostels still operate with little or no dedicated software — relying on registers and WhatsApp coordination. When software is used, it often falls into two buckets:

- **ERP-style hostel suites** bundle multiple modules (fees, attendance, allocation), but can feel heavy, costly, or generic for daily hostel friction, especially around accountability and follow-through.
- **Open-source/student projects** typically solve only one slice (gate pass or complaints) without workflow depth, security controls, escalation automation, or auditability.

The core gap is not the presence of "modules," but the lack of an integrated system that combines: (a) verified gate access, (b) time-bound complaint accountability with escalation transparency, and (c) self-service support to reduce repetitive queries.

### Proposed Solution

SmartHostel replaces informal processes with three integrated smart workflows, built on RBAC + audit + operational health:

1. **QR Gate Pass System** — Approved leaves generate signed, time-bound JWT-based QR passes with anti-replay checks. Guards scan and receive instant green/red verification. Entry/exit is auto-logged with scan audit trails. Connectivity fallback: if scanning fails due to camera or network issues, the guard can verify using a manual passCode; all attempts (valid/denied) are logged when connectivity is available. Manual passCode verification is protected with rate-limiting and expiry to prevent guessing or reuse. Emergency override: the guard can record an exception with a warden-approved override code; the event is logged with reason and actor for accountability. The gate scanner is designed for throughput: auto-scan mode with instant result and auto-return to scanning, a lightweight page optimized for low-end devices and outdoor visibility, minimizing queue time during rush hours.

2. **Complaint SLA Automation** — Each complaint gets a category-driven due time computed at creation. Category-driven auto-priority ensures critical issues (plumbing, electrical, safety) receive shorter SLA windows while lower-priority items (cosmetic, general) get longer thresholds — preventing SLA fatigue from over-alerting. A cron job monitors deadlines, triggers reminders at warning thresholds, and escalates when breached. Students see countdown badges and status timelines; accountability becomes automatic.

3. **Self-Service Assistant (Chat UI)** — Quick-reply buttons handle the three most common queries (complaint status, leave status, fee due) via authenticated backend APIs. Free-text questions use fuzzy FAQ search. Optional LLM usage is limited to rephrasing, never correctness. The assistant functions as a query deflection layer — its value is measured by queries not reaching the warden, not by chatbot engagement alone.

Maintenance is treated as a first-class role with a dedicated, lightweight, low-end-phone-friendly web view for assigned work with priority, enabling accept/progress/resolve tracking with notes. Photos before/after are a Phase 2 enhancement.

SmartHostel avoids alert fatigue by routing reminders to the responsible actor and escalating only when necessary; notifications are grouped to keep signal above noise. MVP uses in-app notifications to keep students updated on complaint/leave changes and notices, reducing repeated follow-ups. WhatsApp/SMS notifications can be integrated in a later phase.

**Adoption & Rollout:** SmartHostel is designed for role adoption: leave approvals are issued only through the system (QR/passCode), gate verification follows a single green/red flow, and wardens get daily exception-focused dashboards. Warden delegation: a secondary approver can be configured to handle leave approvals during absence, preventing a single-point-of-failure bottleneck. Delegation is scoped — secondary approvers can manage leave approvals without gaining full admin access. Launch readiness requires a seed/import process: student list (CSV import), room mapping, FAQ entries, and category SLA config so dashboards and allocation data are meaningful from day one. The platform is intended for a pilot rollout (one block/floor) before hostel-wide adoption.

### Key Differentiators

- **Not just CRUD** — blends cryptographic verification, time-based automation, chat-driven self-service, and multi-role RBAC.
- **Workflow depth over module breadth** — prioritizes the daily friction points (gate verification + complaint accountability + repetitive queries).
- **Built for real hostel reality** — designed around how hostels actually operate today (WhatsApp/register-driven workflows).
- **Auditable and observable** — scans, assignments, status changes, and cron runs are traceable with actor + timestamp and health indicators — enabling wardens to demonstrate clear accountability to parents and management.
- **Portfolio-grade architecture** — demonstrates crypto, automation, assistant integration, and multi-role access beyond typical student projects.

### Phase 2 Enhancements (Out of MVP Scope)

- Offline-first gate verification
- Bulk room assignment and advanced admin operations
- Photo before/after on complaint resolution
- WhatsApp/SMS notification integration
- Detailed reports and analytics
- Chatbot guided flows (apply leave wizard, register complaint wizard)

---

## Target Users

### Primary Users

#### Student Personas

**Persona S1: Rahul Sharma — Typical Resident Student (Core Archetype)**

- **Profile:** 2nd year, Engineering; 3-sharing room, Block-A, Floor-2
- **Device:** Android phone, moderate internet, uses WhatsApp constantly
- **Behaviors:** Avoids admin office unless forced; expects instant updates
- **Top frustrations:** Complaint "black hole" with no visibility, leave verification embarrassment at the gate, fee uncertainty requiring office visits
- **Goals:** Quick complaint resolution + predictable leave approval + no gate arguments
- **Success looks like:** Status visibility + countdown badges + notifications; QR pass always accepted without dispute

**Persona S2 (Variant): Aisha Khan — First-Year Student (Needs Hand-Holding)**

- **Profile:** 1st year; unsure about hostel rules and processes; anxious during conflicts with guard or warden
- **Needs:** Guided UI, clear templates, FAQ/chat assistant, "what to do next" hints
- **Key pain:** Doesn't know how to file a complaint or leave request properly; relies on seniors or office staff for guidance

**Persona S3 (Variant): Karan Mehta — Final-Year Student (Independent, Time-Poor)**

- **Profile:** 4th year; minimal patience; frequently has internships and placement interviews
- **Needs:** Fast leave approvals, quick status checks, no paperwork or office visits
- **Key pain:** Gate delays and admin visits waste time he doesn't have

**Student persona takeaway:** Rahul is the default design archetype. Aisha and Karan represent the independence spectrum — the UI must serve first-years who need guidance and final-years who need speed.

---

#### Warden/Admin Persona

**Persona W1: Dr. Priya Nair — Faculty Warden (Hybrid Role, Default Archetype)**

- **Profile:** Faculty member assigned as warden; juggles teaching + hostel operations
- **Works with:** 1 assistant/office clerk (sometimes informal); secondary approver configured for leave delegation. Delegation is scoped to leave approvals only.
- **Constraints:** Limited time windows to process approvals; receives parent escalation calls
- **Top frustrations:** No proof-of-action when parents call, firefighting instead of managing, volume overload, "he said/she said" disputes
- **Goals:** Accountability + audit trail; exception-based dashboard; fewer parent escalations
- **Success looks like:** "Assigned at 3pm, reminder sent Wednesday 10am, resolved Thursday" — evidence instantly available on demand

**Persona W2 (Variant): Mr. Anil Deshmukh — Dedicated Hostel Manager (Operations-First)**

- **Profile:** Full-time hostel manager at private hostels or larger campuses
- **Needs:** Bulk operations (CSV import), room allocation controls, reporting
- **Success looks like:** Smooth throughput, low dispute rate, predictable maintenance flow

**Warden persona takeaway:** Faculty warden + assistant is the default assumption. The delegation feature (secondary approver for leave) fits this model perfectly. Dedicated manager variant validates that the system scales to larger operations.

---

#### Guard Persona

**Persona G1: Suresh Kumar — Contract Security Guard (Shift-Based)**

- **Profile:** Contract security staff; works morning rush and evening return shifts
- **Device:** Basic Android provided by security agency OR personal phone
- **Gate reality:** Manual barrier + paper register; outdoor, variable lighting, unreliable internet
- **Constraints:** High throughput during rush hours (~50 students in 1 hour), low patience, outdoor conditions. Manual passCode works during camera issues; offline-first verification is Phase 2.
- **Top frustration:** Gets blamed no matter what — lets someone through on a fake screenshot, or blocks a genuinely approved student
- **Goals:** Binary decision system (green/red), fast scanning (< 2 seconds), manual fallback, everything logged
- **Success looks like:** Scan, see green or red, move on. No judgment calls. No blame. Every event logged automatically.

---

#### Maintenance Staff Persona

**Persona M1: Ravi Patel — Maintenance Technician (Team-of-3 Model)**

- **Profile:** Small specialized team — typically 1 electrician, 1 plumber, 1 general handyman/cleaning supervisor
- **Device:** Basic smartphone; app must work on low-end devices
- **Constraints:** Receives tasks verbally today; no tracking; student often not present; no proof of completion
- **Goals:** Clear queue of assigned work with priority + proof-of-completion notes
- **Success looks like:** Fewer repeated calls, fewer "you didn't come" disputes, clear closure proof with notes (photos in Phase 2)

**Maintenance persona takeaway:** Model as a small specialized team. The app supports this naturally via role=MAINTENANCE + category-based assignment (plumbing to plumber, electrical to electrician).

---

### Secondary Users (Stakeholders, Not System Users in MVP)

**Persona P1: Mrs. Sharma — Parent Escalator**

- **Profile:** Doesn't use the app, but calls the warden when something feels unresolved for her child
- **Needs:** Proof that action is being taken — the audit trail enables the warden to handle these calls with confidence
- **Success looks like:** Faster resolution for her child + less uncertainty; she stops needing to call

**Persona H1: Hostel Superintendent / Chief Warden (Phase 2)**

- **Profile:** Oversight role interested in aggregate metrics — SLA breaches, occupancy trends, escalation patterns
- **Relevance:** Not needed in MVP, but dashboard data and CronLog already produce the raw metrics this role would consume

**IT/System Admin (Phase 2)**

- **Profile:** Manages deployment, backups, user provisioning
- **Relevance:** Not an MVP user but relevant for production readiness

---

### User Journeys

#### Discovery & Onboarding

SmartHostel is **mandated by the hostel**, not discovered organically. The warden announces it during induction or pilot launch. Student accounts are pre-created via CSV import; students receive login credentials on admission day (via notice or WhatsApp group), then reset their password on first login. Guards and maintenance staff receive pre-created role accounts. The onboarding barrier is near-zero — log in, see your dashboard, start using.

#### "Aha" Moments by Role

| Role | First "Aha" Moment | What Changes |
|------|-------------------|--------------|
| **Student (Rahul)** | Raises a complaint and immediately sees status + SLA countdown; gets a notification when it's assigned. Or: QR pass is scanned at the gate in < 2 seconds — no calling the warden, no embarrassment. | Shifts from "nobody cares" to "the system is tracking this for me" |
| **Warden (Dr. Priya)** | A parent calls about a complaint, and she instantly reads out the audit trail: who assigned it, when reminders happened, resolution note. Second aha: dashboard shows near-breach complaints, so she acts before issues become noise. | Shifts from firefighting to exception management |
| **Guard (Suresh)** | First rush hour where scanning is faster than writing in a register. Green/red decision removes blame. Manual passCode fallback works when camera/network fails. | Shifts from "judgment calls I get blamed for" to "the system decides, I execute" |
| **Maintenance (Ravi)** | Opens the app, sees a prioritized queue instead of a verbal phone call. Updates status, student gets notified automatically. | Shifts from "invisible work" to "tracked and acknowledged" |

#### Long-Term Routine (After 1 Month)

- **Rahul (Student):** Raises complaint/leave in < 1 minute; checks status occasionally; relies on notifications and notices; uses chatbot for quick status/FAQ queries.
- **Dr. Priya (Warden):** 5-10 minute daily routine — approve leaves in batches, glance at "near breach" complaints, handle only escalations/exceptions; uses audit trail for parent calls.
- **Suresh (Guard):** Scan-and-go all day; uses manual passCode rarely; logs exceptions with override when needed.
- **Ravi (Maintenance):** Starts day by checking assigned queue; updates status as work progresses; closes with notes (photos later if enabled).

---

## Success Metrics

### What "Success" Means for SmartHostel

SmartHostel success is measured on three dimensions:

**A) Demo/Portfolio Success (Immediate — Week 4)**

A live end-to-end demo proves:
- Leave approved → QR generated → scanned green/red → GateLog written
- Complaint created → SLA countdown visible → reminder/escalation happens → audit trail shows it
- Chat assistant answers FAQ + returns real status for leave/complaint/fee
- Demo success criteria: 100% of scripted demo flows succeed with seeded data.

**B) Pilot Adoption Success (Month 1 — Real-World Usability)**

People actually use it rather than reverting to WhatsApp/registers. Measured by in-app processing rates for leaves and complaints.

**C) Operational Outcome Success (Months 3-6 — Proof It Improves Reality)**

Fewer disputes, faster and more predictable resolution, fewer repetitive queries reaching the warden.

### Timeframes & Targets

| Checkpoint | When | Goal |
|-----------|------|------|
| **T0: MVP Demo** | Week 4 | System stable + all flows work end-to-end |
| **T1: Pilot** | Month 1 | Adoption + throughput + data correctness |
| **T2: Outcome Window** | Months 3-6 | Measurable operational improvements (SLA, disputes, workload) |

---

### User Success Metrics (By Role)

#### Student (Rahul / Aisha / Karan)

| Metric | KPI | Target |
|--------|-----|--------|
| Complaint transparency | % complaints with visible SLA countdown + status timeline | 100% |
| Time to first assignment | Median time from creation to assignment | ≤ 12h (HIGH), ≤ 24h (overall) |
| Gate experience | Gate dispute rate: (overrides + denied_with_valid_leave + manual_verification_requests) / total exit attempts | < 2% of exits after Month 1 |
| Self-service | Fee status self-serve rate (page views + assistant fee queries / total fee queries) | ≥ 70% by Month 1 |

**How to measure:** Complaint timestamps (createdAt, assignedAt), GateLog results, assistant query logs, notification read rates.

#### Warden/Admin (Dr. Priya)

| Metric | KPI | Target |
|--------|-----|--------|
| Proof-of-action | % escalated parent complaints where warden can show audit trail | 100% (capability KPI) |
| SLA control | % complaints resolved before SLA breach | ≥ 70% Month 1, ≥ 85% Month 3 |
| Workload reduction | Warden follow-up load (complaint comments/updates per week, % escalated to warden) | Trending down |
| Approvals throughput | Median leave approval time | ≤ 8 working hours in Month 1 |
| Approvals responsiveness | % leaves approved within 24 hours | ≥ 80% Month 1 |

**How to measure:** Complaint and leave audit fields, escalation counts, dashboard aggregates, assistant logs.

#### Guard (Suresh)

| Metric | KPI | Target |
|--------|-----|--------|
| Speed | Median scan-to-result time | ≤ 2s (decent device), ≤ 4s (low-end) |
| Rush-hour throughput | Students processed per hour without queue growth | 50 students/hour |
| Reliability | Scan success rate (VALID scans / total attempts) | ≥ 95% after Month 1 |
| Fallback usage | Manual passCode usage rate | < 10% (too high = scanning UX/device issues) |
| Blame protection | Override rate (logged emergencies) | Trending down; < 1-2% of daily exits |

**How to measure:** GateLog (scannedAt, result, method, reasonDenied).

#### Maintenance (Ravi + Team)

| Metric | KPI | Target |
|--------|-----|--------|
| Clear work queue | % complaints accepted by staff within threshold | ≤ 6h (HIGH), ≤ 12h (overall) |
| Closure quality | % resolved complaints with resolution notes | ≥ 90% |
| Efficiency | Median resolution time by category | Improving over 3 months |

**How to measure:** Complaint status timestamps, resolvedNotes presence, assignedTo/resolvedAt.

---

### Adoption KPIs

| Metric | KPI | Target (Month 1) |
|--------|-----|-------------------|
| Student adoption | Weekly Active Users (WAU) — Students | ≥ 60% |
| Warden adoption | Weekly Active Users (WAU) — Warden | ≥ 90% |
| Guard adoption | Weekly Active Users (WAU) — Guard | ≥ 80% |
| Maintenance adoption | Weekly Active Users (WAU) — Maintenance | ≥ 70% |

---

### Smart Feature KPIs (System-Level)

#### QR Gate Pass System

- **Fraud prevention proxy:** % denied scans due to expired/cancelled/reused tokens
- **Correctness:** % exits with approved leave
- **Present count accuracy proxy:** % students whose latest gate status is consistent (no missing IN after OUT beyond leave window)

#### SLA Automation

- **Reminder effectiveness:** % complaints resolved within 24h of reminder
- **Escalation effectiveness:** % escalated complaints resolved within 24h of escalation
- **Cron reliability:** 99% of scheduled cron runs recorded as SUCCESS in CronLog

#### Self-Service Assistant (Chat UI)

- **Deflection rate:** (FAQ answers + status replies) / total chat interactions — target: ≥ 60% of common queries handled without warden
- **Status query success rate:** tool-call success / attempts — target: ≥ 99%
- **Top intents:** complaint status / leave status / fee due / FAQs (helps iterate)

---

### Business Objectives

#### Warden Dashboard KPIs (The "Is This Working?" Panel)

**Operations:**
- Pending leaves (today)
- Complaints near SLA breach (next 6-12 hours)
- SLA breached complaints (count)
- Open complaints by category (top 3)

**Safety:**
- Present count (inside hostel)
- Students currently out (based on gate logs)

**System Health:**
- Last cron run (time + success/fail)
- Scan failures today (count)
- Overrides today (count)

**Adoption:**
- Leaves processed in-app (%)
- Complaints created in-app (%)

---

### Key Performance Indicators

#### Measurement Implementation

Required timestamps (most already exist in schema; confirm these):
- **Complaint:** `assignedAt`, `acceptedAt`, `resolvedAt`
- **Leave:** `approvedAt`
- **GateLog:** store scan duration (optional) or compute in frontend and send with log
- **Assistant:** log `intent`, `success`, `latencyMs`

#### Data Readiness KPI (Pre-Pilot Gate)

Setup completeness score must be green before rollout:

| Check | Target |
|-------|--------|
| Students imported | 100% |
| Rooms mapped | 100% |
| Categories configured | 100% |
| FAQs seeded | ≥ 20 entries |

#### MVP "Pass/Fail" Scorecard (For Evaluation)

At demo time, SmartHostel can claim success if:

- [ ] QR flow works end-to-end with green/red + logs
- [ ] Complaint SLA countdown visible + cron produces at least one reminder and one escalation in demo data
- [ ] Assistant answers FAQ + returns complaint/leave/fee status
- [ ] RBAC works (each role sees only their screens)
- [ ] Dashboard shows KPIs + health indicators (cron status + scan failures)

---

## MVP Scope

### Core Features (18 Must-Haves, By Workflow)

#### A) Platform Foundation

| # | Feature | Details |
|---|---------|---------|
| 1 | JWT Auth + RBAC | 4 roles: Student, Warden/Admin, Guard, Maintenance. `requireRole()` middleware. |
| 2 | Audit trail fields | `assignedBy`, `approvedBy`, `statusChangedBy`, timestamps on all key mutations. |
| 3 | System health indicators | CronLog (success/fail per run), scan failures today, last cron run time — surfaced on warden dashboard. |
| 4 | In-app notifications | Notification collection with type-based routing; grouped to prevent alert fatigue. Reminders go to responsible actor only; escalations go to warden. |

#### B) Onboarding & Data Readiness

| # | Feature | Details |
|---|---------|---------|
| 5 | Student CSV import | Basic CSV upload to create student accounts + optional `roomId` field; room assignment can also be done manually in Room Management. Non-negotiable for 300-student hostels. |
| 6 | Room mapping | Manual room entry or CSV; capacity enforcement via pre-save hook. |
| 7 | Seed data & config | 20+ FAQ entries seeded; `categoryDefaults.json` with per-category SLA thresholds and default priorities. Setup readiness checklist must be green before pilot. |

#### C) Complaints + SLA Automation

| # | Feature | Details |
|---|---------|---------|
| 8 | Complaint creation | Student: category dropdown (auto-sets priority + `dueAt`), description, optional single photo upload at creation. < 30 seconds to file. (Phase 2 adds before/after evidence photos at resolution.) |
| 9 | Complaint lifecycle | Status timeline (OPEN → ASSIGNED → IN_PROGRESS → RESOLVED) with SLA countdown badges. Explicit timestamps: `assignedAt`, `acceptedAt`, `resolvedAt`. Filters by status/category/priority for warden. |
| 10 | Complaint assignment | Warden assigns to maintenance staff with priority override. Audit trail fields populated on every mutation. |
| 11 | Maintenance staff view | Assigned complaints queue with priority. Accept → In Progress → Resolved + resolution notes. Student auto-notified on status change. |
| 12 | SLA cron automation | 10-min interval. Category-driven `dueAt`. Step 1: reminder to assigned staff. Step 2: escalation (bumps priority + notifies warden). CronLog writes with status. `CRON_ENABLED` env flag. Notification routing prevents fatigue. |

#### D) Leave + QR Gate Pass

| # | Feature | Details |
|---|---------|---------|
| 13 | Leave request + approval | Student creates (calendar + reason template + leave type: DAY_OUTING / OVERNIGHT). Warden approves/rejects. On approve: generates signed JWT QR + random passCode. |
| 14 | Leave delegation | Secondary approver configurable for leave approvals during warden absence. Scoped to leave approvals only — no full admin access. Only Warden/Admin can configure secondary approvers. |
| 15 | Guard scanner | Auto-scan mode with instant green/red full-screen result and auto-return to scanning. Lightweight page optimized for low-end devices and outdoor visibility. Manual passCode fallback with rate-limiting (5 attempts/min/guard) + passCode locked after N failures for 10 minutes. Emergency override: logged with reason + actor, reviewed daily by warden. |
| 16 | Gate logging | Every scan attempt logged (guardId, method QR/MANUAL, result, timestamp, reasonDenied). `outLoggedAt`/`inLoggedAt` direction logic. Present count endpoint derived from latest IN/OUT per student. |

#### E) Notices + Fees

| # | Feature | Details |
|---|---------|---------|
| 17 | Notices | Warden creates + broadcasts (target: all / block / floor). Student notice feed, filterable by date. Notices preview on student dashboard. |
| 18 | Fee status | Student: read-only fee status card (paid/unpaid/amount). Warden: simple list form or CSV upload. No payment gateway in MVP. |

---

### MVP Out of Scope (Phase 2)

These features are explicitly deferred to prevent scope creep while maintaining a clear evolution path:

| Feature | Rationale for Deferring |
|---------|------------------------|
| Offline-first QR validation | Requires service worker + local cache architecture; manual passCode covers connectivity gaps in MVP |
| WhatsApp/SMS notifications | External integration complexity; in-app notifications sufficient for pilot |
| Chatbot guided flows (leave/complaint wizard) | Scope risk; quick-reply buttons + FAQ cover core needs |
| Photo before/after on maintenance resolution | Nice-to-have proof-of-completion; resolution notes sufficient for MVP |
| Bulk room assignment | Manual + CSV covers pilot scale; advanced bulk ops for larger deployments |
| Advanced reports + superintendent dashboards | Dashboard KPI counts cover MVP; detailed analytics for Phase 2 oversight role |
| Payment gateway + fee receipts | Fee module is read-only in MVP; payment integration adds significant complexity |
| Smart complaint auto-categorization (LLM) | Category dropdown with auto-priority covers 80% of cases |
| Duplicate complaint detection | Low frequency at pilot scale; valuable at campus-wide scale |
| Student self-scan kiosk / emergency bulk pass | Edge cases better served after core flow is proven |

---

### Sprint Mapping

| Sprint | Week | Focus | Key Deliverables |
|--------|------|-------|-----------------|
| **Sprint 1** | Week 1 | Foundation + Auth + Data Readiness | Project setup, all Mongoose schemas + indexes, JWT + RBAC middleware, login + role-based redirect, layout shells, student CSV import, room mapping, seed script, Notification model |
| **Sprint 2** | Week 2 | Complaints + SLA + Notices | Complaint CRUD + auto-priority + `dueAt`, complaint UI (student + warden + maintenance), SLA cron with CronLog, notice CRUD + broadcast, notification routing/batching |
| **Sprint 3** | Week 3 | Leave + QR Gate + Admin Ops | Leave CRUD + approve/reject + delegation, QR generation + guard scanner (rush-hour UX), GateLog + present count, passCode rate-limiting + lockout, warden dashboard KPIs + system health cards |
| **Sprint 4** | Week 4 | Assistant + Fees + Polish | Chat widget (3 status queries + FAQ), fee management (read-only student + warden CSV/form), responsive polish (especially guard scanner on mobile), error/empty/loading states, demo seed data, end-to-end smoke test |

---

### MVP Success Criteria

#### Gate 1: Demo Ready (Week 4)

At demo time, SmartHostel can claim success if:

- [ ] QR flow works end-to-end: approve → QR → scan green/red → GateLog written
- [ ] Complaint SLA countdown visible + cron produces at least one reminder and one escalation in demo data
- [ ] Assistant answers FAQ + returns complaint/leave/fee status via quick-reply buttons
- [ ] RBAC works: each role sees only their screens and actions
- [ ] Dashboard shows KPIs + health indicators (cron status + scan failures + present count)
- [ ] Data readiness: students imported, rooms mapped, FAQs seeded, categories configured

#### Gate 2: Pilot Success (Month 1)

| Metric | Target |
|--------|--------|
| Leaves processed in-app | ≥ 70% |
| Complaints logged in-app | ≥ 60% |
| Scan success rate | ≥ 95% |
| Cron success rate | ≥ 99% of scheduled runs recorded as SUCCESS in CronLog |

If both gates pass, proceed to Phase 2 development.

---

### Future Vision

#### Phase 2: Strengthen Operations (Months 2-4)

Focus on hardening the system for daily reliability and expanding operational capability:

- Offline-first gate verification (service worker + local validation cache)
- WhatsApp/SMS notification integration for critical alerts
- Chatbot guided flows (apply leave wizard, register complaint wizard)
- Photo before/after on maintenance resolution
- Bulk room assignment and advanced admin operations
- Detailed reports (SLA breach trends, complaint category analysis, occupancy history)

#### Phase 3: Scale & Expand (6-12 Months)

Focus on multi-hostel readiness and institutional value:

- Multi-hostel / multi-campus support (tenant isolation, cross-hostel admin views)
- Superintendent / chief warden analytics dashboards (aggregate SLA, occupancy trends, escalation patterns)
- Parent portal (read-only view of child's complaint/leave status — reduces phone escalations)
- IT admin panel (deployment health, user provisioning, backup management)
- Smart complaint auto-categorization (LLM one-shot during creation)
- Duplicate complaint detection

#### Long-Term Vision (2-3 Years)

SmartHostel starts as a single-hostel operational tool, but the architecture supports evolution into a campus-wide hostel operations platform — where every hostel on campus runs on verified access, timed workflows, and self-service information, with institutional leadership having aggregate visibility across all hostels. The immediate priority is making one hostel work really well first.

---

## Non-Functional Requirements (MVP)

| Category | Requirement | Target |
|----------|------------|--------|
| **Performance** | Guard scan-to-result time | ≤ 2s (p95 ≤ 4s on low-end devices) |
| **Performance** | Complaint/leave creation response time | ≤ 1s |
| **Performance** | Dashboard load time | ≤ 3s |
| **Reliability** | Cron job success rate | ≥ 99% (tracked via CronLog) |
| **Reliability** | API uptime during pilot | ≥ 99% (acceptable: planned maintenance windows) |
| **Security** | JWT token expiry | Configurable; default 24h for auth, leave-window-bound for QR |
| **Security** | PassCode rate limiting | 5 attempts/min/guard; lockout after N failures for 10 minutes |
| **Security** | Audit trails | Non-optional; every mutation logs actor + timestamp |
| **Security** | QR anti-replay | Signed JWT with UUID `qrTokenId` + `outLoggedAt`/`inLoggedAt` direction checks |
| **Availability** | Platform | Mobile web (responsive); no native app required |
| **Availability** | Graceful degradation | Manual passCode fallback if camera/network fails; offline-first is Phase 2 |
| **Data Integrity** | Gate logging | Every scan attempt logged (valid and denied) |
| **Data Integrity** | Mongoose schemas | Strict mode with indexes on key query fields |
| **Scalability** | MVP scale | ~300 students, ~120 rooms, ~1000 scans/day peak |

---

## Assumptions & Constraints

### Assumptions

- Hostel mandates usage; leave approvals are only valid through SmartHostel (no parallel WhatsApp approvals)
- Students, guards, and maintenance staff have access to a smartphone with a web browser
- Internet connectivity is available at the gate most of the time (passCode fallback covers gaps)
- The warden or admin seeds the system before pilot launch (students, rooms, FAQs, categories)
- A single hostel deployment is the MVP target; multi-hostel is Phase 3

### Constraints

- **Timeline:** 3-4 week MVP build
- **Stack:** MERN (MongoDB, Express, React, Node.js) + Tailwind CSS (locked)
- **No payment gateway** in MVP; fee module is read-only
- **In-app notifications only** (WhatsApp/SMS integration is Phase 2)
- **No offline-first QR validation** in MVP; manual passCode is the connectivity fallback
- **Chatbot scope locked:** FAQ + 3 status queries only; no guided flows, no RAG, no personal data guessing
- **LLM usage optional:** rephrasing only, never for correctness
- **No face recognition** (privacy + complexity)

---

## Core Workflows (Happy Path + Edge Cases)

### Workflow 1: Leave → QR → Gate Scan

**Happy Path:**
1. Student creates leave request (type: DAY_OUTING or OVERNIGHT, date range, reason)
2. Warden approves → system generates signed JWT QR + random passCode → student sees QR pass inline
3. Student arrives at gate → guard scans QR → system validates (JWT signature + expiry + `qrTokenId` lookup + direction check)
4. Result: GREEN (VALID) → `outLoggedAt` set on LeaveRequest → GateLog created (direction: OUT)
5. Student returns → guard scans again → `inLoggedAt` set → GateLog created (direction: IN) → leave status becomes COMPLETED

**Edge Cases:**
- **Expired pass:** QR JWT `exp` has passed → RED (EXPIRED) → GateLog logged with `reasonDenied: EXPIRED`
- **Cancelled leave:** Student cancelled after approval but before OUT scan (`outLoggedAt` is null) → RED (CANCELLED) → logged
- **Already completed:** Both `outLoggedAt` and `inLoggedAt` set → RED (DENIED, already completed) → logged
- **Manual passCode:** Camera/network fails → guard enters passCode manually → same validation logic; rate-limited (5/min/guard), locked after N failures for 10 min
- **Emergency override:** No valid pass but emergency → guard records override with reason + actor → logged, reviewed daily by warden
- **Replay attack:** Same QR scanned twice for OUT → atomic `findOneAndUpdate` with condition `outLoggedAt: null` prevents race conditions
- **Student cancels after OUT:** Not allowed; cancel only permitted when `outLoggedAt` is null

### Workflow 2: Complaint → SLA → Escalation

**Happy Path:**
1. Student creates complaint (category → auto-sets priority + `dueAt` from `categoryDefaults.json`)
2. Warden views complaint list → assigns to maintenance staff (sets `assignedTo`, `assignedBy`, `assignedAt`)
3. Maintenance staff accepts (status: IN_PROGRESS, sets `acceptedAt`, `statusChangedBy`)
4. Staff resolves (status: RESOLVED, sets `resolvedAt`, `resolvedNotes`, `statusChangedBy`)
5. Student auto-notified on each status change

**Edge Cases:**
- **SLA warning (step 1):** Cron detects `dueAt` approaching → sends reminder notification to assigned staff → sets `reminderSentAt`
- **SLA breach (step 2):** Cron detects `dueAt` passed → bumps priority → notifies warden → sets `escalatedAt`, `escalationLevel` → logged in CronLog
- **Reassignment:** Warden reassigns to different staff → `dueAt` is NOT reset (preserves original SLA commitment); warden can explicitly extend `dueAt` if justified
- **Staff accepts but doesn't act:** Cron continues checking `dueAt` regardless of status (until RESOLVED); escalation still fires
- **Warden priority override:** Warden can override auto-priority at any status; audit trail records the change
- **Unassigned complaint near breach:** Cron reminder goes to warden (no assigned staff to notify)

### Workflow 3: Self-Service Assistant

**Happy Path:**
1. Student opens chat widget → sees quick-reply buttons: "Complaint Status" / "Leave Status" / "Fee Due" / "Ask a Question"
2. Student taps status button → authenticated API call → template response with current status + next-action suggestion
3. Student types free-text question → Fuse.js fuzzy match over FAQ entries → returns best match answer

**Edge Cases:**
- **No FAQ match:** Fuse.js score below threshold → "I couldn't find that — try rephrasing or contact your warden"
- **Status query fails (API down):** Template fallback: "I'm having trouble checking your status right now. Please try again in a moment."
- **User asks to DO something (apply leave, file complaint):** Respond with link/navigation hint: "You can apply for leave from the 'My Leaves' page" (guided flows are Phase 2)
- **Unauthenticated user:** Status buttons hidden; only FAQ available on login page (if applicable)
- **Multiple active complaints/leaves:** Return most recent + count: "You have 3 complaints. Your latest (Plumbing, Room 204) is IN_PROGRESS, assigned to Ravi."

---

## Data Dictionary (Key Fields)

### Complaint

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | ref User | Complaint owner |
| `category` | String | Maps to `categoryDefaults.json` for auto-priority + SLA |
| `description` | String | Complaint details |
| `photoUrl` | String (optional) | Single photo at creation |
| `priority` | Enum: HIGH, MEDIUM, LOW | Auto-set from category; warden can override |
| `status` | Enum: OPEN, ASSIGNED, IN_PROGRESS, RESOLVED | State machine |
| `assignedTo` | ref User | Maintenance staff |
| `assignedBy` | ref User | Warden who assigned |
| `assignedAt` | Date | When assignment happened |
| `acceptedAt` | Date | When staff accepted |
| `dueAt` | Date | Computed from category SLA config at creation |
| `reminderSentAt` | Date | When cron sent warning |
| `escalatedAt` | Date | When cron escalated |
| `escalationLevel` | Number | Escalation depth |
| `resolvedAt` | Date | When resolved |
| `resolvedNotes` | String | Staff resolution notes |
| `statusChangedBy` | ref User | Actor of last status change |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

### LeaveRequest

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | ref User | Leave requester |
| `leaveType` | Enum: DAY_OUTING, OVERNIGHT | Pass type |
| `fromDate` | Date | Leave start (UTC) |
| `toDate` | Date | Leave end (UTC) |
| `reason` | String | Reason text |
| `reasonTemplate` | String | Selected template |
| `status` | Enum: PENDING, APPROVED, REJECTED, CANCELLED | State machine |
| `approvedBy` | ref User | Warden who approved |
| `approvedAt` | Date | When approved |
| `passCode` | String (unique) | Random 6-8 digit manual fallback |
| `qrTokenId` | UUID | Unique token in JWT payload |
| `outLoggedAt` | Date | When student exited |
| `inLoggedAt` | Date | When student returned |
| `createdAt` | Date | Auto |

### GateLog

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | ref User | Scanned student |
| `leaveRequestId` | ref LeaveRequest | Associated leave |
| `direction` | Enum: OUT, IN | Scan direction |
| `method` | Enum: QR, MANUAL | Validation method |
| `guardId` | ref User | Scanning guard |
| `result` | Enum: VALID, EXPIRED, CANCELLED, INVALID, NO_PASS | Scan outcome |
| `reasonDenied` | String | Why denied (if applicable) |
| `scanDurationMs` | Number (optional) | Frontend-computed scan time |
| `scannedAt` | Date | Scan timestamp |

### Notification

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | ref User | Recipient |
| `title` | String | Notification title |
| `body` | String | Notification body |
| `type` | Enum: COMPLAINT_UPDATE, LEAVE_UPDATE, NOTICE, SLA_ALERT | Routing + filtering |
| `isRead` | Boolean | Read status |
| `linkTo` | String | Deep link to relevant page |
| `createdAt` | Date | Auto |

### CronLog

| Field | Type | Purpose |
|-------|------|---------|
| `jobName` | String | Cron job identifier |
| `ranAt` | Date | Execution timestamp |
| `status` | Enum: SUCCESS, FAIL | Run outcome |
| `complaintsReminded` | Number | Count of reminders sent |
| `complaintsEscalated` | Number | Count of escalations |
| `errors` | [String] | Error messages if any |

---

## API Surface (MVP Endpoints)

### Auth
- `POST /api/auth/login` — Returns JWT + role
- `GET /api/auth/me` — Current user profile
- `POST /api/auth/reset-password` — Password reset

### Students & Rooms
- `POST /api/students/import-csv` — Bulk student import (warden)
- `GET /api/students` — Student list with room info (warden)
- `GET /api/rooms` — Room list with occupancy (warden)
- `POST /api/rooms/:id/assign` — Assign student to room (warden)
- `POST /api/rooms/:id/unassign` — Remove student from room (warden)

### Complaints
- `POST /api/complaints` — Create (student; auto-sets priority + dueAt)
- `GET /api/complaints` — List (filtered by role: own/assigned/all)
- `GET /api/complaints/:id` — Detail with timeline + audit trail
- `PATCH /api/complaints/:id/assign` — Assign to staff (warden)
- `PATCH /api/complaints/:id/status` — Update status (maintenance)
- `PATCH /api/complaints/:id/priority` — Override priority (warden)

### Leave & QR
- `POST /api/leaves` — Create leave request (student)
- `GET /api/leaves` — List (own/pending/all by role)
- `PATCH /api/leaves/:id/approve` — Approve + generate QR (warden)
- `PATCH /api/leaves/:id/reject` — Reject (warden)
- `PATCH /api/leaves/:id/cancel` — Cancel (student; only if outLoggedAt is null)
- `POST /api/gate/validate` — Validate QR/passCode (guard); atomic findOneAndUpdate
- `GET /api/gate/logs` — Gate log history (warden)

### Notices
- `POST /api/notices` — Create + broadcast (warden)
- `GET /api/notices` — List (filtered by student's block/floor or all)

### Fees
- `GET /api/fees/me` — Own fee status (student)
- `GET /api/fees` — All fee records (warden)
- `PATCH /api/fees/:id` — Update fee status (warden)

### Assistant
- `GET /api/assistant/status/complaints` — My latest complaint status (student)
- `GET /api/assistant/status/leaves` — My latest leave status (student)
- `GET /api/assistant/status/fees` — My fee summary (student)
- `GET /api/assistant/faq?q=` — Fuse.js fuzzy search over FAQ entries

### Notifications
- `GET /api/notifications` — Unread + recent (own)
- `PATCH /api/notifications/:id/read` — Mark as read

### Admin
- `GET /api/admin/dashboard` — KPI counts + system health
- `GET /api/admin/hostel/present-count` — Students currently in hostel

---

## Acceptance Criteria (MVP Gate)

### QR Gate Pass
- [ ] Approved leave generates a signed JWT QR + random passCode
- [ ] Guard scan returns green/red full-screen result in ≤ 2 seconds
- [ ] Every scan attempt (valid/denied) creates a GateLog entry
- [ ] Expired, cancelled, and completed passes are denied with correct `reasonDenied`
- [ ] Manual passCode validation works and is rate-limited (5/min/guard, lockout after N failures)
- [ ] Emergency override logs reason + actor
- [ ] `outLoggedAt`/`inLoggedAt` direction logic prevents duplicate exits/entries
- [ ] Present count endpoint returns correct count based on latest gate status per student

### Complaint SLA
- [ ] Complaint creation auto-sets priority + `dueAt` from category config
- [ ] SLA countdown badge visible on complaint list and detail views
- [ ] Cron job runs every 10 minutes and writes CronLog (SUCCESS/FAIL) each run
- [ ] Reminder sent to assigned staff when `dueAt` warning threshold reached
- [ ] Escalation bumps priority + notifies warden when `dueAt` breached
- [ ] Reassignment does NOT reset `dueAt` unless warden explicitly extends
- [ ] Maintenance staff can accept, progress, and resolve with notes
- [ ] Student receives notification on every status change

### Self-Service Assistant
- [ ] Quick-reply buttons return real status for complaint/leave/fee via authenticated API
- [ ] FAQ fuzzy search returns relevant answer or graceful "not found" message
- [ ] Status query failure returns template fallback (not an error page)
- [ ] Assistant does not guess personal data; all status from backend API calls only

### RBAC & Security
- [ ] Each role sees only their screens and actions
- [ ] Secondary approver can approve/reject leaves but cannot access room management or complaint assignment
- [ ] Only Warden/Admin can configure secondary approvers
- [ ] JWT auth required on all protected endpoints
- [ ] PassCode protected with rate-limiting and expiry

### Dashboard & Health
- [ ] Warden dashboard shows: pending leaves, near-breach complaints, SLA breached count, present count
- [ ] System health shows: last cron run (time + status), scan failures today, overrides today
- [ ] Adoption metrics: leaves processed in-app %, complaints created in-app %

---

## Risk Register (Top 5)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Warden bottleneck** — single approver overwhelmed, leaves pile up, students revert to WhatsApp | HIGH | HIGH | Leave delegation (secondary approver) built into MVP; exception-focused dashboard reduces cognitive load |
| 2 | **Cold-start failure** — system launches with empty/incomplete data, dashboards look broken, users lose trust | HIGH | HIGH | Student CSV import + room mapping in MVP; data readiness checklist must be green before pilot; seed script for demo |
| 3 | **Guard scanner too slow for rush hour** — scanning creates longer queue than paper register, guard abandons app | MEDIUM | HIGH | Auto-scan mode, instant green/red, auto-return, lightweight page; manual passCode fallback; target ≤ 2s scan-to-result |
| 4 | **Complaint flood / SLA fatigue** — digital access triples complaint volume, every complaint gets SLA, warden mutes notifications | MEDIUM | MEDIUM | Category-driven priority with differentiated SLA windows (HIGH = short, cosmetic = long); notification routing sends reminders only to responsible actor; escalation only to warden |
| 5 | **PassCode brute-force / sharing** — manual passCode introduces attack surface for guessing or social engineering | MEDIUM | MEDIUM | Rate-limiting (5 attempts/min/guard), lockout after N failures for 10 min, passCode expires with leave window, all attempts logged |
