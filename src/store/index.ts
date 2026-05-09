import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, PlayerSeat } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'
import { fetchDeck } from '@/lib/scryfall'

export interface PodDeck {
  name: string
  commander: string
  colors: string[]
  deck_raw: string
}

interface AppState {
  players: Player[]
  balanceReport: AnalysisReport | null
  matchStartAt: number | null
  roomCode: string | null
  addPlayer: (seat: PlayerSeat, name: string) => void
  updatePlayer: (seat: PlayerSeat, patch: Partial<Player>) => void
  loadDeck: (seat: PlayerSeat, raw: string) => Promise<void>
  resolveCard: (seat: PlayerSeat, errorLine: string, correctedLine: string) => Promise<string | null>
  setPlayerCards: (seat: PlayerSeat, cards: import('@/types/card').DeckCard[]) => void
  clearPlayer: (seat: PlayerSeat) => void
  setBalanceReport: (report: AnalysisReport) => void
  setMatchStartAt: (ts: number) => void
  setRoomCode: (code: string | null) => void
  preloadFromPod: (decks: PodDeck[]) => Promise<void>
}

function emptyPlayer(seat: PlayerSeat, name: string): Player {
  return { seat, name, commander: '', colors: [], deckRaw: '', cards: [], parseErrors: [], loading: false, error: null }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      balanceReport: null,
      matchStartAt: null,
      roomCode: null,

      addPlayer: (seat, name) => {
        const existing = get().players.find(p => p.seat === seat)
        if (existing) {
          set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, name } : p) }))
        } else {
          set(s => ({ players: [...s.players, emptyPlayer(seat, name)] }))
        }
      },

      updatePlayer: (seat, patch) => {
        set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, ...patch } : p) }))
      },

      loadDeck: async (seat, raw) => {
        set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, loading: true, error: null, deckRaw: raw } : p) }))
        try {
          const lines = raw.split('\n').filter(l => l.trim())
          const { cards, errors } = await fetchDeck(lines)
          set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, loading: false, cards, parseErrors: errors, deckRaw: raw } : p) }))
        } catch (err) {
          set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, loading: false, error: err instanceof Error ? err.message : 'Failed to load deck' } : p) }))
        }
      },

      resolveCard: async (seat, errorLine, correctedLine) => {
        const match = correctedLine.trim().match(/^(\d+)\s+(.+)$/)
        if (!match) return 'Use format: 1 Card Name'
        const quantity = parseInt(match[1])
        const name = match[2].trim()
        try {
          const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
          if (!res.ok) return 'Card not found'
          const card = await res.json()
          set(s => ({
            players: s.players.map(p =>
              p.seat !== seat ? p : {
                ...p,
                cards: [...p.cards, { quantity, card }],
                parseErrors: p.parseErrors.filter(e => e.line !== errorLine),
              },
            ),
          }))
          return null
        } catch {
          return 'Failed to fetch card'
        }
      },

      setPlayerCards: (seat, cards) => {
        set(s => ({ players: s.players.map(p => p.seat === seat ? { ...p, cards } : p) }))
      },

      clearPlayer: (seat) => {
        set(s => ({ players: s.players.map(p => p.seat === seat ? emptyPlayer(seat, p.name) : p) }))
      },

      setBalanceReport: (report) => set({ balanceReport: report }),
      setMatchStartAt: (ts) => set({ matchStartAt: ts }),
      setRoomCode: (code) => set({ roomCode: code }),

      preloadFromPod: async (decks) => {
        const initial = decks.map((d, i) => ({
          seat: (i + 1) as PlayerSeat,
          name: d.name,
          commander: d.commander,
          colors: d.colors,
          deckRaw: d.deck_raw,
          cards: [],
          parseErrors: [],
          loading: d.deck_raw.trim().length > 0,
          error: null,
        }))
        set({ players: initial, balanceReport: null, matchStartAt: null })
        await Promise.all(
          decks.map((d, i) =>
            d.deck_raw.trim()
              ? get().loadDeck((i + 1) as PlayerSeat, d.deck_raw)
              : Promise.resolve()
          )
        )
      },
    }),
    {
      name: 'mtg-balancer',
      // Reset transient loading/error flags on rehydration so nothing is stuck in a loading state
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.players = state.players.map(p => ({ ...p, loading: false, error: null }))
      },
    },
  ),
)
