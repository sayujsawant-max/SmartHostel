# Story 8.3: Admin Room Management

## Description
As a **Warden/Admin**,
I want to manage rooms (create, update occupancy) from the admin panel,
So that I can maintain accurate room inventory and availability.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am authenticated as WARDEN_ADMIN, when I navigate to `/warden/rooms`, then I see a list of all rooms with details and occupancy controls

**AC-2:** Given I am on the rooms management page, when I click "+ Add Room" and fill the form, then the room is created and appears in the list

**AC-3:** Given a room is displayed, when I click "+" next to occupancy, then occupiedBeds increments by 1 (capped at totalBeds)

**AC-4:** Given a room with occupiedBeds > 0, when I click "-" next to occupancy, then occupiedBeds decrements by 1 (minimum 0)

**AC-5:** Given the warden sidebar navigation, when I look at the nav links, then "Rooms" appears between "Notices" and "Settings"

## Technical Context
- **Tech stack:** React 19, Tailwind CSS
- **Architecture rules:** Uses apiFetch for authenticated requests
- **Key implementation details:** Occupancy update uses PATCH /api/rooms/:id with occupiedBeds field

### Existing Code

**Client:**
- `client/src/pages/warden/RoomsManagePage.tsx` -- Room CRUD with occupancy +/- controls. **Status: Complete**
- `client/src/components/layout/WardenShell.tsx` -- Added "Rooms" nav link. **Status: Complete**
- `client/src/App.tsx` -- Added `/warden/rooms` route. **Status: Complete**

## Tasks

### Task 1: Room management page
- [x] Subtask 1.1: Create RoomsManagePage with room list and add form
- [x] Subtask 1.2: Implement "+/- " occupancy controls with PATCH API calls
- [x] Subtask 1.3: Add form validation and error display

**Tests (AC-1, AC-2, AC-3, AC-4):**
- [ ] Unit test: RoomsManagePage renders room list with details and occupancy controls
- [ ] Unit test: Clicking "+ Add Room" and submitting form creates a room
- [ ] Unit test: Clicking "+" increments occupiedBeds (capped at totalBeds)
- [ ] Unit test: Clicking "-" decrements occupiedBeds (minimum 0)

### Task 2: Navigation
- [x] Subtask 2.1: Add "Rooms" to warden sidebar navLinks
- [x] Subtask 2.2: Add route in App.tsx

**Tests (AC-5):**
- [ ] Unit test: WardenShell sidebar includes "Rooms" nav link between "Notices" and "Settings"

## Dependencies
- **Story 8.1** (completed) -- Room API endpoints

## File List

### New Files
- `client/src/pages/warden/RoomsManagePage.tsx` -- Room management page

### Modified Files
- `client/src/components/layout/WardenShell.tsx` -- Added Rooms nav link
- `client/src/App.tsx` -- Added /warden/rooms route

## Dev Agent Record

### Implementation Date
2026-03-07
