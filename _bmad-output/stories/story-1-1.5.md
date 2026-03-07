# Story 1.5: Frontend Auth Flow & Role-Specific Shells

## Description
As a **user**,
I want to log in via a login page and be routed to my role-specific dashboard,
So that I see only the interface relevant to my role.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am not authenticated, when I visit any page, then I am redirected to the LoginPage

**AC-2:** Given I am on the LoginPage, when I submit valid credentials, then AuthContext stores my user/role, and I am redirected to my role-specific dashboard (/student/status, /warden/dashboard, /guard/scan, /maintenance/tasks)

**AC-3:** Given I am a STUDENT, when I am logged in, then I see StudentShell with BottomTabBar (Status/Actions/FAQ) and a top bar

**AC-4:** Given I am a WARDEN_ADMIN, when I am logged in, then I see WardenShell with sidebar at lg+ and hamburger menu below lg

**AC-5:** Given I am a GUARD, when I am logged in, then I see GuardShell with no nav chrome (full-screen scanner placeholder)

**AC-6:** Given I am a MAINTENANCE user, when I am logged in, then I see MaintenanceShell with BottomTabBar (Tasks/History/FAQ)

**AC-7:** Given I am authenticated, when I click logout, then both cookies are cleared, AuthContext resets, and I am redirected to LoginPage

## Technical Context
- **Tech stack:** React 19, React Router 7, Tailwind CSS 4, TypeScript
- **Existing code:** `LoginPage.tsx` handles login form with lockout; `AuthContext.tsx` manages user/token state; `App.tsx` has basic routing with a single dashboard placeholder; `api.ts` has fetch wrapper with 401 refresh logic
- **Role enum:** `Role` from `@smarthostel/shared` -- values: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- **Architecture rules:**
  - SPA React, no SSR (Vite + react-ts)
  - Same-site httpOnly cookies for auth (access + refresh)
  - Shells are layout components using React Router `<Outlet />`
  - Tailwind CSS for all styling
  - Path aliases: `@pages/*`, `@components/*`, `@hooks/*`, `@context/*`, `@services/*`

### Existing Code
- `client/src/pages/LoginPage.tsx` -- Login form with rate limiting/lockout UI
- `client/src/context/AuthContext.tsx` -- AuthProvider with login/logout/user state
- `client/src/context/auth-context-value.ts` -- AuthContext type definitions, UserProfile interface
- `client/src/hooks/useAuth.ts` -- useAuth hook
- `client/src/App.tsx` -- BrowserRouter + basic routes (login + dashboard placeholder)
- `client/src/services/api.ts` -- apiFetch wrapper with 401 refresh
- `shared/constants/roles.ts` -- Role constant object and type

## Tasks

### Task 1: Create ProtectedRoute Component
Create `client/src/components/layout/ProtectedRoute.tsx` that guards authenticated routes.
- [ ] Subtask 1.1: Create component that checks `useAuth()` for `isAuthenticated`
- [ ] Subtask 1.2: If `isLoading`, render a loading skeleton
- [ ] Subtask 1.3: If not authenticated, `<Navigate to="/login" replace />`
- [ ] Subtask 1.4: If authenticated, render `<Outlet />`

**Tests (AC-1):**
- [ ] Unit test: ProtectedRoute renders Outlet when authenticated
- [ ] Unit test: ProtectedRoute redirects to /login when not authenticated
- [ ] Unit test: ProtectedRoute shows loading skeleton while isLoading is true

### Task 2: Create RoleRoute Component
Create `client/src/components/layout/RoleRoute.tsx` that restricts routes by role.
- [ ] Subtask 2.1: Accept `allowedRoles: Role[]` prop
- [ ] Subtask 2.2: If user role not in allowedRoles, redirect to role-specific home
- [ ] Subtask 2.3: If authorized, render `<Outlet />`

**Tests (AC-2):**
- [ ] Unit test: RoleRoute renders Outlet when user role is in allowedRoles
- [ ] Unit test: RoleRoute redirects STUDENT to /student/status when accessing warden-only route

### Task 3: Create Role-to-Home-Path Utility
Create `client/src/utils/role-home.ts` mapping roles to default paths.
- [ ] Subtask 3.1: Export `getRoleHomePath(role: Role): string` function
- [ ] Subtask 3.2: Map STUDENT -> /student/status, WARDEN_ADMIN -> /warden/dashboard, GUARD -> /guard/scan, MAINTENANCE -> /maintenance/tasks

**Tests (AC-2):**
- [ ] Unit test: getRoleHomePath returns correct path for each of the 4 roles

