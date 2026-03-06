# Story 6.2: Warden Dashboard & KPIs

## Story

As a **warden**,
I want an exception-based dashboard with KPIs, pending items, and system health,
So that I see only what needs my attention in a 5-10 minute daily check.

## Status: Complete

## Acceptance Criteria

**AC1:** NeedsAttentionWidget shows pending leaves, near-breach complaints, breached complaints, overrides pending review, and cron health.

**AC2:** Auto-refreshes every 60 seconds via setInterval.

**AC3:** "All clear" message when all counts are zero.

**AC4:** System health shows cron status (healthy/unhealthy with last run time).

## Tasks

### Task 1: Create dashboard stats service
- Aggregate counts: pending leaves, near-breach (<6h), breached, pending overrides, cron status

### Task 2: Add /admin/dashboard-stats endpoint
- Warden-only, returns all KPI counts

### Task 3: Enhance DashboardPage
- NeedsAttention grid with color-coded tiles linking to relevant pages
- 60-second auto-refresh
- "All clear" state
- Override spike alerts and pending review section (preserved from Story 4.3)
