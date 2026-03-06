---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-02'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-Agent-2026-03-01.md
  - _bmad-output/planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'Agent'
user_name: 'sayuj'
date: '2026-03-02'
lockedDecisions:
  - MVP-first, single-hostel
  - SPA React, no SSR
  - Scanner + offline fallback are first-class
  - Cron/SLA worker + CronLog/health widget are mandatory
  - Cron runs as separate process (same codebase, separate entry point) — no risk of blocking API
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Locked Decisions (Quick Reference)

These decisions are final. Do not re-litigate, override, or deviate during implementation.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | MVP-first, single-hostel | No multi-tenancy; simplifies every query and seed script |
| 2 | SPA React, no SSR | Vite + react-ts; no Next.js / Remix |
| 3 | Scanner + offline fallback first-class | Guard scanner is highest-stakes path; offline GateScan fields (offlineStatus enum) on every scan |
| 4 | Cron/SLA worker + CronLog/health widget mandatory | 0 missed cycles/week; health widget surfaces failures |
| 5 | Cron as separate process | Same codebase (`server/src/worker/`), separate entry point — cannot block API |
| 6 | Same-site cookies required | Access + refresh in httpOnly cookies; `SameSite=Lax` |
| 7 | CSRF = Origin/Referer allowlist | No CSRF tokens; lightweight server-side header check |
| 8 | `QR_SECRET` separate from `JWT_SECRET` | Auth key rotation must not invalidate active gate passes |
| 9 | AuditEvent = single source of truth | pino = operational only; both share `correlationId` + `action` |
| 10 | Controller → Service → Model enforced | Controllers never import models directly |
| 11 | Cloudinary for photos | No ephemeral local uploads; PaaS-safe |
| 12 | Fees read-only in MVP | Seeded; no PATCH endpoint, no management page |
| 13 | Rooms denormalized on User in MVP | block/floor/roomNumber on User doc; no Room model/page |
| 14 | Refresh token revocation via DB-stored `jti` | Password reset / force-logout deletes all stored jtis |
| 15 | camelCase everywhere | Mongo fields, API payloads, client state — no snake_case anywhere |

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
43 FRs across 8 domains. The architecture must support three distinct workflow engines (gate pass verification, complaint SLA automation, self-service assistant) unified under a shared RBAC + audit layer. Two formal state machines (Pass lifecycle, Complaint lifecycle) require atomic transitions with role-locked permissions. The gate verification subsystem has the highest reliability bar — it must produce a deterministic green/red result within 3 seconds end-to-end even on degraded networks.

**Non-Functional Requirements:**
- **Performance:** Guard scanner cold load p95 ≤ 2s (low-end Android), server verify p95 ≤ 500ms, scan-to-decision end-to-end p95 ≤ 3s, API latency p95 ≤ 300-500ms, dashboard load ≤ 3s
- **Reliability:** Cron: 0 missed cycles/week (heartbeat + alert), API uptime ≥ 99%, zero orphan states (e.g., complaint RESOLVED without resolver)
- **Security:** JWT with signed QR (expiry + jti/UUID + anti-replay), passCode rate limiting (5/min/guard + lockout), audit log immutability (append-only at app layer)
- **Data protection:** HTTPS required (camera API), encryption at rest, secrets in env vars, JWT signing key rotatable
- **Account security:** Session timeout (1-4h access tokens, 7-30d refresh), account lockout after 5 failed logins
- **Backup:** Daily automated backups, RPO ≤ 24h, RTO ≤ 4-8h

**Scale & Complexity:**
- Primary domain: Full-stack web SPA (MERN + Tailwind CSS)
- Complexity level: Medium
- MVP scale: ~300 students, ~120 rooms, ~10-20 staff, ~2-4 guards, peak concurrent ~50-100 users
- Data volume: ~50k-200k gate events/year, proportional complaints/notifications
- Estimated architectural components: ~11 core collections, ~16 pages, ~30+ API endpoints, 1 cron worker

### Technical Constraints & Dependencies

- **Stack locked:** MongoDB, Express, React, Node.js + Tailwind CSS
- **Camera API requires HTTPS** in production (localhost exempt for dev)
- **No real-time/WebSockets** — notifications via polling or page refresh
- **No native app** — browser-only, responsive mobile web
- **No external integrations** — fee data seeded, no payment gateway
- **No LLM in assistant** — Fuse.js fuzzy search + authenticated API status queries only
- **Single-hostel deployment** — no multi-tenancy needed for MVP
- **Solo dev assumption** — architecture must be simple enough for one developer to build and maintain

### Cross-Cutting Concerns Identified

1. **RBAC + Middleware** — `requireRole()` middleware on every protected endpoint; role-based data filtering at query level (not just route level)
2. **Audit Attribution** — every sensitive mutation logs `actorId`, `actorRole`, `timestamp`; corrections are new events, never overwrites
3. **Notification Engine** — type-based routing with fatigue prevention; reminders to responsible actor only, escalations to warden
4. **Error/Degradation Handling** — scanner fallback chain (QR → passCode → offline log → reconciliation); API timeout handling; cron failure surfacing
5. **State Machine Enforcement** — pass and complaint lifecycles with validated transitions, role-locked permissions per transition, atomic updates via `findOneAndUpdate` with conditions
6. **Data Seeding Pipeline** — seed script/manual seeding for students, rooms, FAQ entries, category SLA config — must be green before pilot launch (bulk CSV import deferred to post-MVP)

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web SPA (MERN + Tailwind CSS) — client-side SPA with a REST API backend. No SSR, no monorepo tooling needed. npm workspaces for simple multi-package coordination.

### Starter Options Considered

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A: Vite `react-ts` + manual Express** | `npm create vite@latest` for frontend; hand-rolled Express backend | Clean separation, no unnecessary abstractions, full control, matches solo-dev simplicity | Manual backend setup (but Express boilerplate is minimal) |
| **B: Community MERN template** | Pre-configured template with React Router, testing, etc. | Faster initial setup | Opinionated choices may not match project needs; maintenance risk |
| **C: shadcn/ui + Vite** | Component library on top of Tailwind | Beautiful pre-built components | Adds complexity; may not match guard scanner's custom full-screen UX needs |

### Selected Starter: Option A — Vite `react-ts` + manual Express setup

**Rationale for Selection:**
- The PRD's MERN stack is straightforward enough that a community meta-framework adds more lock-in than value
- Vite's `react-ts` template gives a clean, minimal React + TypeScript foundation with zero opinions on routing, state, or styling
- Tailwind CSS v4 installs as a single Vite plugin — no config file needed
- Express backend is simple enough to set up manually, and no Express generator matches the exact middleware needs (RBAC, audit, cron)
- Single repo with npm workspaces keeps things navigable for one developer without heavy monorepo tooling

**Initialization Commands:**

```bash
# Create project root with npm workspaces
mkdir smarthostel && cd smarthostel
npm init -y
# Add to root package.json: "workspaces": ["client", "server"]
npm install -D concurrently

# Frontend (Vite + React + TypeScript)
npm create vite@latest client -- --template react-ts
cd client
npm install tailwindcss @tailwindcss/vite react-router-dom fuse.js
cd ..

# Backend (Express + Mongoose + TypeScript)
mkdir -p server/src && cd server
npm init -y
npm install express mongoose jsonwebtoken bcryptjs node-cron dotenv helmet cors \
  express-rate-limit zod uuid multer pino pino-http
npm install -D typescript @types/express @types/node @types/jsonwebtoken \
  @types/bcryptjs @types/cors @types/multer @types/uuid tsx
npx tsc --init
cd ..
```

**Key library placement decisions:**
- **Fuse.js → client-only** — FAQ fuzzy search runs in the browser against a fetched FAQ list; deterministic, no server round-trip needed per keystroke
- **node-cron → server-only** — SLA worker runs as a separate process (same codebase, separate entry point: `server/src/worker.ts`)
- **pino → server-only** — structured logging for audit events, cron heartbeats, verify results

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript on both client and server — type safety across the stack, shared type definitions possible via a `shared/` folder at repo root

**Styling Solution:**
Tailwind CSS v4.2 via `@tailwindcss/vite` plugin — CSS-native theme variables, no `tailwind.config.js` needed, wired into `vite.config.ts`

**Build Tooling:**
Vite v7 for frontend (HMR, production bundling with Rollup). `tsx` for backend dev server (fast TypeScript execution without compile step)

**Testing Framework:**
To be decided in architecture decisions step (Vitest for frontend is the natural Vite companion; Vitest or Jest for backend)

**Code Organization:**
```
smarthostel/
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client functions
│   │   ├── context/        # React context providers
│   │   ├── utils/          # Helpers (incl. Fuse.js FAQ search)
│   │   └── types/          # Frontend-specific types
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Express API
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Mongoose schemas
│   │   ├── middleware/     # Auth, RBAC, audit, rate-limit, validation, error handling
│   │   ├── services/       # QR generation, notification engine
│   │   ├── worker/         # Cron/SLA worker (separate process entry point)
│   │   ├── config/         # DB, env, category defaults
│   │   ├── utils/          # Helpers
│   │   └── types/          # Backend-specific types
│   ├── tsconfig.json
│   └── package.json
├── shared/                 # Shared types/constants (role enums, status enums, reason codes)
├── package.json            # Root: workspaces + concurrently dev script
└── .env                    # Environment variables (never committed)
```

**Process Model:**
- `npm run dev` (root) → `concurrently` starts both client dev server and API server
- Cron/SLA worker: separate entry point (`server/src/worker/index.ts`) started as its own process — same codebase, no risk of blocking API on cron cycles
- Root scripts: `dev`, `build`, `start:api`, `start:worker`

**Development Experience:**
Vite HMR for instant frontend reloads. `tsx --watch` for backend auto-restart. `concurrently` orchestrates both from a single terminal.

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. JWT dual-token strategy (access + refresh in httpOnly cookies, SameSite=Lax + CSRF defense)
2. Separate QR signing secret with minimal payload (`leaveRequestId`, `jti`, `exp`)
3. Mongoose strict schemas + targeted indexes + TTL indexes for retention
4. TanStack Query for server state + React Context for auth
5. Standardized API response/error format with `AppError` class
6. Cron as separate process (locked)
7. Refresh token revocation via DB-stored `jti`

**Important Decisions (Shape Architecture):**
1. Photo storage strategy (Cloudinary or persistent volume — no ephemeral local `uploads/`)
2. React Hook Form + zod for form handling/validation (shared schemas)
3. Same-site deployment (SPA + API under one domain via reverse proxy)
4. `trust proxy` configuration for rate limiting behind PaaS proxy

**Deferred Decisions (Post-MVP):**
1. API versioning
2. Redis caching
3. Hosting platform selection (finalize closer to deployment)

