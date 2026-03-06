# Story 3.5: Offline Scan Handling & Reconciliation

## Story

As a **guard**,
I want the system to handle network failures gracefully with offline logging and later reconciliation,
So that gate operations continue even when connectivity is poor.

## Status: Draft

## Acceptance Criteria

**AC1:** Given the verify API returns a network error or exceeds 3s timeout, when the OFFLINE verdict is shown, then a GateScan is created with offlineStatus = OFFLINE_PRESENTED and reconcileStatus = PENDING.

**AC2:** Given I am on the OFFLINE verdict screen, when I tap "Override to Allow", then the scan is stored in localStorage (offlineGateScans key) and offlineStatus = OFFLINE_OVERRIDE.

**AC3:** Given I am on the OFFLINE verdict screen, when I tap "Deny (Log Attempt)", then the scan is stored locally with offlineStatus = OFFLINE_DENY_LOGGED.

**AC4:** Given offline scans are queued in localStorage, when navigator.onLine fires (reconnection), then the queue is flushed to POST /api/gate/reconcile.

**AC5:** Given the reconcile endpoint processes an offline scan, when the pass was valid at scannedAt, then reconcileStatus = SUCCESS.

**AC6:** Given the reconcile endpoint processes an offline scan, when the pass was invalid at scannedAt, then reconcileStatus = FAIL with reconcileErrorCode.

**AC7:** Given the GuardScannerPage, when offline scans are pending, then a "Sync Now" button and offline indicator are visible.

## Tasks

### Task 1: Add offline scan storage to ScanPage
- Store offline scans in localStorage under offlineGateScans key
- Add "Override to Allow" and "Deny (Log)" buttons on OFFLINE verdict
- Show pending sync count and "Sync Now" button

### Task 2: Add online/offline detection and auto-sync
- Listen for navigator.onLine events
- Auto-flush queue on reconnection
- Sequential POST to /api/gate/reconcile

### Task 3: Create reconcile endpoint
**File:** `server/src/services/gate.service.ts`, `server/src/controllers/gate.controller.ts`, `server/src/routes/gate.routes.ts`
- POST /api/gate/reconcile — processes offline scan entries
- Validates pass state at scannedAt time
- Updates GateScan reconcileStatus

## Dev Notes
- Offline scans stored as JSON array in localStorage
- Each entry: { id, qrToken/passCode, guardId, scannedAt, directionOverride, offlineStatus, reason }
- Reconcile is idempotent via scanAttemptId
