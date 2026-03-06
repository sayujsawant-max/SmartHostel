# Story 3.3: PassCode Fallback Verification

## Story

As a **guard**,
I want to verify a pass by entering a passCode manually when QR scanning fails,
So that I have a reliable fallback for camera issues or glare.

## Status: Draft

## Acceptance Criteria

**AC1:** Given camera permission is denied, when the scanner page loads, then a large passCode input is shown as primary with "Camera not available" message. (Done in 3.2)

**AC2:** Given the camera is active but no QR detected for 5s, when the timeout elapses, then a prompt appears: "Having trouble? Enter PassCode manually". (Done in 3.2)

**AC3:** Given I enter a valid passCode, when I submit it, then POST `/api/gate/validate` with `{ passCode }` runs verification and displays VerdictScreen. (Done in 3.2)

**AC4:** Given I enter passCode attempts, when I exceed 5 attempts per minute, then rate limiting returns RATE_LIMITED with retryAfterMs.

**AC5:** Given the passCode input, when I tap it, then it shows numeric keyboard, large input field suitable for one-handed outdoor use. (Done in 3.2)

## Tasks

### Task 1: Add passCode rate limiting middleware
**File:** `server/src/middleware/rate-limit.middleware.ts` (update)
- Add passCode-specific rate limiter: 5 attempts per minute per guardId
- Return RATE_LIMITED scan result with retryAfterMs

### Task 2: Apply rate limiter to gate validate endpoint
**File:** `server/src/routes/gate.routes.ts`
- Apply passCode rate limit when request body contains passCode

### Task 3: Handle RATE_LIMITED on client
**File:** `client/src/pages/guard/ScanPage.tsx`
- Show "Too many attempts" message with countdown timer

## Dev Notes
- Most UI work already completed in Story 3.2
- Rate limiting is the primary new functionality
- Use express-rate-limit or in-memory Map with sliding window
