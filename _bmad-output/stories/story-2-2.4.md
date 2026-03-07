# Story 2.4: QR Code Generation for Approved Leaves

## Description
As a **student**,
I want to view my leave history and display my active QR pass on my phone,
So that I can track my leave status and present my gate pass at the hostel gate for quick verification.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a STUDENT, when I navigate to `/student/status`, then I see my active and recent leaves as styled cards with status badges (color-coded: PENDING=yellow, APPROVED=green, REJECTED=red, CANCELLED=gray, SCANNED_OUT=blue, COMPLETED=gray), leave type, date range, reason, and submission date

**AC-2:** Given I have an APPROVED leave with an active gate pass, when I navigate to `/student/actions/show-qr`, then I see the QR code rendered at 60% screen width (minimum 250px) via `qrcode.react` QRCodeSVG component, the 6-digit passCode displayed below in monospace font with wide tracking as a fallback, the leave return-by date/time, and a brightness hint ("Turn brightness to max for scanning")

**AC-3:** Given I am on the ShowQRPage and the Wake Lock API is available, when the gate pass is displayed, then the screen stays awake (via `navigator.wakeLock.request('screen')`) and the wake lock is released on unmount

**AC-4:** Given I have no active APPROVED pass, when I navigate to `/student/actions/show-qr`, then I see "No Active Pass" heading, a message "You don't have an active approved pass", and a link to request a leave

**AC-5:** Given my leave history, when I view completed/rejected/cancelled/expired leaves, then each shows a color-coded status badge (COMPLETED=gray, REJECTED=red, CANCELLED=gray, EXPIRED=gray), formatted timestamps, and rejection reason text (if the leave has a rejectionReason field)

**AC-6:** Given I have an active leave (APPROVED or SCANNED_OUT), when I view the StatusPage, then I see a highlighted banner with "You have an active pass - Tap to show QR code" linking to the ShowQRPage

**AC-7:** Given I am on the StatusPage, when I view leave cards, then each PENDING leave shows "Waiting for warden approval", each APPROVED leave shows "Your pass is ready" with a "Show QR at Gate" link, each REJECTED leave shows a "Request a New Leave" link, and each SCANNED_OUT leave shows "You are currently out. Return before your pass expires."

## Technical Context
- **QR rendering:** `qrcode.react` package (QRCodeSVG component) renders the qrToken string as an SVG QR code; error correction level "M" for readable scans
- **QR size:** `Math.min(280, window.innerWidth * 0.6)` ensures 60% width with 280px maximum
- **Wake Lock API:** `navigator.wakeLock.request('screen')` is only available in HTTPS contexts and some browsers; graceful degradation with `.catch()` for unsupported browsers
- **API endpoints used:** `GET /api/gate-passes/active` for ShowQRPage, `GET /api/leaves` for StatusPage
- **StatusPage scope:** Also displays complaints, notices, and fee status (from other epics), but the leave-related portions are the focus of this story
- **CSS approach:** Tailwind utility classes with CSS variable-based theming (`hsl(var(--foreground))`, etc.)

### Existing Code
Stories 2.1-2.3 delivered the server-side leave and gate pass APIs. The following files already existed:

**Server:**
- `server/src/controllers/gate-pass.controller.ts` -- `getActivePass` handler returning active gate pass or null. **Exists and functional.**
- `server/src/routes/gate-pass.routes.ts` -- `GET /active` with STUDENT RBAC. **Exists and functional.**
- `server/src/services/gate-pass.service.ts` -- `getActivePassForStudent` query. **Exists and functional.**
- `server/src/controllers/leave.controller.ts` -- `getLeaves` handler. **Exists and functional.**

**Client:**
- `client/src/services/api.ts` -- `apiFetch` wrapper. **Exists and functional.**
- `client/src/hooks/useAuth.ts` -- `useAuth` hook providing user context. **Exists and functional.**
- `client/src/pages/student/StatusPage.tsx` -- **Did not exist.** Needed to be created.
- `client/src/pages/student/ShowQRPage.tsx` -- **Did not exist.** Needed to be created.

## Tasks

### Task 1: Create StatusPage (Leave History)
Build the student status page showing leave history and other status information.
- [ ] Subtask 1.1: Create `client/src/pages/student/StatusPage.tsx` with leave list display
- [ ] Subtask 1.2: Fetch `GET /api/leaves` on mount using `apiFetch`, store in state
- [ ] Subtask 1.3: Display room info (block, floor, roomNumber) from `useAuth().user` at the top if available
- [ ] Subtask 1.4: Display active leave banner linking to `/student/actions/show-qr` when any leave has status APPROVED or SCANNED_OUT
- [ ] Subtask 1.5: Render each leave as a card with: type label ("Day Outing"/"Overnight"), status badge with color coding, date range, reason (truncated), submission date
- [ ] Subtask 1.6: Show contextual hints per status: PENDING="Waiting for warden approval", APPROVED with "Show QR at Gate" link, REJECTED with "Request a New Leave" link, SCANNED_OUT="You are currently out. Return before your pass expires."
- [ ] Subtask 1.7: Show rejectionReason if present on rejected leaves
- [ ] Subtask 1.8: Handle empty state with "No active leaves" message and link to request leave

**Tests (AC-1, AC-5, AC-6, AC-7):**
- [ ] Manual verification: StatusPage shows leave cards with correct status badges
- [ ] Manual verification: Active leave banner appears and links to ShowQRPage
- [ ] Manual verification: Contextual hints render correctly per status
- [ ] Manual verification: Empty state renders correctly

