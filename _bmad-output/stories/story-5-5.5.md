# Story 5.5: SLA Computation & Category Defaults

## Story

As a **system**,
I want to compute SLA deadlines from configurable category-based thresholds,
So that every complaint has a clear, enforceable resolution deadline.

## Status: Complete

## Acceptance Criteria

**AC1:** Category defaults seeded in SLA_CATEGORY_DEFAULTS (Plumbing: 24h HIGH, Electrical: 12h CRITICAL, etc.).

**AC2:** dueAt computed as createdAt + category SLA threshold on complaint creation.

**AC3:** Priority override recalculates dueAt based on SLA_HOURS_BY_PRIORITY.

**AC4:** Escalation does NOT reset dueAt (breach persists for accountability).

## Tasks

### Task 1: Centralize SLA constants in shared
- SLA_HOURS_BY_PRIORITY exported from shared/constants/sla-defaults.ts
- Server service uses shared constant instead of local duplicate

### Task 2: Verify computation logic
- createComplaint uses SLA_CATEGORY_DEFAULTS for initial dueAt (done in 5.1)
- updatePriority uses SLA_HOURS_BY_PRIORITY for recalculation (done in 5.2)

## Dev Notes
- SLA computation was already implemented in Stories 5.1 and 5.2
- This story consolidates the SLA constants into the shared package
