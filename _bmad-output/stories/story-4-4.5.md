# Story 4.5: Operational Health & Data Retention

## Story

As a **warden**,
I want to see system health indicators and know that data retention is enforced,
So that I can trust the system is operating correctly and within policy.

## Status: Draft

## Acceptance Criteria

**AC1:** GET /api/admin/health returns db connected, latencyMs, offlineScansPending, offlineScansFailed, uptime.

**AC2:** TTL indexes: notifications auto-delete after 180 days.

**AC3:** GateScans and overrides are NOT auto-deleted (dispute evidence).

**AC4:** AuditEvents are never auto-deleted (indefinite retention).

## Tasks

### Task 1: Create health endpoint
**File:** `server/src/services/health.service.ts`, `server/src/routes/health.routes.ts`
- DB ping with latency measurement
- Offline scans pending/failed counts from GateScan
- Process uptime

### Task 2: Add TTL index to notifications model
- 180 day TTL on createdAt

### Task 3: Verify no TTL on auditEvents, gateScans, overrides
