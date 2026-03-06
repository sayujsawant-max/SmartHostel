# Story 6.1: Student Dashboard

## Story

As a **student**,
I want a dashboard showing my room info, active notices, and quick actions,
So that I have a single place to see everything relevant to me.

## Status: Complete

## Acceptance Criteria

**AC1:** StatusPage shows room info (block/floor/roomNumber) from user profile.

**AC2:** StatusPage shows active leaves as status cards and active complaints with SLA badges.

**AC3:** ActionsPage shows action cards: "Show QR" (conditional), "Report Issue", "Request Leave".

## Tasks

### Task 1: Build ActionsPage with action cards
- Show QR (conditionally active based on having APPROVED pass)
- Report Issue link
- Request Leave link

### Task 2: Add room info header to StatusPage
- Display block/floor/roomNumber from auth context
