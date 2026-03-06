# Story 1.6: Consent Flow & First-Login Experience

## Description
As a **first-time user**,
I want to see a privacy notice and acknowledge consent before using the system,
So that the system has my documented agreement for data collection.

## Acceptance Criteria

**AC-1:** Given I log in for the first time (hasConsented = false), when AuthContext checks consent status, then a blocking ConsentModal is rendered -- I cannot navigate to any other page

**AC-2:** Given the ConsentModal is displayed, when I read the privacy notice and click "I Accept", then POST `/api/consents` records my consent with userId, version, and timestamp, and the modal dismisses

**AC-3:** Given I have already consented (hasConsented = true), when I log in, then no ConsentModal appears and I proceed directly to my dashboard

**AC-4:** Given the ConsentModal is displayed, when I attempt to dismiss it (Escape key, click outside), then the modal does not close -- acceptance is mandatory

## Technical Context
- **Tech stack:** React 19, React Router 7, Tailwind CSS 4, TypeScript, Express, Mongoose
- **Existing code:**
  - User model at `server/src/models/user.model.ts` already has `hasConsented: boolean` and `consentedAt?: Date`
  - `GET /api/auth/me` returns `hasConsented` in user profile
  - `AuthContext.tsx` manages user state including `hasConsented`
  - `ProtectedRoute.tsx` guards authenticated routes
  - Architecture specifies `consent.model.ts` with collection `'consents'` -- fields: userId, version, timestamp
  - Architecture specifies `ConsentModal.tsx` in `client/src/components/features/auth/`
- **Architecture rules:**
  - SPA React, no SSR (Vite + react-ts)
  - Same-site httpOnly cookies for auth (access + refresh)
  - Tailwind CSS for all styling
  - All Mongoose schemas use `{ collection, timestamps, strict }`
  - Standard API response format: `{ success, data, correlationId }`
  - Path aliases: `@pages/*`, `@components/*`, `@hooks/*`, `@context/*`, `@services/*`, `@models/*`, `@controllers/*`, `@middleware/*`, `@utils/*`, `@config/*`, `@services/*`

### Existing Code
- `server/src/models/user.model.ts` -- User schema with hasConsented, consentedAt
- `server/src/controllers/auth.controller.ts` -- Login/me/refresh/logout handlers
- `server/src/services/auth.service.ts` -- Auth business logic
- `server/src/routes/auth.routes.ts` -- Auth route definitions
- `server/src/middleware/auth.middleware.ts` -- JWT auth middleware
- `server/src/app.ts` -- Express app with route registration
- `client/src/context/AuthContext.tsx` -- AuthProvider with login/logout/user state
- `client/src/context/auth-context-value.ts` -- AuthContext types, UserProfile interface
- `client/src/components/layout/ProtectedRoute.tsx` -- Route guard for authenticated users
- `client/src/App.tsx` -- BrowserRouter with role-based routing
- `client/src/services/api.ts` -- apiFetch wrapper with 401 refresh

## Tasks

### Task 1: Create Consent Model (Mongoose)
Create `server/src/models/consent.model.ts` to store consent records.
- [ ] Subtask 1.1: Define IConsent interface with userId (ref User), version (string), consentedAt (Date)
- [ ] Subtask 1.2: Create Mongoose schema with collection 'consents', timestamps: true, strict: true
- [ ] Subtask 1.3: Add index on userId for efficient lookups

### Task 2: Create Consent Service
Create `server/src/services/consent.service.ts` with business logic.
- [ ] Subtask 2.1: `recordConsent(userId, version)` -- creates Consent doc and updates User.hasConsented=true, User.consentedAt
- [ ] Subtask 2.2: Validate userId exists and is active before recording
- [ ] Subtask 2.3: Return the created consent record

### Task 3: Create Consent Controller
Create `server/src/controllers/consent.controller.ts` with POST handler.
- [ ] Subtask 3.1: Parse and validate request body (version field)
- [ ] Subtask 3.2: Call consent service with req.user._id and version
- [ ] Subtask 3.3: Return standard API response with consent record

### Task 4: Create Consent Routes and Register in App
Create `server/src/routes/consent.routes.ts` and register in `server/src/app.ts`.
- [ ] Subtask 4.1: POST `/api/consents` protected by authMiddleware
- [ ] Subtask 4.2: Register route in app.ts

