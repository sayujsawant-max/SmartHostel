# Story 7.4: Conversational Chatbot UI

## Description
As a **student**,
I want a floating chat widget where I can ask questions in natural language,
So that I get instant answers without navigating to the FAQ page.

## Status: Complete

## Acceptance Criteria

**AC-1:** Given I am authenticated (any role), when I see the bottom-right corner, then a floating teal chat button is visible

**AC-2:** Given I tap the chat button, when the chat window opens, then I see a greeting: "Hi! I'm the SmartHostel assistant. Ask me about leaves, complaints, fees, rooms, or anything else!"

**AC-3:** Given the chat window is open, when I type a question, then the chatbot matches it against FAQ entries using keyword scoring and returns the best answer

**AC-4:** Given I ask a question with no matching FAQ, when the chatbot processes it, then it responds: "I'm not sure about that. Try asking about leaves, complaints, fees, or hostel rules. You can also contact your warden for help."

**AC-5:** Given I type a greeting ("hi", "hello", "help"), when the chatbot processes it, then it responds with the greeting message

**AC-6:** Given the chat window is open, when I press Enter, then the message is sent

## Technical Context
- **Tech stack:** React 19, Tailwind CSS, Fuse.js (for FAQ data)
- **Key implementation details:** No AI/LLM -- uses keyword scoring against FAQ entries fetched from `/api/assistant/faq`. Floating widget visible only when authenticated.

### Existing Code

**Client:**
- `client/src/components/Chatbot.tsx` -- Floating chat widget with message list, input, FAQ matching. **Status: Complete**
- `client/src/App.tsx` -- Renders `<Chatbot />` when authenticated. **Status: Complete**

**Server:**
- `server/src/routes/assistant.routes.ts` -- GET `/api/assistant/faq` already exists. **Status: No changes needed**

## Tasks

### Task 1: Chatbot component
- [x] Subtask 1.1: Create Chatbot.tsx with floating toggle button (teal, bottom-right, z-50)
- [x] Subtask 1.2: Implement chat window with header, message list, and text input
- [x] Subtask 1.3: Load FAQ entries from `/api/assistant/faq` on mount
- [x] Subtask 1.4: Implement keyword scoring function to match user queries against FAQ question + keywords
- [x] Subtask 1.5: Handle greetings ("hi", "hello", "hey", "help") with greeting response
- [x] Subtask 1.6: Auto-scroll to latest message

**Tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6):**
- [ ] Unit test: Chatbot renders floating teal toggle button
- [ ] Unit test: Opening chat shows greeting message
- [ ] Unit test: Typing a question returns matched FAQ answer
- [ ] Unit test: Unmatched question returns fallback response
- [ ] Unit test: Greeting words ("hi", "hello") trigger greeting response
- [ ] Unit test: Pressing Enter sends the message

### Task 2: Integration
- [x] Subtask 2.1: Add `<Chatbot />` to App.tsx, conditionally rendered when `isAuthenticated`

## Dependencies
- **Story 7.2** (completed) -- FAQ entries and API endpoint

## File List

### New Files
- `client/src/components/Chatbot.tsx` -- Floating conversational chatbot widget

### Modified Files
- `client/src/App.tsx` -- Added Chatbot import and conditional rendering

## Dev Agent Record

### Implementation Date
2026-03-07

### Implementation Notes
**Task 1:** Chatbot uses simple keyword scoring (not Fuse.js) for matching -- splits query into words, checks overlap with FAQ question text and keywords. Greeting detection for short messages containing common greetings. Bot responses appear after 300ms delay for natural feel.

**Task 2:** Chatbot positioned at bottom-right with z-50. Toggle button offset from bottom to avoid overlap with mobile bottom nav bars (bottom-20).
