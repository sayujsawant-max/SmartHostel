# Story 3.1: Gate Verification API & Scan Logging

## Story

As a **guard**,
I want to verify a gate pass by QR token or passCode and have every attempt logged,
So that the system produces a deterministic ALLOW/DENY result with a complete audit trail.

## Status: Complete

## Acceptance Criteria

**AC1:** Given I am a GUARD, when I POST `/api/gate/validate` with a valid qrToken, then the server verifies the JWT (QR_SECRET), checks leave status, performs atomic state transition, and returns `{ verdict: "ALLOW", student: { name, block }, leaveType, returnBy }`.

**AC2:** Given a QR token for an expired/cancelled/revoked leave, when I verify it, then the server returns the correct denial reason (EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, etc.) with student details where available.

**AC3:** Given any verification attempt, when the verify endpoint processes it, then a GateScan document is created with: verdict, method, guardId, directionDetected, directionUsed, directionSource, lastGateStateBeforeScan, latencyMs, timeoutTriggered, offlineStatus.

**AC4:** Given concurrent scans of the same pass, when two guards scan simultaneously, then atomic findOneAndUpdate ensures only one transitions the state; the other receives ALREADY_SCANNED_OUT/IN.

**AC5:** Given the verify endpoint, when a duplicate scan within 2s is detected (sha256 key), then the cached verdict is returned without re-processing.

## Tasks

### Task 1: Create ScanResult Constants (shared)
**File:** `shared/constants/scan-results.ts`
- VALID, INVALID_SIGNATURE, NOT_FOUND, EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, ALREADY_SCANNED_IN, ALREADY_COMPLETED, RATE_LIMITED, NETWORK_UNVERIFIED

### Task 2: Create GateScan Model
**File:** `server/src/models/gate-scan.model.ts`
- Fields: leaveId, gatePassId, guardId, studentId, verdict, scanResult, method, directionDetected, directionUsed, directionSource, lastGateStateBeforeScan, latencyMs, timeoutTriggered, offlineStatus, reconcileStatus, reconcileErrorCode, reconciledAt

### Task 3: Create Gate Verification Service
**File:** `server/src/services/gate.service.ts`
- verifyPass: JWT verify with QR_SECRET, passCode lookup, direction auto-detection, atomic state transitions, dedup cache (SHA256 2s window), auto-complete on SCANNED_IN, GateScan logging

### Task 4: Create Gate Controller & Routes
**File:** `server/src/controllers/gate.controller.ts`, `server/src/routes/gate.routes.ts`
- POST /api/gate/validate — requireRole(GUARD)

## Dev Notes
- QR token verified with QR_SECRET (not JWT_SECRET)
- Direction auto-detection: APPROVED → EXIT, SCANNED_OUT → ENTRY
- Atomic transitions via findOneAndUpdate with status condition
- Dedup key: sha256(token + guardId + direction + 2s-bucket)
- On SCANNED_IN: auto-complete leave to COMPLETED, gate pass to USED
