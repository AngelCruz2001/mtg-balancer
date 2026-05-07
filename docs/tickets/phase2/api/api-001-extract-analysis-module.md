---
id: api-001
title: 'Extract Anthropic analysis logic into src/lib/analysis.ts'
status: ready
phase: 2
area: api
created: 2026-05-06
complexity: medium
agent: codex
implementer: codex
tags:
  - status/ready
  - phase/2
  - area/api
files:
  - src/lib/analysis.ts
  - src/app/api/analyze/route.ts
depends_on:
  - data-001
related:
  - '[[data-001-analysis-report-type]]'
  - '[[api-002-analyze-route-validation]]'
---

# api-001 — Extract Anthropic analysis logic into src/lib/analysis.ts

## Problem

`src/app/api/analyze/route.ts` currently mixes four distinct concerns: prompt construction, Anthropic SDK invocation, JSON extraction, and response parsing. The architecture doc explicitly calls this out as debt: "route handlers should orchestrate work, not become dumping grounds for parsing, prompts, and business rules." As analysis complexity grows, this file becomes a liability.

## Scope

Create `src/lib/analysis.ts` with three exported functions: `buildPrompt`, `parseAnalysisResponse`, and `runAnalysis`. Move all Anthropic-related code into that module. Rewrite `src/app/api/analyze/route.ts` to be a thin orchestrator that delegates to `runAnalysis`. The Anthropic client must not be instantiated anywhere other than `src/lib/analysis.ts`. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/lib/scryfall.ts` | Scryfall client is separate |
| `src/components/` | No UI changes in this ticket |
| `src/types/` | Types are defined by data-001 |
| `src/store/` | Store is not affected |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/lib/analysis.ts` | Create | `buildPrompt`, `parseAnalysisResponse`, `runAnalysis` |
| `src/app/api/analyze/route.ts` | Modify | Thin orchestrator — delegates to `runAnalysis` |

## Implementation notes

### Prerequisite

data-001 must be done. `src/types/analysis.ts` must export `AnalysisReport`.

### 1. Create `src/lib/analysis.ts`

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Player } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export function buildPrompt(players: Player[]): string {
  const sections = players
    .map(p => {
      const cardList = p.cards
        .map(dc => `${dc.quantity}x ${dc.card.name} (CMC ${dc.card.cmc}, ${dc.card.type_line})`)
        .join('\n')
      return `## ${p.name} (Seat ${p.seat})\n${cardList}`
    })
    .join('\n\n')

  return `You are an expert Magic: The Gathering judge analyzing deck balance for a casual multiplayer match.

${sections}

Analyze these decks and respond with ONLY valid JSON in this exact shape:
{
  "scores": [
    { "seat": 1, "name": "Player1", "score": 75, "summary": "One-sentence verdict" }
  ],
  "explanation": "2-4 paragraphs of markdown explaining the power differential, key cards driving imbalance, and suggestions for fair play"
}

Scores are integers 0-100. Higher = stronger deck. Be concise and fair.`
}

export function parseAnalysisResponse(text: string): AnalysisReport {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const jsonString = jsonMatch ? jsonMatch[0] : text
  return JSON.parse(jsonString) as AnalysisReport
}

export async function runAnalysis(players: Player[]): Promise<AnalysisReport> {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(players) }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic')
  }

  return parseAnalysisResponse(content.text)
}
```

Key points:
- `buildPrompt` and `parseAnalysisResponse` are pure functions with no I/O — easy to unit test.
- `runAnalysis` is the single function that touches the Anthropic SDK.
- The Anthropic client is a module-level singleton. Do not pass it as a parameter.

### 2. Rewrite `src/app/api/analyze/route.ts`

The route becomes a thin layer: validate minimum input, call `runAnalysis`, return the result.

```ts
import { NextResponse } from 'next/server'
import type { Player } from '@/types/deck'
import { runAnalysis } from '@/lib/analysis'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { players?: Player[] }

    if (!body.players || body.players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
    }

    const report = await runAnalysis(body.players)
    return NextResponse.json(report)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

The route no longer imports `Anthropic` directly.

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `src/lib/analysis.ts` exists and exports `buildPrompt`, `parseAnalysisResponse`, `runAnalysis`
- [ ] `src/app/api/analyze/route.ts` does not import `@anthropic-ai/sdk` directly
- [ ] `buildPrompt` and `parseAnalysisResponse` are pure functions (no Anthropic client, no I/O)
- [ ] The existing analysis feature still works end-to-end (button → scores rendered)
