# Epic 3: Gate Verification & Scanner

Guards can scan QR codes (or enter passCodes) to verify gate passes with instant full-screen ALLOW/DENY verdicts, with offline fallback and every scan logged.

### Story 3.1: Gate Verification API & Scan Logging

As a **guard**,
I want to verify a gate pass by QR token or passCode and have every attempt logged,
So that the system produces a deterministic ALLOW/DENY result with a complete audit trail.

**Acceptance Criteria:**

**Given** I am a GUARD
**When** I POST `/api/gate/validate` with a valid qrToken
**Then** the server verifies the JWT (QR_SECRET), checks leave status, performs atomic state transition (APPROVED→SCANNED_OUT or SCANNED_OUT→SCANNED_IN), and returns `{ verdict: "ALLOW", student: { name, block }, leaveType, returnBy }`

**Given** a QR token for an expired/cancelled/revoked leave
**When** I verify it
**Then** the server returns the correct denial reason (EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, etc.) with student details where available

**Given** any verification attempt (success or failure)
**When** the verify endpoint processes it
**Then** a GateScan document is created with: verdict, method (QR/PASSCODE), guardId, directionDetected, directionUsed, directionSource (AUTO/MANUAL_ONE_SHOT), lastGateStateBeforeScan, latencyMs, timeoutTriggered, offlineStatus (null for online scans)

**Given** concurrent scans of the same pass
**When** two guards scan simultaneously
**Then** atomic findOneAndUpdate ensures only one transitions the state; the other receives ALREADY_SCANNED_OUT/IN (idempotent)

**Given** the verify endpoint
**When** a duplicate scan within 2s is detected (deterministic key: sha256(token + guardId + directionUsed + 2s-bucket))
**Then** the cached verdict is returned without re-processing

### Story 3.2: Guard Scanner Page & QR Camera

As a **guard**,
I want a full-screen camera scanner that detects QR codes and shows instant ALLOW/DENY results,
So that I can process students at the gate in under 3 seconds.

**Acceptance Criteria:**

**Given** I am a GUARD and logged in
**When** the GuardScannerPage loads
**Then** the camera activates immediately with CameraViewfinder overlay, direction indicator ("Auto: EXIT" / "Auto: ENTRY"), and ShiftPanel (guard name, sync status, shift counters) visible top-right

**Given** a QR code enters the camera frame
**When** html5-qrcode decodes it
**Then** the system calls POST `/api/gate/validate` and displays VerdictScreen within ≤ 3s end-to-end

**Given** the VerdictScreen shows ALLOW
**When** ~1-1.5 seconds pass
**Then** it auto-returns to scanning with no manual tap required
**And** haptic feedback fires (short vibration pulse)

**Given** the VerdictScreen shows DENY
**When** the result displays
**Then** a red full-screen overlay shows "DENY — {Student Name}" with proof line (specific reason + timestamp), [Override] button visible, and double-buzz haptic

**Given** the verify call exceeds 1.5s
**When** the spinner is shown
**Then** "Still verifying..." text appears to keep the guard calm

**Given** the verify call exceeds 3.0s
**When** the timeout triggers
**Then** VerdictScreen shows amber "OFFLINE — Cannot Verify" with timeoutTriggered logged as true

**Given** the GuardScannerPage route
**When** the JS bundle is built
**Then** the route is code-split via React.lazy and the scanner route bundle is < 100KB gzipped (excluding QR library)

### Story 3.3: PassCode Fallback Verification

As a **guard**,
I want to verify a pass by entering a passCode manually when QR scanning fails,
So that I have a reliable fallback for camera issues or glare.

**Acceptance Criteria:**

**Given** camera permission is denied
**When** the scanner page loads
**Then** the camera is hidden and a large passCode input field is shown as primary: "Camera not available — verify by passCode"

**Given** the camera is active but no QR is detected for 5 seconds
**When** the timeout elapses
**Then** a subtle prompt appears: "Having trouble? [Enter PassCode manually]"

