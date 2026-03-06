# Story 1.1: Project Scaffolding & Dev Environment

## Description
As a **developer**,
I want the project scaffolded with npm workspaces (client/server/shared), all dependencies installed, and dev scripts working,
So that I have a working development environment to build features on.

## Acceptance Criteria

**Given** a fresh checkout of the repository
**When** I run `npm install` at the root
**Then** all three workspaces (client, server, shared) have their dependencies installed with exact versions

**Given** the project is installed
**When** I run `npm run dev`
**Then** the Vite dev server starts on port 5173 and the Express server starts on port 5000, both via concurrently

**Given** the client dev server is running
**When** I make a request to `/api/health`
**Then** the Vite proxy forwards it to Express and returns `{ success: true, data: { status: "healthy" } }`

**Given** the project structure
**When** I inspect the directory layout
**Then** it matches the architecture spec: `client/`, `server/`, `shared/` with correct sub-folders, `.env.example`, `.gitignore`, `.nvmrc`, root `package.json` with workspaces

## Technical Context
- **Tech stack:** Vite 7 + React 19 + TypeScript, Express 5 + TypeScript, MongoDB + Mongoose 8, Tailwind CSS v4.2, npm workspaces
- **Node runtime:** Node.js 20 LTS, npm 10.x+
- **Dev tooling:** `concurrently` for parallel dev servers, `tsx --watch` for Express auto-restart, Vite HMR for frontend
- **Version pinning rule:** Use exact versions (`--save-exact`) for all dependencies — no caret ranges
- **Naming conventions:** kebab-case for server files, PascalCase for React components, camelCase for all JSON/MongoDB fields
- **Key files/modules:**
  - Root: `package.json`, `.nvmrc`, `.env.example`, `.gitignore`
  - Client: `client/package.json`, `client/vite.config.ts`, `client/index.html`, `client/tsconfig.json`, `client/src/main.tsx`, `client/src/app.css`
  - Server: `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`, `server/src/app.ts`
  - Shared: `shared/package.json`, `shared/tsconfig.json`

## Tasks

### Task 1: Initialize Root Project with npm Workspaces
- [ ] Subtask 1.1: Create root `package.json` with `"workspaces": ["client", "server", "shared"]`, `"private": true`, and `"engines": { "node": ">=20.0.0", "npm": ">=10.0.0" }`
- [ ] Subtask 1.2: Install root devDependency: `concurrently` (exact version via `--save-exact`)
- [ ] Subtask 1.3: Add root scripts to `package.json`:
  ```json
  {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "npm -w client run dev",
    "dev:server": "npm -w server run dev",
    "dev:worker": "npm -w server run dev:worker",
    "build": "npm -w shared run build && npm -w client run build && npm -w server run build",
    "seed": "npm -w server run seed",
    "lint": "npm -w client run lint && npm -w server run lint",
    "test": "npm -w client run test && npm -w server run test"
  }
  ```
- [ ] Subtask 1.4: Create `.nvmrc` at repo root containing `20`
**Tests:**
- [ ] `package.json` has `workspaces` field listing all three workspaces
- [ ] `package.json` has `engines` field with `node >=20.0.0` and `npm >=10.0.0`
- [ ] `.nvmrc` exists and contains `20`

### Task 2: Create `.env.example` and `.gitignore`
- [ ] Subtask 2.1: Create `.env.example` with template variables:
  ```
  NODE_ENV=development
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/smarthostel
  JWT_SECRET=
  QR_SECRET=
  CRON_ENABLED=false
  CLOUDINARY_URL=
  ACCESS_TOKEN_EXPIRY=4h
  REFRESH_TOKEN_EXPIRY=7d
  ```
- [ ] Subtask 2.2: Create `.gitignore` covering: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`, `.DS_Store`, `coverage/`
**Tests:**
- [ ] `.env.example` exists and contains all required env vars: `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `QR_SECRET`, `CRON_ENABLED`, `CLOUDINARY_URL`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env`

### Task 3: Scaffold Client Workspace (Vite + React + TypeScript)
- [ ] Subtask 3.1: Initialize client using `npm create vite@latest client -- --template react-ts` (or manually create equivalent structure)
- [ ] Subtask 3.2: Install client dependencies (exact versions): `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `fuse.js`, `html5-qrcode`
- [ ] Subtask 3.3: Install client devDependencies (exact versions): `tailwindcss`, `@tailwindcss/vite`
- [ ] Subtask 3.4: Configure `client/vite.config.ts` with:
  - `@tailwindcss/vite` plugin
  - Dev server proxy: `/api` requests forwarded to `http://localhost:5000`
