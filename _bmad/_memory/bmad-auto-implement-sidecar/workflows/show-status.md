# Workflow: Show Status

**Trigger:** `[ST] Show current epic/story implementation progress`

---

## PURPOSE

Display the current implementation state — which epics and stories are complete,
in-progress, or pending — by reading the state file. Read-only operation.

---

## EXECUTION SEQUENCE

### Step 1: Read State File

Load `{project-root}/_bmad/_memory/bmad-auto-implement-sidecar/auto-implement-state.md`.

If state file does not exist → report: "No implementation state found. Run [PF] then [RD] to begin."

### Step 2: Display Summary

Output the following format:

```
IMPLEMENTATION STATUS — {project_name}
Last updated: {last_updated}
Sprint plan: {created | not yet created}

EPICS:
  Epic {id}: {name} — {status}
    Story {id}: {name} — {status}
      Phases: create:{✓|·} dev:{✓|·} claude-review:{✓|·} codex-review:{✓|·} reconcile:{✓|·} fix:{✓|·} closed:{✓|·}
    Story {id}: {name} — {status}
      ...
  Epic {id}: {name} — {status}
    ...

NEXT ACTION: {description of exactly what will happen when [RD] is invoked}
```

Legend: `✓` = complete, `·` = pending, `→` = in progress

### Step 3: Identify Next Action

Determine and state exactly what `[RD]` will do next:
- If sprint plan not created: "Will create sprint plan first."
- If story in progress: "Will resume Story {id} at phase {phase}."
- If story pending: "Will begin Story {id} of Epic {id}."
- If epic complete, next epic pending: "Will start Epic {id}."
- If all complete: "All epics complete. Nothing to run."
