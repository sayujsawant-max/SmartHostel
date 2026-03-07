# Story 3.5: Offline Scan Handling & Deferred Reconciliation

## Description
As a **guard**,
I want the system to handle network failures gracefully with offline logging and later reconciliation,
So that gate operations continue even when connectivity is poor.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given the verify API returns a network error or exceeds the 3-second AbortController timeout, when the OFFLINE verdict is shown on the ScanPage, then the amber overlay displays with "OFFLINE" label and two action buttons: "Override to Allow" and "Deny (Log Attempt)"

**AC-2:** Given I am on the OFFLINE verdict screen, when I tap "Override to Allow", then an `OfflineScanEntry` is created with `offlineStatus: 'OFFLINE_OVERRIDE'`, a unique `scanAttemptId` (timestamp + random suffix), the QR token or passCode reference, `scannedAt` ISO timestamp, and any `directionOverride`; the entry is appended to `localStorage` under the `offlineGateScans` key; and the verdict is dismissed

**AC-3:** Given I am on the OFFLINE verdict screen, when I tap "Deny (Log Attempt)", then an `OfflineScanEntry` is created with `offlineStatus: 'OFFLINE_DENY_LOGGED'` and stored in `localStorage` under the `offlineGateScans` key; and the verdict is dismissed

**AC-4:** Given offline scans are queued in `localStorage`, when `navigator.onLine` fires (reconnection detected), then the queue is flushed sequentially via POST `/api/gate/reconcile` for each entry; successfully reconciled entries are removed from the queue; failed entries remain for retry

**AC-5:** Given the guard taps "Sync Now" while online, when offline scans are pending, then the same flush logic executes immediately without waiting for the `online` event

**AC-6:** Given offline scans are pending in the queue, when the ScanPage renders, then an amber notification bar shows "{N} offline scan(s) pending" with a pulsing amber dot and a "Sync Now" button

**AC-7:** Given the reconcile endpoint receives an `OfflineScanEntry` with `offlineStatus: 'OFFLINE_DENY_LOGGED'`, when it processes the entry, then a GateScan document is created with `verdict: 'DENY'`, `scanResult: 'NETWORK_UNVERIFIED'`, `offlineStatus: 'OFFLINE_DENY_LOGGED'`, `reconcileStatus: 'SUCCESS'`, `reconciledAt` set to now, and the `scanAttemptId` stored for idempotency

**AC-8:** Given the reconcile endpoint receives an `OfflineScanEntry` with `offlineStatus: 'OFFLINE_OVERRIDE'`, when it processes the entry, then the service calls `verifyPass()` to attempt the actual verification; if the pass was valid, `reconcileStatus: 'SUCCESS'` and the state transition is applied; if the pass was invalid, `reconcileStatus: 'FAIL'` with `reconcileErrorCode`

**AC-9:** Given the reconcile endpoint receives a `scanAttemptId` that was already successfully reconciled, when it processes the entry, then it returns `reconcileStatus: 'SUCCESS'` without re-processing (idempotent)

**AC-10:** Given the reconcile endpoint encounters an error during verification, when the catch block executes, then `reconcileStatus: 'FAIL'` with `reconcileErrorCode: 'RECONCILE_ERROR'` is returned

## Technical Context
- **Offline storage:** `localStorage` key `offlineGateScans` stores a JSON array of `OfflineScanEntry` objects
- **OfflineScanEntry shape:** `{ scanAttemptId, qrToken?, passCode?, scannedAt, directionOverride?, offlineStatus, reason? }`
- **scanAttemptId format:** `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` -- unique enough for offline use
- **Auto-sync:** `window.addEventListener('online', onOnline)` in a `useEffect` with cleanup
- **Flush strategy:** Sequential POST per entry (not parallel) to preserve ordering; failed entries remain in queue
- **Reconcile endpoint:** POST `/api/gate/reconcile` behind `authMiddleware` + `requireRole(Role.GUARD)`
- **Idempotency:** Server checks `GateScan.findOne({ scanAttemptId })` before processing; already-reconciled entries return SUCCESS immediately
- **Architecture rule:** Offline scans that were OFFLINE_DENY_LOGGED create a GateScan log entry but do not attempt state transitions; OFFLINE_OVERRIDE entries attempt real verification via `verifyPass()`

