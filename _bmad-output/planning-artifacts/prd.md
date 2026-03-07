---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
classification:
  projectType: Web Application (full-stack SPA)
  domain: EdTech / Hostel Operations
  complexity: Medium
  projectContext: Greenfield
  sensitivity: Moderate
  sensitivityNotes: Handles student identity + movement/access logs; not FERPA/COPPA regulated but high privacy/security expectations
  complianceLite:
    - Consent notice for data collection
    - Data retention policy
    - Role-based visibility enforcement
    - Audit trails (gate logs + complaint escalations)
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-Agent-2026-03-01.md
  - _bmad-output/brainstorming/brainstorming-session-2026-03-01-1500.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
date: 2026-03-02
author: sayuj
---

# Product Requirements Document - SmartHostel

**Author:** sayuj
**Date:** 2026-03-02

## Executive Summary

SmartHostel is a full-stack hostel management platform (MERN + Tailwind, 4 roles) that replaces informal, trust-based processes — WhatsApp approvals, paper registers, verbal follow-ups — with verifiable, time-bound, self-service workflows. Built for mid-sized college hostels (~300 residents), it reduces disputes, enforces accountability, and makes operations provable.

Today, hostels run on informal coordination that breaks at scale: students can't see whether complaints are being handled, guards can't distinguish a valid leave pass from a forwarded screenshot, and wardens have no evidence trail when parents or management ask what happened. This creates a triangular trust gap (Student ↔ Staff ↔ Parents/Management) where disputes become unresolvable and accountability stays verbal.

SmartHostel closes that gap with three integrated pillars:

- **Cryptographic Gate Passes** — Leave approvals generate signed, time-bound QR codes (JWT + UUID + expiry). Guards scan for instant green/red verification. Passes expire, can't be replayed, and every scan attempt is audit-logged. Online verification by default with a controlled fallback for outages (manual passCode + rate limiting + audit log).
- **SLA-Driven Complaint Automation** — Complaints auto-compute `dueAt` from category-based thresholds. A 10-minute cron cycle handles reminders and two-step escalation (assignee reminder → warden/admin escalation + priority bump). Every status change, assignment, and override is attributed and timestamped.
- **Self-Service Chat Assistant** — Quick-reply buttons for authenticated status queries (complaint/leave/fee) + Fuse.js fuzzy FAQ over hostel rules. LLM-free for correctness and predictability; fast, reliable answers that deflect repetitive queries from staff.

**Expected impact (6-month view):** lower dispute/override rate, higher SLA compliance rate, reduced average complaint resolution time, fewer repeat follow-ups, and measurable chat deflection rate.

**MVP scope:** ~14 must-have features across ~16 pages and ~11 core collections, supporting ~300 students / ~120 rooms and 4 roles (Student, Warden/Admin, Guard, Maintenance Staff) — buildable in 3–4 weeks.

### What Makes This Special

Beyond the three pillars, SmartHostel adds an "anti-chaos" layer that makes accountability the default: time-bounded approvals, role-locked actions, and audit trails for every gate scan, complaint action, escalation, and override. It also handles real exceptions — emergency overrides (reason required), late return workflows, and SLA breach chains — where typical hostel systems fail. Designed to demo cleanly: QR verification, SLA timeline, and assistant shortcuts each showcase a distinct architectural layer.

## Project Classification

- **Project Type:** Web Application (full-stack SPA — MERN + Tailwind)
- **Domain:** EdTech / Hostel Operations
- **Complexity:** Medium — RBAC, signed QR security, cron-based SLA automation, assistant tool-calls
- **Project Context:** Greenfield
- **Sensitivity:** Moderate — student identity + movement/access logs; compliance-lite guardrails (consent notice, retention, role-based visibility, audit trails)

## Assumptions & Non-Goals (MVP)

**Assumptions:** single hostel deployment; ~300 students; ~10–20 staff; guard devices Android 10+ with camera; students have smartphones; gate connectivity may be unreliable; fee status is read-only/seeded.

**Non-goals (MVP):** payment gateway/receipts; parent notifications/OTP; multi-hostel/multi-campus; real-time websockets; bulk import; RFID/IoT integrations; offline-first full PWA.

**Scope Updates (Post-initial-MVP additions):** Public student registration (self-service signup); Room model with type classification (AC/Non-AC, Deluxe/Normal, Boys/Girls hostel); public room browsing with live bed availability; conversational chatbot UI (FAQ-powered); enhanced admin panel with room and user management UI; modern gradient backgrounds on auth pages.

## Success Criteria

**Metric Definitions:**
- *Touched* = any staff action after creation (assign / status change / comment / priority change)
- *Acknowledged* = first staff update after assignment (status change or note)

**North Star Metrics:** QR verified exits % and SLA compliance %

### User Success

Success is defined per role by the moment users stop falling back to informal processes.

**Student**
- *Aha:* First leave approval → QR generated → gate scan succeeds without any WhatsApp/screenshot debate. First complaint status check without visiting the warden. First update notification that feels "tracked."
- Median time to create a leave request: ≤ 60–90s
- % students using status check at least once/week: ≥ 40–60%
- "Where is my complaint?" queries drop (proxy: status-asking comments): ↓ 30–50%

**Warden / Admin**
- *Aha:* First SLA breach prevented by automatic escalation. First parent inquiry answered by pulling an audit trail (who approved, when scanned, overrides).
- % complaints touched before SLA breach: ≥ 85%
- % escalations actioned within 24h: ≥ 70–80%
- Manual follow-ups by warden (proxy: reassignments / "ping" events): ↓ 25–40%

**Guard**
- *Aha:* First "3-second scan" replaces register entry or argument. First invalid/expired pass shows clear red reason and ends debate.
- Server verify: p95 ≤ 500ms
- Scan-to-decision (end-to-end): p95 ≤ 3s
- Override rate: ≤ 1–3% of exits (always reason-logged)
- Denied pass disputes (proxy: denied+override incidents): ↓ 50% vs week 1 baseline

**Maintenance Staff**
- *Aha:* First day working purely from an assigned queue with priorities. First resolution closed with proof (notes) that's visible to the student.
- % complaints acknowledged within SLA early window: ≥ 80–90%
- Median time from assign → first update: ≤ 2–4 hrs
- Reopen rate: ≤ 5–10%

