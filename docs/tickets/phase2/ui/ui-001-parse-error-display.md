---
id: ui-001
title: Show failed card names in deck loader UI
status: in_progress
phase: 2
area: ui
created: 2026-05-06T00:00:00.000Z
complexity: low
agent: gemini
implementer: gemini
tags:
  - phase/2
  - area/ui
  - status/in_progress
files:
  - src/components/deck-loader/PlayerSlot.tsx
depends_on:
  - data-002
related:
  - '[[data-002-deck-parse-errors]]'
---

# ui-001 — Show failed card names in deck loader UI

## Problem

After `data-002`, the store surfaces `player.parseErrors` for any card that failed to resolve, but `PlayerSlot.tsx` does not read or display these errors. Users who paste a typo or an invalid card name get no feedback — the deck silently loads with fewer cards than expected.

## Scope

Update `src/components/deck-loader/PlayerSlot.tsx` to read `player.parseErrors` from the store and render a warning list of failed card lines below the deck textarea when errors are present. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/store/index.ts` | Store shape is owned by data-002 |
| `src/types/deck.ts` | Types are owned by data-002 |
| `src/components/table/` | Table view out of scope |
| `src/components/analyzer/` | Analyzer out of scope |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/components/deck-loader/PlayerSlot.tsx` | Modify | Read `parseErrors` from store and render error list |

## Implementation notes

### Step 1 — Read `parseErrors` from the store

In `PlayerSlot.tsx`, select `parseErrors` from the player in the store. The component already reads `player` from `useAppStore`; extend that selector to include `parseErrors`:

```tsx
const parseErrors = useAppStore(s =>
  s.players.find(p => p.seat === seat)?.parseErrors ?? []
)
```

### Step 2 — Render the error list

Below the existing deck textarea and load button, add a conditional block that maps over `parseErrors`:

```tsx
{parseErrors.length > 0 && (
  <div className="rounded-md bg-yellow-950/60 border border-yellow-600/40 p-3 space-y-1">
    <p className="text-yellow-400 text-xs font-semibold">
      {parseErrors.length} card{parseErrors.length > 1 ? 's' : ''} could not be found:
    </p>
    <ul className="space-y-0.5">
      {parseErrors.map((err, i) => (
        <li key={i} className="text-yellow-300/80 text-xs font-mono">
          {err.line}
        </li>
      ))}
    </ul>
  </div>
)}
```

The `err.reason` message is intentionally not shown in the UI — it is a raw Scryfall error and not user-friendly. Show only the original line so the user knows exactly which entry to fix.

### Notes

- Use the existing yellow/warning color palette consistent with the dark green background theme.
- The warning block should appear only when `parseErrors.length > 0` — no empty placeholder.
- No loading state needed — `parseErrors` is only populated after `loadDeck` completes.

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] Loading a deck with all valid cards shows no error block in `PlayerSlot`
- [ ] Loading a deck that includes one misspelled card name shows the yellow warning block with that line listed
- [ ] The warning block lists the exact original line text (e.g. `1 Lighnting Boltt`), not a generic message
- [ ] The valid cards in the same deck still load and display correctly
- [ ] Warning block disappears when the user re-loads the deck with corrected card names