### Data Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Database | MongoDB + Mongoose | Mongoose 8.x | Locked by PRD; schema-driven with strict mode |
| Schema pattern | Strict schemas, `{ timestamps: true }` | — | PRD requires explicit `createdAt`/`updatedAt`; Mongoose built-in |
| Indexes | Defined in schema files | — | Full index list per collection in UX spec Data Model Lock. Critical: `gateScans(guardId, createdAt)`, `gateScans(studentId, createdAt)`, `complaints(status, dueAt)`, `overrides(reviewedBy)` partial null for pending queue |
| TTL indexes | `cronLogs` (90d), `notifications` (180d), `gatePasses` (expiresAt + 30d buffer) | — | Retention enforced at DB level. `gateScans`, `overrides`: 1 year retention, NO TTL (dispute evidence — archive to cold storage post-MVP). **Note:** PRD default is 90-180 days for gate scans; architecture extends to 1 year because gate scans are primary dispute evidence and must survive complaint resolution windows. `auditEvents`: indefinite, never auto-delete (legal backbone) |
| Retention mechanism | TTL indexes (primary) + daily cleanup job in cron worker (for collections needing anonymized aggregates before deletion) | — | TTL indexes auto-delete expired docs; cleanup job handles cases where aggregates must be preserved before TTL kicks in |
| Relationships | ObjectId refs + `populate()` | — | Standard Mongoose pattern; no denormalization needed at MVP scale |
| Caching | No dedicated cache layer | — | ~300 students, ~50-100 concurrent — MongoDB handles this; FAQ cached client-side in Fuse.js index |
| File storage | **Cloudinary** (recommended) or persistent volume — NOT ephemeral local `uploads/` | — | PaaS deploys (Railway/Render) lose local files on restart/redeploy; Cloudinary free tier covers MVP; `photoUrl` stored in MongoDB |
| Validation | zod schemas on server; zod + React Hook Form on client | zod 3.x | Single validation library across stack; shared schemas possible via `shared/` folder |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token strategy | Dual JWT: access (1-4h) + refresh (7-30d) in httpOnly cookies | Prevents XSS token theft (no localStorage) |
| Cookie config | `httpOnly`, `Secure` (prod), **`SameSite=Lax`** | Lax (not Strict) avoids breakage if frontend/API domains ever differ; CSRF mitigated by Origin/Referer header check on state-changing routes |
| CSRF defense | Origin/Referer header validation middleware on all POST/PATCH/DELETE | Lightweight server-side check; no client-side CSRF token needed with SameSite=Lax |
| Deployment topology | **Same-site**: SPA + API served under one domain via reverse proxy | Simplifies cookie handling; avoids cross-origin auth complexity |
| Refresh token revocation | Store refresh token `jti` (or hashed token) in DB per user session | On password reset / admin force-logout → delete all stored `jti`s for that user → all sessions invalidated |
| QR signing | Separate `QR_SECRET` env var | Auth secret rotation must not invalidate active gate passes |
| QR payload | `{ leaveRequestId, jti, exp }` — **no `studentId`** | Minimal payload per PRD rule "QR contains only IDs + expiry"; student details looked up server-side from `leaveRequestId` |
| Password hashing | bcryptjs, salt rounds = 10 | Industry standard; sufficient for MVP scale |
| Rate limiting | express-rate-limit on passCode (5/min/guard) + login (5 failures → lockout) | PRD requirement; prevents brute-force |
| Proxy trust | `app.set('trust proxy', 1)` | Required for express-rate-limit to work correctly behind Railway/Render reverse proxy (correct client IP) |
| RBAC | `requireRole()` middleware + query-level data filtering | Route-level blocks wrong roles; query-level ensures data visibility boundaries |

**Auth Cookie Specification:**

| Property | `accessToken` cookie | `refreshToken` cookie |
|----------|---------------------|----------------------|
| Name | `accessToken` | `refreshToken` |
| `httpOnly` | `true` | `true` |
| `secure` | `true` (prod) / `false` (dev) | `true` (prod) / `false` (dev) |
| `sameSite` | `Lax` | `Lax` |
| `path` | `/` | `/api/auth/refresh` |
| `maxAge` | 1-4 hours (configurable via `ACCESS_TOKEN_EXPIRY` env) | 7-30 days (configurable via `REFRESH_TOKEN_EXPIRY` env) |

**Cookie lifecycle rules:**
- **Login:** Set both cookies. Store hashed refresh `jti` in `User.refreshTokenJtis[]` array.
- **Refresh:** Verify refresh cookie → check `jti` exists in user's stored jtis → issue new access token + **rotate refresh token** (new jti, invalidate old jti) → set both cookies.
- **Logout:** Clear both cookies (`res.clearCookie`) + remove the refresh `jti` from `User.refreshTokenJtis[]`.
- **Password reset / force-logout:** Delete all entries in `User.refreshTokenJtis[]` → all sessions invalidated.
- **Refresh token rotation:** Every successful refresh issues a new refresh token with a new `jti`. The old `jti` is removed from DB. This limits the window for stolen refresh tokens.
- **DB storage:** Store **hashed** `jti` (SHA-256) rather than plaintext to reduce exposure if DB is compromised.

**Path scoping rationale:** The refresh cookie's `path: '/api/auth/refresh'` ensures it is only sent on refresh requests, not on every API call. This reduces attack surface.

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | REST with PRD-defined endpoints | Locked by PRD; ~30+ endpoints already specified |
| Response format | `{ success, data }` / `{ success, error: { code, message } }` | Consistent parsing on client; error codes enable programmatic handling |
| Error handling | Custom `AppError` class + global error middleware | Centralized error formatting; no stack traces in production |
| Validation | zod middleware on route handlers | Parse-then-use pattern; errors auto-formatted to standard shape |
| Versioning | None for MVP (`/api/` prefix only) | Single deployment, single client; add `/v1/` only if needed |
| Notifications | Polling-based (TanStack Query `refetchInterval`) | No WebSockets for MVP (PRD); TanStack Query makes polling trivial |

### Frontend Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| State management | React Context (auth) + TanStack Query (server state) | TanStack Query v5.x | Context for auth/role; TQ eliminates manual loading/error/cache/refetch logic; built-in polling for notifications |
| API client | Thin typed `apiFetch()` wrapper around fetch | — | TanStack Query handles retries/caching; wrapper handles cookies + error parsing |
| Routing | react-router-dom with role-based route guards | v7.13.x | Protected routes by role; redirect unauthorized users to their dashboard |
| Forms | React Hook Form + zod resolvers | RHF v7.x | Lightweight, performant; zod resolver shares validation schemas with server |
| QR scanning | Browser `getUserMedia` + lightweight QR decode lib | — | Dedicated full-screen scanner page; camera permission fallback to passCode input |
| Styling | Tailwind CSS v4.2 utility classes | v4.2.0 | Locked; CSS-native theme; responsive with standard Tailwind breakpoints |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Railway or Render (finalize later); must support persistent volumes or use Cloudinary for photos | Simple Node.js hosting; handles API + worker + static build |
| Deployment topology | Same-site: SPA static build served by Express (or reverse proxy) + API under one domain | Simplifies auth cookies; no CORS complexity |
| CI/CD | GitHub Actions | Free; lint + test on PR/push |
| Environment | `.env` + dotenv; `.env.example` committed | Keys: `JWT_SECRET`, `QR_SECRET`, `MONGODB_URI`, `CRON_ENABLED`, `NODE_ENV`, `CLOUDINARY_URL` |
| Logging | pino + pino-http | Structured JSON logs; supports audit events, cron heartbeats, verify results |
| Process model | API server + separate cron worker | Same codebase, separate entry points; cron can't block API |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (Vite + Express + Mongoose + npm workspaces)
2. Auth middleware (JWT dual-token + RBAC + cookie config + CSRF check + `trust proxy`)
3. Mongoose schemas + indexes + TTL indexes (all 11 collections)
4. API response/error standardization (AppError + global middleware + zod validation)
5. Leave → QR → Gate scanner flow (highest operational risk; QR payload: `leaveRequestId` + `jti` + `exp`)
6. Complaint → SLA cron worker flow (separate process + CronLog + retention cleanup)
7. Frontend shell (TanStack Query provider + React Router + role guards + auth context)
8. Photo upload integration (Cloudinary) + dashboard + assistant

**Cross-Component Dependencies:**
- Auth middleware must be ready before any protected endpoint
- Mongoose schemas must be defined before routes/controllers
- TanStack Query provider wraps the app; all data fetching depends on it
- Cron worker shares Mongoose models with API but runs independently
- zod schemas can be shared between client and server validation via `shared/`
- Cloudinary config needed before complaint photo upload works
- `trust proxy` must be set before rate limiting is tested on deployed environment

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

12 areas where AI agents could make different choices, grouped into 5 categories. Each pattern below locks a single convention so any agent writing any part of the codebase produces compatible code.

### Naming Patterns

**Mongoose / MongoDB Naming:**
| Element | Convention | Example |
|---------|-----------|---------|
| Collection names | Explicit `collection` option in every schema using camelCase plural | `{ collection: 'users' }`, `{ collection: 'leaves' }`, `{ collection: 'gatePasses' }`, `{ collection: 'gateScans' }`, `{ collection: 'overrides' }`, `{ collection: 'complaints' }`, `{ collection: 'complaintEvents' }`, `{ collection: 'notifications' }`, `{ collection: 'faqEntries' }`, `{ collection: 'cronLogs' }`, `{ collection: 'auditEvents' }` |
| Model names | PascalCase singular | `User`, `Leave`, `GatePass`, `GateScan`, `Override`, `Complaint`, `ComplaintEvent`, `Notification`, `FaqEntry`, `CronLog`, `AuditEvent` |
| Field names | camelCase | `studentId`, `dueAt`, `qrTokenId`, `outLoggedAt` |
| Enum values | UPPER_SNAKE_CASE | `PENDING`, `APPROVED`, `SCANNED_OUT`, `HIGH`, `SLA_ALERT` |
| Index names | let Mongoose auto-generate | Don't manually name indexes |

**Rule:** Always pass `{ collection: 'camelCasePlural' }` in schema options. Never rely on Mongoose's default collection naming (which lowercases and strips casing: `LeaveRequest` → `leaverequests`). This keeps DB collection names readable and consistent.

**API Naming:**
| Element | Convention | Example |
|---------|-----------|---------|
| Endpoints | `/api/{resource}` plural lowercase | `/api/complaints`, `/api/leaves`, `/api/notices` |
| Route params | `:id` camelCase | `/api/complaints/:id/assign` |
| Query params | camelCase | `?status=OPEN&category=plumbing` |
| Action sub-routes | `/api/{resource}/:id/{verb}` | `/api/leaves/:id/approve`, `/api/complaints/:id/status` |

**File & Code Naming:**
| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase `.tsx` | `ScannerPage.tsx`, `ComplaintCard.tsx`, `AuthProvider.tsx` |
| React pages | PascalCase + `Page` suffix | `StudentDashboardPage.tsx`, `GuardScannerPage.tsx` |
| Hooks | camelCase, `use` prefix | `useAuth.ts`, `useComplaints.ts` |
| Server files | kebab-case `.ts` | `leave-request.model.ts`, `auth.middleware.ts`, `gate.controller.ts` |
| Server models | `{entity}.model.ts` | `user.model.ts`, `complaint.model.ts`, `gate-scan.model.ts`, `override.model.ts` |
| Server routes | `{entity}.routes.ts` | `auth.routes.ts`, `complaint.routes.ts` |
| Server controllers | `{entity}.controller.ts` | `leave.controller.ts`, `gate.controller.ts` |
| Server middleware | `{purpose}.middleware.ts` | `auth.middleware.ts`, `rbac.middleware.ts`, `validate.middleware.ts` |
| Zod schemas | `{entity}.schema.ts` in `shared/schemas/` | `leave.schema.ts`, `complaint.schema.ts` |
| Types/interfaces | PascalCase, `I` prefix only if needed to disambiguate from Mongoose model | `LeaveRequest` (type), `ILeaveRequest` (only if Mongoose model name conflicts) |
| Constants | UPPER_SNAKE_CASE | `MAX_PASSCODE_ATTEMPTS`, `SLA_CRON_INTERVAL_MS` |
| Env vars | UPPER_SNAKE_CASE | `JWT_SECRET`, `QR_SECRET`, `MONGODB_URI` |

### Structure Patterns

**Test Organization:**
- Tests co-located next to source files: `complaint.controller.ts` → `complaint.controller.test.ts`
- Test naming: `{filename}.test.ts` (server), `{ComponentName}.test.tsx` (client)
- No separate `__tests__/` directories — keeps related code together

