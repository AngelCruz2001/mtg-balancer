import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MoxfieldEntry {
  quantity: number
  card?: { color_identity?: string[] }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let url: string
  try {
    const body = await req.json()
    url = body.url
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const match = url?.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
  if (!match) {
    return NextResponse.json({ error: 'Invalid Moxfield URL — expected moxfield.com/decks/...' }, { status: 400 })
  }

  const deckId = match[1]

  let data: Record<string, unknown>
  try {
    const res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
      headers: {
        'User-Agent': 'mtg-deck-balancer/1.0 (deck balance tool)',
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? 'Deck not found — make sure it is public' : 'Moxfield returned an error' },
        { status: res.status }
      )
    }
    data = await res.json()
  } catch {
    return NextResponse.json({ error: 'Could not reach Moxfield' }, { status: 502 })
  }

  const commanders = (data.commanders ?? {}) as Record<string, MoxfieldEntry>
  const mainboard = (data.mainboard ?? {}) as Record<string, MoxfieldEntry>
  const name = (data.name as string) ?? 'Imported Deck'

  const lines: string[] = []

  for (const [cardName, entry] of Object.entries(commanders)) {
    lines.push(`${entry.quantity} ${cardName}`)
  }
  for (const [cardName, entry] of Object.entries(mainboard)) {
    lines.push(`${entry.quantity} ${cardName}`)
  }

  const commanderName = Object.keys(commanders)[0] ?? ''
  const colors: string[] = Object.values(commanders)[0]?.card?.color_identity ?? []

  return NextResponse.json({ raw: lines.join('\n'), name, commander: commanderName, colors })
}
