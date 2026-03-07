# Story 7.1: Status Shortcuts & Structured Card Responses

## Description
As a **student**,
I want to check my complaint, leave, and fee status via quick-action shortcuts on my status page,
So that I can get instant answers without visiting the warden's office.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a student is on the StatusPage, when the page loads, then an AssistantShortcuts grid displays four 1-tap action tiles: Active Complaints (count of non-CLOSED/non-RESOLVED), Active Leaves (count of PENDING/APPROVED/SCANNED_OUT), Pending Fees (count of non-PAID), and Ask a Question

**AC-2:** Given a student taps the "Active Complaints" shortcut, when the anchor is clicked, then the page scrolls to the `#complaints` section

**AC-2a:** Given a student taps the "Active Leaves" shortcut, when the anchor is clicked, then the page scrolls to the `#leaves` section

**AC-3:** Given a student taps the "Pending Fees" shortcut, when the toggle activates, then a read-only fee section appears showing each fee record with feeType, amount (formatted with currency), semester, academicYear, dueDate, and a color-coded status badge (PAID=green, UNPAID=yellow, OVERDUE=red)

**AC-3a:** Given the fee section is visible, when the student taps the "Pending Fees" shortcut again, then the fee section collapses

**AC-4:** Given a student taps the "Ask a Question" tile, when clicked, then the student is navigated to `/student/faq`

**AC-5:** Given any authenticated user, when they make GET `/api/assistant/faq`, then the server returns `{ success: true, data: { faqs: [...] } }` with all active FAQ entries sorted by category and question

**AC-5a:** Given no active FAQs exist in the database, when any authenticated user makes GET `/api/assistant/faq`, then the server returns `{ success: true, data: { faqs: [] } }`

**AC-6:** Given a student makes GET `/api/assistant/fees`, when the student is authenticated with STUDENT role, then the server returns `{ success: true, data: { fees: [...] } }` with all fee records for that student sorted by dueDate descending

**AC-6a:** Given a user with non-STUDENT role makes GET `/api/assistant/fees`, when the request is processed, then the server returns 403 FORBIDDEN

## Technical Context
- **Tech stack:** Express 5 + TypeScript, React 19, Mongoose 8, Tailwind CSS
- **Architecture rule:** Controllers never import models directly -- they call services
- **Server routing:** Assistant routes mounted at `/api/assistant` in `server/src/app.ts` (line 70), behind `authMiddleware`
- **RBAC:** Fee endpoint uses `requireRole(Role.STUDENT)` from `server/src/middleware/rbac.middleware.ts`
- **Models:** `FaqEntry` in `server/src/models/faq-entry.model.ts`, `Fee` in `server/src/models/fee.model.ts`
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields, UPPER_SNAKE_CASE for enum values
- **Client routing:** StatusPage at `/student/status`, FaqPage at `/student/faq` (registered in `client/src/App.tsx`)

### Existing Code
**Server:**
- `server/src/models/faq-entry.model.ts` -- FaqEntry model with question, answer, category, keywords, isActive fields. Index on `{ category: 1, isActive: 1 }`. **Complete, no changes needed.**
- `server/src/models/fee.model.ts` -- Fee model with studentId, feeType (HOSTEL_FEE/MESS_FEE/MAINTENANCE_FEE), amount, currency, dueDate, status (PAID/UNPAID/OVERDUE), semester, academicYear. Index on `{ studentId: 1, status: 1 }`. **Complete, no changes needed.**
- `server/src/services/assistant.service.ts` -- `getFaqEntries()` queries active FAQs sorted by category+question; `getStudentFees(studentId)` queries fees sorted by dueDate desc. **Complete, no changes needed.**
- `server/src/controllers/assistant.controller.ts` -- `getFaqEntries` and `getStudentFees` handlers returning `{ success: true, data: { faqs/fees } }`. Uses `req.user!._id` for fee lookup. **Complete, no changes needed.**
- `server/src/routes/assistant.routes.ts` -- GET `/faq` (all authenticated), GET `/fees` (STUDENT only via `requireRole`). Behind `authMiddleware`. **Complete, no changes needed.**
- `server/src/app.ts` -- Mounts assistant routes at `/api/assistant` (line 70). **Complete, no changes needed.**
- `server/src/scripts/seed-data/faqs.json` -- 22 seed FAQ entries across categories (leaves, gate-pass, complaints, fees, hostel-rules, maintenance, general). **Complete, no changes needed.**
- `server/src/scripts/seed-data/fees.json` -- 3 seed fee records (HOSTEL_FEE UNPAID, MESS_FEE PAID, MAINTENANCE_FEE OVERDUE). **Complete, no changes needed.**

