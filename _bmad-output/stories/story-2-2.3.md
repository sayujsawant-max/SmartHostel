# Story 2.3: Gate Pass & QR Code Generation

## Story

As a **student**,
I want an approved leave to automatically generate a verifiable QR-code gate pass,
So that I can present it at the gate for quick verification.

## Status: Draft

## Acceptance Criteria

**AC1:** Given a leave transitions to APPROVED, then a GatePass is created with qrToken (JWT signed with QR_SECRET), passCode (short numeric), status ACTIVE, expiresAt matching leave end time.

**AC2:** Given the QR token when decoded, the payload contains only `{ leaveRequestId, jti, exp }` — no studentId.

**AC3:** Given QR_SECRET is different from JWT_SECRET, auth key rotation does not affect existing gate passes.

**AC4:** Given the gate pass expiresAt, when the leave end time passes, the pass is expired.

## Tasks

### Task 1: Create GatePass Model
**File:** `server/src/models/gate-pass.model.ts`
- Collection: `gatePasses`
- Fields: leaveId, studentId, qrToken, passCode, jti, status (ACTIVE/USED/EXPIRED/CANCELLED), expiresAt, lastGateState

### Task 2: Create Gate Pass Service
**File:** `server/src/services/gate-pass.service.ts`
- `createGatePass(leave)` — generate JWT with QR_SECRET, 6-digit passCode, create GatePass doc

### Task 3: Integrate into leave.service.ts approve flow
- After atomic approve transition, call createGatePass

### Task 4: Add GatePass status constants (shared)

## Dev Notes
- QR token: `jwt.sign({ leaveRequestId, jti }, QR_SECRET, { expiresIn })` — no studentId in payload
- passCode: 6-digit random numeric string
- GatePass status: ACTIVE, USED, EXPIRED, CANCELLED
- TTL: expiresAt + 30 days buffer per architecture
