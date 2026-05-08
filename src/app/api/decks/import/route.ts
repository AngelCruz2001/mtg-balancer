import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────

interface ImportResult {
  raw: string
  name: string
  commander: string
  colors: string[]
}

async function fromMoxfield(deckId: string): Promise<ImportResult> {
  const res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
    headers: { 'User-Agent': 'mtg-deck-balancer/1.0' },
  })
  if (!res.ok) throw new Error(res.status === 404 ? 'Deck not found or private' : 'Moxfield returned an error')

  const data = await res.json()
  const commanders: Record<string, { quantity: number; card?: { color_identity?: string[] } }> = data.commanders ?? {}
  const mainboard: Record<string, { quantity: number }> = data.mainboard ?? {}

  const lines: string[] = []
  for (const [name, e] of Object.entries(commanders)) lines.push(`${e.quantity} ${name}`)
  for (const [name, e] of Object.entries(mainboard)) lines.push(`${e.quantity} ${name}`)

  return {
    raw: lines.join('\n'),
    name: data.name ?? 'Imported Deck',
    commander: Object.keys(commanders)[0] ?? '',
    colors: Object.values(commanders)[0]?.card?.color_identity ?? [],
  }
}

async function fromArchidekt(deckId: string): Promise<ImportResult> {
  const res = await fetch(`https://archidekt.com/api/decks/${deckId}/`, {
    headers: { 'User-Agent': 'mtg-deck-balancer/1.0', 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error('Archidekt deck not found or private')

  const data = await res.json()

  type ArchidektCard = {
    qty: number
    card: { oracleCard: { name: string; colorIdentity?: string[] } }
    categories: string[]
  }

  const cards: ArchidektCard[] = data.cards ?? []
  const commanderCard = cards.find(c => c.categories?.some((cat: string) => cat.toLowerCase() === 'commander'))
  const lines = cards
    .filter(c => !c.categories?.some((cat: string) => ['sideboard', 'maybeboard'].includes(cat.toLowerCase())))
    .map(c => `${c.qty} ${c.card.oracleCard.name}`)

  return {
    raw: lines.join('\n'),
    name: data.name ?? 'Imported Deck',
    commander: commanderCard?.card.oracleCard.name ?? '',
    colors: commanderCard?.card.oracleCard.colorIdentity ?? [],
  }
}

async function fromTappedOut(slug: string): Promise<ImportResult> {
  // TappedOut plain-text export
  const res = await fetch(`https://tappedout.net/mtg-decks/${slug}/?fmt=txt`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; mtg-deck-balancer/1.0)',
      'Accept': 'text/plain,text/html',
    },
  })
  if (!res.ok) throw new Error('TappedOut deck not found or private')

  const text = await res.text()

  // TXT export is plain "qty CardName" lines; strip section headers like "Sideboard:"
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\s+.+/.test(l))

  // Try to detect commander from "Commander:" section header in the raw text
  const cmdMatch = text.match(/Commander:\s*\n(\d+\s+(.+))/i)
  const commander = cmdMatch ? cmdMatch[2].trim() : ''

  return {
    raw: lines.join('\n'),
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    commander,
    colors: [],
  }
}

// ── Route ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let url: string
  try {
    const body = await req.json()
    url = body.url?.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    let result: ImportResult

    if (url.includes('moxfield.com/decks/')) {
      const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
      if (!match) throw new Error('Invalid Moxfield URL')
      result = await fromMoxfield(match[1])
    } else if (url.includes('archidekt.com/decks/')) {
      const match = url.match(/archidekt\.com\/decks\/(\d+)/)
      if (!match) throw new Error('Invalid Archidekt URL — expected archidekt.com/decks/{id}/...')
      result = await fromArchidekt(match[1])
    } else if (url.includes('tappedout.net/mtg-decks/')) {
      const match = url.match(/tappedout\.net\/mtg-decks\/([a-zA-Z0-9_-]+)/)
      if (!match) throw new Error('Invalid TappedOut URL')
      result = await fromTappedOut(match[1])
    } else {
      return NextResponse.json(
        { error: 'Unsupported URL — paste a link from Moxfield, Archidekt, or TappedOut' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
