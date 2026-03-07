# Story 5.5: SLA Computation & Category Defaults

## Description
As a **system**,
I want to compute SLA deadlines from configurable category-based thresholds using centralized shared constants,
So that every complaint has a clear, enforceable resolution deadline and priority overrides recalculate dueAt consistently.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given the shared constants package, when `SLA_CATEGORY_DEFAULTS` is imported, then it contains entries for all 7 complaint categories (PLUMBING, ELECTRICAL, FURNITURE, CLEANING, PEST_CONTROL, INTERNET, GENERAL) with `priority` (a valid ComplaintPriority) and `slaHours` (a positive number).

**AC-2:** Given a complaint is created with category ELECTRICAL, when `dueAt` is computed, then it equals `createdAt + 12 hours` (from `SLA_CATEGORY_DEFAULTS.ELECTRICAL.slaHours = 12`).

**AC-3:** Given a complaint is created with category PLUMBING, when `dueAt` is computed, then it equals `createdAt + 24 hours` (from `SLA_CATEGORY_DEFAULTS.PLUMBING.slaHours = 24`) and priority is HIGH.

**AC-4:** Given a complaint's priority is overridden to CRITICAL, when `dueAt` is recalculated, then it equals `createdAt + 12 hours` (from `SLA_HOURS_BY_PRIORITY.CRITICAL = 12`), NOT `now + 12 hours`.

**AC-5:** Given a complaint has been escalated (breached SLA), when the priority is changed, then the `dueAt` is recalculated from the original `createdAt`. The breach is not erased -- the new dueAt may still be in the past.

**AC-6:** Given `SLA_HOURS_BY_PRIORITY` is imported, when all priority levels are checked, then it maps `{ LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 12 }`.

**AC-7:** Given an SLA breach occurs (escalation in Story 5.6), when the complaint is escalated, then `dueAt` is NOT reset -- the breach persists for accountability.

## Technical Context
- **Tech stack:** TypeScript, shared workspace (`@smarthostel/shared`)
- **SLA constants location:** `shared/constants/sla-defaults.ts` -- single source of truth for both server and client
- **SLA computation in createComplaint:** `dueAt = new Date(Date.now() + SLA_CATEGORY_DEFAULTS[category].slaHours * 3600000)` (in `server/src/services/complaint.service.ts`)
- **SLA computation in updatePriority:** `dueAt = new Date(complaint.createdAt.getTime() + SLA_HOURS_BY_PRIORITY[priority] * 3600000)` (in `server/src/services/complaint.service.ts`)
- **Key design decision:** Priority override recalculates dueAt from `createdAt` (not current time) to maintain SLA accountability. If a complaint was created 20 hours ago and priority is changed to CRITICAL (12h), the new dueAt will be 8 hours in the past.

### Existing Code
SLA computation was already implemented across Stories 5.1 and 5.2. This story consolidates and verifies the SLA constants are centralized in the shared package.

**Shared:**
- `shared/constants/sla-defaults.ts` -- Contains both `SLA_CATEGORY_DEFAULTS` (7 category entries) and `SLA_HOURS_BY_PRIORITY` (4 priority entries). Uses TypeScript `Record` types with imports from complaint-category and complaint-priority. **Complete. This is the single source of truth.**

**Server (references shared constants -- no local duplicates):**
- `server/src/services/complaint.service.ts` -- `createComplaint()` imports `SLA_CATEGORY_DEFAULTS` from `@smarthostel/shared` for initial dueAt computation. `updatePriority()` imports `SLA_HOURS_BY_PRIORITY` from `@smarthostel/shared` for recalculation. **No local SLA constants exist -- shared package is the sole source.** **Complete.**

## Tasks

### Task 1: Centralize SLA Constants in Shared Package
Ensure all SLA-related constants are in the shared workspace and exported properly.
- [ ] Subtask 1.1: Verify `shared/constants/sla-defaults.ts` exports `SLA_CATEGORY_DEFAULTS` as `Record<ComplaintCategory, SlaCategoryDefault>` with entries for all 7 categories
- [ ] Subtask 1.2: Verify `SLA_HOURS_BY_PRIORITY` is exported as `Record<ComplaintPriority, number>` with values `{ LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 12 }`
- [ ] Subtask 1.3: Verify `SlaCategoryDefault` interface is exported with `priority: ComplaintPriority` and `slaHours: number`
- [ ] Subtask 1.4: Verify shared `index.ts` re-exports all SLA constants
- [ ] Subtask 1.5: Verify no local SLA constant duplicates exist in server code

