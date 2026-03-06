# Story 2.6: Post-Exit Pass Correction (Warden)

## Story

As a **warden**,
I want to correct post-exit pass records with a documented reason,
So that I can handle edge cases like wrong scans or administrative errors.

## Status: Complete

## Acceptance Criteria

**AC1:** Given I am a WARDEN viewing a leave that is SCANNED_OUT or SCANNED_IN, when I initiate a correction with a required reason, then PATCH `/api/leaves/:id/correct` transitions the leave to CORRECTED, the reason is stored, and an AuditEvent is created.

**AC2:** Given a correction is made, when the correction is saved, then the original state is preserved in the audit trail (append-only, never overwrite).

**AC3:** Given I am NOT a WARDEN, when I attempt to correct a leave, then the server returns 403 FORBIDDEN.

## Tasks

### Task 1: Create AuditEvent Model
**File:** `server/src/models/audit-event.model.ts`
- Append-only collection (no TTL)
- Fields: entityType, entityId, eventType, actorRole, actorId, metadata (original state snapshot), correlationId

### Task 2: Implement correctLeave in leave.service.ts
**File:** `server/src/services/leave.service.ts`
- Atomic findOneAndUpdate with status condition (SCANNED_OUT or SCANNED_IN)
- Create AuditEvent with PASS_CORRECTED event type
- Store previous state in metadata for audit trail
- Transition leave to CORRECTED status

### Task 3: Add correct controller and route
**File:** `server/src/controllers/leave.controller.ts`, `server/src/routes/leave.routes.ts`
- PATCH /api/leaves/:id/correct — requireRole(WARDEN_ADMIN)
- Request body: `{ reason: string }` (required)

## Dev Notes
- AuditEvent is canonical append-only audit trail per architecture spec
- Metadata stores: `{ previousStatus, reason, correctedBy, correlationId }`
- correlationId from request middleware for traceability
