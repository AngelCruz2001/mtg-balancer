---
id: data-002
title: Structured deck validation with per-card error reporting
status: in_progress
phase: 2
area: data
created: 2026-05-06T00:00:00.000Z
complexity: medium
agent: gemini
implementer: gemini
tags:
  - phase/2
  - area/data
  - status/in_progress
files:
  - src/lib/scryfall.ts
  - src/types/deck.ts
  - src/store/index.ts
depends_on:
  - data-001
related:
  - '[[data-001-analysis-report-type]]'
  - '[[ui-001-parse-error-display]]'
---

# data-002 — Structured deck validation with per-card error reporting

## Problem

`fetchDeck` in `src/lib/scryfall.ts` silently drops any card that fails to resolve. The caller (the Zustand store `loadDeck` action) has no way to tell the user which card names were rejected or why. Users paste typos or misspelled card names and receive no feedback, making the deck loader unreliable in practice.

## Scope

Add a `DeckParseError` type to `src/types/deck.ts`. Refactor `fetchDeck` to return `{ cards: DeckCard[], errors: DeckParseError[] }` instead of `DeckCard[]`. Add a `parseErrors` field to the `Player` type. Update the `loadDeck` store action to store parse errors on the player. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/app/api/analyze/route.ts` | Route out of scope |
| `src/types/analysis.ts` | Analysis types out of scope |
| `src/components/` | UI changes are ui-001 |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/types/deck.ts` | Modify | Add `DeckParseError`, add `parseErrors` field to `Player` |
| `src/lib/scryfall.ts` | Modify | `fetchDeck` returns `{ cards, errors }` |
| `src/store/index.ts` | Modify | `loadDeck` stores `parseErrors` on the player |

## Implementation notes

### Step 1 — Add `DeckParseError` and update `Player` in `src/types/deck.ts`

```ts
export interface DeckParseError {
  line: string    // the raw line that failed, e.g. "1 Lighnting Boltt"
  reason: string  // human-readable message, e.g. "Card not found: Lighnting Boltt"
}

export interface Player {
  seat: PlayerSeat
  name: string
  deckRaw: string
  cards: DeckCard[]
  parseErrors: DeckParseError[]  // new field — empty array when no errors
  loading: boolean
  error: string | null
}
```

Update `MatchSession` default — no type change needed, but `Player` has a new required field so every place that constructs a `Player` object must add `parseErrors: []`.

### Step 2 — Refactor `fetchDeck` in `src/lib/scryfall.ts`

Change the return type and collect errors from rejected `Promise.allSettled` results:

```ts
import type { ScryfallCard, DeckCard } from '../types/card.js'
import type { DeckParseError } from '../types/deck.js'

export interface FetchDeckResult {
  cards: DeckCard[]
  errors: DeckParseError[]
}

export async function fetchDeck(lines: string[]): Promise<FetchDeckResult> {
  const parsed = lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const match = l.match(/^(\d+)\s+(.+)$/)
      return match ? { quantity: parseInt(match[1]), name: match[2], raw: l } : null
    })
    .filter(Boolean) as { quantity: number; name: string; raw: string }[]

  const results = await Promise.allSettled(
    parsed.map(p => fetchCard(p.name).then(card => ({ quantity: p.quantity, card, raw: p.raw })))
  )

  const cards: DeckCard[] = []
  const errors: DeckParseError[] = []

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      cards.push({ quantity: r.value.quantity, card: r.value.card })
    } else {
      errors.push({
        line: parsed[i].raw,
        reason: r.reason instanceof Error ? r.reason.message : String(r.reason),
      })
    }
  }

  return { cards, errors }
}
```

Note: `fetchCard` is unchanged. Only `fetchDeck` return type changes.

### Step 3 — Update `src/store/index.ts`

Update `loadDeck` to destructure the new return value and store `parseErrors` on the player.

Add `parseErrors: []` to the player object created in `addPlayer`:

```ts
addPlayer: (seat, name) =>
  set(s => ({
    players: [
      ...s.players.filter(p => p.seat !== seat),
      { seat, name, deckRaw: '', cards: [], parseErrors: [], loading: false, error: null },
    ],
  })),
```

Update `loadDeck` success branch:

```ts
const { cards, errors } = await fetchDeck(lines)
set(s => ({
  players: s.players.map(p =>
    p.seat === seat ? { ...p, cards, parseErrors: errors, loading: false } : p
  ),
}))
```

Also clear `parseErrors` when setting `loading: true` at the start of `loadDeck`:

```ts
set(s => ({
  players: s.players.map(p =>
    p.seat === seat
      ? { ...p, deckRaw: rawText, loading: true, error: null, parseErrors: [] }
      : p
  ),
}))
```

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `fetchDeck(['4 Lightning Bolt', '1 Fake Card XYZ'])` returns `{ cards: [{ quantity: 4, ... }], errors: [{ line: '1 Fake Card XYZ', reason: '...' }] }`
- [ ] `Player.parseErrors` is typed as `DeckParseError[]` and is never `undefined`
- [ ] Calling `loadDeck` with a valid decklist sets `parseErrors: []`
- [ ] Calling `loadDeck` with one bad card name results in that card appearing in `player.parseErrors`
- [ ] No existing cards are dropped from `player.cards` when one card fails
