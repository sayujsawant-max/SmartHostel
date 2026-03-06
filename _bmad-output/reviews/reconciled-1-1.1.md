# Reconciled Review — Story 1.1

Source: Claude review only (Codex review skipped — OpenAI quota exceeded)

## Summary
- Critical: 1
- Major: 5
- Minor: 4

## Findings (Priority Order)

### 1. [CRITICAL] Missing `@types/express` in server devDependencies
**File:** server/package.json
**Issue:** Story spec requires `@types/express`. If Express 5 doesn't bundle types, all server files with `import type { Request, Response }` will fail.
**Fix:** Verify if Express 5.2.1 bundles types. If not, add `@types/express` at exact version.

### 2. [MAJOR] Server tsconfig uses wrong module/moduleResolution
**File:** server/tsconfig.json:5
**Issue:** Uses `module: "ESNext"` / `moduleResolution: "bundler"` instead of `"NodeNext"`. Build output may not run under `node dist/index.js`.
**Fix:** Change to `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### 3. [MAJOR] Env parsing mismatch — duration strings parsed as numbers
**File:** server/src/config/env.ts:30-31
**Issue:** `.env.example` has `ACCESS_TOKEN_EXPIRY=4h` but env.ts uses `z.coerce.number()`, silently producing NaN.
**Fix:** Add duration-parsing transform to zod schema (parse "4h" → 14400000ms).

### 4. [MAJOR] Refresh token cookie path too broad
**File:** server/src/utils/auth-cookies.ts:17
**Issue:** Path is `/api/auth` instead of architecture-specified `/api/auth/refresh`.
**Fix:** Change to `path: '/api/auth/refresh'`.

### 5. [MAJOR] ALLOWED_ORIGINS missing from .env.example
**File:** .env.example
**Issue:** Server code reads this but it's not documented.
**Fix:** Add `ALLOWED_ORIGINS=http://localhost:5173`.

### 6. [MAJOR] Required env vars block dev startup
**File:** server/src/config/env.ts:24
**Issue:** CLOUDINARY_URL, JWT_SECRET, QR_SECRET are required with no defaults. Server crashes on first `npm run dev`.
**Fix:** Make CLOUDINARY_URL optional for dev. Add example values in .env.example for JWT_SECRET and QR_SECRET.

### 7. [MINOR] app.css imported in App.tsx instead of main.tsx
**File:** client/src/App.tsx:1
**Fix:** Move import to main.tsx. Low priority.

### 8. [MINOR] Duplicate correlationId declaration
**File:** server/src/middleware/correlation-id.middleware.ts + server/src/types/express.d.ts
**Fix:** Remove duplicate from correlation-id.middleware.ts.

### 9. [MINOR] req.user.role typed as string instead of Role enum
**File:** server/src/types/express.d.ts:6-8
**Fix:** Import and use `Role` type from shared.

### 10. [MINOR] Scope creep — auth implemented ahead of Story 1.2
**File:** Multiple auth files
**Fix:** No rollback needed. Flag that Story 1.2 scope is partially delivered.
