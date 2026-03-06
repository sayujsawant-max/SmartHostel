# Story 7.2: FAQ Search with Fuzzy Matching

## Story

As a **user** (any role),
I want to search hostel FAQs with fuzzy text matching,
So that I can find answers to common questions without asking staff.

## Status: Complete

## Acceptance Criteria

**AC1:** FAQ page fetches entries from GET /api/assistant/faq and displays them in accordion layout grouped by category.

**AC2:** Client-side Fuse.js fuzzy search filters results by question, answer, and keywords with threshold 0.4.

**AC3:** No-results state shows "No matching answer found. Try rephrasing or contact your warden."

**AC4:** FAQ answers that reference specific actions include contextual links (Request Leave, Report Issue, etc.).

## Tasks

### Task 1: Build FaqPage with accordion UI and category grouping
### Task 2: Integrate Fuse.js for client-side fuzzy search
### Task 3: Add contextual action links based on answer content