- [ ] Subtask 3.5: Create `client/src/app.css` with `@import "tailwindcss"`
- [ ] Subtask 3.6: Create minimal `client/src/main.tsx` entry point (renders a root `<App />` component)
- [ ] Subtask 3.7: Configure `client/tsconfig.json` to reference `shared/` workspace types
- [ ] Subtask 3.8: Create client directory skeleton:
  - `client/src/components/ui/`
  - `client/src/components/layout/`
  - `client/src/components/domain/`
  - `client/src/pages/student/`
  - `client/src/pages/warden/`
  - `client/src/pages/guard/`
  - `client/src/pages/maintenance/`
  - `client/src/hooks/`
  - `client/src/services/`
  - `client/src/context/`
  - `client/src/utils/`
  - `client/src/types/`
- [ ] Subtask 3.9: Add `"dev"` script to `client/package.json`: `"vite"` (defaults to port 5173)
**Tests:**
- [ ] `client/package.json` exists with all listed dependencies at exact versions (no caret)
- [ ] `client/vite.config.ts` includes `@tailwindcss/vite` plugin and proxy config for `/api` to `http://localhost:5000`
- [ ] Running `npm -w client run dev` starts Vite dev server on port 5173
- [ ] All skeleton directories exist under `client/src/`

### Task 4: Scaffold Server Workspace (Express + TypeScript)
- [ ] Subtask 4.1: Create `server/package.json` with `"name": "server"` and `"private": true`
- [ ] Subtask 4.2: Install server dependencies (exact versions): `express`, `cookie-parser`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `node-cron`, `cloudinary`, `multer`, `express-rate-limit`, `pino`, `pino-http`, `uuid`, `zod`, `dotenv`, `helmet`, `cors`
- [ ] Subtask 4.3: Install server devDependencies (exact versions): `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cookie-parser`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/uuid`, `@types/multer`, `pino-pretty`
- [ ] Subtask 4.4: Create `server/tsconfig.json` configured for Node.js (target ES2022, module NodeNext, strict mode) referencing `shared/`
- [ ] Subtask 4.5: Create server directory skeleton:
  - `server/src/routes/`
  - `server/src/controllers/`
  - `server/src/services/`
  - `server/src/models/`
  - `server/src/middleware/`
  - `server/src/worker/`
  - `server/src/config/`
  - `server/src/utils/`
  - `server/src/types/`
- [ ] Subtask 4.6: Create `server/src/app.ts` — Express app setup with:
  - `app.set('trust proxy', 1)`
  - JSON body parser
  - `GET /api/health` route returning `{ success: true, data: { status: "healthy" } }`
- [ ] Subtask 4.7: Create `server/src/index.ts` — Server entry point that imports `app.ts`, reads `PORT` from env (default 5000), calls `app.listen(PORT)`
- [ ] Subtask 4.8: Add scripts to `server/package.json`:
  - `"dev": "tsx watch src/index.ts"`
  - `"dev:worker": "tsx watch src/worker/index.ts"`
  - `"build": "tsc"`
  - `"start": "node dist/index.js"`
**Tests:**
- [ ] `server/package.json` exists with all listed dependencies at exact versions (no caret)
- [ ] `server/tsconfig.json` exists with `strict: true`
- [ ] All skeleton directories exist under `server/src/`
- [ ] Running `npm -w server run dev` starts Express server on port 5000
- [ ] `GET http://localhost:5000/api/health` returns `{ success: true, data: { status: "healthy" } }` with HTTP 200

### Task 5: Scaffold Shared Workspace
- [ ] Subtask 5.1: Create `shared/package.json` with `"name": "shared"` and `"private": true`
- [ ] Subtask 5.2: Install shared dependencies (exact versions): `zod`
- [ ] Subtask 5.3: Install shared devDependencies (exact versions): `typescript`
- [ ] Subtask 5.4: Create `shared/tsconfig.json` (declaration: true, composite: true for project references)
- [ ] Subtask 5.5: Create shared directory skeleton:
  - `shared/schemas/`
  - `shared/constants/`
  - `shared/types/`
