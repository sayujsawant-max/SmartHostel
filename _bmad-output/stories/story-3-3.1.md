# Story 3.1: GateScan Model & Verification Endpoint

## Description
As a **guard**,
I want to verify a gate pass by QR token or passCode and have every attempt logged,
So that the system produces a deterministic ALLOW/DENY result with a complete audit trail.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a GUARD, when I POST `/api/gate/validate` with a valid `qrToken`, then the server verifies the JWT using `QR_SECRET`, looks up the GatePass by `leaveId + jti`, checks leave status, performs an atomic state transition (APPROVED to SCANNED_OUT or SCANNED_OUT to SCANNED_IN), and returns `{ success: true, data: { verdict: "ALLOW", student: { name, block }, leaveType, returnBy } }`

**AC-2:** Given a QR token for an expired leave, when I POST `/api/gate/validate`, then the server returns `{ verdict: "DENY", scanResult: "EXPIRED" }` with student details where available

**AC-3:** Given a QR token for a cancelled leave, when I POST `/api/gate/validate`, then the server returns `{ verdict: "DENY", scanResult: "CANCELLED" }` with student details where available

**AC-4:** Given a QR token for a leave already in SCANNED_OUT state and direction is EXIT, when I POST `/api/gate/validate`, then the server returns `{ verdict: "DENY", scanResult: "ALREADY_SCANNED_OUT" }`

**AC-5:** Given a QR token for a completed leave, when I POST `/api/gate/validate`, then the server returns `{ verdict: "DENY", scanResult: "ALREADY_COMPLETED" }`

**AC-6:** Given any verification attempt (success or failure), when the verify endpoint processes it, then a GateScan document is created with: `verdict`, `scanResult`, `method` (QR/PASSCODE), `guardId`, `directionDetected`, `directionUsed`, `directionSource` (AUTO/MANUAL_ONE_SHOT), `lastGateStateBeforeScan`, `latencyMs`, `timeoutTriggered`, `offlineStatus` (null for online scans)

**AC-7:** Given concurrent scans of the same pass by two guards, when both POST `/api/gate/validate` simultaneously, then `findOneAndUpdate` with status condition ensures only one transitions the state; the other receives ALREADY_SCANNED_OUT or ALREADY_SCANNED_IN

**AC-8:** Given a duplicate scan within 2 seconds (same token + guardId + direction + 2s time bucket), when the verify endpoint is called, then the SHA-256 dedup cache returns the previously cached verdict without re-processing

**AC-9:** Given neither `qrToken` nor `passCode` is provided in the request body, when I POST `/api/gate/validate`, then the server returns 400 with `VALIDATION_ERROR`

**AC-10:** Given a passCode for an active, non-expired gate pass, when I POST `/api/gate/validate` with `{ passCode }`, then the same verification logic runs and returns the correct verdict

**AC-11:** Given a successful ENTRY scan (SCANNED_OUT to SCANNED_IN), when the state transition completes, then the leave is auto-completed to COMPLETED and the gate pass status is set to USED

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 8, jsonwebtoken, node:crypto (SHA-256 for dedup)
- **Auth strategy:** Route protected by `authMiddleware` + `requireRole(Role.GUARD)`
- **QR verification:** JWT signed with `env.QR_SECRET` (not JWT_SECRET); payload contains `{ leaveRequestId, jti }`
- **Direction auto-detection:** APPROVED leave status implies EXIT; SCANNED_OUT implies ENTRY
- **Atomic transitions:** `Leave.findOneAndUpdate` with status precondition ensures concurrency safety
- **Dedup:** In-memory `Map<string, { result, timestamp }>` with 2-second sliding window; key = sha256(token + guardId + direction + bucket)
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields, UPPER_SNAKE_CASE for constants
- **Architecture rule:** Controllers never import models directly; they call services

### Existing Code
Story 3.1 was the first story in Epic 3. The following pre-existing files from Epics 1 and 2 were relevant:

- `server/src/models/gate-pass.model.ts` -- GatePass model with `leaveId`, `studentId`, `qrToken`, `passCode`, `jti`, `status`, `expiresAt`, `lastGateState` fields. Created in Epic 2 (Story 2.3). Used as lookup target for verification.
- `shared/constants/gate-pass-status.ts` -- `GatePassStatus` enum: ACTIVE, USED, EXPIRED, CANCELLED. Exists from Epic 2.
- `shared/constants/leave-status.ts` -- `LeaveStatus` enum: PENDING, APPROVED, REJECTED, CANCELLED, SCANNED_OUT, SCANNED_IN, COMPLETED, EXPIRED, REVOKED, CORRECTED. Exists from Epic 2.
- `server/src/middleware/auth.middleware.ts` -- JWT verification middleware. Exists from Story 1.2.
- `server/src/middleware/rbac.middleware.ts` -- `requireRole()` factory. Exists from Story 1.4.
- `server/src/models/audit-event.model.ts` -- AuditEvent model for logging SCAN_VERIFIED events. Exists from Story 1.3.
- `server/src/utils/app-error.ts` -- AppError class. Exists from Story 1.1.
- `server/src/utils/logger.ts` -- Pino logger. Exists from Story 1.7.
- `server/src/config/env.ts` -- Environment config including `QR_SECRET`. Exists from Story 1.1.
- `server/src/app.ts` -- Express app; gate routes registered as `app.use('/api/gate', gateRoutes)`.