**Component Organization (client) — aligned with UX spec route inventory:**
```
src/
├── pages/                          # Route-level components (one per route)
│   ├── student/
│   │   ├── StudentStatusPage.tsx        # /student/status — StatusCard V2 list + AssistantShortcuts
│   │   ├── StudentActionsPage.tsx       # /student/actions — Request Leave, Report Issue, Show QR cards
│   │   ├── LeaveRequestPage.tsx         # /student/actions/request-leave
│   │   ├── ReportIssuePage.tsx          # /student/actions/report-issue
│   │   ├── ShowQRPage.tsx               # /student/actions/show-qr (conditional on APPROVED pass)
│   │   ├── ComplaintDetailPage.tsx      # /student/status/:complaintId
│   │   └── StudentFaqPage.tsx           # /student/faq
│   ├── warden/
│   │   ├── WardenDashboardPage.tsx      # /warden/dashboard — NeedsAttentionWidget + KPIs + tables
│   │   ├── LeaveDetailPage.tsx          # /warden/leaves/:id — Approve/Reject
│   │   ├── ComplaintsPage.tsx           # /warden/complaints — TableToolbar + dense table
│   │   ├── StudentsPage.tsx             # /warden/students (post-MVP)
│   │   ├── NoticesPage.tsx              # /warden/notices (post-MVP)
│   │   └── FaqManagementPage.tsx        # /warden/faq-management (post-MVP)
│   ├── guard/
│   │   └── GuardScannerPage.tsx         # /guard/scan — full-screen scanner (no nav chrome)
│   └── maintenance/
│       ├── MaintenanceTasksPage.tsx     # /maintenance/tasks — TaskCard list
│       ├── TaskDetailPage.tsx           # /maintenance/tasks/:complaintId
│       ├── MaintenanceHistoryPage.tsx   # /maintenance/history
│       └── MaintenanceFaqPage.tsx       # /maintenance/faq
├── components/
│   ├── ui/                             # shadcn/ui primitives (Button, Card, Badge, Dialog, Sheet, Input, Select, Tabs)
│   ├── layout/                         # 4 role-specific shells + shared
│   │   ├── StudentShell.tsx            # BottomTabBar (3 tabs: Status/Actions/FAQ), top bar with avatar
│   │   ├── WardenShell.tsx             # Sidebar at lg+, hamburger menu below lg
│   │   ├── GuardShell.tsx              # No nav chrome — full-screen scanner only
│   │   ├── MaintenanceShell.tsx        # BottomTabBar (3 tabs: Tasks/History/FAQ), top bar
│   │   ├── BottomTabBar.tsx            # Custom 3-tab nav (NOT shadcn Tabs). Student + Maintenance only
│   │   ├── WardenSidebar.tsx           # Warden sidebar nav (lg+ only)
│   │   ├── RoleGate.tsx                # Role-based route guard component
│   │   └── ProtectedRoute.tsx          # Auth route guard
│   └── domain/                         # Business-specific shared components (UX spec locked names)
│       ├── VerdictScreen.tsx           # Full-screen ALLOW/DENY/OFFLINE overlay (guard scanner)
│       ├── CameraViewfinder.tsx        # QR scanner wrapper (html5-qrcode + states)
│       ├── StatusCardV2.tsx            # Read-only status card (pass/complaint timelines)
│       ├── TaskCard.tsx                # Composes StatusCard V2 + action row (maintenance)
│       ├── SLABadge.tsx                # Auto-coloring SLA countdown badge
│       ├── KPICard.tsx                 # Dashboard metric card (standard + compact)
│       ├── NeedsAttentionWidget.tsx    # Warden exception dashboard widget
│       ├── TimelineEvent.tsx           # Single event in chronological timeline
│       ├── QRDisplay.tsx               # Full-width QR code + passCode fallback
│       ├── AssistantShortcuts.tsx       # Quick-reply shortcut pills (student Status tab)
│       ├── OverflowFadeHint.tsx        # Subtle fade gradient on scrollable badge rows
│       ├── NetworkStatusPill.tsx       # Online/offline/reconnecting indicator
│       ├── TableToolbar.tsx            # Filter/search/sort bar for warden tables
│       ├── EmptyState.tsx              # Friendly empty list state
│       └── ErrorState.tsx              # Error with retry button
├── hooks/                              # Custom hooks
├── services/                           # API client functions (apiFetch wrappers)
├── context/                            # React context providers (AuthContext)
└── utils/                              # Pure helpers
```

**Rule:** Pages are grouped by role. 4 role-specific shells (not one generic AppShell) — each shell owns its navigation pattern. Shared components go in `components/domain/`. Component names match UX spec exactly (VerdictScreen, not ScanResultOverlay).

**Server Organization:**
```
src/
├── routes/         # Route definitions only (app.use registrations)
├── controllers/    # Request handling: parse input → call service → format response
├── services/       # Business logic: state machines, QR generation, SLA computation
├── models/         # Mongoose schemas + statics/methods
├── middleware/     # Cross-cutting: auth, rbac, validate, audit, error-handler, rate-limit
├── worker/         # Cron entry point + SLA job logic
├── config/         # db.ts, env.ts, category-defaults.ts
├── utils/          # Pure helpers (no DB/request dependency)
└── types/          # Server-specific TypeScript types
```

**Rule:** Controllers never import Mongoose models directly — they call services. Services own the business logic and Mongoose queries. This prevents scattered query logic.

### Format Patterns

**API Response Format:**
```typescript
// All success responses
{ success: true, data: T, correlationId: string }

// All error responses
{
  success: false,
  error: {
    code: string,          // Machine-readable: "PASS_EXPIRED", "RATE_LIMITED", etc.
    message: string,       // Human-readable (safe to display)
    field?: string,        // For validation errors: which field failed
    retryable: boolean,    // Client hint: safe to retry this request?
    retryAfterMs?: number  // If retryable + rate-limited: wait this long
  },
  correlationId: string    // Always present — matches X-Correlation-Id header
}

// Paginated responses
{ success: true, data: T[], pagination: { page: number, limit: number, total: number }, correlationId: string }
```

**Error Codes (standardized strings):**
| Code | When |
|------|------|
| `VALIDATION_ERROR` | zod schema validation fails |
| `UNAUTHORIZED` | No valid auth token |
| `FORBIDDEN` | Valid token but wrong role |
| `NOT_FOUND` | Resource doesn't exist |
| `CONFLICT` | State machine violation (e.g., cancel after SCANNED_OUT) |
| `RATE_LIMITED` | Too many passCode/login attempts |
| `INTERNAL_ERROR` | Unhandled server error (no details leaked) |

**Error Code → HTTP Status Mapping (mandatory):**
| Error Code | HTTP Status | Notes |
|------------|-------------|-------|
| `VALIDATION_ERROR` | `400` | zod parse failure; `details` field contains field-level errors |
| `UNAUTHORIZED` | `401` | Missing or expired access token |
| `FORBIDDEN` | `403` | Valid token, insufficient role |
| `NOT_FOUND` | `404` | Resource lookup returned null |
| `CONFLICT` | `409` | Invalid state transition or duplicate create |
| `RATE_LIMITED` | `429` | express-rate-limit triggered; include `Retry-After` header |
| `INTERNAL_ERROR` | `500` | Catch-all; never expose stack trace or DB details |

**Rule:** `AppError` constructor takes `(code, message, statusCode, { retryable?, retryAfterMs?, field? })`. The error code mapping above is the only valid set — do not invent new codes or use unlisted HTTP statuses. The `retryable` flag defaults to `false`. Only `RATE_LIMITED` and `INTERNAL_ERROR` (on 5xx) may be retryable.

**Date/Time Format:**
- API: ISO 8601 strings always (`2026-03-02T14:30:00.000Z`) — Mongoose default
- UI display: formatted using `Intl.DateTimeFormat` or a small utility (no moment/dayjs dependency needed at MVP scale)
- All timestamps are server-generated (prevent client clock tampering)

**JSON Field Convention:**
- camelCase everywhere (API requests, responses, MongoDB fields)
- No snake_case in any JSON payload

### Communication Patterns

**Notification Event Types (granular — enables per-type routing and UI copy):**
```typescript
type NotificationType =
  | 'LEAVE_APPROVED'        // → student
  | 'LEAVE_REJECTED'        // → student
  | 'OVERRIDE_ALERT'        // → warden (guard override pending review)
  | 'SLA_REMINDER'          // → assigned maintenance staff (dueAt - 2h)
  | 'SLA_BREACH'            // → warden (dueAt passed, escalation triggered)
  | 'COMPLAINT_ASSIGNED'    // → maintenance staff
  | 'COMPLAINT_RESOLVED'    // → student
  | 'NOTICE_PUBLISHED';     // → targeted students (all/block/floor)
```

**Routing rule:** Each type has exactly one recipient role. No type is sent to multiple roles — if both warden and student need to know about a complaint resolution, two separate notifications are created (one `COMPLAINT_RESOLVED` → student, one warden dashboard refresh via polling).

**Audit Events vs Logs (single source of truth rule):**

All instrumented events (PRD event instrumentation spec) are written to the `auditEvents` collection as the **single source of truth** using the canonical event schema below. pino logs reference the same `correlationId` + `eventType` field but are **not** the system of record — they are for operational debugging and observability only.

**Canonical AuditEvent Schema (single shape for all domains):**
```typescript
{
  entityType: string;      // "leave" | "gatePass" | "gateScan" | "override" | "complaint" | "notification" | "auth"
  entityId: ObjectId;      // Ref to the primary document
  eventType: string;       // From canonical event list (see below)
  actorRole: string;       // "STUDENT" | "WARDEN" | "GUARD" | "MAINTENANCE" | "SYSTEM"
  actorId: ObjectId | null; // Ref → users. Null for SYSTEM events
  timestamp: Date;         // Server clock — never client clock
  metadata: object;        // Event-specific payload (e.g., { verdict, reason, latencyMs } for scans)
  correlationId: string;   // UUID — links all events in a single flow end-to-end
}
```

**Canonical event types:**
| Domain | Event Types |
|--------|------------|
| Gate pass | `PASS_REQUESTED`, `PASS_APPROVED`, `PASS_REJECTED`, `PASS_CANCELLED`, `PASS_EXPIRED_AUTO`, `PASS_REVOKED` |
| Gate scan | `SCAN_VERIFIED` (metadata: verdict, reason, method, latencyMs), `SCAN_OVERRIDE_GRANTED` (metadata: reason, note, method), `SCAN_OFFLINE_PRESENTED`, `SCAN_OFFLINE_DENY_LOGGED`, `SCAN_OFFLINE_RECONCILED` (metadata: success/fail) |
| Complaint | `COMPLAINT_CREATED`, `COMPLAINT_ASSIGNED`, `COMPLAINT_STATUS_CHANGED` (metadata: fromStatus, toStatus), `COMPLAINT_NOTE_ADDED`, `COMPLAINT_RESOLVED` |
| SLA | `SLA_REMINDER_SENT`, `SLA_BREACHED`, `SLA_ESCALATED`, `SLA_ACKNOWLEDGED` |
| Auth | `AUTH_LOGIN`, `AUTH_FAILED`, `AUTH_REFRESH`, `AUTH_LOCKOUT` |
| Other | `NOTICE_PUBLISHED`, `FAQ_USED`, `STATUS_SHORTCUT_USED` |

| Concern | Where | Purpose |
|---------|-------|---------|
| Accountability / compliance | `auditEvents` collection (MongoDB) | Append-only system of record; indefinite retention (never auto-delete); queryable by warden dashboard |
| Debugging / observability | pino structured logs | Operational troubleshooting; may be ephemeral; not relied on for audit queries |
| Correlation | Both share `correlationId` + `eventType` | Allows tracing a pino log entry back to its AuditEvent and vice versa |

**Rules:**
- When a service performs an auditable action, it writes to `auditEvents` first, then logs via pino with the same `eventType` and `correlationId`. Never log-only without an AuditEvent for actions in the PRD instrumentation spec
- Events are **append-only** — corrections are new events (e.g., `PASS_REVOKED` after `PASS_APPROVED`), never updates
- **Server timestamps only** — never trust client clock
- **correlationId propagation** — originating action sets the ID, all downstream events inherit it via middleware (see X-Correlation-Id HTTP contract below)
- The **TimelineEvent** UI component renders these directly — `entityType` + `eventType` determine icon, color, and copy template

