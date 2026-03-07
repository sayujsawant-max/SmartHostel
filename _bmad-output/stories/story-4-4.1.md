# Story 4.1: Guard Override Flow

## Description
As a **guard**,
I want to override a gate denial with a documented reason and note,
So that I can allow a student through in emergencies while maintaining accountability.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I see a DENY or OFFLINE verdict on the ScanPage, when I tap the Override button, then a bottom sheet slides up with: a reason category selector (Medical Emergency, Family Emergency, Staff Instruction, Other), a note textarea prefilled based on the selected reason, and a Confirm button

**AC-2:** Given I select "Medical Emergency" as the reason, when the note field appears, then it is prefilled with "Medical emergency -- allowed {EXIT/ENTRY} at {time}" and I can edit it; the note must be at least 5 characters

**AC-3:** Given I complete the override form and tap Confirm, when POST `/api/gate/override` is called with `{ reason, note, method: 'MANUAL_OVERRIDE', leaveId?, gatePassId?, gateScanId?, studentId? }`, then an Override document is created with guardId from auth, correlationId from the request, and the server returns 201 with `{ success: true, data: { overrideId, verdict: 'ALLOW' }, correlationId }`

**AC-4:** Given the override POST succeeds, when the response returns, then the VerdictScreen shows green ALLOW with proof line "Override -- {reason}", auto-dismisses after 1.2 seconds, returns to scanning mode, and an AuditEvent with eventType `SCAN_OVERRIDE_GRANTED` is written server-side

**AC-5:** Given a guard override is saved, when the override service processes it, then a notification with type `OVERRIDE_ALERT` is created for all active WARDEN_ADMIN users, so wardens are immediately informed

**AC-6:** Given I am NOT a GUARD (e.g., STUDENT, WARDEN_ADMIN, MAINTENANCE), when the verdict screen is shown, then the Override button is never rendered -- override is guard-only

**AC-7:** Given I attempt to POST `/api/gate/override` without GUARD role, when the server processes the request, then it returns 403 FORBIDDEN

**AC-8:** Given I submit an override with a note shorter than 5 characters, when the server validates the input, then it returns 400 VALIDATION_ERROR with a message indicating the note minimum length

**AC-9:** Given the OFFLINE verdict is shown, when I tap "Override to Allow", then the override is created with `method: 'MANUAL_OVERRIDE'` (distinct from `OFFLINE_OVERRIDE` used by the offline reconciliation flow)

## Technical Context
- **Tech stack:** Express 5 + TypeScript (server), React 19 + TypeScript (client), Mongoose 8, Tailwind CSS
- **Auth/RBAC:** `authMiddleware` sets `req.user = { _id, role }`, `requireRole(Role.GUARD)` restricts override endpoint
- **Architecture rule:** Controllers never import models directly -- they call services
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields
- **Override method enum:** `MANUAL_OVERRIDE` (guard taps Override on live verdict), `OFFLINE_OVERRIDE` (offline reconciliation flow in Story 3.5)
- **Reason categories:** Medical Emergency, Family Emergency, Staff Instruction, Other
- **Notification type:** `OVERRIDE_ALERT` from `shared/constants/notification-types.ts`
- **Correlation ID:** Extracted from `req.correlationId` (set by correlation-id middleware from Story 4.4)

### Existing Code
**Server:**
- `server/src/models/gate-scan.model.ts` -- GateScan model with verdict, direction, method fields. **Exists from Story 3.1.**
- `server/src/models/gate-pass.model.ts` -- GatePass model with QR token, passCode, status. **Exists from Story 2.4.**
- `server/src/models/audit-event.model.ts` -- AuditEvent model with entityType, entityId, eventType, actorId, actorRole, metadata, correlationId. **Exists from Story 1.1 scaffolding.**
- `server/src/services/gate.service.ts` -- `verifyPass()` with QR/passCode verification, dedup cache, state transitions. **Exists from Story 3.1.**
- `server/src/controllers/gate.controller.ts` -- `validate()` handler for gate scan verification. **Exists from Story 3.1. Needs override, getOverrides, reviewOverride handlers added.**
- `server/src/routes/gate.routes.ts` -- POST `/validate` with GUARD role. **Exists from Story 3.1. Needs override routes added.**
- `server/src/middleware/auth.middleware.ts` -- JWT verification. **Exists and functional.**
- `server/src/middleware/rbac.middleware.ts` -- `requireRole()` factory. **Exists and functional.**
- `server/src/services/notification.service.ts` -- `createNotification()` for in-app notifications. **Exists from Story 6.5.**
- `server/src/models/user.model.ts` -- User model with role, isActive. **Exists and functional.**

**Client:**
- `client/src/pages/guard/ScanPage.tsx` -- QR scanner with verdict overlay (ALLOW/DENY/OFFLINE), offline queue, direction override toggle. **Exists from Story 3.1/3.5. Needs override bottom sheet UI added.**

## Tasks

