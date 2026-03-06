# Story 1.3: API Standards, Error Handling & Validation

Status: ready-for-dev

## Story

As a developer,
I want consistent API response formats, centralized error handling, and request validation,
so that every endpoint behaves predictably and errors are debuggable.

## Acceptance Criteria

1. **Given** any successful API response, **When** the client parses it, **Then** it follows the shape `{ success: true, data: T, correlationId: string }` **And** paginated responses add `{ pagination: { page, limit, total } }`.

2. **Given** any error response, **When** the client parses it, **Then** it follows `{ success: false, error: { code, message, retryable, field?, retryAfterMs? }, correlationId }` **And** code is one of: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

3. **Given** an AppError class exists, **When** a service throws `new AppError('NOT_FOUND', 'Complaint not found', 404)`, **Then** the global error handler catches it and returns the standard error response shape **And** no stack traces are leaked in production (`NODE_ENV=production`).

4. **Given** a route with zod validation middleware, **When** a request body fails schema validation, **Then** the server returns 400 with code `VALIDATION_ERROR` and field-level error details in a `details` array.

5. **Given** any incoming request, **When** it reaches the correlation-id middleware, **Then** `req.correlationId` is set (from `X-Correlation-Id` header if present, otherwise UUID generated) **And** the response includes `X-Correlation-Id` header with the same value **And** all pino log entries for that request include the correlationId.

6. **Given** the pino logger is configured, **When** any server code logs an event, **Then** it uses pino structured logging (never `console.log`) **And** includes `eventType` + `correlationId` fields.

## Tasks / Subtasks