**Logging Pattern (pino):**
```typescript
// Structured log format — every log entry includes:
logger.info({ eventType: 'SCAN_VERIFIED', correlationId, entityType: 'gateScan', entityId, guardId, verdict, method, latencyMs }, 'Gate scan completed');
logger.warn({ eventType: 'SLA_BREACHED', correlationId, entityType: 'complaint', entityId: complaintId, escalationLevel }, 'Complaint SLA breached');
logger.error({ eventType: 'CRON_FAIL', correlationId, entityType: 'cronLog', jobName, error: err.message }, 'Cron cycle failed');
```
- `eventType` field always present — matches canonical audit event types
- `correlationId` always present — ties log to AuditEvent
- No `console.log` anywhere — pino only
- Log levels: `error` (failures), `warn` (breaches/overrides), `info` (normal operations), `debug` (dev only)

### Process Patterns

**Error Handling Chain:**
1. Route handler → zod validates → controller calls service → service returns or throws `AppError`
2. Controller catches `AppError` → formats standard error response
3. Global error middleware catches anything uncaught → logs via pino → returns `INTERNAL_ERROR`
4. **Never** throw raw `Error` in services — always throw `AppError(code, message, statusCode)`

**Loading States (TanStack Query handles automatically):**
```typescript
// Standard pattern for every data-fetching component:
const { data, isLoading, error } = useQuery({ queryKey: ['complaints'], queryFn: fetchComplaints });

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
return <ComplaintList complaints={data} />;
```
- No manual `useState(loading)` — TanStack Query provides `isLoading`, `error`, `data`
- `<LoadingSkeleton />` component for consistent loading UI
- `<ErrorMessage />` component for consistent error display

**Auth Flow Pattern:**
1. Login → server sets httpOnly access + refresh cookies → client stores user/role in `AuthContext`
2. Every `apiFetch()` call: cookies auto-sent (same-site) → if 401 → attempt refresh → if refresh fails → redirect to login
3. Role-based route guard: `<ProtectedRoute roles={['STUDENT']} />` wraps routes — redirects unauthorized users

**Deployment Rule:** Frontend and API must be served under the same site (same eTLD+1) via reverse proxy. If deployment topology ever changes to cross-site (different domains), the auth strategy must switch to `SameSite=None; Secure` + a proper CSRF token strategy. This is a breaking change — do not split domains without revisiting auth.

**State Machine Transition Pattern:**
```typescript
// Services enforce valid transitions — controllers never modify status directly
// Example: complaint status transition
async function updateComplaintStatus(complaintId: string, newStatus: Status, actor: User) {
  const validTransitions: Record<Status, Status[]> = {
    OPEN: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
  };
  // Validate transition, check role permission, atomic update with findOneAndUpdate
}
```
- Transition maps defined once per state machine (leave + complaint) in the service layer
- Role check happens inside the transition function, not in the controller

### HTTP Contracts (from UX Spec Handoff Pack)

**X-Correlation-Id Header:**
- **Request:** `X-Correlation-Id` header — client generates UUID on first action in a flow (e.g., leave submit). If header is absent, server generates one
- **Response:** Server always echoes `X-Correlation-Id` back. Every error response also includes `correlationId` in the JSON body
- **Middleware:** `correlation-id.middleware.ts` extracts from request header → `req.correlationId` → all service calls, AuditEvent writes, notification creates, and pino logs inherit it automatically
- **Frontend:** `apiFetch()` wrapper generates UUID if no flow-level correlationId exists; stores returned correlationId for error reporting

**Retry Policy by Endpoint:**
| Category | Endpoints | Retry? | Policy |
|----------|-----------|--------|--------|
| Scanner verify | `POST /api/gate/validate` | **No** | 3s hard timeout → OFFLINE verdict. Never silently retry |
| Scanner override | `POST /api/gate/override` | **No** | Single attempt. Error → keep sheet open for manual retry |
| Offline reconcile | `POST /api/gate/reconcile` | **Yes** | Exponential backoff: 1s→2s→4s→8s→16s (max 5). Idempotent by scanAttemptId |
| Auth | `POST /api/auth/login`, `/refresh` | **No** | Single attempt. 401 refresh → redirect to login |
| Read endpoints | All `GET` | **Yes** | 1 auto-retry after 3s. Then ErrorState with manual Retry button |
| Write endpoints | All `POST`/`PATCH` (non-scanner) | **No auto** | Error toast with "Retry" action. Form data preserved |
| Health ping | `GET /api/health` | **Yes** | Poll every 30s. 3 consecutive failures → "Offline" |

**Frontend implementation:** `fetchWithRetry` wrapper reads `retryable` + `retryAfterMs` from error response. Scanner route uses raw `fetch` + `AbortController` (no wrapper). Never retry 4xx. All retries use jitter (±20%).

**Idempotency Keys (dangerous writes):**
| Endpoint | Key Strategy | Server Behavior |
|----------|-------------|-----------------|
| `POST /api/gate/override` | `Idempotency-Key` header (UUID, generated when sheet opens) | Store key in lightweight `idempotencyKeys` collection (TTL 5min). Duplicate → return cached response |
| `POST /api/gate/validate` | Deterministic: `sha256(token + guardId + directionUsed + 2s-bucket)` | Check `gateScans` for match within 2s. Duplicate → return cached verdict |
| `POST /api/gate/reconcile` | Each offline attempt carries original `scanAttemptId` | Upsert by scanAttemptId — naturally idempotent |

**Implementation:** Client generates `Idempotency-Key` UUID when action UI opens (not on tap). Server checks before processing, caches response for 5min. Frontend also disables submit button on tap (optimistic), but idempotency key is the safety net.

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow the naming conventions above — no exceptions. If unsure, check an existing file in the same directory.
2. Always set explicit `{ collection: 'camelCasePlural' }` on every Mongoose schema. Never rely on Mongoose default collection naming.
3. Use the controller → service → model layering. Controllers never import models directly.
4. Use `AppError` for all error cases. Never throw raw errors or return ad-hoc error shapes.
5. Use TanStack Query for all server data fetching. No manual `useEffect` + `fetch` + `useState(loading)`.
6. Use pino for all server logging. No `console.log`.
7. Write auditable actions to `auditEvents` collection first (using canonical schema: entityType, entityId, eventType, metadata, correlationId), then log via pino with matching `correlationId` + `eventType`.
8. Use the standard API response format. No custom response shapes.
9. Co-locate tests next to source files. Name them `{file}.test.ts(x)`.

