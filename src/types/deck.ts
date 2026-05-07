import type { DeckCard } from './card'

export type PlayerSeat = 1 | 2 | 3 | 4

export interface Player {
  seat: PlayerSeat
  name: string
  deckRaw: string        // raw decklist text pasted by user
  cards: DeckCard[]      // resolved by Scryfall
  loading: boolean
  error: string | null
}

export interface MatchSession {
  players: Player[]
  balanceReport: string | null  // filled by ui-003 Claude analysis
}
