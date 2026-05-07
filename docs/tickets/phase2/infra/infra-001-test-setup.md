---
id: infra-001
title: Vitest setup and minimal test coverage for parsing and analysis
status: blocked
phase: 2
area: infra
created: 2026-05-06T00:00:00.000Z
complexity: medium
agent: gemini
implementer: gemini
tags:
  - phase/2
  - area/infra
  - status/blocked
files:
  - vitest.config.ts
  - src/lib/analysis.test.ts
  - src/lib/scryfall.test.ts
depends_on:
  - data-001
  - data-002
  - api-001
related:
  - '[[data-001-analysis-report-type]]'
  - '[[data-002-deck-parse-errors]]'
  - '[[api-001-analysis-module]]'
---

# infra-001 — Vitest setup and minimal test coverage for parsing and analysis

## Problem

There are no tests in the repository. The two most error-prone pieces — deck line parsing and Anthropic response parsing — are pure functions that are easy to unit test but currently run with zero coverage. Any refactor or model output change can silently introduce regressions.

## Scope

Install Vitest. Add a `vitest.config.ts`. Write tests for `parseAnalysisResponse` in `src/lib/analysis.test.ts` and for `fetchDeck`'s line parsing behavior in `src/lib/scryfall.test.ts`. Do not test the Anthropic API or Scryfall network calls — use mocks for those. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/app/` | Route handlers are integration surfaces, not unit test targets |
| `src/components/` | UI component tests out of scope for this ticket |
| `src/store/` | Store tests out of scope for this ticket |

## File checklist

| File | Action | Notes |
|---|---|---|
| `vitest.config.ts` | Create | Vitest config with jsdom environment |
| `src/lib/analysis.test.ts` | Create | Unit tests for `buildAnalysisPrompt` and `parseAnalysisResponse` |
| `src/lib/scryfall.test.ts` | Create | Unit tests for deck line parsing behavior in `fetchDeck` |

## Implementation notes

### Step 1 — Install Vitest

```bash
pnpm add -D vitest @vitest/coverage-v8
```

No `@testing-library` needed — these are pure function tests with no DOM.

### Step 2 — Create `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

### Step 3 — Add test script to `package.json`

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Step 4 — `src/lib/analysis.test.ts`

Test the two exported functions from `src/lib/analysis.ts` (created in api-001).