**Anti-Patterns (Never Do This):**
| Anti-Pattern | Correct Pattern |
|-------------|----------------|
| `console.log('user created')` | `logger.info({ action: 'USER_CREATED', correlationId, userId }, 'User created')` |
| `res.json({ user, message: 'ok' })` | `res.json({ success: true, data: { user } })` |
| `throw new Error('Not found')` | `throw new AppError('NOT_FOUND', 'Complaint not found', 404)` |
| `const [loading, setLoading] = useState(true)` | `const { isLoading } = useQuery(...)` |
| `import Complaint from '../models/complaint.model'` (in controller) | `import { complaintService } from '../services/complaint.service'` |
| `complaint.status = 'RESOLVED'; await complaint.save()` | `await complaintService.transition(id, 'RESOLVED', actor)` |
| `new Schema({...})` (no collection option) | `new Schema({...}, { collection: 'complaints', timestamps: true, strict: true })` |
| Log-only for auditable action (no AuditEvent written) | Write to `auditEvents` first (canonical schema), then log via pino with same `correlationId` + `eventType` |
| `ScanResultOverlay` (old name) | Use `VerdictScreen` (UX spec locked name) |
| Single `AppShell` for all roles | Use role-specific shells: `StudentShell`, `WardenShell`, `GuardShell`, `MaintenanceShell` |
| `GateLog` / `OverrideLog` (old model names) | Use `GateScan` / `Override` (aligned with UX spec data model) |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
smarthostel/
├── .github/
│   └── workflows/
│       └── ci.yml                          # Lint + test on PR/push
├── .env.example                            # Template: JWT_SECRET, QR_SECRET, MONGODB_URI, CRON_ENABLED, NODE_ENV, CLOUDINARY_URL
├── .gitignore
├── package.json                            # Root: workspaces ["client", "server", "shared"], devDeps: concurrently
│
├── shared/                                 # Shared types + constants (consumed by both client & server)
│   ├── package.json
│   ├── tsconfig.json
│   ├── schemas/                            # Zod schemas (shared validation)
│   │   ├── auth.schema.ts                  # Login, password reset validation
│   │   ├── leave.schema.ts                 # Leave request create
│   │   ├── complaint.schema.ts             # Complaint create
│   │   └── notice.schema.ts               # Notice create
│   ├── constants/
│   │   ├── roles.ts                        # Role enum: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE
│   │   ├── leave-status.ts                 # PENDING, APPROVED, REJECTED, CANCELLED, SCANNED_OUT, SCANNED_IN, COMPLETED, EXPIRED, REVOKED, CORRECTED
│   │   ├── complaint-status.ts             # OPEN, ASSIGNED, IN_PROGRESS, RESOLVED
│   │   ├── priority.ts                     # HIGH, MEDIUM, LOW, CRITICAL
│   │   ├── notification-types.ts           # COMPLAINT_UPDATE, LEAVE_UPDATE, NOTICE, SLA_ALERT, OVERRIDE_ALERT
│   │   ├── scan-results.ts                 # VALID, EXPIRED, CANCELLED, ALREADY_SCANNED_OUT, ALREADY_SCANNED_IN, ALREADY_COMPLETED, INVALID_SIGNATURE, NOT_FOUND, NETWORK_UNVERIFIED, NOT_YET_VALID
│   │   ├── error-codes.ts                  # VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR
│   │   └── leave-types.ts                  # DAY_OUTING, OVERNIGHT
│   └── types/
│       ├── api-responses.ts                # ApiSuccess<T>, ApiError, PaginatedResponse<T>
│       ├── user.types.ts                   # User, UserRole
│       ├── leave.types.ts                  # LeaveRequest, GateScan, Override, ScanResult
│       ├── complaint.types.ts              # Complaint, ComplaintUpdate
│       ├── notification.types.ts           # Notification
│       └── dashboard.types.ts              # DashboardKPIs, SystemHealth
│
├── client/                                 # React SPA (Vite + Tailwind)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                      # @tailwindcss/vite plugin, proxy /api → localhost:5000 in dev
│   ├── index.html
│   └── src/
│       ├── main.tsx                        # App entry: QueryClientProvider + AuthProvider + RouterProvider
│       ├── app.css                         # @import "tailwindcss"
│       ├── router.tsx                      # Route definitions + ProtectedRoute guards
│       │
│       ├── context/
│       │   └── AuthContext.tsx             # Auth state: user, role, login(), logout(), isAuthenticated
│       │
│       ├── services/
│       │   └── api-client.ts              # apiFetch<T>(): typed fetch wrapper, cookie-based auth, 401 → refresh → retry
│       │
│       ├── hooks/
│       │   ├── useAuth.ts                 # useContext(AuthContext) wrapper
│       │   ├── useComplaints.ts           # TanStack Query: complaint CRUD queries/mutations
│       │   ├── useLeaves.ts               # TanStack Query: leave CRUD queries/mutations
│       │   ├── useNotifications.ts        # TanStack Query: polling with refetchInterval
│       │   ├── useDashboard.ts            # TanStack Query: admin dashboard KPIs + health
│       │   ├── useGateScan.ts             # TanStack Query mutation: verify QR/passCode
│       │   └── useFaqSearch.ts            # Fuse.js: client-side FAQ fuzzy search
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── student/
│       │   │   ├── StudentStatusPage.tsx       # /student/status — StatusCard V2 list + AssistantShortcuts (pinned top)
│       │   │   ├── StudentActionsPage.tsx      # /student/actions — Request Leave, Report Issue, Show QR action cards
│       │   │   ├── LeaveRequestPage.tsx        # /student/actions/request-leave — type + dates + reason template
│       │   │   ├── ReportIssuePage.tsx         # /student/actions/report-issue — category + room + description
│       │   │   ├── ShowQRPage.tsx              # /student/actions/show-qr — QRDisplay + passCode fallback (conditional on APPROVED pass)
│       │   │   ├── ComplaintDetailPage.tsx     # /student/status/:complaintId — timeline, SLA badge (read-only)
│       │   │   └── StudentFaqPage.tsx          # /student/faq — Fuse.js search + categorized accordion
│       │   ├── warden/
│       │   │   ├── WardenDashboardPage.tsx     # /warden/dashboard — NeedsAttentionWidget + KPICard grid + tables
│       │   │   ├── LeaveDetailPage.tsx         # /warden/leaves/:id — student profile + Approve/Reject
│       │   │   ├── ComplaintsPage.tsx          # /warden/complaints — TableToolbar + dense table + sticky header
│       │   │   ├── StudentsPage.tsx            # /warden/students (post-MVP)
│       │   │   ├── NoticesPage.tsx             # /warden/notices (post-MVP)
│       │   │   └── FaqManagementPage.tsx       # /warden/faq-management (post-MVP)
│       │   ├── guard/
│       │   │   └── GuardScannerPage.tsx        # /guard/scan — full-screen CameraViewfinder + VerdictScreen overlays + Override/PassCode sheets
│       │   └── maintenance/
│       │       ├── MaintenanceTasksPage.tsx    # /maintenance/tasks — TaskCard list sorted by urgency
│       │       ├── TaskDetailPage.tsx          # /maintenance/tasks/:complaintId — detail + Mark Done + Add Note
│       │       ├── MaintenanceHistoryPage.tsx  # /maintenance/history — resolved tasks, date filter
│       │       └── MaintenanceFaqPage.tsx      # /maintenance/faq — SOPs + search
│       │
│       ├── components/
│       │   ├── ui/                             # shadcn/ui primitives (installed via CLI, customized with Tailwind)
│       │   │   ├── Button.tsx                  # Includes success (green-700) + warning (amber) variants
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx                   # Extended with SLA color variants
│       │   │   ├── Dialog.tsx                  # Destructive: Escape blocked, no outside-click dismiss
│       │   │   ├── Sheet.tsx                   # side="bottom" default for mobile
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Tabs.tsx                    # In-page content switching only (NOT app navigation)
│       │   │   └── Skeleton.tsx               # CSS-only shimmer; static fill when prefers-reduced-motion
│       │   ├── layout/                         # 4 role-specific shells (NOT one generic AppShell)
│       │   │   ├── StudentShell.tsx            # BottomTabBar (Status/Actions/FAQ), top bar, px-4 py-4
│       │   │   ├── WardenShell.tsx             # Sidebar at lg+, hamburger below lg, px-6 py-6
│       │   │   ├── GuardShell.tsx              # No nav chrome, full-screen, no padding
│       │   │   ├── MaintenanceShell.tsx        # BottomTabBar (Tasks/History/FAQ), top bar, px-4 py-4
│       │   │   ├── BottomTabBar.tsx            # Custom 3-tab nav. NOT shadcn Tabs. Student + Maintenance only. All breakpoints
│       │   │   ├── WardenSidebar.tsx           # Sidebar links (lg+ only)
│       │   │   ├── RoleGate.tsx                # Role-based route guard
│       │   │   └── ProtectedRoute.tsx          # Auth route guard
│       │   └── domain/                         # Business-specific shared (UX spec locked names)
│       │       ├── VerdictScreen.tsx           # Full-screen ALLOW/DENY/OFFLINE verdict overlay
│       │       ├── CameraViewfinder.tsx        # QR scanner wrapper (html5-qrcode + 6 states)
│       │       ├── StatusCardV2.tsx            # Read-only status card (timelines). Pure display, no actions
│       │       ├── TaskCard.tsx                # Composes StatusCard V2 + action row (maintenance)
│       │       ├── SLABadge.tsx                # Auto-coloring countdown (gray→amber→red→green)
│       │       ├── KPICard.tsx                 # Dashboard metric (standard + compact at xl)
│       │       ├── NeedsAttentionWidget.tsx    # Warden exception dashboard widget
│       │       ├── TimelineEvent.tsx           # Single event in timeline (renders from AuditEvent schema)
│       │       ├── QRDisplay.tsx               # Full-width QR code + passCode fallback text
│       │       ├── AssistantShortcuts.tsx      # Quick-reply shortcut pills (student Status tab)
│       │       ├── OverflowFadeHint.tsx        # Fade gradient on scrollable badge rows
│       │       ├── NetworkStatusPill.tsx       # Online/offline/reconnecting indicator
│       │       ├── TableToolbar.tsx            # Filter/search/sort bar for warden tables
│       │       ├── EmptyState.tsx              # Friendly empty list + CTA
│       │       └── ErrorState.tsx              # Error with context-specific detail + Retry button
│       │
│       ├── utils/
│       │   ├── faq-search.ts                   # Fuse.js index builder + search function
│       │   ├── date-format.ts                  # Intl.DateTimeFormat wrappers
│       │   └── qr-scanner.ts                   # getUserMedia + QR decode lib wrapper
│       │
│       └── types/                              # Client-only types (if any beyond shared/)
│
├── server/                                     # Express API + Cron Worker
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                            # API server entry point
│       │
│       ├── app.ts                              # Express app setup: trust proxy, cookie-parser, middleware stack, route mounting, error handler
│       │
│       ├── config/
│       │   ├── db.ts                           # Mongoose connection + event handlers
│       │   ├── env.ts                          # Validated env vars (zod parsed); includes CSRF origin allowlist (localhost:5173 dev + prod origin)
│       │   ├── category-defaults.ts            # Per-category SLA thresholds + default priorities (from categoryDefaults.json)
│       │   └── cloudinary.ts                   # Cloudinary SDK setup
│       │
│       ├── models/                             # Mongoose schemas (every schema has explicit { collection, timestamps, strict })
│       │   ├── user.model.ts                   # collection: 'users'. Roles, credentials, refreshTokenJtis[], block, floor, roomNumber
│       │   ├── consent.model.ts                # collection: 'consents'. userId, version, timestamp
│       │   ├── leave.model.ts                  # collection: 'leaves'. Leave lifecycle: type (DAY_OUTING|OVERNIGHT), status, approvedBy/At
│       │   ├── gate-pass.model.ts              # collection: 'gatePasses'. 1:1 with approved leave. qrToken, passCode, jti, status, expiresAt, lastGateState
│       │   ├── gate-scan.model.ts              # collection: 'gateScans'. Every scan attempt: verdict, method, direction fields, offlineStatus, latencyMs. No TTL (1yr archive)
│       │   ├── override.model.ts               # collection: 'overrides'. Guard overrides: reason, note, method, reviewedBy/At, correlationId
│       │   ├── complaint.model.ts              # collection: 'complaints'. Lifecycle: status, priority, dueAt, assigneeId, slaBreachedAt, escalatedTo
│       │   ├── complaint-event.model.ts        # collection: 'complaintEvents'. Timeline events: eventType, actorId, actorRole, data, timestamp
│       │   ├── notice.model.ts                 # collection: 'notices'. Warden notices: target (all/block/floor), content
│       │   ├── notification.model.ts           # collection: 'notifications'. 8 granular types, entityType/entityId, isRead. TTL: 180 days
│       │   ├── faq-entry.model.ts              # collection: 'faqEntries'. question, answer, category, keywords (Fuse.js)
│       │   ├── fee.model.ts                    # collection: 'fees'. Read-only in MVP, seeded
│       │   ├── cron-log.model.ts               # collection: 'cronLogs'. Heartbeat: jobName, status, counts, errors. TTL: 90 days
│       │   └── audit-event.model.ts            # collection: 'auditEvents'. Canonical schema: entityType, entityId, eventType, actorId, actorRole, metadata, correlationId. No TTL (indefinite)
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts               # JWT access token verification from httpOnly cookie (requires cookie-parser)
│       │   ├── rbac.middleware.ts               # requireRole(...roles) middleware
│       │   ├── csrf.middleware.ts               # Origin/Referer header validation on POST/PATCH/DELETE; allowlist from env.ts
│       │   ├── correlation-id.middleware.ts     # Extract X-Correlation-Id from request (or generate UUID), attach to req.correlationId, echo in response header
│       │   ├── idempotency.middleware.ts        # Check Idempotency-Key header against idempotencyKeys collection; return cached response on duplicate
│       │   ├── validate.middleware.ts           # Generic zod schema validator: validate(schema) → middleware
│       │   ├── rate-limit.middleware.ts         # Configured rate limiters: loginLimiter, passCodeLimiter
│       │   ├── upload.middleware.ts             # Multer + Cloudinary integration for complaint photos
│       │   └── error-handler.middleware.ts      # Global error handler: AppError → standard response (includes correlationId), unknown → INTERNAL_ERROR + pino log
│       │
│       ├── routes/
│       │   ├── auth.routes.ts                  # POST /login, GET /me, POST /reset-password, POST /refresh
│       │   ├── student.routes.ts               # GET /students (warden)
│       │   ├── complaint.routes.ts             # CRUD + assign + status + priority
│       │   ├── leave.routes.ts                 # CRUD + approve/reject/cancel
│       │   ├── gate.routes.ts                  # POST /validate, GET /logs
│       │   ├── notice.routes.ts                # CRUD + broadcast
│       │   ├── fee.routes.ts                   # GET /me (student), GET / (warden) — read-only, no PATCH in MVP
│       │   ├── assistant.routes.ts             # GET /status/complaints, /status/leaves, /status/fees, /faq
│       │   ├── notification.routes.ts          # GET /, PATCH /:id/read
│       │   └── admin.routes.ts                 # GET /dashboard, GET /hostel/present-count
│       │
│       ├── controllers/                        # Request → parse → call service → format response (never imports models)
│       │   ├── auth.controller.ts
│       │   ├── student.controller.ts
│       │   ├── complaint.controller.ts
│       │   ├── leave.controller.ts
│       │   ├── gate.controller.ts
│       │   ├── notice.controller.ts
│       │   ├── fee.controller.ts
│       │   ├── assistant.controller.ts
│       │   ├── notification.controller.ts
│       │   └── admin.controller.ts
│       │
│       ├── services/                           # Business logic + Mongoose queries + state machines
│       │   ├── auth.service.ts                 # Login, token generation, refresh, revocation, password reset
│       │   ├── user.service.ts                 # User CRUD, account management
│       │   ├── complaint.service.ts            # Complaint lifecycle transitions, assignment, priority override
│       │   ├── leave.service.ts                # Leave lifecycle transitions, cancellation rules
│       │   ├── gate.service.ts                 # QR generation (JWT sign), verification, passCode validation, offline logging + reconciliation
│       │   ├── notification.service.ts         # Create + route notifications by type, batch to prevent fatigue
│       │   ├── sla.service.ts                  # SLA computation (dueAt from category), reminder/escalation logic
│       │   └── audit.service.ts                # Write AuditEvent + correlationId generation, then pino log
│       │
│       ├── worker/                             # Cron worker (separate process entry point)
│       │   ├── index.ts                        # Worker entry: connect DB, register cron jobs, heartbeat
│       │   ├── sla-checker.job.ts              # 10-min cycle: check dueAt, send reminders, escalate breaches, write CronLog
│       │   └── retention-cleanup.job.ts        # Daily: pre-aggregate + TTL-expired doc cleanup
│       │
│       ├── scripts/                            # Dev/ops scripts (run via npm -w server run seed)
│       │   ├── seed.ts                         # Seed demo data: users, rooms, FAQs, categories, sample complaints/leaves, fee records
│       │   └── seed-data/
│       │       ├── users.json                  # Sample students, warden, guards, maintenance (with block/floor/roomNumber)
│       │       ├── faqs.json                   # 20+ FAQ entries
│       │       ├── fees.json                   # Seeded fee records (read-only in MVP)
│       │       └── category-defaults.json      # Per-category SLA thresholds + default priorities
│       │
│       ├── utils/
│       │   ├── app-error.ts                    # AppError class: code, message, statusCode
│       │   ├── logger.ts                       # Pino instance + pino-http middleware factory
│       │   └── correlation-id.ts               # Generate + propagate correlationId per request
│       │
│       └── types/                              # Server-only types
```

### Scope Alignment Notes

**Fee module (MVP = read-only):**
- `fee.model.ts` exists but is seeded-only — no PATCH endpoint, no FeeManagementPage
- Student reads via GET `/api/fees/me`; warden reads via GET `/api/fees`
- Fee editing is post-MVP scope

**Room/block/floor (MVP = denormalized on User):**
- No separate Room model or RoomManagementPage in MVP
- `block`, `floor`, `roomNumber` stored directly on User document (seeded via seed script)
- Room management UI + separate Room collection deferred to post-MVP
- This simplifies queries (no populate for room info) and matches seed-only data setup

**FAQ (all roles):**
- `FaqPage.tsx` is a shared page accessible from all role dashboards
- FAQ endpoints are auth-required but role-agnostic (PRD permission matrix: all roles ✅)
- Sidebar includes FAQ link for every role

**Gate scan model (replaces GateLog — renamed to `gateScans` collection):**
- Model name: `GateScan`, collection: `gateScans`, file: `gate-scan.model.ts`
- Every scan attempt (success, failure, offline) creates an append-only `GateScan` entry
- **Direction audit fields** (every scan record):
  - `directionDetected: 'ENTRY' | 'EXIT'` — server auto-detected from leave status + last gate state
  - `directionUsed: 'ENTRY' | 'EXIT'` — actually applied (same as detected unless manually overridden)
  - `directionSource: 'AUTO' | 'MANUAL_ONE_SHOT'` — whether guard manually overrode direction
  - `lastGateStateBeforeScan: 'IN' | 'OUT' | 'UNKNOWN'` — student's gate state before this scan
- **Offline status** (replaces `isOffline` boolean with richer enum):
  - `offlineStatus: 'OFFLINE_PRESENTED' | 'OFFLINE_DENY_LOGGED' | 'OFFLINE_OVERRIDE' | null`
  - `null` = normal online scan
  - `OFFLINE_PRESENTED` = created immediately when OFFLINE screen appears (records attempt even if guard walks away)
  - `OFFLINE_DENY_LOGGED` = guard tapped "Deny (Log Attempt)"
  - `OFFLINE_OVERRIDE` = guard tapped "Override to Allow"
  - `reconciledAt: Date | null` — set when offline scan syncs on reconnect
  - `reconcileStatus: 'PENDING' | 'SUCCESS' | 'FAIL' | null` — `null` for online scans; `PENDING` when offline GateScan is created (before reconciliation); `SUCCESS` or `FAIL` after reconciliation completes
  - `reconcileErrorCode: string | null` — set on `FAIL` (e.g., `EXPIRED_AT_SCAN_TIME`, `ALREADY_TRANSITIONED`)
- **Verdict field**: `verdict: 'ALLOW' | 'DENY' | 'OFFLINE'` (the 3-word guard vocabulary, not internal enum names)
- **Performance fields**: `latencyMs: number`, `timeoutTriggered: boolean` (true if > 3s)
- Health widget queries `GateScan.countDocuments({ offlineStatus: { $ne: null }, reconcileStatus: 'PENDING' })` for "offline scans pending reconciliation"
- Unresolved `OFFLINE_PRESENTED` records (without follow-up action) surface in warden review queue on connectivity restore
- **Retention:** 1 year, no TTL in MVP. Archive to cold storage post-MVP

**Seed script location:**
- Moved to `server/scripts/seed.ts` (tsx is a server devDep)
- Run via `npm -w server run seed`

**Missing runtime deps (add to server package.json):**
- `cookie-parser` + `@types/cookie-parser` — required for httpOnly cookie JWT auth
- `cloudinary` — required for photo upload

### Architectural Boundaries

**API Boundaries:**
All external access goes through Express routes → controllers → services → models. No direct model access from routes or controllers.

```
Client (SPA) ──HTTP/cookies──→ Express Routes ──→ Controllers ──→ Services ──→ Models (MongoDB)
                                    │                                │
                                    ├── Middleware (auth, rbac,      ├── AuditService (writes to auditEvents collection)
                                    │   csrf, correlation-id,        ├── NotificationService
                                    │   idempotency, validate,       └── GateService (QR sign/verify)
                                    │   rate-limit, cookie-parser)
                                    └── Error Handler
