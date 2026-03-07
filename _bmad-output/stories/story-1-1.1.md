# Story 1.1: Project Scaffolding & Dev Environment

## Description
As a **developer**,
I want the project scaffolded with npm workspaces (client/server/shared), all dependencies installed, and dev scripts working,
So that I have a working development environment to build features on.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a fresh checkout of the repository, when I run `npm install` at the root, then all three workspaces (client, server, shared) have their dependencies installed with exact versions (no caret/tilde ranges)

**AC-2:** Given the project is installed, when I run `npm run dev`, then the Vite dev server starts on port 5173 and the Express server starts on port 5000, both via `concurrently`

**AC-3:** Given the client dev server is running, when I make a request to `/api/health`, then the Vite proxy forwards it to Express and returns `{ success: true, data: { status: "healthy" } }`

**AC-4:** Given the project structure, when I inspect the directory layout, then it matches the architecture spec: `client/`, `server/`, `shared/` with correct sub-folders, `.env.example`, `.gitignore`, `.nvmrc`, root `package.json` with workspaces

**AC-5:** Given the shared workspace, when I run `npm -w shared run build`, then TypeScript compilation succeeds without errors and `shared/constants/roles.ts` exports all four role values: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE

**AC-6:** Given any workspace `package.json`, when I inspect dependency versions, then no dependency uses caret (`^`) or tilde (`~`) ranges -- all are pinned to exact versions

**AC-7:** Given an invalid Node.js version (below 20), when I attempt `npm install`, then the `engines` field in root `package.json` warns about the version mismatch

## Technical Context
- **Tech stack:** Vite 7 + React 19 + TypeScript, Express 5 + TypeScript, MongoDB + Mongoose 9, Tailwind CSS v4.2, npm workspaces
- **Node runtime:** Node.js 20 LTS, npm 10.x+
- **Dev tooling:** `concurrently` for parallel dev servers, `tsx watch` for Express auto-restart, Vite HMR for frontend
- **Version pinning rule:** Use exact versions (`--save-exact`) for all dependencies -- no caret ranges
- **Naming conventions:** kebab-case for server files, PascalCase for React components, camelCase for all JSON/MongoDB fields
- **Key config files:**
  - Root: `package.json` (workspaces, engines, scripts), `.nvmrc` (Node 20), `.env.example` (env template), `.gitignore`, `tsconfig.base.json` (shared TS base config)
  - Client: `client/package.json`, `client/vite.config.ts` (`@tailwindcss/vite` plugin, `/api` proxy, `vite-tsconfig-paths`), `client/tsconfig.json` (project references)
  - Server: `server/package.json`, `server/tsconfig.json` (ES2022, NodeNext, strict, path aliases)
  - Shared: `shared/package.json` (`@smarthostel/shared`), `shared/tsconfig.json` (declaration: true, composite: true)

### Existing Code
This is the first story -- no prior code existed. All files listed below were created from scratch during implementation.

## Tasks

### Task 1: Initialize Root Project with npm Workspaces
- [ ] Subtask 1.1: Create root `package.json` with `"workspaces": ["client", "server", "shared"]`, `"private": true`, and `"engines": { "node": ">=20.0.0", "npm": ">=10.0.0" }`
- [ ] Subtask 1.2: Install root devDependency: `concurrently` (exact version via `--save-exact`)
- [ ] Subtask 1.3: Add root scripts to `package.json`: `dev`, `dev:client`, `dev:server`, `dev:worker`, `build`, `seed`, `seed:users`, `lint`, `test`
- [ ] Subtask 1.4: Create `.nvmrc` at repo root containing `20`
- [ ] Subtask 1.5: Create `tsconfig.base.json` with shared TypeScript compiler options

**Tests (AC-1, AC-4, AC-6, AC-7):**
- [ ] `package.json` has `workspaces` field listing all three workspaces
- [ ] `package.json` has `engines` field with `node >=20.0.0` and `npm >=10.0.0`
- [ ] `.nvmrc` exists and contains `20`
- [ ] `concurrently` is listed in `devDependencies` at an exact version (no caret)
- [ ] All root scripts exist: `dev`, `dev:client`, `dev:server`, `build`, `seed`, `lint`, `test`