### Business Success

Measured at 3-month mark against a **week 1 baseline** (first week post-launch = measurement week; improvements reported relative to it — avoids guessing "before" numbers from WhatsApp/paper).

**Adoption Targets (~300 students, one hostel)**
- Leave requests via SmartHostel: Week 2 ≥ 50% → Week 6 ≥ 80% → Month 3 ≥ 90%
- Complaints logged via SmartHostel: Month 3 ≥ 80–90%
- Guard scanning usage: Month 1 ≥ 95% of exits/entries (exceptions logged)

**Operational Improvement Targets**
- Gate disputes (denied+override incidents): ↓ 40–70% from week 1 baseline
- SLA compliance: ≥ 85–90% resolved before breach
- Average complaint resolution time: ↓ 20–40% (relative improvement)
- Repeat follow-ups (comments/status pings): ↓ 30–50%
- Chat deflection rate: ≥ 30–50% of repetitive queries handled by FAQ/status shortcuts (denominator: "General Query" tickets created + FAQ bypass clicks)

**Portfolio Success (secondary, designed-in)**
- Clean demo with realistic data + logs: QR validation + audit log, SLA escalation timeline, assistant shortcuts → API status response

### Technical Success

**Performance (mobile-first)**
- Guard scanner page load (cold): p95 ≤ 2s on average Android phone
- QR verify: p95 ≤ 500ms server-side, ≤ 2–3s scan-to-decision end-to-end
- API latency: p95 ≤ 300–500ms for key endpoints (pass verify, complaint status)

**Reliability**
- Cron SLA cycle: 0 missed cycles/week (heartbeat + alert)
- Data integrity: 0 orphan states (e.g., complaint "resolved" without resolver attribution)
- Uptime: ≥ 99% during active hours (or explicitly defined acceptable downtime windows)

**Security / Abuse Resistance**
- QR replay prevention: 0 successful replays in testing
- Token expiry enforcement: 100% expired passes rejected
- Anti-replay controls: expiry + jti/UUID + scan logging + optional one-time-use mode
- Rate limiting enforced on manual passCode + login endpoints
- Audit log immutability: append-only at app layer; edits require admin + are logged

**Observability**
- Dashboards/alerts for: cron heartbeat missing, override/denial spikes, SLA breach threshold crossings, auth failure spikes
- Error budget: <1% failed verifies/day (excluding genuine invalid passes)

### Measurable Outcomes

All metrics measured relative to **week 1 baseline**. Primary dashboard tracks:

| Metric | Target | Proxy / Source |
|--------|--------|----------------|
| Gate dispute rate | ↓ 40–70% | Denied + override incidents |
| SLA compliance | ≥ 85–90% | Complaints resolved before `dueAt` |
| Avg resolution time | ↓ 20–40% | Complaint `createdAt` → `resolvedAt` |
| Repeat follow-ups | ↓ 30–50% | Status-asking comments per complaint |
| Chat deflection | ≥ 30–50% | FAQ/status interactions vs. General Query tickets + FAQ bypass clicks |
| Scanning adoption | ≥ 95% | Gate logs / total exits |
| App adoption (leave) | ≥ 90% at M3 | App leave requests / total leaves |

### Event Instrumentation Spec (Lean)

System must emit structured events for: PASS_REQUESTED, PASS_APPROVED/REJECTED, PASS_CANCELLED, PASS_VERIFIED (result/reason/method/latency), PASS_SCANNED_OUT, PASS_SCANNED_IN, PASS_OVERRIDE_GRANTED (reason/note/notified), OFFLINE_LOG_CREATED, OFFLINE_LOG_RECONCILED (success/fail), COMPLAINT_CREATED, COMPLAINT_ASSIGNED, COMPLAINT_STATUS_CHANGED, SLA_REMINDER_SENT, SLA_ESCALATED, SLA_ACKNOWLEDGED, NOTICE_PUBLISHED, FAQ_USED, STATUS_SHORTCUT_USED, FAQ_BYPASS_CLICKED, AUTH_FAILED.

Each event includes: timestamp, actorRole, actorId, subjectId (leave/complaint), correlationId.

## Product Scope

### MVP — Minimum Viable Product

~20 features across 8 epics:

1. JWT auth + RBAC (Student, Warden/Admin, Guard, Maintenance)
2. Public student self-registration (email signup, auto-assigned STUDENT role)
3. Student dashboard (room, notices, fee status, quick actions)
4. Complaint creation (category + description + optional photo)
5. Complaint status timeline (Open → Assigned → In Progress → Resolved)
6. Complaint assignment to staff with priority + due-time
7. SLA automation: reminders + two-step escalation (node-cron)
8. Maintenance staff view: assigned complaints, update status + notes
9. Leave request with calendar + reason templates
10. Leave approve/reject + signed QR pass generation
11. Guard scanner: QR scan → Valid/Expired/Cancelled + student info
12. Auto entry/exit logging + anti-replay controls (expiry + jti/UUID + scan logging + optional one-time-use mode)
13. Warden dashboard KPIs + notice broadcast (all/block/floor)
14. Chat assistant: FAQ search + conversational chatbot UI + status shortcuts
15. Audit trail fields + system health indicators (cron status, scan failures)
16. Room model with Boys/Girls hostel, AC/Non-AC, Deluxe/Normal classification
17. Public room browsing page with filters, photos, and live bed availability
18. Room fee display per semester
19. Admin room management (CRUD + occupancy tracking)
20. Admin user management (list, create, disable users)

### Growth Features (Post-MVP)

Prioritized by effort-to-value ratio:

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | QR pass visual card with countdown timer | S |
| 2 | "Hostel Pulse" health widget on admin dashboard | S |
| 3 | Escalation chain visibility to student | S-M |
| 4 | Photo before/after on complaint resolution | M |
| 5 | In-app notification center page | M |
| 6 | Duplicate complaint detection | M |
| 7 | Smart complaint auto-categorization (LLM one-shot; human-confirmed category before SLA clocks start) | M-L |
| 8 | Bulk CSV import for students + rooms | M-L |

### Vision (Future)

Phase 2+ features (post-validation, post-adoption):

