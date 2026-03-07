# Epic 7: Self-Service Assistant & FAQ

Students can check complaint/leave/fee status via quick-action shortcuts, search FAQs with fuzzy matching, and receive contextual next-action suggestions.

### Story 7.1: Status Shortcuts & Structured Card Responses

As a **student**,
I want to check my complaint, leave, and fee status via quick-action shortcuts,
So that I can get instant answers without visiting the warden's office.

**Acceptance Criteria:**

**Given** I am a STUDENT on /student/status
**When** I see the AssistantShortcuts component (pinned at top)
**Then** I see quick-action buttons: "My Complaints" / "My Leaves" / "Fee Status" / "Ask a Question"

**Given** I tap "My Complaints"
**When** the query returns
**Then** I see a card list (top 3 active complaints) with status badge, SLABadge, ownership line, and "View all →" link — NOT a chat-style text response

**Given** I tap "My Leaves"
**When** the query returns
**Then** I see a card list (top 3 recent leaves) with status badge, dates, and "View all →" link

**Given** I tap "Fee Status"
**When** the query returns
**Then** I see read-only fee status cards from seeded fee data

**Given** there are no active items for a shortcut
**When** the query returns empty
**Then** I see: "No active complaints. [Report an Issue]" or "No active leaves. [Request Leave]"

**Given** the API fails
**When** the error is returned
**Then** I see: "Couldn't load status. [Retry] or check the main page."

### Story 7.2: FAQ Search with Fuzzy Matching

As a **user** (any role),
I want to search hostel FAQs with fuzzy text matching,
So that I can find answers to common questions without asking staff.

**Acceptance Criteria:**

**Given** I am on the FAQ page (/student/faq, /maintenance/faq, or accessible from any role)
**When** the page loads
**Then** I see FAQ entries organized by category in an accordion layout

**Given** I type a search query
**When** Fuse.js processes it client-side against the fetched FAQ list
**Then** I see matching FAQ entries ranked by relevance, with title + answer preview + "Read more"

**Given** I search for a typo or partial match (e.g., "plumbin" for "plumbing")
**When** Fuse.js fuzzy matching processes it
**Then** relevant results still appear (fuzzy threshold configured for helpful matching)

**Given** my search returns no matches
**When** the results are empty
**Then** I see: "No matching answer found. Try rephrasing or contact your warden."

**Given** FAQ data
**When** the page loads
**Then** FAQ entries are fetched from GET `/api/assistant/faq` and cached client-side in the Fuse.js index (no server round-trip per keystroke)

### Story 7.3: Contextual Next-Action Suggestions

As a **student**,
I want the system to suggest what I can do next after checking status,
So that I know my options without memorizing the system.

**Acceptance Criteria:**

**Given** I view a complaint with status OPEN
**When** the status card renders
**Then** a next-action hint appears: "Waiting for assignment. You'll be notified when someone is on it."

**Given** I view a leave with status APPROVED
**When** the status card renders
**Then** a next-action hint appears: "Your pass is ready. [Show QR at Gate]"

**Given** I view a leave with status REJECTED
**When** the status card renders
**Then** a next-action hint appears: "Rejected. You can [Request a New Leave] with updated details."

**Given** I have no active leaves or complaints
**When** the assistant shortcuts return empty
**Then** suggestions appear: "Need something? [Request Leave] or [Report an Issue]"

**Given** I use an FAQ shortcut
**When** the FAQ answer is displayed
**Then** if the FAQ references a specific action (e.g., "how to request leave"), a direct link to that action page is included

### Story 7.4: Conversational Chatbot UI

As a **student**,
I want a floating chat widget where I can ask questions in natural language,
So that I get instant answers without navigating to the FAQ page.

**Acceptance Criteria:**

**Given** I am authenticated (any role)
**When** I see the bottom-right corner of the screen
**Then** a floating chat button (teal circle with chat icon) is visible

**Given** I tap the chat button
**When** the chat window opens
**Then** I see a greeting message: "Hi! I'm the SmartHostel assistant. Ask me about leaves, complaints, fees, rooms, or anything else!"

**Given** the chat window is open
**When** I type a question (e.g., "how do I request leave?")
**Then** the chatbot matches it against FAQ entries using keyword scoring and returns the best matching answer

**Given** I ask a question with no matching FAQ
**When** the chatbot cannot find a match
**Then** it responds: "I'm not sure about that. Try asking about leaves, complaints, fees, or hostel rules. You can also contact your warden for help."

**Given** I type a greeting ("hi", "hello", "help")
**When** the chatbot processes it
**Then** it responds with the greeting message

**Given** the chat window is open
**When** I press Enter in the input field
**Then** the message is sent (same as clicking the send button)
