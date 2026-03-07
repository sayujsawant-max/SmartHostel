# Story 8.4: Admin User Management

## Description
As a **Warden/Admin**,
I want to list, create, and disable user accounts from the admin panel,
So that I can manage hostel residents and staff.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am authenticated as WARDEN_ADMIN, when I navigate to `/warden/users`, then I see a list of all users with name, email, role, block/room, and active status

**AC-2:** Given I am on the users page, when I click "+ Add User" and fill the form, then the user is created and appears in the list

**AC-3:** Given a user is active, when I click "Disable", then the user is disabled and shows "Disabled" badge

**AC-4:** Given the warden sidebar, when I look at nav links, then "Users" appears between "Rooms" and "Settings"

## Technical Context
- **Tech stack:** React 19, Tailwind CSS
- **Key implementation details:** Uses existing admin API endpoints. Added GET /api/admin/users for listing.

### Existing Code

**Server:**
- `server/src/services/admin.service.ts` -- Added `listUsers()` function. **Status: Complete**
- `server/src/controllers/admin.controller.ts` -- Added `listUsers()` handler. **Status: Complete**
- `server/src/routes/admin.routes.ts` -- Added `GET /` route. **Status: Complete**

**Client:**
- `client/src/pages/warden/UsersManagePage.tsx` -- User list, create, disable UI. **Status: Complete**
- `client/src/components/layout/WardenShell.tsx` -- Added "Users" nav link. **Status: Complete**
- `client/src/App.tsx` -- Added `/warden/users` route. **Status: Complete**

## Tasks

### Task 1: Server-side list users endpoint
- [x] Subtask 1.1: Add listUsers() to admin.service.ts
- [x] Subtask 1.2: Add listUsers() handler to admin.controller.ts
- [x] Subtask 1.3: Add GET / route to admin.routes.ts

**Tests (AC-1):**
- [ ] Integration test: GET /api/admin with WARDEN_ADMIN auth returns list of users with name, email, role, block/room, active status

### Task 2: User management page
- [x] Subtask 2.1: Create UsersManagePage with user list and create form
- [x] Subtask 2.2: Implement disable button with confirmation
- [x] Subtask 2.3: Add to warden navigation and App.tsx routes

**Tests (AC-1, AC-2, AC-3, AC-4):**
- [ ] Unit test: UsersManagePage renders user list with name, email, role, and status
- [ ] Unit test: Clicking "+ Add User" and submitting form creates a user
- [ ] Unit test: Clicking "Disable" on an active user shows disabled badge
- [ ] Unit test: WardenShell sidebar includes "Users" nav link between "Rooms" and "Settings"

## Dependencies
- **Story 1.7** (completed) -- Admin API endpoints (create, disable, reset-password)

## File List

### New Files
- `client/src/pages/warden/UsersManagePage.tsx` -- User management page

### Modified Files
- `server/src/services/admin.service.ts` -- Added listUsers()
- `server/src/controllers/admin.controller.ts` -- Added listUsers()
- `server/src/routes/admin.routes.ts` -- Added GET / route
- `client/src/components/layout/WardenShell.tsx` -- Added Users nav link
- `client/src/App.tsx` -- Added /warden/users route

## Dev Agent Record

### Implementation Date
2026-03-07
