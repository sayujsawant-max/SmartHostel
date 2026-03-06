# Epic 1: Project Foundation & Authentication

Users can log in with credentials, receive role-appropriate access, and navigate to their role-specific dashboard. System enforces RBAC and records consent.

### Story 1.1: Project Scaffolding & Dev Environment

As a **developer**,
I want the project scaffolded with npm workspaces (client/server/shared), all dependencies installed, and dev scripts working,
So that I have a working development environment to build features on.

**Acceptance Criteria:**

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

### Story 1.2: User Model, Auth API & JWT Token Lifecycle

As a **user**,
I want to log in with my credentials and receive a secure session,
So that I can access the system with my assigned role.

**Acceptance Criteria:**

**Given** a valid user exists in the database (seeded)
**When** I POST to `/api/auth/login` with correct email and password
**Then** the server returns `{ success: true, data: { user: { id, name, email, role } } }` with httpOnly `accessToken` and `refreshToken` cookies set (SameSite=Lax, Secure in prod)

**Given** I am logged in with a valid access token
**When** I GET `/api/auth/me`
**Then** the server returns my user profile including role, hasConsented, and room info (block/floor/roomNumber)

**Given** my access token has expired
**When** any API request returns 401
**Then** the client attempts POST `/api/auth/refresh`, receives new access + rotated refresh tokens, and retries the original request

**Given** my refresh token's jti has been revoked (password reset / force-logout)
**When** I attempt to refresh
**Then** the server returns 401 and both cookies are cleared

**Given** a user attempts login
**When** they fail 5 consecutive times
**Then** the account is temporarily locked and returns `RATE_LIMITED` error with retryAfterMs

**Given** any authenticated request
**When** Origin/Referer header does not match the allowlist on POST/PATCH/DELETE
**Then** the CSRF middleware rejects with 403

### Story 1.3: RBAC Middleware & Role-Based Data Visibility

As a **system administrator**,
I want the system to enforce role-based access control on every protected endpoint,
So that users can only access data and actions appropriate to their role.

**Acceptance Criteria:**

**Given** routes are protected with `requireRole()` middleware
**When** a STUDENT attempts to access a warden-only endpoint (e.g., `/api/admin/dashboard`)
**Then** the server returns 403 FORBIDDEN

**Given** a GUARD is authenticated
**When** they attempt to access complaint endpoints
**Then** the server returns 403 (guards never see complaints per RBAC boundary)

**Given** a STUDENT queries their own data
**When** the query executes
**Then** all queries include `{ studentId: req.user._id }` filter — students never see other students' data

**Given** a WARDEN is authenticated
**When** they query any data endpoint
**Then** no visibility restrictions are applied (full access per visibility matrix)

**Given** a MAINTENANCE user queries complaints
**When** the query executes
**Then** only complaints assigned to them are returned

### Story 1.4: Seed Script & Demo Data

As a **developer**,
I want a seed script that populates the database with realistic demo data,
So that all roles can be tested immediately after setup.

**Acceptance Criteria:**

**Given** a connected MongoDB instance
**When** I run `npm run seed`
**Then** the database is populated with: sample users (at least 1 per role: student, warden, guard, maintenance), each with block/floor/roomNumber, hashed passwords

**Given** the seed script has run
**When** I attempt to log in as any seeded user
**Then** authentication succeeds and returns the correct role

**Given** the seed script
**When** I inspect the created data
**Then** FAQ entries (20+), category defaults with SLA thresholds, and fee records (read-only) are seeded

**Given** the seed script runs on an already-seeded database
**When** duplicate data would be created
**Then** the script handles idempotency (skips existing or clears and re-seeds)

### Story 1.5: Frontend Auth Flow & Role-Specific Shells

As a **user**,
I want to log in via a login page and be routed to my role-specific dashboard,
So that I see only the interface relevant to my role.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I visit any page
**Then** I am redirected to the LoginPage

**Given** I am on the LoginPage
**When** I submit valid credentials
**Then** AuthContext stores my user/role, and I am redirected to my role-specific dashboard (/student/status, /warden/dashboard, /guard/scan, /maintenance/tasks)

**Given** I am a STUDENT
**When** I am logged in
**Then** I see StudentShell with BottomTabBar (Status/Actions/FAQ) and a top bar

**Given** I am a WARDEN
**When** I am logged in
**Then** I see WardenShell with sidebar at lg+ and hamburger menu below lg

**Given** I am a GUARD
**When** I am logged in
**Then** I see GuardShell with no nav chrome (full-screen scanner placeholder)

**Given** I am a MAINTENANCE user
**When** I am logged in
**Then** I see MaintenanceShell with BottomTabBar (Tasks/History/FAQ)

**Given** I am authenticated
**When** I click logout
**Then** both cookies are cleared, AuthContext resets, and I am redirected to LoginPage

### Story 1.6: Consent Flow & First-Login Experience

As a **first-time user**,
I want to see a privacy notice and acknowledge consent before using the system,
So that the system has my documented agreement for data collection.

**Acceptance Criteria:**

**Given** I log in for the first time (hasConsented = false)
**When** AuthContext checks consent status
**Then** a blocking ConsentModal is rendered — I cannot navigate to any other page

**Given** the ConsentModal is displayed
**When** I read the privacy notice and click "I Accept"
**Then** POST `/api/consents` records my consent with userId, version, and timestamp, and the modal dismisses

**Given** I have already consented (hasConsented = true)
**When** I log in
**Then** no ConsentModal appears and I proceed directly to my dashboard

**Given** the ConsentModal is displayed
**When** I attempt to dismiss it (Escape key, click outside)
**Then** the modal does not close — acceptance is mandatory

### Story 1.7: Account Management (Warden)

As a **warden/admin**,
I want to create user accounts, disable accounts, and reset credentials,
So that I can manage hostel users for the system.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I POST to `/api/admin/users` with name, email, role, password, block, floor, roomNumber
**Then** a new user account is created with hashed password and the specified role

**Given** I am a WARDEN
**When** I PATCH `/api/admin/users/:id/disable`
**Then** the user account is disabled and all their refresh token jtis are deleted (sessions invalidated)

**Given** I am a WARDEN
**When** I POST `/api/admin/users/:id/reset-password` with a new password
**Then** the password is updated, all refresh token jtis are deleted, and all sessions are invalidated

**Given** I am NOT a WARDEN
**When** I attempt any account management endpoint
**Then** the server returns 403 FORBIDDEN

---
