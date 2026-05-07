---
id: ui-003
title: 'Balance analyzer — Claude deck comparison and explanation panel'
status: ready
phase: 1
area: ui
created: 2026-05-06
complexity: high
agent: gemini
implementer: gemini
tags:
  - status/ready
  - phase/1
  - area/ui
files:
  - src/app/api/analyze/route.ts
  - src/components/analyzer/AnalyzerPanel.tsx
  - src/components/analyzer/BalanceReport.tsx
  - src/app/match/page.tsx
depends_on:
  - ui-002
  - data-001
related:
  - "[[ui-002-match-table]]"
  - "[[data-001-deck-store]]"
---

# ui-003 — Balance analyzer — Claude deck comparison and explanation panel

## Problem

The table view shows what each player has but tells nobody whether the match is fair. The core value of this product is an AI-generated balance report that compares the decks and explains the power differential in plain language.

## Scope

Build a Next.js API route (`/api/analyze`) that sends all player decklists to Claude and returns a structured balance report. Build a panel component that triggers the analysis and renders the result with a per-player power score bar and a markdown explanation. Mount the panel on the `/match` page below the table. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/components/table/` | Table view is owned by ui-002 |
| `src/lib/scryfall.ts` | API layer out of scope |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/app/api/analyze/route.ts` | Create | Server-side Claude call via Anthropic SDK |
| `src/components/analyzer/AnalyzerPanel.tsx` | Create | "Analyze Balance" button + loading state |
| `src/components/analyzer/BalanceReport.tsx` | Create | Renders parsed report (scores + explanation) |
| `src/app/match/page.tsx` | Modify | Add `<AnalyzerPanel>` below `<MatchTable>` |
| `.env.local` | Create (manual) | `ANTHROPIC_API_KEY=sk-ant-...` — not committed |

## Implementation notes

### Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### API route (`src/app/api/analyze/route.ts`)

The route receives a JSON body `{ players: Player[] }` and calls Claude with a structured prompt.

```ts
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import type { Player } from '@/types/deck'

const client = new Anthropic()

function buildPrompt(players: Player[]): string {
  const sections = players.map(p => {
    const cardList = p.cards
      .map(dc => `${dc.quantity}x ${dc.card.name} (CMC ${dc.card.cmc}, ${dc.card.type_line})`)
      .join('\n')
    return `## ${p.name} (Seat ${p.seat})\n${cardList}`
  }).join('\n\n')

  return `You are an expert Magic: The Gathering judge analyzing deck balance for a casual multiplayer match.

${sections}

Analyze these decks and respond with ONLY valid JSON in this exact shape:
{
  "scores": [
    { "seat": 1, "name": "Player1", "score": 75, "summary": "One-sentence verdict" },
    ...
  ],
  "explanation": "2-4 paragraphs of markdown explaining the power differential, key cards driving imbalance, and suggestions for fair play"
}

Scores are integers 0-100. Higher = stronger deck. Be concise and fair.`
}

export async function POST(req: Request) {
  const { players } = (await req.json()) as { players: Player[] }

  if (!players || players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(players) }],
  })

  const text = (message.content[0] as { type: 'text'; text: string }).text
  const result = JSON.parse(text)

  return NextResponse.json(result)
}
```

### AnalyzerPanel (`src/components/analyzer/AnalyzerPanel.tsx`)

```tsx
'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart2 } from 'lucide-react'
import BalanceReport from './BalanceReport'

export default function AnalyzerPanel() {
  const players = useAppStore(s => s.players.filter(p => p.cards.length > 0))
  const setBalanceReport = useAppStore(s => s.setBalanceReport)
  const balanceReport = useAppStore(s => s.balanceReport)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<null | { scores: any[]; explanation: string }>(null)

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setReport(data)
      setBalanceReport(JSON.stringify(data))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          <BarChart2 className="h-5 w-5" /> Balance Analysis
        </h2>
        <Button onClick={analyze} disabled={loading}>
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {loading ? 'Analyzing…' : 'Analyze Balance'}
        </Button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {report && <BalanceReport report={report} />}
    </div>
  )
}
```

### BalanceReport (`src/components/analyzer/BalanceReport.tsx`)

```tsx
import ReactMarkdown from 'react-markdown'

interface Score { seat: number; name: string; score: number; summary: string }
interface ReportProps { report: { scores: Score[]; explanation: string } }

export default function BalanceReport({ report }: ReportProps) {
  return (
    <div className="space-y-4">
      {/* Per-player power bars */}
      <div className="space-y-2">
        {report.scores.map(s => (
          <div key={s.seat} className="space-y-1">
            <div className="flex justify-between text-white text-sm">
              <span>{s.name}</span>
              <span className="font-mono">{s.score}/100</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${s.score}%` }}
              />
            </div>
            <p className="text-white/60 text-xs">{s.summary}</p>
          </div>
        ))}
      </div>

      {/* Explanation markdown */}
      <div className="prose prose-invert prose-sm max-w-none text-white/80">
        <ReactMarkdown>{report.explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
```

Install markdown renderer:
```bash
npm install react-markdown
npm install @tailwindcss/typography
```

Add to `tailwind.config.ts`:
```ts
plugins: [require('@tailwindcss/typography')]
```

### Mount on match page

Add `<AnalyzerPanel />` below `<MatchTable>` in `src/app/match/page.tsx`:

```tsx
return (
  <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-6 space-y-6">
    <MatchTable players={ready} />
    <AnalyzerPanel />
  </main>
)
```

### Environment

Create `.env.local` in the project root (do NOT commit):
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Acceptance criteria

- [ ] `npm run build` completes with no TypeScript errors
- [ ] `ANTHROPIC_API_KEY` is set in `.env.local`
- [ ] Clicking "Analyze Balance" sends decks to Claude and returns a JSON report
- [ ] Per-player power bars animate in with the correct score (0-100)
- [ ] Explanation text renders as formatted markdown
- [ ] Error message appears if the API call fails
- [ ] Analysis panel is visible on the `/match` page below the table
- [ ] `.env.local` is listed in `.gitignore`
