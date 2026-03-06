# Workflow: Run Development

**Trigger:** `[RD] Start or resume the full autonomous development phase`

---

## MANDATORY EXECUTION RULES

- Read the complete state file before any action
- Never skip a phase within a story
- Write state after every completed phase
- Never ask the user for information that can be read from a file
- Report blockers immediately with exact cause — then halt

---

## EXECUTION SEQUENCE

### Step 1: Read State

Load `{project-root}/_bmad/_memory/bmad-auto-implement-sidecar/auto-implement-state.md`.

If state file does not exist → this is a fresh project start. Initialize state from epic files.

### Step 2: Pre-flight Validation

Execute the preflight workflow:
`{project-root}/_bmad/_memory/bmad-auto-implement-sidecar/workflows/preflight.md`

If pre-flight fails → halt. Do not proceed until all artifacts are present.

### Step 3: Sprint Planning (One-Time)

Check `sprint_plan_created` in state file.

If `false`:
- Invoke `bmad-bmm-sprint-planning`
- Write sprint plan to `{project-root}/_bmad-output/sprint-plan.md`
- Update state: `sprint_plan_created: true`
- Log: "Sprint plan created."

If `true`:
- Log: "Sprint plan already exists. Skipping."

### Step 4: Epic & Story Loop

For each epic where `status != complete`:
  Set epic `status: in_progress`. Write state.
  Log: "Starting Epic {id}: {name}"

  For each story in epic where `status != complete`:
    Set story `status: in_progress`. Write state.
    Log: "Starting Story {id}: {name}"

    Execute Phase 1: Create Story
    - Invoke `bmad-bmm-create-story`
    - Provide epic file and story requirements as context
    - Confirm story document written to disk
    - Update state: `create_story: complete`. Write state.
    - Log: "Story {id} — create_story: complete"

    Execute Phase 2: Develop Story
    - Invoke `bmad-bmm-dev-story`
    - Provide story document as context
    - Confirm implementation complete and code changes exist
    - Update state: `dev_story: complete`. Write state.
    - Log: "Story {id} — dev_story: complete"

    Execute Phase 3: Claude Code Review
    - Invoke `bmad-bmm-code-review`
    - Provide story document and list of changed files
    - Save review output to `{project-root}/_bmad-output/reviews/claude-review-{epic-id}-{story-id}.md`
    - Update state: `claude_review: complete`. Write state.
    - Log: "Story {id} — claude_review: complete"

    Execute Phase 4: Codex Review
    - Get git diff of changed files since story start
    - Call OpenAI API (see instructions.md — Codex Integration Protocol)
    - Save output to `{project-root}/_bmad-output/reviews/codex-review-{epic-id}-{story-id}.json`
    - If API call fails: log warning, mark `codex_review: skipped`, flag for manual review
    - Else: Update state: `codex_review: complete`. Write state.
    - Log: "Story {id} — codex_review: complete"

    Execute Phase 5: Reconcile Reviews
    - Read `claude-review-{epic-id}-{story-id}.md`
    - Read `codex-review-{epic-id}-{story-id}.json`
    - Merge findings, de-duplicate, sort by severity (critical > major > minor)
    - Write unified list to `{project-root}/_bmad-output/reviews/reconciled-{epic-id}-{story-id}.md`
    - Update state: `reconcile: complete`. Write state.
    - Log: "Story {id} — reconcile: complete. {N} findings (C:{critical} M:{major} m:{minor})"

    Execute Phase 6: Fix All Issues
    - Read `reconciled-{epic-id}-{story-id}.md`
    - Instruct Claude Code to fix all findings in priority order
    - Verify each fix, do not introduce regressions
    - Update state: `fix: complete`. Write state.
    - Log: "Story {id} — fix: complete"

    Execute Phase 7: Close Story
    - Commit all changes via Git Bash: `git add -A && git commit -m "feat: complete story {id} - {name}"`
    - Update state: story `status: complete`, `closed: complete`. Write state.
    - Log: "Story {id}: COMPLETE ✓"

  End story loop.

  All stories complete for epic → Execute Epic Lifecycle:

  - Invoke `bmad-bmm-retrospective` for the epic
    - Provide epic file and all story documents as context
    - Save retrospective output to `{project-root}/_bmad-output/retrospective-epic-{id}.md`

  - Review retrospective findings. Apply any fixes via Claude Code.
  - Commit fixes: `git commit -m "fix: epic {id} retrospective fixes"`

  - Invoke `bmad-bmm-generate-project-context`
    - Update project context at `{project-root}/docs/project-context.md`

  - Update state: epic `status: complete`. Write state.
  - Log: "Epic {id}: COMPLETE ✓"

End epic loop.

### Step 5: Project Complete

All epics `status: complete`:
- Log: "All epics complete. Development phase finished."
- Update memories.md with completion record
- Report final summary to user
