# Workflow: Pre-flight Validation

**Trigger:** `[PF] Validate all required planning artifacts before development`

---

## PURPOSE

Verify all required planning artifacts exist and are non-empty before any
development begins. Halt with a precise diagnostic if anything is missing.

---

## EXECUTION SEQUENCE

### Step 1: Locate Project Root

Read `project_root` from state file. If not set, inspect the current working
directory and look for a `docs/` folder containing BMAD artifacts.

### Step 2: Check Required Artifacts

Check each of the following. For each file: verify it exists AND is non-empty.

| Artifact | Check Path(s) |
|---|---|
| PRD | `{project-root}/docs/prd.md` |
| Architecture | `{project-root}/docs/architecture.md` |
| Epic files | `{project-root}/docs/epics/` — at least one `.md` file |
| Implementation Readiness | `{project-root}/docs/implementation-readiness.md` |

### Step 3: Report Results

**If all present:**
```
PRE-FLIGHT: PASS
  ✓ PRD
  ✓ Architecture
  ✓ Epics ({N} found)
  ✓ Implementation Readiness
Ready to proceed.
```

**If any missing:**
```
PRE-FLIGHT: FAIL
  ✗ {artifact name} — not found at {expected path}
  [list all missing items]
HALTED. Resolve missing artifacts before invoking [RD].
```

Do NOT proceed to development if any check fails.

### Step 4: Validate Epic Structure

For each epic file found in `docs/epics/`:
- Confirm it contains at least one story definition
- Confirm it has a title/name field
- Log any epic files that appear empty or malformed

### Step 5: Update State

If all checks pass:
- Write `project_root` to state file if not already set
- Initialize epic/story list in state from epic files (if state is fresh)
- Log: "Pre-flight complete. {N} epics, {M} total stories queued."