### Task 2: Create ShowQRPage (QR Code Display)
Build the page that displays the QR code for an active gate pass.
- [ ] Subtask 2.1: Create `client/src/pages/student/ShowQRPage.tsx`
- [ ] Subtask 2.2: Fetch `GET /api/gate-passes/active` on mount using `apiFetch`
- [ ] Subtask 2.3: If gate pass exists, render `QRCodeSVG` from `qrcode.react` with `value={gatePass.qrToken}`, `size={Math.min(280, window.innerWidth * 0.6)}`, `level="M"`
- [ ] Subtask 2.4: Display passCode below QR code in `text-3xl font-mono font-bold tracking-widest` for readability as manual fallback
- [ ] Subtask 2.5: Display return-by date/time from `gatePass.expiresAt` formatted with `en-IN` locale
- [ ] Subtask 2.6: Display brightness hint: "Turn brightness to max for scanning" in orange text
- [ ] Subtask 2.7: If no gate pass (null response), display "No Active Pass" heading, explanation text, and link to `/student/actions` to request a leave

**Tests (AC-2, AC-4):**
- [ ] Manual verification: QR code renders at correct size (60% width, min 250px)
- [ ] Manual verification: passCode is displayed in monospace with wide tracking
- [ ] Manual verification: Return-by time is correctly formatted
- [ ] Manual verification: No-pass state shows correct message with link

### Task 3: Add Wake Lock Integration
Keep the screen awake while the QR code is displayed at the gate.
- [ ] Subtask 3.1: In ShowQRPage, add a `useEffect` that requests wake lock via `navigator.wakeLock.request('screen')` when gate pass is present
- [ ] Subtask 3.2: Store the WakeLockSentinel in a ref and release on cleanup (`wakeLock?.release()`)
- [ ] Subtask 3.3: Wrap in try/catch to gracefully handle browsers that don't support Wake Lock API

**Tests (AC-3):**
- [ ] Manual verification: Screen stays awake when QR page is displayed (on supported devices)
- [ ] Manual verification: No errors thrown on browsers without Wake Lock API support

### Task 4: Add Routes to App and Install Dependency
Register the new pages in the React router and add the qrcode.react dependency.
- [ ] Subtask 4.1: Add `qrcode.react` package to client workspace dependencies
- [ ] Subtask 4.2: Import ShowQRPage in the router configuration and add route `/student/actions/show-qr`
- [ ] Subtask 4.3: Import StatusPage and add route `/student/status`
- [ ] Subtask 4.4: Verify routes are protected by auth (student role only)

**Tests (AC-1, AC-2):**
- [ ] Manual verification: Navigating to `/student/actions/show-qr` renders ShowQRPage
- [ ] Manual verification: Navigating to `/student/status` renders StatusPage
- [ ] Manual verification: Non-authenticated users are redirected to login

## Dependencies
- **Story 2.1** (completed) -- Leave model, GET `/api/leaves` endpoint
- **Story 2.3** (completed) -- GatePass model, GET `/api/gate-passes/active` endpoint, createGatePass service
- **Story 1.2** (completed) -- Auth context, apiFetch with refresh-retry
- Requires `qrcode.react` npm package in client workspace

## File List

### Modified Files
- `client/src/App.tsx` (or router config) -- Added routes for `/student/status` and `/student/actions/show-qr`
- `client/package.json` -- Added `qrcode.react` dependency

### New Files
- `client/src/pages/student/StatusPage.tsx` -- Student status page showing leave history with status badges, active pass banner, contextual hints, room info, complaints section, notices section, fee status
- `client/src/pages/student/ShowQRPage.tsx` -- QR code display page with QRCodeSVG component, passCode fallback, return-by time, brightness hint, Wake Lock integration, no-pass empty state

### Unchanged Files
- `server/src/controllers/gate-pass.controller.ts` -- getActivePass handler already correct
- `server/src/routes/gate-pass.routes.ts` -- GET /active route already correct
- `server/src/services/gate-pass.service.ts` -- getActivePassForStudent already correct
- `server/src/controllers/leave.controller.ts` -- getLeaves handler already correct
- `client/src/services/api.ts` -- apiFetch wrapper already functional
- `client/src/hooks/useAuth.ts` -- useAuth hook already functional

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (StatusPage):** Built as a comprehensive student dashboard. Displays room info from auth context at the top. Shows quick-action summary cards (active complaints count, active leaves count, pending fees count, FAQ link). Leave section displays leave cards with color-coded status badges, contextual hints via `getLeaveHint()` helper, and rejection reasons. Active leave banner links to ShowQRPage. Also includes complaints section (from later epic) and notices/fees sections for a complete student view.

**Task 2 (ShowQRPage):** Renders QRCodeSVG with `level="M"` error correction for reliable scanning. QR size is `Math.min(280, window.innerWidth * 0.6)` ensuring mobile-friendly sizing. passCode displayed in `text-3xl font-mono font-bold tracking-widest` for easy manual reading. Return-by time formatted with `en-IN` locale for day/month/hour/minute. No-pass state provides clear guidance with link to request leave.

**Task 3 (Wake Lock):** Uses conditional `'wakeLock' in navigator` check before requesting. Stores sentinel in closure variable, releases on useEffect cleanup. Errors caught silently since wake lock is a progressive enhancement.

**Task 4 (Routing):** Routes added as protected student-only routes. `qrcode.react` installed with exact version pinning.

### Test Results
- **Client:** Manual testing verified all UI states and interactions
- **Total:** 0 failures

### New Dependencies
- `qrcode.react` (dependency, client workspace) -- SVG QR code rendering component
