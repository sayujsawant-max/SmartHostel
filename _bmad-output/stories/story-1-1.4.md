# Story 1.4: Seed Script & Demo Data

## Description
As a **developer**,
I want a seed script that populates the database with realistic demo data,
So that all roles can be tested immediately after setup.

## Acceptance Criteria

**AC-1:** Given a connected MongoDB instance, when I run `npm run seed`, then the database is populated with: sample users (at least 1 per role: student, warden, guard, maintenance), each with block/floor/roomNumber, hashed passwords

**AC-2:** Given the seed script has run, when I attempt to log in as any seeded user, then authentication succeeds and returns the correct role

**AC-3:** Given the seed script, when I inspect the created data, then FAQ entries (20+), category defaults with SLA thresholds, and fee records (read-only) are seeded

**AC-4:** Given the seed script runs on an already-seeded database, when duplicate data would be created, then the script handles idempotency (skips existing or clears and re-seeds)

## Technical Context
- **Tech stack:** Express 5 + TypeScript, Mongoose 9, bcryptjs
- **Existing code:** `server/src/scripts/seed-users.ts` already seeds 4 users (1 per role) with idempotent upsert. The `seed` npm script points to `server/src/scripts/seed.ts` which does not yet exist.
- **Architecture spec:** Seed data lives in `server/src/scripts/seed-data/` as JSON files: `faqs.json`, `fees.json`, `category-defaults.json`
- **Models needed:** `FaqEntry` (collection: `faqEntries`), `Fee` (collection: `fees`), `CategoryDefault` (collection: `categoryDefaults`)
- **Architecture rules:**
  - camelCase everywhere (Mongo fields, API payloads)
  - Explicit `{ collection, timestamps, strict }` on every schema
  - Model names: PascalCase singular
  - File names: kebab-case `.ts`
  - Fees are read-only in MVP (seeded, no PATCH endpoint)
  - FAQ is shared across all roles (question, answer, category, keywords for Fuse.js)
  - Category defaults store per-category SLA thresholds + default priorities
- **Idempotency:** Use upsert pattern (findOneAndUpdate with upsert) for all seed data
- **npm run seed:** Must work from root via `npm -w server run seed`

### Existing Code
- `server/src/scripts/seed-users.ts` -- Seeds 4 users with upsert. This script is the foundation.
- `server/src/models/user.model.ts` -- User model with roles, room fields, timestamps
- `server/package.json` -- Already has `seed` script pointing to `src/scripts/seed.ts` and `seed:users` pointing to `src/scripts/seed-users.ts`
- `package.json` (root) -- Already has `seed` and `seed:users` scripts delegating to server workspace
- `shared/constants/roles.ts` -- Role enum: STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE

## Tasks

### Task 1: Create FaqEntry Model
Create `server/src/models/faq-entry.model.ts` with Mongoose schema.
- [ ] Subtask 1.1: Define `IFaqEntry` interface with fields: `question` (string, required), `answer` (string, required), `category` (string, required), `keywords` (string[], for Fuse.js search), `isActive` (boolean, default true)
- [ ] Subtask 1.2: Create schema with `{ collection: 'faqEntries', timestamps: true, strict: true }`
- [ ] Subtask 1.3: Add index on `{ category: 1, isActive: 1 }`
- [ ] Subtask 1.4: Export `FaqEntry` model as `mongoose.model<IFaqEntry>('FaqEntry', faqEntrySchema)`

### Task 2: Create Fee Model
Create `server/src/models/fee.model.ts` with Mongoose schema for read-only fee records.
- [ ] Subtask 2.1: Define `IFee` interface with fields: `studentId` (ObjectId, ref User), `feeType` (string, required -- e.g., HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE), `amount` (number, required), `currency` (string, default 'INR'), `dueDate` (Date, required), `status` (string: PAID, UNPAID, OVERDUE), `semester` (string), `academicYear` (string)
- [ ] Subtask 2.2: Create schema with `{ collection: 'fees', timestamps: true, strict: true }`
- [ ] Subtask 2.3: Add index on `{ studentId: 1, status: 1 }`
- [ ] Subtask 2.4: Export `Fee` model

### Task 3: Create CategoryDefault Model
Create `server/src/models/category-default.model.ts` for complaint category SLA configuration.
- [ ] Subtask 3.1: Define `ICategoryDefault` interface with fields: `category` (string, unique -- e.g., PLUMBING, ELECTRICAL, CARPENTRY, CLEANING, GENERAL, PEST_CONTROL, INTERNET, OTHER), `defaultPriority` (string: HIGH, MEDIUM, LOW, CRITICAL), `slaHours` (number -- hours until breach), `description` (string)
- [ ] Subtask 3.2: Create schema with `{ collection: 'categoryDefaults', timestamps: true, strict: true }`
- [ ] Subtask 3.3: Add unique index on `{ category: 1 }`
- [ ] Subtask 3.4: Export `CategoryDefault` model