- IoT sensors (water/electricity monitoring)
- RFID/smart locks integration
- Parent OTP notifications
- Mess forecasting / advanced analytics
- Chatbot guided flows (leave wizard, complaint wizard) + RAG
- Email/push notifications (beyond in-app)
- Fee receipt download / payment gateway
- Detailed reports beyond dashboard counts
- Multi-hostel support

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — the minimum that makes hostel operations provably better than WhatsApp+paper via verification + accountability + self-serve.

It's not a platform MVP (multi-hostel, imports, integrations) and not an experience MVP (pixel-perfect polish). But it does include "operational polish" where it affects adoption: scanner speed, clear red/green reasons, minimal taps, and audit trails.

**Why these 14 features and not more:** each one maps to at least one of:
- **Trust closure** — QR verification + anti-replay + audit
- **Accountability closure** — SLA automation + escalation + attribution
- **Deflection closure** — status shortcuts + FAQ search

Anything that doesn't materially reduce disputes/follow-ups or strengthen auditability is post-MVP.

**Scope strategy (one-liner):** "Ship trust + accountability first (scanner + SLA), then deflection (assistant) only if time remains."

### Resource Requirements

**Assume solo build (1 dev)** with light help for testing (friend/classmate) — safest planning assumption for scope/risk.

**Skills required (MVP):**
- MERN (React, Node/Express, MongoDB), JWT auth + RBAC
- Mobile web camera scanning (getUserMedia + QR decode lib)
- Cron/worker reliability (node-cron + heartbeat logging)
- UX for low-end Android (scanner + simple flows)
- Basic observability (CronLog, error counters, health widget)

**If 2-person team:** second person focuses on UI + testing on real devices + data seeding + QA scripts (highest leverage split).

### MVP-Critical vs Nice-to-Have Journeys

**MVP-critical** (drives core requirements + prevents failure):
| Journey | Why Critical |
|---------|-------------|
| J1 — QR Gate Exit (happy path) | Core trust closure — proves "better than WhatsApp" |
| J3 — Expired/Cancelled/Already-used pass denial | Anti-abuse + audit; without it, QR is just a fancy screenshot |
| J4 — Emergency override governance | Real-world exceptions; without it, guards bypass the system |
| J5 — Cancel before/after OUT rules | State integrity; prevents orphan passes |
| J6 — SLA breach + escalation chain | Core accountability closure; proves complaints don't die silently |
| J7 — Network-down scan fallback | Operational resilience; gate must work even when Wi-Fi doesn't |
| J9 — First-time login + role landing | Adoption gate; users must land somewhere useful on day 1 |

**MVP-nice-to-have** (value-add, but not required to prove "better than WhatsApp"):
| Journey | Fallback if Cut |
|---------|----------------|
| J2 — Complaint status via chat | Dashboard shortcuts or status tiles on student dashboard |
| J8 — System health check | Minimal widget exists; deep ops journey deferred |

### Build Order (De-Risks Fastest)

1. **Auth + RBAC + seed users** — foundation; unblocks everything
2. **Leave → approve → QR → scanner + passCode fallback + logs** — trust closure (highest operational risk; spike early)
3. **Complaints → assignment → SLA cron + escalation + dashboard KPIs** — accountability closure
4. **Assistant shortcuts + FAQ search** — deflection closure (last; build only if time remains)

### Risk Mitigation Strategy

**Risk #1: Guard QR scanning on low-end Android** (highest operational risk)

Why it can fail: camera permission quirks, poor lighting, slow decode, network timeouts.

- *Mitigation:* Build scanner route in Week 1 as a spike. Test on one low-end Android (real device) + bad network simulation. Ensure fast UX: big targets, instant feedback, retry, clear reasons.
- *Fallback:* Manual passCode flow with rate limiting + audit log. "Unable to verify" state that never silently approves.

**Risk #2: Cron/SLA automation reliability** (highest "silent failure" risk)

- *Mitigation:* Heartbeat + CronLog from day 1. Health widget shows last run + success/fail + counts.
- *Fallback:* If cron fails: dashboard flags "SLA automation unhealthy" and manual escalation still possible (warden reassign/priority bump).

**Risk #3: Chat assistant scope creep** (time-risk, not core)

- *Mitigation:* Build as shortcuts first (Complaint/Leave/Fee status buttons) + simple FAQ search. Keep it LLM-free in MVP.
- *Fallback:* Replace assistant with FAQ page + status tiles on student dashboard (same value, fewer moving parts).

## User Journeys

### Pass Lifecycle States (Canonical Reference)

**Standard flow:** `PENDING → APPROVED → SCANNED_OUT → SCANNED_IN → COMPLETED`

**Exceptional states:** `CANCELLED` (by student, pre-exit only) · `EXPIRED` (time-bound, auto) · `REVOKED` (by warden, any state) · `CORRECTED` (warden-only, post-exit adjustment with reason)

**Rules:**
- `PENDING → APPROVED`: Warden only; generates QR pass + passCode
- `PENDING → REJECTED`: Warden only
- `APPROVED → CANCELLED`: Student only; allowed only if `outLoggedAt` is null
- `APPROVED → SCANNED_OUT`: Guard scan (QR or passCode); sets `outLoggedAt`
- `SCANNED_OUT → SCANNED_IN`: Guard scan on return; sets `inLoggedAt`
- `SCANNED_IN → COMPLETED`: Automatic on successful IN scan
- One-time-use enforcement: once `SCANNED_OUT`, further OUT scans return `ALREADY_SCANNED_OUT`
- Gate scans only allowed when status = `APPROVED` or `SCANNED_OUT`
- Guard can override both Exit and Entry, but cannot approve future leaves. All overrides trigger warden notification + dashboard flag.

---

### Journey 1: Rahul's First QR Gate Exit (Student — Happy Path)

**Persona:** Rahul Sharma, 2nd-year student, Block-A Floor-2. Used to send WhatsApp messages to the warden for leave, then show screenshots to the guard. Half the time the guard argues the screenshot could be old.

**Opening Scene:** Rahul needs to go home for the weekend. He opens SmartHostel on his phone, taps "Request Leave," picks OVERNIGHT, selects dates from the calendar, picks "Family Visit" from reason templates, and submits. Under 60 seconds.

**Rising Action:** Dr. Priya (warden) sees the request in her pending queue, taps Approve. The system generates a signed QR pass — JWT with UUID token, expiry bound to the leave window. Rahul gets a notification: "Leave approved. Your QR pass is ready." He opens My Leaves, sees the QR code + passCode + leave window + status badge.

