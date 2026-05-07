---
id: api-003
title: Request and response validation for /api/analyze
status: blocked
phase: 2
area: api
created: 2026-05-06T00:00:00.000Z
complexity: medium
agent: gemini
implementer: gemini
tags:
  - phase/2
  - area/api
  - status/blocked
files:
  - src/app/api/analyze/route.ts
  - src/lib/analysis.ts
depends_on:
  - data-001
  - api-002
related:
<<<<<<< HEAD
  - '[[api-001-analysis-module]]'
=======
  - '[[api-002-analysis-module]]'
>>>>>>> ui-001-impl
  - '[[data-001-analysis-report-type]]'
---

# api-003 — Request and response validation for /api/analyze

## Problem

The `/api/analyze` route accepts arbitrary JSON with no structural validation. A missing or malformed `players` field reaches the prompt builder and may cause a confusing runtime crash rather than a clear 400 error. The response from Anthropic is also parsed without verifying the shape, so a model output change would silently produce a broken report object that the client renders incorrectly.

## Scope

Add runtime request validation to `route.ts` using a plain TypeScript guard (no extra library). Validate that the body contains `players: Player[]` with at least 2 entries and that each player has the expected fields before calling Anthropic. Update `parseAnalysisResponse` in `src/lib/analysis.ts` to validate that the parsed JSON matches the `AnalysisReport` shape (scores array with correct fields, explanation string) and throw a descriptive error if not. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/types/` | Types are defined in data-001 — do not change |
| `src/components/` | UI out of scope |
| `src/store/` | Store out of scope |
| `src/lib/scryfall.ts` | Scryfall layer out of scope |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/app/api/analyze/route.ts` | Modify | Add request body guard before Anthropic call |
| `src/lib/analysis.ts` | Modify | Strengthen `parseAnalysisResponse` shape validation |

## Implementation notes

### Step 1 — Request validation in `route.ts`

Add a type guard `isValidAnalysisRequest` and call it before building the prompt. Do not use Zod or any external schema library — keep it plain TypeScript.

```ts
import type { Player } from '@/types/deck'

function isValidPlayer(p: unknown): p is Player {
  if (typeof p !== 'object' || p === null) return false
  const player = p as Record<string, unknown>
  return (
    typeof player.seat === 'number' &&
    typeof player.name === 'string' &&
    typeof player.deckRaw === 'string' &&
    Array.isArray(player.cards)
  )
}

function isValidAnalysisRequest(body: unknown): body is { players: Player[] } {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return Array.isArray(b.players) && b.players.every(isValidPlayer)
}
```

In the route handler, replace the cast-only parse with the guard:

```ts
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isValidAnalysisRequest(body)) {
    return NextResponse.json(
      { error: 'Request must include players array with at least one valid player' },
      { status: 422 }
    )
  }

  const { players } = body

  if (players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
  }

  // ... rest of handler unchanged
}
```

### Step 2 — Strengthen `parseAnalysisResponse` in `src/lib/analysis.ts`

Replace the minimal shape check with a full field-level validation:

```ts
export function parseAnalysisResponse(text: string): AnalysisReport {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in analysis response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Analysis response contained invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).scores) ||
    typeof (parsed as Record<string, unknown>).explanation !== 'string'
  ) {
    throw new Error('Analysis response missing required "scores" array or "explanation" string')
  }

  const report = parsed as AnalysisReport

  for (const score of report.scores) {
    if (
      typeof score.seat !== 'number' ||
      typeof score.name !== 'string' ||
      typeof score.score !== 'number' ||
      typeof score.summary !== 'string'
    ) {
      throw new Error('Analysis response contains a malformed score entry')
    }
  }

  return report
}
```

## Acceptance criteria

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `POST /api/analyze` with a completely missing body returns HTTP 400
- [ ] `POST /api/analyze` with `{ players: [{ invalid: true }] }` returns HTTP 422
- [ ] `POST /api/analyze` with a single valid player returns HTTP 400 with "Need at least 2 players"
- [ ] A well-formed request with 2 valid players still returns a successful report
- [ ] `parseAnalysisResponse('not json at all')` throws with a message containing "No JSON"
- [ ] `parseAnalysisResponse('{"scores":[],"explanation":123}')` throws with a message about the expected shape
