---
id: data-001
title: 'AnalysisReport shared type and typed store'
status: ready
phase: 2
area: data
created: 2026-05-06
complexity: low
agent: gemini
implementer: gemini
tags:
  - status/ready
  - phase/2
  - area/data
files:
  - src/types/analysis.ts
  - src/types/deck.ts
  - src/store/index.ts
  - src/components/analyzer/AnalyzerPanel.tsx
  - src/components/analyzer/BalanceReport.tsx
depends_on: []
related:
  - "[[data-002-deck-parse-errors]]"
  - "[[api-001-analysis-module]]"
---

# data-001 — AnalysisReport shared type and typed store

## Problem

`MatchSession.balanceReport` is typed as `string | null` and stored as serialized JSON. `AnalyzerPanel` uses `any` for the fetched report, and `BalanceReport` defines its own local `Score` interface. There is no shared contract, so any change to the Anthropic response shape silently breaks the UI with no TypeScript error. This must be fixed before analysis features can grow safely.

## Scope

Create `src/types/analysis.ts` with `PlayerScore` and `AnalysisReport` interfaces. Update `MatchSession.balanceReport` to `AnalysisReport | null`. Update the Zustand store `setBalanceReport` action to accept `AnalysisReport` (not a string). Update `AnalyzerPanel` and `BalanceReport` to use the shared type, removing all `any` and the `JSON.stringify` on store write. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/app/api/analyze/route.ts` | Route refactor is api-001 |
| `src/lib/scryfall.ts` | Scryfall layer out of scope |
| `src/components/table/` | Table view out of scope |
| `src/components/deck-loader/` | Deck loader out of scope |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/types/analysis.ts` | Create | `PlayerScore` and `AnalysisReport` interfaces |
| `src/types/deck.ts` | Modify | Change `balanceReport: string \| null` → `AnalysisReport \| null` |
| `src/store/index.ts` | Modify | `setBalanceReport` accepts `AnalysisReport`, no serialization |
| `src/components/analyzer/AnalyzerPanel.tsx` | Modify | Replace `any` state with `AnalysisReport \| null`, remove `JSON.stringify` on store write |
| `src/components/analyzer/BalanceReport.tsx` | Modify | Remove inline `Score` interface, import `PlayerScore` from shared types |

## Implementation notes

### Step 1 — Create `src/types/analysis.ts`

```ts
export interface PlayerScore {
  seat: number
  name: string
  score: number      // integer 0–100
  summary: string    // one-sentence verdict
}

export interface AnalysisReport {
  scores: PlayerScore[]
  explanation: string  // markdown
}
```

### Step 2 — Update `src/types/deck.ts`

Add import and change the `balanceReport` field:

```ts
import type { DeckCard } from './card'
import type { AnalysisReport } from './analysis'

export type PlayerSeat = 1 | 2 | 3 | 4

export interface Player {
  seat: PlayerSeat
  name: string
  deckRaw: string
  cards: DeckCard[]
  loading: boolean
  error: string | null
}

export interface MatchSession {
  players: Player[]
  balanceReport: AnalysisReport | null
}
```

### Step 3 — Update `src/store/index.ts`

Change the action signature and remove the string cast:

```ts
import type { AnalysisReport } from '@/types/analysis'

interface AppState extends MatchSession {
  addPlayer: (seat: PlayerSeat, name: string) => void
  loadDeck: (seat: PlayerSeat, rawText: string) => Promise<void>
  setBalanceReport: (report: AnalysisReport) => void
  reset: () => void
}
```

The setter body remains `set({ balanceReport: report })` — no change needed there.

### Step 4 — Update `src/components/analyzer/AnalyzerPanel.tsx`

```tsx
import type { AnalysisReport } from '@/types/analysis'

// Replace:
const [report, setReport] = useState<null | { scores: any[]; explanation: string }>(null)
// With:
const [report, setReport] = useState<AnalysisReport | null>(null)

// Replace:
setBalanceReport(JSON.stringify(data))
// With:
setBalanceReport(data as AnalysisReport)
```

### Step 5 — Update `src/components/analyzer/BalanceReport.tsx`

```tsx
import type { AnalysisReport, PlayerScore } from '@/types/analysis'

interface ReportProps { report: AnalysisReport }

export default function BalanceReport({ report }: ReportProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {report.scores.map((s: PlayerScore) => (
          // existing JSX unchanged
        ))}
      </div>
      {/* explanation markdown unchanged */}
    </div>
  )
}
```

Remove the old inline `Score` and `ReportProps` type declarations.

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `src/types/analysis.ts` exists and exports `PlayerScore` and `AnalysisReport`
- [ ] `MatchSession.balanceReport` is `AnalysisReport | null`, not `string | null`
- [ ] `useAppStore.setBalanceReport` accepts `AnalysisReport`, not `string`
- [ ] `BalanceReport.tsx` imports `PlayerScore` from shared types — no local `Score` interface
- [ ] `AnalyzerPanel.tsx` state is typed as `AnalysisReport | null` — no `any`
- [ ] Running the app and clicking "Analyze Balance" still renders scores and explanation correctly
