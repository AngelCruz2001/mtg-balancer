---
id: data-001
title: Deck data model and Zustand store
status: in_progress
phase: 1
area: data
created: 2026-05-06T00:00:00.000Z
complexity: medium
agent: gemini
implementer: gemini
tags:
  - phase/1
  - area/data
  - status/in_progress
files:
  - src/types/deck.ts
  - src/store/index.ts
depends_on:
  - infra-001
  - api-001
related:
  - '[[infra-001-project-scaffold]]'
  - '[[api-001-scryfall-service]]'
---

# data-001 — Deck data model and Zustand store

## Problem

There is no shared state for the match session. The deck loader, table view, and balancer panel all need to read and write the same player/deck data. Without a central store, components would need to prop-drill or re-fetch independently.

## Scope

Define `Player` and `MatchSession` types, then implement the Zustand store with actions for: adding players, loading a deck for a player, and resetting the session. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/app/` | UI is out of scope for this ticket |
| `src/lib/scryfall.ts` | API service is owned by api-001 |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/types/deck.ts` | Create | `Player`, `MatchSession` types |
| `src/store/index.ts` | Modify | Fill in the skeleton from infra-001 |

## Implementation notes

### Types (`src/types/deck.ts`)

```ts
import type { DeckCard } from './card'

export type PlayerSeat = 1 | 2 | 3 | 4

export interface Player {
  seat: PlayerSeat
  name: string
  deckRaw: string        // raw decklist text pasted by user
  cards: DeckCard[]      // resolved by Scryfall
  loading: boolean
  error: string | null
}

export interface MatchSession {
  players: Player[]
  balanceReport: string | null  // filled by ui-003 Claude analysis
}
```

### Store (`src/store/index.ts`)

```ts
import { create } from 'zustand'
import type { Player, PlayerSeat, MatchSession } from '@/types/deck'
import { fetchDeck } from '@/lib/scryfall'

interface AppState extends MatchSession {
  addPlayer: (seat: PlayerSeat, name: string) => void
  loadDeck: (seat: PlayerSeat, rawText: string) => Promise<void>
  setBalanceReport: (report: string) => void
  reset: () => void
}

const defaultSession: MatchSession = {
  players: [],
  balanceReport: null,
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...defaultSession,

  addPlayer: (seat, name) =>
    set(s => ({
      players: [
        ...s.players.filter(p => p.seat !== seat),
        { seat, name, deckRaw: '', cards: [], loading: false, error: null },
      ],
    })),

  loadDeck: async (seat, rawText) => {
    set(s => ({
      players: s.players.map(p =>
        p.seat === seat ? { ...p, deckRaw: rawText, loading: true, error: null } : p
      ),
    }))
    try {
      const lines = rawText.split('\n')
      const cards = await fetchDeck(lines)
      set(s => ({
        players: s.players.map(p =>
          p.seat === seat ? { ...p, cards, loading: false } : p
        ),
      }))
    } catch (e) {
      set(s => ({
        players: s.players.map(p =>
          p.seat === seat
            ? { ...p, loading: false, error: (e as Error).message }
            : p
        ),
      }))
    }
  },

  setBalanceReport: report => set({ balanceReport: report }),

  reset: () => set(defaultSession),
}))
```

### Notes

- `players` is an array not a map so seat order is preserved for the table layout.
- `addPlayer` replaces an existing player at the same seat (idempotent — safe to call again if user re-assigns a seat).
- `loadDeck` is async; set `loading: true` before the fetch so the UI can show a spinner.

## Acceptance criteria

- [ ] `npm run build` completes with no TypeScript errors
- [ ] `useAppStore.getState().addPlayer(1, 'Alice')` adds a player at seat 1
- [ ] Calling `loadDeck(1, '4 Lightning Bolt\n1 Sol Ring')` sets `loading: true` then resolves with `cards.length >= 1`
- [ ] `reset()` clears all players and `balanceReport`
- [ ] No circular import between `src/store` and `src/lib/scryfall`


## Log

> [!danger] Blocked 2026-05-07 — failed 2/2 attempts
> **Error:** Agent made no file changes.
> **Next step:** Human review required

```
Agent made no file changes.
```
