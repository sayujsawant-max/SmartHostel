# SmartHostel — UX Design Summary

## Platform Strategy

Responsive web SPA, no native app. Role-aware breakpoints:

| Surface | Primary Platform | Key Constraint |
|---------|-----------------|----------------|
| Guard scanner | Mobile (low-end Android) | Camera API, poor connectivity, <3s scan-to-result |
| Student pages | Mobile (Android/iOS) | Campus Wi-Fi, QR display clarity |
| Warden dashboard | Desktop/laptop | Multi-column data density, batch operations |
| Maintenance queue | Mobile (basic Android) | Simple list/detail, minimal typing |

**Breakpoints:** Mobile < 640px | Tablet 640-1024px | Desktop >= 1024px

## Role-Specific Shells

### Student Shell
- Bottom tab bar: Status | Actions | FAQ
- Top bar with avatar and notification bell
- Pages: StatusPage, ActionsPage, ShowQRPage, ReportIssuePage, ComplaintDetailPage, FaqPage

### Warden Shell
- Sidebar navigation (desktop), hamburger menu (mobile)
- Pages: DashboardPage, StudentsPage, ComplaintsPage, NoticesPage, RoomsManagePage, UsersManagePage, SettingsPage

### Guard Shell
- No navigation chrome — full-screen scanner only
- Pages: ScanPage (camera viewfinder + verdict overlay)

### Maintenance Shell
- Bottom tab bar: Tasks | History | FAQ
- Pages: TasksPage, HistoryPage, FaqPage

## Core UX Flows

### Flow 1: 3-Second Gate Scan (Guard)
1. Camera active with scan target overlay, direction indicator ("Auto: EXIT/ENTRY")
2. QR detected -> brief pulse animation (<500ms verify)
3. Full-screen verdict: large "ALLOW" (green) or "DENY" (red) with student name + proof line
4. Haptic feedback (short buzz = ALLOW, double buzz = DENY)
5. Auto-returns to scanning after ~1.5s
6. Override button appears only on denial (reason + note required)
7. Offline: amber "OFFLINE — Cannot Verify" — override is the only path through

### Flow 2: Leave Request + QR Pass (Student)
- Timeline-first view: active/recent leaves as status cards
- Create: type selector, date picker, reason template
- Approved: QR code (250x250px min) + passCode fallback + Wake Lock
- Status badges track full lifecycle: Pending -> Approved -> Out -> Completed

### Flow 3: Complaint Timeline + SLA (Student)
- Timeline-first: category icon, title, SLA countdown badge, ownership line
- SLA badge auto-colors: green (on track) -> amber (near breach) -> red (breached)
- Ownership always visible: "Owner: {name} ({role}) - Due: {time}"

### Flow 4: Warden Exception Dashboard
- "Needs Attention Now" section first:
  - Pending leave approvals (count badge)
  - Near-breach complaints (amber, countdown)
  - Breached complaints (red, overdue time)
  - Overrides pending review (orange, reason preview)
  - System health (cron status, scan failures, offline backlog)
- Secondary tabs: all complaints, all leaves, students, notices, settings

### Flow 5: Self-Service Assistant
- Quick-action buttons: My Complaints | My Leaves | Fee Status | Ask a Question
- Responses as structured status cards (not chat paragraphs)
- FAQ search with Fuse.js fuzzy matching, accordion layout
- Floating chatbot widget for conversational access (authenticated users)

## Design Principles

1. **Binary decisions, not judgment calls** — ALLOW or DENY, due or overdue
2. **Timeline first, forms second** — default views show progress
3. **Exceptions surface, normal hides** — dashboards show only deviations
4. **Proof is always one tap away** — attributed, timestamped audit trails
5. **Fast path always available** — scaffolding helps but never blocks
6. **Offline is a visible state, never a hidden failure** — amber, never green
7. **Ownership is always answered** — who owns it, what happens next

## Certainty Checklist

Every page must answer within <2 seconds:
1. **Status** — What is it right now? (badge, color, state)
2. **Owner** — Who is responsible? (name, role)
3. **Next** — What happens next + when? (countdown, action hint)

## Full UX Specification

The complete UX design specification with detailed wireframes, micro-interactions, copy mappings, and emotional design is available at `_bmad-output/planning-artifacts/ux-design-specification.md`.
