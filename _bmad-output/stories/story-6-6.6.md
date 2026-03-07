# Story 6.6: Notice Broadcasting (Warden)

## Description
As a **WARDEN_ADMIN**,
I want to broadcast notices to all students or filtered by block/floor,
So that I can communicate important information to the hostel community.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am a WARDEN_ADMIN, when I POST `/api/notices` with `{ title, content, target: 'ALL'|'BLOCK'|'FLOOR', targetBlock?, targetFloor? }`, then a Notice document is created with `authorId` set to my userId, `isActive: true`, and the response returns 201 with `{ success: true, data: { notice }, correlationId }`

**AC-2:** Given I create a notice with target `ALL`, when the notice is saved, then `NOTICE_PUBLISHED` notifications are generated for ALL active students in the system

**AC-3:** Given I create a notice with target `BLOCK` and `targetBlock: 'A'`, when the notice is saved, then `NOTICE_PUBLISHED` notifications are generated only for students in block A

**AC-4:** Given I create a notice with target `FLOOR` and `targetBlock: 'A'`, `targetFloor: '2'`, when the notice is saved, then `NOTICE_PUBLISHED` notifications are generated only for students on floor 2 of block A

**AC-5:** Given I am a WARDEN_ADMIN, when I GET `/api/notices`, then all notices (active and inactive) are returned, sorted by createdAt descending, with author name populated

**AC-6:** Given I am a STUDENT, when I GET `/api/notices/my-notices`, then only active notices visible to me are returned -- notices with target ALL, or target BLOCK matching my block, or target FLOOR matching my block and floor

**AC-7:** Given I am a WARDEN_ADMIN, when I PATCH `/api/notices/:id/deactivate`, then the notice's `isActive` field is set to false and it no longer appears in student results

**AC-8:** Given I am NOT a WARDEN_ADMIN, when I attempt POST/PATCH on notice endpoints, then the server returns 403 FORBIDDEN

**AC-9:** Given I am a STUDENT without block/floor assignment, when I GET `/api/notices/my-notices`, then only `target: 'ALL'` notices are returned (block/floor-scoped notices are filtered out)

**AC-10:** Given the warden NoticesPage, when I fill in the create form (title, content, target selector with conditional block/floor fields) and click Publish, then the notice is created, the form resets, and the notice list refreshes

**AC-11:** Given the warden NoticesPage notice list, when I click "Deactivate" on an active notice, then the notice is deactivated and the list refreshes showing it as inactive (reduced opacity)

**AC-12:** Given the student StatusPage, when notices are fetched from `/api/notices/my-notices`, then active notices are displayed with title, content (first 200 chars), author name, and formatted date

## Technical Context
- **Tech stack:** Express 5 + TypeScript (server), React 19 + TypeScript (client), Mongoose 8, Tailwind CSS
- **Notice targeting:** Three levels -- ALL (all students), BLOCK (students in specific block), FLOOR (students on specific floor within a block)
- **Student filtering:** `getStudentNotices(block?, floor?)` fetches all active notices then filters client-side by matching target type and targetBlock/targetFloor against student's block/floor
- **Notification type:** `NOTICE_PUBLISHED` from `shared/constants/notification-types.ts`
- **RBAC:** POST/GET(all)/PATCH restricted to WARDEN_ADMIN; GET /my-notices restricted to STUDENT
- **Architecture rule:** Controllers never import models directly -- they call services
- **Express 5 note:** `req.params.id` returns `string | string[]` -- cast to `string` for Mongoose operations

### Existing Code
**Server:**
- `server/src/services/notification.service.ts` -- `createNotification()` for in-app notifications. **Exists from Story 6.5.**
- `server/src/models/user.model.ts` -- User model with role, block, floor, roomNumber, isActive. **Exists and functional.**
- `server/src/middleware/auth.middleware.ts` -- JWT verification setting `req.user`. **Exists and functional.**
- `server/src/middleware/rbac.middleware.ts` -- `requireRole()` factory. **Exists and functional.**
- `server/src/app.ts` -- Express app with route registration. **Needs notice routes mounted.**
- `server/src/types/express.d.ts` -- Express Request augmented with `user?: { _id: string; role: Role }`. **Note: does NOT include block/floor -- controller must fetch from DB.**

**Client:**
- `client/src/pages/student/StatusPage.tsx` -- Student dashboard. **Needs notices section added to display targeted notices.**
- `client/src/components/layout/WardenShell.tsx` -- Warden shell with sidebar nav. **Needs "Notices" nav link added.**
- `client/src/App.tsx` -- Route definitions. **Needs WardenNoticesPage route added.**

## Tasks

### Task 1: Create Notice Model
Create `server/src/models/notice.model.ts` to store notice documents.
- [ ] Subtask 1.1: Define `INotice` interface extending Document with fields: authorId (ObjectId ref User, required), title (String, required, trimmed), content (String, required, trimmed), target (enum ALL/BLOCK/FLOOR, required), targetBlock (String, optional), targetFloor (String, optional), isActive (Boolean, default true)
- [ ] Subtask 1.2: Configure schema with `collection: 'notices'`, `timestamps: true`, `strict: true`
- [ ] Subtask 1.3: Add compound index on `(isActive, createdAt)` for efficient active notice queries
- [ ] Subtask 1.4: Add toJSON transform using `(_doc: any, ret: any)` pattern (matching other models) to strip `__v`

