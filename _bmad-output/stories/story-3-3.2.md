# Story 3.2: Guard Scanner Page & QR Camera

## Story

As a **guard**,
I want a full-screen camera scanner that detects QR codes and shows instant ALLOW/DENY results,
So that I can process students at the gate in under 3 seconds.

## Status: In Progress

## Acceptance Criteria

**AC1:** Given I am a GUARD and logged in, when the GuardScannerPage loads, then the camera activates immediately with html5-qrcode.

**AC2:** Given a QR code enters the camera frame, when html5-qrcode decodes it, then the system calls POST `/api/gate/validate` and displays VerdictScreen within 3s.

**AC3:** Given the VerdictScreen shows ALLOW, when ~1.2 seconds pass, then it auto-returns to scanning with short haptic vibration.

**AC4:** Given the VerdictScreen shows DENY, when the result displays, then a red full-screen overlay shows "DENY" with student name, reason, and double-buzz haptic.

**AC5:** Given the verify call exceeds 1.5s, when the spinner is shown, then "Still verifying..." text appears.

**AC6:** Given the verify call exceeds 3.0s, when the timeout triggers, then VerdictScreen shows amber "OFFLINE" verdict.

## Tasks

### Task 1: Create ScanPage Component
**File:** `client/src/pages/guard/ScanPage.tsx`
- html5-qrcode camera integration with environment-facing camera
- Verdict overlay: green ALLOW, red DENY, amber OFFLINE
- Haptic feedback via navigator.vibrate
- 1.2s auto-return on ALLOW, manual dismiss on DENY
- 3s timeout → OFFLINE verdict
- 1.5s "Still verifying..." indicator
- PassCode fallback input (shown after 5s or on camera error)

### Task 2: Add html5-qrcode Dependency
- `npm install --save-exact html5-qrcode` in client workspace

### Task 3: Add Route to App.tsx
- Import ScanPage and add /guard/scan route

## Dev Notes
- Uses html5-qrcode library for camera QR scanning
- Dedup: lastScanRef prevents re-scanning same QR within session
- PassCode input: 6-digit numeric, shown as fallback
- Haptic: single pulse for ALLOW, double-buzz for DENY/OFFLINE
