# Story 5.6: SLA Cron Worker -- Reminders & Escalation

## Description
As a **WARDEN_ADMIN**,
I want the system to automatically send SLA reminders and escalate breached complaints,
So that nothing falls through the cracks without manual monitoring.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given the SLA cron worker is running, when it executes on schedule, then it runs every 10 minutes via `node-cron` schedule `*/10 * * * *` and also runs immediately on startup.

**AC-2:** Given complaints are due within 2 hours (ASSIGNED or IN_PROGRESS, not yet escalated), when the cron runs, then an `SLA_REMINDER` notification is sent to the assigned staff member, and a `ComplaintEvent` (SLA_REMINDER) is created for each near-breach complaint.

**AC-3:** Given multiple near-breach complaints are assigned to the same staff member, when the cron runs, then notifications are batched -- one notification lists the count (e.g., "3 items due in 2h") rather than sending individual notifications for each complaint.

**AC-4:** Given complaints have breached SLA (dueAt has passed, ASSIGNED or IN_PROGRESS, not yet escalated), when the cron runs, then each breached complaint is escalated: priority set to CRITICAL, `escalatedAt` set to current time, `escalationLevel` incremented, a `ComplaintEvent` (SLA_BREACHED) is created, and `SLA_BREACH` notifications are sent to all active WARDEN_ADMIN users.

**AC-5:** Given a complaint is escalated, when `dueAt` is examined, then it has NOT been reset -- the original or priority-adjusted dueAt persists for accountability.

**AC-6:** Given the cron completes a cycle, when it finishes, then a `CronLog` document is created with `jobName: 'sla-check'`, `result: 'SUCCESS'` or `'FAIL'`, `complaintsReminded`, `complaintsEscalated`, and `errorMessages`.

**AC-7:** Given the health endpoint `/admin/health` is called, when the last `sla-check` CronLog is older than 20 minutes, then the response includes `cronOverdue: true`.

**AC-7a:** Given the cron has never run (no CronLog exists for `sla-check`), when the health endpoint `/admin/health` is called, then the response includes `cronOverdue: true`.

**AC-8:** Given errors occur during reminder or escalation processing, when individual complaint processing fails, then the error is captured in `errorMessages` array and processing continues for remaining complaints (no fail-fast).

**AC-9:** Given a complaint has already been escalated (`escalatedAt` is not null), when the cron runs, then it is excluded from both near-breach reminders and breach escalation (no duplicate processing).

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, node-cron
- **Worker entry point:** `server/src/worker/index.ts` -- standalone process connecting to MongoDB and scheduling cron
- **Cron schedule:** `*/10 * * * *` (every 10 minutes)
- **Near-breach window:** 2 hours (`TWO_HOURS_MS = 2 * 60 * 60 * 1000`)
- **Breach detection query:** `{ status: { $in: [ASSIGNED, IN_PROGRESS] }, dueAt: { $lt: now }, escalatedAt: null }`
- **Near-breach query:** `{ status: { $in: [ASSIGNED, IN_PROGRESS] }, dueAt: { $gt: now, $lte: now + 2h }, escalatedAt: null }`
- **Batching:** Reminders grouped by `assigneeId` using a `Map<string, Complaint[]>`
- **Health check:** `server/src/routes/health.routes.ts` queries latest CronLog for `cronOverdue` flag
- **Dev script:** `npm run dev:worker` (in server package.json: `tsx watch -r tsconfig-paths/register src/worker/index.ts`)

### Existing Code
Story 5.6 creates the SLA worker from scratch and adds cron monitoring to the health endpoint.

**Server:**
- `server/src/models/cron-log.model.ts` -- CronLog model with `jobName`, `result` (SUCCESS/FAIL), `complaintsReminded`, `complaintsEscalated`, `errorMessages` array. Timestamps `createdAt` only. **Complete.**
- `server/src/services/sla-worker.service.ts` -- `runSlaCheck()` function:
  1. Near-breach detection: finds complaints due within 2h, groups by assigneeId, creates batched `SLA_REMINDER` notifications (single notification for multiple complaints per assignee), creates `SLA_REMINDER` ComplaintEvent per complaint.
  2. Breach detection: finds overdue complaints not yet escalated, escalates each (set priority CRITICAL, escalatedAt, increment escalationLevel, does NOT reset dueAt), creates `SLA_BREACHED` ComplaintEvent, notifies all active WARDEN_ADMIN users with `SLA_BREACH` notification.
  3. Error handling: individual complaint errors captured in `errorMessages` array without fail-fast.
  4. Logging: creates CronLog with result, counts, and errors.
  **Complete.**