**Climax:** Rahul walks to the gate. Suresh (guard) taps "Scan QR" on his phone. Camera reads the code. Full-screen **GREEN** — "VALID — Rahul Sharma — Overnight — Return by Sun 8:00 PM." Suresh nods. Rahul walks out. 3 seconds. No argument, no register, no screenshot debate.

**Resolution:** The system logs OUT with timestamp, guard ID, and method (QR). Rahul's pass now shows "Out since Sat 10:15 AM." When he returns Sunday evening, Suresh scans again — GREEN for IN. Both scans logged. Pass status: COMPLETED. The warden's dashboard shows one more verified exit/entry pair.

**Requirements revealed:** Leave request flow, QR generation on approval, guard scanner with full-screen result, automatic OUT/IN logging, pass lifecycle states, notification on approval.

---

### Journey 2: Rahul Checks Complaint Status via Chat (Student — Self-Service)

**Opening Scene:** Rahul reported a broken ceiling fan 2 days ago. Normally he'd walk to the warden's office and ask "any update?" — the third time this week. Instead, he opens the chatbot widget.

**Rising Action:** Quick-reply buttons appear: "Complaint Status" / "Leave Status" / "Fee Due" / "Ask a Question." He taps "Complaint Status." The system calls the authenticated API — no LLM, just a direct backend query.

**Climax:** Response: "Your complaint #247 (Electrical — Ceiling fan not working) is **In Progress**. Assigned to Ravi Patel. Last update: 6 hours ago. SLA due in 18 hours." Next-action suggestion: "Need to add details? → Go to complaint."

**Resolution:** Rahul knows exactly where things stand without leaving his room. The warden's inbox has one fewer "any update?" message. If Rahul asks "what time is curfew?" — Fuse.js fuzzy FAQ returns the answer instantly.

**Requirements revealed:** Chatbot quick-reply buttons, authenticated status API, template responses with SLA countdown, FAQ fuzzy search, next-action suggestions.

---

### Journey 3: Expired Pass at the Gate (Edge Case — Late Return + Denial)

**Opening Scene:** Ankit had a DAY_OUTING pass that expired at 6:00 PM. It's now 8:30 PM. He's returning late and approaches the gate to enter.

**Rising Action:** Suresh scans Ankit's QR. The system verifies: JWT signature valid, but `exp` claim is past. Looks up `leaveRequestId` — confirms expiry.

**Climax:** Full-screen **RED** — "EXPIRED — Ankit Verma — Day Outing — Expired at 6:00 PM." Suresh sees Ankit's mini-profile + last action: "OUT at 2:15 PM." No ambiguity — the system decided, not the guard.

**Resolution:** Scan attempt logged: `guardId: Suresh, method: QR, result: EXPIRED, reasonDenied: "Token expired at 18:00", scannedAt: 20:30`. Suresh can either (a) deny entry and report to warden, or (b) trigger the override flow to allow entry with reason logged. The override triggers warden notification.

**Requirements revealed:** Reason codes (EXPIRED / CANCELLED / ALREADY_SCANNED_OUT / NOT_YET_VALID), scan attempt logging for all results (valid or denied), student mini-profile on scan result, clear UX for denial with reason text, override applies to both entry and exit.

---

### Journey 4: Emergency Override at the Gate (Edge Case — Abuse Control + Audit)

**Opening Scene:** Meera rushes to the gate — her mother called about a family emergency. She has no approved leave request and no QR pass.

**Rising Action:** Suresh sees she's distressed. He taps "Override" on the scanner page. The system requires: (1) select override reason from a list (Medical Emergency / Family Emergency / Staff Instruction / Other), (2) free-text note ("Student's mother hospitalized, verbal warden approval pending").

**Climax:** Override submitted. System logs: `guardId: Suresh, method: MANUAL_OVERRIDE, result: OVERRIDE_GRANTED, reason: "Family Emergency", note: "...", scannedAt: timestamp`. Meera exits. Dr. Priya (warden) receives an immediate notification: "Guard override at gate — Meera Joshi — Family Emergency — review required."

**Resolution:** The override is flagged on the warden's dashboard. Override rate stays visible as a metric (target: ≤ 1–3%). If overrides spike, the system surfaces it in the health widget. Every override has a name, reason, and timestamp — provable to parents and management. Guard can override exit and entry, but cannot approve future leaves.

**Requirements revealed:** Override flow (reason required + free-text note), override logging with full attribution, warden notification on override, override rate tracking on dashboard, role-locked (guard can override gate actions, not approve leaves).

---

### Journey 5: Student Cancels Leave — Before and After Scanning OUT

**5a: Cancel before OUT scan (allowed)**

Rahul's weekend plans change. His leave is APPROVED but he hasn't scanned out yet (`outLoggedAt: null`). He opens My Leaves → taps Cancel. System invalidates the QR token, sets status to CANCELLED. Log: `cancelledBy: Rahul, cancelledAt: timestamp`. If Suresh scans this QR later → RED: "CANCELLED."

**5b: Cancel after OUT scan (blocked)**

Rahul already scanned OUT (`outLoggedAt` set). He tries to cancel — system rejects: "Cannot cancel — you've already exited. Contact your warden for corrections." Only the warden can close/invalidate a post-exit pass with status CORRECTED and a reason (e.g., "Mistaken scan — student returned immediately"). Warden correction logged: `correctedBy: Dr. Priya, reason: "...", correctedAt: timestamp`.

**Requirements revealed:** Cancellation rules tied to `outLoggedAt` state, token invalidation on cancel, warden-only CORRECTED state for post-exit adjustments, correction audit trail, clear student-facing error messages with next-action guidance.

---

### Journey 6: SLA Breach — Warden Absent, Escalation Chain

**Opening Scene:** A plumbing complaint (HIGH priority, 24h SLA) was filed 22 hours ago. Assigned to Ravi, who accepted but hasn't resolved. Dr. Priya is on leave today.

**Rising Action:** Cron runs and detects `dueAt - now() ≤ 2h`. Step 1 (reminder): system notifies Ravi — "Complaint #312 SLA due in 2 hours. Update or resolve now." Ravi doesn't respond.