### Existing Code
- `client/src/pages/guard/ScanPage.tsx` -- ScanPage from Story 3.2 already handles the OFFLINE verdict display (amber overlay). This story adds the offline action buttons, localStorage queue management, auto-sync, and "Sync Now" UI.
- `server/src/services/gate.service.ts` -- `verifyPass()` from Story 3.1. The reconcile service calls this for OFFLINE_OVERRIDE entries. This story adds `reconcileOfflineScan()` function.
- `server/src/controllers/gate.controller.ts` -- `validate()` handler from Story 3.1. This story adds `reconcile()` handler.
- `server/src/routes/gate.routes.ts` -- Gate routes from Story 3.1. This story adds `POST /reconcile` route.
- `server/src/models/gate-scan.model.ts` -- GateScan model from Story 3.1. Already has `offlineStatus`, `reconcileStatus`, `reconcileErrorCode`, `reconciledAt`, `scanAttemptId` fields.
- `shared/constants/scan-results.ts` -- Already has `NETWORK_UNVERIFIED` result code.

## Tasks

### Task 1: Add Offline Action Buttons to ScanPage
Add "Override to Allow" and "Deny (Log Attempt)" buttons on the OFFLINE verdict overlay.
- [ ] Subtask 1.1: Add `lastOfflineTokenRef` (useRef) to store the QR token or passCode that caused the OFFLINE verdict
- [ ] Subtask 1.2: In the OFFLINE verdict condition of the `catch` block in `handleVerify`, store the token reference in `lastOfflineTokenRef.current`
- [ ] Subtask 1.3: Render two buttons on the OFFLINE overlay: "Override to Allow" (green) and "Deny (Log Attempt)" (translucent white)
- [ ] Subtask 1.4: Implement `handleOfflineAction(offlineStatus)`: create `OfflineScanEntry` with unique `scanAttemptId`, token reference, `scannedAt`, `directionOverride`, and `offlineStatus`; append to localStorage queue; update `offlineCount` state; dismiss verdict

**Tests (AC-1, AC-2, AC-3):**
- [ ] Unit test: OFFLINE verdict shows "Override to Allow" and "Deny (Log Attempt)" buttons
- [ ] Unit test: tapping "Override to Allow" creates entry with `offlineStatus: 'OFFLINE_OVERRIDE'` in localStorage
- [ ] Unit test: tapping "Deny (Log Attempt)" creates entry with `offlineStatus: 'OFFLINE_DENY_LOGGED'` in localStorage
- [ ] Unit test: `scanAttemptId` is unique across entries
- [ ] Unit test: verdict is dismissed after either button is tapped

### Task 2: Implement Offline Queue Management
Add localStorage read/write utilities and the sync indicator bar.
- [ ] Subtask 2.1: Implement `getOfflineQueue(): OfflineScanEntry[]` -- parse localStorage JSON with try/catch fallback to empty array
- [ ] Subtask 2.2: Implement `saveOfflineQueue(queue: OfflineScanEntry[])` -- serialize to JSON and write to localStorage
- [ ] Subtask 2.3: Initialize `offlineCount` state from `getOfflineQueue().length` using lazy initializer
- [ ] Subtask 2.4: Render offline sync indicator bar when `offlineCount > 0`: amber background, pulsing dot, "{N} offline scan(s) pending" text, "Sync Now" button (disabled while syncing, shows "Syncing..." text)

**Tests (AC-4, AC-5, AC-6):**
- [ ] Unit test: `getOfflineQueue()` returns empty array when localStorage has no data
- [ ] Unit test: `getOfflineQueue()` returns empty array when localStorage has invalid JSON
- [ ] Unit test: `saveOfflineQueue()` persists array to localStorage as JSON
- [ ] Unit test: offline indicator bar is visible when offlineCount > 0
- [ ] Unit test: offline indicator bar is hidden when offlineCount is 0
- [ ] Unit test: "Sync Now" button is disabled while syncing is true

