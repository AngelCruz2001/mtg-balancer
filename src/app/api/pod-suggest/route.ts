import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ]
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let deckIds: string[]
  try {
    const body = await req.json()
    deckIds = body.deck_ids
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!Array.isArray(deckIds) || deckIds.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 decks' }, { status: 422 })
  }

  // Fetch selected decks
  const { data: decks, error: deckErr } = await supabase
    .from('decks')
    .select('id, name, commander, colors, deck_raw')
    .in('id', deckIds)

  if (deckErr) return NextResponse.json({ error: deckErr.message }, { status: 500 })

  // Fetch historical avg score per commander from past matches
  const { data: history } = await supabase
    .from('match_players')
    .select('commander, score')
    .not('score', 'is', null)
    .not('commander', 'is', null)

  const commanderAvg: Record<string, { total: number; count: number }> = {}
  for (const h of history ?? []) {
    if (!h.commander) continue
    if (!commanderAvg[h.commander]) commanderAvg[h.commander] = { total: 0, count: 0 }
    commanderAvg[h.commander].total += h.score!
    commanderAvg[h.commander].count++
  }

  type ScoredDeck = typeof decks[0] & { powerScore: number | null }

  const scored: ScoredDeck[] = decks.map(d => {
    const hist = d.commander ? commanderAvg[d.commander] : null
    return { ...d, powerScore: hist ? Math.round(hist.total / hist.count) : null }
  })

  const podSize = Math.min(4, scored.length)
  const combos = combinations(scored, podSize)

  type PodResult = {
    decks: ScoredDeck[]
    spread: number | null
    hasHistory: boolean
    balanceScore: number
  }

  const results: PodResult[] = combos.map(combo => {
    const known = combo.filter(d => d.powerScore != null)
    if (known.length < 2) {
      return { decks: combo, spread: null, hasHistory: false, balanceScore: 999 }
    }
    const scores = known.map(d => d.powerScore!)
    const spread = Math.max(...scores) - Math.min(...scores)
    return { decks: combo, spread, hasHistory: true, balanceScore: spread }
  })

  results.sort((a, b) => a.balanceScore - b.balanceScore)

  return NextResponse.json(results.slice(0, 5).map(r => ({
    decks: r.decks.map(d => ({
      id: d.id,
      name: d.name,
      commander: d.commander,
      colors: d.colors,
      deck_raw: d.deck_raw,
      power_score: d.powerScore,
    })),
    spread: r.spread,
    has_history: r.hasHistory,
  })))
}