### Task 4: Create Seed Data JSON Files
Create JSON files in `server/src/scripts/seed-data/`.
- [ ] Subtask 4.1: Create `faqs.json` with 20+ FAQ entries covering categories: general, leaves, gate-pass, complaints, fees, maintenance, hostel-rules
- [ ] Subtask 4.2: Create `category-defaults.json` with 8 complaint categories: PLUMBING (24h, HIGH), ELECTRICAL (12h, CRITICAL), CARPENTRY (48h, MEDIUM), CLEANING (24h, MEDIUM), GENERAL (48h, LOW), PEST_CONTROL (36h, HIGH), INTERNET (12h, HIGH), OTHER (48h, LOW)
- [ ] Subtask 4.3: Create `fees.json` with sample fee records (hostel fee, mess fee, maintenance fee) for demo student

### Task 5: Create Main Seed Script
Create `server/src/scripts/seed.ts` that orchestrates all seeding.
- [ ] Subtask 5.1: Import and call user seeding logic (reuse from seed-users.ts pattern)
- [ ] Subtask 5.2: Seed FAQ entries from faqs.json using upsert on `question` field
- [ ] Subtask 5.3: Seed category defaults from category-defaults.json using upsert on `category` field
- [ ] Subtask 5.4: Seed fee records from fees.json using upsert on `{ studentId, feeType, semester }`
- [ ] Subtask 5.5: Add summary output showing counts of created/updated records
- [ ] Subtask 5.6: Ensure idempotency -- running twice produces same result with no duplicates

### Task 6: Verify npm Scripts
- [ ] Subtask 6.1: Verify `npm run seed` from root delegates to server workspace seed.ts
- [ ] Subtask 6.2: Verify `npm run seed:users` still works independently

## Dev Agent Record

### Implementation Summary

**Task 1 (FaqEntry Model):** Created `server/src/models/faq-entry.model.ts` with `IFaqEntry` interface (question, answer, category, keywords[], isActive). Schema uses `{ collection: 'faqEntries', timestamps: true, strict: true }` with index on `{ category: 1, isActive: 1 }`.

**Task 2 (Fee Model):** Created `server/src/models/fee.model.ts` with `IFee` interface (studentId ref, feeType, amount, currency, dueDate, status, semester, academicYear). Schema uses `{ collection: 'fees', timestamps: true, strict: true }` with index on `{ studentId: 1, status: 1 }`.

**Task 3 (CategoryDefault Model):** Created `server/src/models/category-default.model.ts` with `ICategoryDefault` interface (category unique, defaultPriority, slaHours, description). Schema uses `{ collection: 'categoryDefaults', timestamps: true, strict: true }` with unique index on `{ category: 1 }`.

**Task 4 (Seed Data JSON):** Created 3 JSON files in `server/src/scripts/seed-data/`:
- `faqs.json` -- 22 FAQ entries across 7 categories (general, leaves, gate-pass, complaints, fees, maintenance, hostel-rules)
- `category-defaults.json` -- 8 complaint categories with SLA hours and default priorities
- `fees.json` -- 3 fee record templates for the demo student

**Task 5 (Main Seed Script):** Created `server/src/scripts/seed.ts` that:
- Connects to MongoDB using MONGODB_URI from .env
- Seeds users (reuses seed-users.ts logic inline)
- Seeds FAQ entries with upsert on `question`
- Seeds category defaults with upsert on `category`
- Seeds fee records with upsert on `{ studentId, feeType, semester }`
- Prints summary with created/updated counts
- Fully idempotent -- safe to run multiple times

**Task 6 (npm scripts):** Verified existing `seed` and `seed:users` scripts in both root and server `package.json` are correctly configured.

### New Dependencies
None -- uses existing Mongoose, bcryptjs, and dotenv.

### File List
- `server/src/models/faq-entry.model.ts` (new)
- `server/src/models/fee.model.ts` (new)
- `server/src/models/category-default.model.ts` (new)
- `server/src/scripts/seed.ts` (new)
- `server/src/scripts/seed-data/faqs.json` (new)
- `server/src/scripts/seed-data/category-defaults.json` (new)
- `server/src/scripts/seed-data/fees.json` (new)
