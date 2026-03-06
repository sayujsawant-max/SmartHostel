# Story 4.1: Guard Override Flow

## Story

As a **guard**,
I want to override a gate denial with a documented reason and note,
So that I can allow a student through in emergencies while maintaining accountability.

## Status: Draft

## Acceptance Criteria

**AC1:** Given I see a DENY or OFFLINE verdict, when I tap Override, then a bottom sheet appears with reason category selector and note field.

**AC2:** Given I select a reason category, when the note field appears, then it is prefilled based on reason and requires minimum 5 characters.

**AC3:** Given I complete the override form, when I tap Confirm, then POST /api/gate/override creates an Override document with reason, note, guardId, method, correlationId.

**AC4:** Given the override is saved, when the response returns, then VerdictScreen shows green ALLOW with "Override" proof line, and an AuditEvent is written.

**AC5:** Given I am NOT a GUARD, the Override button is never rendered.

## Tasks

### Task 1: Create Override Model
**File:** `server/src/models/override.model.ts`
- Fields: leaveId, gatePassId, guardId, studentId, reason, note, method (MANUAL_OVERRIDE/OFFLINE_OVERRIDE), reviewedBy, reviewedAt, correlationId

### Task 2: Create Override Service
**File:** `server/src/services/override.service.ts`
- createOverride: creates Override doc + AuditEvent + Notification for warden

### Task 3: Create Override Controller & Routes
**File:** `server/src/controllers/gate.controller.ts`, `server/src/routes/gate.routes.ts`
- POST /api/gate/override — requireRole(GUARD)

### Task 4: Add Override UI to ScanPage
- Override button on DENY/OFFLINE verdict
- Bottom sheet with reason categories and note field
- Submit and show ALLOW verdict on success

## Dev Notes
- Reason categories: Medical Emergency, Family Emergency, Staff Instruction, Other
- Note prefill template based on selected reason
- Idempotency via correlationId or Idempotency-Key header
