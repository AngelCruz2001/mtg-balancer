import type { ScryfallCard, DeckCard } from '../types/card.js'
import type { DeckParseError } from '../types/deck.js'

const BASE = 'https://api.scryfall.com'

export interface FetchDeckResult {
  cards: DeckCard[]
  errors: DeckParseError[]
}

export async function fetchCard(name: string): Promise<ScryfallCard> {
  const res = await fetch(
    `${BASE}/cards/named?exact=${encodeURIComponent(name)}`
  )
  if (!res.ok) throw new Error(`Card not found: ${name}`)
  return res.json() as Promise<ScryfallCard>
}

// lines: ["4 Lightning Bolt", "1 Sol Ring", ...]
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