- `server/src/worker/index.ts` -- Connects to MongoDB, schedules `runSlaCheck` every 10 minutes via `node-cron`, runs immediately on startup. **Complete.**
- `server/src/routes/health.routes.ts` -- `/admin/health` endpoint queries latest CronLog for `sla-check` job, computes `cronOverdue` (>20 min since last run or never run), includes `lastCronRun` timestamp. **Complete.**
- `server/src/services/dashboard.service.ts` -- `getWardenDashboardStats()` includes `cronOverdue` and `lastCronRun` from CronLog. **Complete.**

## Tasks

### Task 1: Create CronLog Model
Define the cron execution log schema for tracking SLA check results.
- [ ] Subtask 1.1: Create `server/src/models/cron-log.model.ts` with ICronLog interface: `jobName` (string, indexed), `result` ('SUCCESS' | 'FAIL'), `complaintsReminded` (number, default 0), `complaintsEscalated` (number, default 0), `errorMessages` (string array, default [])
- [ ] Subtask 1.2: Enable timestamps `createdAt` only (no `updatedAt`)
- [ ] Subtask 1.3: Add `toJSON` transform stripping `__v`

**Tests (AC-6):**
- [ ] Unit test: CronLog model requires `jobName` and `result`
- [ ] Unit test: CronLog model defaults `complaintsReminded` to 0, `complaintsEscalated` to 0, `errorMessages` to []
- [ ] Unit test: CronLog model accepts only 'SUCCESS' or 'FAIL' for `result`

### Task 2: Create SLA Worker Service
Implement the core SLA check logic with near-breach reminders and breach escalation.
- [ ] Subtask 2.1: Implement near-breach detection query: find complaints with `{ status: { $in: [ASSIGNED, IN_PROGRESS] }, dueAt: { $gt: now, $lte: now + 2h }, escalatedAt: null }`, populate assigneeId
- [ ] Subtask 2.2: Group near-breach complaints by assigneeId using `Map<string, Complaint[]>` for batching
- [ ] Subtask 2.3: Create batched `SLA_REMINDER` notifications per assignee -- single notification for 1 complaint, count-based message for multiple (e.g., "3 items due in 2h")
- [ ] Subtask 2.4: Create `SLA_REMINDER` ComplaintEvent for each near-breach complaint with `actorRole: 'SYSTEM'`
- [ ] Subtask 2.5: Implement breach detection query: find complaints with `{ status: { $in: [ASSIGNED, IN_PROGRESS] }, dueAt: { $lt: now }, escalatedAt: null }`
- [ ] Subtask 2.6: Escalate each breached complaint: set `priority: 'CRITICAL'`, `escalatedAt: now`, increment `escalationLevel`, do NOT modify `dueAt`
- [ ] Subtask 2.7: Create `SLA_BREACHED` ComplaintEvent for each escalated complaint
- [ ] Subtask 2.8: Notify all active WARDEN_ADMIN users with `SLA_BREACH` notification for each escalated complaint

**Tests (AC-2, AC-3, AC-4, AC-5, AC-8, AC-9):**
- [ ] Unit test: `runSlaCheck` creates SLA_REMINDER notifications for complaints due within 2 hours
- [ ] Unit test: `runSlaCheck` batches notifications when multiple complaints are near-breach for same assignee
- [ ] Unit test: `runSlaCheck` escalates overdue complaints to CRITICAL priority
- [ ] Unit test: `runSlaCheck` sets escalatedAt and increments escalationLevel on breach
- [ ] Unit test: `runSlaCheck` does NOT reset dueAt on escalation
- [ ] Unit test: `runSlaCheck` skips already-escalated complaints (escalatedAt not null)
- [ ] Unit test: `runSlaCheck` notifies all active WARDEN_ADMIN users on breach
- [ ] Unit test: `runSlaCheck` captures individual errors without fail-fast

### Task 3: Create Worker Entry Point
Set up the standalone cron process.
- [ ] Subtask 3.1: Create `server/src/worker/index.ts` that connects to MongoDB via `connectDB()`
- [ ] Subtask 3.2: Schedule `runSlaCheck` with `node-cron` using schedule `*/10 * * * *`
- [ ] Subtask 3.3: Run `runSlaCheck` immediately on startup (before first cron tick)
- [ ] Subtask 3.4: Add error handling: log fatal error and exit process if startup fails

**Tests (AC-1):**
- [ ] Unit test: Worker schedules cron with correct pattern `*/10 * * * *`
- [ ] Unit test: Worker calls `runSlaCheck` on startup
- [ ] Manual verification: Running `npm run dev:worker` starts the worker, logs "SLA worker started", and runs initial check

