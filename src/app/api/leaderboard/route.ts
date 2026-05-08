import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('matches')
    .select('winner_seat, match_players(seat, player_name, score, commander)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type RawMatch = typeof data[0]
  type RawPlayer = RawMatch['match_players'][0]

  const stats: Record<string, {
    matches: number
    wins: number
    totalScore: number
    commanders: string[]
  }> = {}

  for (const match of data) {
    for (const player of (match.match_players as RawPlayer[])) {
      const key = player.player_name
      if (!stats[key]) stats[key] = { matches: 0, wins: 0, totalScore: 0, commanders: [] }
      stats[key].matches++
      if (match.winner_seat != null && player.seat === match.winner_seat) stats[key].wins++
      if (player.score != null) stats[key].totalScore += player.score
      if (player.commander) stats[key].commanders.push(player.commander)
    }
  }

  const leaderboard = Object.entries(stats).map(([player_name, s]) => {
    const commanderFreq: Record<string, number> = {}
    for (const c of s.commanders) commanderFreq[c] = (commanderFreq[c] ?? 0) + 1
    const top_commander = Object.entries(commanderFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return {
      player_name,
      matches: s.matches,
      wins: s.wins,
      win_rate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0,
      avg_score: s.matches > 0 ? Math.round(s.totalScore / s.matches) : 0,
      top_commander,
    }
  }).sort((a, b) => b.wins - a.wins || b.win_rate - a.win_rate || b.avg_score - a.avg_score)

  return NextResponse.json(leaderboard)
}
