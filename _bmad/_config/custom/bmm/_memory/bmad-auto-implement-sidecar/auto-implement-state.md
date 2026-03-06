# Implementation State

## Project

project_name: ""
project_root: ""
sprint_plan_created: false
last_updated: ""

## Epics

(populated on first run)

## Example Schema

```yaml
epics:
  - id: 1
    name: "Epic Name"
    status: pending
    stories:
      - id: 1
        name: "Story Name"
        status: pending
        phases:
          create_story: pending
          dev_story: pending
          claude_review: pending
          codex_review: pending
          reconcile: pending
          fix: pending
          closed: pending
```
