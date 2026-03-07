# Story 1.4: Seed Script & Demo Data

## Description
As a **developer**,
I want a seed script that populates the database with realistic demo data,
So that all roles can be tested immediately after setup.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given a connected MongoDB instance, when I run `npm run seed`, then the database is populated with sample users (at least 1 per role: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE), with the STUDENT user having block, floor, and roomNumber fields set, all users having `isActive: true` and `hasConsented: true`, and all passwords stored as bcrypt hashes

**AC-2:** Given the seed script has run, when I attempt to log in as any seeded user (e.g., `student@smarthostel.dev` / `password123`), then authentication succeeds and returns the expected role

**AC-3:** Given the seed script has run, when I inspect the database, then FAQ entries (20+) exist across multiple categories, category defaults (8 complaint categories with SLA thresholds) exist, and fee records (3 types for demo student) are seeded

**AC-4:** Given the seed script runs on an already-seeded database, when duplicate data would be created, then the script handles idempotency via upsert (no duplicates, existing records updated)

**AC-5:** Given MongoDB is unreachable, when I run `npm run seed`, then the script exits with a non-zero exit code and an error message

**AC-6:** Given the seed script completes, when I read the console output, then a summary shows counts of created/updated records for each data type (users, FAQs, categories, fees)

**AC-7:** Given the seed data JSON files, when I inspect `faqs.json`, then every entry has `question`, `answer`, `category`, and `keywords` fields suitable for Fuse.js search

**AC-8:** Given the seed data JSON files, when I inspect `category-defaults.json`, then all 8 complaint categories are present with specified SLA hours: PLUMBING (24h), ELECTRICAL (12h), CARPENTRY (48h), CLEANING (24h), GENERAL (48h), PEST_CONTROL (36h), INTERNET (12h), OTHER (48h)

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 9, bcryptjs, dotenv
- **Architecture spec:** Seed data lives in `server/src/scripts/seed-data/` as JSON files: `faqs.json`, `fees.json`, `category-defaults.json`
- **Models:** `FaqEntry` (collection: `faqEntries`), `Fee` (collection: `fees`), `CategoryDefault` (collection: `categoryDefaults`), `User` (collection: `users`)
- **Architecture rules:**
  - camelCase everywhere (Mongo fields, API payloads)
  - Explicit `{ collection, timestamps, strict }` on every Mongoose schema
  - Model names: PascalCase singular
  - File names: kebab-case `.ts`
  - Fees are read-only in MVP (seeded, no PATCH endpoint)
  - FAQ is shared across all roles (question, answer, category, keywords for Fuse.js)
  - Category defaults store per-category SLA thresholds + default priorities
- **Idempotency:** Use upsert pattern (`findOneAndUpdate` with `upsert: true`) for all seed data
- **npm run seed:** Works from root via `npm -w server run seed`

### Existing Code
- `server/src/scripts/seed-users.ts` -- Standalone user seed script. Seeds 4 users (Alice Student with room A-201, Bob Warden, Charlie Guard, Diana Maintenance) via `findOneAndUpdate` with upsert. All users get password `password123` (hashed with bcrypt, 10 rounds). Sets `hasConsented: true`, `isActive: true`. Sets `$setOnInsert` for `refreshTokenJtis`, `failedLoginAttempts`, `lockedUntil`.
- `server/src/models/user.model.ts` -- User model with roles (STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE), room fields (block, floor, roomNumber), auth fields (passwordHash, refreshTokenJtis, failedLoginAttempts, lockedUntil), hasConsented, isActive. Schema uses `{ collection: 'users', timestamps: true, strict: true }`.
- `server/package.json` -- Already has `seed` script (`tsx -r tsconfig-paths/register src/scripts/seed.ts`) and `seed:users` script (`tsx -r tsconfig-paths/register src/scripts/seed-users.ts`).
- `package.json` (root) -- Already has `seed` and `seed:users` scripts delegating to server workspace via `npm -w server run seed`.
- `shared/constants/roles.ts` -- Role const object: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE.

## Tasks