## Tasks

### Task 1: Create ScanResult Constants
Create the shared constants file for all possible scan result codes.
- [ ] Subtask 1.1: Create `shared/constants/scan-results.ts` with `ScanResult` const object: VALID, INVALID_SIGNATURE, NOT_FOUND, EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, ALREADY_SCANNED_IN, ALREADY_COMPLETED, NETWORK_UNVERIFIED, NOT_YET_VALID, RATE_LIMITED
- [ ] Subtask 1.2: Export `ScanResult` type as `(typeof ScanResult)[keyof typeof ScanResult]`
- [ ] Subtask 1.3: Re-export `ScanResult` from `shared/index.ts`

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5):**
- [ ] Unit test: ScanResult.VALID equals 'VALID' (type-level verification)
- [ ] Unit test: all expected scan result codes are present in the ScanResult object

### Task 2: Create GateScan Model
Create the Mongoose model for logging every scan attempt.
- [ ] Subtask 2.1: Create `server/src/models/gate-scan.model.ts` with `IGateScan` interface: `leaveId`, `gatePassId`, `guardId`, `studentId`, `verdict` (ALLOW/DENY/OFFLINE), `scanResult`, `method` (QR/PASSCODE), `directionDetected` (ENTRY/EXIT/null), `directionUsed`, `directionSource` (AUTO/MANUAL_ONE_SHOT), `lastGateStateBeforeScan` (IN/OUT/UNKNOWN), `latencyMs`, `timeoutTriggered`, `offlineStatus` (OFFLINE_PRESENTED/OFFLINE_DENY_LOGGED/OFFLINE_OVERRIDE/null), `reconcileStatus` (PENDING/SUCCESS/FAIL/null), `reconcileErrorCode`, `reconciledAt`, `scanAttemptId`, timestamps
- [ ] Subtask 2.2: Add indexes on `guardId`, `leaveId`, `createdAt` (descending)
- [ ] Subtask 2.3: Configure `toJSON` transform to strip `__v`
- [ ] Subtask 2.4: Set `collection: 'gateScans'`, `strict: true`

**Tests (AC-6):**
- [ ] Unit test: GateScan model validates required fields (`guardId`, `verdict`, `scanResult`, `method`, `latencyMs`)
- [ ] Unit test: GateScan model rejects invalid `verdict` enum value
- [ ] Unit test: GateScan model defaults `offlineStatus`, `reconcileStatus` to null

### Task 3: Create Gate Verification Service
Implement the core verification logic with atomic state transitions and dedup.
- [ ] Subtask 3.1: Create `server/src/services/gate.service.ts` with `verifyPass(input: VerifyInput): Promise<VerifyResult>` function
- [ ] Subtask 3.2: Implement QR token path: verify JWT with `env.QR_SECRET`, extract `leaveRequestId` and `jti`, look up GatePass by `{ leaveId, jti }`
- [ ] Subtask 3.3: Implement passCode path: look up GatePass by `{ passCode, status: ACTIVE, expiresAt: { $gt: now } }`
- [ ] Subtask 3.4: Implement gate pass status checks: CANCELLED returns CANCELLED, EXPIRED or past expiresAt returns EXPIRED
- [ ] Subtask 3.5: Implement SHA-256 dedup cache: `makeDedupeKey(token, guardId, direction)` using 2-second time buckets; check cache before leave lookup
- [ ] Subtask 3.6: Implement direction auto-detection: APPROVED implies EXIT, SCANNED_OUT implies ENTRY; respect `directionOverride` from input
- [ ] Subtask 3.7: Implement atomic state transitions via `Leave.findOneAndUpdate` with status precondition; handle concurrent scan failure (check current state, return appropriate DENY result)
- [ ] Subtask 3.8: Implement auto-complete on SCANNED_IN: update leave to COMPLETED, gate pass to USED
- [ ] Subtask 3.9: Implement `logScan()` helper: create GateScan document with all fields; log via pino logger
- [ ] Subtask 3.10: Create AuditEvent with `eventType: 'SCAN_VERIFIED'` on successful ALLOW verdicts

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-11):**
- [ ] Integration test: verifyPass with valid QR token for APPROVED leave returns ALLOW with student name, block, leaveType, returnBy
- [ ] Integration test: verifyPass with expired gate pass returns DENY with EXPIRED scanResult
- [ ] Integration test: verifyPass with cancelled gate pass returns DENY with CANCELLED scanResult
- [ ] Integration test: verifyPass with SCANNED_OUT leave + EXIT direction returns DENY with ALREADY_SCANNED_OUT
- [ ] Integration test: verifyPass with COMPLETED leave returns DENY with ALREADY_COMPLETED
- [ ] Integration test: verifyPass creates GateScan document for every attempt (success and failure)
- [ ] Unit test: makeDedupeKey produces consistent SHA-256 hex digest for same inputs within same 2s bucket
- [ ] Unit test: dedup cache returns cached result within 2s window
- [ ] Integration test: concurrent verifyPass calls -- only one transitions state, other gets DENY
- [ ] Integration test: SCANNED_IN auto-completes leave to COMPLETED and gate pass to USED