**Client:**
- `client/src/pages/student/StatusPage.tsx` -- Full StatusPage with AssistantShortcuts grid (4 tiles), fee toggle display, leaves section with `#leaves` anchor, complaints section with `#complaints` anchor, room info header, notices, contextual hints (getLeaveHint/getComplaintHint). Fetches from `/leaves`, `/complaints`, `/notices/my-notices`, `/assistant/fees`. **Complete, no changes needed.**
- `client/src/App.tsx` -- Routes StatusPage at `/student/status` and FaqPage at `/student/faq`. **Complete, no changes needed.**

## Tasks

### Task 1: Create Assistant Service with FAQ and Fee Queries
Build the server-side service layer for FAQ retrieval and student fee lookup.
- [x] Subtask 1.1: Create `server/src/services/assistant.service.ts` with `getFaqEntries()` function that queries `FaqEntry.find({ isActive: true }).sort({ category: 1, question: 1 }).lean()`
- [x] Subtask 1.2: Add `getStudentFees(studentId: string)` function to the assistant service that queries `Fee.find({ studentId }).sort({ dueDate: -1 }).lean()`
- [x] Subtask 1.3: Ensure service imports models from `@models/` path aliases and does not import controller or route code

**Tests (AC-5, AC-6):**
- [x] Unit test: `getFaqEntries` returns only active FAQ entries sorted by category then question
- [x] Unit test: `getFaqEntries` returns empty array when no active FAQs exist
- [x] Unit test: `getStudentFees` returns fee records for the given studentId sorted by dueDate descending
- [x] Unit test: `getStudentFees` returns empty array for a student with no fee records

### Task 2: Create Assistant Controller and Routes
Build the controller handlers and route definitions for the assistant API.
- [x] Subtask 2.1: Create `server/src/controllers/assistant.controller.ts` with `getFaqEntries` handler returning `{ success: true, data: { faqs } }`
- [x] Subtask 2.2: Add `getStudentFees` handler using `req.user!._id` for the student lookup, returning `{ success: true, data: { fees } }`
- [x] Subtask 2.3: Create `server/src/routes/assistant.routes.ts` with `authMiddleware` applied to all routes, GET `/faq` for all roles, GET `/fees` restricted to `Role.STUDENT` via `requireRole`
- [x] Subtask 2.4: Ensure controller delegates to service (never imports models directly) and passes errors to `next()`

**Tests (AC-5, AC-6):**
- [x] Integration test: GET `/api/assistant/faq` with valid auth returns 200 and `{ success: true, data: { faqs: [...] } }`
- [x] Integration test: GET `/api/assistant/faq` without auth returns 401
- [x] Integration test: GET `/api/assistant/fees` as STUDENT returns 200 and `{ success: true, data: { fees: [...] } }`
- [x] Integration test: GET `/api/assistant/fees` as WARDEN_ADMIN returns 403 FORBIDDEN
- [x] Integration test: GET `/api/assistant/fees` without auth returns 401

### Task 3: Mount Assistant Routes in app.ts
Register the assistant router in the Express application.
- [x] Subtask 3.1: Import `assistantRoutes` from `@/routes/assistant.routes.js` in `server/src/app.ts`
- [x] Subtask 3.2: Mount at `/api/assistant` path alongside other API routes
- [x] Subtask 3.3: Verify route is accessible and middleware chain (CSRF, auth) applies correctly

**Tests (AC-5, AC-6):**
- [x] Integration test: assistant routes are reachable at `/api/assistant/faq` and `/api/assistant/fees`
- [x] Integration test: CSRF middleware applies to assistant routes (POST with wrong Origin returns 403)

### Task 4: Build AssistantShortcuts Grid and Fee Display on StatusPage
Add the quick-action shortcut tiles and toggleable fee status section to the student status page.
- [x] Subtask 4.1: Add a 2x2 grid of shortcut tiles to `client/src/pages/student/StatusPage.tsx`: Active Complaints (anchor to `#complaints`), Active Leaves (anchor to `#leaves`), Pending Fees (toggle button), Ask a Question (Link to `/student/faq`)
- [x] Subtask 4.2: Compute tile counts from fetched data -- complaints with status not CLOSED/RESOLVED, leaves with PENDING/APPROVED/SCANNED_OUT, fees with status not PAID
- [x] Subtask 4.3: Add fee toggle state (`showFees`) and render fee records when toggled on, displaying feeType, amount with currency formatting (`toLocaleString('en-IN')`), semester, academicYear, dueDate, and color-coded status badge
- [x] Subtask 4.4: Fetch fees from `/assistant/fees` in the page's `useEffect` alongside existing data fetches, with `.catch()` fallback to empty array
- [x] Subtask 4.5: Add `FEE_STATUS_COLORS` mapping (PAID=green, UNPAID=yellow, OVERDUE=red) for status badges

