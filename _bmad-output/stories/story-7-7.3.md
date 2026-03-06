# Story 7.3: Contextual Next-Action Suggestions

## Story

As a **student**,
I want the system to suggest what I can do next after checking status,
So that I know my options without memorizing the system.

## Status: Complete

## Acceptance Criteria

**AC1:** Leave cards show contextual hints: PENDING ("Waiting for approval"), APPROVED ("Your pass is ready" + link to QR), REJECTED ("Request a New Leave" link), SCANNED_OUT ("Return before pass expires").

**AC2:** Complaint cards show contextual hints: OPEN ("Waiting for assignment"), ASSIGNED ("Work will begin soon"), IN_PROGRESS ("You'll be notified when resolved"), RESOLVED ("Check resolution notes").

**AC3:** Empty states suggest next actions: "Request Leave" and "Report an Issue" with direct links.

**AC4:** Maintenance FAQ page built with accordion + Fuse.js search, same pattern as student FAQ.

## Tasks

### Task 1: Add next-action hint helpers for leaves and complaints
### Task 2: Render contextual hints on leave and complaint cards
### Task 3: Update empty states with action suggestions
### Task 4: Build Maintenance FaqPage with accordion + Fuse.js