### Task 4: Create Gate Controller & Routes
Wire up the HTTP layer with validation and role protection.
- [ ] Subtask 4.1: Create `server/src/controllers/gate.controller.ts` with `validate(req, res)` handler: validate that either `qrToken` or `passCode` is present, call `gateService.verifyPass()`, return standard response envelope
- [ ] Subtask 4.2: Create `server/src/routes/gate.routes.ts` with `POST /validate` route behind `authMiddleware` + `requireRole(Role.GUARD)`
- [ ] Subtask 4.3: Register gate routes in `server/src/app.ts` as `app.use('/api/gate', gateRoutes)`

**Tests (AC-1, AC-9, AC-10):**
- [ ] Integration test: POST `/api/gate/validate` with valid GUARD auth + valid qrToken returns 200 with `{ success: true, data: { verdict: "ALLOW" } }`
- [ ] Integration test: POST `/api/gate/validate` without auth returns 401
- [ ] Integration test: POST `/api/gate/validate` with STUDENT role returns 403
- [ ] Integration test: POST `/api/gate/validate` with neither qrToken nor passCode returns 400 VALIDATION_ERROR
- [ ] Integration test: POST `/api/gate/validate` with invalid QR signature returns `{ verdict: "DENY", scanResult: "INVALID_SIGNATURE" }`

## Dependencies
- **Story 2.3** (completed) -- GatePass model, gate pass issuance, QR token generation with QR_SECRET
- **Story 2.1** (completed) -- Leave model with status field and LeaveStatus constants
- **Story 1.4** (completed) -- RBAC middleware (`requireRole`)
- **Story 1.2** (completed) -- Auth middleware, JWT verification
- **Story 1.3** (completed) -- AuditEvent model, error handling standards
- Requires MongoDB running locally (or via `MONGODB_URI`)
- Requires `QR_SECRET` env var set (min 32 chars)

## File List

### Modified Files
- `server/src/app.ts` -- Added `import gateRoutes` and `app.use('/api/gate', gateRoutes)` registration
- `shared/index.ts` -- Re-exported `ScanResult` from `shared/constants/scan-results.ts`

### New Files
- `shared/constants/scan-results.ts` -- ScanResult const object with 11 result codes and derived type
- `server/src/models/gate-scan.model.ts` -- GateScan Mongoose model with 20 fields, indexes on guardId/leaveId/createdAt, toJSON transform
- `server/src/services/gate.service.ts` -- `verifyPass()` with QR/passCode verification, atomic transitions, dedup cache, `logScan()` helper, `getScanResultForStatus()` mapper
- `server/src/controllers/gate.controller.ts` -- `validate()` handler with input validation
- `server/src/routes/gate.routes.ts` -- POST `/validate` route with authMiddleware + requireRole(GUARD)

### Unchanged Files
- `server/src/models/gate-pass.model.ts` -- GatePass model used for lookups (no changes)
- `shared/constants/gate-pass-status.ts` -- GatePassStatus enum (no changes)
- `shared/constants/leave-status.ts` -- LeaveStatus enum (no changes)
- `server/src/middleware/auth.middleware.ts` -- JWT verification (no changes)
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory (no changes)
- `server/src/models/audit-event.model.ts` -- AuditEvent model (no changes)
- `server/src/config/env.ts` -- QR_SECRET already configured (no changes)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (ScanResult Constants):** Created `shared/constants/scan-results.ts` with 11 scan result codes as a const object with derived TypeScript type. Re-exported from `shared/index.ts`.

**Task 2 (GateScan Model):** Created `server/src/models/gate-scan.model.ts` with the full IGateScan interface (20 fields). Added indexes on `guardId`, `leaveId`, and `createdAt` (descending). Configured `toJSON` to strip `__v`. Collection name set to `gateScans` with strict mode.

**Task 3 (Gate Verification Service):** Implemented `verifyPass()` in `server/src/services/gate.service.ts` with two paths (QR token via JWT verify with QR_SECRET, and passCode via direct lookup). Added SHA-256 dedup cache with 2-second sliding window using time-bucket keys. Implemented atomic state transitions via `Leave.findOneAndUpdate` with status preconditions. On SCANNED_IN, auto-completes leave to COMPLETED and gate pass to USED. Every attempt creates a GateScan document via `logScan()`. Successful ALLOW verdicts also create an AuditEvent with `eventType: 'SCAN_VERIFIED'`.

**Task 4 (Controller & Routes):** Created controller with `validate()` handler that validates input (requires either qrToken or passCode), delegates to service, and returns standard envelope. Created routes with `authMiddleware` and `requireRole(Role.GUARD)`. Registered in `app.ts` at `/api/gate`.

### Test Results
- Gate verification service tests: all passing
- Controller integration tests: all passing

### New Dependencies
- None (jsonwebtoken and node:crypto already available)
