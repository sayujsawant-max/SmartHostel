# SmartHostel — Architecture

## Overview

SmartHostel is a full-stack hostel management platform (MERN + Tailwind CSS) for mid-sized college hostels (~300 residents). It replaces informal processes with verifiable, time-bound workflows across 4 roles: Student, Warden/Admin, Guard, and Maintenance Staff.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite 7, Tailwind CSS v4, TanStack Query v5, React Router v7 |
| Backend | Express 5 + TypeScript, Mongoose 9, zod 4, pino |
| Database | MongoDB |
| Auth | Dual JWT (access + refresh) in httpOnly cookies, bcryptjs, CSRF via Origin/Referer check |
| QR Signing | Separate `QR_SECRET` (independent of `JWT_SECRET`) |
| File Storage | Cloudinary (complaint photos) |
| Monorepo | npm workspaces (`client/`, `server/`, `shared/`) |

## Locked Architectural Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | MVP-first, single-hostel | No multi-tenancy; simplifies every query |
| 2 | SPA React, no SSR | Vite + react-ts; no Next.js/Remix |
| 3 | Scanner + offline fallback first-class | Guard scanner is highest-stakes path |
| 4 | Cron/SLA worker as separate process | Same codebase (`server/src/worker/`), separate entry point — can't block API |
| 5 | Same-site cookies (`SameSite=Lax`) | Access + refresh in httpOnly cookies |
| 6 | CSRF = Origin/Referer allowlist | No CSRF tokens needed |
| 7 | `QR_SECRET` separate from `JWT_SECRET` | Auth key rotation won't invalidate active gate passes |
| 8 | Controller -> Service -> Model enforced | Controllers never import models directly |
| 9 | AuditEvent = single source of truth | pino = operational only; both share `correlationId` |
| 10 | Refresh token revocation via DB-stored `jti` | Password reset/force-logout deletes all stored jtis |
| 11 | camelCase everywhere | Mongo fields, API payloads, client state |
| 12 | Public registration for students | `POST /api/auth/register` creates STUDENT accounts |
| 13 | Room model with classification | hostelGender, roomType, acType; public browsing via `GET /api/rooms` |

## Project Structure

```
smarthostel/
├── client/                 # React SPA (Vite)
│   └── src/
│       ├── components/     # UI components (layout/, features/, domain/)
│       ├── pages/          # Route-level pages grouped by role
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API client (apiFetch wrapper)
│       ├── context/        # AuthContext
│       └── utils/          # Helpers
├── server/                 # Express API
│   └── src/
│       ├── routes/         # Route definitions
│       ├── controllers/    # Request handling -> call service -> format response
│       ├── services/       # Business logic, state machines, SLA computation
│       ├── models/         # Mongoose schemas
│       ├── middleware/     # Auth, RBAC, CSRF, rate-limit, error-handler
│       ├── worker/         # Cron/SLA worker (separate entry point)
│       ├── config/         # db.ts, env.ts
│       └── utils/          # Helpers (AppError, logger, auth-cookies)
├── shared/                 # Shared types, enums, constants (Role, status enums)
├── docs/                   # Architecture & UX docs
├── scripts/                # Story linter, traceability
└── _bmad-output/           # BMAD planning artifacts, stories, reviews
```

## Authentication & Security

- **Dual JWT tokens**: access (short-lived) + refresh (long-lived) in httpOnly cookies
- **Refresh token rotation**: every refresh issues new jti, old jti removed from DB
- **RBAC**: `requireRole()` middleware + query-level data filtering per role
- **CSRF**: Origin/Referer header validation on POST/PATCH/DELETE
- **Rate limiting**: passCode (5/min/guard), login (5 failures -> lockout)
- **QR tokens**: JWT-signed with separate secret, payload = `{ leaveRequestId, jti, exp }`

## API Conventions

- REST with `/api/` prefix, ~30+ endpoints
- Response format: `{ success, data, correlationId }` / `{ success, error: { code, message }, correlationId }`
- Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500)
- Validation: zod schemas (shared between client/server via `shared/`)
- Dates: ISO 8601, server-generated timestamps only

## Data Architecture

**Core Collections (15):**
users, leaves, gatePasses, gateScans, overrides, complaints, complaintEvents, notifications, faqEntries, cronLogs, auditEvents, rooms, fees, consents, notices

**Key patterns:**
- Strict Mongoose schemas with `{ timestamps: true }`
- TTL indexes: cronLogs (90d), notifications (180d), gatePasses (expiresAt + 30d)
- Gate scans and overrides: 1-year retention (dispute evidence)
- Audit events: indefinite, never auto-delete

## Process Model

- **API Server**: Express app handling all HTTP requests
- **Cron Worker**: Separate process (`server/src/worker/index.ts`) running SLA checks every 10 minutes — reminders, escalation, CronLog entries
- **Dev**: `concurrently` runs both client (Vite HMR) and server (`tsx --watch`)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Server files | kebab-case | `leave.controller.ts` |
| React components | PascalCase | `StatusPage.tsx` |
| Mongoose models | PascalCase singular | `User`, `GatePass` |
| DB collections | camelCase plural (explicit) | `gatePasses`, `gateScans` |
| API fields | camelCase | `studentId`, `dueAt` |
| Enums | UPPER_SNAKE_CASE | `PENDING`, `SCANNED_OUT` |
| Env vars | UPPER_SNAKE_CASE | `JWT_SECRET`, `QR_SECRET` |

## Full Architecture Document

The complete architecture decision document with all implementation patterns, conflict resolutions, and data model specifications is available at `_bmad-output/planning-artifacts/architecture.md`.
