import type { ScryfallCard, DeckCard } from '../types/card.js'
import type { DeckParseError } from '../types/deck.js'

const BASE = 'https://api.scryfall.com'
const BATCH_SIZE = 75

export interface FetchDeckResult {
  cards: DeckCard[]
  errors: DeckParseError[]
}

interface CollectionResponse {
  data: ScryfallCard[]
  not_found: { name: string }[]
}

async function fetchCollection(names: string[]): Promise<CollectionResponse> {
  const res = await fetch(`${BASE}/cards/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifiers: names.map(name => ({ name })) }),
  })
  if (!res.ok) throw new Error(`Scryfall collection fetch failed: ${res.status}`)
  return res.json() as Promise<CollectionResponse>
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

  const uniqueNames = [...new Set(parsed.map(p => p.name))]
  const cardMap = new Map<string, ScryfallCard>()
  const notFoundNames = new Set<string>()

  for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + BATCH_SIZE)
    const result = await fetchCollection(batch)
    for (const card of result.data) {
      cardMap.set(card.name.toLowerCase(), card)
    }
    for (const nf of result.not_found) {
      notFoundNames.add(nf.name.toLowerCase())
    }
  }

  const cards: DeckCard[] = []
  const errors: DeckParseError[] = []

  for (const p of parsed) {
    const card = cardMap.get(p.name.toLowerCase())
    if (card) {
      cards.push({ quantity: p.quantity, card })
    } else {
      errors.push({ line: p.raw, reason: `Card not found: ${p.name}` })
    }
  }

  return { cards, errors }
}