**Climax:** Next cron tick after `dueAt` passes (within 10 minutes of breach): Step 2 (escalation). System bumps priority to CRITICAL, sets `escalatedAt` + `escalationLevel: 1`. Notification goes to the escalation target — backup admin / head warden (configurable). Dashboard flags: "1 unacknowledged SLA breach" — stays flagged until someone acts.

**Resolution:** The backup admin sees the breach on their dashboard, reassigns to another staff member or contacts Ravi directly. The breach, escalation, and resolution are all timestamped and attributed. When Dr. Priya returns, the audit trail shows exactly what happened and who handled it.

**SLA timing rules (deterministic):**
- Reminder: `dueAt - 2h` (or next cron tick after that threshold)
- Escalation: next cron tick after `dueAt` passes (within 10 minutes of breach)
- Cron interval: every 10 minutes

**Requirements revealed:** Escalation target configuration (primary warden + backup), "unacknowledged breach" state that persists on dashboard, priority auto-bump on escalation, CronLog with escalation details, escalation level tracking, deterministic reminder/escalation timing.

---

### Journey 7: Network Down During Scan — Fallback Path

**Opening Scene:** The hostel Wi-Fi is spotty. Suresh tries to scan a QR code at the gate — the verify API call times out.

**Rising Action:** After timeout, the scanner page shows: "Unable to verify — Network issue." It automatically surfaces the manual fallback: "Enter passCode manually."

**Climax:** Suresh enters the passCode. The system retries the verify endpoint with the passCode. If still offline → "Verification unavailable. Log manual entry?" Suresh confirms, entering the passCode for deferred verification.

**Resolution:** System logs: `method: MANUAL, result: OFFLINE_LOGGED, guardId: Suresh, passCode: entered, scannedAt: timestamp`. When connectivity returns, deferred entries are reconciled against the passCode database. The health widget shows "X offline scans pending verification" until cleared. Rate limiting applies: 5 manual attempts per minute per guard. No roster caching needed — passCode-only logging + pending verification queue.

**Requirements revealed:** API timeout handling on scanner page, automatic fallback to passCode input, offline scan logging with deferred reconciliation via passCode, rate limiting on manual entry, health widget showing pending offline verifications.

---

### Journey 8: System Health Check (Warden/Admin — Ops)

**Opening Scene:** Dr. Priya notices that no complaint escalation emails came through overnight, even though she knows there are overdue complaints. Something feels off.

**Rising Action:** She opens her dashboard → scrolls to the System Health widget. It shows: Cron Status: **UNHEALTHY** — Last successful run: 14 hours ago. Error: "Connection timeout to database." Scan failures today: 3 (all "network timeout").

**Climax:** The health widget surfaces the issue clearly: cron hasn't run in 14 hours, meaning SLA reminders and escalations are stalled. She sees the last CronLog entry with the error message.

**Resolution:** For MVP, the action is: "Contact system administrator" or restart the service. The key is that the problem is *visible* — not silently failing. The widget provides: last run timestamp, run status (SUCCESS/FAIL), complaints reminded/escalated in last cycle, and error details.

**Requirements revealed:** CronLog collection with heartbeat tracking, health widget on admin dashboard (last run, status, error count), visual unhealthy/healthy indicator, scan failure counter, actionable status messages.

---

### Journey 9: First-Time Login + Role Landing (Onboarding — Minimal)

**Opening Scene:** Admin seeds student accounts via seed script (bulk CSV import is post-MVP). Each user gets email + temporary password.

**Rising Action:** Rahul logs in for the first time. JWT issued, role detected as STUDENT. He's redirected to the Student Dashboard. A small dismissible banner says: "Welcome to SmartHostel! Quick actions: Request Leave | Report an Issue | Ask the Assistant."

**Resolution:** Each role lands on their purpose-built dashboard: Student sees room info + notices + quick actions. Warden sees KPIs + pending items. Guard sees the scanner. Maintenance sees assigned complaints. No wizard, no tutorial — the UI should be self-explanatory. The banner disappears after first dismissal.

**Requirements revealed:** Role-based redirect on login, first-time welcome banner (dismissible), seed script for demo/test data, role-specific dashboard as landing page.

---

### Journey Requirements Summary

| Journey | Key Requirements Unlocked |
|---------|--------------------------|
| 1. QR Gate Exit (happy) | Leave flow, QR generation, scanner UX, OUT/IN logging, pass lifecycle |
| 2. Chat Status Check | Quick-reply buttons, authenticated status API, FAQ search, next-actions |
| 3. Expired Pass (late return) | Reason codes, denial logging, student mini-profile on scan, denial UX, entry override |
| 4. Emergency Override | Override flow (reason + note), override logging, warden notification, rate tracking |
| 5. Cancel Before/After OUT | Cancellation rules tied to scan state, token invalidation, warden-only CORRECTED state |
| 6. SLA Breach + Escalation | Escalation targets, unacknowledged breach state, priority auto-bump, deterministic timing |
| 7. Network-Down Scan | Timeout handling, passCode fallback, offline logging, deferred reconciliation, rate limiting |
| 8. System Health Check | CronLog heartbeat, health widget, failure counters, actionable status |
| 9. First-Time Onboarding | Role-based redirect, welcome banner, seed script, self-explanatory UI |

**Deferred to post-MVP:** Late return/curfew breach penalties, duplicate complaint detection, parent OTP notifications, multi-hostel support, full incident management playbooks.

## Domain-Specific Requirements (Hostel Operations)

### 1. Sensitive Movement Data (PII) + Minimization

Treat gate scan logs (entry/exit timestamps + identity) as sensitive personal data. Collect and store only what's needed for verification + accountability (purpose limitation). No location tracking beyond gate IN/OUT events.

### 2. Notice, Consent, and User Rights (Compliance-Lite, India-Ready)

- Show a privacy notice + purpose statement at first login (and accessible in settings)
- Record consent timestamp/version (or other lawful basis as policy decides)
- Support basic rights workflows: view own data, request correction, request deletion (handled by admin with audit log)

### 3. Role-Based Visibility (Hard Boundaries)

| Role | Can See | Cannot See |
|------|---------|------------|
| **Guard** | Student name/photo (optional), hostel/block, pass type/window, current pass state, last scan time, reason codes | Complaints, fee status, full room roster, complaint history |
| **Maintenance** | Assigned complaints only | Fee info, movement logs, unassigned complaints |
| **Warden/Admin** | Full operational view + audit trails | — |
| **Student** | Own data only (complaints, leaves, fees, notifications) | Other students' data, staff assignments, system health |