- [ ] Subtask 5.6: Create placeholder `shared/constants/roles.ts` exporting the `Role` enum: `STUDENT`, `WARDEN_ADMIN`, `GUARD`, `MAINTENANCE`
- [ ] Subtask 5.7: Create placeholder `shared/types/api-responses.ts` exporting `ApiSuccess<T>` and `ApiError` type definitions matching the architecture response format
- [ ] Subtask 5.8: Add `"build"` script to `shared/package.json`: `"tsc"`
**Tests:**
- [ ] `shared/package.json` exists with `zod` dependency at exact version
- [ ] All skeleton directories exist under `shared/`
- [ ] `shared/constants/roles.ts` exports all four role values
- [ ] `shared/types/api-responses.ts` exports `ApiSuccess<T>` and `ApiError` types
- [ ] TypeScript compilation of `shared/` succeeds without errors

### Task 6: Verify Full Workspace Integration
- [ ] Subtask 6.1: Run `npm install` from root — all three workspaces resolve and install without errors
- [ ] Subtask 6.2: Run `npm run dev` from root — concurrently starts both Vite (port 5173) and Express (port 5000)
- [ ] Subtask 6.3: Verify Vite proxy: request `http://localhost:5173/api/health` and confirm it returns `{ success: true, data: { status: "healthy" } }` from Express
- [ ] Subtask 6.4: Verify shared workspace imports work: add a test import of `shared/constants/roles.ts` in both client and server entry files (can be removed after verification or kept as a smoke test)
**Tests:**
- [ ] `npm install` at root completes with exit code 0 and all three workspace `node_modules` are populated
- [ ] `npm run dev` starts both servers (Vite on 5173, Express on 5000) via concurrently
- [ ] `GET http://localhost:5173/api/health` proxied through Vite returns `{ success: true, data: { status: "healthy" } }`
- [ ] `shared/` types/constants are importable from both `client/` and `server/` without TypeScript errors

### Task 7: Verify Directory Structure Matches Architecture Spec
- [ ] Subtask 7.1: Audit the final directory layout against the architecture document's "Complete Project Directory Structure" section
- [ ] Subtask 7.2: Ensure all required root files exist: `package.json`, `.nvmrc`, `.env.example`, `.gitignore`
- [ ] Subtask 7.3: Ensure all required sub-directories exist in `client/src/`, `server/src/`, and `shared/`
**Tests:**
- [ ] Directory tree matches architecture spec structure for all three workspaces
- [ ] No extraneous files or directories exist that conflict with the architecture spec
- [ ] Root contains: `package.json`, `.nvmrc`, `.env.example`, `.gitignore`, `client/`, `server/`, `shared/`

## Dependencies
- None — this is the first story in the project. No prerequisite stories or existing code.
- Requires Node.js 20 LTS and npm 10.x+ installed on the development machine.
- Requires internet access for npm package installation.

## File List

### Root
- `package.json` — npm workspaces config, engines field, dev/build/lint/test scripts, concurrently devDep
- `.nvmrc` — Node 20 LTS
- `.env.example` — template with all required env vars (NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, QR_SECRET, CRON_ENABLED, CLOUDINARY_URL, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY)
- `.gitignore` — excludes node_modules/, dist/, .env, .env.local, *.log, .DS_Store, coverage/, shared/dist/
- `tsconfig.base.json` — shared TypeScript base config