### Task 1: Create FaqEntry Model
Create `server/src/models/faq-entry.model.ts` with Mongoose schema.
- [ ] Subtask 1.1: Define `IFaqEntry` interface extending `Document` with fields: `question` (string, required, trimmed), `answer` (string, required, trimmed), `category` (string, required, trimmed), `keywords` (string[], default []), `isActive` (boolean, default true), `createdAt` (Date), `updatedAt` (Date)
- [ ] Subtask 1.2: Create schema with `{ collection: 'faqEntries', timestamps: true, strict: true }`
- [ ] Subtask 1.3: Add compound index on `{ category: 1, isActive: 1 }` for efficient filtered queries
- [ ] Subtask 1.4: Export `FaqEntry` model as `mongoose.model<IFaqEntry>('FaqEntry', faqEntrySchema)`

**Tests (AC-3, AC-7):**
- [ ] Verify `FaqEntry` model can be imported and used to create documents
- [ ] Verify schema rejects documents missing required fields (question, answer, category)
- [ ] Verify `isActive` defaults to `true` when not provided
- [ ] Verify `keywords` defaults to empty array when not provided
- [ ] Verify `timestamps` produces `createdAt` and `updatedAt` fields
- [ ] Verify collection name is `faqEntries`

### Task 2: Create Fee Model
Create `server/src/models/fee.model.ts` with Mongoose schema for read-only fee records.
- [ ] Subtask 2.1: Define `IFee` interface extending `Document` with fields: `studentId` (Types.ObjectId, ref User), `feeType` (string, required, enum: HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE), `amount` (number, required), `currency` (string, default 'INR'), `dueDate` (Date, required), `status` (string, required, enum: PAID, UNPAID, OVERDUE), `semester` (string, required), `academicYear` (string, required)
- [ ] Subtask 2.2: Create schema with `{ collection: 'fees', timestamps: true, strict: true }`
- [ ] Subtask 2.3: Add compound index on `{ studentId: 1, status: 1 }` for efficient student fee queries
- [ ] Subtask 2.4: Export `Fee` model

**Tests (AC-3):**
- [ ] Verify `Fee` model can be imported and used to create documents
- [ ] Verify schema rejects documents missing required fields (studentId, feeType, amount, dueDate, status, semester, academicYear)
- [ ] Verify `feeType` enum validation rejects invalid values
- [ ] Verify `status` enum validation rejects invalid values
- [ ] Verify `currency` defaults to 'INR' when not provided
- [ ] Verify collection name is `fees`

### Task 3: Create CategoryDefault Model
Create `server/src/models/category-default.model.ts` for complaint category SLA configuration.
- [ ] Subtask 3.1: Define `ICategoryDefault` interface extending `Document` with fields: `category` (string, required, unique, enum: PLUMBING, ELECTRICAL, CARPENTRY, CLEANING, GENERAL, PEST_CONTROL, INTERNET, OTHER), `defaultPriority` (string, required, enum: HIGH, MEDIUM, LOW, CRITICAL), `slaHours` (number, required), `description` (string, required, trimmed)
- [ ] Subtask 3.2: Create schema with `{ collection: 'categoryDefaults', timestamps: true, strict: true }`
- [ ] Subtask 3.3: Add unique index on `{ category: 1 }` to enforce one config per category
- [ ] Subtask 3.4: Export `CategoryDefault` model

**Tests (AC-3, AC-8):**
- [ ] Verify `CategoryDefault` model can be imported and used to create documents
- [ ] Verify schema rejects documents missing required fields
- [ ] Verify `category` enum validation rejects invalid values
- [ ] Verify `defaultPriority` enum validation rejects invalid values
- [ ] Verify unique constraint on `category` prevents duplicates
- [ ] Verify collection name is `categoryDefaults`

### Task 4: Create Seed Data JSON Files
Create JSON files in `server/src/scripts/seed-data/`.
- [ ] Subtask 4.1: Create `faqs.json` with 20+ FAQ entries covering categories: general, leaves, gate-pass, complaints, fees, maintenance, hostel-rules. Each entry has `question`, `answer`, `category`, `keywords` (array of strings for Fuse.js search)
- [ ] Subtask 4.2: Create `category-defaults.json` with 8 complaint categories and their SLA configuration: PLUMBING (24h, HIGH), ELECTRICAL (12h, CRITICAL), CARPENTRY (48h, MEDIUM), CLEANING (24h, MEDIUM), GENERAL (48h, LOW), PEST_CONTROL (36h, HIGH), INTERNET (12h, HIGH), OTHER (48h, LOW)
- [ ] Subtask 4.3: Create `fees.json` with 3 sample fee records for demo student: HOSTEL_FEE (45000 INR, UNPAID), MESS_FEE (18000 INR, PAID), MAINTENANCE_FEE (5000 INR, OVERDUE)