**Given** I enter a valid passCode
**When** I submit it
**Then** POST `/api/gate/validate` with `{ passCode }` runs the same verification logic and displays the same VerdictScreen

**Given** I enter passCode attempts
**When** I exceed 5 attempts per minute
**Then** rate limiting kicks in and returns RATE_LIMITED with retryAfterMs
**And** after N consecutive failures: "Too many attempts — wait {minutes} or contact admin"

**Given** the passCode input
**When** I tap it
**Then** it shows a numeric keyboard hint, large input field (56px touch target), suitable for one-handed outdoor use

### Story 3.4: Direction Detection & Manual Override

As a **guard**,
I want the system to auto-detect scan direction (EXIT/ENTRY) based on leave status,
So that I don't have to manually track who is going out vs. coming in.

**Acceptance Criteria:**

**Given** a student's leave is APPROVED (hasn't exited yet)
**When** I scan their pass
**Then** directionDetected = EXIT, the leave transitions APPROVED→SCANNED_OUT, and outLoggedAt is set

**Given** a student's leave is SCANNED_OUT (they've exited)
**When** I scan their pass
**Then** directionDetected = ENTRY, the leave transitions SCANNED_OUT→SCANNED_IN, and inLoggedAt is set

**Given** the direction indicator shows "Auto: EXIT"
**When** I long-press (600ms) on the direction label
**Then** a confirm prompt appears: "Manual ENTRY for next scan only?"
**And** if confirmed, the next scan uses directionUsed = ENTRY with directionSource = MANUAL_ONE_SHOT

**Given** a manual direction override was used for one scan
**When** that scan completes
**Then** the direction automatically resets to Auto mode — manual direction never silently persists

**Given** every scan
**When** the GateScan record is created
**Then** it includes lastGateStateBeforeScan (IN/OUT/UNKNOWN) for full audit reconstruction

### Story 3.5: Offline Scan Handling & Reconciliation

As a **guard**,
I want the system to handle network failures gracefully with offline logging and later reconciliation,
So that gate operations continue even when connectivity is poor.

**Acceptance Criteria:**

**Given** the verify API returns a network error or exceeds 3s timeout
**When** the OFFLINE verdict is shown
**Then** a GateScan is created immediately with offlineStatus = OFFLINE_PRESENTED and reconcileStatus = PENDING (records the attempt even if guard walks away; satisfies PRD OFFLINE_REVIEW_REQUIRED invariant)

**Given** I am on the OFFLINE verdict screen
**When** I tap "Override to Allow"
**Then** the override flow captures reason + note, the scan is stored locally in localStorage (`offlineGateScans` key), and the existing GateScan's offlineStatus is finalized from OFFLINE_PRESENTED to OFFLINE_OVERRIDE (permitted guard-action finalization before sync — see architecture immutability rules)

**Given** I am on the OFFLINE verdict screen
**When** I tap "Deny (Log Attempt)"
**Then** the scan is stored locally with offlineStatus = OFFLINE_DENY_LOGGED

**Given** offline scans are queued in localStorage
**When** navigator.onLine fires (reconnection detected)
**Then** the queue is flushed sequentially to POST `/api/gate/reconcile` with each entry's scanAttemptId for idempotency

**Given** the reconcile endpoint processes an offline scan
**When** the pass was valid at scannedAt time
**Then** reconcileStatus = SUCCESS and the state transition is applied

**Given** the reconcile endpoint processes an offline scan
**When** the pass was expired/cancelled at scannedAt time
**Then** reconcileStatus = FAIL with reconcileErrorCode (e.g., EXPIRED_AT_SCAN_TIME), and the entry is flagged for warden review

**Given** the GuardScannerPage
**When** offline scans are pending
**Then** a "Sync Now" button is visible and the NetworkStatusPill shows "Offline" (amber dot)

---
