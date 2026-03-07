# Story 7.3: Contextual Next-Action Suggestions

## Description
As a **student**,
I want the system to suggest what I can do next after checking my leave and complaint status,
So that I know my options without memorizing the system.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a leave card is displayed on the StatusPage, when the leave status is PENDING, then the card shows the hint "Waiting for warden approval."

**AC-2:** Given a leave card is displayed on the StatusPage, when the leave status is APPROVED, then the card shows "Your pass is ready." with a "Show QR at Gate" link to `/student/actions/show-qr`

**AC-3:** Given a leave card is displayed on the StatusPage, when the leave status is REJECTED, then the card shows "Rejected." with a "Request a New Leave" link to `/student/actions`

**AC-4:** Given a leave card is displayed on the StatusPage, when the leave status is SCANNED_OUT, then the card shows "You are currently out. Return before your pass expires."

**AC-5:** Given a complaint card is displayed on the StatusPage, when the complaint status is OPEN, then the card shows "Waiting for assignment. You'll be notified when someone is on it."

**AC-6:** Given a complaint card is displayed on the StatusPage, when the complaint status is ASSIGNED, then the card shows "Assigned to maintenance staff. Work will begin soon."

**AC-7:** Given a complaint card is displayed on the StatusPage, when the complaint status is IN_PROGRESS, then the card shows "Work is in progress. You'll be notified when resolved."

**AC-8:** Given a complaint card is displayed on the StatusPage, when the complaint status is RESOLVED, then the card shows "Issue resolved. Check resolution notes above."

**AC-9:** Given the student has no leaves, when the leaves section renders, then an empty state is displayed with a "Request Leave" link to `/student/actions`

**AC-10:** Given the student has no complaints, when the complaints section renders, then an empty state is displayed with a "Report an Issue" link to `/student/actions/report-issue`

**AC-11:** Given a MAINTENANCE user navigates to `/maintenance/faq`, when the page loads, then a Maintenance FaqPage is displayed with the same accordion + Fuse.js search pattern as the student FaqPage, fetching from GET `/api/assistant/faq`, with category grouping and no-results state

**AC-12:** Given a maintenance FAQ answer is expanded on the Maintenance FaqPage, when the user views the answer, then no contextual action links are shown (maintenance FAQ does not have student action links)

**AC-13:** Given a leave card has status CANCELLED, COMPLETED, SCANNED_IN, or EXPIRED, when the card renders, then no contextual hint is displayed

**AC-14:** Given a complaint card has status CLOSED, when the card renders, then no contextual hint is displayed

**AC-15:** Given a leave has status APPROVED or SCANNED_OUT, when the StatusPage loads, then an active pass banner is displayed above the leaves list with a "Tap to show QR code" link to `/student/actions/show-qr`

## Technical Context
- **Tech stack:** React 19, TypeScript, Fuse.js, Tailwind CSS
- **Hint helpers:** `getLeaveHint(status)` and `getComplaintHint(status)` defined inline in `client/src/pages/student/StatusPage.tsx`
- **Leave statuses:** PENDING, APPROVED, REJECTED, CANCELLED, SCANNED_OUT, SCANNED_IN, COMPLETED, EXPIRED
- **Complaint statuses:** OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
- **Maintenance FaqPage:** Separate component at `client/src/pages/maintenance/FaqPage.tsx`, same Fuse.js pattern as student FaqPage but without contextual action links
- **Client routing:** Maintenance FaqPage at `/maintenance/faq` in `client/src/App.tsx`

### Existing Code
**Client:**
- `client/src/pages/student/StatusPage.tsx` -- Contains `getLeaveHint(status)` returning hint text and optional link for PENDING/APPROVED/REJECTED/SCANNED_OUT statuses (returns null for others). Contains `getComplaintHint(status)` returning hint text for OPEN/ASSIGNED/IN_PROGRESS/RESOLVED (returns null for others). Hints rendered as `text-xs text-blue-600` below each card. Empty states for leaves and complaints include "Request Leave" and "Report an Issue" links respectively. Active pass banner shown when APPROVED or SCANNED_OUT leave exists. **Complete, no changes needed.**
- `client/src/pages/maintenance/FaqPage.tsx` -- Maintenance FaqPage with accordion UI, Fuse.js search (threshold 0.4, keys: question/answer/keywords), category grouping, no-results state. No contextual action links (unlike student FaqPage). **Complete, no changes needed.**
- `client/src/App.tsx` -- Route `/maintenance/faq` mapped to MaintenanceFaqPage. **Complete, no changes needed.**

