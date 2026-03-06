# Code Review: Story 1.6 -- Consent Flow & First-Login Experience

**Reviewer:** Claude (automated)
**Date:** 2026-03-06
**Verdict:** PASS (minor issues noted)

---

## AC Verification

| AC | Status | Notes |
|----|--------|-------|
| AC-1: hasConsented=false shows blocking ConsentModal | PASS | `ProtectedRoute` checks `user.hasConsented` and renders `<ConsentModal />` instead of `<Outlet />` |
| AC-2: "I Accept" POSTs /api/consents, modal dismisses | PASS | `handleAccept` calls `apiFetch('/consents', { method: 'POST', body: ... })` then `setConsented()` which updates AuthContext state |
| AC-3: hasConsented=true skips modal | PASS | `ProtectedRoute` only renders ConsentModal when `!user.hasConsented`; otherwise falls through to `<Outlet />` |
| AC-4: Cannot dismiss via Escape or click outside | PASS | Escape key captured at window level with `preventDefault`/`stopPropagation` in capture phase; overlay div has no click-to-close handler |

---

## File-by-File Review

### consent.model.ts -- PASS
- IConsent interface has userId, version, consentedAt as specified.
- Schema options `{ collection: 'consents', timestamps: true, strict: true }` match architecture rules.
- Index on `userId` present.

### consent.service.ts -- PASS
- Validates user exists and is active before recording.
- Creates Consent doc, then updates User.hasConsented and User.consentedAt atomically enough for this use case.
- Logs the consent event with correlationId.

### consent.controller.ts -- PASS
- Validates version field presence and type.
- Returns 201 with standard `{ success, data, correlationId }` format.

### consent.routes.ts -- PASS
- Single POST route protected by `authMiddleware`.

### app.ts -- PASS
- Consent routes registered at `/api/consents`.

### auth.controller.ts -- PASS
- `hasConsented` included in login response.
- Also present in `/auth/me` response.
- **Note:** `refresh` endpoint (line 83-94) does NOT return `hasConsented` in its user object. This is acceptable since refresh only rotates tokens and the client already has the consent state in memory, but worth noting for consistency.

### ConsentModal.tsx -- PASS
- Full-screen fixed overlay with z-50.
- Escape key blocked via capture-phase keydown listener.
- "I Accept" button with loading/disabled state.
- Error display with implicit retry (user clicks again).
- Good accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

### ProtectedRoute.tsx -- PASS
- Checks auth first, then consent. Correct ordering.
- Returns ConsentModal as a full replacement (not alongside Outlet).

### AuthContext.tsx -- PASS
- `setConsented` callback immutably updates user state.
- Wrapped in `useCallback` with no dependencies (correct, since it uses functional setState).

### auth-context-value.ts -- PASS
- `hasConsented` typed as optional (`hasConsented?: boolean`), which is appropriate since the `/auth/me` response may not always include it for all code paths.
- `setConsented` in `AuthContextType` interface.

---

## Minor Issues

1. **No duplicate-consent guard on the server.** If a user clicks "I Accept" twice rapidly (before the first response returns), two Consent documents are created. Low severity since the User flag is idempotently set to `true`, but the `consents` collection will have duplicate records. Consider a unique compound index on `{ userId, version }` or a check in the service.

2. **`hasConsented` is optional in `UserProfile`.** The type `hasConsented?: boolean` means `undefined` is falsy, so `!user.hasConsented` correctly catches both `false` and `undefined`. This works, but an explicit `boolean` type with a default would be clearer in intent.

3. **Consent version is hardcoded client-side** as `'1.0'`. When the privacy policy changes, the version must be bumped manually. This is fine for now but consider making it configurable in a future story.

---

## Summary

All four acceptance criteria are met. The server-side model, service, controller, and routes follow the established patterns (standard response format, path aliases, Mongoose schema options). The client-side ConsentModal is properly blocking, accessible, and integrated into ProtectedRoute. No blocking issues found.
