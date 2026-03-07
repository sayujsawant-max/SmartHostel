# Story 4.5: Operational Health & Data Retention

## Description
As a **WARDEN_ADMIN**,
I want to see system health indicators and know that data retention is enforced,
So that I can trust the system is operating correctly and within policy.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a WARDEN_ADMIN, when I GET `/api/admin/health`, then the response includes `{ db: { connected: boolean, latencyMs: number }, offlineScansPending: number, offlineScansFailed: number, cronOverdue: boolean, lastCronRun: string|null, uptime: number, correlationId: string }`

**AC-2:** Given the database connection is healthy, when the health endpoint pings MongoDB, then `db.connected` is true and `latencyMs` reflects the actual round-trip time of a `db.admin().ping()` call

**AC-3:** Given the SLA cron worker has not run in the last 20 minutes, when the health endpoint checks cron status, then `cronOverdue` is true and the DashboardPage KPI widget shows a red "Cron Health" alert tile

**AC-4:** Given the SLA cron worker ran within the last 20 minutes, when the health endpoint checks cron status, then `cronOverdue` is false and no cron health alert is shown

**AC-5:** Given TTL indexes are configured on Mongoose models, when documents age past their retention window, then notifications are auto-deleted after 180 days (TTL on `createdAt`)

**AC-6:** Given gateScans and overrides exist in the database, when they reach any age, then they are NOT auto-deleted -- gate scan records are dispute evidence requiring indefinite retention in MVP (archive to cold storage post-MVP)

**AC-7:** Given auditEvents exist in the collection, when they are queried or aged, then they are never auto-deleted -- audit events have indefinite retention as the legal backbone

**AC-8:** Given I am NOT a WARDEN_ADMIN (e.g., STUDENT, GUARD), when I attempt GET `/api/admin/health`, then the server returns 403 FORBIDDEN

**AC-9:** Given the public health endpoint at GET `/api/health`, when any unauthenticated request hits it, then the server returns `{ status: 'healthy', correlationId }` with 200 (no auth required)

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, node-cron
- **Health endpoint:** `/api/admin/health` (authenticated, WARDEN_ADMIN only) vs `/api/health` (public, no auth)
- **DB health check:** `mongoose.connection.db.admin().ping()` with timer for latency measurement
- **Cron health:** Checks `cronLogs` collection for most recent entry with `jobName: 'sla-check'` and `status: 'success'`; overdue if >20 minutes since last success
- **Offline scans:** Counts GateScan documents with `reconciliationStatus: 'PENDING'` and `reconciliationStatus: 'FAIL'`
- **TTL indexes:**
  - `notifications.createdAt` -- 180-day TTL (15552000 seconds)
  - `cronLogs.createdAt` -- 90-day TTL (7776000 seconds)
  - No TTL on: auditEvents, gateScans, overrides, leaves, complaints
- **Dashboard integration:** `cronOverdue` flag consumed by DashboardPage KPI widget as red tile

### Existing Code
**Server:**
- `server/src/routes/health.routes.ts` -- Public GET `/health` returning `{ status: 'healthy' }`. **Exists from Story 1.1. Needs authenticated `/admin/health` endpoint and `/admin/dashboard-stats` added.**
- `server/src/models/gate-scan.model.ts` -- GateScan model with reconciliationStatus field. **Exists from Story 3.1.**
- `server/src/models/notification.model.ts` -- Notification model. **Exists from Story 6.5. Needs TTL index verification.**
- `server/src/models/audit-event.model.ts` -- AuditEvent model with no TTL. **Exists from Story 1.1.**
- `server/src/models/override.model.ts` -- Override model with no TTL. **Exists from Story 4.1.**
- `server/src/services/dashboard.service.ts` -- `getWardenDashboardStats()` aggregating KPIs. **Needs creation for dashboard stats.**
- `server/src/app.ts` -- Express app with route registration. **Needs admin routes mounted.**

**Client:**
- `client/src/pages/warden/DashboardPage.tsx` -- Warden dashboard with KPI tiles. **Needs cron health tile and "All clear" condition integration.**

## Tasks

### Task 1: Create Admin Health Endpoint
Add the authenticated health check endpoint with comprehensive system status.
- [ ] Subtask 1.1: Add `GET /admin/health` route to `health.routes.ts` with `authMiddleware` and `requireRole(Role.WARDEN_ADMIN)`
- [ ] Subtask 1.2: Implement DB health check: `mongoose.connection.db.admin().ping()` wrapped in timer for latency measurement; handle connection failure gracefully
- [ ] Subtask 1.3: Query GateScan for offline scan counts: `reconciliationStatus: 'PENDING'` and `reconciliationStatus: 'FAIL'`
- [ ] Subtask 1.4: Query CronLog for last successful `sla-check` run; compute `cronOverdue` as `lastRun > 20 minutes ago` or `no run found`
- [ ] Subtask 1.5: Include `process.uptime()` in response
- [ ] Subtask 1.6: Return complete health object with correlationId

**Tests (AC-1, AC-2, AC-3, AC-4, AC-8):**
- [ ] Integration test: GET `/api/admin/health` with WARDEN_ADMIN auth returns 200 with all health fields
- [ ] Integration test: GET `/api/admin/health` with STUDENT auth returns 403
- [ ] Integration test: GET `/api/admin/health` without auth returns 401
- [ ] Unit test: Health check returns cronOverdue true when no cron log exists
- [ ] Unit test: Health check returns cronOverdue false when recent cron log exists

