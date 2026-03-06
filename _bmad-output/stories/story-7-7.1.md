# Story 7.1: Status Shortcuts & Structured Card Responses

## Story

As a **student**,
I want to check my complaint, leave, and fee status via quick-action shortcuts,
So that I can get instant answers without visiting the warden's office.

## Status: Complete

## Acceptance Criteria

**AC1:** AssistantShortcuts grid shows quick-action tiles: Active Complaints, Active Leaves, Pending Fees, Ask a Question.

**AC2:** Tapping complaint/leave shortcuts scrolls to the relevant section on the status page.

**AC3:** Fee Status toggle shows read-only fee records with type, amount, semester, due date, and status badge.

**AC4:** "Ask a Question" links to the FAQ page.

**AC5:** GET /api/assistant/faq returns all active FAQ entries.

**AC6:** GET /api/assistant/fees returns student's fee records.

## Tasks

### Task 1: Create assistant service with FAQ and fee queries
### Task 2: Create assistant controller and routes
### Task 3: Mount assistant routes in app.ts
### Task 4: Add AssistantShortcuts and fee display to StatusPage