### Task 2: Create `.env.example` and `.gitignore`
- [ ] Subtask 2.1: Create `.env.example` with template variables: `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `QR_SECRET`, `CRON_ENABLED`, `CLOUDINARY_URL`, `MAX_LOGIN_ATTEMPTS`, `LOGIN_LOCKOUT_DURATION_MS`, `ALLOWED_ORIGINS`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`
- [ ] Subtask 2.2: Create `.gitignore` covering: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`, `.DS_Store`, `Thumbs.db`, `coverage/`, `shared/dist/`, `.vscode/`, `.idea/`
- [ ] Subtask 2.3: Verify `.env.example` does not contain actual secrets (JWT_SECRET and QR_SECRET are placeholder strings)

**Tests (AC-4):**
- [ ] `.env.example` exists and contains all required env vars
- [ ] `.env.example` does not contain real secrets (JWT_SECRET is a placeholder)
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env`, `.env.local`, `coverage/`, `shared/dist/`
- [ ] `.gitignore` excludes OS files (`.DS_Store`, `Thumbs.db`) and IDE directories (`.vscode/`, `.idea/`)

### Task 3: Scaffold Client Workspace (Vite + React + TypeScript)
- [ ] Subtask 3.1: Initialize client using Vite react-ts template or manually create equivalent structure
- [ ] Subtask 3.2: Install client dependencies (exact versions): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `fuse.js`, `html5-qrcode`, `qrcode.react`
- [ ] Subtask 3.3: Install client devDependencies (exact versions): `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `typescript`, `vite`, `vite-tsconfig-paths`, `vitest`, `jsdom`
- [ ] Subtask 3.4: Configure `client/vite.config.ts` with `@tailwindcss/vite` plugin, `vite-tsconfig-paths`, and dev server proxy (`/api` -> `http://localhost:5000`)
- [ ] Subtask 3.5: Create `client/src/app.css` with `@import "tailwindcss"`
- [ ] Subtask 3.6: Create minimal `client/src/main.tsx` entry point
- [ ] Subtask 3.7: Configure `client/tsconfig.json` with project references (`tsconfig.app.json`, `tsconfig.node.json`) and path aliases
- [ ] Subtask 3.8: Create client directory skeleton: `components/ui/`, `components/layout/`, `components/domain/`, `pages/student/`, `pages/warden/`, `pages/guard/`, `pages/maintenance/`, `hooks/`, `services/`, `context/`, `utils/`, `types/`

**Tests (AC-2, AC-4, AC-6):**
- [ ] `client/package.json` exists with all listed dependencies at exact versions (no caret)
- [ ] `client/vite.config.ts` includes `@tailwindcss/vite` plugin and proxy config for `/api` to `http://localhost:5000`
- [ ] Running `npm -w client run dev` starts Vite dev server on port 5173
- [ ] All skeleton directories exist under `client/src/`
- [ ] `client/src/app.css` contains `@import "tailwindcss"`

