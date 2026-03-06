# Story 2.4: Student Leave History & Active QR Display

## Story

As a **student**,
I want to view my leave history and display my active QR pass,
So that I can track my leave status and present my pass at the gate.

## Status: Complete

## Acceptance Criteria

**AC1:** Given I am a STUDENT, when I navigate to /student/status, then I see my active and recent leaves as StatusCardV2 components with status badges.

**AC2:** Given I have an APPROVED leave with an active gate pass, when I navigate to /student/actions/show-qr, then I see the QR code at minimum 250x250px, passCode below as fallback, leave window + return time, and a brightness hint.

**AC3:** Given I am on the ShowQRPage, when Wake Lock API is available, then the screen stays awake.

**AC4:** Given I have no active APPROVED pass, when I try to navigate to /student/actions/show-qr, then I see "No active pass" and a link to request a leave.

**AC5:** Given my leave history, when I view completed/rejected/cancelled leaves, then each shows the appropriate status, timestamps, and reason.

## Tasks

### Task 1: Create Gate Pass Controller & Route
**File:** `server/src/controllers/gate-pass.controller.ts`, `server/src/routes/gate-pass.routes.ts`
- GET /api/gate-passes/active — returns the active gate pass for the logged-in student
- Protected: authMiddleware + requireRole(STUDENT)

### Task 2: Create StatusPage (Leave History)
**File:** `client/src/pages/student/StatusPage.tsx`
- Fetches GET /api/leaves and displays leave cards with status badges
- Links to ShowQRPage for active approved leaves

### Task 3: Create ShowQRPage (QR Code Display)
**File:** `client/src/pages/student/ShowQRPage.tsx`
- Fetches GET /api/gate-passes/active
- Renders QR code via qrcode.react at 60% screen width (min 250px)
- Shows passCode as fallback, leave dates, return time
- Wake Lock API integration to keep screen awake
- Brightness hint text
- "No active pass" state with link to request leave

### Task 4: Add Route to App.tsx
- Import ShowQRPage and add /student/actions/show-qr route
- Add qrcode.react dependency to client

## Dev Notes
- Uses qrcode.react (exact version pinned) for QR rendering
- Wake Lock: `navigator.wakeLock.request('screen')` with cleanup on unmount
- passCode displayed with monospace font, large tracking for readability
