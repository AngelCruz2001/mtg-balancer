---
id: data-001
title: 'AnalysisReport shared type and store contract'
status: ready
phase: 2
area: data
created: 2026-05-06
complexity: low
agent: codex
implementer: codex
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
  - '[[data-002-deck-parse-errors]]'
  - '[[api-001-extract-analysis-module]]'
---

# data-001 — AnalysisReport shared type and store contract

## Problem

The balance report is stored in Zustand as `string | null` and used with loose `any` types in `AnalyzerPanel`. This means the UI, store, and server all speak different languages about the same object. The architecture doc flags this as the first cleanup step before the analysis feature grows.

## Scope

Create `src/types/analysis.ts` with `PlayerScore` and `AnalysisReport` interfaces. Update `MatchSession.balanceReport` in `src/types/deck.ts` from `string | null` to `AnalysisReport | null`. Update the store's `setBalanceReport` action to accept `AnalysisReport` instead of `string`. Update `AnalyzerPanel` and `BalanceReport` to use the typed contract. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/lib/scryfall.ts` | Scryfall client is not in scope |
| `src/app/api/analyze/route.ts` | Route extraction is api-001 |
| `src/app/` (pages) | Page structure unchanged |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/types/analysis.ts` | Create | `PlayerScore` and `AnalysisReport` interfaces |
| `src/types/deck.ts` | Modify | Change `balanceReport: string \| null` to `AnalysisReport \| null` |
| `src/store/index.ts` | Modify | `setBalanceReport` accepts `AnalysisReport`; local state typed |
| `src/components/analyzer/AnalyzerPanel.tsx` | Modify | Replace `any` report state with `AnalysisReport \| null` |
| `src/components/analyzer/BalanceReport.tsx` | Modify | Import `PlayerScore` and `AnalysisReport` from `@/types/analysis` |

## Implementation notes

### 1. Create `src/types/analysis.ts`

```ts
export interface PlayerScore {
  seat: number
  name: string
  score: number
  summary: string
}

export interface AnalysisReport {
  scores: PlayerScore[]
  explanation: string
}
```

### 2. Update `src/types/deck.ts`

Add the import and change the field type:

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
  balanceReport: AnalysisReport | null  // was: string | null
}
```

### 3. Update `src/store/index.ts`

Import `AnalysisReport`, update the action signature, and remove the JSON serialisation in `setBalanceReport`:

```ts
import type { Player, PlayerSeat, MatchSession } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'

interface AppState extends MatchSession {
  addPlayer: (seat: PlayerSeat, name: string) => void
  loadDeck: (seat: PlayerSeat, rawText: string) => Promise<void>
  setBalanceReport: (report: AnalysisReport) => void  // was: (report: string)
  reset: () => void
}
```

`setBalanceReport` implementation stays the same — only the type changes:

```ts
setBalanceReport: report => set({ balanceReport: report }),
```

### 4. Update `src/components/analyzer/AnalyzerPanel.tsx`

Replace the local `report` state type and the `setBalanceReport` call:

```tsx
import type { AnalysisReport } from '@/types/analysis'

// inside component:
const [report, setReport] = useState<AnalysisReport | null>(null)

// in analyze():
const data: AnalysisReport = await res.json()
setReport(data)
setBalanceReport(data)  // no longer JSON.stringify — pass the object directly
```

Remove the `balanceReport` string read from the store if it was only used for local hydration — the component manages its own `report` state.

### 5. Update `src/components/analyzer/BalanceReport.tsx`

Replace the inline `Score` and `ReportProps` interfaces with imports:

```tsx
import type { AnalysisReport } from '@/types/analysis'

interface ReportProps { report: AnalysisReport }

export default function BalanceReport({ report }: ReportProps) {
  // body unchanged
}
```

Remove the local `Score` interface — `PlayerScore` from the shared type covers it.

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `src/types/analysis.ts` exports `PlayerScore` and `AnalysisReport`
- [ ] `MatchSession.balanceReport` is `AnalysisReport | null` — not `string | null`
- [ ] `useAppStore.setBalanceReport` accepts `AnalysisReport` — not `string`
- [ ] `AnalyzerPanel` has no `any` types for the report state
- [ ] `BalanceReport` imports its prop types from `@/types/analysis`
