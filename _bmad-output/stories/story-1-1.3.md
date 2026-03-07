# Story 1.3: RBAC Middleware & Role-Based Data Visibility

## Description
As a **system administrator**,
I want the system to enforce role-based access control on every protected endpoint,
So that users can only access data and actions appropriate to their role.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given routes are protected with `requireRole()` middleware, when a STUDENT attempts to access a warden-only endpoint (e.g., `/api/admin/dashboard`), then the server returns 403 FORBIDDEN

**AC-2:** Given a GUARD is authenticated, when they attempt to access complaint endpoints, then the server returns 403 (guards never see complaints per RBAC boundary)

**AC-3:** Given a STUDENT queries their own data, when the query executes, then all queries include `{ studentId: req.user._id }` filter -- students never see other students' data

**AC-4:** Given a WARDEN_ADMIN is authenticated, when they query any data endpoint, then no visibility restrictions are applied (full access per visibility matrix)

**AC-5:** Given a MAINTENANCE user queries complaints, when the query executes, then only complaints assigned to them are returned

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 9
- **Auth middleware:** `auth.middleware.ts` already exists -- verifies JWT from httpOnly cookie and sets `req.user = { _id, role }`
- **Roles:** Defined in `shared/constants/roles.ts` as `Role` const object: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- **Architecture rule:** `requireRole()` middleware on every protected endpoint; role-based data filtering at query level (not just route level)
- **Data visibility boundaries** (from architecture doc):
  - Guard -> Complaints: **Blocked** (Guard routes never import complaint services)
  - Maintenance -> GateScans: **Blocked** (Maintenance routes never import gate services)
  - Student -> Other Students: **Query-filtered** (all student queries include `{ studentId: req.user._id }`)
  - Warden -> Everything: **Full access** (no query filter restrictions)
  - Maintenance -> Complaints: **Filtered** (only complaints assigned to them)
- **Naming conventions:** kebab-case for server files, camelCase for JSON/MongoDB fields
- **Architecture rule:** Controllers never import models directly -- they call services
- **Error handling:** Uses `AppError` class with `ErrorCode.FORBIDDEN` (status 403)

### Existing Code
- `server/src/middleware/auth.middleware.ts` -- JWT verification, sets `req.user = { _id, role }`
- `server/src/types/express.d.ts` -- Augments Express Request with `user?: { _id: string; role: Role }`
- `server/src/utils/app-error.ts` -- AppError class with code, statusCode, retryable, retryAfterMs
- `shared/constants/roles.ts` -- Role enum: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- `shared/constants/error-codes.ts` -- ErrorCode including FORBIDDEN
- `server/src/app.ts` -- Express app setup with middleware chain

## Tasks

### Task 1: Create `requireRole()` Middleware
Create `server/src/middleware/rbac.middleware.ts` that exports a `requireRole(...roles)` middleware factory.
- [ ] Subtask 1.1: Create `rbac.middleware.ts` exporting `requireRole(...allowedRoles: Role[])` that returns Express middleware
- [ ] Subtask 1.2: Middleware checks `req.user?.role` against `allowedRoles` array; if not included, throws `AppError('FORBIDDEN', 'Insufficient permissions', 403)`
- [ ] Subtask 1.3: Middleware must be used AFTER `authMiddleware` (requires `req.user` to be set)
- [ ] Subtask 1.4: If `req.user` is not set (auth middleware not applied), throw `AppError('UNAUTHORIZED', 'Authentication required', 401)`

**Tests (AC-1, AC-2):**
- [ ] Unit test: `requireRole('WARDEN_ADMIN')` allows request with `req.user.role = 'WARDEN_ADMIN'`
- [ ] Unit test: `requireRole('WARDEN_ADMIN')` rejects request with `req.user.role = 'STUDENT'` (403)
- [ ] Unit test: `requireRole('STUDENT', 'WARDEN_ADMIN')` allows both roles
- [ ] Unit test: `requireRole('GUARD')` rejects request with no `req.user` (401)
- [ ] Unit test: `requireRole('WARDEN_ADMIN')` rejects GUARD role (403) -- guards blocked from admin endpoints
- [ ] Unit test: `requireRole('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE')` rejects GUARD (403) -- guards blocked from complaint endpoints

### Task 2: Create Data Visibility Filter Helpers
Create `server/src/middleware/data-visibility.middleware.ts` with helpers that build query filters based on user role.
- [ ] Subtask 2.1: Export `buildVisibilityFilter(user: { _id: string; role: Role }, resource: string)` function
- [ ] Subtask 2.2: For `resource = 'ownedByStudent'`: if role is STUDENT, return `{ studentId: user._id }`; if role is WARDEN_ADMIN, return `{}` (no filter); otherwise throw FORBIDDEN
- [ ] Subtask 2.3: For `resource = 'assignedToMaintenance'`: if role is MAINTENANCE, return `{ assignedTo: user._id }`; if role is WARDEN_ADMIN, return `{}` (no filter); if role is STUDENT, return `{ studentId: user._id }`; otherwise throw FORBIDDEN
- [ ] Subtask 2.4: Export `scopeQuery(baseQuery: object, visibilityFilter: object)` helper that merges the visibility filter into the base query using spread

