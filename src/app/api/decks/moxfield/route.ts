import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MoxfieldEntry {
  quantity: number
  card?: {
    name?: string
    color_identity?: string[]
  }
}

async function fetchMoxfieldDeck(deckId: string) {
  const res = await fetch(`https://api2.moxfield.com/v2/decks/all/${deckId}/`, {
    headers: {
      'User-Agent': 'mtg-deck-balancer/1.0 (deck balance tool)',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''

    if (res.status === 404) {
      return { error: 'Deck not found — make sure it is public', status: 404 as const }
    }

    if (res.status === 403 && contentType.includes('text/html')) {
      return { error: 'Moxfield blocked this server request (403 / Cloudflare)', status: 502 as const }
    }

    return { error: `Moxfield returned ${res.status}`, status: 502 as const }
  }

  return { data: await res.json() }
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

  const match = url?.match(/moxfield\.com\/decks\/([^/?#]+)/i)
  if (!match) {
    return NextResponse.json({ error: 'Invalid Moxfield URL — expected moxfield.com/decks/...' }, { status: 400 })
  }

  const deckId = match[1]

  let data: Record<string, unknown>
  try {
    const result = await fetchMoxfieldDeck(deckId)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    data = result.data as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Could not reach Moxfield' }, { status: 502 })
  }

  const commanders = (data.commanders ?? {}) as Record<string, MoxfieldEntry>
  const mainboard = (data.mainboard ?? {}) as Record<string, MoxfieldEntry>
  const name = (data.name as string) ?? 'Imported Deck'

  const lines: string[] = []

  for (const [cardName, entry] of Object.entries(commanders)) {
    lines.push(`${entry.quantity} ${entry.card?.name ?? cardName}`)
  }
  for (const [cardName, entry] of Object.entries(mainboard)) {
    lines.push(`${entry.quantity} ${entry.card?.name ?? cardName}`)
  }

  const firstCommander = Object.entries(commanders)[0]
  const commanderName = firstCommander?.[1]?.card?.name ?? firstCommander?.[0] ?? ''
  const colors: string[] = firstCommander?.[1]?.card?.color_identity ?? []

  return NextResponse.json({ raw: lines.join('\n'), name, commander: commanderName, colors })
}