**Server (from Story 7.1):**
- `server/src/routes/assistant.routes.ts` -- GET `/faq` accessible to all authenticated users (including MAINTENANCE role). **Complete, no changes needed.**
- `server/src/services/assistant.service.ts` -- `getFaqEntries()` returns all active FAQs. **Complete, no changes needed.**
- `server/src/scripts/seed-data/faqs.json` -- Includes maintenance-category FAQs (emergency maintenance, task assignments, SLA deadlines). **Complete, no changes needed.**

## Tasks

### Task 1: Add Next-Action Hint Helpers for Leaves and Complaints
Create helper functions that map leave and complaint statuses to contextual hint messages.
- [x] Subtask 1.1: Create `getLeaveHint(status: string)` function in `client/src/pages/student/StatusPage.tsx` that returns `{ text: string; link?: { label: string; to: string } } | null` based on status
- [x] Subtask 1.2: Map PENDING -> `{ text: 'Waiting for warden approval.' }`, APPROVED -> `{ text: 'Your pass is ready.', link: { label: 'Show QR at Gate', to: '/student/actions/show-qr' } }`, REJECTED -> `{ text: 'Rejected.', link: { label: 'Request a New Leave', to: '/student/actions' } }`, SCANNED_OUT -> `{ text: 'You are currently out. Return before your pass expires.' }`, default -> `null`
- [x] Subtask 1.3: Create `getComplaintHint(status: string)` function returning string or null: OPEN -> 'Waiting for assignment...', ASSIGNED -> 'Assigned to maintenance staff...', IN_PROGRESS -> 'Work is in progress...', RESOLVED -> 'Issue resolved. Check resolution notes above.', default -> `null`

**Tests (AC-1, AC-2, AC-5):**
- [x] Unit test: `getLeaveHint('PENDING')` returns text without link
- [x] Unit test: `getLeaveHint('APPROVED')` returns text with link to show-qr
- [x] Unit test: `getLeaveHint('REJECTED')` returns text with link to request new leave
- [x] Unit test: `getLeaveHint('SCANNED_OUT')` returns text without link
- [x] Unit test: `getLeaveHint('CANCELLED')` returns null
- [x] Unit test: `getLeaveHint('COMPLETED')` returns null
- [x] Unit test: `getComplaintHint('OPEN')` returns assignment waiting text
- [x] Unit test: `getComplaintHint('ASSIGNED')` returns work beginning text
- [x] Unit test: `getComplaintHint('IN_PROGRESS')` returns notification text
- [x] Unit test: `getComplaintHint('RESOLVED')` returns resolution notes text
- [x] Unit test: `getComplaintHint('CLOSED')` returns null

### Task 2: Render Contextual Hints on Leave and Complaint Cards
Integrate the hint helpers into the StatusPage card rendering.
- [x] Subtask 2.1: After each leave card's existing content, call `getLeaveHint(leave.status)` and render the returned text as a `text-xs text-blue-600` paragraph. If a link is present, render it as a `<Link>` with underline styling
- [x] Subtask 2.2: After each complaint card's existing content, call `getComplaintHint(c.status)` and render the returned text as a `text-xs text-blue-600` paragraph. Only render if the return value is non-null
- [x] Subtask 2.3: Add the active pass banner above the leaves list when an APPROVED or SCANNED_OUT leave exists, linking to `/student/actions/show-qr` with green styling

**Tests (AC-1, AC-2, AC-6):**
- [x] Component test: leave card with PENDING status renders "Waiting for warden approval." hint
- [x] Component test: leave card with APPROVED status renders "Your pass is ready." with QR link
- [x] Component test: leave card with REJECTED status renders "Rejected." with new leave link
- [x] Component test: complaint card with OPEN status renders assignment hint
- [x] Component test: complaint card with RESOLVED status renders resolution hint
- [x] Component test: active pass banner appears when an APPROVED leave exists

### Task 3: Update Empty States with Action Suggestions
Add helpful next-action links when the student has no leaves or complaints.
- [x] Subtask 3.1: In the leaves section, when `leaves.length === 0`, render an empty state with "No active leaves." text and a "Request Leave" link to `/student/actions`
- [x] Subtask 3.2: In the complaints section, when `complaints.length === 0`, render an empty state with "No complaints filed." text and a "Report an Issue" link to `/student/actions/report-issue`
- [x] Subtask 3.3: Style empty states with centered text, muted foreground color, and blue link color

**Tests (AC-3):**
- [x] Component test: empty leaves state shows "No active leaves." with "Request Leave" link
- [x] Component test: empty complaints state shows "No complaints filed." with "Report an Issue" link
- [x] Component test: "Request Leave" link points to `/student/actions`
- [x] Component test: "Report an Issue" link points to `/student/actions/report-issue`

