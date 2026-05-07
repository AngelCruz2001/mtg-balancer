import type { AnalysisReport } from './analysis'
import type { DeckCard } from './card'

export type PlayerSeat = 1 | 2 | 3 | 4

export interface Player {
  seat: PlayerSeat
  name: string
  deckRaw: string
  cards: DeckCard[]
  loading: boolean
  error: string | null
}

export interface MatchSession {
  players: Player[]
  balanceReport: AnalysisReport | null
}
