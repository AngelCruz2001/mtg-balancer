import type { ScryfallCard, DeckCard } from '../types/card.js'

const BASE = 'https://api.scryfall.com'

export async function fetchCard(name: string): Promise<ScryfallCard> {
  const res = await fetch(
    `${BASE}/cards/named?exact=${encodeURIComponent(name)}`
  )
  if (!res.ok) throw new Error(`Card not found: ${name}`)
  return res.json() as Promise<ScryfallCard>
}

// lines: ["4 Lightning Bolt", "1 Sol Ring", ...]
export async function fetchDeck(lines: string[]): Promise<DeckCard[]> {
  const parsed = lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const match = l.match(/^(\d+)\s+(.+)$/)
      return match ? { quantity: parseInt(match[1]), name: match[2] } : null
    })
    .filter(Boolean) as { quantity: number; name: string }[]

  const results = await Promise.allSettled(
    parsed.map(p => fetchCard(p.name).then(card => ({ quantity: p.quantity, card })))
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<DeckCard>).value)
}