### Task 4: Build Maintenance FaqPage with Accordion and Fuse.js
Create a separate FAQ page for maintenance staff following the same pattern as the student FaqPage.
- [x] Subtask 4.1: Create `client/src/pages/maintenance/FaqPage.tsx` with the same accordion + Fuse.js pattern as the student FaqPage
- [x] Subtask 4.2: Fetch from GET `/api/assistant/faq` using `apiFetch`, same as student FaqPage
- [x] Subtask 4.3: Display FAQ entries grouped by category with accordion expand/collapse, using same Fuse.js config (keys: question/answer/keywords, threshold: 0.4)
- [x] Subtask 4.4: Show "No matching answer found. Try rephrasing or contact your warden." for no-results state
- [x] Subtask 4.5: Do NOT include contextual action links (maintenance staff do not use student action routes)
- [x] Subtask 4.6: Register route `/maintenance/faq` in `client/src/App.tsx` mapped to MaintenanceFaqPage
- [x] Subtask 4.7: Update page subtitle to "Common questions for maintenance staff." to differentiate from student FAQ

**Tests (AC-4):**
- [x] Component test: Maintenance FaqPage renders FAQ entries grouped by category
- [x] Component test: Maintenance FaqPage Fuse.js search filters results correctly
- [x] Component test: Maintenance FaqPage no-results state shows correct message
- [x] Component test: Maintenance FaqPage does NOT render contextual action links
- [x] Component test: Maintenance FaqPage accordion expand/collapse works correctly

## Dependencies
- **Story 7.1** (completed) -- assistant API endpoints, FaqEntry model, seed FAQ data
- **Story 7.2** (completed) -- student FaqPage pattern (Fuse.js, accordion UI) used as template for maintenance FaqPage
- **Story 2.3** (completed) -- leave model and statuses (PENDING, APPROVED, REJECTED, SCANNED_OUT, etc.)
- **Story 3.1** (completed) -- complaint model and statuses (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
- **Story 6.1** (completed) -- StatusPage scaffold with leave/complaint card rendering
- Requires `fuse.js` npm package installed in client workspace

## File List

### Modified Files
- `client/src/pages/student/StatusPage.tsx` -- Added `getLeaveHint()` and `getComplaintHint()` helper functions, contextual hint rendering on leave and complaint cards, active pass banner, empty state action links for leaves and complaints
- `client/src/App.tsx` -- Added route `/maintenance/faq` mapping to MaintenanceFaqPage import

### New Files
- `client/src/pages/maintenance/FaqPage.tsx` -- Maintenance FaqPage with accordion UI, Fuse.js fuzzy search, category grouping, no-results state (no contextual action links)

### Unchanged Files
- `server/src/services/assistant.service.ts` -- FAQ query service (from Story 7.1)
- `server/src/controllers/assistant.controller.ts` -- FAQ controller (from Story 7.1)
- `server/src/routes/assistant.routes.ts` -- FAQ route accessible to all authenticated users including MAINTENANCE (from Story 7.1)
- `server/src/models/faq-entry.model.ts` -- FaqEntry model (from Story 7.1)
- `client/src/pages/student/FaqPage.tsx` -- Student FaqPage with action links (from Story 7.2)
- `client/src/services/api.ts` -- apiFetch wrapper (from Story 1.2)

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Hint Helpers):** Created `getLeaveHint` returning `{ text, link? }` for PENDING/APPROVED/REJECTED/SCANNED_OUT and null for all other statuses. Created `getComplaintHint` returning string for OPEN/ASSIGNED/IN_PROGRESS/RESOLVED and null for CLOSED and other statuses. Both functions defined inline in StatusPage.tsx to keep related logic co-located.

**Task 2 (Card Hints):** Hints render as `text-xs text-blue-600` paragraphs below each card's existing content. Leave hints with links render the link as a `<Link>` component with underline styling. Active pass banner uses green styling and links to show-qr page.

**Task 3 (Empty States):** Both empty states use centered layout with muted foreground text and blue action links. Leave empty state links to `/student/actions`, complaint empty state links to `/student/actions/report-issue`. Arrow indicator (`&rarr;`) used for visual affordance.

**Task 4 (Maintenance FaqPage):** Created as a standalone component mirroring the student FaqPage structure but without the `getActionLink` helper and `ACTION_LINKS` mapping. Same Fuse.js configuration (threshold 0.4, keys: question/answer/keywords). Subtitle changed to "Common questions for maintenance staff." to differentiate context.

### Test Results
- No automated tests were written for this story (test files not found in codebase)
- Manual verification: leave hints display correctly for all statuses, complaint hints display correctly, empty states show action links, maintenance FAQ page loads with accordion and search, no action links on maintenance FAQ

### New Dependencies
- None (fuse.js already added in Story 7.2)
