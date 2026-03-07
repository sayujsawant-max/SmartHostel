# Story X.Y: [Title]

## Description
As a **[ROLE]**,
I want [capability],
So that [business value].

## Status: [Draft | In Progress | Complete]

## Acceptance Criteria

<!-- RULES:
  - One scenario per AC (never bundle multiple Given/When/Then in a single AC)
  - Every AC MUST have all three: Given, When, Then
  - Include negative paths (invalid input, unauthorized access, missing data)
  - Include edge cases (empty lists, boundary values, concurrent access)
  - Use exact status codes (400, 401, 403, 404, 409) and error code strings
  - Use exact UI text strings in quotes where applicable
  - BANNED words in ACs: appropriate, correct, proper, user-friendly, quick,
    reasonable, adequate, sufficient, nice, good, relevant, meaningful
  - Use WARDEN_ADMIN (never WARDEN) for role references
  - Never write "Done in Story X.Y" inside an AC — put cross-refs in Dependencies
-->

**AC-1:** Given [precondition], when [action], then [observable outcome]

**AC-2:** Given [precondition], when [action], then [observable outcome]

## Technical Context
- **Tech stack:** [e.g., Express 5 + TypeScript, React 19, Mongoose 8, Tailwind CSS]
- **Architecture rules:** [e.g., Controllers never import models — they call services]
- **Naming conventions:** [e.g., kebab-case server files, camelCase JSON fields]
- **Key implementation details:** [algorithms, patterns, specific libraries]

### Existing Code
<!-- File-by-file audit of code that exists BEFORE this story is implemented.
     For each file: path, what it contains, what's missing/needs changing. -->

**Server:**
- `server/src/path/to/file.ts` — [description]. **[Status: Exists and complete | Needs X added]**

**Client:**
- `client/src/path/to/file.tsx` — [description]. **[Status: Does not exist | Exists and complete]**

**Shared:**
- `shared/path/to/file.ts` — [description]. **[Status]**

## Tasks

<!-- RULES:
  - 3-8 subtasks per task
  - Every task has a **Tests:** section with specific test descriptions
  - Subtasks use checkbox format: - [ ] Subtask N.M: description
-->

### Task 1: [Title]
[Brief description of what this task accomplishes.]
- [ ] Subtask 1.1: [specific implementation detail]
- [ ] Subtask 1.2: [specific implementation detail]
- [ ] Subtask 1.3: [specific implementation detail]

**Tests:**
- [ ] [Unit/Integration] test: [specific test description with expected input/output]
- [ ] [Unit/Integration] test: [specific test description]

### Task 2: [Title]
- [ ] Subtask 2.1: [specific implementation detail]

**Tests:**
- [ ] [Unit/Integration] test: [specific test description]

## Domain Checklists

<!-- Check all that apply to this story and verify each item is covered in ACs/Tasks -->

### Auth & RBAC
- [ ] All endpoints have `authMiddleware` + `requireRole()` applied
- [ ] 401 returned for unauthenticated requests
- [ ] 403 returned for unauthorized role access
- [ ] Student data scoped by `studentId: req.user._id`

### Audit Trail
- [ ] AuditEvent created for all state-changing actions
- [ ] correlationId propagated from request to audit event
- [ ] pino log emitted with matching correlationId and eventType

### Concurrency
- [ ] Atomic state transitions use `findOneAndUpdate` with status precondition
- [ ] Race conditions handled (duplicate submissions, concurrent updates)

### Error Handling
- [ ] All error responses use `AppError` with specific ErrorCode
- [ ] Validation errors return 400 with field information
- [ ] Conflict errors return 409 with current state information
- [ ] Not-found errors return 404

### Data & Dates
- [ ] Dates stored as UTC in MongoDB
- [ ] Date formatting uses consistent locale on client
- [ ] TTL indexes documented if applicable

## Dependencies
- **Story X.Y** (completed) — [what this story depends on from that story]
- [External requirements: env vars, packages, running services]

## File List

### Modified Files
- `path/to/file.ts` — [brief description of changes]

### New Files
- `path/to/file.ts` — [brief description of what this file contains]

### Unchanged Files (audit only)
- `path/to/file.ts` — [why this file was audited but not changed]

## Dev Agent Record

### Implementation Date
[YYYY-MM-DD]

### Implementation Notes
<!-- Per-task summary of what was actually done, decisions made, gotchas encountered -->

**Task 1 ([Title]):** [Summary of implementation, key decisions, deviations from plan]

**Task 2 ([Title]):** [Summary]

### Test Results
- [Summary of test execution: N tests passed across M files, 0 failures]
- [Any notable test coverage gaps or manual verification notes]

### New Dependencies
- [package-name] ([dev]dependency, [workspace]) — [purpose]
- None
