# SmartHostel

A full-stack hostel management platform built for ~300 residents with role-based access for students, wardens, guards, and maintenance staff.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4, React Router 7, TanStack Query 5 |
| **Backend** | Express 5, Node.js 20, Mongoose 9, Zod 4 |
| **Database** | MongoDB 7 |
| **Auth** | Dual JWT (access + refresh) in httpOnly cookies, bcryptjs, QR token signing |
| **Testing** | Vitest, Testing Library, Supertest, Playwright (E2E), mongodb-memory-server |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI (server build + unit tests) |

## Features

- **Student Portal** — view status dashboard, request leaves, show QR gate passes, file maintenance complaints, FAQ chatbot
- **Warden Admin** — manage students/rooms/users, review complaints, post notices, approve/reject leaves, system settings
- **Guard Scanner** — QR code scanning for gate entry/exit, offline fallback with passCode input, direction override
- **Maintenance Staff** — view assigned tasks with SLA deadlines, task history, role-specific FAQ
- **Security** — rate limiting, RBAC middleware, CSRF protection, helmet headers, cookie-based auth with token rotation
- **Notifications** — polling notification bell (30s interval) with unread counts
- **Public** — room browsing with availability and fee information, student self-registration

## Project Structure

```
smarthostel/
├── client/          # React SPA (Vite)
│   └── src/
│       ├── components/   # Shared + feature components
│       ├── pages/        # Route pages (student/, warden/, guard/, maintenance/)
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API client with auto-refresh
│       └── context/      # Auth context
├── server/          # Express API
│   └── src/
│       ├── routes/       # 12 route modules
│       ├── controllers/  # Request handlers
│       ├── models/       # Mongoose schemas (15 collections)
│       ├── middleware/    # Auth, RBAC, rate limiting, validation
│       └── worker/       # Cron jobs (SLA checks)
├── shared/          # Shared types, enums, zod schemas
├── e2e/             # Playwright E2E tests
├── Dockerfile       # Multi-stage production build
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js >= 20
- MongoDB 7 (local or Docker)

### Setup

```bash
# Clone and install
git clone https://github.com/sayujsawant-max/SmartHostel.git
cd SmartHostel
npm install

# Configure environment
# Unix/macOS:
cp .env.example .env
# Windows (PowerShell):
# Copy-Item .env.example .env

# Edit .env with your MongoDB URI and secrets

# Seed test users
npm run seed:users

# Start development servers (client + server)
npm run dev

# Optionally start the cron worker for SLA deadline checks
npm run dev:worker
```

The client runs on `http://localhost:5173` and the server on `http://localhost:5000`.

### Test Users

| Role | Email | Password |
|---|---|---|
| Student | student@smarthostel.dev | password123 |
| Warden | warden@smarthostel.dev | password123 |
| Guard | guard@smarthostel.dev | password123 |
| Maintenance | maintenance@smarthostel.dev | password123 |

## Docker Deployment

```bash
# Build and start all services (MongoDB + API + Worker)
docker compose up --build -d

# Access the app at http://localhost:5000
```

The production build serves the React SPA from Express with proper SPA fallback routing.

## Testing

```bash
# Unit & integration tests (client + server)
npm test

# E2E tests (requires MongoDB running + seed data)
# First time: install browser
npx playwright install chromium
npm run test:e2e
```

| Suite | Tests | What's Covered |
|---|---|---|
| Server | 138 | Auth, RBAC, routes, middleware, models, controllers |
| Client | 40 | LoginPage, RegisterPage, RoleRoute, ProtectedRoute, Chatbot, API service |
| E2E | 17 | Login (all roles), logout, registration, complaints, role access control |

## API Overview

All endpoints are under `/api/`. Auth routes are at `/api/auth/*`.

| Module | Key Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| Leaves | `GET /api/leaves`, `POST /api/leaves`, `PATCH /api/leaves/:id/approve` |
| Gate | `POST /api/gate/validate` (QR + passCode scan) |
| Complaints | `GET /api/complaints`, `POST /api/complaints`, `PATCH /api/complaints/:id` |
| Rooms | `GET /api/rooms` (public), `POST /api/rooms`, `PATCH /api/rooms/:id` |
| Notices | `GET /api/notices`, `POST /api/notices` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |
| Admin | User management, system settings |
| Health | `GET /api/health` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server in development |
| `npm run dev:worker` | Start cron worker (SLA checks, separate process) |
| `npm run build` | Build shared, client, and server |
| `npm test` | Run all unit/integration tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run seed:users` | Seed development users |
| `npm run lint` | Lint client and server |

## Architecture Decisions

- **Monorepo** with npm workspaces — shared types/schemas between client and server
- **Dual JWT auth** — short-lived access token + rotating refresh token in httpOnly cookies
- **QR gate passes** — signed tokens with separate secret, verified by guard scanner
- **SLA engine** — cron worker (separate process) checks complaint deadlines every 10 minutes
- **Code splitting** — React.lazy() route-level splitting (main bundle: 319 KB, down from 801 KB)
- **Offline support** — guard scanner queues scans locally when network is unavailable
