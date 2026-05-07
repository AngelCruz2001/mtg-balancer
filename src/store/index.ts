import { create } from 'zustand'
import { fetchDeck } from '@/lib/scryfall'
import type { AnalysisReport } from '@/types/analysis'
import type { MatchSession, PlayerSeat } from '@/types/deck'

interface AppState extends MatchSession {
  addPlayer: (seat: PlayerSeat, name: string) => void
  loadDeck: (seat: PlayerSeat, rawText: string) => Promise<void>
  setBalanceReport: (report: AnalysisReport) => void
  reset: () => void
}

const defaultSession: MatchSession = {
  players: [],
  balanceReport: null,
}

export const useAppStore = create<AppState>()(set => ({
  ...defaultSession,

  addPlayer: (seat, name) =>
    set(s => ({
      players: [
        ...s.players.filter(p => p.seat !== seat),
        { seat, name, deckRaw: '', cards: [], loading: false, error: null },
      ],
    })),

  loadDeck: async (seat, rawText) => {
    set(s => ({
      players: s.players.map(p =>
        p.seat === seat ? { ...p, deckRaw: rawText, loading: true, error: null } : p
      ),
    }))

    try {
      const lines = rawText.split('\n')
      const cards = await fetchDeck(lines)

      set(s => ({
        players: s.players.map(p =>
          p.seat === seat ? { ...p, cards, loading: false } : p
        ),
      }))
    } catch (e) {
      set(s => ({
        players: s.players.map(p =>
          p.seat === seat
            ? { ...p, loading: false, error: (e as Error).message }
            : p
        ),
      }))
    }
  },

  setBalanceReport: report => set({ balanceReport: report }),

  reset: () => set(defaultSession),
}))
