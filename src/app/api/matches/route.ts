import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SaveMatchPayload } from '@/types/match'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('matches')
    .select(`*, match_players(*), profiles(name)`)
    .order('played_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: SaveMatchPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.players?.length || body.winner_seat == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      created_by: user.id,
      winner_seat: body.winner_seat,
      duration_seconds: body.duration_seconds ?? null,
      analysis_explanation: body.analysis_explanation,
    })
    .select()
    .single()

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  const { error: playersError } = await supabase
    .from('match_players')
    .insert(
      body.players.map(p => ({
        match_id: match.id,
        seat: p.seat,
        player_name: p.player_name,
        commander: p.commander || null,
        colors: p.colors,
        deck_raw: p.deck_raw || null,
        score: p.score,
        score_summary: p.score_summary || null,
        life_final: p.life_final ?? null,
      }))
    )

  if (playersError) return NextResponse.json({ error: playersError.message }, { status: 500 })

  return NextResponse.json({ id: match.id }, { status: 201 })
}
