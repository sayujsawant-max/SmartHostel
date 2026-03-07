# Story 8.2: Public Room Browsing Page

## Description
As a **public visitor**,
I want to browse available hostel rooms with filters, photos, and fees,
So that I can evaluate accommodation options before registering.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I navigate to `/rooms` (no authentication required), when the page loads, then I see a hero section with availability summary cards and a filterable grid of room cards

**AC-2:** Given I am on the rooms page, when I select "Boys Hostel" from the hostel filter, then only rooms with hostelGender=BOYS are displayed

**AC-3:** Given I am on the rooms page, when I select "AC Only" from the AC filter, then only rooms with acType=AC are displayed

**AC-4:** Given a room card is displayed, when I inspect it, then I see: room photo, hostel gender badge (blue for BOYS, pink for GIRLS), AC/Non-AC badge, Deluxe/Normal badge, block + room number, floor, fee per semester in INR, availability bar with "X beds left" text

**AC-5:** Given a room has 0 beds left, when the card renders, then the availability bar is red and shows "Full"

## Technical Context
- **Tech stack:** React 19, Tailwind CSS
- **Key implementation details:** Uses native fetch (not apiFetch) since rooms API is public. Default room photos by type from Unsplash. Gradient hero background.

### Existing Code

**Client:**
- `client/src/pages/RoomsPage.tsx` -- Full room browsing page with filters, photos, availability. **Status: Complete**
- `client/src/App.tsx` -- `/rooms` route registered as public. **Status: Complete**

## Tasks

### Task 1: Room browsing page
- [x] Subtask 1.1: Create RoomsPage.tsx with hero section and gradient background
- [x] Subtask 1.2: Fetch rooms and availability from public API on mount
- [x] Subtask 1.3: Implement three filter dropdowns (hostel gender, room type, AC type)
- [x] Subtask 1.4: Build room card with photo, badges, fee, and availability bar
- [x] Subtask 1.5: Add availability summary cards at top
- [x] Subtask 1.6: Add navigation links back to login and register

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5):**
- [ ] Unit test: RoomsPage renders hero section and room cards
- [ ] Unit test: Selecting "Boys Hostel" filter shows only BOYS rooms
- [ ] Unit test: Selecting "AC Only" filter shows only AC rooms
- [ ] Unit test: Room card displays photo, badges, fee, and availability bar
- [ ] Unit test: Room with 0 beds shows red "Full" availability bar

### Task 2: Route registration
- [x] Subtask 2.1: Add `/rooms` as public route in App.tsx

**Tests (AC-1):**
- [ ] Integration test: Navigating to /rooms renders RoomsPage without authentication

## Dependencies
- **Story 8.1** (completed) -- Room API endpoints

## File List

### New Files
- `client/src/pages/RoomsPage.tsx` -- Public room browsing page

### Modified Files
- `client/src/App.tsx` -- Added /rooms route

## Dev Agent Record

### Implementation Date
2026-03-07

### Implementation Notes
**Task 1:** Default room photos mapped by roomType_acType key (e.g., DELUXE_AC, NORMAL_NON_AC) using Unsplash URLs. Uploaded photos take priority. Hostel badges use gradient backgrounds (blue for BOYS, pink for GIRLS). Availability bar uses green for available, red for full.