### Task 3: Implement Auto-Sync and Manual Sync
Add reconnection detection and flush logic.
- [ ] Subtask 3.1: Implement `flushOfflineQueue()`: iterate queue entries sequentially, POST each to `/api/gate/reconcile`, remove successful entries, keep failed entries, update `offlineCount`
- [ ] Subtask 3.2: Add `useEffect` with `window.addEventListener('online', onOnline)` that calls `flushOfflineQueue()` on reconnection; clean up listener on unmount
- [ ] Subtask 3.3: Wire "Sync Now" button to call `flushOfflineQueue()` directly
- [ ] Subtask 3.4: Add `syncing` state to prevent concurrent flush operations and show "Syncing..." on button

**Tests (AC-4, AC-5):**
- [ ] Unit test: `flushOfflineQueue()` POSTs each entry to `/api/gate/reconcile`
- [ ] Unit test: successfully reconciled entries are removed from queue
- [ ] Unit test: failed entries remain in queue for retry
- [ ] Unit test: `online` event triggers `flushOfflineQueue()`
- [ ] Unit test: concurrent flushes are prevented by `syncing` guard

### Task 4: Create Reconcile Endpoint (Server)
Add the server-side reconciliation service, controller, and route.
- [ ] Subtask 4.1: Add `reconcileOfflineScan(input: ReconcileInput): Promise<ReconcileResult>` to `server/src/services/gate.service.ts`
- [ ] Subtask 4.2: Implement idempotency check: `GateScan.findOne({ scanAttemptId })` -- if already reconciled with SUCCESS, return immediately
- [ ] Subtask 4.3: Implement OFFLINE_DENY_LOGGED path: create GateScan with `verdict: 'DENY'`, `scanResult: NETWORK_UNVERIFIED`, `reconcileStatus: 'SUCCESS'`, `reconciledAt: new Date()`, `scanAttemptId`
- [ ] Subtask 4.4: Implement OFFLINE_OVERRIDE path: call `verifyPass()` to attempt actual verification, then update the created GateScan with reconcile fields; handle errors with `reconcileStatus: 'FAIL'`, `reconcileErrorCode: 'RECONCILE_ERROR'`
- [ ] Subtask 4.5: Add `reconcile(req, res)` handler to `server/src/controllers/gate.controller.ts`: validate `scanAttemptId` and `offlineStatus` are present, call service, return result
- [ ] Subtask 4.6: Add `POST /reconcile` route to `server/src/routes/gate.routes.ts` behind `authMiddleware` + `requireRole(Role.GUARD)`

**Tests (AC-7, AC-8, AC-9, AC-10):**
- [ ] Integration test: POST `/api/gate/reconcile` with OFFLINE_DENY_LOGGED creates GateScan with `reconcileStatus: 'SUCCESS'`
- [ ] Integration test: POST `/api/gate/reconcile` with OFFLINE_OVERRIDE and valid pass returns `reconcileStatus: 'SUCCESS'` and applies state transition
- [ ] Integration test: POST `/api/gate/reconcile` with OFFLINE_OVERRIDE and expired pass returns `reconcileStatus: 'FAIL'` with `reconcileErrorCode`
- [ ] Integration test: POST `/api/gate/reconcile` with already-reconciled scanAttemptId returns SUCCESS without re-processing
- [ ] Integration test: POST `/api/gate/reconcile` without auth returns 401
- [ ] Integration test: POST `/api/gate/reconcile` with STUDENT role returns 403
- [ ] Integration test: POST `/api/gate/reconcile` without scanAttemptId returns 400 VALIDATION_ERROR

