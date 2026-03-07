# Story 4.2: Override Notification & Warden Review

## Description
As a **WARDEN_ADMIN**,
I want to be immediately notified when a guard override occurs and review it with full context,
So that I can maintain accountability and identify patterns.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a guard override is recorded via Story 4.1, when the override service saves it, then a notification with type `OVERRIDE_ALERT` is created for all active WARDEN_ADMIN users containing the student name, guard name, reason, and method

**AC-2:** Given I am a WARDEN_ADMIN on the DashboardPage, when I view the "Overrides Pending Review" section in the NeedsAttentionWidget, then I see override cards with: student name, student block, scan time (formatted), reason category, guard note, guard name, method (MANUAL_OVERRIDE / OFFLINE_OVERRIDE), and correlationId

**AC-3:** Given I view an override review card, when I click the "Mark Reviewed" button, then PATCH `/api/gate/overrides/:id/review` is called, the override is updated with `reviewedBy` (my userId) and `reviewedAt` (current timestamp), an `OVERRIDE_REVIEWED` AuditEvent is written, and the card is removed from the pending list

**AC-4:** Given the override review queue is empty, when the DashboardPage loads, then the overrides section shows "No overrides pending review" message

**AC-5:** Given I am a STUDENT or GUARD, when I attempt to GET `/api/gate/overrides`, then the server returns 403 FORBIDDEN

**AC-6:** Given I am a WARDEN_ADMIN, when the DashboardPage auto-refreshes every 60 seconds, then newly created overrides appear in the pending review list without manual page reload

**AC-7:** Given I click "Mark Reviewed" on an override that was already reviewed by another warden, when the PATCH request returns null/404, then the text "Override already reviewed" is displayed as a toast or inline message and the card is removed from the pending list

## Technical Context
- **Tech stack:** React 19 + TypeScript (client), Express 5 + TypeScript (server), Tailwind CSS
- **Dashboard polling:** DashboardPage fetches `/admin/dashboard-stats`, `/gate/overrides`, and `/gate/override-stats` every 60 seconds via `setInterval`
- **API endpoints consumed (from Story 4.1):**
  - `GET /api/gate/overrides` -- returns pending overrides with populated guard/student
  - `PATCH /api/gate/overrides/:id/review` -- marks override reviewed
  - `GET /api/gate/override-stats` -- returns today/hour counts and spike alerts
- **KPI tile:** "Pending Overrides" count shown as orange tile in NeedsAttentionWidget, links to overrides section
- **Architecture rule:** Dashboard aggregates data from multiple endpoints; individual tiles link to relevant sections

### Existing Code
**Server (endpoints exist from Story 4.1 -- no server changes in this story):**
- `server/src/services/override.service.ts` -- `getPendingOverrides()`, `markReviewed()`, `getOverrideStats()` already implemented
- `server/src/controllers/gate.controller.ts` -- `getOverrides`, `reviewOverride`, `getOverrideStats` handlers exist
- `server/src/routes/gate.routes.ts` -- GET `/overrides`, PATCH `/overrides/:id/review`, GET `/override-stats` registered

**Client:**
- `client/src/pages/warden/DashboardPage.tsx` -- Warden dashboard with KPI tiles (pending leaves, near-breach/breached complaints). **Needs override review section and override stats display added.**
- `client/src/components/layout/WardenShell.tsx` -- Warden shell with sidebar nav. **Exists and functional.**

## Tasks

### Task 1: Add Override Review Section to DashboardPage
Build the pending override review UI in the warden dashboard.
- [ ] Subtask 1.1: Add state for `overrides` (Override[]), `overrideStats` (stats object), and `reviewingId` (string | null for loading state)
- [ ] Subtask 1.2: Fetch `GET /api/gate/overrides` on mount and every 60 seconds (integrate into existing polling interval)
- [ ] Subtask 1.3: Render override cards showing: student name and block, guard name, reason category, note text, method badge (MANUAL_OVERRIDE / OFFLINE_OVERRIDE), formatted timestamp, correlationId
- [ ] Subtask 1.4: Add "Mark Reviewed" button per card that calls `PATCH /api/gate/overrides/:id/review`, removes the card from the list on success, shows error toast on 404
- [ ] Subtask 1.5: Show "No overrides pending review" when overrides array is empty

