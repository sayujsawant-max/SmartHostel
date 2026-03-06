# Code Review: Story 1.3 - RBAC Middleware & Role-Based Data Visibility

**Reviewer:** Claude (Opus 4.6)
**Date:** 2026-03-06
**Story:** 1.3 - RBAC Middleware & Role-Based Data Visibility

---

## Summary

Story 1.3 implements role-based access control via a `requireRole()` middleware factory and data visibility filtering via `buildVisibilityFilter()` and `scopeQuery()` helpers. The implementation is clean, minimal, and correctly aligns with the architecture document's RBAC visibility matrix. Test coverage is thorough with both unit and integration tests covering all acceptance criteria. No blocking issues found.

---

## Findings

### Positive

1. **Clean middleware design** (`rbac.middleware.ts`): The `requireRole()` factory is simple, well-documented, and follows Express middleware conventions. The 401/403 distinction (missing user vs. wrong role) is correctly implemented per the story spec.

2. **Exhaustive switch in data-visibility** (`data-visibility.middleware.ts`): The `default` case uses TypeScript's `never` exhaustive check, which will produce a compile-time error if a new `ResourceType` is added without handling it. Good defensive pattern.

3. **Architecture alignment**: The data visibility boundaries match the architecture doc exactly:
   - Guard -> Complaints: Blocked (GUARD throws FORBIDDEN for both resource types)
   - Maintenance -> GateScans: Not tested here (correctly deferred -- no gate resource type defined yet)
   - Student -> Other Students: Query-filtered with `{ studentId: user._id }`
   - Warden -> Everything: Empty filter `{}`
   - Maintenance -> Complaints: Filtered with `{ assignedTo: user._id }`

4. **Test-only route isolation**: Test routes are conditionally registered only when `NODE_ENV === 'test'`, using dynamic `await import()`. This prevents test scaffolding from leaking into production.

5. **Integration tests are real end-to-end**: The RBAC integration tests in `rbac.middleware.test.ts` create actual users in MongoDB, sign real JWTs, and make HTTP requests through the full Express middleware chain. This validates that `authMiddleware` -> `requireRole` -> handler pipeline works correctly.

### Minor Issues (Non-Blocking)

6. **Dual import of Role** (`data-visibility.middleware.ts`, line 1-2): The file imports `Role` as both a value (`import { Role }`) and a type (`import type { Role as RoleType }`). This works but is slightly redundant -- the value import `Role` can be used for both the const comparisons and the type annotation since TypeScript allows `typeof Role` or using the type export directly. Consider simplifying to a single import.

7. **Non-null assertion on `req.user!`** (`rbac-test.routes.ts`, lines 29, 40, 51): The test routes use `req.user!` after `requireRole()` middleware. This is safe because `requireRole()` throws if `req.user` is undefined, but a more defensive pattern would be to add a runtime check or use a type-narrowing helper. Acceptable for test-only routes.

8. **`scopeQuery` spread-merge limitation**: The `scopeQuery` function uses simple object spread (`{ ...baseQuery, ...visibilityFilter }`). If a base query and visibility filter share a key, the visibility filter silently wins. This is actually the correct behavior for security (visibility filter should override), but it's worth noting for future maintainers. A comment on this intentional precedence would help.

9. **Unit test assertion style**: Several unit tests use a try/catch pattern to check error properties (e.g., `rbac.middleware.test.ts` lines 52-58) rather than using Vitest's `.toThrowError()` or a custom matcher. This works but is verbose. Consider using `expect(() => ...).toThrow(expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }))` for conciseness.

10. **Missing test for `buildVisibilityFilter` with MAINTENANCE on `ownedByStudent`**: The `data-visibility.middleware.test.ts` file has a test for MAINTENANCE throwing FORBIDDEN on `ownedByStudent` (line 35-39), which is correct. However, the test only checks that it throws -- it doesn't verify the error code/status like the GUARD tests do. Minor inconsistency.

### No Issues Found

- Naming conventions: kebab-case files, camelCase fields -- correct.
- Error codes: Uses `UNAUTHORIZED` (401) and `FORBIDDEN` (403) from the shared `ErrorCode` type -- correct.
- Middleware ordering: `authMiddleware` is always placed before `requireRole()` in the route chain -- correct.
- No direct model imports in middleware -- these are pure utility functions, not controllers.

---

## Acceptance Criteria Verification

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-1 | `requireRole()` blocks STUDENT from warden-only endpoints (403) | PASS | `requireRole('WARDEN_ADMIN')` rejects STUDENT with 403. Unit test (line 47-58) + integration test (line 121-131) both verify. |
| AC-2 | GUARD blocked from complaint endpoints (403) | PASS | `/api/test/complaints` uses `requireRole('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE')` which excludes GUARD. Unit test (line 107-117) + integration test (line 156-166) verify. |
| AC-3 | STUDENT queries auto-filter by `studentId` | PASS | `buildVisibilityFilter(user, 'ownedByStudent')` returns `{ studentId: user._id }` for STUDENT. Unit test (data-visibility line 6-12) + integration test (line 168-178) verify the filter is applied. |
| AC-4 | WARDEN has no visibility restrictions | PASS | `buildVisibilityFilter` returns `{}` for WARDEN_ADMIN on both resource types. Unit tests (data-visibility lines 14-19, 50-57) + integration test (line 180-190) verify. |
| AC-5 | MAINTENANCE sees only assigned complaints | PASS | `buildVisibilityFilter(user, 'assignedToMaintenance')` returns `{ assignedTo: user._id }` for MAINTENANCE. Unit test (data-visibility lines 43-49) + integration tests (lines 192-202, 204-214) verify. |

---

## Overall Assessment

**APPROVE**

The implementation is well-structured, minimal, and correctly enforces all RBAC boundaries defined in the architecture document. All five acceptance criteria are verified through both unit and integration tests. The code follows project conventions (naming, error handling, middleware patterns). The minor issues identified are non-blocking improvements that can be addressed in future iterations.