### Task 5: Include hasConsented in Login Response
Update `server/src/controllers/auth.controller.ts` login handler.
- [ ] Subtask 5.1: Add `hasConsented` field to login response user object

### Task 6: Add setConsented to AuthContext
Update `client/src/context/AuthContext.tsx` and types.
- [ ] Subtask 6.1: Add `setConsented()` function that updates user.hasConsented in state
- [ ] Subtask 6.2: Export via AuthContext so ConsentModal can call it after POST

### Task 7: Create ConsentModal Component
Create `client/src/components/features/auth/ConsentModal.tsx`.
- [ ] Subtask 7.1: Full-screen blocking overlay (no dismiss on Escape or click outside)
- [ ] Subtask 7.2: Privacy notice text content
- [ ] Subtask 7.3: "I Accept" button that POSTs to /api/consents
- [ ] Subtask 7.4: On success, call setConsented() to dismiss modal
- [ ] Subtask 7.5: Loading state on button during API call
- [ ] Subtask 7.6: Error handling with retry capability

### Task 8: Integrate ConsentModal in ProtectedRoute
Update `client/src/components/layout/ProtectedRoute.tsx`.
- [ ] Subtask 8.1: Check user.hasConsented after authentication check
- [ ] Subtask 8.2: If hasConsented is false, render ConsentModal instead of Outlet
- [ ] Subtask 8.3: After consent, render Outlet normally

## Dev Agent Record

### Implementation Summary

**Task 1 (Consent Model):** Created `consent.model.ts` with `IConsent` interface (userId ref, version string, consentedAt Date). Schema uses `{ collection: 'consents', timestamps: true, strict: true }` with index on userId.

**Task 2 (Consent Service):** Created `consent.service.ts` with `recordConsent(userId, version)`. Validates user exists and is active, creates Consent document, updates `User.hasConsented=true` and `User.consentedAt`, logs the event.

**Task 3 (Consent Controller):** Created `consent.controller.ts` with `createConsent` handler. Validates version field from request body, calls service, returns 201 with consent record in standard API format.

**Task 4 (Consent Routes):** Created `consent.routes.ts` with `POST /` protected by `authMiddleware`. Registered as `/api/consents` in `app.ts`.

**Task 5 (Login Response):** Added `hasConsented: result.user.hasConsented` to the login response user object in `auth.controller.ts`, so the client receives consent status immediately on login.

**Task 6 (AuthContext):** Added `setConsented()` callback to `AuthContext` that updates `user.hasConsented` to `true` in state. Added to `AuthContextType` interface.

**Task 7 (ConsentModal):** Created blocking full-screen overlay modal with:
- Escape key handler that prevents dismissal (captures at window level)
- No click-outside dismiss (overlay does not have click handler to close)
- Privacy notice with sections: Data We Collect, How We Use Your Data, Data Retention, Your Rights
- "I Accept" button that POSTs to `/api/consents` with version `1.0`
- Loading state during submission, error display with retry capability
- Uses Tailwind CSS with CSS custom properties matching existing design system

**Task 8 (ProtectedRoute Integration):** Updated `ProtectedRoute` to check `user.hasConsented` after authentication. If false, renders `ConsentModal` instead of `<Outlet />`. After consent, `setConsented()` updates state and modal disappears, rendering routes normally.

### New Dependencies
None -- uses existing Express, Mongoose, React, Tailwind CSS stack.

### File List
- `server/src/models/consent.model.ts` (new)
- `server/src/services/consent.service.ts` (new)
- `server/src/controllers/consent.controller.ts` (new)
- `server/src/routes/consent.routes.ts` (new)
- `server/src/app.ts` (modified -- registered consent routes)
- `server/src/controllers/auth.controller.ts` (modified -- hasConsented in login response)
- `client/src/components/features/auth/ConsentModal.tsx` (new)
- `client/src/components/layout/ProtectedRoute.tsx` (modified -- consent check + ConsentModal)
- `client/src/context/AuthContext.tsx` (modified -- setConsented callback)
- `client/src/context/auth-context-value.ts` (modified -- setConsented in AuthContextType)
