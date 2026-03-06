# Code Review — Story 1.1

## Summary
- Files reviewed: 35
- Critical: 1
- Major: 5
- Minor: 4

## Findings

### [CRITICAL] Missing `@types/express` in server devDependencies
**File:** `c:/Projects/Agent/server/package.json`
**Issue:** The story (Task 4.3) explicitly requires `@types/express` as a server devDependency. It is absent from `server/package.json`. The project may still compile if Express 5 ships its own types or if a transitive dependency pulls them in, but this is fragile and violates the story spec. If types are not available, every `import type { Request, Response } from 'express'` across all server files will fail.
**Fix:** Add `"@types/express": "<exact-version>"` to `server/package.json` devDependencies, or verify Express 5.2.1 bundles its own types (in which case document this explicitly).

### [MAJOR] Server tsconfig uses `module: "ESNext"` instead of `"NodeNext"`
**File:** `c:/Projects/Agent/server/tsconfig.json`:5
**Issue:** The story (Task 4.4) specifies `module: NodeNext` and `moduleResolution: NodeNext` for the server workspace. The implementation uses `module: "ESNext"` with `moduleResolution: "bundler"`. While this works with `tsx` in dev, `bundler` module resolution is not correct for a Node.js server — it allows import paths that Node.js itself would reject (e.g., extensionless imports). The `tsc` build step may produce output that does not run under `node dist/index.js` without the `tsc-alias` workaround that was added.
**Fix:** Change to `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` per the story spec to ensure `tsc` output is natively runnable by Node.js. This will also require ensuring all imports use `.js` extensions (which they already do).

### [MAJOR] `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` env parsing mismatch
**File:** `c:/Projects/Agent/server/src/config/env.ts`:30-31
**Issue:** `.env.example` specifies `ACCESS_TOKEN_EXPIRY=4h` and `REFRESH_TOKEN_EXPIRY=7d` (human-readable duration strings). However, `env.ts` parses these with `z.coerce.number()`, which will coerce `"4h"` to `NaN` and fall back to the numeric default (3600000 ms). This means the `.env.example` values are silently ignored — the env validation does not reject them (because `z.coerce.number()` on a non-numeric string returns `NaN`, and `NaN` is a number). The defaults happen to be reasonable, but the actual `.env` values are effectively dead configuration.
**Fix:** Either (a) change `.env.example` to use millisecond values (`ACCESS_TOKEN_EXPIRY=14400000`, `REFRESH_TOKEN_EXPIRY=604800000`) to match the numeric parser, or (b) use a duration-parsing transform (e.g., parse `"4h"` into ms) in the zod schema so the human-readable format works. Option (b) is preferred for developer ergonomics.

### [MAJOR] Refresh token cookie path does not match architecture spec
**File:** `c:/Projects/Agent/server/src/utils/auth-cookies.ts`:17
**Issue:** Architecture doc specifies refresh token cookie `path: '/api/auth/refresh'` (scoped to only the refresh endpoint). The implementation uses `path: '/api/auth'`, which sends the refresh token on all auth routes (login, logout, me). This increases attack surface — the refresh token is sent on requests where it is not needed.
**Fix:** Change `REFRESH_COOKIE_OPTIONS.path` to `'/api/auth/refresh'` per the architecture spec.

### [MAJOR] `ALLOWED_ORIGINS` missing from `.env.example`
**File:** `c:/Projects/Agent/.env.example`
**Issue:** `server/src/app.ts` reads `process.env.ALLOWED_ORIGINS` for CORS configuration, and `server/src/config/env.ts` defines it in the env schema with a default. However, `.env.example` does not include `ALLOWED_ORIGINS`, so developers are unaware this configuration exists. The story file list does not require it, but since the server code depends on it, it should be documented.
**Fix:** Add `ALLOWED_ORIGINS=http://localhost:5173` to `.env.example`.

### [MAJOR] `CLOUDINARY_URL` is required (no default) in env.ts — blocks dev startup
**File:** `c:/Projects/Agent/server/src/config/env.ts`:24
**Issue:** `env.ts` makes `CLOUDINARY_URL` a required field with `z.string().startsWith('cloudinary://')`. The `.env.example` has `CLOUDINARY_URL=` (empty). This means any developer running `npm run dev` for the first time will get an env validation crash, even though Cloudinary is not needed for Story 1.1. Similarly, `JWT_SECRET` and `QR_SECRET` require 32+ characters with no defaults — the server will crash on startup without setting these, which is not mentioned in the story.
**Fix:** For scaffolding purposes, either (a) make `CLOUDINARY_URL` optional (`.optional().default('')`), or (b) add a comment in `.env.example` explaining these must be set before the server starts. `JWT_SECRET` and `QR_SECRET` being required is correct for security, but `.env.example` should contain example values (e.g., `JWT_SECRET=change-me-to-at-least-32-characters!!`).

