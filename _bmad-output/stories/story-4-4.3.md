# Story 4.3: Override Spike Tracking

## Description
As a **WARDEN_ADMIN**,
I want the system to track override rates and surface spikes,
So that I can identify guard behavior patterns requiring attention.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given more than 5 overrides occur in a calendar day OR more than 3 occur in the last hour, when the warden DashboardPage loads or refreshes, then the health widget displays a red spike alert: "Override rate above threshold ({N} today / {N} this hour)"

**AC-2:** Given override rates are below thresholds (<=5/day AND <=3/hour), when the DashboardPage loads, then no spike alert is shown and override stats display as informational text: "{N} today, {N} this hour"

**AC-3:** Given override records exist, when the warden views override stats on the DashboardPage, then per-guard override counts are aggregated and displayed showing guard name and count for pattern visibility

**AC-4:** Given I am a WARDEN_ADMIN, when I GET `/api/gate/override-stats`, then the response includes `{ todayCount, hourCount, spikeAlert, spikeMessage, perGuard: [{ guardId, guardName, count }] }`

**AC-5:** Given I am NOT a WARDEN_ADMIN, when I attempt GET `/api/gate/override-stats`, then the server returns 403 FORBIDDEN

**AC-6:** Given no overrides exist, when the stats endpoint is called, then it returns `{ todayCount: 0, hourCount: 0, spikeAlert: false, spikeMessage: null, perGuard: [] }`

## Technical Context
- **Tech stack:** Express 5 + TypeScript (server), React 19 + TypeScript (client), MongoDB aggregation
- **Spike thresholds:** >5 overrides per day OR >3 overrides per hour (hardcoded in service)
- **Date computation:** "Today" is computed as midnight UTC of current day; "last hour" is computed as `new Date(Date.now() - 3600000)`
- **Per-guard aggregation:** Uses MongoDB `$group` aggregation pipeline on `guardId` field with `$lookup` to User collection for guard names
- **Dashboard polling:** Override stats fetched alongside other dashboard data every 60 seconds

### Existing Code
**Server (from Story 4.1):**
- `server/src/services/override.service.ts` -- `getOverrideStats()` already implemented with today/hour counts, spike detection, and per-guard aggregation. **No server changes needed.**
- `server/src/controllers/gate.controller.ts` -- `getOverrideStats` handler exists. **No changes needed.**
- `server/src/routes/gate.routes.ts` -- `GET /override-stats` registered with WARDEN_ADMIN role. **No changes needed.**

**Client (from Story 4.2):**
- `client/src/pages/warden/DashboardPage.tsx` -- Dashboard with KPI tiles and override review section. **Needs override stats display with spike alert added.**

## Tasks

### Task 1: Add Override Stats Display to DashboardPage
Integrate the override statistics and spike alert into the warden dashboard.
- [ ] Subtask 1.1: Fetch `GET /api/gate/override-stats` on mount and in the 60-second polling interval
- [ ] Subtask 1.2: If `spikeAlert` is true, render a red alert banner with the `spikeMessage` text (e.g., "Override rate above threshold (8 today / 4 this hour)")
- [ ] Subtask 1.3: If `spikeAlert` is false, render informational text showing today and last-hour counts in a neutral style
- [ ] Subtask 1.4: Display per-guard breakdown table/list showing guard name and override count for the current day

**Tests (AC-1, AC-2, AC-3):**
- [ ] Unit test: DashboardPage shows red spike alert when spikeAlert is true
- [ ] Unit test: DashboardPage shows informational stats when spikeAlert is false
- [ ] Unit test: DashboardPage renders per-guard breakdown with guard names and counts
- [ ] Unit test: DashboardPage handles empty perGuard array gracefully

### Task 2: Verify Override Stats Service Logic
Audit the existing server-side implementation for correctness.
- [ ] Subtask 2.1: Audit `getOverrideStats()` -- confirm "today" uses midnight UTC boundary, "hour" uses `Date.now() - 3600000`
- [ ] Subtask 2.2: Audit spike detection -- confirm threshold checks are `todayCount > 5 || hourCount > 3`
- [ ] Subtask 2.3: Audit per-guard aggregation -- confirm $group by guardId with $lookup to User collection for names

**Tests (AC-1, AC-2, AC-4, AC-6):**
- [ ] Unit test: getOverrideStats returns spikeAlert true when todayCount > 5
- [ ] Unit test: getOverrideStats returns spikeAlert true when hourCount > 3
- [ ] Unit test: getOverrideStats returns spikeAlert false when both below threshold
- [ ] Unit test: getOverrideStats returns empty perGuard array when no overrides exist
- [ ] Integration test: GET /api/gate/override-stats returns correct shape with todayCount, hourCount, spikeAlert, perGuard

## Dependencies
- **Story 4.1** (completed) -- Override model and `getOverrideStats()` service function
- **Story 4.2** (completed) -- Warden DashboardPage with override review section and polling setup

## File List

### Modified Files
- `client/src/pages/warden/DashboardPage.tsx` -- Added override stats display with spike alert banner and per-guard breakdown

### New Files
None

### Unchanged Files
- `server/src/services/override.service.ts` -- `getOverrideStats()` already complete
- `server/src/controllers/gate.controller.ts` -- `getOverrideStats` handler already exists
- `server/src/routes/gate.routes.ts` -- GET `/override-stats` route already registered

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Stats Display):** Added override stats section to DashboardPage. When `spikeAlert` is true, a red-bordered alert banner shows the spike message. Otherwise, neutral text shows today/hour counts. Per-guard breakdown renders as a compact list with guard name and count.

**Task 2 (Service Audit):** Verified `getOverrideStats()` uses correct date boundaries (midnight UTC for today, 1 hour ago for hourly). Spike thresholds correctly check `>5` daily and `>3` hourly. Per-guard aggregation uses MongoDB `$group` + `$lookup` pipeline.

### Test Results
- Dashboard spike alert rendering tests pass
- Override stats service unit tests pass
- All existing dashboard tests continue to pass

### New Dependencies
None
