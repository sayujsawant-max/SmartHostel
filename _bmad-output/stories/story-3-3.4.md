# Story 3.4: Direction Detection & Manual Override

## Story

As a **guard**,
I want the system to auto-detect scan direction (EXIT/ENTRY) based on leave status,
So that I don't have to manually track who is going out vs. coming in.

## Status: Draft

## Acceptance Criteria

**AC1:** Given a student's leave is APPROVED, when I scan their pass, then directionDetected = EXIT, leave transitions APPROVED->SCANNED_OUT. (Done in 3.1)

**AC2:** Given a student's leave is SCANNED_OUT, when I scan their pass, then directionDetected = ENTRY, leave transitions SCANNED_OUT->SCANNED_IN. (Done in 3.1)

**AC3:** Given the direction indicator shows "Auto", when I long-press (600ms), then a confirm prompt appears for manual override, and if confirmed the next scan uses the overridden direction with directionSource = MANUAL_ONE_SHOT.

**AC4:** Given a manual direction override was used for one scan, when that scan completes, then the direction resets to Auto mode.

**AC5:** Given every scan, when the GateScan record is created, then it includes lastGateStateBeforeScan. (Done in 3.1)

## Tasks

### Task 1: Add direction indicator and manual override to ScanPage
**File:** `client/src/pages/guard/ScanPage.tsx`
- Show "Auto" direction indicator in header
- Long-press (600ms) triggers override prompt
- Override is one-shot: resets after single scan
- Pass directionOverride to validate API call

### Task 2: Update gate.service.ts to use directionOverride
- Already supports directionOverride in VerifyInput (Done in 3.1)

## Dev Notes
- Backend already supports directionOverride via VerifyInput.directionOverride
- This is purely client-side UI work for the override flow
