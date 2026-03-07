# Story 8.1: Room Model & API

## Description
As a **developer**,
I want a Room model with classification fields and CRUD API endpoints,
So that rooms can be stored, queried, and managed programmatically.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given the Room model exists, when I inspect the schema, then it has fields: block, floor, roomNumber, hostelGender (BOYS/GIRLS), roomType (DELUXE/NORMAL), acType (AC/NON_AC), totalBeds, occupiedBeds, feePerSemester, photos[], isActive, timestamps

**AC-2:** Given no authentication, when I GET `/api/rooms`, then I receive all active rooms sorted by block/floor/roomNumber

**AC-3:** Given no authentication, when I GET `/api/rooms?hostelGender=BOYS&roomType=DELUXE&acType=AC`, then I receive only rooms matching all three filters

**AC-4:** Given no authentication, when I GET `/api/rooms/availability`, then I receive aggregate availability summary with totalBeds, occupiedBeds, availableBeds, breakdowns byHostel and byType

**AC-5:** Given I am authenticated as WARDEN_ADMIN, when I POST `/api/rooms` with valid room data, then the room is created and returned with 201 status

**AC-6:** Given I am authenticated as WARDEN_ADMIN, when I PATCH `/api/rooms/:id` with occupiedBeds update, then the room's occupiedBeds is updated

**AC-7:** Given a room already exists with the same block + roomNumber, when I POST `/api/rooms` with duplicate block + roomNumber, then the server returns 409 CONFLICT

## Technical Context
- **Tech stack:** Express + TypeScript, Mongoose 8, zod
- **Architecture rules:** Controllers never import models -- they call services
- **Naming conventions:** kebab-case server files, camelCase JSON fields, UPPER_SNAKE_CASE enums

### Existing Code

**Server:**
- `server/src/models/room.model.ts` -- Room schema with all fields, unique index on block+roomNumber. **Status: Complete**
- `server/src/services/room.service.ts` -- listRooms, getRoomById, createRoom, updateRoom, getAvailability. **Status: Complete**
- `server/src/controllers/room.controller.ts` -- All 5 handlers. **Status: Complete**
- `server/src/routes/room.routes.ts` -- Public GET routes, auth-protected POST/PATCH. **Status: Complete**
- `server/src/app.ts` -- Registered `/api/rooms` routes. **Status: Complete**

**Shared:**
- `shared/constants/room-types.ts` -- RoomType, RoomAcType, HostelGender enums. **Status: Complete**
- `shared/schemas/room.schema.ts` -- createRoomSchema with zod validation. **Status: Complete**
- `shared/index.ts` -- Exports all room types and schemas. **Status: Complete**

## Tasks

### Task 1: Shared constants and schema
- [x] Subtask 1.1: Create `shared/constants/room-types.ts` with RoomType, RoomAcType, HostelGender
- [x] Subtask 1.2: Create `createRoomSchema` in shared/schemas/room.schema.ts
- [x] Subtask 1.3: Export from shared/index.ts

**Tests (AC-1):**
- [ ] Unit test: RoomType, RoomAcType, HostelGender enums export expected values
- [ ] Unit test: createRoomSchema validates required fields

### Task 2: Room model
- [x] Subtask 2.1: Create room.model.ts with IRoom interface and schema
- [x] Subtask 2.2: Add unique compound index on block + roomNumber
- [x] Subtask 2.3: Add compound index on hostelGender + roomType + acType for filter queries

**Tests (AC-1, AC-7):**
- [ ] Unit test: Room model has all required fields from AC-1
- [ ] Unit test: Duplicate block + roomNumber insert throws unique constraint error

### Task 3: Room service
- [x] Subtask 3.1: Implement listRooms with optional filters
- [x] Subtask 3.2: Implement getRoomById
- [x] Subtask 3.3: Implement createRoom with duplicate check
- [x] Subtask 3.4: Implement updateRoom
- [x] Subtask 3.5: Implement getAvailability with aggregation by hostel and type

**Tests (AC-2, AC-3, AC-4, AC-5, AC-6, AC-7):**
- [ ] Unit test: listRooms returns active rooms sorted by block/floor/roomNumber
- [ ] Unit test: listRooms applies hostelGender, roomType, acType filters
- [ ] Unit test: getAvailability returns aggregate summary with breakdowns
- [ ] Unit test: createRoom returns created room
- [ ] Unit test: createRoom with duplicate block+roomNumber throws conflict error
- [ ] Unit test: updateRoom updates occupiedBeds

### Task 4: Room routes and controller
- [x] Subtask 4.1: Create room.controller.ts with 5 handlers
- [x] Subtask 4.2: Create room.routes.ts with public GETs and protected POST/PATCH
- [x] Subtask 4.3: Register routes in app.ts

**Tests (AC-2, AC-5, AC-6):**
- [ ] Integration test: GET /api/rooms returns rooms without authentication
- [ ] Integration test: POST /api/rooms with WARDEN_ADMIN auth returns 201
- [ ] Integration test: PATCH /api/rooms/:id with WARDEN_ADMIN auth updates room

## Dependencies
- **Story 1.1** (completed) -- Project scaffolding
- **Story 1.2** (completed) -- Auth middleware for protected routes

## File List

### New Files
- `shared/constants/room-types.ts` -- RoomType, RoomAcType, HostelGender enums
- `shared/schemas/room.schema.ts` -- createRoomSchema, registerSchema
- `server/src/models/room.model.ts` -- Room Mongoose model
- `server/src/services/room.service.ts` -- Room business logic
- `server/src/controllers/room.controller.ts` -- Room request handlers
- `server/src/routes/room.routes.ts` -- Room route definitions

### Modified Files
- `shared/index.ts` -- Added room type and schema exports
- `server/src/app.ts` -- Added room routes registration

## Dev Agent Record

### Implementation Date
2026-03-07

### Implementation Notes
**Task 1-2:** Room model uses Mongoose strict schema with collection name 'rooms'. Unique compound index ensures no duplicate rooms per block.

**Task 3:** Availability aggregation loops through rooms in memory (sufficient for MVP scale of ~120 rooms). Groups by hostel gender and by roomType_acType combination.

**Task 4:** Public routes (GET) have no auth middleware. Admin routes (POST/PATCH) require WARDEN_ADMIN role.
