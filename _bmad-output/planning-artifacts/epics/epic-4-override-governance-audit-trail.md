# Epic 4: Override Governance & Audit Trail

Guards can override gate denials with documented reasons, wardens are immediately notified, and wardens can review override records with spike tracking. Full audit trail operational.

### Story 4.1: Guard Override Flow

As a **guard**,
I want to override a gate denial with a documented reason and note,
So that I can allow a student through in emergencies while maintaining accountability.

**Acceptance Criteria:**

**Given** I see a DENY or OFFLINE verdict on the scanner
**When** I tap [Override]
**Then** a bottom sheet slides up with: reason category selector (Medical Emergency / Family Emergency / Staff Instruction / Other), note field prefilled based on reason, and Confirm button

**Given** I select "Medical Emergency"
**When** the note field appears
**Then** it is prefilled with "Medical emergency — allowed {EXIT/ENTRY} at {time}" and I can edit it (minimum 5 characters required)

**Given** I complete the override form
**When** I tap Confirm
**Then** POST `/api/gate/override` creates an Override document with: reason, note, guardId, method (MANUAL_OVERRIDE or OFFLINE_OVERRIDE), correlationId, and an Idempotency-Key header prevents duplicate submissions

**Given** the override is saved
**When** the response returns
**Then** VerdictScreen shows green ALLOW with proof line "Override — {reason}", auto-returns to scanning, and an AuditEvent (SCAN_OVERRIDE_GRANTED) is written

**Given** I am NOT a GUARD
**When** the Override button would appear
**Then** it is never rendered — override is guard-only

### Story 4.2: Override Notification & Warden Review

As a **warden**,
I want to be immediately notified when a guard override occurs and review it with full context,
So that I can maintain accountability and identify patterns.

**Acceptance Criteria:**

**Given** a guard override is recorded
**When** the override is saved
**Then** a notification (OVERRIDE_ALERT) is created for the warden immediately

**Given** I am a WARDEN on the dashboard
**When** I view the "Overrides Pending Review" section in NeedsAttentionWidget
**Then** I see override cards with: student name, scan time, reason category, guard note, guard name, method (MANUAL_OVERRIDE / OFFLINE_OVERRIDE), correlationId

**Given** I view an override review card
**When** I click [Mark Reviewed]
**Then** PATCH `/api/gate/overrides/:id/review` adds warden attribution (reviewedBy, reviewedAt), removes it from the pending queue, and writes an AuditEvent

**Given** the override review queue
**When** there are no pending overrides
**Then** the widget shows "No overrides pending review"

### Story 4.3: Override Spike Tracking

As a **warden**,
I want the system to track override rates and surface spikes,
So that I can identify guard behavior patterns requiring attention.

**Acceptance Criteria:**

**Given** more than 5 overrides occur in a day OR more than 3 in an hour
**When** the threshold is crossed
**Then** the health widget displays "Override rate above threshold ({N} today / {N} this hour)"

**Given** the warden dashboard
**When** override rates are normal (below thresholds)
**Then** no spike alert is shown

**Given** override records
**When** the warden queries gate logs
**Then** override counts are aggregated per guard, per day, for pattern visibility

### Story 4.4: Audit Event System & Correlation Tracking

As a **warden**,
I want all sensitive actions logged with attribution, timestamps, and correlation IDs,
So that I can trace any action end-to-end for accountability and dispute resolution.

**Acceptance Criteria:**

**Given** any auditable action occurs (from the canonical event list: PASS_REQUESTED, SCAN_VERIFIED, COMPLAINT_CREATED, etc.)
**When** the service processes the action
**Then** an AuditEvent is written first (entityType, entityId, eventType, actorId, actorRole, timestamp, metadata, correlationId), then a pino log with matching correlationId + eventType

**Given** a request enters the system
**When** correlation-id.middleware processes it
**Then** X-Correlation-Id is extracted from the request header (or a UUID is generated), attached to req.correlationId, and echoed in the response header

**Given** audit events
**When** they are stored in the auditEvents collection
**Then** they are append-only (no updates, no deletes), have no TTL (indefinite retention), and corrections are new events (never overwrites)

**Given** pino structured logs
**When** they reference an audit event
**Then** they include the same correlationId and eventType fields for cross-referencing

### Story 4.5: Operational Health & Data Retention

As a **warden**,
I want to see system health indicators and know that data retention is enforced,
So that I can trust the system is operating correctly and within policy.

**Acceptance Criteria:**

**Given** I am a WARDEN
**When** I GET `/api/admin/health`
**Then** the response includes: db connected + latencyMs, lastCronSuccess timestamp, cronOverdue flag (true if >20min since last success), offlineScansPending count, offlineScansFailed count, uptime

**Given** TTL indexes are configured
**When** documents age past their retention window
**Then** cronLogs are auto-deleted after 90 days, notifications after 180 days, gatePasses after expiresAt + 30 days

**Given** gateScans and overrides
**When** they reach 1 year old
**Then** they are NOT auto-deleted (dispute evidence — architecture extends PRD's 90-180d default to 1 year because gate scans must survive complaint resolution windows; no TTL in MVP; archive to cold storage post-MVP)

**Given** auditEvents
**When** they exist in the collection
**Then** they are never auto-deleted (legal backbone, indefinite retention)

**Given** the consent model
**When** users have consented
**Then** consent records (userId, version, timestamp) are maintained in the consents collection per FR40

---