### [MINOR] `app.css` not imported in App.tsx — imported in both App.tsx and potentially main.tsx
**File:** `c:/Projects/Agent/client/src/App.tsx`:1
**Issue:** `app.css` is imported in `App.tsx` (`import './app.css'`), but typically CSS should be imported once at the entry point (`main.tsx`). Since `main.tsx` does not import `app.css`, this works, but the pattern is slightly unconventional.
**Fix:** No action strictly required; this is a style preference. Consider moving the import to `main.tsx` for clarity.

### [MINOR] Scope creep beyond Story 1.1
**File:** Multiple files (auth routes, auth controller, auth service, auth middleware, user model, login page, auth context, etc.)
**Issue:** Story 1.1 is "Project Scaffolding & Dev Environment." The file list in the story doc does include auth-related files, but the story's acceptance criteria only cover: npm install, npm run dev, /api/health response, and directory structure. A full auth implementation (login, refresh, logout, JWT middleware, user model, bcrypt hashing, cookie management, login page with form validation) was built. While the dev agent record in the story doc lists these files, this represents significant functional scope that arguably belongs to a separate auth story. This increases review surface and risk for what should be a scaffolding story.
**Fix:** No rollback needed — the code is well-structured and will be needed. Flag for project tracking that auth functionality was delivered ahead of its dedicated story.

### [MINOR] Duplicate `correlationId` declaration across two files
**File:** `c:/Projects/Agent/server/src/middleware/correlation-id.middleware.ts`:4-8 and `c:/Projects/Agent/server/src/types/express.d.ts`:3-8
**Issue:** The `Request.correlationId` property is declared in the `express-serve-static-core` module augmentation in both files. While TypeScript merges declarations and this does not cause errors, it is unnecessary duplication.
**Fix:** Remove the declaration from `correlation-id.middleware.ts` since `express.d.ts` already provides it, or consolidate into a single location.

### [MINOR] `express.d.ts` also declares `Request.user` without importing the `Role` type
**File:** `c:/Projects/Agent/server/src/types/express.d.ts`:6-8
**Issue:** `req.user.role` is typed as `string` rather than the `Role` type from `@smarthostel/shared`. This weakens type safety — any string can be assigned to `role`, and consumers must cast or assert.
**Fix:** Import and use the `Role` type: `role: Role` instead of `role: string`.

## Acceptance Criteria Verification

- [x] AC1: npm install works — PASS (confirmed in dev agent record: exit code 0, 516 packages audited; all workspaces resolve)
- [x] AC2: npm run dev starts both servers — PASS (concurrently configured correctly; Vite on 5173 via `vite` script, Express on 5000 via `tsx watch`; note: server will crash if env vars not set — see MAJOR finding about CLOUDINARY_URL)
- [x] AC3: /api/health returns correct response — PASS (health route returns `{ success: true, data: { status: "healthy" }, correlationId: "..." }`; the `correlationId` field is extra but does not violate the contract)
- [x] AC4: Directory structure matches architecture — PASS (all skeleton directories confirmed present for client/src, server/src, and shared; all root files present)

## Additional Checks

- **Version pinning (no caret/tilde):** PASS — all four package.json files use exact versions
- **`.nvmrc` contains `20`:** PASS
- **`.gitignore` covers required entries:** PASS (node_modules/, dist/, .env, .env.local, *.log, .DS_Store, coverage/, shared/dist/)
- **`engines` field in root package.json:** PASS (`node >=20.0.0`, `npm >=10.0.0`)
- **Shared `composite: true`:** PASS
- **Shared exports all four roles:** PASS (STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE)
- **Shared exports `ApiSuccess<T>` and `ApiError`:** PASS
- **`tsconfig.base.json` exists:** PASS (referenced by client/tsconfig.app.json, server/tsconfig.json, shared/tsconfig.json)
- **Tailwind plugin in vite.config.ts:** PASS
- **Vite proxy for `/api`:** PASS (target: `http://localhost:5000`, changeOrigin: true)
- **`trust proxy` set to 1:** PASS

## Overall Assessment

**PASS WITH FIXES**

The scaffolding is solid and well-organized. The project structure, workspace configuration, version pinning, and dev tooling are all correctly set up. The implementation goes beyond the scaffolding story to include a working auth system, which is well-implemented but represents scope creep.

The critical fix needed is ensuring `@types/express` is available. The major fixes (tsconfig module setting, env var parsing mismatch, refresh cookie path, required env vars blocking startup) should be addressed before subsequent stories build on this foundation — particularly the env validation strictness, which will prevent any developer from running `npm run dev` without first configuring secrets that are irrelevant to early stories.