### Task 4: Scaffold Server Workspace (Express + TypeScript)
- [ ] Subtask 4.1: Create `server/package.json` with `"name": "server"`, `"private": true`, `"type": "module"`
- [ ] Subtask 4.2: Install server dependencies (exact versions): `express`, `cookie-parser`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `node-cron`, `cloudinary`, `multer`, `express-rate-limit`, `pino`, `pino-http`, `uuid`, `zod`, `dotenv`, `helmet`, `cors`
- [ ] Subtask 4.3: Install server devDependencies (exact versions): `typescript`, `tsx`, `tsconfig-paths`, `tsc-alias`, `vitest`, `supertest`, `mongodb-memory-server`, `@types/node`, `@types/express`, `@types/cookie-parser`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/uuid`, `@types/multer`, `@types/supertest`, `pino-pretty`
- [ ] Subtask 4.4: Create `server/tsconfig.json` configured for Node.js (target ES2022, module NodeNext, strict mode, path aliases: `@models/*`, `@controllers/*`, `@services/*`, `@middleware/*`, `@config/*`, `@utils/*`, `@types/*`)
- [ ] Subtask 4.5: Create server directory skeleton: `routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `worker/`, `config/`, `utils/`, `types/`, `scripts/`
- [ ] Subtask 4.6: Create `server/src/app.ts` -- Express app setup with trust proxy, helmet, CORS, cookie-parser, JSON body parser, correlation ID middleware, pino-http logging, health route returning `{ success: true, data: { status: "healthy" } }`, 404 catch-all, global error handler
- [ ] Subtask 4.7: Create `server/src/index.ts` -- Server entry point that imports `app.ts`, connects to MongoDB, and calls `app.listen(PORT)` (default 5000)
- [ ] Subtask 4.8: Add scripts to `server/package.json`: `"dev": "tsx watch -r tsconfig-paths/register src/index.ts"`, `"dev:worker"`, `"build": "tsc && tsc-alias"`, `"start": "node dist/index.js"`, `"seed"`, `"seed:users"`, `"test": "vitest run --passWithNoTests"`

**Tests (AC-2, AC-3, AC-4, AC-6):**
- [ ] `server/package.json` exists with all listed dependencies at exact versions (no caret)
- [ ] `server/tsconfig.json` exists with `strict: true`, `target: "ES2022"`, `module: "NodeNext"`, path aliases
- [ ] All skeleton directories exist under `server/src/`
- [ ] Running `npm -w server run dev` starts Express server on port 5000
- [ ] `GET http://localhost:5000/api/health` returns `{ success: true, data: { status: "healthy" } }` with HTTP 200
- [ ] Server app configures trust proxy, helmet, CORS, cookie-parser, and JSON body parsing

### Task 5: Scaffold Shared Workspace
- [ ] Subtask 5.1: Create `shared/package.json` with `"name": "@smarthostel/shared"`, `"private": true`, `"type": "module"`, exports map for constants/types/schemas
- [ ] Subtask 5.2: Install shared dependencies (exact versions): `zod`
- [ ] Subtask 5.3: Install shared devDependencies (exact versions): `typescript`
- [ ] Subtask 5.4: Create `shared/tsconfig.json` with `declaration: true`, `composite: true`, extends `tsconfig.base.json`
- [ ] Subtask 5.5: Create shared directory skeleton: `schemas/`, `constants/`, `types/`
- [ ] Subtask 5.6: Create `shared/constants/roles.ts` exporting the `Role` const object: `STUDENT`, `WARDEN_ADMIN`, `GUARD`, `MAINTENANCE` with corresponding type
- [ ] Subtask 5.7: Create `shared/constants/error-codes.ts` exporting `ErrorCode` const object and `ERROR_STATUS_MAP`
- [ ] Subtask 5.8: Create `shared/types/api-responses.ts` exporting `ApiSuccess<T>`, `ApiError`, and `PaginatedResponse<T>` interfaces
- [ ] Subtask 5.9: Create `shared/index.ts` barrel export file
- [ ] Subtask 5.10: Add `"build"` script to `shared/package.json`: `"tsc"`

**Tests (AC-4, AC-5, AC-6):**
- [ ] `shared/package.json` exists with `zod` dependency at exact version
- [ ] All skeleton directories exist under `shared/`
- [ ] `shared/constants/roles.ts` exports all four role values: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- [ ] `shared/constants/error-codes.ts` exports `ErrorCode` with VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR
- [ ] `shared/types/api-responses.ts` exports `ApiSuccess<T>`, `ApiError`, and `PaginatedResponse<T>` types
- [ ] TypeScript compilation of `shared/` succeeds without errors (`npm -w shared run build`)
- [ ] `shared/index.ts` re-exports all constants, types, and schemas

### Task 6: Verify Full Workspace Integration
- [ ] Subtask 6.1: Run `npm install` from root -- all three workspaces resolve and install without errors
- [ ] Subtask 6.2: Run `npm run dev` from root -- concurrently starts both Vite (port 5173) and Express (port 5000)
- [ ] Subtask 6.3: Verify Vite proxy: request `http://localhost:5173/api/health` and confirm it returns `{ success: true, data: { status: "healthy" } }` from Express
- [ ] Subtask 6.4: Verify shared workspace imports work: `@smarthostel/shared` is importable from both client and server without TypeScript errors

**Tests (AC-1, AC-2, AC-3, AC-5):**
- [ ] `npm install` at root completes with exit code 0 and all three workspace `node_modules` are populated
- [ ] `npm run dev` starts both servers (Vite on 5173, Express on 5000) via concurrently
- [ ] `GET http://localhost:5173/api/health` proxied through Vite returns `{ success: true, data: { status: "healthy" } }`
- [ ] `shared/` types/constants are importable from both `client/` and `server/` without TypeScript errors
- [ ] No TypeScript errors when importing `Role` from `@smarthostel/shared` in either workspace

### Task 7: Verify Directory Structure Matches Architecture Spec
- [ ] Subtask 7.1: Audit the final directory layout against the architecture document's project structure section
- [ ] Subtask 7.2: Ensure all required root files exist: `package.json`, `.nvmrc`, `.env.example`, `.gitignore`, `tsconfig.base.json`
- [ ] Subtask 7.3: Ensure all required sub-directories exist in `client/src/`, `server/src/`, and `shared/`

**Tests (AC-4):**
- [ ] Directory tree matches architecture spec structure for all three workspaces
- [ ] No extraneous files or directories exist that conflict with the architecture spec
- [ ] Root contains: `package.json`, `.nvmrc`, `.env.example`, `.gitignore`, `tsconfig.base.json`, `client/`, `server/`, `shared/`

## Dependencies
- None -- this is the first story in the project. No prerequisite stories or existing code.
- Requires Node.js 20 LTS and npm 10.x+ installed on the development machine.
- Requires internet access for npm package installation.

## File List

### New Files
- `package.json` -- npm workspaces config, engines field, dev/build/lint/test scripts, concurrently devDep
- `.nvmrc` -- Node 20 LTS
- `.env.example` -- template with all required env vars (NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, QR_SECRET, CRON_ENABLED, CLOUDINARY_URL, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION_MS, ALLOWED_ORIGINS, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY)
- `.gitignore` -- excludes node_modules/, dist/, .env, .env.local, *.log, .DS_Store, Thumbs.db, coverage/, shared/dist/, .vscode/, .idea/
- `tsconfig.base.json` -- shared TypeScript base config
- `client/package.json` -- all dependencies at exact versions, dev/build/lint/test/preview scripts
- `client/vite.config.ts` -- @tailwindcss/vite plugin, /api proxy to localhost:5000, vite-tsconfig-paths
- `client/index.html` -- SPA entry point (title: SmartHostel)
- `client/tsconfig.json` -- project references (tsconfig.app.json, tsconfig.node.json)
- `client/tsconfig.app.json` -- strict mode, path aliases (@pages/*, @components/*, @hooks/*, etc.)
- `client/tsconfig.node.json` -- config for vite.config.ts
- `client/src/main.tsx` -- React entry: StrictMode + App
- `client/src/App.tsx` -- BrowserRouter + route definitions
- `client/src/app.css` -- @import "tailwindcss" + CSS custom properties
- `server/package.json` -- all dependencies at exact versions, dev/dev:worker/build/start/seed/seed:users/test scripts
- `server/tsconfig.json` -- ES2022, NodeNext, strict, path aliases (@models/*, @controllers/*, @services/*, @middleware/*, @config/*, @utils/*, @types/*)
- `server/src/index.ts` -- server entry: connects DB, starts Express on PORT (default 5000)
- `server/src/app.ts` -- Express setup: trust proxy, helmet, cors, cookie-parser, JSON body parser, correlation ID middleware, pino-http, health route, 404 catch-all, error handler
- `server/src/routes/health.routes.ts` -- GET /api/health returning { success: true, data: { status: "healthy" } }
- `server/src/middleware/correlation-id.middleware.ts` -- correlation ID extraction/generation
- `server/src/middleware/error-handler.middleware.ts` -- global error handler returning standard error format
- `server/src/config/db.ts` -- MongoDB connection
- `server/src/config/env.ts` -- validated env vars
- `server/src/utils/app-error.ts` -- AppError class
- `server/src/utils/logger.ts` -- pino logger
- `server/src/types/express.d.ts` -- Express type extensions
- `shared/package.json` -- @smarthostel/shared, zod dependency at exact version, build script, exports map
- `shared/tsconfig.json` -- ES2022, strict, declaration: true, composite: true
- `shared/index.ts` -- barrel exports for constants, types, schemas
- `shared/constants/roles.ts` -- Role const object: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- `shared/constants/error-codes.ts` -- ErrorCode const object + ERROR_STATUS_MAP
- `shared/types/api-responses.ts` -- ApiSuccess<T>, ApiError, PaginatedResponse<T> interfaces

### Modified Files
None -- this is the initial scaffolding story.

### Unchanged Files
None -- this is the initial scaffolding story.

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Root Project):** Created root `package.json` with npm workspaces, engines field (`node >=20.0.0`, `npm >=10.0.0`), and all scripts. Installed `concurrently` as devDependency at exact version. Created `.nvmrc` with `20`. Created `tsconfig.base.json` for shared TypeScript config.

**Task 2 (.env.example & .gitignore):** Created `.env.example` with all required env vars including `ACCESS_TOKEN_EXPIRY=4h`, `REFRESH_TOKEN_EXPIRY=7d`, `CRON_ENABLED=false`, `MAX_LOGIN_ATTEMPTS=5`, `LOGIN_LOCKOUT_DURATION_MS=15m`, `ALLOWED_ORIGINS=http://localhost:5173`. Created `.gitignore` excluding `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`, `.DS_Store`, `Thumbs.db`, `coverage/`, `shared/dist/`, `.vscode/`, `.idea/`.

**Task 3 (Client Workspace):** Initialized client with Vite react-ts template. Installed all dependencies at exact versions (react, react-dom, react-router-dom, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, fuse.js, html5-qrcode, qrcode.react). Configured `vite.config.ts` with `@tailwindcss/vite`, `vite-tsconfig-paths`, and `/api` proxy. Created `app.css` with Tailwind import. Created all skeleton directories. Updated `index.html` title to "SmartHostel".

**Task 4 (Server Workspace):** Created `server/package.json` with all dependencies at exact versions (express 5.2.1, mongoose 9.2.4, etc). Configured `tsconfig.json` with ES2022 target, NodeNext modules, strict mode, and path aliases. Created `app.ts` with full middleware chain (trust proxy, helmet, CORS, cookie-parser, JSON parser, correlation ID, pino-http, CSRF, health route, 404 catch-all, error handler). Created `index.ts` entry point with DB connection and server startup.

**Task 5 (Shared Workspace):** Created `shared/package.json` as `@smarthostel/shared` with exports map for constants, types, schemas. Added `zod` dependency at exact version. Configured `tsconfig.json` with `composite: true` and `declaration: true`. Created `roles.ts` with STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE. Created `error-codes.ts` with ErrorCode and ERROR_STATUS_MAP. Created `api-responses.ts` with ApiSuccess<T>, ApiError, PaginatedResponse<T>. Created `index.ts` barrel export.

**Task 6 (Integration):** Verified `npm install` completes successfully (exit code 0). Verified `npm run dev` starts both Vite (5173) and Express (5000). Verified Vite proxy forwards `/api/health` to Express correctly. Verified shared imports work from both client and server.

**Task 7 (Directory Audit):** Confirmed directory layout matches architecture spec. All required root files, skeleton directories, and config files present.

### Test Results
- `npm install` completes with exit code 0 (516 packages audited)
- `npm -w shared run build` (tsc) succeeds without errors
- All required directories and files confirmed present
- No caret/tilde ranges in any project package.json
- Health endpoint returns exact format: `{ success: true, data: { status: "healthy" } }`
- Shared types/constants importable from both client and server without TypeScript errors

### New Dependencies
- Root: `concurrently` (devDependency)
- Client: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `fuse.js`, `html5-qrcode`, `qrcode.react`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`, `vite-tsconfig-paths`, `typescript`, `vitest`
- Server: `express`, `cookie-parser`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `node-cron`, `cloudinary`, `multer`, `express-rate-limit`, `pino`, `pino-http`, `uuid`, `zod`, `dotenv`, `helmet`, `cors`, `tsx`, `tsconfig-paths`, `tsc-alias`, `typescript`, `vitest`, `supertest`, `mongodb-memory-server`, `pino-pretty`
- Shared: `zod`, `typescript`
