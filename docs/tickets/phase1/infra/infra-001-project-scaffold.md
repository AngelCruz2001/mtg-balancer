---
id: infra-001
title: Project scaffold — Next.js + Shadcn + Tailwind + Zustand
status: in_progress
phase: 1
area: infra
created: 2026-05-06T00:00:00.000Z
complexity: medium
agent: gemini
implementer: claude
tags:
  - phase/1
  - area/infra
  - status/in_progress
files:
  - package.json
  - next.config.ts
  - tailwind.config.ts
  - components.json
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/lib/utils.ts
  - src/store/index.ts
depends_on: []
related: []
---

# infra-001 — Project scaffold — Next.js + Shadcn + Tailwind + Zustand

## Problem

There is no project yet. Before any feature can be built, a working Next.js application with the agreed-upon stack must exist, buildable with zero errors.

## Scope

Bootstrap a Next.js 15 app (App Router) with TypeScript, Shadcn UI, Tailwind CSS v4, and Zustand. The app renders a placeholder home page that confirms the stack is wired up. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `orchestrator-clone/` | This folder is for tickets only, not implementation |

## File checklist

| File | Action | Notes |
|---|---|---|
| `package.json` | Create | Dependencies listed below |
| `next.config.ts` | Create | Minimal config, no special rewrites |
| `tailwind.config.ts` | Create | Content paths for src/ |
| `components.json` | Create | Shadcn config — style: default, baseColor: slate |
| `src/app/layout.tsx` | Create | Root layout with `<html>` + `<body>`, Inter font |
| `src/app/page.tsx` | Create | Placeholder heading: "MTG Deck Balancer" |
| `src/app/globals.css` | Create | Tailwind directives + Shadcn CSS variables |
| `src/lib/utils.ts` | Create | Shadcn `cn()` helper |
| `src/store/index.ts` | Create | Empty Zustand store skeleton (will be filled by data-001) |

## Implementation notes

### 1. Bootstrap

```bash
npx create-next-app@latest mtg-deck-balancer \
  --typescript --tailwind --app --src-dir --import-alias "@/*" \
  --no-eslint
cd mtg-deck-balancer
```

### 2. Add Shadcn

```bash
npx shadcn@latest init
# When prompted:
#   Style: Default
#   Base color: Slate
#   CSS variables: Yes
```

### 3. Add Zustand

```bash
npm install zustand
```

### 4. Zustand skeleton (`src/store/index.ts`)

```ts
import { create } from 'zustand'

export interface AppState {
  // populated by data-001
}

export const useAppStore = create<AppState>()(() => ({}))
```

### 5. Verify

```bash
npm run build   # must complete with 0 errors
npm run dev     # home page renders "MTG Deck Balancer"
```

## Acceptance criteria

- [ ] `npm run build` completes with no TypeScript errors
- [ ] `npm run dev` renders a page with the text "MTG Deck Balancer"
- [ ] `cn()` utility is importable from `@/lib/utils`
- [ ] Zustand `useAppStore` is importable from `@/store`
- [ ] `components.json` is present and valid (Shadcn can add components without re-init)


## Log

> [!danger] Blocked 2026-05-07 — failed 2/2 attempts
> **Error:** Agent made no file changes.
> **Next step:** Human review required

```
Agent made no file changes.
```