**Tests (AC-3, AC-7, AC-8):**
- [ ] Verify `faqs.json` contains at least 20 entries
- [ ] Verify every FAQ entry has `question`, `answer`, `category`, and `keywords` fields
- [ ] Verify `category-defaults.json` contains exactly 8 categories
- [ ] Verify all SLA hours match specification (ELECTRICAL=12, PLUMBING=24, CLEANING=24, PEST_CONTROL=36, CARPENTRY=48, GENERAL=48, INTERNET=12, OTHER=48)
- [ ] Verify `fees.json` contains 3 fee records with HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE types
- [ ] Verify all JSON files are valid JSON (parseable without errors)

### Task 5: Create Main Seed Script
Create `server/src/scripts/seed.ts` that orchestrates all seeding.
- [ ] Subtask 5.1: Connect to MongoDB using `MONGODB_URI` from `.env` (via dotenv). Exit with error if `MONGODB_URI` is not set
- [ ] Subtask 5.2: Seed users -- hash passwords with bcrypt (10 rounds), upsert by email. 4 users: Alice Student (with block/floor/roomNumber), Bob Warden, Charlie Guard, Diana Maintenance
- [ ] Subtask 5.3: Seed FAQ entries from `faqs.json` using `findOneAndUpdate` with upsert on `question` field
- [ ] Subtask 5.4: Seed category defaults from `category-defaults.json` using `findOneAndUpdate` with upsert on `category` field
- [ ] Subtask 5.5: Seed fee records from `fees.json` using `findOneAndUpdate` with upsert on `{ studentId, feeType, semester }` compound key. Look up student user by email to get `studentId`
- [ ] Subtask 5.6: Print summary output showing counts of created/updated records for each data type
- [ ] Subtask 5.7: Disconnect from MongoDB and exit cleanly. On error, log the error and exit with code 1

**Tests (AC-1, AC-2, AC-4, AC-5, AC-6):**
- [ ] Verify seed script connects to MongoDB and seeds all data types
- [ ] Verify running seed twice produces the same result (idempotent -- no duplicates)
- [ ] Verify seed script logs created/updated counts for users, FAQs, categories, and fees
- [ ] Verify seed script exits with error when MONGODB_URI is not set
- [ ] Verify seeded users can authenticate via login endpoint
- [ ] Verify fee records are linked to the correct student user (by studentId)

### Task 6: Verify npm Scripts
- [ ] Subtask 6.1: Verify `npm run seed` from root delegates to server workspace `seed.ts`
- [ ] Subtask 6.2: Verify `npm run seed:users` still works independently for user-only seeding

**Tests (AC-1, AC-6):**
- [ ] Verify `npm run seed` executes `server/src/scripts/seed.ts` via tsx
- [ ] Verify `npm run seed:users` executes `server/src/scripts/seed-users.ts` via tsx
- [ ] Verify both scripts complete without errors on a fresh MongoDB instance

## Dependencies
- **Story 1.1** (completed) -- project scaffolding, npm workspaces, shared workspace, Express app
- **Story 1.2** (completed) -- User model with auth fields (passwordHash, refreshTokenJtis, failedLoginAttempts, lockedUntil), auth service login flow for verifying seeded credentials
- Requires MongoDB running locally (or via `MONGODB_URI` env var)
- Requires `.env` file with `MONGODB_URI` set

## File List

### New Files
- `server/src/models/faq-entry.model.ts` -- FaqEntry Mongoose model (question, answer, category, keywords, isActive). Schema: `{ collection: 'faqEntries', timestamps: true, strict: true }`. Index: `{ category: 1, isActive: 1 }`
- `server/src/models/fee.model.ts` -- Fee Mongoose model (studentId ref, feeType enum, amount, currency, dueDate, status enum, semester, academicYear). Schema: `{ collection: 'fees', timestamps: true, strict: true }`. Index: `{ studentId: 1, status: 1 }`
- `server/src/models/category-default.model.ts` -- CategoryDefault Mongoose model (category unique enum, defaultPriority enum, slaHours, description). Schema: `{ collection: 'categoryDefaults', timestamps: true, strict: true }`. Unique index: `{ category: 1 }`
- `server/src/scripts/seed.ts` -- Main seed orchestrator. Connects to MongoDB, seeds users (4), FAQ entries (22), category defaults (8), fee records (3). Idempotent via upsert. Prints summary counts
- `server/src/scripts/seed-data/faqs.json` -- 22 FAQ entries across 7 categories (general, leaves, gate-pass, complaints, fees, maintenance, hostel-rules) with Fuse.js-compatible keywords
- `server/src/scripts/seed-data/category-defaults.json` -- 8 complaint categories with SLA hours and default priorities
- `server/src/scripts/seed-data/fees.json` -- 3 fee record templates (HOSTEL_FEE 45000, MESS_FEE 18000, MAINTENANCE_FEE 5000) for demo student