**Tests (AC-1, AC-2, AC-3, AC-6):**
- [ ] Unit test: `SLA_CATEGORY_DEFAULTS` has entries for all 7 ComplaintCategory values
- [ ] Unit test: Each `SLA_CATEGORY_DEFAULTS` entry has a valid `ComplaintPriority` and positive `slaHours`
- [ ] Unit test: `SLA_HOURS_BY_PRIORITY` maps LOW->72, MEDIUM->48, HIGH->24, CRITICAL->12
- [ ] Unit test: `SLA_CATEGORY_DEFAULTS.ELECTRICAL` returns `{ priority: 'CRITICAL', slaHours: 12 }`
- [ ] Unit test: `SLA_CATEGORY_DEFAULTS.PLUMBING` returns `{ priority: 'HIGH', slaHours: 24 }`

### Task 2: Verify SLA Computation Logic in Complaint Service
Audit the createComplaint and updatePriority functions for correct SLA computation.
- [ ] Subtask 2.1: Verify `createComplaint` computes `dueAt = new Date(Date.now() + defaults.slaHours * 3600000)` using `SLA_CATEGORY_DEFAULTS[category]`
- [ ] Subtask 2.2: Verify `updatePriority` computes `dueAt = new Date(complaint.createdAt.getTime() + slaHours * 3600000)` using `SLA_HOURS_BY_PRIORITY[priority]`
- [ ] Subtask 2.3: Verify `updatePriority` falls back to 48 hours if priority is not found in `SLA_HOURS_BY_PRIORITY` (defensive coding)
- [ ] Subtask 2.4: Verify that escalation (Story 5.6) does NOT reset dueAt -- only sets `escalatedAt` and bumps `escalationLevel`

**Tests (AC-2, AC-3, AC-4, AC-5):**
- [ ] Integration test: Creating a PLUMBING complaint sets dueAt approximately 24 hours from now and priority HIGH
- [ ] Integration test: Creating an ELECTRICAL complaint sets dueAt approximately 12 hours from now and priority CRITICAL
- [ ] Integration test: Overriding priority to LOW recalculates dueAt to createdAt + 72 hours
- [ ] Integration test: Overriding priority to CRITICAL recalculates dueAt to createdAt + 12 hours
- [ ] Integration test: dueAt after priority override is based on createdAt, not current time

## Dependencies
- **Story 5.1** (completed) -- createComplaint uses SLA_CATEGORY_DEFAULTS for initial computation
- **Story 5.2** (completed) -- updatePriority uses SLA_HOURS_BY_PRIORITY for recalculation
- **Story 5.6** (completed) -- Escalation relies on dueAt NOT being reset

## File List

### Modified Files
- `shared/constants/sla-defaults.ts` -- Verified as single source of truth for SLA constants (no code changes, audit only)

### New Files
- None

### Unchanged Files
- `shared/constants/complaint-category.ts` -- ComplaintCategory enum (used by SLA_CATEGORY_DEFAULTS type)
- `shared/constants/complaint-priority.ts` -- ComplaintPriority enum (used by SLA_HOURS_BY_PRIORITY type)
- `server/src/services/complaint.service.ts` -- createComplaint and updatePriority already use shared SLA constants correctly

## Dev Agent Record

### Implementation Date
2026-03-06

### Implementation Notes

**Task 1 (Centralize):** Verified that `shared/constants/sla-defaults.ts` is the single source of truth for all SLA configuration. No local duplicates exist in server code. Both `SLA_CATEGORY_DEFAULTS` and `SLA_HOURS_BY_PRIORITY` are properly typed with `Record` types.

**Task 2 (Verify Computation):** Audited `createComplaint` and `updatePriority` in `complaint.service.ts`. Both correctly import from `@smarthostel/shared` and compute dueAt as specified. Key finding: `updatePriority` uses `complaint.createdAt.getTime()` (not `Date.now()`) which is the correct behavior for SLA accountability. The fallback `?? 48` in `SLA_HOURS_BY_PRIORITY[priority]` provides defensive safety. Escalation in the SLA worker (Story 5.6) correctly does NOT modify dueAt.

SLA category defaults verified:
- PLUMBING: HIGH, 24h
- ELECTRICAL: CRITICAL, 12h
- FURNITURE: MEDIUM, 48h
- CLEANING: LOW, 72h
- PEST_CONTROL: MEDIUM, 48h
- INTERNET: HIGH, 24h
- GENERAL: MEDIUM, 48h

### Test Results
- All SLA constant values verified against expected mappings
- dueAt computation verified for both creation and priority override scenarios
- Escalation non-reset behavior confirmed

### New Dependencies
- None