### Task 1: Create Override Model
Create `server/src/models/override.model.ts` to store override records.
- [ ] Subtask 1.1: Define `IOverride` interface extending Document with fields: leaveId (ObjectId, nullable), gatePassId (ObjectId, nullable), gateScanId (ObjectId, nullable), guardId (ObjectId, required, indexed), studentId (ObjectId, nullable), reason (String, required), note (String, required, minlength 5), method (enum MANUAL_OVERRIDE/OFFLINE_OVERRIDE, required), reviewedBy (ObjectId, nullable), reviewedAt (Date, nullable), correlationId (String, nullable)
- [ ] Subtask 1.2: Configure schema with `collection: 'overrides'`, `timestamps: true`, `strict: true`
- [ ] Subtask 1.3: Add indexes on `createdAt` (descending) and `reviewedAt` (ascending) for query performance
- [ ] Subtask 1.4: Add toJSON transform to strip `__v`

**Tests (AC-3, AC-8):**
- [ ] Unit test: Override.create with valid data creates document with all fields
- [ ] Unit test: Override.create without required fields (reason, note, guardId, method) throws validation error
- [ ] Unit test: Override.create with note shorter than 5 characters throws validation error
- [ ] Unit test: toJSON transform removes `__v`

### Task 2: Create Override Service
Create `server/src/services/override.service.ts` with override business logic.
- [ ] Subtask 2.1: Implement `createOverride(input)` -- creates Override document, writes AuditEvent with eventType `SCAN_OVERRIDE_GRANTED` (entityType: 'Override', actorRole: 'GUARD'), and sends `OVERRIDE_ALERT` notification to all active wardens
- [ ] Subtask 2.2: Find all active wardens via `User.find({ role: 'WARDEN_ADMIN', isActive: true })` and create a notification for each
- [ ] Subtask 2.3: Log override event via pino with correlationId, guardId, reason, method
- [ ] Subtask 2.4: Implement `getPendingOverrides()` -- finds overrides where `reviewedAt: null`, populates guardId (name) and studentId (name, block), sorted by createdAt descending
- [ ] Subtask 2.5: Implement `markReviewed(overrideId, wardenId, correlationId?)` -- updates override with reviewedBy and reviewedAt, writes AuditEvent with eventType `OVERRIDE_REVIEWED`
- [ ] Subtask 2.6: Implement `getOverrideStats()` -- counts overrides today and last hour, detects spikes (>5/day or >3/hour), aggregates per-guard stats with guard names

**Tests (AC-3, AC-4, AC-5):**
- [ ] Unit test: createOverride creates Override document and AuditEvent
- [ ] Unit test: createOverride sends OVERRIDE_ALERT notification to all active wardens
- [ ] Unit test: createOverride logs with correlationId via pino
- [ ] Unit test: getPendingOverrides returns only overrides with null reviewedAt
- [ ] Unit test: markReviewed sets reviewedBy and reviewedAt, creates OVERRIDE_REVIEWED audit event
- [ ] Unit test: markReviewed returns null for non-existent overrideId
- [ ] Unit test: getOverrideStats returns spikeAlert true when today count exceeds 5
- [ ] Unit test: getOverrideStats returns spikeAlert true when hour count exceeds 3
- [ ] Unit test: getOverrideStats returns spikeAlert false when counts are below thresholds

### Task 3: Add Override Endpoints to Gate Controller & Routes
Extend existing gate controller and routes with override endpoints.
- [ ] Subtask 3.1: Add `override(req, res)` handler to `gate.controller.ts` -- validates reason exists and note >= 5 chars, calls `overrideService.createOverride()`, returns 201 with overrideId and verdict 'ALLOW'
- [ ] Subtask 3.2: Add `getOverrides(req, res)` handler -- calls `overrideService.getPendingOverrides()`, returns overrides array
- [ ] Subtask 3.3: Add `getOverrideStats(req, res)` handler -- calls `overrideService.getOverrideStats()`, returns stats
- [ ] Subtask 3.4: Add `reviewOverride(req, res)` handler -- calls `overrideService.markReviewed()` with req.params.id and req.user._id, returns 404 if not found
- [ ] Subtask 3.5: Add routes to `gate.routes.ts`: POST `/override` (GUARD), GET `/overrides` (WARDEN_ADMIN), GET `/override-stats` (WARDEN_ADMIN), PATCH `/overrides/:id/review` (WARDEN_ADMIN)

**Tests (AC-3, AC-4, AC-7, AC-8):**
- [ ] Integration test: POST `/api/gate/override` with GUARD auth and valid data returns 201 with overrideId
- [ ] Integration test: POST `/api/gate/override` with STUDENT auth returns 403
- [ ] Integration test: POST `/api/gate/override` with note < 5 chars returns 400
- [ ] Integration test: POST `/api/gate/override` without reason returns 400
- [ ] Integration test: GET `/api/gate/overrides` with WARDEN_ADMIN auth returns pending overrides
- [ ] Integration test: GET `/api/gate/overrides` with GUARD auth returns 403
- [ ] Integration test: PATCH `/api/gate/overrides/:id/review` with WARDEN_ADMIN marks reviewed
- [ ] Integration test: PATCH `/api/gate/overrides/:nonexistent/review` returns 404