### Task 2: Create Dashboard Stats Endpoint
Add the KPI aggregation endpoint for the warden dashboard.
- [ ] Subtask 2.1: Create `server/src/services/dashboard.service.ts` with `getWardenDashboardStats()` function
- [ ] Subtask 2.2: Count pending leaves (`status: 'PENDING'`)
- [ ] Subtask 2.3: Count near-breach complaints (dueAt within 6 hours, status in OPEN/ASSIGNED/IN_PROGRESS)
- [ ] Subtask 2.4: Count breached complaints (dueAt in past, status in OPEN/ASSIGNED/IN_PROGRESS)
- [ ] Subtask 2.5: Count pending overrides (`reviewedBy: null`)
- [ ] Subtask 2.6: Include cron health status (cronOverdue, lastCronRun)
- [ ] Subtask 2.7: Add `GET /admin/dashboard-stats` route with WARDEN_ADMIN role

**Tests (AC-1):**
- [ ] Unit test: getWardenDashboardStats returns correct counts for each KPI
- [ ] Unit test: nearBreachComplaints uses 6-hour window from now
- [ ] Unit test: breachedComplaints uses dueAt < now
- [ ] Integration test: GET /api/admin/dashboard-stats returns all KPI fields

### Task 3: Verify TTL Indexes
Ensure correct TTL indexes exist on appropriate collections.
- [ ] Subtask 3.1: Verify `notifications` model has `createdAt` TTL index with 180-day expiry (15552000 seconds)
- [ ] Subtask 3.2: Verify `cronLogs` model has `createdAt` TTL index with 90-day expiry (7776000 seconds)
- [ ] Subtask 3.3: Verify `auditEvents` model has NO TTL index
- [ ] Subtask 3.4: Verify `gateScans` model has NO TTL index
- [ ] Subtask 3.5: Verify `overrides` model has NO TTL index

**Tests (AC-5, AC-6, AC-7):**
- [ ] Unit test: Notification schema has TTL index on createdAt
- [ ] Unit test: AuditEvent schema has no TTL index
- [ ] Manual verification: MongoDB TTL indexes are created correctly on deployment

### Task 4: Add Cron Health KPI to DashboardPage
Integrate cron health status into the warden dashboard KPI widget.
- [ ] Subtask 4.1: Display red "Cron Health" tile when `cronOverdue` is true from dashboard stats
- [ ] Subtask 4.2: Show last cron run timestamp when available
- [ ] Subtask 4.3: Include cron health in "All clear" condition -- green banner only when all KPIs are zero AND cron is healthy

**Tests (AC-3, AC-4):**
- [ ] Unit test: DashboardPage shows red cron tile when cronOverdue is true
- [ ] Unit test: DashboardPage hides cron tile when cronOverdue is false
- [ ] Unit test: "All clear" banner requires cronOverdue to be false

## Dependencies
- **Story 1.1** (completed) -- AuditEvent model (no TTL), base Express app, public health endpoint
- **Story 3.1** (completed) -- GateScan model with reconciliationStatus field
- **Story 4.1** (completed) -- Override model (no TTL)
- **Story 5.6** (completed) -- SLA cron worker writing to cronLogs collection
- **Story 6.5** (completed) -- Notification model (needs TTL index)

## File List

### Modified Files
- `server/src/routes/health.routes.ts` -- Added authenticated GET `/admin/health` and GET `/admin/dashboard-stats` endpoints with WARDEN_ADMIN role restriction
- `server/src/models/notification.model.ts` -- Added/verified TTL index on createdAt (180 days)
- `client/src/pages/warden/DashboardPage.tsx` -- Added cron health KPI tile and integrated dashboard stats

### New Files
- `server/src/services/dashboard.service.ts` -- `getWardenDashboardStats()` aggregating pendingLeaves, nearBreachComplaints, breachedComplaints, pendingOverrides, cronOverdue, lastCronRun

### Unchanged Files
- `server/src/models/audit-event.model.ts` -- No TTL, append-only (verified correct)
- `server/src/models/gate-scan.model.ts` -- No TTL (verified correct)
- `server/src/models/override.model.ts` -- No TTL (verified correct)
- `server/src/middleware/auth.middleware.ts` -- JWT verification unchanged
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory unchanged

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Admin Health Endpoint):** Added authenticated `/admin/health` endpoint with DB ping + latency timer, offline scan counts from GateScan, cron health from cronLogs (20-minute threshold), and process uptime. Graceful error handling if DB ping fails.

**Task 2 (Dashboard Stats):** Created `dashboard.service.ts` with `getWardenDashboardStats()`. Uses MongoDB queries for pendingLeaves count, near-breach (dueAt within 6 hours) and breached (dueAt in past) complaint counts, pending overrides (reviewedBy null), and cron health status. All counts run in parallel via `Promise.all`.

**Task 3 (TTL Verification):** Verified notifications model has 180-day TTL on createdAt. Verified cronLogs has 90-day TTL. Confirmed auditEvents, gateScans, and overrides have NO TTL indexes.

**Task 4 (Cron Health KPI):** Added red cron health tile to DashboardPage KPI widget. Tile only shows when `cronOverdue` is true. Integrated into "All clear" condition.

### Test Results
- Health endpoint tests pass (auth, RBAC, response shape)
- Dashboard stats service tests pass
- TTL verification tests pass
- All existing tests continue to pass

### New Dependencies
None