```ts
import { describe, it, expect } from 'vitest'
import { buildAnalysisPrompt, parseAnalysisResponse } from './analysis'
import type { Player } from '@/types/deck'

const mockPlayer = (seat: number, name: string): Player => ({
  seat: seat as 1 | 2 | 3 | 4,
  name,
  deckRaw: '',
  cards: [
    { quantity: 4, card: { id: 'a', name: 'Lightning Bolt', mana_cost: '{R}', cmc: 1, type_line: 'Instant', colors: ['R'], color_identity: ['R'], prices: { usd: '0.50', eur: null, tix: null }, legalities: {} } },
  ],
  parseErrors: [],
  loading: false,
  error: null,
})

describe('buildAnalysisPrompt', () => {
  it('includes player names and card names', () => {
    const prompt = buildAnalysisPrompt([mockPlayer(1, 'Alice'), mockPlayer(2, 'Bob')])
    expect(prompt).toContain('Alice')
    expect(prompt).toContain('Bob')
    expect(prompt).toContain('Lightning Bolt')
  })

  it('includes JSON shape instruction', () => {
    const prompt = buildAnalysisPrompt([mockPlayer(1, 'Alice'), mockPlayer(2, 'Bob')])
    expect(prompt).toContain('"scores"')
    expect(prompt).toContain('"explanation"')
  })
})

describe('parseAnalysisResponse', () => {
  const validReport = JSON.stringify({
    scores: [
      { seat: 1, name: 'Alice', score: 80, summary: 'Strong aggro deck' },
      { seat: 2, name: 'Bob', score: 60, summary: 'Midrange' },
    ],
    explanation: 'Alice has more efficient spells.',
  })

  it('parses a valid report', () => {
    const report = parseAnalysisResponse(validReport)
    expect(report.scores).toHaveLength(2)
    expect(report.scores[0].name).toBe('Alice')
    expect(report.explanation).toBe('Alice has more efficient spells.')
  })

  it('parses JSON wrapped in markdown code fences', () => {
    const fenced = `\`\`\`json\n${validReport}\n\`\`\``
    const report = parseAnalysisResponse(fenced)
    expect(report.scores).toHaveLength(2)
  })

  it('throws when response has no JSON', () => {
    expect(() => parseAnalysisResponse('Here is my analysis: ...')).toThrow('No JSON')
  })

  it('throws when scores field is missing', () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ explanation: 'text' }))
    ).toThrow()
  })

  it('throws when explanation is not a string', () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ scores: [], explanation: 42 }))
    ).toThrow()
  })
})
```

### Step 5 — `src/lib/scryfall.test.ts`

Test `fetchDeck`'s parsing and error-collection behavior without hitting the network. Mock `fetchCard` so tests are fast and deterministic.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetchCard before importing fetchDeck
vi.mock('./scryfall', async importOriginal => {
  const mod = await importOriginal<typeof import('./scryfall')>()
  return {
    ...mod,
    fetchCard: vi.fn(),
  }
})

import { fetchDeck, fetchCard } from './scryfall'
import type { ScryfallCard } from '@/types/card'

const mockCard = (name: string): ScryfallCard => ({
  id: name,
  name,
  mana_cost: '{1}',
  cmc: 1,
  type_line: 'Instant',
  colors: [],
  color_identity: [],
  prices: { usd: null, eur: null, tix: null },
  legalities: {},
})

beforeEach(() => vi.clearAllMocks())

describe('fetchDeck', () => {
  it('returns resolved cards and no errors for valid lines', async () => {
    vi.mocked(fetchCard).mockResolvedValue(mockCard('Lightning Bolt'))
    const { cards, errors } = await fetchDeck(['4 Lightning Bolt'])
    expect(cards).toHaveLength(1)
    expect(cards[0].quantity).toBe(4)
    expect(errors).toHaveLength(0)
  })

  it('collects errors for failed card lookups and still returns valid cards', async () => {
    vi.mocked(fetchCard)
      .mockResolvedValueOnce(mockCard('Lightning Bolt'))
      .mockRejectedValueOnce(new Error('Card not found: Fake Card'))
    const { cards, errors } = await fetchDeck(['4 Lightning Bolt', '1 Fake Card'])
    expect(cards).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe('1 Fake Card')
    expect(errors[0].reason).toContain('Card not found')
  })

  it('skips blank lines and lines without a leading quantity', async () => {
    vi.mocked(fetchCard).mockResolvedValue(mockCard('Sol Ring'))
    const { cards } = await fetchDeck(['', '  ', '1 Sol Ring', 'No quantity here'])
    expect(cards).toHaveLength(1)
  })
})
```

## Acceptance criteria

- [ ] `pnpm test` runs without errors
- [ ] `pnpm build` still completes with no TypeScript errors after adding Vitest
- [ ] All `analysis.test.ts` cases pass (7 tests)
- [ ] All `scryfall.test.ts` cases pass (3 tests)
- [ ] `fetchCard` is never called during scryfall tests (network mocked)
- [ ] Test files do not import from `src/app/` — tests are limited to lib modules


## Log

> [!danger] Blocked 2026-05-07 — failed 2/2 attempts
> **Error:** git merge --no-ff --no-edit --autostash infra-001-impl
> **Next step:** Human review required

```
git merge --no-ff --no-edit --autostash infra-001-impl
error: short read while indexing .next/server/app-paths-manifest.json
error: short read while indexing .next/server/app-paths-manifest.json
error: short read while indexing .next/server/pages-manifest.json
error: short read while indexing .next/server/pages-manifest.json
error: short read while indexing .next/server/server-reference-manifest.json
error: short read while indexing .next/server/server-reference-manifest.json
warning: in the working copy of '.next/app-build-manifest.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/build-manifest.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/react-loadable-manifest.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/server/app-paths-manifest.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/server/middleware-build-manifest.js', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/server/pages-manifest.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.next/server/server-reference-manifest.json', LF will be replaced by CRLF the next time Git touches it
```