### Task 4: Add Override UI to ScanPage
Add override bottom sheet to the guard scanner page.
- [ ] Subtask 4.1: Add override state management: `showOverride` boolean, `overrideReason` string, `overrideNote` string, `submittingOverride` boolean
- [ ] Subtask 4.2: Show Override button on DENY and OFFLINE verdict screens (guard-only, never rendered for other roles)
- [ ] Subtask 4.3: Build bottom sheet with reason category selector (4 options), note textarea with prefill based on reason (e.g., "Medical emergency -- allowed {direction} at {time}"), and Confirm button
- [ ] Subtask 4.4: On Confirm, POST to `/gate/override` with `method: 'MANUAL_OVERRIDE'`, reason, note, and available context (leaveId, gatePassId, gateScanId, studentId)
- [ ] Subtask 4.5: On success, show green ALLOW verdict with "Override -- {reason}" proof line, auto-dismiss after 1.2s
- [ ] Subtask 4.6: Disable Confirm button while submitting, show error toast on failure

**Tests (AC-1, AC-2, AC-4, AC-6, AC-9):**
- [ ] Unit test: Override button appears on DENY verdict for GUARD role
- [ ] Unit test: Override button appears on OFFLINE verdict for GUARD role
- [ ] Unit test: Override bottom sheet shows 4 reason categories
- [ ] Unit test: Selecting a reason prefills note with appropriate template
- [ ] Unit test: Confirm is disabled when note is fewer than 5 characters
- [ ] Unit test: Successful override shows ALLOW verdict with override proof line

## Dependencies
- **Story 3.1** (completed) -- Gate scan verification endpoint, GateScan model, ScanPage with verdict UI
- **Story 3.5** (completed) -- Offline scan handling with OFFLINE verdict screen
- **Story 6.5** (completed) -- Notification service for OVERRIDE_ALERT delivery
- **Story 4.4** (completed) -- AuditEvent model and correlation-id middleware
- Requires `shared/constants/notification-types.ts` to include OVERRIDE_ALERT

## File List

### Modified Files
- `server/src/controllers/gate.controller.ts` -- Added override, getOverrides, getOverrideStats, reviewOverride handlers
- `server/src/routes/gate.routes.ts` -- Added POST /override (GUARD), GET /overrides (WARDEN_ADMIN), GET /override-stats (WARDEN_ADMIN), PATCH /overrides/:id/review (WARDEN_ADMIN)
- `client/src/pages/guard/ScanPage.tsx` -- Added override bottom sheet UI with reason selector, note field, and submission logic

### New Files
- `server/src/models/override.model.ts` -- Override Mongoose model with IOverride interface, indexes on createdAt and reviewedAt
- `server/src/services/override.service.ts` -- createOverride (with audit + notifications), getPendingOverrides, markReviewed, getOverrideStats

### Unchanged Files
- `server/src/models/audit-event.model.ts` -- AuditEvent model already supports override events
- `server/src/models/gate-scan.model.ts` -- GateScan model unchanged
- `server/src/middleware/auth.middleware.ts` -- JWT verification unchanged
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory unchanged
- `server/src/services/notification.service.ts` -- createNotification already functional

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Override Model):** Created `override.model.ts` with IOverride interface. Schema includes refs to Leave, GatePass, GateScan, and User (guard/student). Method enum restricts to MANUAL_OVERRIDE and OFFLINE_OVERRIDE. Note field has minlength 5 validation. Indexes on createdAt (desc) and reviewedAt (asc) for pending query performance.

**Task 2 (Override Service):** `createOverride` creates Override doc, writes `SCAN_OVERRIDE_GRANTED` audit event, and broadcasts `OVERRIDE_ALERT` notification to all active wardens. `getPendingOverrides` queries where `reviewedAt: null` with guard/student population. `markReviewed` atomically updates reviewer attribution and writes `OVERRIDE_REVIEWED` audit event. `getOverrideStats` uses MongoDB date aggregation for today/hour counts with per-guard breakdown.

**Task 3 (Controller & Routes):** Extended gate controller with 4 new handlers. Override endpoint validates reason presence and note length before delegating to service. Review endpoint returns 404 if override not found. All routes protected by auth + RBAC middleware.

**Task 4 (ScanPage Override UI):** Added bottom sheet overlay on DENY/OFFLINE verdicts with reason category selector (4 options), note textarea with reason-based prefill templates, and Confirm button. Successful override shows green ALLOW verdict with "Override -- {reason}" proof line and 1.2s auto-dismiss.

### Test Results
- Override model validation tests pass
- Override service unit tests pass (create, review, stats, spike detection)
- Gate controller integration tests pass (RBAC, validation, happy path)
- All existing gate scan tests continue to pass

### New Dependencies
None -- uses existing Express, Mongoose, notification service, and audit event infrastructure.