### 4. Retention & Deletion Policy (Explicit, Configurable)

Default retention (MVP):
- Gate scan logs: 90–180 days
- Complaint records: 1 year (or academic year)
- Security/audit logs: 1 year

Allow admin to configure retention windows. Support anonymized aggregates for long-term analytics after retention expiry.

### 5. Auditability That Protects Both Students and Staff

All sensitive actions are attributed + timestamped: approvals, scans, denials, overrides, cancellations, corrections, SLA escalations. Logs are append-only at app layer; any "edit" is a new event with reason. This protects wardens from false accusations and students from unaccountable decisions.

### 6. Override Governance (Abuse-Resistant)

Guard overrides require reason + note, auto-notify warden/admin, and are dashboard-visible (override rate + spike alerts). Overrides are never silent — every one is traceable. Warden can review and annotate overrides after the fact.

### 7. Mobile-First Operational Constraints (Gate Reality)

The gate is the highest-stakes touchpoint — scanner UX must work reliably on low-end Android in poor network/lighting conditions. Specific performance targets, fallback strategy, and responsive design details defined in Web Platform Requirements.

### 8. Time & Identity Integrity

- Use server time for all validations (avoid device clock tampering)
- Prevent replay via expiry + unique token ID (`jti`/UUID) + stateful scan rules (e.g., `ALREADY_SCANNED_OUT`)
- QR payload contains only IDs + expiry — sensitive data stays in the database

### 9. Accessibility Baseline (Practical)

Follow WCAG principles for key flows (scanner + dashboards): readable text sizes, status communicated via color + text labels (not color alone), keyboard/touch operability, clear error messages with next-action guidance.

### 10. Incident Readiness (Simple but Real)

Define in operational documentation:
- What counts as a "security incident" (e.g., mass override spike, QR signing key compromise, unauthorized data access)
- Who gets notified (admin escalation chain)
- Where logs live (CronLog, GateLog, audit fields)
- How to disable scanning/overrides if needed (emergency killswitch via env flag or admin action)

## Innovation (Application-Level, Not Tech Breakthrough)

SmartHostel's innovation is in how established techniques are combined to create a new system property for hostel operations: **provable, low-dispute workflows**. This is not WebAssembly-level innovation; it's practical innovation for a domain that still runs on WhatsApp and paper.

### 1. Cryptographic Trust in a Paper-Based Domain

Hostel gate approvals are typically "trust me" artifacts (screenshots, chats, verbal calls). SmartHostel replaces them with signed, time-bound QR passes that are:

- **Verifiable** — guard scans → deterministic green/red result
- **Non-replayable** — expiry + unique token ID + state rules
- **Governed** — emergency overrides allowed but reason-logged + notified

*Why it's innovative here:* it brings boarding-pass-grade verification to a low-connectivity, low-end-device environment with explicit fallback and abuse control.

### 2. SLA Automation Where No SLA Exists

Hostel complaints today don't have enforceable timelines; they rely on memory and repeated follow-ups. SmartHostel introduces:

- Category-based `dueAt` computation
- Automated reminders (2h before breach)
- Deterministic escalation (priority bump + persistent "unacknowledged breach" state)

*Why it's innovative here:* it creates accountability without requiring staff discipline, because the system does the chasing and leaves a trail.

### 3. "Anti-Chaos" as a Design Principle → Provable Operations

The differentiator isn't a feature; it's the **system property** created by layering:

- **Time-bounded actions** — passes expire; SLAs enforce deadlines
- **Role-locked permissions** — guards verify/override; wardens approve/correct; maintenance resolves
- **Audit-by-default** — every sensitive action attributed + timestamped

*Result:* disputes become resolvable with data, and accountability is provable without micromanagement.

### Innovation Validation Approach (Lean, MVP-Friendly)

**Pilot design (2–4 weeks):**
- Run in one hostel / one block first
- Week 1 = baseline measurement week (already defined in Success Criteria)

**What to validate:**
- QR pass adoption + dispute reduction: denied/override rate trend, scan-to-decision time, guard feedback
- SLA behavior: % resolved before breach, escalation effectiveness (action within 24h)
- Deflection: assistant usage rate vs. manual queries proxy

**How to validate safely:**
- Shadow mode (optional): first few days run QR alongside existing register to build trust
- Failure drills: network timeout test + manual fallback test; emergency override drill
- Governance checks: monitor override spikes and ensure every override is reason-logged + reviewed

**Success = innovation holds under real constraints.** If the system stays usable under poor connectivity, produces clear audit trails, and measurably reduces disputes and follow-ups, the innovations are validated.

## Web Application — Platform Requirements

### Architecture

- **Type:** Single-Page Application (React + Tailwind CSS)
- **Rendering:** Client-side SPA with JWT-based auth; no server-side rendering needed
- **SEO:** N/A — internal operational tool behind authentication; no public-facing pages
- **Real-time:** Not for MVP. Notifications via polling or page refresh. WebSockets deferred to post-MVP.

### Browser & Device Matrix (Per Role)

| Role | Primary Device | Browser | Constraints |
|------|---------------|---------|-------------|
| **Guard** | Low-end Android phone | Chrome (latest 2 versions) | Camera required for QR scan; poor Wi-Fi; outdoor/bright light; one-handed operation |
| **Student** | Mobile (Android/iOS) | Chrome / Safari (latest 2 versions) | Slower campus networks; used on-the-go; QR display must render clearly. iOS Safari camera access supported but may be less reliable across versions; students only display QR, not scan. |
| **Warden/Admin** | Desktop / laptop; tablet acceptable | Chrome / Firefox (latest 2 versions) | Dashboard-heavy; multi-column layouts; data tables with filtering |
| **Maintenance** | Mobile (Android) | Chrome (latest 2 versions) | On-site use; simple list + update modal; minimal typing |

**Minimum OS versions (testing baseline):** Android 10+ (guard devices), iOS 15+ (students), Desktop Chrome/Firefox latest 2 versions.

**Not supported (MVP):** Internet Explorer, legacy Edge, Firefox Mobile. No native app — browser-only.

