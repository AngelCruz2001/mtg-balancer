import type { DeckCard } from './card'
import type { AnalysisReport } from './analysis'

export type PlayerSeat = 1 | 2 | 3 | 4

export interface DeckParseError {
  line: string    // the raw line that failed, e.g. "1 Lighnting Boltt"
  reason: string  // human-readable message, e.g. "Card not found: Lighnting Boltt"
}

export interface Player {
  seat: PlayerSeat
  name: string
  commander: string
  colors: string[]
  deckRaw: string
  cards: DeckCard[]
  parseErrors: DeckParseError[]
  loading: boolean
  error: string | null
}

export interface MatchSession {
  players: Player[]
  balanceReport: AnalysisReport | null
}
