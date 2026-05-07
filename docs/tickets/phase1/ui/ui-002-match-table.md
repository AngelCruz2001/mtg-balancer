---
id: ui-002
title: 'Match table view — player positions and card display'
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
  - src/app/match/page.tsx
  - src/components/table/MatchTable.tsx
  - src/components/table/PlayerZone.tsx
  - src/components/table/CardGrid.tsx
depends_on:
  - ui-001
related:
  - "[[ui-001-deck-loader]]"
  - "[[data-001-deck-store]]"
---

# ui-002 — Match table view — player positions and card display

## Problem

Once decks are loaded, there is no visual representation of the match. Players need to see their decks laid out as if they were sitting around a table — a core part of the product experience.

## Scope

Build `/match` page with a simulated MTG table layout: seats arranged around a central area, each seat showing the player name, a scrollable card grid with card images, and a simple mana curve bar chart. Include a subtle "felt green" background gradient to evoke a physical play table. **Nothing else.**

## What NOT to change

| Path | Reason |
|---|---|
| `src/app/page.tsx` | Home/loader page is owned by ui-001 |
| `src/lib/` | API layer out of scope |
| `src/store/` | Store shape out of scope |

## File checklist

| File | Action | Notes |
|---|---|---|
| `src/app/match/page.tsx` | Create | Route page, redirects to `/` if no decks loaded |
| `src/components/table/MatchTable.tsx` | Create | Outer layout — positions zones around center |
| `src/components/table/PlayerZone.tsx` | Create | Single player: name, card grid, mana curve |
| `src/components/table/CardGrid.tsx` | Create | Scrollable grid of card images |

## Implementation notes

### Route guard (`src/app/match/page.tsx`)

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import MatchTable from '@/components/table/MatchTable'

export default function MatchPage() {
  const players = useAppStore(s => s.players)
  const router = useRouter()
  const ready = players.filter(p => p.cards.length > 0)

  useEffect(() => {
    if (ready.length < 2) router.replace('/')
  }, [ready.length, router])

  if (ready.length < 2) return null
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-6">
      <MatchTable players={ready} />
    </main>
  )
}
```

### MatchTable layout

Arrange up to 4 player zones using CSS grid:
- 2 players: top + bottom (1 column, 2 rows)
- 3 players: top + bottom-left + bottom-right
- 4 players: 2×2 grid

```tsx
// MatchTable.tsx
import type { Player } from '@/types/deck'
import PlayerZone from './PlayerZone'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MatchTable({ players }: { players: Player[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Match Table</h1>
        <Link href="/"><Button variant="outline" size="sm">← Back to Setup</Button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map(p => <PlayerZone key={p.seat} player={p} />)}
      </div>
    </div>
  )
}
```

### PlayerZone

- Dark semi-transparent card (`bg-black/40 backdrop-blur`)
- Player name as header
- `<CardGrid>` with the player's cards
- Simple inline mana curve: group cards by CMC, render bars with Tailwind heights

```tsx
import type { Player } from '@/types/deck'
import CardGrid from './CardGrid'

export default function PlayerZone({ player }: { player: Player }) {
  // Build mana curve: CMC 0-7+
  const curve = Array(8).fill(0)
  player.cards.forEach(dc => {
    const bucket = Math.min(Math.floor(dc.card.cmc), 7)
    curve[bucket] += dc.quantity
  })
  const maxCount = Math.max(...curve, 1)

  return (
    <div className="rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">{player.name}</h2>
        <span className="text-white/60 text-sm">
          {player.cards.reduce((s, dc) => s + dc.quantity, 0)} cards
        </span>
      </div>

      {/* Mana curve */}
      <div className="flex items-end gap-1 h-12">
        {curve.map((count, cmc) => (
          <div key={cmc} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${(count / maxCount) * 100}%` }}
            />
            <span className="text-white/40 text-xs">{cmc === 7 ? '7+' : cmc}</span>
          </div>
        ))}
      </div>

      <CardGrid cards={player.cards} />
    </div>
  )
}
```

### CardGrid

Scrollable horizontal strip of card images. Show `image_uris.small` (146×204px). Fall back to `card_faces[0].image_uris.small` for double-faced cards.

```tsx
import type { DeckCard } from '@/types/card'
import Image from 'next/image'

function getImageUrl(card: DeckCard['card']): string {
  return (
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small ??
    ''
  )
}

export default function CardGrid({ cards }: { cards: DeckCard[] }) {
  const flat = cards.flatMap(dc => Array(dc.quantity).fill(dc.card))

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
      {flat.map((card, i) => {
        const src = getImageUrl(card)
        if (!src) return null
        return (
          <div key={`${card.id}-${i}`} className="flex-shrink-0 relative w-[60px] h-[84px] rounded overflow-hidden hover:scale-110 transition-transform">
            <Image src={src} alt={card.name} fill className="object-cover" unoptimized />
          </div>
        )
      })}
    </div>
  )
}
```

Add to `next.config.ts`:
```ts
images: { domains: ['cards.scryfall.io'] }
```

## Acceptance criteria

- [ ] `npm run build` completes with no TypeScript errors
- [ ] Navigating to `/match` with 0 or 1 deck loaded redirects to `/`
- [ ] With 2+ decks loaded, player zones render with the correct player names
- [ ] Card images are visible (Scryfall small images)
- [ ] Mana curve bars are visible per player zone
- [ ] Page has a green felt-like background gradient
- [ ] "Back to Setup" link returns to `/`
