# Epic 8: Room Management & Discovery

Public users can browse hostel rooms with filters (Boys/Girls, AC/Non-AC, Deluxe/Normal), view room photos, live bed availability, and fees. Wardens can manage rooms and users through an admin panel.

### Story 8.1: Room Model & API

As a **developer**,
I want a Room model with classification fields and CRUD API endpoints,
So that rooms can be stored, queried, and managed programmatically.

**Acceptance Criteria:**

**Given** the Room model exists
**When** I inspect the schema
**Then** it has fields: block, floor, roomNumber, hostelGender (BOYS/GIRLS), roomType (DELUXE/NORMAL), acType (AC/NON_AC), totalBeds, occupiedBeds, feePerSemester, photos[], isActive, timestamps

**Given** no authentication
**When** I GET `/api/rooms`
**Then** I receive all active rooms sorted by block/floor/roomNumber

**Given** no authentication
**When** I GET `/api/rooms?hostelGender=BOYS&roomType=DELUXE&acType=AC`
**Then** I receive only rooms matching all three filters

**Given** no authentication
**When** I GET `/api/rooms/availability`
**Then** I receive aggregate availability summary with totalBeds, occupiedBeds, availableBeds, breakdowns byHostel and byType

**Given** I am authenticated as WARDEN_ADMIN
**When** I POST `/api/rooms` with valid room data
**Then** the room is created and returned with 201 status

**Given** I am authenticated as WARDEN_ADMIN
**When** I PATCH `/api/rooms/:id` with occupiedBeds update
**Then** the room's occupiedBeds is updated

**Given** a room already exists with the same block + roomNumber
**When** I POST `/api/rooms` with duplicate block + roomNumber
**Then** the server returns 409 CONFLICT

### Story 8.2: Public Room Browsing Page

As a **public visitor**,
I want to browse available hostel rooms with filters, photos, and fees,
So that I can evaluate accommodation options before registering.

**Acceptance Criteria:**

**Given** I navigate to `/rooms` (no authentication required)
**When** the page loads
**Then** I see a hero section with availability summary cards (total beds, available beds, by hostel) and a filterable grid of room cards

**Given** I am on the rooms page
**When** I select "Boys Hostel" from the hostel filter
**Then** only rooms with hostelGender=BOYS are displayed

**Given** I am on the rooms page
**When** I select "AC Only" from the AC filter
**Then** only rooms with acType=AC are displayed

**Given** a room card is displayed
**When** I inspect it
**Then** I see: room photo (uploaded or type-based default), hostel gender badge (blue for BOYS, pink for GIRLS), AC/Non-AC badge, Deluxe/Normal badge, block + room number, floor, fee per semester in INR, availability bar with "X beds left" text

**Given** a room has 0 beds left
**When** the card renders
**Then** the availability bar is red and shows "Full"

### Story 8.3: Admin Room Management

As a **Warden/Admin**,
I want to manage rooms (create, update occupancy) from the admin panel,
So that I can maintain accurate room inventory and availability.

**Acceptance Criteria:**

**Given** I am authenticated as WARDEN_ADMIN
**When** I navigate to `/warden/rooms`
**Then** I see a list of all rooms with block, room number, type, AC status, hostel, fee, and occupancy controls

**Given** I am on the rooms management page
**When** I click "+ Add Room" and fill in the form (block, floor, room number, hostel, type, AC, beds, fee)
**Then** the room is created and appears in the list

**Given** a room is displayed
**When** I click the "+" button next to occupancy
**Then** occupiedBeds increments by 1 (up to totalBeds maximum)

**Given** a room is displayed with occupiedBeds > 0
**When** I click the "-" button next to occupancy
**Then** occupiedBeds decrements by 1 (minimum 0)

### Story 8.4: Admin User Management

As a **Warden/Admin**,
I want to list, create, and disable user accounts from the admin panel,
So that I can manage hostel residents and staff.

**Acceptance Criteria:**

**Given** I am authenticated as WARDEN_ADMIN
**When** I navigate to `/warden/users`
**Then** I see a list of all users with name, email, role, block/room, and active status

**Given** I am on the users management page
**When** I click "+ Add User" and fill in name, email, password, role, and optional block/room
**Then** the user is created and appears in the list

**Given** a user is active
**When** I click "Disable"
**Then** the user's isActive is set to false, shown as "Disabled" badge

**Given** I try to disable my own account
**When** the request is sent
**Then** it returns 400 "Cannot disable your own account"