- [ ] Task 1: Create validate middleware factory (AC: #4)
  - [ ] 1.1 Create `server/src/middleware/validate.middleware.ts`
  - [ ] 1.2 Implement `validate(target, schema)` factory that returns Express middleware — `target` is `'body'` | `'query'` | `'params'`
  - [ ] 1.3 On validation success: assign parsed data back to `req[target]` (coerced/stripped) and call `next()`
  - [ ] 1.4 On validation failure: throw `AppError('VALIDATION_ERROR', ...)` with 400 and a `details` array containing all field-level errors (not just the first one)

- [ ] Task 2: Extend AppError to support `details` array for validation errors (AC: #4)
  - [ ] 2.1 Add optional `details?: Array<{ field: string; message: string }>` to `AppErrorOptions` interface in `server/src/utils/app-error.ts`
  - [ ] 2.2 Store `details` on the AppError instance as a readonly property
  - [ ] 2.3 Update `shared/types/api-responses.ts` — add `details?: Array<{ field: string; message: string }>` to the `ApiError.error` shape

- [ ] Task 3: Update error handler to output `details` and suppress stack traces (AC: #3, #4)
  - [ ] 3.1 In `server/src/middleware/error-handler.middleware.ts`, include `details` in the JSON response when present on AppError
  - [ ] 3.2 Verify the existing error handler already suppresses stack traces for AppError responses (it does — stack is only logged for UNHANDLED_ERROR via pino, never sent in response)
  - [ ] 3.3 Add explicit test: in production mode (`NODE_ENV=production`), UNHANDLED_ERROR response body must NOT contain `stack`, `error.stack`, or internal details

- [ ] Task 4: Create response helper functions (AC: #1)
  - [ ] 4.1 Create `server/src/utils/response-helpers.ts`
  - [ ] 4.2 Implement `sendSuccess(res, data, statusCode?)` — sends `{ success: true, data, correlationId: req.correlationId }` with default 200
  - [ ] 4.3 Implement `sendPaginated(res, data, pagination)` — sends `{ success: true, data, pagination: { page, limit, total }, correlationId }`
  - [ ] 4.4 `sendSuccess` and `sendPaginated` read `correlationId` from `res.req.correlationId`

- [ ] Task 5: Create pagination helper types and defaults (AC: #1)
  - [ ] 5.1 Create `shared/types/pagination.ts` — export `PaginationParams` interface `{ page: number; limit: number }` and `PaginationResult` interface `{ page: number; limit: number; total: number }`
  - [ ] 5.2 Create `shared/schemas/pagination.schema.ts` — zod schema for query string pagination params with defaults: `page` default 1 (min 1), `limit` default 20 (min 1, max 100)
  - [ ] 5.3 Re-export pagination types and schema from `shared/index.ts`
  - [ ] 5.4 Rebuild shared: `npm -w shared run build`

- [ ] Task 6: Refactor auth controller to use validate middleware (AC: #4)
  - [ ] 6.1 In `server/src/routes/auth.routes.ts`, add `validate('body', loginSchema)` middleware to the `POST /login` route
  - [ ] 6.2 Remove inline `loginSchema.safeParse()` from `auth.controller.ts` login function — body is pre-validated by middleware
  - [ ] 6.3 Remove the `AppError` import from auth.controller.ts if no longer needed after removing inline validation (check other usages first)
  - [ ] 6.4 Verify all existing auth tests still pass after refactor

- [ ] Task 7: Refactor auth controller to use response helpers (AC: #1)
  - [ ] 7.1 Replace inline `res.json({ success: true, data: ..., correlationId: ... })` in auth controller's `login`, `me`, `refresh`, and `logout` handlers with `sendSuccess(res, { user: ... })`
  - [ ] 7.2 Verify all existing auth integration tests still pass — response shape must remain identical

- [ ] Task 8: Verify correlation ID and logging compliance (AC: #5, #6)
  - [ ] 8.1 Verify `correlation-id.middleware.ts` already generates UUID, reads `X-Correlation-Id` header, attaches to `req.correlationId`, echoes in response header (it does — created in Story 1.1)
  - [ ] 8.2 Verify pino-http is configured to include correlationId in every request log entry
  - [ ] 8.3 Spot-check auth service and error handler logs include `eventType` + `correlationId`
  - [ ] 8.4 If any gaps found, fix them; if none, mark as verified

- [ ] Task 9: Write tests (AC: all)
  - [ ] 9.1 Create `server/src/middleware/validate.middleware.test.ts` — test: valid body passes through, invalid body returns 400 with VALIDATION_ERROR + details array containing all field errors, valid query params coerced, invalid params rejected
  - [ ] 9.2 Create `server/src/utils/response-helpers.test.ts` — test: sendSuccess returns correct shape + status, sendPaginated includes pagination object, correlationId is included
  - [ ] 9.3 Add to existing `server/src/app.test.ts` — test: UNHANDLED_ERROR (non-AppError thrown) returns generic message with no stack trace in response body
  - [ ] 9.4 Verify: `npm run test` passes from root (all workspaces)

## Dev Notes

### What Already Exists (From Stories 1.1 + 1.2)

Story 1.3 is primarily about **formalizing and extending** existing infrastructure — NOT building from scratch.

**Already built and working:**
| Component | File | Status |
|-----------|------|--------|
| AppError class | `server/src/utils/app-error.ts` | ✅ Works — needs `details` field added |
| Error handler | `server/src/middleware/error-handler.middleware.ts` | ✅ Works — needs `details` output added |
| Correlation ID | `server/src/middleware/correlation-id.middleware.ts` | ✅ Complete — no changes needed |
| Pino logger | `server/src/utils/logger.ts` | ✅ Complete — no changes needed |
| API response types | `shared/types/api-responses.ts` | ✅ Has ApiSuccess, ApiError, PaginatedResponse — needs `details` field |
| Error codes | `shared/constants/error-codes.ts` | ✅ 7 locked codes + ERROR_STATUS_MAP — no changes |
| Auth controller | `server/src/controllers/auth.controller.ts` | ⚠️ Has inline zod validation — refactor to middleware |

**New deliverables:**
- `server/src/middleware/validate.middleware.ts` — generic zod validation factory
- `server/src/utils/response-helpers.ts` — `sendSuccess()`, `sendPaginated()`
- `shared/types/pagination.ts` — PaginationParams, PaginationResult
- `shared/schemas/pagination.schema.ts` — zod schema for query pagination

### Architecture Compliance (MUST Follow)

**Error Handling Chain (from architecture.md):**
1. Route handler → zod validates (via `validate` middleware) → controller calls service → service returns or throws `AppError`
2. Global error handler catches AppError → formats standard error response
3. Global error handler catches unknown errors → logs via pino → returns `INTERNAL_ERROR` with no details
4. **Never** throw raw `Error` in services — always throw `AppError(code, message, statusCode)`

**Error Codes (Locked — NEVER invent new ones):**
`VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500)

**Controller → Service → Model Layering:**
Controllers NEVER import models directly. Controllers call services; services call models.

**Logging Rule:**
`pino` structured logging ONLY. No `console.log` anywhere in server code. Every log includes `eventType` + `correlationId`.

### Scope Boundaries

**IN this story:**
- `validate(target, schema)` middleware factory
- `details` array on AppError + error handler + ApiError type
- `sendSuccess(res, data)` and `sendPaginated(res, data, pagination)` helpers
- Pagination types + zod schema in shared
- Refactor auth controller to use validate middleware + response helpers
- Verify correlation ID + pino compliance
- Tests for all new code

**NOT in this story (later stories):**
- Rate limiting middleware → Story 1.4
- CSRF middleware → Story 1.4
- RBAC middleware (`requireRole`) → Story 1.4
- Idempotency key middleware → later story
- Audit event logging → Story 1.7
- Additional domain schemas (leave, complaint, etc.) → their respective stories

### Technical Requirements

#### Validate Middleware Factory

```typescript
// server/src/middleware/validate.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '@utils/app-error.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(target: ValidationTarget, schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new AppError('VALIDATION_ERROR', 'Request validation failed', 400, {
        details,
      });
    }

    // Replace with parsed + coerced data (zod strips unknown keys, coerces types)
    req[target] = result.data;
    next();
  };
}
```

**Key design decisions:**
- Returns all field errors in `details` array, not just the first — matches architecture spec
- Replaces `req[target]` with parsed data — ensures downstream code works with coerced/stripped values
- Uses `issue.path.join('.')` for nested field names (e.g., `address.street`)
- Throws `AppError` — caught by existing error handler middleware

**zod version note:** The project uses zod 4.3.6 (not 3.x). The `safeParse` API and `ZodSchema` type work the same way in zod 4.x. Import `ZodSchema` from `zod` (it's `z.ZodType` in zod 4 — check imports at implementation time).

#### AppError Extension for Details

```typescript
// Addition to server/src/utils/app-error.ts
interface AppErrorOptions {
  retryable?: boolean;
  retryAfterMs?: number;
  field?: string;
  details?: Array<{ field: string; message: string }>;  // NEW
}

export class AppError extends Error {
  // ... existing fields ...
  public readonly details?: Array<{ field: string; message: string }>;  // NEW

  constructor(code: ErrorCode, message: string, statusCode: number, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
    this.field = options.field;
    this.details = options.details;  // NEW
  }
}
```

#### Error Handler Update for Details

```typescript
// Addition to error-handler.middleware.ts — inside the AppError branch:
res.status(err.statusCode).json({
  success: false,
  error: {
    code: err.code,
    message: err.message,
    retryable: err.retryable,
    ...(err.field && { field: err.field }),
    ...(err.details && { details: err.details }),       // NEW
    ...(err.retryAfterMs && { retryAfterMs: err.retryAfterMs }),
  },
  correlationId,
});
```

#### Response Helpers

```typescript
// server/src/utils/response-helpers.ts
import type { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
    correlationId: res.req.correlationId,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
): void {
  res.json({
    success: true,
    data,
    pagination,
    correlationId: res.req.correlationId,
  });
}
```

**Why `res.req.correlationId`?** Response helpers don't receive `req` directly. Express attaches `req` to `res.req`, so the correlation ID is accessible without threading `req` through every call.

#### Pagination Schema (Shared)

```typescript
// shared/schemas/pagination.schema.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
```

```typescript
// shared/types/pagination.ts
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
}
```

**Usage in routes (future stories):**
```typescript
// Example: GET /api/complaints?page=2&limit=10
router.get('/', auth, validate('query', paginationSchema), complaintController.list);
```

#### ApiError Type Update (Shared)

```typescript
// shared/types/api-responses.ts — add details to error shape
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    field?: string;
    details?: Array<{ field: string; message: string }>;  // NEW
    retryAfterMs?: number;
  };
  correlationId: string;
}
```

#### Auth Controller Refactor — Before/After

**Before (current — inline validation):**
```typescript
// auth.controller.ts
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid login input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }
  const { email, password } = parsed.data;
  const result = await authService.login(email, password, req.correlationId);
  setAuthCookies(res, result.tokens);
  res.json({ success: true, data: { user: { ... } }, correlationId: req.correlationId });
}
```

**After (middleware + response helpers):**
```typescript
// auth.routes.ts — validation moved to route definition
router.post('/login', validate('body', loginSchema), authController.login);