**Tests (AC-3, AC-4, AC-5):**
- [ ] Unit test: `buildVisibilityFilter` for STUDENT on 'ownedByStudent' returns `{ studentId: user._id }`
- [ ] Unit test: `buildVisibilityFilter` for WARDEN_ADMIN on 'ownedByStudent' returns `{}` (no filter)
- [ ] Unit test: `buildVisibilityFilter` for GUARD on 'ownedByStudent' throws FORBIDDEN
- [ ] Unit test: `buildVisibilityFilter` for MAINTENANCE on 'assignedToMaintenance' returns `{ assignedTo: user._id }`
- [ ] Unit test: `buildVisibilityFilter` for WARDEN_ADMIN on 'assignedToMaintenance' returns `{}`
- [ ] Unit test: `buildVisibilityFilter` for STUDENT on 'assignedToMaintenance' returns `{ studentId: user._id }`
- [ ] Unit test: `buildVisibilityFilter` for GUARD on 'assignedToMaintenance' throws FORBIDDEN
- [ ] Unit test: `scopeQuery` merges base query with visibility filter correctly

### Task 3: Create Protected Test Routes for RBAC Integration Testing
Create test route file that registers mock protected endpoints to verify RBAC enforcement end-to-end.
- [ ] Subtask 3.1: Create `server/src/routes/rbac-test.routes.ts` with protected endpoints for each role combination:
  - `GET /api/test/admin-only` -- `requireRole('WARDEN_ADMIN')`
  - `GET /api/test/student-data` -- `requireRole('STUDENT', 'WARDEN_ADMIN')` with student data visibility
  - `GET /api/test/complaints` -- `requireRole('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE')` (guards blocked)
  - `GET /api/test/maintenance-tasks` -- `requireRole('MAINTENANCE', 'WARDEN_ADMIN')` with maintenance visibility
- [ ] Subtask 3.2: Register these routes in `app.ts` only in test environment (`NODE_ENV === 'test'`)

**Tests (AC-1 through AC-5 integration):**
- [ ] Integration test: STUDENT accessing `/api/test/admin-only` returns 403
- [ ] Integration test: WARDEN_ADMIN accessing `/api/test/admin-only` returns 200
- [ ] Integration test: GUARD accessing `/api/test/admin-only` returns 403
- [ ] Integration test: GUARD accessing `/api/test/complaints` returns 403
- [ ] Integration test: STUDENT accessing `/api/test/complaints` returns 200 with student-filtered data
- [ ] Integration test: WARDEN_ADMIN accessing `/api/test/complaints` returns 200 with unfiltered data
- [ ] Integration test: MAINTENANCE accessing `/api/test/complaints` returns 200 with assigned-only data
- [ ] Integration test: MAINTENANCE accessing `/api/test/maintenance-tasks` returns 200 with assigned-only data
- [ ] Integration test: STUDENT accessing `/api/test/maintenance-tasks` returns 403
- [ ] Integration test: Unauthenticated request to any protected endpoint returns 401

## Dependencies
- **Story 1.1** (completed) -- project scaffolding
- **Story 1.2** (completed) -- auth middleware, user model, JWT tokens
- Requires `shared/constants/roles.ts` Role constant (exists)
- Requires `auth.middleware.ts` for `req.user` population (exists)

## File List

### New Files
- `server/src/middleware/rbac.middleware.ts` -- `requireRole(...roles)` middleware factory
- `server/src/middleware/data-visibility.middleware.ts` -- `buildVisibilityFilter()` and `scopeQuery()` helpers
- `server/src/middleware/rbac.middleware.test.ts` -- Unit + integration tests for RBAC middleware
- `server/src/middleware/data-visibility.middleware.test.ts` -- Unit tests for data visibility helpers
- `server/src/routes/rbac-test.routes.ts` -- Test-only routes for RBAC integration testing

### Modified Files
- `server/src/app.ts` -- Register rbac-test routes in test environment

### Unchanged Files
- `server/src/middleware/auth.middleware.ts` -- No changes needed
- `server/src/types/express.d.ts` -- No changes needed
- `server/src/models/user.model.ts` -- No changes needed
- `shared/constants/roles.ts` -- No changes needed

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (requireRole middleware):** Created `rbac.middleware.ts` exporting `requireRole(...allowedRoles: Role[])` factory. Returns Express middleware that checks `req.user.role` against allowed roles. Throws 401 if `req.user` is not set (auth middleware not applied), 403 if role is not in allowed list.

**Task 2 (Data visibility helpers):** Created `data-visibility.middleware.ts` with two exports:
- `buildVisibilityFilter(user, resource)` -- returns MongoDB query filter based on role and resource type. Supports `'ownedByStudent'` and `'assignedToMaintenance'` resource types. WARDEN_ADMIN always gets empty filter (full access). STUDENT gets `{ studentId }` filter. MAINTENANCE gets `{ assignedTo }` filter. GUARD is always blocked with 403.
- `scopeQuery(baseQuery, visibilityFilter)` -- merges base query with visibility filter via spread.

**Task 3 (Test routes + integration):** Created `rbac-test.routes.ts` with 4 protected endpoints exercising all RBAC combinations. Registered in `app.ts` conditionally when `NODE_ENV === 'test'` using top-level await dynamic import (ESM-compatible). All acceptance criteria verified through integration tests.

### Test Results
- **Total:** 90 tests passed across 8 test files, 0 failures
- **New tests:** 27 tests (6 unit tests for requireRole, 10 integration tests for RBAC routes, 11 unit tests for data visibility)
- **Existing tests:** All 63 pre-existing tests continue to pass

### New Dependencies
None -- uses existing Express, shared Role types, and AppError utilities.
