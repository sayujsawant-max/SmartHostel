# Story 1.8: Public Student Registration

## Description
As a **prospective student**,
I want to create an account with my name, email, and password,
So that I can access the hostel system without waiting for an admin to create my account.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am on the login page, when I click "Sign up", then I am navigated to `/register`

**AC-2:** Given I am on the registration page, when I submit a valid name (min 2 chars), email, and password (min 8 chars), then the server creates a STUDENT account, sets auth cookies, and redirects me to `/student/status`

**AC-3:** Given I submit a registration with an email that already exists, when the server processes it, then the server returns 409 CONFLICT with message "A user with this email already exists"

**AC-4:** Given I submit a registration with invalid data (short name, bad email, short password), when the server validates with zod, then the server returns 400 VALIDATION_ERROR with the failing field

**AC-5:** Given I am already authenticated, when I navigate to `/register`, then I am redirected to my role home page

## Technical Context
- **Tech stack:** Express + TypeScript, React 19, Mongoose 8, Tailwind CSS, zod
- **Architecture rules:** Controllers never import models -- they call services
- **Naming conventions:** kebab-case server files, camelCase JSON fields
- **Key implementation details:** Registration creates STUDENT role only; uses same auth cookie mechanism as login

### Existing Code

**Server:**
- `server/src/services/auth.service.ts` -- Added `register()` function. **Status: Complete**
- `server/src/controllers/auth.controller.ts` -- Added `register()` handler. **Status: Complete**
- `server/src/routes/auth.routes.ts` -- Added `POST /register` route. **Status: Complete**

**Client:**
- `client/src/pages/RegisterPage.tsx` -- Registration form with name/email/password. **Status: Complete**
- `client/src/context/AuthContext.tsx` -- Added `register()` method. **Status: Complete**
- `client/src/context/auth-context-value.ts` -- Added `register` to AuthContextType. **Status: Complete**
- `client/src/App.tsx` -- Added `/register` public route. **Status: Complete**
- `client/src/pages/LoginPage.tsx` -- Added "Sign up" link to `/register`. **Status: Complete**

**Shared:**
- `shared/schemas/room.schema.ts` -- Contains `registerSchema` (name, email, password). **Status: Complete**
- `shared/index.ts` -- Exports `registerSchema` and `RegisterInput`. **Status: Complete**

## Tasks

### Task 1: Server-side registration endpoint
- [x] Subtask 1.1: Create `registerSchema` in shared with name (min 2), email, password (min 8) validation
- [x] Subtask 1.2: Add `register()` to auth.service.ts that creates STUDENT user, generates tokens, stores hashed jti
- [x] Subtask 1.3: Add `register()` to auth.controller.ts that validates input, calls service, sets cookies, returns 201
- [x] Subtask 1.4: Add `POST /register` route to auth.routes.ts (public, no auth middleware)

**Tests (AC-2, AC-3, AC-4):**
- [ ] Integration test: POST /auth/register with valid data returns 201 and sets auth cookies
- [ ] Integration test: POST /auth/register with duplicate email returns 409 CONFLICT
- [ ] Integration test: POST /auth/register with invalid data returns 400 VALIDATION_ERROR

### Task 2: Client-side registration page
- [x] Subtask 2.1: Create RegisterPage.tsx with name/email/password form using react-hook-form + zod
- [x] Subtask 2.2: Add `register()` to AuthContext that calls `/auth/register` and sets user state
- [x] Subtask 2.3: Add `/register` route to App.tsx (public, redirects if authenticated)
- [x] Subtask 2.4: Add "Sign up" link on LoginPage

**Tests (AC-1, AC-2, AC-5):**
- [ ] Unit test: LoginPage renders "Sign up" link navigating to /register
- [ ] Unit test: RegisterPage submits form and redirects to /student/status on success
- [ ] Unit test: /register route redirects authenticated users to role home page

## Dependencies
- **Story 1.2** (completed) -- Auth service, JWT tokens, cookie handling
- **Story 1.5** (completed) -- Auth flow, role routing

## File List

### Modified Files
- `server/src/services/auth.service.ts` -- Added register() function
- `server/src/controllers/auth.controller.ts` -- Added register() handler
- `server/src/routes/auth.routes.ts` -- Added POST /register route
- `client/src/context/auth-context-value.ts` -- Added register to interface
- `client/src/context/AuthContext.tsx` -- Added register callback
- `client/src/App.tsx` -- Added /register route + RegisterRoute component
- `client/src/pages/LoginPage.tsx` -- Added Sign up link + gradient background
- `shared/index.ts` -- Added registerSchema export

### New Files
- `shared/schemas/room.schema.ts` -- Contains registerSchema and createRoomSchema
- `client/src/pages/RegisterPage.tsx` -- Registration page component

## Dev Agent Record

### Implementation Date
2026-03-07

### Implementation Notes
**Task 1:** Registration creates STUDENT role only. Uses bcrypt with salt rounds 10. Same token generation as login. Duplicate email returns 409.

**Task 2:** RegisterPage mirrors LoginPage styling with gradient background. Form uses react-hook-form with zod resolver. AuthContext register method follows same pattern as login.