### Task 4: Update Health Endpoint with Cron Monitoring
Add cron overdue detection to the admin health endpoint.
- [ ] Subtask 4.1: In `server/src/routes/health.routes.ts` `/admin/health` handler, query `CronLog.findOne({ jobName: 'sla-check' }).sort({ createdAt: -1 })`
- [ ] Subtask 4.2: Compute `cronOverdue = lastCronRun ? (Date.now() - lastCronRun.createdAt > 20min) : true`
- [ ] Subtask 4.3: Include `cronOverdue` and `lastCronRun` (timestamp or null) in health response
- [ ] Subtask 4.4: Update `server/src/services/dashboard.service.ts` `getWardenDashboardStats()` to include `cronOverdue` and `lastCronRun`

**Tests (AC-7, AC-7a):**
- [ ] Integration test: GET `/admin/health` with recent CronLog returns `cronOverdue: false`
- [ ] Integration test: GET `/admin/health` with old CronLog (>20 min) returns `cronOverdue: true`
- [ ] Integration test: GET `/admin/health` with no CronLog returns `cronOverdue: true`
- [ ] Integration test: Dashboard stats include `cronOverdue` and `lastCronRun`

## Dependencies
- **Story 5.1** (completed) -- Complaint model with dueAt, escalatedAt, escalationLevel fields
- **Story 5.2** (completed) -- Complaints in ASSIGNED status with assigneeId populated
- **Story 5.3** (completed) -- Complaints in IN_PROGRESS status
- **Story 5.5** (completed) -- SLA constants (used for context, not directly imported by worker)
- **Story 1.2** (completed) -- Auth middleware for health endpoint
- Requires `node-cron` package (already installed)
- Requires `Notification` model with `SLA_REMINDER` and `SLA_BREACH` types

## File List

### New Files
- `server/src/models/cron-log.model.ts` -- CronLog Mongoose model for tracking cron execution results
- `server/src/services/sla-worker.service.ts` -- runSlaCheck function with near-breach reminders and breach escalation
- `server/src/worker/index.ts` -- Standalone worker entry point with node-cron scheduling

### Modified Files
- `server/src/routes/health.routes.ts` -- Added CronLog query and cronOverdue/lastCronRun to /admin/health response
- `server/src/services/dashboard.service.ts` -- Added cronOverdue and lastCronRun to warden dashboard stats
- `server/package.json` -- Added `dev:worker` script

### Unchanged Files
- `server/src/models/complaint.model.ts` -- Complaint model with escalation fields (created in Story 5.1)
- `server/src/models/complaint-event.model.ts` -- ComplaintEvent model (created in Story 5.1)
- `server/src/models/notification.model.ts` -- Notification model with SLA_REMINDER and SLA_BREACH types
- `shared/constants/notification-types.ts` -- NotificationType enum including SLA_REMINDER and SLA_BREACH

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (CronLog Model):** Created CronLog with job tracking fields. The `result` field uses string enum ('SUCCESS'/'FAIL') for simplicity. Error messages are stored as an array to support per-complaint error capture.

**Task 2 (SLA Worker Service):** Implemented `runSlaCheck` with two phases: near-breach reminders and breach escalation.

Near-breach reminders: Queries complaints due within 2 hours that haven't been escalated. Groups by assigneeId using a Map for notification batching. Single complaints get a specific message; multiple complaints get a count-based message. Each complaint gets its own SLA_REMINDER ComplaintEvent for timeline tracking.

Breach escalation: Queries overdue complaints not yet escalated. Each breached complaint gets priority bumped to CRITICAL, escalatedAt set to now, escalationLevel incremented. Critically, dueAt is NOT reset -- this preserves the SLA breach record for accountability. All active wardens are notified. The User model is dynamically imported to avoid circular dependency issues.

Error handling: Each complaint's processing is wrapped in try/catch. Errors are captured in the errorMessages array and processing continues for remaining complaints.

**Task 3 (Worker):** Standalone process using `connectDB()` and node-cron. Runs immediately on startup, then every 10 minutes. Fatal startup errors cause process exit.

**Task 4 (Health):** Both `/admin/health` and dashboard stats now include `cronOverdue` (boolean) and `lastCronRun` (timestamp or null). Overdue threshold is 20 minutes (2x the 10-minute cron interval).

### Test Results
- Near-breach detection correctly identifies complaints within 2-hour window
- Notification batching verified: 1 notification per assignee regardless of complaint count
- Breach escalation correctly sets CRITICAL priority without modifying dueAt
- CronLog creation verified with correct counts and result
- Health endpoint correctly reports cronOverdue based on CronLog age

### New Dependencies
- `node-cron` (already installed in server workspace)
