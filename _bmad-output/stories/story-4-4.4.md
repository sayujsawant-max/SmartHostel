# Story 4.4: Audit Event System & Correlation Tracking

## Story

As a **warden**,
I want all sensitive actions logged with attribution, timestamps, and correlation IDs,
So that I can trace any action end-to-end for accountability and dispute resolution.

## Status: Complete

## Acceptance Criteria

**AC1:** All auditable actions write an AuditEvent (entityType, entityId, eventType, actorId, actorRole, metadata, correlationId) then a pino log with matching correlationId.

**AC2:** correlation-id.middleware extracts X-Correlation-Id or generates UUID, attaches to req.correlationId, echoes in response header.

**AC3:** AuditEvents are append-only, no TTL, no updates/deletes. Corrections are new events.

**AC4:** Pino logs include correlationId and eventType for cross-referencing.

## Tasks

### Task 1: Add AuditEvent calls to leave lifecycle
- PASS_REQUESTED on leave creation
- LEAVE_APPROVED on approval
- LEAVE_REJECTED on rejection
- LEAVE_CANCELLED on cancellation
- PASS_CORRECTED already exists

### Task 2: Add AuditEvent for gate scan verification
- SCAN_VERIFIED on successful gate scan (ALLOW verdict)

### Task 3: Verify correlation-id middleware
- Already implemented: extracts/generates UUID, echoes in response

## Dev Notes
- AuditEvent model created in Story 2.6
- Correlation-id middleware created in Story 1.x
- Override audit events created in Story 4.1
