export interface MatchPlayer {
  id: string
  match_id: string
  seat: number
  player_name: string
  commander: string | null
  colors: string[] | null
  deck_raw: string | null
  score: number | null
  score_summary: string | null
  life_final: number | null
}

export interface Match {
  id: string
  created_by: string | null
  played_at: string
  duration_seconds: number | null
  winner_seat: number | null
  analysis_explanation: string | null
  created_at: string
  match_players: MatchPlayer[]
  profiles: { name: string } | null
}

export interface SavedDeck {
  id: string
  name: string
  commander: string | null
  colors: string[] | null
  moxfield_url: string | null
  deck_raw: string
  bracket: number | null
  description: string | null
  estimated_value: number | null
  created_by: string | null
  created_at: string
  profiles: { name: string } | null
  wins?: number
}

export interface SaveMatchPayload {
  winner_seat: number
  duration_seconds?: number
  analysis_explanation: string
  players: Array<{
    seat: number
    player_name: string
    commander: string
    colors: string[]
    deck_raw: string
    score: number
    score_summary: string
    life_final?: number
  }>
}