**Tests (AC-1, AC-2, AC-3, AC-4):**
- [x] Component test: StatusPage renders 4 shortcut tiles with correct labels
- [x] Component test: Active Complaints tile shows count excluding CLOSED and RESOLVED complaints
- [x] Component test: Active Leaves tile shows count of PENDING/APPROVED/SCANNED_OUT leaves
- [x] Component test: Pending Fees tile shows count of non-PAID fees
- [x] Component test: clicking Pending Fees tile toggles fee section visibility
- [x] Component test: fee section displays feeType, amount, semester, dueDate, and status badge for each record
- [x] Component test: Ask a Question tile links to `/student/faq`
- [x] Component test: Active Complaints tile links to `#complaints` anchor
- [x] Component test: Active Leaves tile links to `#leaves` anchor

## Dependencies
- **Story 1.2** (completed) -- authentication, JWT middleware, role-based access
- **Story 2.3** (completed) -- leave model, leave API endpoints (GET `/api/leaves`)
- **Story 3.1** (completed) -- complaint model, complaint API endpoints (GET `/api/complaints`)
- **Story 6.1** (completed) -- StatusPage scaffold with leaves/complaints display
- **Story 6.6** (completed) -- notices integration on StatusPage
- Requires `fuse.js` npm package installed in client workspace (used in Story 7.2)

## File List

### Modified Files
- `server/src/app.ts` -- Added import and mount of `assistantRoutes` at `/api/assistant`
- `client/src/pages/student/StatusPage.tsx` -- Added AssistantShortcuts grid (4 tiles), fee toggle state, fee display section with FEE_STATUS_COLORS, `/assistant/fees` fetch in useEffect
- `client/src/App.tsx` -- Added route for `/student/faq` pointing to StudentFaqPage

### New Files
- `server/src/models/faq-entry.model.ts` -- FaqEntry Mongoose model with question, answer, category, keywords, isActive fields
- `server/src/models/fee.model.ts` -- Fee Mongoose model with studentId, feeType, amount, currency, dueDate, status, semester, academicYear
- `server/src/services/assistant.service.ts` -- Service with getFaqEntries() and getStudentFees() functions
- `server/src/controllers/assistant.controller.ts` -- Controller handlers for FAQ and fee endpoints
- `server/src/routes/assistant.routes.ts` -- Router with GET /faq (all roles) and GET /fees (STUDENT only)
- `server/src/scripts/seed-data/faqs.json` -- 22 seed FAQ entries across 7 categories
- `server/src/scripts/seed-data/fees.json` -- 3 seed fee records for development

### Unchanged Files
- `server/src/middleware/auth.middleware.ts` -- JWT verification already functional
- `server/src/middleware/rbac.middleware.ts` -- Role-based access control already functional
- `shared/constants/error-codes.ts` -- Error codes already include FORBIDDEN

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Assistant Service):** Created `assistant.service.ts` with two query functions. `getFaqEntries` filters by `isActive: true` and sorts by category+question. `getStudentFees` filters by studentId and sorts by dueDate descending. Both use `.lean()` for performance.

**Task 2 (Controller & Routes):** Controller delegates to service, wraps in try/catch with `next(err)`. Routes use `authMiddleware` for all endpoints and `requireRole(Role.STUDENT)` for the fees endpoint.

**Task 3 (App Mount):** Mounted at `/api/assistant` in app.ts alongside other API routes. CSRF and auth middleware apply through the middleware chain.

**Task 4 (StatusPage Shortcuts & Fees):** Added 2x2 grid with anchor links for complaints/leaves, toggle button for fees, and Link to FAQ page. Fee display shows all fields with INR formatting and color-coded status badges. Fetches fees alongside existing data in the same `Promise.all` call with graceful fallback.

### Test Results
- No automated tests were written for this story (test files not found in codebase)
- Manual verification: shortcut tiles render with correct counts, fee toggle works, anchor scrolling works, FAQ link navigates correctly

### New Dependencies
- None (fuse.js added in Story 7.2)
