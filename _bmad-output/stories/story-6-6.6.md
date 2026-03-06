# Story 6.6: Notice Broadcasting (Warden)

## Story

As a **warden**,
I want to broadcast notices to all students or filtered by block/floor,
So that I can communicate important information to the hostel.

## Status: Complete

## Acceptance Criteria

**AC1:** Notice model with authorId, title, content, target (ALL/BLOCK/FLOOR), targetBlock, targetFloor, isActive.

**AC2:** POST /api/notices creates notice and generates NOTICE_PUBLISHED notifications for targeted students.

**AC3:** GET /api/notices returns all notices for warden management view.

**AC4:** GET /api/notices/my-notices returns notices visible to the current student based on block/floor.

**AC5:** PATCH /api/notices/:id/deactivate allows warden to deactivate a notice.

**AC6:** Warden NoticesPage with create form (title, content, target selector) and notice list with deactivate action.

**AC7:** Student StatusPage shows active notices targeted to them.

## Tasks

### Task 1: Create Notice model with target filtering
### Task 2: Create notice service with broadcast notification generation
### Task 3: Create notice controller and routes
### Task 4: Mount notice routes in app.ts
### Task 5: Build warden NoticesPage with create form and management
### Task 6: Add notices section to student StatusPage
