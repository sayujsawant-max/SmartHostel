# Story 4.2: Override Notification & Warden Review

## Story

As a **warden**,
I want to be immediately notified when a guard override occurs and review it with full context,
So that I can maintain accountability and identify patterns.

## Status: Draft

## Acceptance Criteria

**AC1:** Given a guard override is recorded, then a notification (OVERRIDE_ALERT) is created for all wardens. (Done in 4.1)

**AC2:** Given I am a WARDEN on the dashboard, when I view "Overrides Pending Review", then I see override cards with student name, scan time, reason, guard note, guard name, method.

**AC3:** Given I view an override card, when I click Mark Reviewed, then PATCH /api/gate/overrides/:id/review marks it reviewed. (Endpoint done in 4.1)

**AC4:** Given no pending overrides, then the widget shows "No overrides pending review".

## Tasks

### Task 1: Build override review section in warden DashboardPage
- Fetch GET /api/gate/overrides on mount
- Display override cards with context
- Mark Reviewed button per card

## Dev Notes
- Backend endpoints already exist from Story 4.1
- Notification creation also done in 4.1 override service