### Camera + HTTPS Requirement (Scanner)

- QR scanning in browsers requires a **secure context (HTTPS)** and camera permission via `getUserMedia`
- **Production:** Must run on HTTPS (standard for any deployment; camera API will not work without it)
- **Local dev:** `localhost` is allowed as a secure context (no cert needed for development)
- **Scanner is a dedicated full-screen route** optimized for camera + lighting conditions. Not embedded in other pages.
- **Camera permission denied fallback:** If user denies camera → hide scanner, surface manual passCode input as primary method
- **Camera not available:** Same fallback — passCode input with rate limiting

### Responsive Design Strategy

**Mobile-first, role-aware:**

- Guard scanner page: single-column, full-screen scan result (green/red), large tap targets (≥ 48px), minimal scrolling. Optimized for one-handed outdoor use.
- Student pages: card-based layouts, thumb-friendly actions, QR display sized for gate scanning distance (~15cm phone-to-phone)
- Warden/Admin dashboards: multi-column grid on desktop (≥ 1024px), collapsible sidebar, data tables with horizontal scroll on mobile
- Maintenance page: simple list → detail pattern, update modal with large form fields

**Breakpoints (standard Tailwind):**
- Mobile: < 640px (guard, student, maintenance primary)
- Tablet: 640px–1024px (warden acceptable)
- Desktop: ≥ 1024px (warden primary)

### Network Resilience (PWA-Lite, Not Full PWA)

- **Scanner page:** Must gracefully handle API timeouts — show "Unable to verify" + automatic fallback to passCode input (see Journey 7)
- **Static asset caching:** Standard React production build with hashed filenames + CDN headers for aggressive caching. Reduces cold load time on repeat visits. **Never cache authenticated API responses; cache only static assets.**
- **No service worker for MVP.** Full offline/PWA support deferred. The goal is resilience (graceful degradation), not offline-first.
- **Optional (post-MVP):** Service worker for scanner page caching, enabling near-instant load on guard devices

### Performance Targets

Defined in Technical Success (see Success Criteria section). Key targets for web-specific context:
- Guard scanner cold load: p95 ≤ 2s on average Android
- QR verify end-to-end: p95 ≤ 3s
- API latency: p95 ≤ 300–500ms

### Accessibility

Defined in Domain Requirements #9. Web-specific additions:
- Color is never the sole status indicator (green/red results always include text labels + icons)
- Touch targets ≥ 48px on all interactive elements (especially scanner page)
- Form inputs have visible labels (not just placeholders)

## Data Model Snapshot (MVP Collections)

Core collections: Users, Consents, Leaves, GateLogs, OverrideLogs, Complaints, ComplaintComments/Updates, Notices, Notifications, FAQs, CronLogs, AuditEvents.

Notes: uploaded photos stored with reference IDs; no caching of authenticated API responses.

## Functional Requirements

### Identity & Access

- **FR1:** Users can authenticate with credentials and receive role-appropriate session access
- **FR2:** System enforces role-based access control across four roles (Student, Warden/Admin, Guard, Maintenance Staff)
- **FR3:** Users are routed to their role-specific dashboard on login; first-time users see a dismissible welcome orientation
- **FR4:** Users can view a privacy notice; system records consent acknowledgment with timestamp
- **FR5:** Warden/Admin can create and disable user accounts and reset credentials (manual for MVP)

### Leave & Gate Pass Management

- **FR6:** Students can create leave requests with type, date range, and reason
- **FR7:** Wardens can view pending leave requests and approve or reject them
- **FR8:** Approved leaves generate a verifiable gate pass with QR code and passCode; pass verification checks not-before and expiry relative to server time
- **FR9:** Students can view their leave history, current pass status, and active QR pass
- **FR10:** Students can cancel an approved leave before gate exit
- **FR11:** Wardens can correct post-exit pass records with documented reason

### Gate Verification

- **FR12:** Guards can scan a QR code to verify gate pass validity
- **FR13:** System displays full-screen pass verdict with student identity, pass context, and specific denial reasons
- **FR14:** Guards can verify passes via manual passCode entry as fallback
- **FR15:** System logs every verification attempt and enforces one-time-use exit scanning with OUT/IN event recording
- **FR16:** System supports offline scan logging with deferred reconciliation when network is unavailable; when reconciliation fails (invalid/expired), entry remains flagged for warden review — no silent acceptance
  > *Invariant: offline entries MUST reconcile to explicit success/fail (status: `OFFLINE_REVIEW_REQUIRED` until resolved); see State Machine Invariants.*
- **FR17:** System rate-limits manual passCode entry attempts

### Override & Exception Governance

- **FR18:** Guards can override gate denials with a required reason category and free-text note
- **FR19:** System immediately notifies wardens when a guard override occurs
- **FR20:** Wardens can review and annotate override records; system tracks override rates and surfaces spikes

### Complaint & SLA Lifecycle

- **FR21:** Students can submit complaints with category, description, and optional photo; system stores photos with size/type limits and access restricted to complaint stakeholders
- **FR22:** Students can view their complaint status timeline and history
- **FR23:** Wardens can assign complaints to maintenance staff with priority
- **FR24:** Maintenance staff can view their assigned queue sorted by priority and SLA urgency
- **FR25:** Maintenance staff can update complaint status and add resolution notes
- **FR26:** System computes SLA deadlines from configurable category-based thresholds and escalation targets
- **FR27:** System automates SLA reminders, post-breach escalation with priority elevation, and persistent breach flagging until acknowledged

### Self-Service Assistant

- **FR28:** Students can check complaint, leave, and fee status via quick-action shortcuts; fee status is read-only from a configured data source (seeded for MVP)
- **FR29:** Users can search hostel FAQs with fuzzy text matching
- **FR30:** System provides contextual next-action suggestions after status queries

### Dashboards & Communications

- **FR31:** Students see a dashboard with room info, active notices, fee status (read-only, seeded), and quick actions
- **FR32:** Wardens see a dashboard with operational KPIs, pending action items, and system health indicators
- **FR33:** Guards see a dedicated scanning interface as their primary view
- **FR34:** Maintenance staff see their assigned complaint queue as their primary view
- **FR35:** Wardens can broadcast notices to all students or filtered by block/floor
- **FR36:** System delivers in-app notifications for key events (approvals, overrides, escalations, assignments); users can view a notification list (last N) with at-least-once in-app delivery guarantee