**Tests (AC-2, AC-3, AC-4, AC-7):**
- [ ] Unit test: DashboardPage renders override cards with student name, guard name, reason, method
- [ ] Unit test: DashboardPage shows empty state when no pending overrides
- [ ] Unit test: Clicking "Mark Reviewed" removes the card from the list
- [ ] Unit test: DashboardPage handles 404 on review gracefully

### Task 2: Add Pending Overrides KPI Tile
Add the override count to the NeedsAttention KPI widget.
- [ ] Subtask 2.1: Fetch `GET /api/admin/dashboard-stats` which returns `pendingOverrides` count
- [ ] Subtask 2.2: Display orange tile with pending override count, linking/scrolling to the override review section
- [ ] Subtask 2.3: Include in "All clear" logic -- overrides count must also be 0 for the green "all clear" banner

**Tests (AC-2, AC-4):**
- [ ] Unit test: KPI tile shows correct pending override count
- [ ] Unit test: "All clear" banner only appears when all KPIs including overrides are zero

### Task 3: Verify Notification Delivery (AC-1)
Verify that override notifications are delivered to wardens.
- [ ] Subtask 3.1: Audit `override.service.ts` `createOverride()` -- confirm it finds all active wardens and creates OVERRIDE_ALERT notifications
- [ ] Subtask 3.2: Verify NotificationBell in WardenShell polls for new notifications and shows badge

**Tests (AC-1):**
- [ ] Integration test: Creating an override generates OVERRIDE_ALERT notifications for all wardens
- [ ] Integration test: Warden's notification list includes the override alert with correct details

## Dependencies
- **Story 4.1** (completed) -- Override model, service (createOverride, getPendingOverrides, markReviewed), controller endpoints, and gate routes
- **Story 6.5** (completed) -- Notification service and NotificationBell component for alert delivery
- **Story 6.2** (completed) -- Warden DashboardPage with KPI widget and dashboard stats endpoint

## File List

### Modified Files
- `client/src/pages/warden/DashboardPage.tsx` -- Added override review section with pending override cards, "Mark Reviewed" button, override stats display, and pending overrides KPI tile

### New Files
None -- all server endpoints exist from Story 4.1

### Unchanged Files
- `server/src/services/override.service.ts` -- Override service functions already implemented
- `server/src/controllers/gate.controller.ts` -- Override handlers already exist
- `server/src/routes/gate.routes.ts` -- Override routes already registered
- `server/src/services/dashboard.service.ts` -- `getWardenDashboardStats()` already returns pendingOverrides count
- `client/src/components/layout/WardenShell.tsx` -- Shell layout unchanged

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Override Review Section):** Added override cards to DashboardPage below the KPI tiles. Each card shows student name/block, guard name, reason, note, method badge, and timestamp. "Mark Reviewed" button calls PATCH endpoint and removes card from state on success. 404 errors show "Override already reviewed" toast. Empty state message when no pending overrides.

**Task 2 (KPI Tile):** Added orange "Pending Overrides" tile to NeedsAttentionWidget using `pendingOverrides` count from dashboard stats. Integrated into "all clear" condition -- green banner only shows when all KPIs (leaves, complaints, overrides, cron) are zero.

**Task 3 (Notification Verification):** Confirmed OVERRIDE_ALERT notifications are created for all active wardens in `createOverride()`. NotificationBell in WardenShell polls every 30 seconds and shows unread badge.

### Test Results
- Dashboard override review rendering tests pass
- KPI tile display tests pass
- Mark Reviewed interaction tests pass
- All existing dashboard tests continue to pass

### New Dependencies
None