```

**Process Boundaries:**
```
┌──────────────────────────┐     ┌──────────────────────────┐
│      API Server          │     │      Cron Worker          │
│  (server/src/index.ts)   │     │  (server/src/worker/)     │
│                          │     │                          │
│  Express + Routes +      │     │  node-cron + SLA checker │
│  Controllers + Services  │     │  + retention cleanup     │
│  + Middleware             │     │  + CronLog heartbeat     │
│                          │     │                          │
│  Shares: models/,        │     │  Shares: models/,        │
│  services/, config/      │     │  services/, config/      │
└──────────┬───────────────┘     └──────────┬───────────────┘
           │                                │
           └────────── MongoDB ─────────────┘
```

**Data Visibility Boundaries (RBAC-enforced):**
| Boundary | Rule |
|----------|------|
| Guard → Complaints | **Blocked**: Guard routes never import complaint services |
| Maintenance → GateScans | **Blocked**: Maintenance routes never import gate services |
| Student → Other Students | **Query-filtered**: All student queries include `{ studentId: req.user._id }` |
| Warden → Everything | **Full access**: No query filter restrictions |

### Requirements to Structure Mapping

**FR Category → Directory Mapping:**

| FR Category | Server Routes | Server Controller | Server Service | Client Pages |
|-------------|---------------|-------------------|----------------|--------------|
| Identity & Access (FR1-5) | `auth.routes.ts`, `student.routes.ts` | `auth.controller.ts`, `student.controller.ts` | `auth.service.ts`, `user.service.ts` | `LoginPage.tsx`, `StudentsPage.tsx` (post-MVP) |
| Leave & Gate Pass (FR6-11) | `leave.routes.ts` | `leave.controller.ts` | `leave.service.ts`, `gate.service.ts` | `LeaveRequestPage.tsx`, `StudentStatusPage.tsx`, `ShowQRPage.tsx`, `LeaveDetailPage.tsx` |
| Gate Verification (FR12-17) | `gate.routes.ts` | `gate.controller.ts` | `gate.service.ts` | `GuardScannerPage.tsx` (CameraViewfinder + VerdictScreen) |
| Override Governance (FR18-20) | `gate.routes.ts` | `gate.controller.ts` | `gate.service.ts`, `notification.service.ts` | `GuardScannerPage.tsx` (Override sheet), `WardenDashboardPage.tsx` (NeedsAttentionWidget review) |
| Complaint & SLA (FR21-27) | `complaint.routes.ts` | `complaint.controller.ts` | `complaint.service.ts`, `sla.service.ts` | `ReportIssuePage.tsx`, `ComplaintDetailPage.tsx`, `MaintenanceTasksPage.tsx`, `TaskDetailPage.tsx`, `ComplaintsPage.tsx` |
| Self-Service Assistant (FR28-30) | `assistant.routes.ts` | `assistant.controller.ts` | (delegates to other services) | `AssistantShortcuts.tsx` (component on StudentStatusPage), `StudentFaqPage.tsx` |
| Dashboards (FR31-34) | `admin.routes.ts` | `admin.controller.ts` | (aggregation queries) | `WardenDashboardPage.tsx` (NeedsAttentionWidget + KPICard grid) |
| Notices (FR35-36) | `notice.routes.ts`, `notification.routes.ts` | `notice.controller.ts`, `notification.controller.ts` | `notification.service.ts` | `NoticesPage.tsx` (post-MVP) |
| Audit & Monitoring (FR37-40) | `admin.routes.ts` | `admin.controller.ts` | `audit.service.ts` | `WardenDashboardPage.tsx` (health widget) |
| State Machines (FR41-43) | — | — | `leave.service.ts`, `complaint.service.ts` | — |

**Cross-Cutting Concerns → File Mapping:**

| Concern | Files |
|---------|-------|
| Authentication | `auth.middleware.ts`, `auth.service.ts`, `AuthContext.tsx`, `api-client.ts`, cookie-parser |
| RBAC | `rbac.middleware.ts`, `ProtectedRoute.tsx`, `roles.ts` (shared) |
| CSRF | `csrf.middleware.ts`, `env.ts` (origin allowlist: `localhost:5173` dev + prod origin) |
| Audit trail | `audit.service.ts`, `audit-event.model.ts`, `correlation-id.ts`, `logger.ts` |
| Notifications | `notification.service.ts`, `notification.model.ts`, `NotificationBell.tsx`, `useNotifications.ts` |
| Error handling | `app-error.ts`, `error-handler.middleware.ts`, `ErrorMessage.tsx` |
| SLA automation | `sla.service.ts`, `sla-checker.job.ts`, `cron-log.model.ts`, `SLABadge.tsx` |
| Offline gate handling | `gate-scan.model.ts` (offlineStatus enum + reconcileStatus fields), `gate.service.ts`, `NeedsAttentionWidget.tsx` (offline-scans-pending card) |

### Data Flow

**Gate Scan Flow (highest-stakes path):**
```
Guard scans QR → getUserMedia → decode QR → apiFetch POST /api/gate/validate
  → cookie-parser (extract JWT)
  → auth.middleware (verify guard JWT)
  → rbac.middleware (requireRole GUARD)
  → csrf.middleware (Origin check against allowlist)
  → correlation-id.middleware (read/generate X-Correlation-Id)
  → validate.middleware (zod: { qrToken } or { passCode })
  → gate.controller → gate.service.verify()
    → JWT.verify(qrToken, QR_SECRET)
    → LeaveRequest.findOneAndUpdate({ _id, outLoggedAt: null }, { outLoggedAt: now })  // atomic
    → GateScan.create({ verdict, method, guardId, directionDetected, directionUsed, directionSource, offlineStatus: null })
    → AuditEvent.create({ eventType: 'GATE_SCAN_VERIFIED', entityType: 'gateScan', ... })
  → Response: { success: true, data: { verdict: 'ALLOW', student: { name, block }, leaveType, returnBy }, correlationId }
  → VerdictScreen: full-screen ALLOW/DENY overlay (48px primary word + 14px proof line)
```

**SLA Cron Flow:**
```
node-cron (every 10 min) → sla-checker.job
  → Complaint.find({ status: { $nin: ['RESOLVED'] }, dueAt: { $lte: now + 2h } })
  → For near-breach: notification.service.create(assignee, SLA_REMINDER)
  → Complaint.find({ status: { $nin: ['RESOLVED'] }, dueAt: { $lte: now } })
  → For breached: Complaint.updateOne({ priority: 'CRITICAL', escalatedAt, escalationLevel++ })
    → notification.service.create(warden, SLA_BREACH)
  → CronLog.create({ jobName: 'sla-checker', status: 'SUCCESS', complaintsReminded, complaintsEscalated })
