# Ticket folder structure

All tickets follow this convention. Any tool or agent creating tickets must follow it.

## Folder layout

```
docs/tickets/
  _template.md          ← Obsidian Templater source, skipped by orchestrator
  _structure.md         ← This file, skipped by orchestrator
  phase{N}/
    {area}/
      {area}-NNN-slug.md
```

**Examples:**
```
phase2/ui/ui-001-phase-graph-visualization.md
phase2/ui/ui-002-live-agent-panel.md
phase2/agents/agents-001-claude-model-routing.md
phase3/auth/auth-001-jwt-refresh.md
```

## Naming rules

| Field | Rule |
|---|---|
| Folder | `phase{N}` — no dash, no space |
| Area | lowercase, no spaces (`ui`, `agents`, `auth`, `api`, `data`, `infra`) |
| ID | `{area}-NNN` — three-digit zero-padded, scoped per area folder |
| Filename | `{id}-{slug}.md` — slug is lowercase words joined by hyphens, max 40 chars |

## Frontmatter required fields

```yaml
id: ui-001           # area-NNN
title: ''            # human-readable title
status: draft        # draft | ready | in_progress | done | blocked
phase: 2
area: ui
created: 2026-04-25
complexity: low      # low | medium | high  (drives model routing)
agent: claude        # claude | gemini | codex | copilot | manual
implementer: claude
tags:
  - status/draft
  - phase/2
  - area/ui
files: []            # exact file paths relative to repo root
depends_on: []       # IDs that must be done before this ticket runs
related: []          # Obsidian wiki links — MUST use full filename [[ui-002-live-agent-panel]]
```

## Ordering and dependencies

The orchestrator picks tickets alphabetically and skips any ticket where a `depends_on` ID is not yet `done`. This means:
- Tickets within an area run in NNN order automatically
- Cross-area dependencies must be declared in `depends_on`
- `related` is for Obsidian graph links only — it has no effect on execution order

## Obsidian wiki links

Always use the full filename (without extension) in `related`:

```yaml
# CORRECT — resolves to ui-002-live-agent-panel.md
related:
  - "[[ui-002-live-agent-panel]]"

# WRONG — creates phantom node, file not found
related:
  - "[[ui-002]]"
```

## Complexity → model mapping

| complexity | Claude model dispatched |
|---|---|
| low | claude-haiku-4-5-20251001 |
| medium | claude-sonnet-4-6 |
| high | claude-opus-4-7 |