### Audit, Monitoring & Data Governance

- **FR37:** System maintains append-only audit logs for all sensitive actions with user attribution and timestamps
- **FR38:** System enforces role-based data visibility boundaries per the defined visibility matrix
- **FR39:** System records operational health metrics (cron execution, scan failures, offline backlog) and surfaces status indicators
- **FR40:** System supports configurable data retention windows and maintains consent records

### Shared Domain Rules & State Machines

- **FR41:** Gate passes follow the canonical lifecycle (PENDING → APPROVED → SCANNED_OUT → SCANNED_IN → COMPLETED) with exceptional states (CANCELLED, EXPIRED, REVOKED, CORRECTED)
- **FR42:** Complaints follow a defined lifecycle (Open → Assigned → In Progress → Resolved) with escalation states
- **FR43:** System enforces state transition rules, role-locked permissions on transitions, and standardized reason codes: EXPIRED, CANCELLED, REVOKED, NOT_YET_VALID, ALREADY_SCANNED_OUT, ALREADY_SCANNED_IN, ALREADY_COMPLETED, INVALID_SIGNATURE, NOT_FOUND, NETWORK_UNVERIFIED

#### State Machine Invariants (MVP)

- Pass cannot transition to SCANNED_IN unless SCANNED_OUT exists.
- Student cancellation allowed only before SCANNED_OUT.
- Override requires reason + note and must trigger warden notification; never silent.
- Complaint cannot be RESOLVED without resolver attribution and timestamp.
- Audit events are append-only; corrections are new events.

## Permission Matrix (MVP)

*S = Student, W = Warden/Admin, G = Guard, M = Maintenance Staff*

| Action | S | W | G | M | Ref |
|--------|---|---|---|---|-----|
| Create leave request | ✅ | — | — | — | FR6 |
| Approve / reject leave | — | ✅ | — | — | FR7 |
| Cancel leave (pre-exit) | ✅ | — | — | — | FR10 |
| Correct post-exit pass | — | ✅ | — | — | FR11 |
| Scan QR / verify pass | — | — | ✅ | — | FR12–14 |
| Override gate denial | — | — | ✅ | — | FR18; warden notified |
| Review overrides | — | ✅ | — | — | FR20 |
| Submit complaint | ✅ | — | — | — | FR21 |
| Assign complaint | — | ✅ | — | — | FR23 |
| Update complaint status | — | — | — | ✅ | FR25; own assigned |
| Broadcast notices | — | ✅ | — | — | FR35 |
| Create / disable accounts | — | ✅ | — | — | FR5 |
| View audit logs | — | ✅ | — | — | FR37 |
| Export data | — | ✅ | — | — | FR40 |
| Use status shortcuts | ✅ | — | — | — | FR28 |
| Search FAQs | ✅ | ✅ | ✅ | ✅ | FR29; read-only for all; content managed by warden/admin |

## Capability Validation Checks (MVP)

- **Identity:** RBAC blocks cross-role access; consent recorded at first login.
- **Gate:** expired/cancelled/replay returns correct reason codes and is logged.
- **Offline:** OFFLINE_LOG entries reconcile to success/fail with warden review on fail.
- **SLA:** reminder and escalation occur on deterministic timing; Cron health visible.
- **Assistant:** shortcuts return correct status; FAQ search returns matches; deflection events logged.

## Non-Functional Requirements

*Performance, reliability, security (anti-replay, rate limiting, audit immutability), and accessibility are already defined with specific, measurable targets in the Technical Success, Domain Requirements, and Web Platform Requirements sections. This section covers only the remaining quality attributes.*

### Scalability (MVP Bounds)

- **Designed-for scale:** ~300 students, ~10–20 staff, ~2–4 guards, peak concurrent ~50–100 users (morning/evening gate rush)
- **Scanner throughput:** handle bursty scans at ~1 scan every 2–3 seconds per guard without queuing or degradation
- **Data volume bounds:** gate logs up to ~50k–200k events/year, complaints/notes/photos proportional to hostel size
- **Non-goal:** multi-hostel support, 10k+ users, horizontal scaling — none required for MVP

### Data Protection

- **Encryption in transit:** HTTPS/TLS for all traffic (required by camera API; applies to all endpoints)
- **Encryption at rest:** database and file storage encrypted (managed DB/cloud defaults acceptable)
- **Secrets management:** no secrets in repository; environment variables for keys; JWT signing key must be rotateable
- **Least privilege:** separate roles for application vs. database access; audit-level access to logs restricted to admin

### Account & Session Security

- **Session timeout:** JWT access tokens expire after a configurable window (recommended 1–4 hours); refresh tokens expire after 7–30 days
- **Password policy:** minimum 8 characters enforced at account creation and reset; no complexity rules beyond length for MVP
- **Account lockout:** temporary lockout after 5 consecutive failed login attempts
- **Session invalidation:** credential reset invalidates all active sessions; admin can force-logout any user

### Backup & Recovery

- **Automated backups:** daily database backup with verified restore capability
- **RPO (max data loss):** ≤ 24 hours
- **RTO (time to restore service):** ≤ 4–8 hours
- **Scope:** database + uploaded photos + configuration. Code is in version control.

### Maintainability

- **Test expectations:** basic API smoke tests for critical flows (auth, pass verify, complaint create/update, cron execution); not full coverage, but critical paths must be testable
- **Code quality:** linting + formatting enforced; simple CI that runs tests on PR/push
- **Observability hooks:** structured logs for verify, cron, and override events — enough to debug production issues without ad-hoc log grep

### Privacy & Data Governance

*Cross-references Domain Requirements #1–5 (PII handling, consent, visibility matrix, retention, auditability).*

- **Data export:** admin can export audit logs and complaint history for investigations (CSV or JSON acceptable)

### Operational Controls (MVP)

System provides: cron heartbeat visibility (last run + status), exportable audit/complaint history, override spike visibility, an emergency toggle to disable overrides/scanning if required, and a documented backup restore procedure aligned to RPO/RTO.

### Explicitly Excluded (MVP)

- **Integrations:** no external system integrations for MVP; fee data is seeded
- **SEO:** N/A — internal tool behind authentication
- **Real-time:** deferred to post-MVP; notifications via polling or page refresh
