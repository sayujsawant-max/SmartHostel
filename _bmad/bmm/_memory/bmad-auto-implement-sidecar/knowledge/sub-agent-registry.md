# Sub-Agent Registry

All BMAD agents coordinated by Axiom during the development phase.

| Agent ID | Purpose | Invocation Point |
|---|---|---|
| `bmad-bmm-sprint-planning` | Creates sprint plan from epics | Once per project, before story loop |
| `bmad-bmm-create-story` | Creates individual story document | Phase 1 of every story |
| `bmad-bmm-dev-story` | Implements the story | Phase 2 of every story |
| `bmad-bmm-code-review` | Claude-based code review | Phase 3 of every story |
| `bmad-bmm-retrospective` | Epic-level retrospective | After all stories in an epic complete |
| `bmad-bmm-generate-project-context` | Updates project context doc | After each epic retrospective |

## Codex Integration

Codex is NOT a BMAD agent. It is invoked via OpenAI API (curl) in Git Bash.
See `instructions.md` → Codex Integration Protocol for full implementation.

Output stored at: `{project-root}/_bmad-output/reviews/codex-review-{epic-id}-{story-id}.json`