```

### Development Workflow Integration

**Dev Scripts (root package.json):**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "npm -w client run dev",
    "dev:server": "npm -w server run dev",
    "dev:worker": "npm -w server run dev:worker",
    "build": "npm -w shared run build && npm -w client run build && npm -w server run build",
    "seed": "npm -w server run seed",
    "lint": "npm -w client run lint && npm -w server run lint",
    "test": "npm -w client run test && npm -w server run test"
  }
}
```

**Vite Dev Proxy (client/vite.config.ts):**
In development, Vite proxies `/api` requests to the Express server (e.g., `localhost:5000`), simulating same-site deployment without CORS configuration.

### UX Deliverable — RESOLVED

~~A thin UX artifact is required for the 4 make-or-break surfaces.~~

**Status: COMPLETE.** The full UX Design Specification (`_bmad-output/planning-artifacts/ux-design-specification.md`) covers all 4 surfaces plus dev handoff pack:
1. **Guard Scanner** — GuardScannerPage with CameraViewfinder + VerdictScreen + Override sheet + offline fallback (OFFLINE_PRESENTED → action → reconcile)
2. **Student Leave Request + QR Display** — LeaveRequestPage + ShowQRPage with QR generation flow
3. **Complaint Timeline + SLA Countdown** — ComplaintDetailPage with SLABadge, status timeline, escalation states
4. **Warden Dashboard** — WardenDashboardPage with NeedsAttentionWidget (KPICard grid + offline-scans-pending + health)

Includes: 24-route inventory, component acceptance criteria, API contract lock (22 endpoints), 3-week build order, MongoDB data model lock, canonical audit schema, error/retry policy, and retention/TTL policy.

## Gate Verification Invariants

The gate scan endpoint is the highest-stakes path. These invariants prevent race conditions, replay attacks, and duplicate state transitions.

### Directional State Machine (per LeaveRequest)

```
APPROVED → SCANNED_OUT → SCANNED_IN → COMPLETED
                │               │
                └─ (re-scan)    └─ (re-scan)
                   returns         returns
                   ALREADY_        ALREADY_
                   SCANNED_OUT     SCANNED_IN
```

### Scan Idempotency Rules

| Current State | Scan Direction | Result | State Change |
|---------------|---------------|--------|-------------|
| `APPROVED` | OUT | `VALID` | → `SCANNED_OUT` + set `outLoggedAt` |
| `SCANNED_OUT` | OUT | `ALREADY_SCANNED_OUT` | None (idempotent) |
| `SCANNED_OUT` | IN | `VALID` | → `SCANNED_IN` + set `inLoggedAt` |
| `SCANNED_IN` | IN | `ALREADY_SCANNED_IN` | None (idempotent) |
| `SCANNED_IN` | — | `COMPLETED` | Automatic on successful IN scan (per PRD: SCANNED_IN → COMPLETED is immediate) |
| `EXPIRED` / `CANCELLED` / `REVOKED` | Any | Denied with reason | None |

**Implementation rule:** Use `findOneAndUpdate` with a condition on the current status to make each transition atomic. If the condition doesn't match (concurrent scan), the update is a no-op — return the appropriate `ALREADY_*` result.

```typescript
// Example: OUT scan — atomic, idempotent
const result = await LeaveRequest.findOneAndUpdate(
  { _id: leaveRequestId, status: 'APPROVED' },  // only transitions from APPROVED
  { $set: { status: 'SCANNED_OUT', outLoggedAt: new Date() } },
  { new: true }
);
if (!result) {
  // Either not found or already scanned — check current state to return correct code
  const current = await LeaveRequest.findById(leaveRequestId);
  if (current?.status === 'SCANNED_OUT') return 'ALREADY_SCANNED_OUT';
  // ... other denied reasons
}
```

### Anti-Replay Defense

- Each QR token contains `jti` (unique per pass generation) + `exp` (expiry timestamp)
- Server verifies `exp` has not passed before processing
- **Optional hardening (post-MVP):** store `lastScanJti` on the LeaveRequest — reject if same `jti` is presented within a short window (e.g., 5 seconds) to prevent rapid re-scan from duplicate decode events

### GateScan Written on Every Scan

Every scan attempt (success or failure) creates a `GateScan` entry. **Immutability rules:**
- Core audit fields (`verdict`, `directionDetected`, `directionUsed`, `directionSource`, `guardId`, `latencyMs`) are append-only and never modified after creation.
- `offlineStatus` may transition from `OFFLINE_PRESENTED` → `OFFLINE_OVERRIDE` or `OFFLINE_DENY_LOGGED` during the same guard session (guard-action finalization, before any sync). After sync, `offlineStatus` is immutable.
- Reconciliation metadata (`reconcileStatus`, `reconcileErrorCode`, `reconciledAt`) may be updated when an offline scan is reconciled.
- No other mutations are permitted. Even denied scans are logged for audit.

## Offline Reconciliation Spec

### Client-Side Offline Queue

| Aspect | Specification |
|--------|--------------|
| Storage | `localStorage` key: `offlineGateScans` (JSON array) |
| Fallback | If `localStorage` quota exceeded, use `IndexedDB` `offlineScans` store |
| Entry shape | `{ qrPayload, passCode, directionDetected, scannedAt, guardId, deviceTimestamp, scanAttemptId }` |
| Max queue size | 100 entries (oldest evicted if full — edge case at ~100 is extremely unlikely) |

### Sync Triggers

1. **Automatic:** `navigator.onLine` event → on reconnect, flush queue sequentially
2. **Manual:** "Sync Now" button on `GuardScannerPage` when offline badge is visible
3. **On page load:** Check for pending items → attempt flush if online

### Server Reconciliation Endpoint

`POST /api/gate/reconcile` (guard-only, rate-limited)

**Request body:** Array of offline scan entries

**Server behavior for each entry:**
1. Validate guard auth + role
2. Match by `scanAttemptId` — if already reconciled, return idempotent result
3. Attempt normal verification flow (JWT verify or passCode lookup)
4. Look up existing `GateScan` by `scanAttemptId` — update its `reconcileStatus` and `reconciledAt` fields (the only permitted mutation during reconciliation). The original `offlineStatus`, `verdict`, and audit fields are never modified during reconciliation. (Note: `offlineStatus` finalization by the guard before sync is a separate permitted mutation — see GateScan immutability rules above.)
5. Set `reconcileStatus`:
   - `PENDING` — initial value when offline GateScan is created (before reconciliation attempt)
   - `SUCCESS` — pass was valid at `scannedAt` time, state transition applied
   - `FAIL` — pass expired/cancelled/invalid at `scannedAt` time, or state transition impossible (already scanned)
6. If `FAIL` → set `reconcileErrorCode` (e.g., `EXPIRED_AT_SCAN_TIME`, `ALREADY_TRANSITIONED`)

### Warden Review Flow

**PRD Traceability (FR16):** The PRD requires `OFFLINE_REVIEW_REQUIRED` as an invariant status for unresolved offline entries. This is implemented as a **query-derived state**, not a separate field:
- An offline GateScan is considered `OFFLINE_REVIEW_REQUIRED` when: `offlineStatus != null AND reconcileStatus == 'PENDING'`
- This invariant holds until reconciliation sets `reconcileStatus` to `SUCCESS` or `FAIL`
- Failed reconciliations (`reconcileStatus: 'FAIL'`) additionally require explicit warden acknowledgment

- NeedsAttentionWidget shows: `GateScan.countDocuments({ offlineStatus: { $ne: null }, reconcileStatus: 'PENDING' })` as "offline scans pending reconciliation"
- Failed reconciliations (`reconcileStatus: 'FAIL'`) surface as "offline scans needing review"
- Warden can manually acknowledge/dismiss failed reconciliations (mark as reviewed)

### Edge Case: Clock Drift

Guard device clock may differ from server. The `deviceTimestamp` is stored but **server uses its own clock** for `scannedAt` on the GateScan. The `deviceTimestamp` is metadata only (for audit, not logic).

## Minimum Testing Strategy (MVP)

### Required Test Coverage

| Priority | Test Target | Type | What It Validates |
|----------|------------|------|-------------------|
| **P0** | Leave state machine transition map | Unit | Every valid transition succeeds; every invalid transition throws `CONFLICT` |
| **P0** | Complaint state machine transition map | Unit | Every valid transition succeeds; every invalid transition throws `CONFLICT` |
| **P0** | `gate.service.verify()` — atomic update | Service | Concurrent scans don't produce duplicate transitions; idempotency rules hold |
| **P0** | `gate.service.verify()` — denied cases | Service | Expired, cancelled, revoked, already-scanned all return correct result codes |
| **P1** | SLA checker — escalation timing | Worker | Near-breach sends reminder; past-breach escalates priority + notifies warden |
| **P1** | SLA checker — CronLog heartbeat | Worker | Every run writes CronLog entry regardless of outcome |
| **P1** | Auth middleware — token lifecycle | Service | Valid token passes; expired token returns 401; refresh rotation works; revoked jti rejected |
| **P2** | RBAC middleware | Unit | Each role can only access its permitted routes; cross-role access returns 403 |
| **P2** | E2E smoke: login → create leave → approve → scan | E2E | Happy path works end-to-end through the API |
| **P2** | E2E smoke: create complaint → assign → resolve | E2E | Complaint lifecycle works end-to-end |

### Test Infrastructure

- **Framework:** Vitest (single framework for both client + server — Vite-native)
- **Server tests:** In-memory MongoDB via `mongodb-memory-server` (no external DB dependency)
- **E2E tests:** Supertest against Express app instance (API-level, no browser)
- **Test data:** Factory functions in `server/src/test-utils/factories.ts` (not raw JSON fixtures)
- **CI:** GitHub Actions runs `npm test` on every PR — merge blocked if tests fail

### What We Explicitly Skip for MVP

- Visual/screenshot regression tests
- Load/performance testing
- Browser-level E2E (Playwright/Cypress) — API-level E2E covers the critical paths
- 100% coverage targets — focus on state machines + gate scan + SLA cron

## Operational Health Endpoint

