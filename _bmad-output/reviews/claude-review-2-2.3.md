# Code Review — Story 2.3

## Summary
- Files reviewed: 5
- Critical: 0
- Major: 0
- Minor: 1

## Findings

### 1. [MINOR] qrToken stored in GatePass document
**File:** server/src/models/gate-pass.model.ts
**Issue:** The full JWT qrToken is stored in the database. This is large (~200 bytes) and could be regenerated from stored jti + leaveId. However, storing it simplifies the ShowQR flow (no need to re-sign).
**Fix:** Accept as-is. Storage trade-off is acceptable for MVP simplicity.

## Acceptance Criteria Verification
- [x] AC1: GatePass created on approve with qrToken, passCode, ACTIVE status, expiresAt = leave endDate
- [x] AC2: QR token payload is `{ leaveRequestId, jti, exp }` only — no studentId
- [x] AC3: QR_SECRET (env.QR_SECRET) is separate from JWT_SECRET — independent rotation
- [x] AC4: expiresAt set to leave endDate — JWT exp also set accordingly

## Overall Assessment
PASS — All 4 ACs verified. Clean implementation.