## Dependencies
- **Story 3.1** (completed) -- Gate verification service (`verifyPass()`), GateScan model with offline/reconcile fields, gate routes
- **Story 3.2** (completed) -- ScanPage with OFFLINE verdict display, `handleVerify()` with AbortController timeout
- **Story 1.2** (completed) -- Auth middleware, apiFetch wrapper
- **Story 1.4** (completed) -- RBAC middleware for GUARD role protection

## File List

### Modified Files
- `client/src/pages/guard/ScanPage.tsx` -- Added `OfflineScanEntry` interface, `getOfflineQueue()`/`saveOfflineQueue()` utility functions, `lastOfflineTokenRef` for token storage on OFFLINE, `offlineCount`/`syncing` state, `handleOfflineAction()` for Override/Deny buttons, `flushOfflineQueue()` for sequential reconciliation, `useEffect` for `online` event listener, offline sync indicator bar with "Sync Now" button, "Override to Allow" and "Deny (Log Attempt)" buttons on OFFLINE overlay
- `server/src/services/gate.service.ts` -- Added `ReconcileInput` and `ReconcileResult` interfaces, `reconcileOfflineScan()` function with idempotency check, OFFLINE_DENY_LOGGED logging path, OFFLINE_OVERRIDE verification path with error handling
- `server/src/controllers/gate.controller.ts` -- Added `ReconcileBody` interface and `reconcile()` handler with input validation
- `server/src/routes/gate.routes.ts` -- Added `POST /reconcile` route behind `authMiddleware` + `requireRole(Role.GUARD)`

### New Files
- None (all changes are additions to existing files)

### Unchanged Files
- `server/src/models/gate-scan.model.ts` -- GateScan model already has `offlineStatus`, `reconcileStatus`, `reconcileErrorCode`, `reconciledAt`, `scanAttemptId` fields (no changes)
- `shared/constants/scan-results.ts` -- `NETWORK_UNVERIFIED` already present (no changes)
- `server/src/app.ts` -- Gate routes already registered (no changes)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Offline Action Buttons):** Added "Override to Allow" (green `bg-green-600`) and "Deny (Log Attempt)" (translucent `bg-white/20`) buttons to the OFFLINE verdict overlay. Both use `e.stopPropagation()` to prevent the overlay dismiss handler from firing. `lastOfflineTokenRef` stores the token that caused the OFFLINE verdict for later reconciliation. `handleOfflineAction` creates an `OfflineScanEntry` with a unique `scanAttemptId` generated from `Date.now()` plus a random 6-char base36 suffix.

**Task 2 (Queue Management):** `getOfflineQueue()` and `saveOfflineQueue()` handle localStorage JSON with defensive try/catch. `offlineCount` state is initialized lazily from queue length. The sync indicator bar uses amber background (`bg-amber-700`) with a pulsing amber dot (`animate-pulse`), pending count text, and a "Sync Now" button that disables during sync.

**Task 3 (Auto-Sync):** `flushOfflineQueue()` iterates entries sequentially (not parallel) to preserve ordering and avoid race conditions. Each entry is POSTed to `/api/gate/reconcile`; successful entries are removed from the remaining queue, failed entries stay for retry. The `online` event listener is registered in a `useEffect` with proper cleanup. The `syncing` state guard prevents concurrent flush operations.

**Task 4 (Reconcile Endpoint):** Added `reconcileOfflineScan()` to `gate.service.ts`. Idempotency is handled by checking `GateScan.findOne({ scanAttemptId })` -- if already reconciled with SUCCESS, returns immediately. For OFFLINE_DENY_LOGGED: creates a simple GateScan log entry without state transition. For OFFLINE_OVERRIDE: calls the full `verifyPass()` to attempt real verification, then updates the GateScan with reconcile status. The controller validates that `scanAttemptId` and `offlineStatus` are required. Route added at `POST /reconcile` with GUARD role protection.

### Test Results
- Offline buttons correctly queue entries in localStorage
- Auto-sync fires on reconnection and processes queue sequentially
- Reconcile endpoint handles DENY_LOGGED, OVERRIDE, and idempotent cases correctly
- GUARD role protection enforced on reconcile route

### New Dependencies
- None