### Modified Files
None -- all models and scripts are new files. Existing `package.json` scripts were already configured in Story 1.1/1.2.

### Unchanged Files
- `server/src/scripts/seed-users.ts` -- Standalone user seed script (still works independently via `npm run seed:users`)
- `server/src/models/user.model.ts` -- User model already has all required fields (no changes needed)
- `server/package.json` -- Seed scripts already configured (`seed` and `seed:users`)
- `package.json` (root) -- Seed scripts already configured
- `shared/constants/roles.ts` -- Role values already correct

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (FaqEntry Model):** Created `server/src/models/faq-entry.model.ts` with `IFaqEntry` interface extending Document (question, answer, category, keywords[], isActive). Schema uses `{ collection: 'faqEntries', timestamps: true, strict: true }`. All string fields use `trim: true`. Added compound index on `{ category: 1, isActive: 1 }`.

**Task 2 (Fee Model):** Created `server/src/models/fee.model.ts` with `IFee` interface extending Document (studentId ref User, feeType enum [HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE], amount, currency default 'INR', dueDate, status enum [PAID, UNPAID, OVERDUE], semester, academicYear). Schema uses `{ collection: 'fees', timestamps: true, strict: true }`. Added compound index on `{ studentId: 1, status: 1 }`.

**Task 3 (CategoryDefault Model):** Created `server/src/models/category-default.model.ts` with `ICategoryDefault` interface extending Document (category unique enum of 8 values, defaultPriority enum [HIGH, MEDIUM, LOW, CRITICAL], slaHours, description). Schema uses `{ collection: 'categoryDefaults', timestamps: true, strict: true }`. Added unique index on `{ category: 1 }`.

**Task 4 (Seed Data JSON):** Created 3 JSON files in `server/src/scripts/seed-data/`:
- `faqs.json` -- 22 FAQ entries across 7 categories with question/answer/category/keywords
- `category-defaults.json` -- 8 complaint categories matching spec exactly (PLUMBING 24h HIGH, ELECTRICAL 12h CRITICAL, CARPENTRY 48h MEDIUM, CLEANING 24h MEDIUM, GENERAL 48h LOW, PEST_CONTROL 36h HIGH, INTERNET 12h HIGH, OTHER 48h LOW)
- `fees.json` -- 3 fee records (HOSTEL_FEE 45000 UNPAID, MESS_FEE 18000 PAID, MAINTENANCE_FEE 5000 OVERDUE) for Spring 2026 semester

**Task 5 (Main Seed Script):** Created `server/src/scripts/seed.ts` that:
- Loads `.env` via dotenv, validates MONGODB_URI exists
- Connects to MongoDB, runs 4 seed phases sequentially
- Seeds users with bcrypt-hashed passwords (10 rounds), upsert by email
- Seeds FAQ entries with upsert on `question` field
- Seeds category defaults with upsert on `category` field
- Seeds fee records with upsert on `{ studentId, feeType, semester }`, looks up student by email first
- Detects new vs updated via `createdAt === updatedAt` comparison
- Prints per-phase and total summary counts
- Disconnects on completion; catches errors with exit code 1

**Task 6 (npm scripts):** Verified `npm run seed` from root delegates to `npm -w server run seed` which runs `tsx -r tsconfig-paths/register src/scripts/seed.ts`. Verified `npm run seed:users` still works independently.

### Test Results
- Seed script runs successfully against local MongoDB
- Running seed twice produces identical results (idempotent -- no duplicates)
- All 4 seeded users authenticate successfully via `/api/auth/login`
- Fee records correctly linked to student user by ObjectId
- Summary output shows accurate created/updated counts

### New Dependencies
None -- uses existing Mongoose, bcryptjs, and dotenv.