// auth.controller.ts — no more inline validation or manual response shaping
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;  // already validated by middleware
  const result = await authService.login(email, password, req.correlationId);
  setAuthCookies(res, result.tokens);
  sendSuccess(res, {
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    },
  });
}
```

### File Structure (New/Modified Files)

```
server/src/
├── middleware/
│   └── validate.middleware.ts           ★ NEW — validate(target, schema) factory
│   └── validate.middleware.test.ts      ★ NEW — validation middleware tests
│   └── error-handler.middleware.ts      ✏️ MODIFIED — add details to response
├── utils/
│   ├── app-error.ts                     ✏️ MODIFIED — add details field
│   ├── response-helpers.ts              ★ NEW — sendSuccess, sendPaginated
│   └── response-helpers.test.ts         ★ NEW — response helper tests
├── controllers/
│   └── auth.controller.ts              ✏️ MODIFIED — use sendSuccess, remove inline validation
├── routes/
│   └── auth.routes.ts                  ✏️ MODIFIED — add validate middleware to POST /login
└── app.test.ts                          ✏️ MODIFIED — add stack trace suppression test

shared/
├── types/
│   ├── api-responses.ts                 ✏️ MODIFIED — add details to ApiError
│   └── pagination.ts                    ★ NEW — PaginationResult interface
├── schemas/
│   └── pagination.schema.ts             ★ NEW — paginationSchema + PaginationParams
└── index.ts                             ✏️ MODIFIED — re-export pagination types + schema
```

### Testing Requirements

- **Framework:** Vitest + supertest (co-located tests)
- **Test scripts MUST use `--passWithNoTests`** flag

**validate.middleware.test.ts:**
- Valid body → calls next, `req.body` replaced with parsed data
- Invalid body → throws AppError with code VALIDATION_ERROR, status 400, details array with ALL field errors (not just first)
- Valid query params with coercion → `req.query` contains coerced values (e.g., `"2"` → `2`)
- Missing required field → details includes the missing field name + "Required" message
- Extra fields → stripped by zod (not passed through)

**response-helpers.test.ts:**
- `sendSuccess(res, { foo: 'bar' })` → status 200, body `{ success: true, data: { foo: 'bar' }, correlationId }`
- `sendSuccess(res, data, 201)` → status 201
- `sendPaginated(res, items, { page: 1, limit: 20, total: 42 })` → status 200, body includes pagination object
- correlationId sourced from `res.req.correlationId`

**app.test.ts additions:**
- Non-AppError thrown → response is `{ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }` with NO `stack` property anywhere in the response body

**Existing test verification:**
- All auth.routes.test.ts and auth.service.test.ts tests MUST still pass after auth controller refactor

### Naming Conventions (MUST follow)

| Element | Convention | Example |
|---------|-----------|---------|
| Server files | kebab-case `.ts` | `validate.middleware.ts`, `response-helpers.ts` |
| Zod schemas | `{entity}.schema.ts` in `shared/schemas/` | `pagination.schema.ts` |
| Shared types | `{entity}.ts` in `shared/types/` | `pagination.ts` |
| Middleware | `{purpose}.middleware.ts` | `validate.middleware.ts` |
| Utility functions | camelCase | `sendSuccess`, `sendPaginated` |

### Anti-Pattern Prevention

1. **Do NOT validate inline in controllers** — always use `validate(target, schema)` middleware on the route
2. **Do NOT return only the first validation error** — return ALL field errors in `details` array
3. **Do NOT use `console.log`** — use pino logger from Story 1.1
4. **Do NOT invent new error codes** — use only the 7 locked codes from `shared/constants/error-codes.ts`
5. **Do NOT construct response JSON manually in controllers** — use `sendSuccess()` / `sendPaginated()` helpers
6. **Do NOT leak stack traces** — error handler already suppresses them; verify with test
7. **Do NOT forget to rebuild shared** — after modifying shared types/schemas, run `npm -w shared run build`
8. **Do NOT import `ZodSchema` without checking** — zod 4.x may export it as `z.ZodType` or `z.ZodSchema`; verify at implementation time
9. **Do NOT break existing auth tests** — the refactor must preserve identical response shapes
10. **Do NOT use `req` parameter in response helpers** — use `res.req.correlationId` to keep the API clean

### Cross-Story Context

| Future Story | What 1.3 Provides |
|-------------|-------------------|
| 1.4 (RBAC) | validate middleware for role-gated route bodies, response helpers for RBAC endpoints |
| 1.5 (Shells) | Standard error shapes for client-side error handling components |
| 1.6 (Account Mgmt) | validate middleware for consent/profile update bodies, sendSuccess for responses |
| 2.1 (Leave Creation) | validate middleware for leave request body, paginationSchema for leave list, sendPaginated for paginated lists |
| ALL future stories | Consistent `validate` + `sendSuccess`/`sendPaginated` pattern replaces all manual validation and response construction |

### Previous Stories Intelligence

**Story 1.1 created:**
- AppError class with options pattern: `new AppError(code, message, statusCode, { retryable?, retryAfterMs?, field? })`
- Error handler middleware (catches AppError + unknown errors, formats standard response)
- Correlation ID middleware (UUID generation, header echo, req.correlationId)
- Pino logger (structured, level-aware, no console.log)
- `ErrorCode` type imported from `@smarthostel/shared`
- `ERROR_STATUS_MAP` for code → HTTP status lookup
- Health route returning standard success shape
- zod 4.3.6 installed, Mongoose 9.2.4, Express 5.2.1

**Story 1.2 created:**
- Auth controller with inline zod validation (to be refactored)
- Auth routes with POST /login, GET /me, POST /refresh, POST /logout
- 27 passing tests (auth.service.test.ts + auth.routes.test.ts + app.test.ts)
- MongoDB `$pull`/`$push` conflict pattern (split into two ops)
- Mongoose 9.x: `{ returnDocument: 'after' }` not `{ new: true }`
- Express Request augmented via `declare module 'express-serve-static-core'`
- Cookie helper utility (`auth-cookies.ts`) centralizes cookie options

### Project Structure Notes

- validate middleware slots into existing `server/src/middleware/` directory alongside auth.middleware.ts and error-handler.middleware.ts
- response-helpers.ts goes in `server/src/utils/` alongside app-error.ts and logger.ts
- Pagination schema follows the shared schema pattern established by auth.schema.ts
- All shared changes require `npm -w shared run build` to compile to dist/

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: API Standards, Error Handling & Validation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns — API Response Format]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns — Error Codes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — Error Handling Chain]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Structure — validate.middleware.ts]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-and-dev-environment.md]
- [Source: _bmad-output/implementation-artifacts/1-2-user-login-and-jwt-authentication.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