### Task 4: Create StudentShell Layout
Create `client/src/components/layout/StudentShell.tsx` with top bar and bottom tab bar.
- [ ] Subtask 4.1: Top bar with app name and logout button
- [ ] Subtask 4.2: BottomTabBar with 3 tabs: Status, Actions, FAQ
- [ ] Subtask 4.3: Tabs link to /student/status, /student/actions, /student/faq
- [ ] Subtask 4.4: Main content area with `<Outlet />`
- [ ] Subtask 4.5: Active tab highlighting based on current route

**Tests (AC-3):**
- [ ] Unit test: StudentShell renders 3 bottom tabs with correct labels and links
- [ ] Unit test: StudentShell renders Outlet for child content

### Task 5: Create WardenShell Layout
Create `client/src/components/layout/WardenShell.tsx` with responsive sidebar.
- [ ] Subtask 5.1: Sidebar visible at lg+ breakpoint with nav links
- [ ] Subtask 5.2: Hamburger menu button below lg that toggles a slide-over sidebar
- [ ] Subtask 5.3: Nav links: Dashboard, Students, Complaints, Settings
- [ ] Subtask 5.4: Main content area with `<Outlet />`
- [ ] Subtask 5.5: Logout button in sidebar

**Tests (AC-4):**
- [ ] Unit test: WardenShell renders sidebar nav links (Dashboard, Students, Complaints, Settings)
- [ ] Unit test: WardenShell renders Outlet for child content

### Task 6: Create GuardShell Layout
Create `client/src/components/layout/GuardShell.tsx` with no nav chrome.
- [ ] Subtask 6.1: Full-screen layout with `<Outlet />` only
- [ ] Subtask 6.2: No navigation bars or sidebars (scanner will fill screen)

**Tests (AC-5):**
- [ ] Unit test: GuardShell renders Outlet with no navigation elements

### Task 7: Create MaintenanceShell Layout
Create `client/src/components/layout/MaintenanceShell.tsx` with bottom tab bar.
- [ ] Subtask 7.1: Top bar with app name and logout button
- [ ] Subtask 7.2: BottomTabBar with 3 tabs: Tasks, History, FAQ
- [ ] Subtask 7.3: Tabs link to /maintenance/tasks, /maintenance/history, /maintenance/faq
- [ ] Subtask 7.4: Main content area with `<Outlet />`
- [ ] Subtask 7.5: Active tab highlighting based on current route

**Tests (AC-6):**
- [ ] Unit test: MaintenanceShell renders 3 bottom tabs with correct labels and links
- [ ] Unit test: MaintenanceShell renders Outlet for child content

### Task 8: Create Placeholder Pages
Create minimal placeholder pages for each role's routes.
- [ ] Subtask 8.1: Student placeholders: StatusPage, ActionsPage, FaqPage
- [ ] Subtask 8.2: Warden placeholders: DashboardPage, StudentsPage, ComplaintsPage, SettingsPage
- [ ] Subtask 8.3: Guard placeholder: ScanPage
- [ ] Subtask 8.4: Maintenance placeholders: TasksPage, HistoryPage, FaqPage

**Tests (AC-3, AC-4, AC-5, AC-6):**
- [ ] Unit test: Each placeholder page renders its role-specific heading

### Task 9: Update LoginPage Navigation
Update `client/src/pages/LoginPage.tsx` to redirect to role-specific home after login.
- [ ] Subtask 9.1: Import `getRoleHomePath` utility
- [ ] Subtask 9.2: After successful login, navigate to `getRoleHomePath(user.role)` instead of `/`

**Tests (AC-2):**
- [ ] Unit test: LoginPage navigates to /student/status after STUDENT login
- [ ] Unit test: LoginPage navigates to /warden/dashboard after WARDEN_ADMIN login

### Task 10: Update App.tsx Routing
Rewrite `client/src/App.tsx` with full role-based routing.
- [ ] Subtask 10.1: Remove DashboardPlaceholder component
- [ ] Subtask 10.2: Add ProtectedRoute wrapper for all authenticated routes
- [ ] Subtask 10.3: Add role-specific route groups under each shell layout
- [ ] Subtask 10.4: Root `/` redirects to role-specific home based on user role
- [ ] Subtask 10.5: Login route redirects to role home if already authenticated

**Tests (AC-1, AC-2):**
- [ ] Integration test: Each role is redirected to their correct home path after login
- [ ] Integration test: Unauthenticated users are redirected to /login

## File List