### Client (client/)
- `client/package.json` — all dependencies at exact versions (no caret/tilde), dev script runs vite
- `client/vite.config.ts` — @tailwindcss/vite plugin, /api proxy to localhost:5000, vite-tsconfig-paths
- `client/index.html` — SPA entry point
- `client/tsconfig.json` — project references (tsconfig.app.json, tsconfig.node.json)
- `client/tsconfig.app.json` — strict mode, path aliases (@pages/*, @components/*, @hooks/*, etc.)
- `client/tsconfig.node.json` — config for vite.config.ts
- `client/src/main.tsx` — React entry: StrictMode + AuthProvider + App
- `client/src/App.tsx` — BrowserRouter + route definitions
- `client/src/app.css` — @import "tailwindcss" + CSS custom properties
- `client/src/context/AuthContext.tsx` — auth state management
- `client/src/context/auth-context-value.ts` — auth context type
- `client/src/hooks/useAuth.ts` — useContext wrapper
- `client/src/pages/LoginPage.tsx` — login page
- `client/src/services/api.ts` — API client
- Skeleton directories: components/ui/, components/layout/, components/domain/, pages/student/, pages/warden/, pages/guard/, pages/maintenance/, hooks/, services/, context/, utils/, types/

### Server (server/)
- `server/package.json` — all dependencies at exact versions, dev/dev:worker/build/start scripts
- `server/tsconfig.json` — ES2022, strict, path aliases (@models/*, @controllers/*, etc.)
- `server/src/index.ts` — server entry: connects DB, starts Express on PORT (default 5000)
- `server/src/app.ts` — Express setup: trust proxy, helmet, cors, cookie-parser, JSON body parser, correlation ID middleware, pino-http, health route, auth route, 404 catch-all, error handler
- `server/src/routes/health.routes.ts` — GET /api/health returning { success: true, data: { status: "healthy" } }
- `server/src/routes/auth.routes.ts` — auth route definitions
- `server/src/controllers/auth.controller.ts` — auth controller
- `server/src/services/auth.service.ts` — auth business logic
- `server/src/models/user.model.ts` — User mongoose model with WARDEN_ADMIN role
- `server/src/middleware/auth.middleware.ts` — JWT verification
- `server/src/middleware/correlation-id.middleware.ts` — correlation ID extraction/generation
- `server/src/middleware/error-handler.middleware.ts` — global error handler
- `server/src/config/db.ts` — MongoDB connection
- `server/src/config/env.ts` — validated env vars
- `server/src/utils/app-error.ts` — AppError class
- `server/src/utils/auth-cookies.ts` — cookie utilities
- `server/src/utils/logger.ts` — pino logger
- `server/src/types/express.d.ts` — Express type extensions
- Skeleton directories: routes/, controllers/, services/, models/, middleware/, worker/, config/, utils/, types/

### Shared (shared/)
- `shared/package.json` — @smarthostel/shared, zod dependency at exact version, build script
- `shared/tsconfig.json` — ES2022, strict, declaration: true, composite: true
- `shared/index.ts` — barrel exports for constants, types, schemas
- `shared/constants/roles.ts` — Role enum: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
- `shared/constants/error-codes.ts` — ErrorCode enum + ERROR_STATUS_MAP
- `shared/types/api-responses.ts` — ApiSuccess<T>, ApiError, PaginatedResponse<T> interfaces
- `shared/schemas/auth.schema.ts` — login validation schema
- Skeleton directories: schemas/, constants/, types/

## Dev Agent Record

### Completed: 2026-03-06

**Summary:** Project scaffolding was already partially set up from a prior attempt. This implementation reviewed all existing files against the story and architecture requirements, then made targeted corrections:

**Changes made:**
1. **Root package.json** — Added `engines` field (`node >=20.0.0`, `npm >=10.0.0`). Fixed `lint` and `test` scripts to use `-w` flag syntax per story spec.
2. **`.env.example`** — Rewritten to match story spec exactly (simpler format, ACCESS_TOKEN_EXPIRY=4h, REFRESH_TOKEN_EXPIRY=7d, CRON_ENABLED=false).
3. **`.gitignore`** — Added missing `coverage/` and `.env.local` entries.
4. **`client/package.json`** — Pinned all dependencies to exact versions (removed caret/tilde ranges from react, react-dom, vite, @types/react, @types/react-dom, @vitejs/plugin-react, eslint, globals, typescript-eslint, and others).
5. **`client/index.html`** — Updated title from "client" to "SmartHostel".
6. **`server/src/routes/health.routes.ts`** — Changed health status from `"ok"` to `"healthy"` per story requirement.
7. **`server/package.json`** — Changed dev script from `tsx --watch` to `tsx watch` syntax.
8. **`shared/constants/roles.ts`** — Changed `WARDEN` to `WARDEN_ADMIN` per story and architecture spec.
9. **`shared/tsconfig.json`** — Added `composite: true` per story requirement.
10. **`server/src/models/user.model.ts`** — Updated `Role.WARDEN` reference to `Role.WARDEN_ADMIN`.

**Verification:**
- `npm install` from root completes successfully (exit code 0, 516 packages audited)
- `npm -w shared run build` (tsc) succeeds without errors
- All required directories and files confirmed present
- No caret/tilde ranges in any project package.json
- Health endpoint returns exact format: `{ success: true, data: { status: "healthy" } }`
