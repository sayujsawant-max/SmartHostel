# Epic 2: Leave Management & Gate Pass Generation

Students can request leaves, wardens can approve/reject them, approved leaves generate QR-code gate passes, and students can view/cancel their leaves.

### Story 2.1: Leave Request Creation (Student)

As a **student**,
I want to create a leave request with type, date range, and reason,
So that I can get approval to leave the hostel.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/actions/request-leave
**Then** I see a form with: leave type (Day Outing / Overnight), date picker for start/end, reason template dropdown + optional custom text

**Given** I fill in the leave form
**When** I submit with valid data (type, dates, reason)
**Then** POST `/api/leaves` creates a leave with status PENDING, and I see a success confirmation

**Given** I submit a leave request
**When** the dates are invalid (end before start, past dates)
**Then** zod validation rejects with VALIDATION_ERROR and field-level errors

**Given** I submit a leave request
**When** I already have an active leave (PENDING or APPROVED) overlapping the date range
**Then** the server returns CONFLICT error

**Given** I am on the LeaveRequestPage
**When** I select a reason template (e.g., "Family visit", "Medical appointment")
**Then** the reason field is prefilled and I can optionally customize it

### Story 2.2: Leave Approval & Rejection (Warden)

As a **warden**,
I want to view pending leave requests and approve or reject them,
So that I can control student movement with documented decisions.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I navigate to the pending leaves queue
**Then** I see all PENDING leave requests with student name, type, dates, reason, and submission time

**Given** I view a pending leave request
**When** I click Approve
**Then** PATCH `/api/leaves/:id/approve` transitions the leave to APPROVED via atomic findOneAndUpdate, and a notification is created for the student (LEAVE_APPROVED)

**Given** I view a pending leave request
**When** I click Reject with an optional reason
**Then** PATCH `/api/leaves/:id/reject` transitions to REJECTED, and a notification is created for the student (LEAVE_REJECTED)

**Given** the leave is no longer PENDING (e.g., student cancelled it)
**When** I attempt to approve or reject
**Then** the atomic update fails and returns CONFLICT with the current state

### Story 2.3: Gate Pass & QR Code Generation

As a **student**,
I want an approved leave to automatically generate a verifiable QR-code gate pass,
So that I can present it at the gate for quick verification.

**Acceptance Criteria:**

**Given** a leave transitions to APPROVED
**When** the approval is processed
**Then** a GatePass document is created with: qrToken (JWT signed with QR_SECRET containing leaveRequestId + jti + exp), passCode (short numeric fallback), status, expiresAt matching the leave end time

**Given** the QR token
**When** decoded
**Then** the payload contains only `{ leaveRequestId, jti, exp }` — no studentId (minimal payload per architecture spec)

**Given** QR_SECRET is different from JWT_SECRET
**When** auth JWT signing key is rotated
**Then** existing gate passes remain valid (keys are independent)

**Given** the gate pass expiresAt
**When** the leave end time passes
**Then** the pass is expired and any verification returns EXPIRED

### Story 2.4: Student Leave History & Active QR Display

As a **student**,
I want to view my leave history and display my active QR pass,
So that I can track my leave status and present my pass at the gate.

**Acceptance Criteria:**

**Given** I am a STUDENT
**When** I navigate to /student/status
**Then** I see my active and recent leaves as StatusCardV2 components with status badges (PENDING, APPROVED, REJECTED, etc.)

**Given** I have an APPROVED leave with an active gate pass
**When** I navigate to /student/actions/show-qr
**Then** I see the QR code at minimum 250x250px (or 60% screen width), passCode below as fallback, leave window + return time, and a brightness hint ("Turn brightness to max")

**Given** I am on the ShowQRPage
**When** Wake Lock API is available
**Then** the screen stays awake to prevent sleep at the gate

**Given** I have no active APPROVED pass
**When** I try to navigate to /student/actions/show-qr
**Then** I see a message "No active pass" and a link to request a leave

**Given** my leave history
**When** I view completed/rejected/cancelled leaves
**Then** each shows the appropriate status, timestamps, and reason (if rejected)

### Story 2.5: Leave Cancellation (Student)

As a **student**,
I want to cancel an approved leave before I exit the gate,
So that I can change my plans without leaving an orphan pass.

**Acceptance Criteria:**

**Given** I have an APPROVED leave (not yet SCANNED_OUT)
**When** I tap Cancel on the leave detail
**Then** PATCH `/api/leaves/:id/cancel` transitions to CANCELLED via atomic findOneAndUpdate, and the associated gate pass is invalidated

**Given** my leave is SCANNED_OUT (I've already exited)
**When** I attempt to cancel
**Then** the server returns CONFLICT: "Cannot cancel — you've already exited. Contact your warden for corrections."

**Given** my leave is PENDING
**When** I cancel it
**Then** the leave transitions to CANCELLED (no gate pass exists to invalidate)

### Story 2.6: Post-Exit Pass Correction (Warden)

As a **warden**,
I want to correct post-exit pass records with a documented reason,
So that I can handle edge cases like wrong scans or administrative errors.

**Acceptance Criteria:**

**Given** I am a WARDEN viewing a leave that is SCANNED_OUT or SCANNED_IN
**When** I initiate a correction with a required reason
**Then** PATCH `/api/leaves/:id/correct` transitions the leave to CORRECTED, the reason is stored, and an AuditEvent is created (PASS_CORRECTED with actorId, reason, correlationId)

**Given** a correction is made
**When** the correction is saved
**Then** the original state is preserved in the audit trail (the correction is a new event, never an overwrite)

**Given** I am NOT a WARDEN
**When** I attempt to correct a leave
**Then** the server returns 403 FORBIDDEN

---