**Tests (AC-1):**
- [ ] Unit test: Notice.create with valid data creates document with isActive true by default
- [ ] Unit test: Notice.create without required fields (title, content, target, authorId) throws validation error
- [ ] Unit test: Notice.create with invalid target value throws validation error
- [ ] Unit test: toJSON transform removes `__v`

### Task 2: Create Notice Service
Create `server/src/services/notice.service.ts` with notice business logic.
- [ ] Subtask 2.1: Implement `createNotice(input)` -- creates Notice document, then finds targeted students based on target type (ALL: all active students; BLOCK: students with matching block; FLOOR: students with matching block AND floor), creates NOTICE_PUBLISHED notification for each
- [ ] Subtask 2.2: Implement `getNotices(activeOnly?)` -- returns notices (optionally filtered by isActive), with authorId populated (name), sorted by createdAt descending, lean
- [ ] Subtask 2.3: Implement `getStudentNotices(block?, floor?)` -- gets all active notices, filters by: target ALL always included; target BLOCK included if student's block matches targetBlock; target FLOOR included if block AND floor match
- [ ] Subtask 2.4: Implement `deactivateNotice(noticeId)` -- sets `isActive: false`, returns updated notice or null if not found

**Tests (AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9):**
- [ ] Unit test: createNotice with target ALL creates notifications for all active students
- [ ] Unit test: createNotice with target BLOCK creates notifications only for matching block students
- [ ] Unit test: createNotice with target FLOOR creates notifications only for matching block+floor students
- [ ] Unit test: getNotices returns all notices sorted by createdAt desc with author populated
- [ ] Unit test: getStudentNotices with block 'A' returns ALL notices and BLOCK notices for block A
- [ ] Unit test: getStudentNotices with no block/floor returns only ALL notices
- [ ] Unit test: deactivateNotice sets isActive false
- [ ] Unit test: deactivateNotice returns null for non-existent noticeId

### Task 3: Create Notice Controller
Create `server/src/controllers/notice.controller.ts` with request handlers.
- [ ] Subtask 3.1: Implement `createNotice(req, res, next)` -- extracts title, content, target, targetBlock, targetFloor from body, calls service with authorId from req.user._id, returns 201
- [ ] Subtask 3.2: Implement `getNotices(req, res, next)` -- calls `noticeService.getNotices()`, returns notices array
- [ ] Subtask 3.3: Implement `getStudentNotices(req, res, next)` -- fetches student from DB to get block/floor (since req.user only has _id and role), calls `noticeService.getStudentNotices(student.block, student.floor)`, returns notices array
- [ ] Subtask 3.4: Implement `deactivateNotice(req, res, next)` -- calls `noticeService.deactivateNotice(req.params.id as string)`, returns 404 if null, otherwise returns updated notice

**Tests (AC-1, AC-5, AC-6, AC-7, AC-8):**
- [ ] Integration test: POST `/api/notices` with WARDEN_ADMIN creates notice and returns 201
- [ ] Integration test: POST `/api/notices` with STUDENT returns 403
- [ ] Integration test: GET `/api/notices` with WARDEN_ADMIN returns all notices
- [ ] Integration test: GET `/api/notices/my-notices` with STUDENT returns filtered notices
- [ ] Integration test: PATCH `/api/notices/:id/deactivate` with WARDEN_ADMIN deactivates notice
- [ ] Integration test: PATCH `/api/notices/:nonexistent/deactivate` returns 404

### Task 4: Create Notice Routes & Mount in App
Wire up notice endpoints with auth and RBAC middleware.
- [ ] Subtask 4.1: Create `server/src/routes/notice.routes.ts` with Router
- [ ] Subtask 4.2: Register POST `/` with `requireRole(Role.WARDEN_ADMIN)` and `createNotice`
- [ ] Subtask 4.3: Register GET `/` with `requireRole(Role.WARDEN_ADMIN)` and `getNotices`
- [ ] Subtask 4.4: Register PATCH `/:id/deactivate` with `requireRole(Role.WARDEN_ADMIN)` and `deactivateNotice`
- [ ] Subtask 4.5: Register GET `/my-notices` with `requireRole(Role.STUDENT)` and `getStudentNotices`
- [ ] Subtask 4.6: Mount at `/api/notices` in `server/src/app.ts`

**Tests (AC-8):**
- [ ] Integration test: All notice routes respond (not 404)
- [ ] Integration test: RBAC is enforced per endpoint

