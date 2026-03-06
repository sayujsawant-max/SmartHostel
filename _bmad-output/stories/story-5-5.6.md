# Story 5.6: SLA Cron Worker — Reminders & Escalation

## Story

As a **warden**,
I want the system to automatically send SLA reminders and escalate breached complaints,
So that nothing falls through the cracks without manual monitoring.

## Status: Complete

## Acceptance Criteria

**AC1:** Cron worker runs every 10 minutes (server/src/worker/index.ts).

**AC2:** Complaints due within 2 hours get SLA_REMINDER notification to assigned staff.

**AC3:** Breached complaints (dueAt passed) get escalated to CRITICAL, warden notified, ComplaintEvent added.

**AC4:** CronLog created each cycle with result, complaintsReminded, complaintsEscalated, errorMessages.

**AC5:** Health endpoint shows cronOverdue after 20 minutes of no cron runs.

**AC6:** Batched notifications where multiple complaints are near-breach.

## Tasks

### Task 1: Create CronLog model
- jobName, result, complaintsReminded, complaintsEscalated, errorMessages, createdAt

### Task 2: Create SLA worker service
- Near-breach detection (dueAt within 2h) → SLA_REMINDER notifications
- Batched notifications per assignee
- Breach detection (dueAt passed) → escalate to CRITICAL, notify wardens
- ComplaintEvent entries for reminders and breaches
- CronLog entry on each run

### Task 3: Create worker entry point
- server/src/worker/index.ts with node-cron schedule (*/10 * * * *)
- Connects to DB, runs immediately on startup

### Task 4: Update health endpoint
- Add cronOverdue flag (>20 min since last sla-check CronLog)
- Add lastCronRun timestamp
