# Story 1.7: Account Management (Warden)

## Story

As a **warden/admin**,
I want to create user accounts, disable accounts, and reset credentials,
So that I can manage hostel users for the system.

## Status: Draft

## Acceptance Criteria

**AC1:** Given I am a WARDEN, when I POST to `/api/admin/users` with name, email, role, password, block, floor, roomNumber, then a new user account is created with hashed password and the specified role.

**AC2:** Given I am a WARDEN, when I PATCH `/api/admin/users/:id/disable`, then the user account is disabled (`isActive: false`) and all their refresh token jtis are deleted (sessions invalidated).

**AC3:** Given I am a WARDEN, when I POST `/api/admin/users/:id/reset-password` with a new password, then the password is updated, all refresh token jtis are deleted, and all sessions are invalidated.

**AC4:** Given I am NOT a WARDEN, when I attempt any account management endpoint, then the server returns 403 FORBIDDEN.

## Tasks

### Task 1: Create User Validation Schema (shared)

**File:** `shared/schemas/admin.schema.ts`

- Create `createUserSchema` with Zod:
  - `name`: string, min 2, max 100, trimmed
  - `email`: string, email format
  - `password`: string, min 8, max 128
  - `role`: enum of Role values
  - `block`: optional string
  - `floor`: optional string
  - `roomNumber`: optional string
- Create `resetPasswordSchema`:
  - `password`: string, min 8, max 128
- Export both from `shared/index.ts`

### Task 2: Create Admin Service

**File:** `server/src/services/admin.service.ts`

- `createUser(data)` — hash password with bcrypt, create User doc, return user (without sensitive fields)
  - Check for duplicate email → throw CONFLICT
- `disableUser(userId, correlationId)` — set `isActive: false`, clear `refreshTokenJtis`
  - Throw NOT_FOUND if user doesn't exist
  - Prevent disabling self (warden can't disable their own account)
- `resetPassword(userId, newPassword, correlationId)` — hash new password, update user, clear `refreshTokenJtis`
  - Throw NOT_FOUND if user doesn't exist

### Task 3: Create Admin Controller

**File:** `server/src/controllers/admin.controller.ts`

- `createUser(req, res)` — validate body with `createUserSchema`, call `adminService.createUser()`, return 201 with user data
- `disableUser(req, res)` — extract `id` from params, call `adminService.disableUser()`, return 200
- `resetPassword(req, res)` — validate body with `resetPasswordSchema`, extract `id` from params, call `adminService.resetPassword()`, return 200

### Task 4: Create Admin Routes

**File:** `server/src/routes/admin.routes.ts`

- All routes use `authMiddleware` + `requireRole(Role.WARDEN_ADMIN)`
- `POST /` → `adminController.createUser`
- `PATCH /:id/disable` → `adminController.disableUser`
- `POST /:id/reset-password` → `adminController.resetPassword`

### Task 5: Register Admin Routes in App

**File:** `server/src/app.ts`

- Import admin routes
- Mount at `/api/admin/users`

### Task 6: Verify & Test

- Verify all 4 ACs are met by tracing through the code
- Ensure error handling follows existing patterns (AppError with correct codes)
- Ensure controller → service → model pattern is respected (controller never imports model directly)

## Dev Notes

- User model already has `isActive`, `refreshTokenJtis`, `passwordHash` fields — no schema changes needed
- `invalidateAllSessions()` already exists in `auth.service.ts` — reuse it or inline equivalent
- RBAC middleware `requireRole(Role.WARDEN_ADMIN)` already implemented and tested
- Use bcrypt salt rounds from existing auth service pattern (10 rounds)
- Follow existing response envelope: `{ success: true, data: {...}, correlationId }`