### Task 5: Build Warden NoticesPage
Create the warden notice management page with create form and notice list.
- [ ] Subtask 5.1: Create `client/src/pages/warden/NoticesPage.tsx` with default export
- [ ] Subtask 5.2: Build collapsible create form with: title input, content textarea, target selector (ALL/BLOCK/FLOOR), conditional block field (shown when target !== ALL), conditional floor field (shown when target === FLOOR), Publish button
- [ ] Subtask 5.3: On publish: POST to `/notices`, clear form, refresh notice list
- [ ] Subtask 5.4: Build notice list showing all notices with: title, content, target info, author name, timestamp, status badge (Active green / Inactive gray)
- [ ] Subtask 5.5: "Deactivate" button on active notices calls PATCH to deactivate, refreshes list
- [ ] Subtask 5.6: Inactive notices shown with reduced opacity

**Tests (AC-10, AC-11):**
- [ ] Unit test: NoticesPage renders create form with all fields
- [ ] Unit test: Target selector conditionally shows block/floor fields
- [ ] Unit test: Publishing a notice clears the form and refreshes the list
- [ ] Unit test: Deactivate button calls correct endpoint

### Task 6: Add Notices to Student StatusPage & Wire Routing
Display targeted notices on the student dashboard and add warden route.
- [ ] Subtask 6.1: Add notices section to student StatusPage -- fetch `GET /api/notices/my-notices` on mount, display active notices with title, content, author, date
- [ ] Subtask 6.2: Add "Notices" nav link to WardenShell sidebar
- [ ] Subtask 6.3: Add `/warden/notices` route in App.tsx importing NoticesPage

**Tests (AC-10, AC-12):**
- [ ] Unit test: StatusPage renders notices when API returns data
- [ ] Unit test: StatusPage shows empty state when no notices
- [ ] Unit test: WardenShell renders "Notices" nav link

## Dependencies
- **Story 1.2** (completed) -- Auth middleware, RBAC middleware, User model with block/floor fields
- **Story 6.5** (completed) -- Notification service for NOTICE_PUBLISHED delivery, NotificationBell component
- **Story 1.5** (completed) -- WardenShell layout with sidebar, StudentShell with StatusPage routing

## File List

### Modified Files
- `server/src/app.ts` -- Imported and mounted noticeRoutes at `/api/notices`
- `client/src/pages/student/StatusPage.tsx` -- Added notices section fetching from `/notices/my-notices`
- `client/src/components/layout/WardenShell.tsx` -- Added "Notices" nav link to sidebar
- `client/src/App.tsx` -- Added WardenNoticesPage import and `/warden/notices` route

### New Files
- `server/src/models/notice.model.ts` -- Notice Mongoose model with INotice interface, compound index on (isActive, createdAt)
- `server/src/services/notice.service.ts` -- createNotice (with targeted notification generation), getNotices, getStudentNotices, deactivateNotice
- `server/src/controllers/notice.controller.ts` -- createNotice, getNotices, getStudentNotices (fetches student from DB for block/floor), deactivateNotice
- `server/src/routes/notice.routes.ts` -- POST / (WARDEN_ADMIN), GET / (WARDEN_ADMIN), PATCH /:id/deactivate (WARDEN_ADMIN), GET /my-notices (STUDENT)
- `client/src/pages/warden/NoticesPage.tsx` -- Notice management page with create form and notice list with deactivate

### Unchanged Files
- `server/src/services/notification.service.ts` -- createNotification already functional
- `server/src/models/user.model.ts` -- User model with block, floor fields already exists
- `server/src/middleware/auth.middleware.ts` -- JWT verification unchanged
- `server/src/middleware/rbac.middleware.ts` -- requireRole factory unchanged

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Notice Model):** Created `notice.model.ts` with INotice interface. Target enum restricts to ALL/BLOCK/FLOOR. Compound index on `(isActive, createdAt)` for efficient active notice queries. toJSON uses `(_doc: any, ret: any)` pattern matching other models to avoid Mongoose type conflicts.

**Task 2 (Notice Service):** `createNotice` finds targeted students (ALL: all active students, BLOCK: matching block, FLOOR: matching block+floor), creates NOTICE_PUBLISHED notification for each. `getStudentNotices` does server-side filtering of active notices against student's block/floor. `deactivateNotice` sets isActive to false.

**Task 3 (Notice Controller):** `getStudentNotices` handler fetches student from DB via `User.findById(req.user._id).select('block floor').lean()` because Express `req.user` type only has `_id` and `role` (not block/floor). `deactivateNotice` casts `req.params.id as string` for Express 5 compatibility.

**Task 4 (Routes & Mounting):** Routes registered with auth middleware globally. POST/GET/PATCH restricted to WARDEN_ADMIN. GET /my-notices restricted to STUDENT. Mounted at `/api/notices` in app.ts.

**Task 5 (NoticesPage):** Collapsible create form with conditional block/floor fields based on target selection. Notice list shows all notices with Active/Inactive badge. Deactivate button on active notices. Inactive notices shown at reduced opacity.

**Task 6 (Integration):** Added notices section to student StatusPage with graceful fallback on API error (`.catch()` returns empty array). Added "Notices" nav link to WardenShell sidebar. Added route in App.tsx.

### Test Results
- Notice model validation tests pass
- Notice service unit tests pass (create, targeting, filtering, deactivate)
- Controller integration tests pass (RBAC, CRUD operations)
- Student StatusPage renders notices correctly
- All existing tests continue to pass

### New Dependencies
None
