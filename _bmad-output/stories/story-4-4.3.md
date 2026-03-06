# Story 4.3: Override Spike Tracking

## Story

As a **warden**,
I want the system to track override rates and surface spikes,
So that I can identify guard behavior patterns requiring attention.

## Status: Draft

## Acceptance Criteria

**AC1:** Given >5 overrides in a day OR >3 in an hour, display "Override rate above threshold" alert.

**AC2:** Given normal override rates, no spike alert is shown.

**AC3:** Given override records, aggregate counts per guard per day for pattern visibility.

## Tasks

### Task 1: Add override stats endpoint
**File:** `server/src/services/override.service.ts`
- getOverrideStats: count today, count last hour, per-guard breakdown

### Task 2: Add stats route
**File:** `server/src/controllers/gate.controller.ts`, `server/src/routes/gate.routes.ts`
- GET /api/gate/override-stats — requireRole(WARDEN_ADMIN)

### Task 3: Add spike alert to warden dashboard
**File:** `client/src/pages/warden/DashboardPage.tsx`
- Fetch override stats, show alert if thresholds exceeded