`GET /api/admin/health` (warden-only, no rate limit)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "db": { "connected": true, "latencyMs": 12 },
    "lastCronSuccess": "2026-03-02T14:30:00.000Z",
    "cronOverdue": false,
    "offlineScansPending": 3,
    "offlineScansFailed": 0,
    "uptime": 86400
  }
}
```

**Health check logic:**
- `db`: Mongoose `connection.readyState === 1` + a lightweight `db.admin().ping()`
- `lastCronSuccess`: most recent `CronLog` with `status: 'SUCCESS'`
- `cronOverdue`: `true` if `lastCronSuccess` is more than 20 minutes ago (2x the 10-min interval)
- `offlineScansPending`: `GateScan.countDocuments({ offlineStatus: { $ne: null }, reconcileStatus: 'PENDING' })` — offline scans awaiting reconciliation
- `offlineScansFailed`: `GateScan.countDocuments({ offlineStatus: { $ne: null }, reconcileStatus: 'FAIL' })` — offline scans that failed reconciliation

**NeedsAttentionWidget** on `WardenDashboardPage` calls this endpoint with TanStack Query `refetchInterval: 60_000` (1-minute polling). Health data renders in the "System Health" card within the widget.

## Runtime Baseline & Version Pinning

| Runtime | Version | Notes |
|---------|---------|-------|
| Node.js | 20 LTS or 22 LTS | Use `.nvmrc` or `engines` field in root `package.json` |
| MongoDB | 7.x or 8.x | Atlas free tier (M0) for MVP; local via Docker for dev |
| npm | 10.x+ | Ships with Node 20/22 |

**Version pinning rule:** Use **exact versions** (`"express": "5.0.1"`) in `package.json`, not caret ranges (`^5.0.1`). This prevents silent breakage from transitive updates across agents or environments. Run `npm install --save-exact` for all `npm install` commands.

**`.nvmrc` at repo root:**
```
20
```

**`package.json` engines field (root):**
```json
{
  "engines": { "node": ">=20.0.0", "npm": ">=10.0.0" }
}
```

## MVP Scope Exclusions (Do Not Implement)

These features are explicitly deferred. Do not add them, stub them, or create placeholder files for them.

| Excluded Feature | Reason | When to Revisit |
|-----------------|--------|-----------------|
| CSV student import | Seed script covers MVP data setup | Post-MVP when hostel admin needs bulk onboarding |
| WebSockets / real-time notifications | TanStack Query polling is sufficient at MVP scale | When >500 concurrent users or real-time chat is needed |
| Multi-hostel support | Single-hostel locked; simplifies every query | If product expands to multiple hostels |
| Room management UI + Room model | Denormalized on User; seeded | When room assignments need dynamic CRUD |
| Fee editing / payment gateway | Fees are seeded + read-only | When online fee payment is a requirement |
| API versioning (`/v1/`) | Single client, single deployment | If public API or breaking changes needed |
| Redis caching layer | MongoDB handles MVP scale | When query latency exceeds NFR targets |
| Browser-level E2E tests (Playwright) | API-level E2E covers critical paths | When UI regression becomes a real problem |
| Email/SMS notifications | In-app only for MVP | When off-platform notification is needed |
| Internationalization (i18n) | English-only MVP | When deployed to non-English hostels |

**Rule:** If an agent encounters a requirement that maps to this table, it must stop and flag it as out-of-scope rather than implementing it.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible and conflict-free:
- MongoDB 8.x + Mongoose 8.x — native driver bundled, no version mismatch
- Express v5 + cookie-parser + pino-http — all middleware compatible with Express v5 async error handling
- React 19 + React Router DOM v7.13 + TanStack Query v5 — all current stable, no peer-dep conflicts
- Vite v7 + @tailwindcss/vite — CSS-native Tailwind v4.2, no PostCSS config needed
- JWT (jsonwebtoken) + QR (html5-qrcode) — independent signing libs, no overlap
- Cloudinary SDK + multer — multer handles multipart parsing, Cloudinary handles upload (no local ephemeral storage)
- Zod shared between client + server via `shared/` workspace — single validation source of truth

**Pattern Consistency:**
- Naming conventions are uniform: camelCase everywhere (Mongo fields, API payloads, client state), PascalCase components and models
- Explicit `{ collection: 'camelCasePlural' }` on every Mongoose schema prevents default lowercasing
- Controller → Service → Model layering is consistently enforced across all 8 FR domains
- API response wrapper `{ success, data }` / `{ success, error: { code, message } }` used in all endpoints
- State machine transitions use atomic `findOneAndUpdate` consistently (leave + complaint)
- AuditEvent is the single source of truth for business events; pino is operational-only — both share correlationId

**Structure Alignment:**
- npm workspaces (`client/`, `server/`, `shared/`) cleanly separate concerns
- Shared zod schemas + role constants live in `shared/` — imported by both client and server
- Cron worker runs as separate process but shares `models/`, `services/`, `config/` — no code duplication
- Vite dev proxy simulates production same-site deployment — no CORS config drift between dev/prod
- All 8 FR domains map to dedicated route → controller → service chains with no cross-domain imports violating RBAC boundaries

### Requirements Coverage Validation ✅

**Functional Requirements Coverage (43/43):**

| FR Range | Domain | Coverage |
|----------|--------|----------|
| FR1-5 | Identity & Access | ✅ auth routes + RBAC middleware + consent flow (Gap #1 resolved) |
| FR6-11 | Leave & Gate Pass | ✅ leave service + gate service + QR signing |
| FR12-17 | Gate Verification | ✅ guard scanner + verify endpoint + GateScan with offlineStatus + direction audit fields |
| FR18-20 | Override Governance | ✅ override flow in gate service + warden review + audit |
| FR21-27 | Complaint & SLA | ✅ complaint service + SLA cron + state machine |
| FR28-30 | Self-Service Assistant | ✅ assistant routes + FAQ (shared page, all roles) |
| FR31-34 | Dashboards | ✅ role-specific dashboards + health widget + delegation config (Gap #2 resolved) |
| FR35-36 | Notices | ✅ notice CRUD + notification service |
| FR37-40 | Audit & Monitoring | ✅ AuditEvent + CronLog + health widget |
| FR41-43 | State Machines | ✅ atomic findOneAndUpdate transitions in leave + complaint services |

**Non-Functional Requirements Coverage:**
- **Performance:** Guard scanner p95 ≤ 3s end-to-end — lightweight JWT verify + atomic DB update + minimal QR payload
- **Reliability:** 0 missed cron cycles/week — separate worker process + CronLog heartbeat + health widget monitoring
- **Security:** Dual-token JWT in httpOnly cookies + SameSite=Lax + Origin/Referer CSRF + RBAC middleware + separate QR_SECRET
- **Data Retention:** `cronLogs` 90d TTL, `notifications` 180d TTL, `gatePasses` expiresAt+30d buffer. `gateScans`/`overrides` 1yr (no TTL — dispute evidence). `auditEvents` indefinite (legal backbone). Archive to cold storage post-MVP.
- **Offline Resilience:** GateScan model with `offlineStatus` enum (`null` for online | `OFFLINE_PRESENTED` | `OFFLINE_DENY_LOGGED` | `OFFLINE_OVERRIDE`) + guard-side localStorage queue + reconciliation endpoint with `scanAttemptId` idempotency

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical technology choices documented with exact versions (Vite 7.3, React 19, Express 5, Mongoose 8, etc.)
- Every architectural pattern includes concrete code examples (API response format, AppError class, state machine transition, loading pattern)
- Consistency rules are explicit and enforceable (naming table, anti-patterns table, enforcement guidelines)
- Locked decisions in frontmatter prevent re-litigation during implementation

**Structure Completeness:**
- Complete directory tree with every file named and mapped to specific FRs
- All integration points specified (API boundaries, process boundaries, RBAC visibility boundaries)
- Cross-cutting concerns mapped to specific files (auth, RBAC, CSRF, audit, notifications, error handling, SLA, offline)

**Pattern Completeness:**
- 12 conflict points across 5 categories addressed with explicit resolution
- Naming conventions comprehensive: DB collections, API endpoints, components, files, variables, routes
- Communication patterns fully specified: API response format, error format, event naming, state management
- Process patterns complete: error handling (AppError + boundary), loading states (TanStack Query), auth flow (cookie + refresh)

### Gap Analysis Results

**Gap #1 — FR4 Consent Flow (RESOLVED):**
- **Issue:** No UI component for first-login consent acknowledgment
- **Resolution:**
  - Add `ConsentModal.tsx` to `client/src/components/features/auth/`
  - GET `/api/auth/me` returns `hasConsented: boolean` in user payload
  - POST `/api/consents` records consent with timestamp
  - `AuthContext` checks `hasConsented` on login — if false, renders ConsentModal before allowing navigation
  - ConsentModal is a blocking modal (no dismiss, must accept to proceed)

**Gap #2 — Secondary Approver / Leave Delegation Config (RESOLVED):**
- **Issue:** No UI for warden to configure leave delegation settings
- **Resolution:**
  - Add PATCH `/api/admin/delegation` endpoint (warden-only)
  - Add small "Delegation Settings" section on `WardenDashboardPage.tsx` (not a separate page)
  - Settings stored in a `SystemConfig` collection or directly on the Warden's user document (implementation detail)
  - MVP-minimal: just an on/off toggle + secondary approver user selector

**Gap #3 — Missing Client & Server Dependencies (RESOLVED):**
- **Issue:** Install commands from Step 03 were incomplete — missing runtime deps that later steps depend on
- **Resolution — corrected install commands:**

**Client dependencies (corrected):**
```bash
npm -w client install react-router-dom @tanstack/react-query react-hook-form @hookform/resolvers zod fuse.js html5-qrcode
```

**Server dependencies (corrected):**
```bash
npm -w server install express cookie-parser mongoose jsonwebtoken bcryptjs node-cron cloudinary multer express-rate-limit pino pino-http uuid zod
npm -w server install -D typescript tsx @types/node @types/express @types/cookie-parser @types/jsonwebtoken @types/bcryptjs @types/uuid @types/multer pino-pretty
```

**Shared workspace:**
```bash
npm -w shared install zod
npm -w shared install -D typescript
```

**Note:** The stale Step 03 note "zod → server-only" is superseded — zod is shared via the `shared/` workspace and installed in all three workspaces.

### Validation Issues Addressed

All 3 gaps identified during validation have been resolved with user-approved resolutions above. No critical or blocking issues remain.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (43 FRs, 8 domains, 4 roles)
- [x] Scale and complexity assessed (Medium, single-hostel MVP, ~200-500 concurrent)
- [x] Technical constraints identified (low-end Android, ephemeral PaaS storage, same-site cookies)
- [x] Cross-cutting concerns mapped (auth, RBAC, CSRF, audit, notifications, error handling, SLA, offline)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (MERN stack, exact package versions)
- [x] Technology stack fully specified (Vite 7 + React 19 + Express 5 + MongoDB 8 + Mongoose 8)
- [x] Integration patterns defined (Controller → Service → Model, state machine transitions, cron worker)
- [x] Performance considerations addressed (p95 targets, TTL indexes, minimal QR payload, Cloudinary offload)

**✅ Implementation Patterns**
- [x] Naming conventions established (12 conflict points resolved, anti-patterns table)
- [x] Structure patterns defined (feature-grouped client, layered server, shared workspace)
- [x] Communication patterns specified (API response format, event naming, state management)
- [x] Process patterns documented (error handling, loading states, auth flow, offline reconciliation)

**✅ Project Structure**
- [x] Complete directory structure defined (every file named and annotated)
- [x] Component boundaries established (RBAC visibility boundaries, process boundaries)
- [x] Integration points mapped (API flow, cron flow, gate scan flow, SLA flow)
- [x] Requirements to structure mapping complete (FR → route/controller/service/page table)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 43 FRs covered, all gaps resolved, all patterns explicit

**Key Strengths:**
- Every file in the project tree is mapped to specific PRD requirements — no orphan files, no missing coverage
- State machine transitions use atomic DB operations — no race conditions in concurrent gate scans or complaint updates
- Offline-first gate scanning with concrete data model (`offlineStatus` enum + `reconcileStatus` + `scanAttemptId` on GateScan)
- AuditEvent as single source of truth with shared correlationId — clean separation from operational logging
- Same-site deployment assumption locked early — prevents cookie/CSRF bugs from surfacing late
- Cron worker as separate process — cannot block API server under load

**Areas for Future Enhancement:**
- CSV student import (deferred from MVP — seed script covers initial data)
- Room management UI + separate Room collection (denormalized on User for MVP)
- Fee editing capabilities (read-only/seeded in MVP)
- WebSocket real-time notifications (MVP uses polling via TanStack Query refetchInterval)
- Multi-hostel support (single-hostel locked for MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — do not deviate from locked decisions in frontmatter
- Use implementation patterns consistently across all components (naming, API format, error handling, state management)
- Respect project structure and RBAC boundaries — controllers never import models, guards never see complaints
- Refer to this document for all architectural questions — it is the single source of truth
- When in doubt about a pattern, check the anti-patterns table and enforcement guidelines

**First Implementation Priority:**
Risk-first approach — start with the **Gate Scanner spike** (highest-stakes, most constrained path):
1. Scaffold the npm workspace structure (root + client + server + shared)
2. Install all dependencies (corrected commands from Gap #3 resolution)
3. Set up Express server with auth middleware + cookie-parser
4. Implement QR verify endpoint (JWT verify + atomic GateScan creation with direction fields)
5. Build GuardScannerPage with html5-qrcode + VerdictScreen overlay

**Pre-Implementation Blocker: RESOLVED**
~~UX wireframes for the 4 critical screens must be created before full implementation begins.~~
The UX Design Specification (`_bmad-output/planning-artifacts/ux-design-specification.md`) is complete with full dev handoff pack. No remaining blocker.
