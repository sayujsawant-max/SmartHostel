# Code Review: Story 1.5 -- Frontend Auth Flow & Role-Specific Shells

**Reviewer:** Claude (Opus 4.6)
**Date:** 2026-03-06
**Verdict:** PASS with minor observations

---

## AC Verification

| AC | Status | Notes |
|----|--------|-------|
| AC-1: Unauthenticated -> /login | PASS | `ProtectedRoute` checks `isAuthenticated`, redirects to `/login`. Loading state renders skeleton. |
| AC-2: Login -> role-specific dashboard | PASS | `LoginPage.onSubmit` calls `login()`, navigates to `getRoleHomePath(loggedInUser.role)`. `LoginRoute` in App.tsx also redirects already-authenticated users. |
| AC-3: STUDENT sees StudentShell + BottomTabBar | PASS | Top bar with app name, user name, logout. Bottom NavLink tabs: Status/Actions/FAQ with active highlighting. `<Outlet />` for content. |
| AC-4: WARDEN sees WardenShell + sidebar/hamburger | PASS | Desktop sidebar at `lg:` breakpoint, hamburger + slide-over below `lg`. Nav links: Dashboard/Students/Complaints/Settings. Logout in sidebar. |
| AC-5: GUARD sees GuardShell, no nav chrome | PASS | GuardShell is just `<div><Outlet /></div>`. ScanPage includes its own logout button (appropriate since shell has none). |
| AC-6: MAINTENANCE sees MaintenanceShell + BottomTabBar | PASS | Same pattern as StudentShell. Tabs: Tasks/History/FAQ. Top bar with logout. |
| AC-7: Logout clears cookies, resets auth, redirects | PASS | `logout()` calls `POST /auth/logout` (server clears httpOnly cookies), sets `user` to `null`. `ProtectedRoute` then redirects to `/login` since `isAuthenticated` becomes false. |

## Architecture Compliance

- SPA React with Vite -- correct, no SSR.
- Shells use `<Outlet />` as layout routes -- correct pattern.
- Tailwind CSS for all styling -- confirmed, no inline style objects.
- Path aliases (`@hooks/`, `@components/`, etc.) used consistently.
- Auth via httpOnly cookies, no token stored in JS -- `apiFetch` uses `credentials: 'include'` pattern; `AuthContext` only stores user profile, not tokens.

## Observations (non-blocking)

1. **Catch-all route outside ProtectedRoute.** The `<Route path="*">` at line 104 of App.tsx sits outside `<ProtectedRoute>`, meaning it redirects to `/` without auth check. This is fine in practice since `/` is inside ProtectedRoute and will bounce to `/login`, but it means a brief double-redirect for unknown URLs when unauthenticated.

2. **WardenShell mobile menu does not auto-close on navigation.** Clicking a NavLink in the mobile slide-over sidebar does not call `setMenuOpen(false)`. The user would need to tap the backdrop to close it after navigating. Consider adding an `onClick` handler on NavLinks or listening to location changes.

3. **StudentShell and MaintenanceShell are near-identical.** Only the tab config differs. A shared `TabShell` component accepting tabs as props would eliminate duplication. Not required for this story but worth noting for future refactoring.

4. **No 404/not-found page.** The catch-all redirects to `/` silently. Acceptable for MVP but a dedicated NotFoundPage would improve UX.

5. **GuardShell logout flow.** The logout button lives in `ScanPage`, not the shell. If additional guard pages are added later, each would need its own logout button. Consider adding a minimal floating logout control to GuardShell instead.

## Code Quality

- Clean, readable components with consistent naming.
- Proper use of `void` on fire-and-forget async calls (`void logout()`).
- `RoleRoute` correctly redirects wrong-role users to their own home rather than a generic 403.
- `AuthProvider` wraps the app in `main.tsx`, correctly outside `BrowserRouter`.
- `login()` returns `UserProfile` enabling the caller to navigate based on role without a stale closure on `user`.
- Error handling in `logout()` silently catches server errors while still clearing client state -- correct resilience pattern.

## Files Reviewed

- `c:/Projects/Agent/client/src/App.tsx`
- `c:/Projects/Agent/client/src/components/layout/ProtectedRoute.tsx`
- `c:/Projects/Agent/client/src/components/layout/RoleRoute.tsx`
- `c:/Projects/Agent/client/src/components/layout/StudentShell.tsx`
- `c:/Projects/Agent/client/src/components/layout/WardenShell.tsx`
- `c:/Projects/Agent/client/src/components/layout/GuardShell.tsx`
- `c:/Projects/Agent/client/src/components/layout/MaintenanceShell.tsx`
- `c:/Projects/Agent/client/src/pages/LoginPage.tsx`
- `c:/Projects/Agent/client/src/context/AuthContext.tsx`
- `c:/Projects/Agent/client/src/context/auth-context-value.ts`
- `c:/Projects/Agent/client/src/utils/role-home.ts`
- `c:/Projects/Agent/client/src/pages/guard/ScanPage.tsx`
- `c:/Projects/Agent/client/src/main.tsx`