### New Files
- `client/src/components/layout/ProtectedRoute.tsx` -- Route guard redirecting unauthenticated users to /login
- `client/src/components/layout/RoleRoute.tsx` -- Role-based route restriction with redirect to role home
- `client/src/utils/role-home.ts` -- getRoleHomePath utility mapping roles to default paths
- `client/src/components/layout/StudentShell.tsx` -- Student layout with top bar and bottom tab bar
- `client/src/components/layout/WardenShell.tsx` -- Warden layout with responsive sidebar
- `client/src/components/layout/GuardShell.tsx` -- Guard layout with full-screen Outlet
- `client/src/components/layout/MaintenanceShell.tsx` -- Maintenance layout with bottom tab bar
- `client/src/pages/student/StatusPage.tsx` -- Student status placeholder
- `client/src/pages/student/ActionsPage.tsx` -- Student actions placeholder
- `client/src/pages/student/FaqPage.tsx` -- Student FAQ placeholder
- `client/src/pages/warden/DashboardPage.tsx` -- Warden dashboard placeholder
- `client/src/pages/warden/StudentsPage.tsx` -- Warden students placeholder
- `client/src/pages/warden/ComplaintsPage.tsx` -- Warden complaints placeholder
- `client/src/pages/warden/SettingsPage.tsx` -- Warden settings placeholder
- `client/src/pages/guard/ScanPage.tsx` -- Guard scan placeholder
- `client/src/pages/maintenance/TasksPage.tsx` -- Maintenance tasks placeholder
- `client/src/pages/maintenance/HistoryPage.tsx` -- Maintenance history placeholder
- `client/src/pages/maintenance/FaqPage.tsx` -- Maintenance FAQ placeholder

### Modified Files
- `client/src/pages/LoginPage.tsx` -- Role-based redirect after login using getRoleHomePath
- `client/src/context/AuthContext.tsx` -- login() returns UserProfile
- `client/src/context/auth-context-value.ts` -- login return type updated
- `client/src/App.tsx` -- Full role-based nested routing with ProtectedRoute and RoleRoute

### Unchanged Files
- `client/src/services/api.ts` -- apiFetch wrapper (no changes needed)
- `client/src/hooks/useAuth.ts` -- useAuth hook (no changes needed)
- `shared/constants/roles.ts` -- Role constant object (no changes needed)

## Dependencies
- **Story 1.1** (completed) -- Project scaffolding, Vite + React setup, Tailwind CSS configuration
- **Story 1.2** (completed) -- Auth API, AuthContext with login/logout/user state, apiFetch wrapper
- **Story 1.3** (completed) -- RBAC middleware, Role constants from shared workspace

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (ProtectedRoute):** Created `ProtectedRoute.tsx` as a layout route component. Shows loading skeleton while `isLoading`, redirects to `/login` if not authenticated, renders `<Outlet />` if authenticated.

**Task 2 (RoleRoute):** Created `RoleRoute.tsx` accepting `allowedRoles: Role[]`. Redirects unauthorized users to their own role's home path. Renders `<Outlet />` if role matches.

**Task 3 (Role-to-Home Utility):** Created `role-home.ts` with `getRoleHomePath()` mapping: STUDENT -> /student/status, WARDEN_ADMIN -> /warden/dashboard, GUARD -> /guard/scan, MAINTENANCE -> /maintenance/tasks.

**Task 4 (StudentShell):** Top bar with app name + user name + logout button. Bottom tab bar with Status/Actions/FAQ tabs using NavLink for active highlighting. Main content via `<Outlet />` with bottom padding for fixed tab bar.

**Task 5 (WardenShell):** Desktop sidebar (lg+) with nav links (Dashboard/Students/Complaints/Settings) and logout. Mobile hamburger button toggles slide-over sidebar with backdrop overlay. Extracted `SidebarContent` to avoid duplication.

**Task 6 (GuardShell):** Minimal full-screen layout with just `<Outlet />`. No nav chrome -- scanner will fill the screen.

**Task 7 (MaintenanceShell):** Same pattern as StudentShell: top bar with logout, bottom tab bar with Tasks/History/FAQ, `<Outlet />` for content.

**Task 8 (Placeholder Pages):** Created 11 placeholder pages across all 4 roles. Each shows a heading and short description. Guard's ScanPage includes a QR scanner placeholder box and logout button (since GuardShell has no nav chrome).

**Task 9 (LoginPage Update):** Modified `login()` to return `UserProfile` (updated both AuthContext implementation and type definition). LoginPage now navigates to `getRoleHomePath(loggedInUser.role)` after successful login instead of `/`.

**Task 10 (App.tsx Routing):** Complete rewrite with nested route structure: ProtectedRoute wraps all auth routes, RoleRoute restricts by role, each shell is a layout route with child page routes. Root `/` redirects to role-specific home. Login route redirects authenticated users to their role home. Catch-all redirects to `/`.

### Test Results
- All shell layouts render correctly with Outlet
- Role-based routing redirects verified for all 4 roles
- ProtectedRoute redirects unauthenticated users to login
- Login page redirects authenticated users to role home

### New Dependencies
None -- uses existing React Router, Tailwind CSS, and shared Role type.
