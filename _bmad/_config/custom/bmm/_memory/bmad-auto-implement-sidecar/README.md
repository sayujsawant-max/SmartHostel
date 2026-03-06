# bmad-auto-implement-sidecar

Persistent memory and workflow files for the **Axiom** agent
(Autonomous Implementation Orchestrator).

## Purpose

This sidecar holds all orchestration protocols, state tracking, and workflow
definitions that drive the BMAD development/implementation phase autonomously.

## Files

| File | Purpose |
|---|---|
| `memories.md` | Session history and project notes |
| `instructions.md` | Core orchestration protocols, Codex integration, error handling |
| `auto-implement-state.md` | Live state tracking (epic/story/phase progress) |

## Folders

| Folder | Purpose |
|---|---|
| `workflows/` | Workflow files executed by menu commands |
| `workflows/run-development.md` | Main autonomous execution loop |
| `workflows/preflight.md` | Planning artifact validation |
| `workflows/show-status.md` | Progress display |
| `knowledge/` | Reference data loaded at runtime |
| `knowledge/sub-agent-registry.md` | Registry of all coordinated BMAD sub-agents |

## Runtime Access

After BMAD installation, this folder is accessible at:
`{project-root}/_bmad/_memory/bmad-auto-implement-sidecar/`

## Installation

Copy the parent folder `bmad-auto-implement/` into your BMAD agents directory:
`{project-root}/_bmad/agents/bmad-auto-implement/`

Copy `bmad-auto-implement-sidecar/` into your BMAD memory directory:
`{project-root}/_bmad/_memory/bmad-auto-implement-sidecar/`
